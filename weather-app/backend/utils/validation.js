/**
 * Validación de los parámetros que llegan por query string.
 * Todo valor del cliente se considera no confiable hasta pasar por aquí.
 */

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Rectángulo que cubre Ecuador continental y Galápagos.
const ECUADOR_BOUNDS = {
  minLat: -5.1,
  maxLat: 1.7,
  minLon: -92.1,
  maxLon: -75.1,
};

const MAX_TEXT_LENGTH = 100;
const SUPPORTED_LANGUAGES = ['es', 'en'];
const DEFAULT_LANGUAGE = 'es';
const MIN_QUERY_LENGTH = 2;

/** Devuelve un texto limpio y acotado, o '' si no es un string. */
const cleanText = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, MAX_TEXT_LENGTH);
};

/** Devuelve el idioma pedido si está permitido; si no, español. */
const parseLanguage = (value) => (SUPPORTED_LANGUAGES.includes(value) ? value : DEFAULT_LANGUAGE);

/** Valida un término de búsqueda obligatorio. */
const requireSearchTerm = (value, paramName) => {
  const term = cleanText(value);
  if (term.length < MIN_QUERY_LENGTH) {
    throw new HttpError(
      400,
      `El parámetro "${paramName}" es requerido y debe tener al menos ${MIN_QUERY_LENGTH} caracteres.`
    );
  }
  return term;
};

/** Convierte a número y verifica que esté dentro del rango permitido. */
const parseCoordinate = (value, min, max) => {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return null;
  return number;
};

/** Valida latitud y longitud y exige que estén dentro de Ecuador. */
const requireEcuadorCoords = (lat, lon) => {
  const latitude = parseCoordinate(lat, ECUADOR_BOUNDS.minLat, ECUADOR_BOUNDS.maxLat);
  const longitude = parseCoordinate(lon, ECUADOR_BOUNDS.minLon, ECUADOR_BOUNDS.maxLon);
  if (latitude === null || longitude === null) {
    throw new HttpError(400, 'Los parámetros "lat" y "lon" deben ser coordenadas válidas dentro de Ecuador.');
  }
  return { latitude, longitude };
};

module.exports = {
  HttpError,
  ECUADOR_BOUNDS,
  cleanText,
  parseLanguage,
  requireSearchTerm,
  requireEcuadorCoords,
};
