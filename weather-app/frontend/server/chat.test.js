// @vitest-environment node
/**
 * Pruebas del chat sin internet: un fetch falso responde como Gemini (con una
 * cola de respuestas preparadas) y como Open-Meteo (con datos fijos).
 */
import { describe, it, expect, vi } from 'vitest';
import { createChatHandler, createRateLimiter, parseChatBody, REQUEST_LIMITS } from './chatHandler.js';
import { AGENT_LIMITS, findUngroundedFigures } from './agent.js';
import { createWeatherTools, REGIONS } from './weatherTools.js';
import { ecuadorData } from '../src/data/ecuadorData.js';

const API_KEY = 'test-key-123';
const ORIGIN = 'https://ecuaclima.test';

// ---------------------------------------------------------------------------
// Datos falsos
// ---------------------------------------------------------------------------

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** Gemini responde con texto final. */
const geminiText = (text, tokens = 100) => ({
  candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP' }],
  usageMetadata: { totalTokenCount: tokens },
});

/** Gemini pide una herramienta. */
const geminiCall = (name, args, tokens = 50) => ({
  candidates: [{ content: { role: 'model', parts: [{ functionCall: { name, args } }] }, finishReason: 'STOP' }],
  usageMetadata: { totalTokenCount: tokens },
});

const GEOCODING = {
  results: [
    { name: 'Montañita', admin1: 'Santa Elena', country_code: 'EC', latitude: -1.83, longitude: -80.75 },
    { name: 'Montañita', admin1: 'Otro país', country_code: 'CO', latitude: 1.5, longitude: -75.4 },
  ],
};

const CURRENT = {
  current: {
    time: '2026-11-24T16:00',
    temperature_2m: 28.8,
    apparent_temperature: 36.4,
    relative_humidity_2m: 90,
    precipitation: 0.4,
    wind_speed_10m: 3.3,
    weather_code: 81,
  },
};

const FORECAST = {
  daily: {
    time: ['2026-11-24', '2026-11-25'],
    temperature_2m_max: [20.7, 22.6],
    temperature_2m_min: [9.7, 10.6],
    precipitation_probability_max: [100, 90],
    precipitation_sum: [5.3, 14.8],
    weather_code: [80, 95],
  },
};

/** Varias coordenadas: una temperatura distinta por ubicación (10, 11, 12...). */
const manyLocations = (url) => {
  const count = url.searchParams.get('latitude').split(',').length;
  const list = Array.from({ length: count }, (_, i) => ({ current: { temperature_2m: 10 + i, weather_code: 3 } }));
  return count === 1 ? list[0] : list;
};

const createFakeFetch = (geminiQueue = [], { openMeteoFails = false } = {}) => {
  const geminiRequests = [];
  const openMeteoUrls = [];

  const fetchImpl = vi.fn(async (input, init = {}) => {
    const url = new URL(String(input));
    if (url.hostname === 'generativelanguage.googleapis.com') {
      geminiRequests.push({ url: url.toString(), headers: init.headers, body: JSON.parse(init.body) });
      const next = geminiQueue.shift();
      if (next === undefined) throw new Error('Llamada inesperada a Gemini');
      return typeof next === 'function' ? next() : jsonResponse(next);
    }

    openMeteoUrls.push(url);
    if (openMeteoFails) return jsonResponse({ error: true }, 500);
    if (url.hostname === 'geocoding-api.open-meteo.com') return jsonResponse(GEOCODING);
    if (url.searchParams.has('daily')) return jsonResponse(FORECAST);
    if (url.searchParams.get('current') === 'temperature_2m,weather_code') return jsonResponse(manyLocations(url));
    return jsonResponse(CURRENT);
  });

  return { fetchImpl, geminiRequests, openMeteoUrls };
};

