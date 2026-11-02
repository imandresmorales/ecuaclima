const openMeteo = require('../services/openMeteo');
const {
  HttpError,
  cleanText,
  requireSearchTerm,
  requireEcuadorCoords,
} = require('../utils/validation');

/** Devuelve solo los campos del lugar que usa el frontend. */
const toLocation = (place) => ({
  id: place.id,
  name: place.name,
  admin1: place.admin1 || '',
  country: place.country || 'Ecuador',
  latitude: place.latitude,
  longitude: place.longitude,
});

/** GET /api/weather/search?query=Quito → lugares de Ecuador que coinciden. */
exports.searchLocations = async (req, res) => {
  const query = requireSearchTerm(req.query.query, 'query');
  const places = await openMeteo.searchEcuadorPlaces(query);
  res.json(places.map(toLocation));
};

/** GET /api/weather/coords?lat=-2.19&lon=-79.88&name=Guayaquil → clima actual. */
exports.getWeatherByCoords = async (req, res) => {
  const { latitude, longitude } = requireEcuadorCoords(req.query.lat, req.query.lon);
  const weather = await openMeteo.getCurrentWeather(latitude, longitude);

  res.json({
    location: {
      name: cleanText(req.query.name),
      admin1: cleanText(req.query.admin1),
      country: cleanText(req.query.country) || 'Ecuador',
      latitude,
      longitude,
    },
    weather,
  });
};

/** GET /api/weather?city=Quito → clima actual de la primera coincidencia en Ecuador. */
exports.getWeather = async (req, res) => {
  const city = requireSearchTerm(req.query.city, 'city');
  const [place] = await openMeteo.searchEcuadorPlaces(city, 5);
  if (!place) throw new HttpError(404, 'Ciudad no encontrada en Ecuador.');

  const weather = await openMeteo.getCurrentWeather(place.latitude, place.longitude);
  res.json({ location: toLocation(place), weather });
};
