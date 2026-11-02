import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import WeatherCard from './components/WeatherCard';
import MapComponent from './components/MapComponent';
import ProvinceView from './components/ProvinceView';
import ProvincesOverview from './components/ProvincesOverview';
import { fetchWeatherByCoords } from './api/weatherApi';
import { I18nProvider, useI18n } from './i18n/I18nContext';

const THEME_KEY = 'ecuaclima-theme';

/** Lee el tema guardado; el almacenamiento puede no estar disponible (modo privado). */
const readStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

function AppContent() {
  const { t } = useI18n();
  const [activeView, setActiveView] = useState('search'); // 'search' | 'provinces_list' | 'provinces' | 'map'
  const [selectedProvObj, setSelectedProvObj] = useState(null);
  const [theme, setTheme] = useState(readStoredTheme);

  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  // Se guarda el código del error (no el texto) para mostrarlo en el idioma activo
  const [errorCode, setErrorCode] = useState('');
  const lastRequestId = useRef(0);

  useEffect(() => {
    document.body.classList.toggle('light-mode', theme === 'light');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Sin almacenamiento disponible: el tema solo dura esta sesión
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSelectProvinceView = (provObj) => {
    setSelectedProvObj(provObj);
    setActiveView('provinces');
  };

  const handleClearSearch = useCallback(() => {
    setWeatherData(null);
    setErrorCode('');
  }, []);

  const loadWeatherForCity = async (city) => {
    // Si el usuario elige otra ciudad antes de que llegue la respuesta, se ignora la anterior
    const requestId = ++lastRequestId.current;
    setLoading(true);
    setErrorCode('');
    setWeatherData(null);
    try {
      const data = await fetchWeatherByCoords(city.lat, city.lon, city.name, city.admin1 || '', city.country || 'Ecuador');
      if (requestId === lastRequestId.current) setWeatherData(data);
    } catch (err) {
      if (requestId === lastRequestId.current) setErrorCode(err.code || 'WEATHER_FAILED');
    } finally {
      if (requestId === lastRequestId.current) setLoading(false);
    }
  };

  return (
    <>
      <Navbar activeView={activeView} setActiveView={setActiveView} toggleTheme={toggleTheme} theme={theme} />

      <main className={`main-content ${theme}`}>
        {activeView === 'search' && (
          <div className="view-container" style={{ width: '100%', alignItems: 'center' }}>
            <header>
              <h1>{t('search.title')}</h1>
              <p>{t('search.subtitle')}</p>
            </header>

            <SearchBar onCitySelect={loadWeatherForCity} onClear={handleClearSearch} />

            {loading && (
              <div className="status-msg glass" role="status" style={{ marginTop: '1.5rem', maxWidth: '600px' }}>
                <Loader2 className="spinner" size={32} style={{ margin: '0 auto 10px' }} aria-hidden="true" />
                <p>{t('search.loading')}</p>
              </div>
            )}

            {errorCode && (
              <div className="status-msg error-msg glass" role="alert" style={{ marginTop: '1.5rem', maxWidth: '600px' }}>
                <AlertCircle size={32} style={{ margin: '0 auto 10px' }} aria-hidden="true" />
                <p>{t(`errors.${errorCode}`)}</p>
              </div>
            )}

            {!loading && !errorCode && weatherData && <WeatherCard data={weatherData} />}

            {!loading && !weatherData && !errorCode && (
              <p style={{ opacity: 0.5, marginTop: '2rem' }}>{t('search.hint')}</p>
            )}
          </div>
        )}

        {activeView === 'provinces_list' && <ProvincesOverview onSelectProvince={handleSelectProvinceView} />}

        {activeView === 'provinces' && selectedProvObj && (
          <ProvinceView key={selectedProvObj.province} province={selectedProvObj} />
        )}

        {activeView === 'map' && (
          <div className="view-container" style={{ width: '100%', alignItems: 'center' }}>
            <header>
              <h1 style={{ fontSize: '1.8rem' }}>{t('map.title')}</h1>
              <p>{t('map.subtitle')}</p>
            </header>
            <MapComponent />
          </div>
        )}
      </main>

      <footer className="app-footer">
        {t('footer.weatherData')}{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
          Open-Meteo
        </a>
        {' · '}
        {t('footer.map')}{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          OpenStreetMap
        </a>
      </footer>
    </>
  );
}

/** El proveedor de idioma envuelve toda la app: un solo idioma para todas las vistas. */
function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

export default App;
