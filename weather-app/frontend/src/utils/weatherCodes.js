/**
 * Descripción en español de los códigos meteorológicos WMO que devuelve Open-Meteo.
 * Referencia: https://open-meteo.com/en/docs (sección "Weather variable documentation").
 */
const WEATHER_CODES = {
  0: { label: 'Despejado', type: 'clear' },
  1: { label: 'Mayormente despejado', type: 'clear' },
  2: { label: 'Parcialmente nublado', type: 'cloudy' },
  3: { label: 'Nublado', type: 'cloudy' },
  45: { label: 'Niebla', type: 'fog' },
  48: { label: 'Niebla con escarcha', type: 'fog' },
  51: { label: 'Llovizna ligera', type: 'drizzle' },
  53: { label: 'Llovizna moderada', type: 'drizzle' },
  55: { label: 'Llovizna intensa', type: 'drizzle' },
  56: { label: 'Llovizna helada ligera', type: 'drizzle' },
  57: { label: 'Llovizna helada intensa', type: 'drizzle' },
  61: { label: 'Lluvia ligera', type: 'rain' },
  63: { label: 'Lluvia moderada', type: 'rain' },
  65: { label: 'Lluvia intensa', type: 'rain' },
  66: { label: 'Lluvia helada ligera', type: 'rain' },
  67: { label: 'Lluvia helada intensa', type: 'rain' },
  71: { label: 'Nevada ligera', type: 'snow' },
  73: { label: 'Nevada moderada', type: 'snow' },
  75: { label: 'Nevada intensa', type: 'snow' },
  77: { label: 'Granizo fino', type: 'snow' },
  80: { label: 'Chubascos ligeros', type: 'rain' },
  81: { label: 'Chubascos moderados', type: 'rain' },
  82: { label: 'Chubascos violentos', type: 'rain' },
  85: { label: 'Chubascos de nieve ligeros', type: 'snow' },
  86: { label: 'Chubascos de nieve intensos', type: 'snow' },
  95: { label: 'Tormenta eléctrica', type: 'storm' },
  96: { label: 'Tormenta con granizo ligero', type: 'storm' },
  99: { label: 'Tormenta con granizo intenso', type: 'storm' },
};

const UNKNOWN = { label: 'Condición no disponible', type: 'cloudy' };

export const describeWeatherCode = (code) => WEATHER_CODES[code] ?? UNKNOWN;
