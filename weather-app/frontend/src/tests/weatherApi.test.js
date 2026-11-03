import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchCities, fetchWeatherByCoords, usesBackend } from '../api/weatherApi';

// Cada cliente de axios se guarda por su baseURL para controlar sus respuestas
const { clients } = vi.hoisted(() => ({ clients: {} }));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(({ baseURL }) => {
      const client = { get: vi.fn() };
      clients[baseURL] = client;
      return client;
    }),
  },
}));

const geocoding = () => clients['https://geocoding-api.open-meteo.com/v1'];
const forecast = () => clients['https://api.open-meteo.com/v1'];

beforeEach(() => {
  Object.values(clients).forEach((client) => client.get.mockReset());
});

describe('weatherApi (modo directo a Open-Meteo)', () => {
  it('no usa backend si VITE_API_URL no está definida', () => {
    expect(usesBackend).toBe(false);
  });

  it('no consulta la API con búsquedas demasiado cortas', async () => {
    await expect(searchCities(' Q ')).resolves.toEqual([]);
    expect(geocoding().get).not.toHaveBeenCalled();
  });

  it('devuelve solo lugares de Ecuador con los campos necesarios', async () => {
    geocoding().get.mockResolvedValue({
      data: {
        results: [
          { id: 1, name: 'Loja', admin1: 'Loja', country: 'Ecuador', country_code: 'EC', latitude: -3.99, longitude: -79.2, population: 1 },
          { id: 2, name: 'Loja', admin1: 'Andalucía', country: 'España', country_code: 'ES', latitude: 37.1, longitude: -4.1 },
        ],
      },
    });

    const results = await searchCities('Loja');

    expect(geocoding().get).toHaveBeenCalledWith('/search', {
      params: { name: 'Loja', count: 10, language: 'en', format: 'json' },
    });
    expect(results).toEqual([
      { id: 1, name: 'Loja', admin1: 'Loja', country: 'Ecuador', latitude: -3.99, longitude: -79.2 },
    ]);
  });

  it('pide los nombres en el idioma activo y solo acepta es/en', async () => {
    geocoding().get.mockResolvedValue({ data: { results: [] } });

    await searchCities('Quito', 'es');
    expect(geocoding().get).toHaveBeenLastCalledWith('/search', {
      params: { name: 'Quito', count: 10, language: 'es', format: 'json' },
    });

    await searchCities('Quito', 'fr');
    expect(geocoding().get).toHaveBeenLastCalledWith('/search', {
      params: { name: 'Quito', count: 10, language: 'en', format: 'json' },
    });
  });

  it('lanza un ApiError con código si la búsqueda falla', async () => {
    geocoding().get.mockRejectedValue(new Error('Network Error'));
    await expect(searchCities('Quito')).rejects.toMatchObject({ name: 'ApiError', code: 'SEARCH_FAILED' });
  });

  it('devuelve la ubicación y el clima actual', async () => {
    forecast().get.mockResolvedValue({ data: { current: { temperature_2m: 27.5, weather_code: 3 } } });

    const data = await fetchWeatherByCoords(-2.19, -79.88, 'Guayaquil', 'Guayas');

    expect(data).toEqual({
      location: { name: 'Guayaquil', admin1: 'Guayas', country: 'Ecuador', latitude: -2.19, longitude: -79.88 },
      weather: { temperature_2m: 27.5, weather_code: 3 },
    });
  });

  it('lanza un ApiError con código si falla la consulta del clima', async () => {
    forecast().get.mockRejectedValue(new Error('timeout'));
    await expect(fetchWeatherByCoords(-2.19, -79.88)).rejects.toMatchObject({ name: 'ApiError', code: 'WEATHER_FAILED' });
  });
});
