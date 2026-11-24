/**
 * Herramientas que la IA puede pedir ("tool calling").
 *
 * Gemini no puede entrar a internet: solo puede pedir una de estas funciones
 * por su nombre, con la ciudad que necesita. El servidor la ejecuta, consulta
 * Open-Meteo y le devuelve los datos. Así cada cifra de la respuesta sale de
 * aquí y no de la memoria del modelo.
 *
 * Cada ejecución devuelve:
 *  - response: los datos para Gemini (o un error claro para que se corrija).
 *  - source: un resumen para el recuadro "Datos usados" del chat.
 */
import { ecuadorData } from '../src/data/ecuadorData.js';
import { translations } from '../src/i18n/translations.js';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEZONE = 'America/Guayaquil';
const TIMEOUT_MS = 8000;
const MAX_FORECAST_DAYS = 7;

const CURRENT_FIELDS =
  'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code';
const DAILY_FIELDS =
  'temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code';

/** Provincias de cada región natural del Ecuador. */
export const REGIONS = {
  costa: ['El Oro', 'Esmeraldas', 'Guayas', 'Los Ríos', 'Manabí', 'Santa Elena', 'Santo Domingo'],
  sierra: ['Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi', 'Imbabura', 'Loja', 'Pichincha', 'Tungurahua'],
  amazonia: ['Morona Santiago', 'Napo', 'Orellana', 'Pastaza', 'Sucumbíos', 'Zamora Chinchipe'],
  galapagos: ['Galápagos'],
};

const cityParam = { type: 'string', description: 'City or town in Ecuador, e.g. "Cuenca".' };

/**
 * La "ficha" de cada herramienta que lee Gemini: la descripción le dice
 * CUÁNDO usarla y los parámetros, QUÉ datos debe enviar.
 */
export const toolDeclarations = [
  {
    name: 'get_current_weather',
    description:
      'Gets the weather right now (temperature, feels-like, humidity, precipitation, wind, condition) ' +
      'in a city or town of Ecuador.',
    parameters: { type: 'object', properties: { city: cityParam }, required: ['city'] },
  },
  {
    name: 'get_forecast',
    description:
      'Gets the daily forecast (max/min temperature, probability of rain, precipitation, condition) ' +
      'for a city or town of Ecuador. Day 1 is today. Use it for later today, tomorrow, the coming days ' +
      'or whether to bring an umbrella.',
    parameters: {
      type: 'object',
      properties: {
        city: cityParam,
        days: { type: 'integer', description: 'Days starting today (1 to 7). Use 2 to include tomorrow.', minimum: 1, maximum: MAX_FORECAST_DAYS },
      },
      required: ['city'],
    },
  },
  {
    name: 'get_provinces_weather',
    description:
      'Gets the current temperature and condition in the capital city of each of the 24 provinces of ' +
      'Ecuador in a single call, sorted from hottest to coldest. Optionally filter by region. ' +
      'Use it to compare provinces or regions, or to find the hottest or coldest place right now.',
    parameters: {
      type: 'object',
      properties: { region: { type: 'string', description: 'Optional natural region.', enum: Object.keys(REGIONS) } },
    },
  },
];

/** "Samborondón" → "samborondon": compara nombres sin tildes ni mayúsculas. */
const normalizeName = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/**
 * Las 75 ciudades que ya muestra la app, con SUS coordenadas. Open-Meteo da el
 * dato de la celda de su cuadrícula más cercana al punto pedido: si la IA usara
 * otro punto (aunque esté a 500 m), podría caer en otra celda y dar cifras
 * distintas a las de la app.
 */
const APP_CITIES = ecuadorData.flatMap((province) =>
  province.cities.map((city) => ({
    key: normalizeName(city.name),
    name: city.name,
    province: province.province,
    latitude: city.lat,
    longitude: city.lon,
  }))
);

/** Capital de cada provincia (la primera ciudad de cada una en los datos). */
const CAPITALS = ecuadorData.map((province) => ({
  province: province.province,
  city: province.cities[0].name,
  latitude: province.lat,
  longitude: province.lon,
}));

// Los datos se entregan a Gemini en inglés (formato neutro): si fueran en español,
// el modelo tiende a responder en español aunque la pregunta sea en inglés.
const describeCondition = (code) => translations.en[`weather.${code}`] ?? translations.en['weather.unknown'];

const toolError = (message) => ({ response: { error: message } });

const readCity = (args) => (typeof args.city === 'string' ? args.city.trim().slice(0, 100) : '');

/**
 * Crea las herramientas para una petición.
 * @param {object} options
 * @param {typeof fetch} [options.fetchImpl] - fetch inyectable para las pruebas.
 * @param {'es'|'en'} [options.lang] - idioma de los nombres que devuelve el buscador de Open-Meteo.
 */
