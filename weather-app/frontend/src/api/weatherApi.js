import axios from 'axios';

const API_URL = 'http://localhost:3001/api/weather';

export const fetchWeatherByCity = async (city) => {
  try {
    const response = await axios.get(`${API_URL}?city=${encodeURIComponent(city)}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('No se pudo conectar con el servidor.');
  }
};

export const searchCities = async (query) => {
  try {
    const response = await axios.get(`${API_URL}/search?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    return [];
  }
};

export const fetchWeatherByCoords = async (lat, lon, name, admin1, country) => {
  try {
    const params = new URLSearchParams({ lat, lon, name: name || '', admin1: admin1 || '', country: country || '' });
    const response = await axios.get(`${API_URL}/coords?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error('No se pudo obtener el clima para estas coordenadas.');
  }
};
