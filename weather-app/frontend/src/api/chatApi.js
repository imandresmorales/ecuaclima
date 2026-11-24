import axios from 'axios';

/**
 * Cliente del asistente con IA (POST /api/chat).
 *
 * El navegador nunca habla con Gemini ni conoce la clave: solo envía la
 * pregunta a la función del servidor, que es la que tiene la clave.
 */

/* global __CHAT_ENABLED__ -- lo define vite.config.js en tiempo de build */
export const chatEnabled = __CHAT_ENABLED__;

const CHAT_URL = '/api/chat';
// El servidor tiene hasta 60 s; el cliente espera un poco menos que eso
const TIMEOUT_MS = 50000;

/** Códigos de error que el servidor puede devolver y la interfaz sabe traducir. */
const KNOWN_ERRORS = ['INVALID_REQUEST', 'RATE_LIMITED', 'AI_BUSY', 'CHAT_UNAVAILABLE', 'CHAT_FAILED'];
const SOURCE_TYPES = ['current', 'forecast', 'provinces'];

/** Error del chat con un código estable que la interfaz traduce. */
export class ChatError extends Error {
  constructor(code, cause) {
    super(code, { cause });
    this.name = 'ChatError';
    this.code = code;
  }
}

/**
 * Envía una pregunta al asistente.
 * @param {{ message: string, history: {role: 'user'|'assistant', text: string}[], lang: 'es'|'en' }} input
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ reply: string, sources: object[], grounded: boolean, usage: object }>}
 */
export const sendChatMessage = async ({ message, history, lang }, { signal } = {}) => {
  let data;
  try {
    ({ data } = await axios.post(CHAT_URL, { message, history, lang }, { timeout: TIMEOUT_MS, signal }));
  } catch (error) {
    if (axios.isCancel(error)) throw error;
    const code = error.response?.data?.error;
    throw new ChatError(KNOWN_ERRORS.includes(code) ? code : 'CHAT_FAILED', error);
  }

  if (typeof data?.reply !== 'string' || !data.reply.trim()) throw new ChatError('CHAT_FAILED');

  return {
    reply: data.reply,
    // Solo se muestran tipos de datos conocidos
    sources: Array.isArray(data.sources) ? data.sources.filter((s) => SOURCE_TYPES.includes(s?.type)) : [],
    grounded: data.grounded !== false,
    usage: data.usage && typeof data.usage === 'object' ? data.usage : null,
  };
};
