import React from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../i18n/translations';

/**
 * Selector de idioma ES / EN.
 * Cada botón indica con aria-pressed cuál está activo, y su nombre accesible
 * es el idioma escrito en ese mismo idioma ("Español", "English").
 */
const LanguageSwitcher = () => {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="lang-switcher" role="group" aria-label={t('nav.language')}>
      {SUPPORTED_LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          className={`lang-option ${lang === code ? 'active' : ''}`}
          aria-pressed={lang === code}
          aria-label={LANGUAGE_NAMES[code]}
          lang={code}
          onClick={() => setLang(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