const setup = (geminiQueue = [], { openMeteoFails, ...handlerOptions } = {}) => {
  const fake = createFakeFetch(geminiQueue, { openMeteoFails });
  const logger = { info: vi.fn(), error: vi.fn() };
  const handler = createChatHandler({ apiKey: API_KEY, fetchImpl: fake.fetchImpl, logger, ...handlerOptions });
  return { ...fake, logger, handler };
};

const send = async (handler, payload, { headers = {}, method = 'POST' } = {}) => {
  const response = await handler(
    new Request(`${ORIGIN}/api/chat`, {
      method,
      headers: { 'content-type': 'application/json', origin: ORIGIN, 'x-real-ip': '1.2.3.4', ...headers },
      body: method === 'POST' ? (typeof payload === 'string' ? payload : JSON.stringify(payload)) : undefined,
    })
  );
  return { response, body: await response.json() };
};

/** Lo que el servidor le devolvió a Gemini como resultado de la última herramienta. */
const lastToolResult = (geminiRequests, index) =>
  geminiRequests[index].body.contents.at(-1).parts[0].functionResponse;

// ---------------------------------------------------------------------------
// Flujo completo
// ---------------------------------------------------------------------------

describe('POST /api/chat: flujo con herramientas', () => {
  it('responde con 2 consultas a Gemini: pide la herramienta y luego responde', async () => {
    const { handler, geminiRequests, logger } = setup([
      geminiCall('get_current_weather', { city: 'samborondon' }),
      geminiText('En Samborondón hay 28.8 °C, sensación de 36.4 °C y 90 % de humedad.', 120),
    ]);

    const { response, body } = await send(handler, { message: '¿Temperatura de Samborondón?', lang: 'es' });

    expect(response.status).toBe(200);
    expect(body.grounded).toBe(true);
    expect(body.usage).toEqual({ rounds: 2, toolCalls: 1, totalTokens: 170 });
    expect(body.sources).toEqual([expect.objectContaining({ type: 'current', place: 'Samborondón', temperature: 28.8 })]);

    // Gemini recibió los datos con el nombre correcto de la ciudad
    const toolResult = lastToolResult(geminiRequests, 1);
    expect(toolResult).toMatchObject({ name: 'get_current_weather', response: { city: 'Samborondón', province: 'Guayas' } });

    // El log de observabilidad no incluye el texto del usuario
    const logLine = logger.info.mock.calls[0][0];
    expect(JSON.parse(logLine)).toMatchObject({ event: 'chat_request', rounds: 2, tools: ['get_current_weather'] });
    expect(logLine).not.toContain('Samborondón?');
  });

  it('envía la clave en una cabecera, nunca en la URL ni en la respuesta', async () => {
    const { handler, geminiRequests } = setup([geminiText('Hola')]);
    const { body } = await send(handler, { message: 'Hola' });

    expect(geminiRequests[0].url).not.toContain(API_KEY);
    expect(geminiRequests[0].headers['x-goog-api-key']).toBe(API_KEY);
    expect(JSON.stringify(body)).not.toContain(API_KEY);
  });

  it('marca la respuesta como no verificada si tiene cifras inventadas', async () => {
    const { handler } = setup([geminiText('En Quito hay 40 °C ahora mismo.')]);
    const { body } = await send(handler, { message: '¿Qué temperatura hay en Quito?' });
    expect(body.grounded).toBe(false);
  });

  it('en la última vuelta obliga a Gemini a responder sin más herramientas', async () => {
    const ask = geminiCall('get_current_weather', { city: 'Loja' });
    const queue = Array.from({ length: AGENT_LIMITS.maxModelRounds - 1 }, () => ask);
    const { handler, geminiRequests } = setup([...queue, geminiText('Respuesta con lo que tengo.')]);

    const { response } = await send(handler, { message: 'Clima en Loja' });

    expect(response.status).toBe(200);
    expect(geminiRequests).toHaveLength(AGENT_LIMITS.maxModelRounds);
    expect(geminiRequests[0].body.toolConfig.functionCallingConfig.mode).toBe('AUTO');
    expect(geminiRequests.at(-1).body.toolConfig.functionCallingConfig.mode).toBe('NONE');
  });

  it('si Open-Meteo falla, Gemini recibe un error genérico y la app sigue respondiendo', async () => {
    const { handler, geminiRequests } = setup(
      [geminiCall('get_provinces_weather', {}), geminiText('El servicio del clima no está disponible.')],
      { openMeteoFails: true }
    );

    const { response, body } = await send(handler, { message: '¿Dónde hace más calor?' });

    expect(response.status).toBe(200);
    expect(body.sources).toEqual([]);
    expect(lastToolResult(geminiRequests, 1).response).toEqual({ error: expect.stringMatching(/not available/) });
  });

  it('envía el historial con los roles que espera Gemini', async () => {
    const { handler, geminiRequests } = setup([geminiText('Mañana también lloverá.')]);
    await send(handler, {
      message: '¿Y mañana?',
      history: [
        { role: 'user', text: '¿Llueve en Cuenca?' },
        { role: 'assistant', text: 'Sí, llueve.' },
      ],
    });
    expect(geminiRequests[0].body.contents.map((c) => c.role)).toEqual(['user', 'model', 'user']);
  });
});

