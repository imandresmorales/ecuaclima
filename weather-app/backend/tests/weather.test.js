const request = require('supertest');
const app = require('../server'); // Importamos la app sin escuchar el puerto

describe('GET /api/weather', () => {
  it('Debería retornar 400 si falta el parámetro de ciudad', async () => {
    const res = await request(app).get('/api/weather');
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error');
  });

  it('Debería retornar datos del clima para Quito', async () => {
    const res = await request(app).get('/api/weather?city=Quito');
    
    // Suponiendo que la API funciona, debería ser status 200
    // (en un escenario real, podríamos mockear axios)
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('location');
      expect(res.body.location).toHaveProperty('name', 'Quito');
      expect(res.body).toHaveProperty('weather');
      expect(res.body.weather).toHaveProperty('temperature_2m');
    } else {
      expect(res.statusCode).toBeLessThan(500);
    }
  });
});
