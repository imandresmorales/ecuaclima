import React from 'react';
import { Cloud, Droplets, Wind, Sun, CloudRain, Thermometer, ArrowDownToLine, Map as MapIconL } from 'lucide-react';

const WeatherCard = ({ data }) => {
  const { location, weather } = data;
  if (!location || !weather) return null;

  const renderWeatherIcon = (code) => {
    if (code === 0) return <Sun size={80} color="#fcd34d" />;
    if (code > 0 && code <= 3) return <Cloud size={80} color="#cbd5e1" />;
    if (code >= 51 && code <= 67) return <CloudRain size={80} color="#60a5fa" />;
    return <Cloud size={80} color="#94a3b8" />;
  };

  const currentTemp = weather.temperature_2m ?? weather.temperature;
  const apparentTemp = weather.apparent_temperature;
  const humidity = weather.relative_humidity_2m;
  const pressure = weather.surface_pressure;
  const wind = weather.wind_speed_10m ?? weather.windspeed;
  const code = weather.weather_code ?? weather.weathercode;

  return (
    <div className="weather-card glass">
      <div className="location-name">{location.name}</div>
      <div className="location-region">
        <MapIconL size={14} style={{display:'inline', marginRight:'6px', verticalAlign:'middle'}}/>
        {location.admin1}{location.admin1 ? ', ' : ''}{location.country}
      </div>

      <div className="temperature-grid">
        {renderWeatherIcon(code || 0)}
        <div className="temperature">
          {currentTemp?.toFixed(1) || '--'}<span>°C</span>
        </div>
      </div>

      <div className="weather-details-grid">
         <div className="detail-item">
            <Thermometer size={26} color="#f87171" />
            <div className="detail-text">
               <span className="detail-label">Sensación Térmica</span>
               <span className="detail-value">{apparentTemp ? apparentTemp + ' °C' : '--'}</span>
            </div>
         </div>
         <div className="detail-item">
            <Droplets size={26} color="#60a5fa" />
            <div className="detail-text">
               <span className="detail-label">Humedad</span>
               <span className="detail-value">{humidity ? humidity + '%' : '--'}</span>
            </div>
         </div>
         <div className="detail-item">
            <Wind size={26} color="#cbd5e1" />
            <div className="detail-text">
               <span className="detail-label">Viento</span>
               <span className="detail-value">{wind ? wind.toFixed(1) + ' km/h' : '--'}</span>
            </div>
         </div>
         <div className="detail-item">
            <ArrowDownToLine size={26} color="#34d399" />
            <div className="detail-text">
               <span className="detail-label">Presión ATM</span>
               <span className="detail-value">{pressure ? pressure + ' hPa' : '--'}</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default WeatherCard;
