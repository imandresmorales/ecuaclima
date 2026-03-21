const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// Rutas adicionales
router.get('/search', weatherController.searchLocations);
router.get('/coords', weatherController.getWeatherByCoords);

// Ruta principal para obtener el clima
router.get('/', weatherController.getWeather);

module.exports = router;
