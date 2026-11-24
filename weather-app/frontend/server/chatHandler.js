/**
 * Endpoint POST /api/chat: la puerta de entrada del chat.
 *
 * Recibe { message, history?, lang? } y responde { reply, sources, grounded, usage }.
 * Antes de llamar a la IA hace los controles de seguridad, en este orden:
 * método, origen, tipo de contenido, límite por IP, clave configurada y validación.
 *
 * Los errores devuelven solo un código ({ error: 'RATE_LIMITED' }, etc.);
 * el detalle se registra en el servidor, nunca se envía al navegador.
 */
import { randomUUID } from 'node:crypto';
import { AgentError, DEFAULT_MODEL, findUngroundedFigures, runAgent } from './agent.js';
import { createWeatherTools } from './weatherTools.js';

export const REQUEST_LIMITS = {
  maxBodyBytes: 16 * 1024, // tamaño máximo del JSON recibido
  maxMessageLength: 500, // caracteres de la pregunta
  maxHistoryMessages: 10, // mensajes anteriores enviados como contexto
  maxHistoryTextLength: 2000, // caracteres por mensaje anterior
  totalTimeMs: 40_000, // por debajo del maxDuration de vercel.json (60 s)
};

/** 15 preguntas cada 10 minutos por IP. */
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, maxRequests: 15 };

// ---------------------------------------------------------------------------
// Límite por IP
// ---------------------------------------------------------------------------

/**
 * Límite de peticiones por IP en memoria. En Vercel cada instancia tiene su
 * propia memoria, así que es una protección "de mejor esfuerzo": el tope real
 * lo pone la cuota gratuita de Gemini (sin tarjeta, el abuso no genera cobros).
 */
export const createRateLimiter = ({ windowMs, maxRequests, now = Date.now }) => {
  const hits = new Map(); // ip → { count, resetAt }
  return {
    check(key) {
      const time = now();
      let entry = hits.get(key);
      if (!entry || entry.resetAt <= time) {
        if (hits.size > 5000) hits.clear(); // evita que la memoria crezca sin límite
        entry = { count: 0, resetAt: time + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      return { allowed: entry.count <= maxRequests, retryAfterSeconds: Math.ceil((entry.resetAt - time) / 1000) };
    },
  };
};

// ---------------------------------------------------------------------------
// Validación de lo que envía el navegador (todo dato del cliente es no confiable)
// ---------------------------------------------------------------------------

class RequestError extends Error {
  constructor(status, code = 'INVALID_REQUEST') {
    super(code);
    this.status = status;
    this.code = code;
  }
}

/** Lee el cuerpo sin pasar del tamaño máximo, aunque el cliente mienta en Content-Length. */
const readJsonBody = async (request) => {
  if (Number(request.headers.get('content-length')) > REQUEST_LIMITS.maxBodyBytes) throw new RequestError(413);
  if (!request.body) throw new RequestError(400);

  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
    size += chunk.value.byteLength;
    if (size > REQUEST_LIMITS.maxBodyBytes) {
      await reader.cancel();
      throw new RequestError(413);
    }
    chunks.push(chunk.value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new RequestError(400);
  }
};

/** Devuelve solo los campos conocidos, ya validados: { message, lang, history }. */
export const parseChatBody = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RequestError(400);

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > REQUEST_LIMITS.maxMessageLength) throw new RequestError(400);

  const lang = body.lang === 'es' ? 'es' : 'en'; // inglés por defecto, como la app

  if (body.history !== undefined && !Array.isArray(body.history)) throw new RequestError(400);
  const history = (body.history ?? []).slice(-REQUEST_LIMITS.maxHistoryMessages).map((item) => {
    const text = typeof item?.text === 'string' ? item.text.trim() : '';
    const validRole = item?.role === 'user' || item?.role === 'assistant';
    if (!validRole || !text || text.length > REQUEST_LIMITS.maxHistoryTextLength) throw new RequestError(400);
    return { role: item.role, text };
  });

  return { message, lang, history };
};

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });

