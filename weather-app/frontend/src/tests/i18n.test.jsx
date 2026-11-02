import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { translations, SUPPORTED_LANGUAGES } from '../i18n/translations';
import { I18nProvider, useI18n, detectInitialLanguage, LANGUAGE_STORAGE_KEY } from '../i18n/I18nContext';
import { describeWeatherCode } from '../utils/weatherCodes';

const placeholdersOf = (text) => (text.match(/\{\w+\}/g) || []).sort();

describe('Traducciones', () => {
  const esKeys = Object.keys(translations.es).sort();

  it.each(SUPPORTED_LANGUAGES)('el idioma "%s" tiene exactamente las mismas claves que español', (lang) => {
    expect(Object.keys(translations[lang]).sort()).toEqual(esKeys);
  });

  it('ningún texto está vacío y los marcadores {nombre} coinciden entre idiomas', () => {
    for (const key of esKeys) {
      for (const lang of SUPPORTED_LANGUAGES) {
        expect(translations[lang][key].trim(), `${lang}:${key}`).not.toBe('');
        expect(placeholdersOf(translations[lang][key]), `${lang}:${key}`).toEqual(
          placeholdersOf(translations.es[key])
        );
      }
    }
  });

  it('todos los códigos del clima tienen traducción', () => {
    const codes = [0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99];
    for (const code of codes) {
      const { labelKey } = describeWeatherCode(code);
      expect(labelKey).toBe(`weather.${code}`);
      for (const lang of SUPPORTED_LANGUAGES) expect(translations[lang][labelKey]).toBeTruthy();
    }
    expect(describeWeatherCode(1234).labelKey).toBe('weather.unknown');
  });
});

describe('detectInitialLanguage', () => {
  beforeEach(() => localStorage.clear());

  it('usa el idioma guardado si es válido', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    expect(detectInitialLanguage()).toBe('en');
  });

  it('ignora valores guardados no permitidos', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
    expect(SUPPORTED_LANGUAGES).toContain(detectInitialLanguage());
  });
});

const Probe = () => {
  const { t, formatNumber, setLang } = useI18n();
  return (
    <div>
      <p data-testid="text">{t('province.title', { name: '<b>Loja</b>' })}</p>
      <p data-testid="number">{formatNumber(27.5, 1)}</p>
      <p data-testid="missing">{t('clave.inexistente')}</p>
      <button onClick={() => setLang('en')}>en</button>
      <button onClick={() => setLang('xx')}>xx</button>
    </div>
  );
};

describe('I18nProvider', () => {
  beforeEach(() => localStorage.setItem(LANGUAGE_STORAGE_KEY, 'es'));

  it('inserta los valores como texto, nunca como HTML', () => {
    render(<I18nProvider><Probe /></I18nProvider>);
    expect(screen.getByTestId('text').textContent).toBe('Provincia de <b>Loja</b>');
    expect(screen.getByTestId('text').querySelector('b')).toBeNull();
  });

  it('formatea números según el idioma', () => {
    render(<I18nProvider><Probe /></I18nProvider>);
    expect(screen.getByTestId('number').textContent).toBe('27,5');
    fireEvent.click(screen.getByText('en'));
    expect(screen.getByTestId('number').textContent).toBe('27.5');
  });

  it('devuelve la clave si falta una traducción y no acepta idiomas no soportados', () => {
    render(<I18nProvider><Probe /></I18nProvider>);
    expect(screen.getByTestId('missing').textContent).toBe('clave.inexistente');
    fireEvent.click(screen.getByText('xx'));
    expect(screen.getByTestId('text').textContent).toBe('Provincia de <b>Loja</b>');
  });

  it('useI18n fuera del proveedor lanza un error claro', () => {
    const Broken = () => {
      useI18n();
      return null;
    };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Broken />)).toThrow(/I18nProvider/);
    consoleError.mockRestore();
  });
});
