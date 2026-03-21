import React from 'react';
import { ecuadorData } from '../data/ecuadorData';

const ProvincesOverview = ({ onSelectProvince }) => {
  return (
    <div className="view-container">
       <header>
          <h1>Regiones del Ecuador</h1>
          <p>Selecciona una provincia para explorar sus cantones y clima</p>
       </header>
       <div className="cities-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
          gap: '2rem', 
          width: '100%', 
          padding: '1rem', 
          justifyItems: 'center' 
       }}>
         {ecuadorData.map((prov, i) => (
            <div key={i} className="mini-city-card glass" onClick={() => onSelectProvince(prov)}
               style={{ 
                  width: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  padding: '2rem', 
                  cursor: 'pointer', 
                  borderRadius: '20px', 
                  textAlign: 'center',
                  background: 'var(--glass-bg)',
               }}>
               <h2 style={{fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-main)'}}>{prov.province}</h2>
               <span style={{color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600}}>
                  {prov.cities.length} cantones &rarr;
               </span>
            </div>
         ))}
       </div>
    </div>
  )
}

export default ProvincesOverview;
