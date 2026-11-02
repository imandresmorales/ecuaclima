const request = require('supertest');

// Se simula Open-Meteo para que las pruebas no dependan de internet.
jest.mock('../services/openMeteo');
const openMeteo = require('../services/openMeteo');
const app = require('../server');

const QUITO = {
  id: 3652462,
  name: 'Quito',
  admin1: 'Pichincha',
  country: 'Ecuador',
  country_code: 'EC',
  latitude: -0.22985,
  longitude: -78.52495,
};

const CURRENT_WEATHER = {
  temperature_2m: 14.2,
  relative_humidity_2m: 72,
  apparent_temperature: 13.1,
  precipitation: 0,
  surface_pressure: 730.5,
  wind_speed_10m: 6.4,
  wind_direction_10m: 120,
  weather_code: 2,
};

const upstreamError = () => Object.assign(new Error('timeout'), { isAxiosError: true });

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe('GET /api/weather/search', () => {
  it('devuelve 400 si falta el término de búsqueda', async () => {
    const res = await request(app).get('/api/weather/search');
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(openMeteo.searchEcuadorPlaces).not.toHaveBeenCalled();
  });

  it('devuelve 400 si el término es demasiado corto', async () => {
    const res = await request(app).get('/api/weather/search?query=Q');
    expect(res.statusCode).toBe(400);
  });

  it('devuelve solo los campos necesarios de cada lugar', async () => {
    openMeteo.searchEcuadorPlaces.mockResolvedValue([QUITO]);
    const res = await request(app).get('/api/weather/search?query=Quito');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      {
        id: QUITO.id,
        name: 'Quito',
        admin1: 'Pichincha',
        country: 'Ecuador',
        latitude: QUITO.latitude,
        longitude: QUITO.longitude,
      },
    ]);
  });

  it('devuelve 502 si Open-Meteo falla', async () => {
    openMeteo.searchEcuadorPlaces.mockRejectedValue(upstreamError());
    const res = await request(app).get('/api/weather/search?query=Quito');
    expect(res.statusCode).toBe(502);
    expect(res.body.error).not.toMatch(/timeout/);
  });
});

describe('GET /api/weather/coords', () => {
  it('devuelve el clima para coordenadas válidas de Ecuador', async () => {
    openMeteo.getCurrentWeather.mockResolvedValue(CURRENT_WEATHER);
    const res = await request(app).get('/api/weather/coords?lat=-2.19&lon=-79.88&name=Guayaquil&admin1=Guayas');

    expect(res.statusCode).toBe(200);
    expect(openMeteo.getCurrentWeather).toHaveBeenCalledWith(-2.19, -79.88);
    expect(res.body.location).toMatchObject({ name: 'Guayaquil', admin1: 'Guayas', country: 'Ecuador' });
    expect(res.body.weather).toEqual(CURRENT_WEATHER);
  });

  it('acepta coordenadas de Galápagos', async () => {
    openMeteo.getCurrentWeather.mockResolvedValue(CURRENT_WEATHER);
    const res = await request(app).get('/api/weather/coords?lat=-0.74&lon=-90.31');
    expect(res.statusCode).toBe(200);
  });

  it.each([
    ['sin coordenadas', ''],
    ['texto en lugar de números', '?lat=abc&lon=-79.88'],
    ['coordenadas fuera de Ecuador (Madrid)', '?lat=40.41&lon=-3.70'],
    ['intento de inyectar parámetros', '?lat=-2.19%26hourly=temperature_2m&lon=-79.88'],
  ])('devuelve 400 con %s', async (_caso, query) => {
    const res = await request(app).get(`/api/weather/coords${query}`);
    expect(res.statusCode).toBe(400);
    expect(openMeteo.getCurrentWeather).not.toHaveBeenCalled();
  });

  it('recorta textos demasiado largos', async () => {
    openMeteo.getCurrentWeather.mockResolvedValue(CURRENT_WEATHER);
    const res = await request(app).get(`/api/weather/coords?lat=-2.19&lon=-79.88&name=${'a'.repeat(500)}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.location.name).toHaveLength(100);
  });
});

describe('GET /api/weather', () => {
  it('devuelve 400 si falta el parámetro city', async () => {
    const res = await request(app).get('/api/weather');
    expect(res.statusCode).toBe(400);
  });

  it('devuelve 404 si la ciudad no está en Ecuador', async () => {
    openMeteo.searchEcuadorPlaces.mockResolvedValue([]);
    const res = await request(app).get('/api/weather?city=Madrid');
    expect(res.statusCode).toBe(404);
  });

  it('devuelve ubicación y clima de la primera coincidencia', async () => {
    openMeteo.searchEcuadorPlaces.mockResolvedValue([QUITO]);
    openMeteo.getCurrentWeather.mockResolvedValue(CURRENT_WEATHER);
    const res = await request(app).get('/api/weather?city=Quito');

    expect(res.statusCode).toBe(200);
    expect(res.body.location.name).toBe('Quito');
    expect(res.body.weather.temperature_2m).toBe(14.2);
  });
});

describe('Seguridad', () => {
  it('permite el origen configurado del frontend', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('no permite orígenes desconocidos', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://sitio-malicioso.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('envía cabeceras de seguridad y oculta la tecnología del servidor', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('responde 404 en JSON para rutas inexistentes', async () => {
    const res = await request(app).get('/no-existe');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
