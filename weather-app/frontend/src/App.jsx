import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import WeatherCard from './components/WeatherCard';
import MapComponent from './components/MapComponent';
import ProvinceView from './components/ProvinceView';
import ProvincesOverview from './components/ProvincesOverview';
import { fetchWeatherByCoords, fetchWeatherByCity } from './api/weatherApi';

function App() {
  const [activeView, setActiveView] = useState('search'); // 'search' | 'provinces_list' | 'provinces' | 'map'
  const [selectedProvObj, setSelectedProvObj] = useState(null);
  
  // Theme logic
  const [theme, setTheme] = useState('dark');
  
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectProvinceView = (provObj) => {
    setSelectedProvObj(provObj);
    setActiveView('provinces'); // Detalle de la provincia
  }

  const loadWeatherFromCoords = async (cityObj) => {
    setLoading(true);
    setError('');
    setWeatherData(null);
    try {
      let data;
      if (cityObj.lat && cityObj.lon) {
         data = await fetchWeatherByCoords(cityObj.lat, cityObj.lon, cityObj.name, cityObj.admin1 || '', cityObj.country || 'Ecuador');
      } else {
         data = await fetchWeatherByCity(cityObj.name || cityObj);
      }
      setWeatherData(data);
    } catch (err) {
      setError(err.message || 'Error al obtener el clima.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        toggleTheme={toggleTheme}
        theme={theme}
      />
      
      <main className={`main-content ${theme}`}>
        {activeView === 'search' && (
          <div className="view-container" style={{width: '100%', alignItems: 'center'}}>
            <header>
              <h1>Buscador del Clima Ecuatoriano</h1>
              <p>Busca ciudades y provincias específicas en Ecuador</p>
            </header>
            
            <SearchBar 
               onCitySelect={loadWeatherFromCoords} 
               onClear={() => { setWeatherData(null); setError(''); }}  
            />

            {loading && (
               <div className="status-msg glass" style={{marginTop:'1.5rem', maxWidth: '600px'}}>
                  <Loader2 className="spinner" size={32} style={{margin:'0 auto 10px'}} />
                  <p>Interrogando sensores meteorológicos...</p>
               </div>
            )}

            {error && (
               <div className="status-msg error-msg glass" style={{marginTop:'1.5rem', maxWidth: '600px'}}>
                  <AlertCircle size={32} style={{margin:'0 auto 10px'}} />
                  <p>{error}</p>
               </div>
            )}

            {!loading && !error && weatherData && (
              <WeatherCard data={weatherData} />
            )}
            
            {!loading && !weatherData && !error && (
               <p style={{opacity: 0.5, marginTop: '2rem'}}>Comienza buscando una ciudad (ej. Quito)...</p>
            )}
          </div>
        )}

        {activeView === 'provinces_list' && (
           <ProvincesOverview onSelectProvince={handleSelectProvinceView} />
        )}

        {activeView === 'provinces' && (
           <ProvinceView province={selectedProvObj} />
        )}

        {activeView === 'map' && (
          <div className="view-container" style={{width: '100%', alignItems: 'center'}}>
            <header>
               <h1 style={{fontSize:'1.8rem'}}>Mapa de Provincias</h1>
               <p>Interactúa con los marcadores interactivos minimalistas</p>
            </header>
            <MapComponent theme={theme} />
          </div>
        )}
      </main>
    </>
  );
}

export default App;
