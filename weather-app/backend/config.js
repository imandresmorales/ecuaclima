/**
 * Configuración central del backend, leída desde variables de entorno.
 * Ver `.env.example` para los valores disponibles.
 */

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173'];

/** Convierte "a, b ,c" en ['a', 'b', 'c'] ignorando valores vacíos. */
const parseList = (value) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const allowedOrigins = parseList(process.env.FRONTEND_URL);

module.exports = {
  port: Number(process.env.PORT) || 3001,
  allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : DEFAULT_ALLOWED_ORIGINS,
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: Number(process.env.RATE_LIMIT_MAX) || 100, // peticiones por IP en la ventana
  },
  // Número de proxies de confianza delante del servidor (p. ej. 1 en Render o Railway).
  // Necesario para que el rate limit use la IP real del cliente.
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
  upstreamTimeoutMs: 8000,
};