/** Convierte un error en una respuesta segura: solo un código, el detalle va al log. */
const errorResponse = (error, logger) => {
  if (error instanceof RequestError) return json(error.status, { error: error.code });
  if (error instanceof AgentError) {
    if (error.reason === 'quota') return json(503, { error: 'AI_BUSY' });
    if (error.reason === 'auth') {
      logger.error('[chat] Gemini rechazó la clave: revisa GEMINI_API_KEY.');
      return json(503, { error: 'CHAT_UNAVAILABLE' });
    }
    logger.error(`[chat] ${error.message}`);
    return json(error.reason === 'timeout' ? 504 : 502, { error: 'CHAT_FAILED' });
  }
  logger.error('[chat] Error inesperado:', error?.message);
  return json(500, { error: 'CHAT_FAILED' });
};

/** Los navegadores envían Origin en los POST: solo se aceptan del mismo sitio. */
const isSameOrigin = (request) => {
  const origin = request.headers.get('origin');
  if (!origin) return true; // curl o scripts: el límite por IP sigue aplicando
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
};

/** En Vercel, x-real-ip y x-forwarded-for los pone la plataforma con la IP real. */
const clientIp = (request) =>
  request.headers.get('x-real-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';

// ---------------------------------------------------------------------------
// El manejador
// ---------------------------------------------------------------------------

/**
 * Crea el manejador. Todo se puede inyectar para probarlo sin internet.
 * @param {object} options
 * @param {string} [options.apiKey] - clave de Gemini (variable GEMINI_API_KEY).
 * @param {string} [options.model] - modelo de Gemini (variable GEMINI_MODEL).
 * @returns {(request: Request) => Promise<Response>}
 */
export const createChatHandler = ({
  apiKey,
  model,
  fetchImpl = globalThis.fetch,
  rateLimiter = createRateLimiter(RATE_LIMIT),
  logger = console,
  now = Date.now,
} = {}) => {
  // El nombre del modelo va en la URL de Google: solo se aceptan nombres con formato válido
  const modelName = /^[a-z0-9][a-z0-9.-]{0,63}$/i.test(model ?? '') ? model : DEFAULT_MODEL;

  return async function handleChat(request) {
    const startedAt = now();

    if (request.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED' }, { allow: 'POST' });
    if (!isSameOrigin(request)) return json(403, { error: 'FORBIDDEN' });
    if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
      return json(415, { error: 'INVALID_REQUEST' });
    }

    const limit = rateLimiter.check(clientIp(request));
    if (!limit.allowed) return json(429, { error: 'RATE_LIMITED' }, { 'retry-after': String(limit.retryAfterSeconds) });

    if (!apiKey) {
      logger.error('[chat] Falta la variable de entorno GEMINI_API_KEY.');
      return json(503, { error: 'CHAT_UNAVAILABLE' });
    }

    try {
      const input = parseChatBody(await readJsonBody(request));
      const result = await runAgent({
        ...input,
        apiKey,
        model: modelName,
        tools: createWeatherTools({ fetchImpl, lang: input.lang }),
        fetchImpl,
        deadline: startedAt + REQUEST_LIMITS.totalTimeMs,
        now,
      });
      const grounded = findUngroundedFigures(result.reply, result.sources).length === 0;

      // Log de observabilidad: sin el texto del usuario ni su IP
      logger.info(
        JSON.stringify({
          event: 'chat_request',
          requestId: randomUUID(),
          model: modelName,
          latencyMs: now() - startedAt,
          rounds: result.usage.rounds,
          tools: result.toolNames,
          totalTokens: result.usage.totalTokens,
          grounded,
        })
      );

      return json(200, { reply: result.reply, sources: result.sources, grounded, usage: result.usage });
    } catch (error) {
      return errorResponse(error, logger);
    }
  };
};