export const createWeatherTools = ({ fetchImpl = globalThis.fetch, lang = 'en' } = {}) => {
  /** GET a Open-Meteo con parámetros codificados por URLSearchParams y un tiempo máximo de espera. */
  const getJson = async (baseUrl, params) => {
    const response = await fetchImpl(`${baseUrl}?${new URLSearchParams(params)}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Open-Meteo respondió ${response.status}`);
    return response.json();
  };

  /** Coordenadas de una ciudad: primero las de la app; si no está, el buscador de Open-Meteo. */
  const findCity = async (name) => {
    const known = APP_CITIES.find((city) => city.key === normalizeName(name));
    if (known) return known;

    // El buscador no encuentra nombres con tildes o ñ ("Montañita"), así que se buscan sin ellas,
    // y solo en Ecuador: si no, los resultados de otros países pueden ocupar toda la lista
    const data = await getJson(GEOCODING_URL, {
      name: normalizeName(name),
      count: 5,
      countryCode: 'EC',
      language: lang,
      format: 'json',
    });
    const place = (Array.isArray(data.results) ? data.results : []).find((p) => p.country_code === 'EC');
    if (!place) return null;
    return { name: place.name, province: place.admin1 || '', latitude: place.latitude, longitude: place.longitude };
  };

  const getCurrentWeather = async (args) => {
    const city = readCity(args);
    if (city.length < 2) return toolError('city is required.');
    const place = await findCity(city);
    if (!place) return toolError('That city was not found in Ecuador.');

    const { current } = await getJson(FORECAST_URL, {
      latitude: place.latitude,
      longitude: place.longitude,
      current: CURRENT_FIELDS,
      timezone: TIMEZONE,
    });
    if (typeof current?.temperature_2m !== 'number') throw new Error('Open-Meteo sin datos actuales');

    return {
      response: {
        city: place.name,
        province: place.province,
        local_time: current.time,
        temperature_c: current.temperature_2m,
        feels_like_c: current.apparent_temperature,
        humidity_percent: current.relative_humidity_2m,
        precipitation_mm: current.precipitation,
        wind_speed_kmh: current.wind_speed_10m,
        condition: describeCondition(current.weather_code),
      },
      source: {
        type: 'current',
        place: place.name,
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        precipitation: current.precipitation,
        windSpeed: current.wind_speed_10m,
        weatherCode: current.weather_code,
      },
    };
  };

  const getForecast = async (args) => {
    const city = readCity(args);
    if (city.length < 2) return toolError('city is required.');
    const days = args.days ?? 3;
    if (!Number.isInteger(days) || days < 1 || days > MAX_FORECAST_DAYS) {
      return toolError(`days must be an integer between 1 and ${MAX_FORECAST_DAYS}.`);
    }
    const place = await findCity(city);
    if (!place) return toolError('That city was not found in Ecuador.');

    const { daily } = await getJson(FORECAST_URL, {
      latitude: place.latitude,
      longitude: place.longitude,
      daily: DAILY_FIELDS,
      forecast_days: days,
      timezone: TIMEZONE,
    });
    if (!Array.isArray(daily?.time)) throw new Error('Open-Meteo sin pronóstico');

    const forecast = daily.time.map((date, i) => ({
      date,
      max: daily.temperature_2m_max?.[i] ?? null,
      min: daily.temperature_2m_min?.[i] ?? null,
      rainProbability: daily.precipitation_probability_max?.[i] ?? null,
      precipitation: daily.precipitation_sum?.[i] ?? null,
      weatherCode: daily.weather_code?.[i] ?? null,
    }));

    return {
      response: {
        city: place.name,
        province: place.province,
        days: forecast.map((day) => ({
          date: day.date,
          max_temp_c: day.max,
          min_temp_c: day.min,
          rain_probability_percent: day.rainProbability,
          precipitation_mm: day.precipitation,
          condition: describeCondition(day.weatherCode),
        })),
      },
      source: { type: 'forecast', place: place.name, days: forecast },
    };
  };

  const getProvincesWeather = async (args) => {
    const { region } = args;
    if (region !== undefined && !Object.hasOwn(REGIONS, region)) {
      return toolError(`region must be one of: ${Object.keys(REGIONS).join(', ')}.`);
    }
    const capitals = region ? CAPITALS.filter((c) => REGIONS[region].includes(c.province)) : CAPITALS;

    // Open-Meteo acepta varias coordenadas separadas por comas: una sola petición para todas
    const data = await getJson(FORECAST_URL, {
      latitude: capitals.map((c) => c.latitude).join(','),
      longitude: capitals.map((c) => c.longitude).join(','),
      current: 'temperature_2m,weather_code',
      timezone: TIMEZONE,
    });
    const locations = Array.isArray(data) ? data : [data]; // con una sola ubicación no viene una lista

    const rows = capitals
      .map((c, i) => ({ ...c, temperature: locations[i]?.current?.temperature_2m, weatherCode: locations[i]?.current?.weather_code }))
      .filter((row) => typeof row.temperature === 'number')
      .sort((a, b) => b.temperature - a.temperature);
    if (rows.length === 0) throw new Error('Open-Meteo sin temperaturas');

    const summary = ({ province, city, temperature }) => ({ province, city, temperature });

    return {
      response: {
        note: 'Each province is represented by its capital city. Sorted from hottest to coldest.',
        capitals: rows.map((row) => ({
          province: row.province,
          capital: row.city,
          temperature_c: row.temperature,
          condition: describeCondition(row.weatherCode),
        })),
      },
      source: {
        type: 'provinces',
        region: region ?? null,
        count: rows.length,
        hottest: summary(rows[0]),
        coldest: summary(rows[rows.length - 1]),
      },
    };
  };

  const tools = {
    get_current_weather: getCurrentWeather,
    get_forecast: getForecast,
    get_provinces_weather: getProvincesWeather,
  };

  return {
    /**
     * Ejecuta la herramienta que pidió Gemini. Nunca lanza errores: si algo
     * falla, devuelve un mensaje genérico (sin detalles internos).
     */
    async execute(name, args) {
      if (!Object.hasOwn(tools, name)) return toolError('Unknown tool.');
      const safeArgs = args && typeof args === 'object' && !Array.isArray(args) ? args : {};
      try {
        return await tools[name](safeArgs);
      } catch (error) {
        console.error(`[chat] La herramienta ${name} falló:`, error?.message);
        return toolError('The weather service is not available right now. Tell the user to try again later.');
      }
    },
  };
};
