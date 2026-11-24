/**
 * Textos de la interfaz en español (es) e inglés (en).
 *
 * - Las claves son iguales en ambos idiomas (lo verifica una prueba).
 * - `{nombre}` se reemplaza con el valor pasado a t('clave', { nombre }).
 * - Los nombres propios (provincias, ciudades) no se traducen.
 */
export const SUPPORTED_LANGUAGES = ['es', 'en'];
// Inglés por defecto: el proyecto se presenta a un público internacional
export const DEFAULT_LANGUAGE = 'en';

/** Nombre de cada idioma en su propio idioma (buena práctica para selectores). */
export const LANGUAGE_NAMES = {
  es: 'Español',
  en: 'English',
};

/** Locale usado para formatear números en cada idioma. */
export const LOCALES = {
  es: 'es-EC',
  en: 'en-US',
};

export const translations = {
  es: {
    'meta.title': 'EcuaClima | Clima en Ecuador',
    'meta.description':
      'EcuaClima: consulta el clima actual de ciudades y provincias de Ecuador con un buscador y un mapa interactivo.',

    'nav.label': 'Navegación principal',
    'nav.home': 'Ir a inicio (Buscador)',
    'nav.search': 'Buscador',
    'nav.provinces': 'Provincias',
    'nav.map': 'Mapa Provincial',
    'nav.themeToLight': 'Activar modo claro',
    'nav.themeToDark': 'Activar modo oscuro',
    'nav.language': 'Idioma',

    'search.title': 'Buscador del Clima Ecuatoriano',
    'search.subtitle': 'Busca ciudades y provincias específicas en Ecuador',
    'search.placeholder': 'Escribe una ciudad y verás opciones...',
    'search.inputLabel': 'Buscar ciudad en Ecuador',
    'search.submit': 'Buscar',
    'search.noResults': 'No se encontraron ciudades en Ecuador con ese nombre.',
    'search.loading': 'Consultando el clima...',
    'search.hint': 'Comienza buscando una ciudad (ej. Quito)...',

    'provinces.title': 'Regiones del Ecuador',
    'provinces.subtitle': 'Selecciona una provincia para explorar sus cantones y clima',
    'provinces.cantons': '{count} cantones',

    'province.title': 'Provincia de {name}',
    'province.subtitle': 'Selecciona un cantón o ciudad para explorar su clima al detalle',
    'province.viewWeather': 'Ver clima completo',
    'province.back': 'Volver a lista de {name}',
    'province.loading': 'Cargando el clima de los cantones...',

    'map.title': 'Mapa de Provincias',
    'map.subtitle': 'Haz clic en un marcador para ver las ciudades de cada provincia',
    'map.viewCities': 'Ver ciudades',
    'map.dialogLabel': 'Ciudades de {name}',
    'map.selectCity': 'Selecciona una ciudad o cantón para ver su clima:',
    'map.viewForecast': 'Ver pronóstico',
    'map.back': 'Volver',
    'map.close': 'Cerrar',

    'card.feelsLike': 'Sensación térmica',
    'card.humidity': 'Humedad',
    'card.wind': 'Viento',
    'card.pressure': 'Presión atmosférica',

    'footer.weatherData': 'Datos meteorológicos de',
    'footer.map': 'Mapa ©',

    'errors.SEARCH_FAILED': 'No se pudo realizar la búsqueda. Revisa tu conexión e inténtalo de nuevo.',
    'errors.WEATHER_FAILED': 'No se pudo obtener el clima para esta ubicación. Inténtalo de nuevo.',

    'chat.open': 'Abrir el asistente del clima',
    'chat.close': 'Cerrar el asistente',
    'chat.title': 'Asistente del clima',
    'chat.subtitle': 'IA con datos reales de Open-Meteo',
    'chat.welcome': '¡Hola! Pregúntame por el clima en Ecuador: temperaturas, lluvia o qué lugar está más caliente.',
    'chat.suggestion.hottest': '¿Qué ciudad está más caliente ahora?',
    'chat.suggestion.umbrella': '¿Tengo que llevar paraguas mañana a Cuenca?',
    'chat.suggestion.coldest': '¿Qué ciudad de la Sierra está más fría?',
    'chat.inputLabel': 'Escribe tu pregunta',
    'chat.placeholder': 'Escribe tu pregunta...',
    'chat.send': 'Enviar pregunta',
    'chat.thinking': 'Consultando los datos del clima...',
    'chat.disclaimer': 'Las respuestas las genera una IA. Revisa los datos usados.',
    'chat.ungrounded': 'Atención: esta respuesta tiene cifras que no aparecen en los datos consultados.',
    'chat.sources.title': 'Datos usados (Open-Meteo)',
    'chat.sources.current':
      '{place}, ahora: {temperature} °C (sensación {feelsLike} °C), humedad {humidity} %, viento {wind} km/h, {condition}.',
    'chat.sources.forecastDay': '{place}, {date}: máx. {max} °C, mín. {min} °C, lluvia {rain} %, {condition}.',
    'chat.sources.provinces':
      '{count} capitales de provincia: más cálida {hotCity} ({hotProvince}) {hotTemp} °C; más fría {coldCity} ({coldProvince}) {coldTemp} °C.',
    'chat.sources.provincesRegion':
      '{count} capitales de la {region}: más cálida {hotCity} ({hotProvince}) {hotTemp} °C; más fría {coldCity} ({coldProvince}) {coldTemp} °C.',
    'chat.sources.usage': '{rounds} consultas a la IA · {tokens} tokens',
    'chat.region.costa': 'Costa',
    'chat.region.sierra': 'Sierra',
    'chat.region.amazonia': 'Amazonía',
    'chat.region.galapagos': 'región Insular (Galápagos)',
    'chat.errors.INVALID_REQUEST': 'No pude procesar esa pregunta. Intenta escribirla de otra forma.',
    'chat.errors.RATE_LIMITED': 'Hiciste muchas preguntas seguidas. Espera unos minutos e inténtalo de nuevo.',
    'chat.errors.AI_BUSY': 'El asistente alcanzó su límite de uso por ahora. Inténtalo más tarde.',
    'chat.errors.CHAT_UNAVAILABLE': 'El asistente no está disponible en este momento.',
    'chat.errors.CHAT_FAILED': 'No pude responder esta vez. Inténtalo de nuevo.',

    'weather.unknown': 'Condición no disponible',
    'weather.0': 'Despejado',
    'weather.1': 'Mayormente despejado',
    'weather.2': 'Parcialmente nublado',
    'weather.3': 'Nublado',
    'weather.45': 'Niebla',
    'weather.48': 'Niebla con escarcha',
    'weather.51': 'Llovizna ligera',
    'weather.53': 'Llovizna moderada',
    'weather.55': 'Llovizna intensa',
    'weather.56': 'Llovizna helada ligera',
    'weather.57': 'Llovizna helada intensa',
    'weather.61': 'Lluvia ligera',
    'weather.63': 'Lluvia moderada',
    'weather.65': 'Lluvia intensa',
    'weather.66': 'Lluvia helada ligera',
    'weather.67': 'Lluvia helada intensa',
    'weather.71': 'Nevada ligera',
    'weather.73': 'Nevada moderada',
    'weather.75': 'Nevada intensa',
    'weather.77': 'Granizo fino',
    'weather.80': 'Chubascos ligeros',
    'weather.81': 'Chubascos moderados',
    'weather.82': 'Chubascos violentos',
    'weather.85': 'Chubascos de nieve ligeros',
    'weather.86': 'Chubascos de nieve intensos',
    'weather.95': 'Tormenta eléctrica',
    'weather.96': 'Tormenta con granizo ligero',
    'weather.99': 'Tormenta con granizo intenso',
  },

  en: {
    'meta.title': 'EcuaClima | Weather in Ecuador',
    'meta.description':
      'EcuaClima: check the current weather in cities and provinces of Ecuador with a search bar and an interactive map.',

    'nav.label': 'Main navigation',
    'nav.home': 'Go to home (Search)',
    'nav.search': 'Search',
    'nav.provinces': 'Provinces',
    'nav.map': 'Province Map',
    'nav.themeToLight': 'Switch to light mode',
    'nav.themeToDark': 'Switch to dark mode',
    'nav.language': 'Language',

    'search.title': 'Ecuador Weather Search',
    'search.subtitle': 'Search for specific cities and provinces in Ecuador',
    'search.placeholder': 'Type a city to see suggestions...',
    'search.inputLabel': 'Search for a city in Ecuador',
    'search.submit': 'Search',
    'search.noResults': 'No cities in Ecuador match that name.',
    'search.loading': 'Fetching the weather...',
    'search.hint': 'Start by searching for a city (e.g. Quito)...',

    'provinces.title': 'Regions of Ecuador',
    'provinces.subtitle': 'Select a province to explore its cantons and weather',
    'provinces.cantons': '{count} cantons',

    'province.title': '{name} Province',
    'province.subtitle': 'Select a canton or city to see its detailed weather',
    'province.viewWeather': 'View full weather',
    'province.back': 'Back to {name} list',
    'province.loading': 'Loading the weather for each canton...',

    'map.title': 'Province Map',
    'map.subtitle': "Click a marker to see each province's cities",
    'map.viewCities': 'View cities',
    'map.dialogLabel': 'Cities in {name}',
    'map.selectCity': 'Select a city or canton to see its weather:',
    'map.viewForecast': 'View forecast',
    'map.back': 'Back',
    'map.close': 'Close',

    'card.feelsLike': 'Feels like',
    'card.humidity': 'Humidity',
    'card.wind': 'Wind',
    'card.pressure': 'Air pressure',

    'footer.weatherData': 'Weather data by',
    'footer.map': 'Map ©',

    'errors.SEARCH_FAILED': 'The search could not be completed. Check your connection and try again.',
    'errors.WEATHER_FAILED': 'Could not get the weather for this location. Please try again.',

    'chat.open': 'Open the weather assistant',
    'chat.close': 'Close the assistant',
    'chat.title': 'Weather assistant',
    'chat.subtitle': 'AI with real data from Open-Meteo',
    'chat.welcome': 'Hi! Ask me about the weather in Ecuador: temperatures, rain or which place is hottest.',
    'chat.suggestion.hottest': 'Which city is the hottest right now?',
    'chat.suggestion.umbrella': 'Do I need an umbrella in Cuenca tomorrow?',
    'chat.suggestion.coldest': 'Which city in the Sierra is the coldest?',
    'chat.inputLabel': 'Type your question',
    'chat.placeholder': 'Type your question...',
    'chat.send': 'Send question',
    'chat.thinking': 'Checking the weather data...',
    'chat.disclaimer': 'Answers are generated by AI. Check the data used.',
    'chat.ungrounded': 'Note: this answer contains figures that are not in the data that was checked.',
    'chat.sources.title': 'Data used (Open-Meteo)',
    'chat.sources.current':
      '{place}, now: {temperature} °C (feels like {feelsLike} °C), humidity {humidity} %, wind {wind} km/h, {condition}.',
    'chat.sources.forecastDay': '{place}, {date}: high {max} °C, low {min} °C, rain {rain} %, {condition}.',
    'chat.sources.provinces':
      '{count} province capitals: hottest {hotCity} ({hotProvince}) {hotTemp} °C; coldest {coldCity} ({coldProvince}) {coldTemp} °C.',
    'chat.sources.provincesRegion':
      '{count} capitals in the {region}: hottest {hotCity} ({hotProvince}) {hotTemp} °C; coldest {coldCity} ({coldProvince}) {coldTemp} °C.',
    'chat.sources.usage': '{rounds} AI calls · {tokens} tokens',
    'chat.region.costa': 'Coast',
    'chat.region.sierra': 'Sierra (Andes)',
    'chat.region.amazonia': 'Amazon',
    'chat.region.galapagos': 'Galápagos Islands',
    'chat.errors.INVALID_REQUEST': "I couldn't process that question. Try writing it another way.",
    'chat.errors.RATE_LIMITED': 'You asked many questions in a row. Wait a few minutes and try again.',
    'chat.errors.AI_BUSY': 'The assistant has reached its usage limit for now. Please try again later.',
    'chat.errors.CHAT_UNAVAILABLE': 'The assistant is not available right now.',
    'chat.errors.CHAT_FAILED': "I couldn't answer this time. Please try again.",

    'weather.unknown': 'Condition not available',
    'weather.0': 'Clear sky',
    'weather.1': 'Mainly clear',
    'weather.2': 'Partly cloudy',
    'weather.3': 'Overcast',
    'weather.45': 'Fog',
    'weather.48': 'Freezing fog',
    'weather.51': 'Light drizzle',
    'weather.53': 'Moderate drizzle',
    'weather.55': 'Dense drizzle',
    'weather.56': 'Light freezing drizzle',
    'weather.57': 'Dense freezing drizzle',
    'weather.61': 'Light rain',
    'weather.63': 'Moderate rain',
    'weather.65': 'Heavy rain',
    'weather.66': 'Light freezing rain',
    'weather.67': 'Heavy freezing rain',
    'weather.71': 'Light snowfall',
    'weather.73': 'Moderate snowfall',
    'weather.75': 'Heavy snowfall',
    'weather.77': 'Snow grains',
    'weather.80': 'Light rain showers',
    'weather.81': 'Moderate rain showers',
    'weather.82': 'Violent rain showers',
    'weather.85': 'Light snow showers',
    'weather.86': 'Heavy snow showers',
    'weather.95': 'Thunderstorm',
    'weather.96': 'Thunderstorm with light hail',
    'weather.99': 'Thunderstorm with heavy hail',
  },
};
