const axios = require('axios');

exports.searchLocations = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query parameter is required' });
    
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=es&format=json`;
    const response = await axios.get(geocodingUrl);
    
    const results = response.data.results || [];
    // Filtrar estrictamente para que solo devuelva Ecuador
    const ecuadorResults = results.filter(r => r.country_code === 'EC');

    res.json(ecuadorResults);
  } catch (error) {
    console.error('Error in searchLocations:', error.message);
    res.status(500).json({ error: 'Error searching locations' });
  }
};

exports.getWeatherByCoords = async (req, res) => {
  try {
    const { lat, lon, name, admin1, country } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Lat and lon are required' });

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code&hourly=temperature_2m`;
    const weatherResponse = await axios.get(weatherUrl);

    res.json({
      location: { name, admin1, country, latitude: lat, longitude: lon },
      weather: weatherResponse.data.current,
    });
  } catch (error) {
    console.error('Error fetching weather:', error.message);
    res.status(500).json({ error: 'Error del servidor al obtener el clima.' });
  }
};

// Mantenemos esto por si alguna prueba antigua lo necesita
exports.getWeather = async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: 'El parámetro "city" es requerido.' });
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=es&format=json`;
    const geoResponse = await axios.get(geocodingUrl);
    const results = geoResponse.data.results;
    if (!results || results.length === 0) return res.status(404).json({ error: 'Ciudad no encontrada.' });
    let location = results.find(r => r.country_code === 'EC') || results[0];
    
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code`;
    const weatherResponse = await axios.get(weatherUrl);

    res.json({
      location: {
        id: location.id, name: location.name, admin1: location.admin1, country: location.country, latitude: location.latitude, longitude: location.longitude,
      },
      weather: weatherResponse.data.current,
    });
  } catch (error) {
    console.error('Error in getWeather:', error.message);
    res.status(500).json({ error: 'Error del servidor al obtener el clima.' });
  }
};
