import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2, X } from 'lucide-react';
import { ecuadorData } from '../data/ecuadorData';
import { fetchWeatherByCoords } from '../api/weatherApi';
import WeatherCard from './WeatherCard';

const MinimalMarker = L.divIcon({
  className: 'custom-minimal-marker',
  html: `<div style="width: 14px; height: 14px; background-color: var(--accent); border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5); cursor: pointer; transition: transform 0.2s;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10]
});

const ProvinceMarker = ({ prov, onOpenProvince }) => {
  return (
    <Marker position={[prov.lat, prov.lon]} icon={MinimalMarker} eventHandlers={{ click: () => onOpenProvince(prov) }}>
      <Popup>
        <strong>Provincia de {prov.province}</strong><br/>
        <button className="popup-btn" style={{marginTop:'5px', padding:'4px 8px', borderRadius:'6px', border:'none', background:'var(--primary)', color:'white', cursor:'pointer'}} onClick={() => onOpenProvince(prov)}>Ver Ciudades</button>
      </Popup>
    </Marker>
  )
}

const MapCitiesModal = ({ province, onClose, onSelectCity, selectedCityWeather, loadingCity, onBackToCities }) => {
  if (!province) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content glass" style={{position: 'relative', width: selectedCityWeather ? '600px' : '400px', transition: 'width 0.3s ease'}}>
        {selectedCityWeather ? (
          <div style={{animation: 'fadeIn 0.3s ease-out'}}>
             <div className="modal-header">
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <button className="close-btn" style={{fontSize:'0.9rem', background:'rgba(255,255,255,0.1)', padding:'6px 12px', borderRadius:'8px'}} onClick={onBackToCities}>&larr; Volver</button>
                  <h2 style={{margin:0}}>{selectedCityWeather.location.name}</h2>
                </div>
                <button className="close-btn" onClick={onClose}><X size={24} /></button>
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
                <h2>Provincia de {province.province}</h2>
                <button className="close-btn" onClick={onClose}><X size={24} /></button>
             </div>
             <p style={{marginBottom: '1rem', color: '#94a3b8'}}>Selecciona una ciudad o cantón para ver su clima:</p>
             <div className="modal-city-list">
               {province.cities.map((city, idx) => (
                 <div key={idx} className="modal-city-item" onClick={() => onSelectCity(city)}>
                    <span className="mini-city-name">{city.name}</span>
                    <span style={{color: '#3b82f6'}}>Ver pronóstico &rarr;</span>
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

  const handleOpenProvince = (prov) => {
    setSelectedProv(prov);
    setSelectedCityWeather(null); // Resets any viewed city when opening a new province
  }

  const handleSelectCity = async (city) => {
    setLoadingCity(true);
    try {
      const data = await fetchWeatherByCoords(city.lat, city.lon, city.name, city.admin1, 'Ecuador');
      setSelectedCityWeather(data);
    } catch(e) {
      console.error(e);
    }
    setLoadingCity(false);
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
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {ecuadorData.map((prov, idx) => (
          <ProvinceMarker key={idx} prov={prov} onOpenProvince={handleOpenProvince} />
        ))}
      </MapContainer>

      {selectedProv && (
        <MapCitiesModal 
          province={selectedProv} 
          onClose={handleCloseModal} 
          onSelectCity={handleSelectCity}
          selectedCityWeather={selectedCityWeather}
          loadingCity={loadingCity}
          onBackToCities={handleBackToCities}
        />
      )}
    </div>
  );
};

export default MapComponent;
