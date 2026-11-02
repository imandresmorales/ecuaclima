import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from '../App';
import { LANGUAGE_STORAGE_KEY } from '../i18n/I18nContext';

// El mapa (Leaflet) no se puede dibujar en jsdom; se reemplaza por un marcador simple
vi.mock('../components/MapComponent', () => ({ default: () => <div data-testid="map" /> }));

// Sin llamadas reales a internet durante las pruebas
vi.mock('../api/weatherApi', () => ({
  searchCities: vi.fn().mockResolvedValue([]),
  fetchWeatherByCoords: vi.fn().mockResolvedValue({
    location: { name: 'Cuenca', admin1: 'Azuay', country: 'Ecuador' },
    weather: { temperature_2m: 16.4, weather_code: 3 },
  }),
}));

const switchTo = (languageName) => fireEvent.click(screen.getByRole('button', { name: languageName }));
const goTo = (name) => fireEvent.click(screen.getByRole('button', { name }));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(LANGUAGE_STORAGE_KEY, 'es');
  document.body.className = '';
});

describe('App', () => {
  it('muestra la marca y el buscador', () => {
    render(<App />);
    expect(screen.getByText(/EcuaClima/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Escribe una ciudad y verás opciones/i)).toBeInTheDocument();
  });

  it('permite escribir en la barra de búsqueda', () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Escribe una ciudad y verás opciones/i);
    fireEvent.change(input, { target: { value: 'Loja' } });
    expect(input.value).toBe('Loja');
  });

  it('muestra la atribución de Open-Meteo', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Open-Meteo' })).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('cambia y recuerda el tema claro/oscuro', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Activar modo claro/i }));
    expect(document.body.classList.contains('light-mode')).toBe(true);
    expect(localStorage.getItem('ecuaclima-theme')).toBe('light');
  });
});

describe('Idioma ES / EN', () => {
  it('marca el idioma activo en el selector', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Español' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('traduce toda la app y mantiene el idioma al cambiar de vista', () => {
    render(<App />);
    switchTo('English');

    // Buscador
    expect(screen.getByRole('heading', { level: 1, name: 'Ecuador Weather Search' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a city to see suggestions...')).toBeInTheDocument();
    expect(screen.getByText(/Weather data by/)).toBeInTheDocument();

    // Lista de provincias
    goTo('Provinces');
    expect(screen.getByRole('heading', { level: 1, name: 'Regions of Ecuador' })).toBeInTheDocument();
    expect(screen.getAllByText(/cantons/).length).toBeGreaterThan(0);

    // Detalle de una provincia
    fireEvent.click(screen.getByRole('button', { name: /Azuay/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Azuay Province' })).toBeInTheDocument();

    // Mapa
    goTo('Province Map');
    expect(screen.getByRole('heading', { level: 1, name: 'Province Map' })).toBeInTheDocument();

    // Regreso al buscador: sigue en inglés
    goTo('Search');
    expect(screen.getByRole('heading', { level: 1, name: 'Ecuador Weather Search' })).toBeInTheDocument();
    expect(screen.queryByText('Buscador del Clima Ecuatoriano')).not.toBeInTheDocument();
  });

  it('actualiza el idioma del documento y el título de la página', () => {
    render(<App />);
    switchTo('English');
    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe('EcuaClima | Weather in Ecuador');

    switchTo('Español');
    expect(document.documentElement.lang).toBe('es');
    expect(document.title).toBe('EcuaClima | Clima en Ecuador');
  });

  it('recuerda el idioma elegido al volver a abrir la app', () => {
    render(<App />);
    switchTo('English');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');

    cleanup();
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Ecuador Weather Search' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('ignora un idioma no permitido guardado en el navegador', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, '<script>');
    render(<App />);
    expect(['es', 'en']).toContain(document.documentElement.lang);
  });
});
