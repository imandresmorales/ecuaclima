import React from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  Wind,
  Sun,
  Thermometer,
  ArrowDownToLine,
  Map as MapIconL,
} from 'lucide-react';
import { describeWeatherCode } from '../utils/weatherCodes';

const ICONS = {
  clear: <Sun size={80} color="#fcd34d" aria-hidden="true" />,
  cloudy: <Cloud size={80} color="#cbd5e1" aria-hidden="true" />,
  fog: <CloudFog size={80} color="#94a3b8" aria-hidden="true" />,
  drizzle: <CloudDrizzle size={80} color="#93c5fd" aria-hidden="true" />,
  rain: <CloudRain size={80} color="#60a5fa" aria-hidden="true" />,
  snow: <CloudSnow size={80} color="#e2e8f0" aria-hidden="true" />,
  storm: <CloudLightning size={80} color="#facc15" aria-hidden="true" />,
};

/** Formatea un valor numérico con su unidad, o '--' si no hay dato (0 es un dato válido). */
const formatValue = (value, unit, decimals = 1) =>
  typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(decimals)}${unit}` : '--';

const WeatherCard = ({ data }) => {
  const { location, weather } = data || {};
  if (!location || !weather) return null;

  const condition = describeWeatherCode(weather.weather_code);

  return (
    <div className="weather-card glass">
      <div className="location-name">{location.name}</div>
      <div className="location-region">
        <MapIconL size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} aria-hidden="true" />
        {location.admin1}
        {location.admin1 ? ', ' : ''}
        {location.country}
      </div>

      <div className="temperature-grid">
        {ICONS[condition.type]}
        <div className="temperature">
          {formatValue(weather.temperature_2m, '')}
          <span>°C</span>
        </div>
      </div>
      <p className="weather-condition">{condition.label}</p>

      <div className="weather-details-grid">
        <div className="detail-item">
          <Thermometer size={26} color="#f87171" aria-hidden="true" />
          <div className="detail-text">
            <span className="detail-label">Sensación térmica</span>
            <span className="detail-value">{formatValue(weather.apparent_temperature, ' °C')}</span>
          </div>
        </div>
        <div className="detail-item">
          <Droplets size={26} color="#60a5fa" aria-hidden="true" />
          <div className="detail-text">
            <span className="detail-label">Humedad</span>
            <span className="detail-value">{formatValue(weather.relative_humidity_2m, '%', 0)}</span>
          </div>
        </div>
        <div className="detail-item">
          <Wind size={26} color="#cbd5e1" aria-hidden="true" />
          <div className="detail-text">
            <span className="detail-label">Viento</span>
            <span className="detail-value">{formatValue(weather.wind_speed_10m, ' km/h')}</span>
          </div>
        </div>
        <div className="detail-item">
          <ArrowDownToLine size={26} color="#34d399" aria-hidden="true" />
          <div className="detail-text">
            <span className="detail-label">Presión atmosférica</span>
            <span className="detail-value">{formatValue(weather.surface_pressure, ' hPa', 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
