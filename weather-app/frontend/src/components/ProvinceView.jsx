import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import WeatherCard from './WeatherCard';
import { fetchWeatherByCoords } from '../api/weatherApi';

const ProvinceView = ({ province }) => {
  // El componente se monta de nuevo al cambiar de provincia (prop `key` en App),
  // por eso el estado inicial ya es "cargando".
  const [citiesStatus, setCitiesStatus] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedCityWeather, setSelectedCityWeather] = useState(null);

  useEffect(() => {
    if (!province) return undefined;
    let isActive = true;

    // Una consulta por ciudad, en paralelo (cada provincia tiene pocas ciudades)
    const requests = province.cities.map(async (city) => {
      try {
        const data = await fetchWeatherByCoords(city.lat, city.lon, city.name, province.province, 'Ecuador');
        return { city: city.name, temp: data.weather.temperature_2m, fullData: data };
      } catch {
        return { city: city.name, temp: null, fullData: null };
      }
    });

    Promise.all(requests).then((resolved) => {
      if (!isActive) return;
      setCitiesStatus(resolved);
      setLoadingList(false);
    });

    return () => {
      isActive = false;
    };
  }, [province]);

  if (!province) return null;

  return (
    <div className="view-container">
       <header>
          <h1>Provincia de {province.province}</h1>
          <p>Selecciona un cantón o ciudad para explorar su clima al detalle</p>
       </header>

       {loadingList && <Loader2 className="spinner" size={40} style={{marginTop: '2rem'}} />}

       {!loadingList && !selectedCityWeather && (
          <div className="cities-grid" style={{
             display: 'grid', 
             gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
             gap: '2rem', 
             width: '100%', 
             padding: '1rem',
             justifyItems: 'center'
          }}>
            {citiesStatus.map((item) => (
              <div key={item.city} className="mini-city-card glass" 
                   role="button"
                   tabIndex={0}
                   aria-disabled={!item.fullData}
                   onKeyDown={(e) => {
                     if((e.key === 'Enter' || e.key === ' ') && item.fullData) {
                       e.preventDefault();
                       setSelectedCityWeather(item.fullData);
                     }
                   }}
                   style={{
                     width: '100%', 
                     display: 'flex', 
                     flexDirection: 'column', 
                     alignItems: 'center', 
                     padding: '2rem 1.5rem', 
                     gap: '1rem', 
                     border: '1px solid rgba(255,255,255,0.15)',
                     boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                     borderRadius: '20px',
                     background: 'linear-gradient(180deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)'
                   }} 
                   onClick={() => {
                     if(item.fullData) setSelectedCityWeather(item.fullData);
                   }}>
                 <div style={{textAlign: 'center'}}>
                    <div className="mini-city-name" style={{fontSize: '1.4rem', color: '#f8fafc', marginBottom: '0.2rem'}}>{item.city}</div>
                    <div style={{fontSize: '0.9rem', color: '#3b82f6', fontWeight: '500'}}>Ver clima completo &rarr;</div>
                 </div>
                 <div className="mini-city-temp" style={{
                    fontSize: '2.5rem', 
                    fontWeight: '800', 
                    color: typeof item.temp === 'number' ? '#f59e0b' : '#94a3b8',
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                 }}>
                    {typeof item.temp === 'number' ? `${item.temp.toFixed(1)} °C` : '--'}
                 </div>
              </div>
            ))}
          </div>
       )}

       {/* Detailed view */}
       {selectedCityWeather && (
         <>
           <button 
             onClick={() => setSelectedCityWeather(null)} 
             style={{
               marginBottom: '1rem', padding: '0.5rem 1.5rem', 
               background:'var(--secondary)', color:'white', 
               border:'none', borderRadius:'8px', cursor:'pointer'
             }}>
             &larr; Volver a lista de {province.province}
           </button>
           <WeatherCard data={selectedCityWeather} />
         </>
       )}
    </div>
  )
}

export default ProvinceView;
