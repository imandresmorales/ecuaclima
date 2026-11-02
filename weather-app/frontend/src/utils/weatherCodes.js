/**
 * Códigos meteorológicos WMO que devuelve Open-Meteo.
 * Referencia: https://open-meteo.com/en/docs (sección "Weather variable documentation").
 *
 * Aquí solo se define el tipo de icono de cada código; el texto de cada
 * condición está traducido en src/i18n/translations.js ("weather.<código>").
 */
const WEATHER_TYPES = {
  0: 'clear',
  1: 'clear',
  2: 'cloudy',
  3: 'cloudy',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  56: 'drizzle',
  57: 'drizzle',
  61: 'rain',
  63: 'rain',
  65: 'rain',
  66: 'rain',
  67: 'rain',
  71: 'snow',
  73: 'snow',
  75: 'snow',
  77: 'snow',
  80: 'rain',
  81: 'rain',
  82: 'rain',
  85: 'snow',
  86: 'snow',
  95: 'storm',
  96: 'storm',
  99: 'storm',
};

/** Devuelve el tipo de icono y la clave de traducción de un código WMO. */
export const describeWeatherCode = (code) => {
  if (Object.prototype.hasOwnProperty.call(WEATHER_TYPES, code)) {
    return { type: WEATHER_TYPES[code], labelKey: `weather.${code}` };
  }
  return { type: 'cloudy', labelKey: 'weather.unknown' };
};
