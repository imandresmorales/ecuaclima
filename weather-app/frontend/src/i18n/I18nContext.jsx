/* eslint-disable react-refresh/only-export-components -- el proveedor y su hook van juntos */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LANGUAGE,
  LOCALES,
  SUPPORTED_LANGUAGES,
  translations,
} from './translations';

/**
 * Idioma global de la aplicación.
 *
 * El idioma vive en un único contexto en la raíz de la app, así que al
 * cambiarlo se actualizan todas las vistas (buscador, provincias, mapa,
 * tarjetas, errores y títulos), no solo la pantalla actual. La elección
 * se guarda en localStorage y se recuerda entre visitas.
 */
export const LANGUAGE_STORAGE_KEY = 'ecuaclima-lang';

const I18nContext = createContext(null);

const isSupported = (lang) => SUPPORTED_LANGUAGES.includes(lang);

/** Idioma inicial: el guardado; si no hay, el del navegador; si no, español. */
export const detectInitialLanguage = () => {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupported(stored)) return stored;
  } catch {
    // Almacenamiento no disponible (por ejemplo, en modo privado estricto)
  }

  const browserLanguage = typeof navigator !== 'undefined' ? navigator.language : '';
  const base = (browserLanguage || '').slice(0, 2).toLowerCase();
  return isSupported(base) ? base : DEFAULT_LANGUAGE;
};

/** Reemplaza {nombre} por su valor; los valores se insertan como texto, nunca como HTML. */
const interpolate = (text, params) =>
  text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));

const setMetaDescription = (content) => {
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', content);
};

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(detectInitialLanguage);

  const setLang = useCallback((next) => {
    if (isSupported(next)) setLangState(next);
  }, []);

  const t = useCallback(
    (key, params = {}) => {
      const text = translations[lang][key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;
      return interpolate(text, params);
    },
    [lang]
  );

  const formatNumber = useCallback(
    (value, decimals = 1) =>
      new Intl.NumberFormat(LOCALES[lang], {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value),
    [lang]
  );

  // Sincroniza el documento con el idioma: lang del <html>, título y descripción
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = translations[lang]['meta.title'];
    setMetaDescription(translations[lang]['meta.description']);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Sin almacenamiento disponible: el idioma solo dura esta sesión
    }
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, formatNumber }), [lang, setLang, t, formatNumber]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

/** Hook para usar el idioma en cualquier componente: const { t, lang, setLang } = useI18n(); */
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n debe usarse dentro de <I18nProvider>.');
  return context;
};
