/**
 * Cliente de la API pública de Open-Meteo (no requiere API key).
 * Los parámetros se envían con `params` para que axios los codifique
 * y nunca se concatenen valores del usuario directamente en la URL.
 */
const axios = require('axios');
const { upstreamTimeoutMs } = require('../config');

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

const geocodingClient = axios.create({
  baseURL: 'https://geocoding-api.open-meteo.com/v1',
  timeout: upstreamTimeoutMs,
});

const forecastClient = axios.create({
  baseURL: 'https://api.open-meteo.com/v1',
  timeout: upstreamTimeoutMs,
});

/** Busca lugares por nombre y devuelve solo los de Ecuador. */
const searchEcuadorPlaces = async (name, count = 10, language = 'en') => {
  const { data } = await geocodingClient.get('/search', {
    params: { name, count, language, format: 'json' },
  });
  return (data.results || []).filter((place) => place.country_code === 'EC');
};

/** Obtiene las condiciones actuales para unas coordenadas. */
const getCurrentWeather = async (latitude, longitude) => {
  const { data } = await forecastClient.get('/forecast', {
    params: { latitude, longitude, current: CURRENT_FIELDS, timezone: 'America/Guayaquil' },
  });
  return data.current;
};

module.exports = { searchEcuadorPlaces, getCurrentWeather };
