import axios from 'axios';

/**
 * Capa de acceso a datos del clima.
 *
 * - Si se define VITE_API_URL, todas las consultas pasan por el backend
 *   Express del proyecto (validación, rate limit y CORS restringido).
 * - Si no, el frontend consulta Open-Meteo directamente. Así funciona en
 *   hosting estático como GitHub Pages, ya que Open-Meteo es gratuito,
 *   no requiere API key y permite peticiones desde el navegador.
 */
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
export const usesBackend = API_URL !== '';

const TIMEOUT_MS = 10000;
const MIN_QUERY_LENGTH = 2;
const CURRENT_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation',
  'surface_pressure',
  'wind_speed_10m',
  'wind_direction_10m',
  'weather_code',
].join(',');

const backendClient = axios.create({ baseURL: `${API_URL}/api/weather`, timeout: TIMEOUT_MS });
const geocodingClient = axios.create({ baseURL: 'https://geocoding-api.open-meteo.com/v1', timeout: TIMEOUT_MS });
const forecastClient = axios.create({ baseURL: 'https://api.open-meteo.com/v1', timeout: TIMEOUT_MS });

/** Deja solo los campos del lugar que usa la interfaz. */
const toLocation = (place) => ({
  id: place.id,
  name: place.name,
  admin1: place.admin1 || '',
  country: place.country || 'Ecuador',
  latitude: place.latitude,
  longitude: place.longitude,
});

/**
 * Busca ciudades de Ecuador por nombre.
 * Si la búsqueda falla, lanza un Error con un mensaje para el usuario.
 */
export const searchCities = async (query) => {
  const term = query.trim();
  if (term.length < MIN_QUERY_LENGTH) return [];

  try {
    if (usesBackend) {
      const { data } = await backendClient.get('/search', { params: { query: term } });
      return data;
    }

    const { data } = await geocodingClient.get('/search', {
      params: { name: term, count: 10, language: 'es', format: 'json' },
    });
    return (data.results || []).filter((place) => place.country_code === 'EC').map(toLocation);
  } catch {
    throw new Error('No se pudo realizar la búsqueda. Revisa tu conexión e inténtalo de nuevo.');
  }
};

/** Obtiene el clima actual de unas coordenadas junto con los datos del lugar. */
export const fetchWeatherByCoords = async (lat, lon, name = '', admin1 = '', country = 'Ecuador') => {
  try {
    if (usesBackend) {
      const { data } = await backendClient.get('/coords', {
        params: { lat, lon, name, admin1, country },
      });
      return data;
    }

    const { data } = await forecastClient.get('/forecast', {
      params: { latitude: lat, longitude: lon, current: CURRENT_FIELDS, timezone: 'America/Guayaquil' },
    });
    return {
      location: { name, admin1, country, latitude: lat, longitude: lon },
      weather: data.current,
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'No se pudo obtener el clima para esta ubicación. Inténtalo de nuevo.'
    );
  }
};
