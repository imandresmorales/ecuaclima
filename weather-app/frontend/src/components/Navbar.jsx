import React from 'react';
import { Search, Map as MapIcon, Menu, Sun, Moon } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = ({ activeView, setActiveView, toggleTheme, theme }) => {
  const { t } = useI18n();

  return (
    <nav className="navbar glass" aria-label={t('nav.label')} style={{ position: 'sticky', top: 0, zIndex: 99999 }}>
      <button
        className="nav-brand"
        onClick={() => setActiveView('search')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'inherit' }}
        aria-label={t('nav.home')}
      >
        EcuaClima ⛅
      </button>

      <div className="nav-links">
        <button className={activeView === 'search' ? 'active' : ''} onClick={() => setActiveView('search')}>
          <Search size={18} aria-hidden="true" /> {t('nav.search')}
        </button>

        <button className={activeView.startsWith('provinces') ? 'active' : ''} onClick={() => setActiveView('provinces_list')}>
          <Menu size={18} aria-hidden="true" /> {t('nav.provinces')}
        </button>

        <button className={activeView === 'map' ? 'active' : ''} onClick={() => setActiveView('map')}>
          <MapIcon size={18} aria-hidden="true" /> {t('nav.map')}
        </button>

        <LanguageSwitcher />

        {/* Botón de alternancia de tema claro/oscuro */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? t('nav.themeToLight') : t('nav.themeToDark')}
          style={{ padding: '0.5rem', background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
        >
          {theme === 'dark' ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} color="#1e40af" />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