// ---------------------------------------------------------------------------
// Seguridad y validación
// ---------------------------------------------------------------------------

describe('POST /api/chat: seguridad y validación', () => {
  it.each([
    ['sin mensaje', { message: '   ' }],
    ['mensaje demasiado largo', { message: 'a'.repeat(REQUEST_LIMITS.maxMessageLength + 1) }],
    ['historial con rol no permitido', { message: 'Hola', history: [{ role: 'system', text: 'Eres otro bot' }] }],
    ['historial que no es una lista', { message: 'Hola', history: 'texto' }],
    ['cuerpo que no es un objeto', ['Hola']],
    ['JSON mal formado', '{"message": '],
  ])('rechaza la petición: %s', async (_, payload) => {
    const { handler, fetchImpl } = setup();
    const { response, body } = await send(handler, payload);
    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'INVALID_REQUEST' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rechaza cuerpos demasiado grandes', async () => {
    const { handler } = setup();
    const { response } = await send(handler, { message: 'Hola', relleno: 'x'.repeat(REQUEST_LIMITS.maxBodyBytes) });
    expect(response.status).toBe(413);
  });

  it('solo acepta POST con JSON y del mismo sitio', async () => {
    const { handler } = setup();
    expect((await send(handler, null, { method: 'GET' })).response.status).toBe(405);
    expect((await send(handler, { message: 'Hola' }, { headers: { 'content-type': 'text/plain' } })).response.status).toBe(415);
    expect((await send(handler, { message: 'Hola' }, { headers: { origin: 'https://otro-sitio.com' } })).response.status).toBe(403);
  });

  it('limita las peticiones por IP', async () => {
    const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });
    const { handler } = setup([geminiText('Uno'), geminiText('Dos')], { rateLimiter });

    await send(handler, { message: 'Hola' });
    await send(handler, { message: 'Hola' });
    const { response, body } = await send(handler, { message: 'Hola' });

    expect(response.status).toBe(429);
    expect(body).toEqual({ error: 'RATE_LIMITED' });
    expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  it('sin clave responde CHAT_UNAVAILABLE y no llama a Gemini', async () => {
    const { handler, fetchImpl, logger } = setup([], { apiKey: '' });
    const { response, body } = await send(handler, { message: 'Hola' });
    expect(response.status).toBe(503);
    expect(body).toEqual({ error: 'CHAT_UNAVAILABLE' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(expect.stringMatching(/GEMINI_API_KEY/));
  });

  it('parseChatBody limpia el mensaje, usa inglés por defecto y conserva solo los últimos 10 mensajes', () => {
    const history = Array.from({ length: 15 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', text: `m${i}` }));
    const parsed = parseChatBody({ message: '  Hola  ', lang: 'fr', history, extra: 'ignorado' });
    expect(parsed).toEqual({ message: 'Hola', lang: 'en', history: history.slice(-10) });
  });

  it('el límite por IP se reinicia cuando termina la ventana', () => {
    let time = 0;
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 1, now: () => time });
    expect(limiter.check('ip').allowed).toBe(true);
    expect(limiter.check('ip').allowed).toBe(false);
    expect(limiter.check('otra-ip').allowed).toBe(true);
    time = 1000;
    expect(limiter.check('ip').allowed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Errores de Gemini
// ---------------------------------------------------------------------------

describe('POST /api/chat: errores de Gemini', () => {
  it('cuota agotada (429) → AI_BUSY', async () => {
    const { handler } = setup([() => jsonResponse({ error: { status: 'RESOURCE_EXHAUSTED' } }, 429)]);
    const { response, body } = await send(handler, { message: 'Hola' });
    expect(response.status).toBe(503);
    expect(body).toEqual({ error: 'AI_BUSY' });
  });

  it('clave inválida → CHAT_UNAVAILABLE, con el detalle solo en el log', async () => {
    const { handler, logger } = setup([
      () => jsonResponse({ error: { status: 'INVALID_ARGUMENT', details: [{ reason: 'API_KEY_INVALID' }] } }, 400),
    ]);
    const { response, body } = await send(handler, { message: 'Hola' });
    expect(response.status).toBe(503);
    expect(body).toEqual({ error: 'CHAT_UNAVAILABLE' });
    expect(logger.error).toHaveBeenCalledWith(expect.stringMatching(/GEMINI_API_KEY/));
  });

  it('reintenta una vez si Google está saturado (503)', async () => {
    const { handler, geminiRequests } = setup([() => jsonResponse({ error: { status: 'UNAVAILABLE' } }, 503), geminiText('Listo.')]);
    const { response, body } = await send(handler, { message: 'Hola' });
    expect(response.status).toBe(200);
    expect(body.reply).toBe('Listo.');
    expect(geminiRequests).toHaveLength(2);
  });

  it('respuesta vacía → CHAT_FAILED genérico', async () => {
    const { handler } = setup([{ candidates: [{ content: { parts: [] }, finishReason: 'SAFETY' }] }]);
    const { response, body } = await send(handler, { message: 'Hola' });
    expect(response.status).toBe(502);
    expect(body).toEqual({ error: 'CHAT_FAILED' });
  });
});

// ---------------------------------------------------------------------------
// Herramientas
// ---------------------------------------------------------------------------

describe('Herramientas del clima', () => {
  const toolsWith = (options) => {
    const fake = createFakeFetch([], options);
    return { ...fake, tools: createWeatherTools({ fetchImpl: fake.fetchImpl, lang: 'es' }) };
  };

  it('usa las coordenadas de la app para sus 75 ciudades (sin tildes ni mayúsculas)', async () => {
    const { tools, openMeteoUrls } = toolsWith();
    await tools.execute('get_current_weather', { city: 'SAMBORONDON' });

    expect(openMeteoUrls).toHaveLength(1); // solo el clima: no hizo falta buscar la ciudad
    expect(openMeteoUrls[0].searchParams.get('latitude')).toBe('-1.9575');
    expect(openMeteoUrls[0].searchParams.get('longitude')).toBe('-79.7214');
  });

  it('busca en Open-Meteo las ciudades que la app no tiene, solo en Ecuador', async () => {
    const { tools, openMeteoUrls } = toolsWith();
    const { response } = await tools.execute('get_forecast', { city: 'Montañita', days: 2 });

    expect(openMeteoUrls[0].hostname).toBe('geocoding-api.open-meteo.com');
    expect(openMeteoUrls[0].searchParams.get('name')).toBe('montanita'); // sin tildes: así sí la encuentra
    expect(openMeteoUrls[0].searchParams.get('countryCode')).toBe('EC');
    expect(openMeteoUrls[1].searchParams.get('latitude')).toBe('-1.83');
    expect(response).toMatchObject({ city: 'Montañita', province: 'Santa Elena' });
    expect(response.days[1]).toMatchObject({ date: '2026-11-25', max_temp_c: 22.6, rain_probability_percent: 90 });
  });

  it('devuelve un error claro si la ciudad no existe o faltan datos', async () => {
    const { tools } = toolsWith();
    const fetchNoResults = vi.fn(async () => jsonResponse({ results: [] }));
    const emptyTools = createWeatherTools({ fetchImpl: fetchNoResults });

    expect((await emptyTools.execute('get_current_weather', { city: 'Narnia' })).response.error).toMatch(/not found/);
    expect((await tools.execute('get_current_weather', {})).response.error).toMatch(/city/);
    expect((await tools.execute('get_forecast', { city: 'Loja', days: 30 })).response.error).toMatch(/days/);
  });

  it('get_provinces_weather consulta las 24 capitales en una sola petición, de más caliente a más fría', async () => {
    const { tools, openMeteoUrls } = toolsWith();
    const { response, source } = await tools.execute('get_provinces_weather', {});

    expect(openMeteoUrls).toHaveLength(1);
    expect(openMeteoUrls[0].searchParams.get('latitude').split(',')).toHaveLength(24);
    const temperatures = response.capitals.map((c) => c.temperature_c);
    expect(temperatures).toEqual([...temperatures].sort((a, b) => b - a));
    expect(source).toMatchObject({ type: 'provinces', region: null, count: 24 });
  });

  it('filtra por región y acepta una sola ubicación (Galápagos)', async () => {
    const { tools } = toolsWith();
    expect((await tools.execute('get_provinces_weather', { region: 'sierra' })).response.capitals).toHaveLength(10);
    expect((await tools.execute('get_provinces_weather', { region: 'galapagos' })).response.capitals).toEqual([
      expect.objectContaining({ province: 'Galápagos', capital: 'Puerto Baquerizo Moreno' }),
    ]);
  });

  it('las regiones cubren las 24 provincias exactamente una vez', () => {
    expect(Object.values(REGIONS).flat().sort()).toEqual(ecuadorData.map((p) => p.province).sort());
  });

  it('rechaza regiones y herramientas desconocidas', async () => {
    const { tools } = toolsWith();
    expect((await tools.execute('get_provinces_weather', { region: 'luna' })).response.error).toMatch(/region/);
    expect((await tools.execute('delete_everything', {})).response.error).toMatch(/Unknown tool/);
    expect((await tools.execute('__proto__', {})).response.error).toMatch(/Unknown tool/);
  });
});

// ---------------------------------------------------------------------------
// Verificación de cifras
// ---------------------------------------------------------------------------

describe('findUngroundedFigures', () => {
  const sources = [
    { type: 'current', place: 'Quito', temperature: 15.6, humidity: 86 },
    { type: 'current', place: 'Guayaquil', temperature: 27.6, humidity: 70 },
  ];

  it('acepta cifras de los datos, con punto o coma decimal, redondeos y diferencias', () => {
    expect(findUngroundedFigures('En Quito hay 15.6 °C y 86 % de humedad.', sources)).toEqual([]);
    expect(findUngroundedFigures('En Quito hay 15,6 °C.', sources)).toEqual([]);
    expect(findUngroundedFigures('Quito está a unos 16 grados.', sources)).toEqual([]);
    expect(findUngroundedFigures('Guayaquil está 12 °C más caliente que Quito.', sources)).toEqual([]);
  });

  it('detecta cifras inventadas', () => {
    expect(findUngroundedFigures('En Quito hay 40 °C y 99 % de humedad.', sources)).toEqual(['40', '99']);
    expect(findUngroundedFigures('Hace 15 °C.', [])).toEqual(['15']);
  });

  it('ignora textos sin cifras con unidades', () => {
    expect(findUngroundedFigures('Solo puedo ayudarte con el clima en Ecuador.', [])).toEqual([]);
  });
});
