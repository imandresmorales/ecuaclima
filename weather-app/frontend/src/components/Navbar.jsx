import React from 'react';
import { Search, Map as MapIcon, Menu, Sun, Moon } from 'lucide-react';

const Navbar = ({ activeView, setActiveView, toggleTheme, theme }) => {

  return (
    <nav className="navbar glass" aria-label="Navegación principal" style={{position: 'sticky', top: 0, zIndex: 99999}}>
      <div 
        className="nav-brand" 
        onClick={() => setActiveView('search')} 
        style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}
        aria-label="Ir a inicio (Buscador)"
      >
        EcuClima ⛅
      </div>
      
      <div className="nav-links">
         <button className={activeView === 'search' ? 'active' : ''} onClick={() => setActiveView('search')}>
           <Search size={18} /> Buscador
         </button>
         
         <button className={activeView.startsWith('provinces') ? 'active' : ''} onClick={() => setActiveView('provinces_list')}>
           <Menu size={18} /> Provincias
         </button>

         <button className={activeView === 'map' ? 'active' : ''} onClick={() => setActiveView('map')}>
           <MapIcon size={18} /> Mapa Provincial
         </button>

         {/* Botón de alternancia de tema claro/oscuro */}
         <button 
           onClick={toggleTheme} 
           aria-label="Cambiar modo claro o escuro" 
           style={{marginLeft: '0.5rem', padding: '0.5rem', background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
         >
           {theme === 'dark' ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} color="#1e40af" />}
         </button>
      </div>
    </nav>
  );
}

export default Navbar;
