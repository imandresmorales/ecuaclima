import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2, X } from 'lucide-react';
import { ecuadorData } from '../data/ecuadorData';
import { fetchWeatherByCoords } from '../api/weatherApi';
import WeatherCard from './WeatherCard';
import { onActivateKey } from '../utils/a11y';
import { useI18n } from '../i18n/I18nContext';

const MinimalMarker = L.divIcon({
  className: 'custom-minimal-marker',
  html: `<div style="width: 14px; height: 14px; background-color: var(--accent); border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5); cursor: pointer; transition: transform 0.2s;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10]
});

const ProvinceMarker = ({ prov, onOpenProvince }) => {
  const { t } = useI18n();
  return (
    <Marker position={[prov.lat, prov.lon]} icon={MinimalMarker} eventHandlers={{ click: () => onOpenProvince(prov) }}>
      <Popup>
        <strong>{t('province.title', { name: prov.province })}</strong><br/>
        <button className="popup-btn" style={{marginTop:'5px', padding:'4px 8px', borderRadius:'6px', border:'none', background:'var(--primary)', color:'white', cursor:'pointer'}} onClick={() => onOpenProvince(prov)}>{t('map.viewCities')}</button>
      </Popup>
    </Marker>
  )
}

const MapCitiesModal = ({ province, onClose, onSelectCity, selectedCityWeather, loadingCity, cityError, onBackToCities }) => {
  const { t } = useI18n();
  if (!province) return null;
  return (
    <div className="modal-overlay" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="modal-content glass" role="dialog" aria-modal="true" aria-label={t('map.dialogLabel', { name: province.province })} style={{position: 'relative', width: selectedCityWeather ? '600px' : '400px', transition: 'width 0.3s ease'}}>
        {selectedCityWeather ? (
          <div style={{animation: 'fadeIn 0.3s ease-out'}}>
             <div className="modal-header">
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <button className="close-btn" style={{fontSize:'0.9rem', background:'rgba(255,255,255,0.1)', padding:'6px 12px', borderRadius:'8px'}} onClick={onBackToCities}>&larr; {t('map.back')}</button>
                  <h2 style={{margin:0}}>{selectedCityWeather.location.name}</h2>
                </div>
                <button className="close-btn" onClick={onClose} aria-label={t('map.close')}><X size={24} /></button>
             </div>
             <div style={{marginTop: '1rem'}}>
               <WeatherCard data={selectedCityWeather} />
             </div>
          </div>
        ) : loadingCity ? (
          <div style={{display:'flex', justifyContent:'center', padding:'4rem', animation: 'fadeIn 0.3s ease-out'}}>
             <Loader2 className="spinner" size={40} />
          </div>
        ) : (
          <div style={{animation: 'fadeIn 0.3s ease-out'}}>
             <div className="modal-header">
                <h2>{t('province.title', { name: province.province })}</h2>
                <button className="close-btn" onClick={onClose} aria-label={t('map.close')} autoFocus><X size={24} /></button>
             </div>
             <p style={{marginBottom: '1rem', color: '#94a3b8'}}>{t('map.selectCity')}</p>
             {cityError && <p role="alert" style={{marginBottom: '1rem', color: '#f87171'}}>{t(`errors.${cityError}`)}</p>}
             <div className="modal-city-list">
               {province.cities.map((city) => (
                 <div
                   key={city.name}
                   className="modal-city-item"
                   role="button"
                   tabIndex={0}
                   onClick={() => onSelectCity(city)}
                   onKeyDown={onActivateKey(() => onSelectCity(city))}
                 >
                    <span className="mini-city-name">{city.name}</span>
                    <span style={{color: '#3b82f6'}}>{t('map.viewForecast')} &rarr;</span>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  )
}

const MapComponent = () => {
  const position = [-1.43, -78.6]; // Centro aprox. Ecuador
  const zoom = 6.5;

  const [selectedProv, setSelectedProv] = useState(null);
  const [selectedCityWeather, setSelectedCityWeather] = useState(null);
  const [loadingCity, setLoadingCity] = useState(false);
  const [cityError, setCityError] = useState('');

  const handleOpenProvince = (prov) => {
    setSelectedProv(prov);
    setSelectedCityWeather(null); // Al abrir otra provincia se limpia la ciudad anterior
    setCityError('');
  }

  const handleSelectCity = async (city) => {
    setLoadingCity(true);
    setCityError('');
    try {
      const data = await fetchWeatherByCoords(city.lat, city.lon, city.name, city.admin1, 'Ecuador');
      setSelectedCityWeather(data);
    } catch (error) {
      setCityError(error.code || 'WEATHER_FAILED');
    } finally {
      setLoadingCity(false);
    }
  }

  const handleBackToCities = () => {
    setSelectedCityWeather(null);
  }
  
  const handleCloseModal = () => {
    setSelectedProv(null);
    setSelectedCityWeather(null);
  }

  return (
    <div className="map-container-wrapper">
      <MapContainer center={position} zoom={zoom} scrollWheelZoom={true} style={{ width: '100%', height: '100%' }}>
        {/* Teselas estándar de OpenStreetMap: gratuitas, sin API key, con atribución obligatoria */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {ecuadorData.map((prov) => (
          <ProvinceMarker key={prov.province} prov={prov} onOpenProvince={handleOpenProvince} />
        ))}
      </MapContainer>

      {selectedProv && (
        <MapCitiesModal 
          province={selectedProv} 
          onClose={handleCloseModal} 
          onSelectCity={handleSelectCity}
          selectedCityWeather={selectedCityWeather}
          loadingCity={loadingCity}
          cityError={cityError}
          onBackToCities={handleBackToCities}
        />
      )}
    </div>
  );
};

export default MapComponent;
