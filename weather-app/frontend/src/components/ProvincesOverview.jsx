import React from 'react';
import { ecuadorData } from '../data/ecuadorData';
import { onActivateKey } from '../utils/a11y';
import { useI18n } from '../i18n/I18nContext';

const ProvincesOverview = ({ onSelectProvince }) => {
  const { t } = useI18n();

  return (
    <div className="view-container">
      <header>
        <h1>{t('provinces.title')}</h1>
        <p>{t('provinces.subtitle')}</p>
      </header>
      <div
        className="cities-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '2rem',
          width: '100%',
          padding: '1rem',
          justifyItems: 'center',
        }}
      >
        {ecuadorData.map((prov) => (
          <div
            key={prov.province}
            className="mini-city-card glass"
            role="button"
            tabIndex={0}
            onClick={() => onSelectProvince(prov)}
            onKeyDown={onActivateKey(() => onSelectProvince(prov))}
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
            }}
          >
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{prov.province}</h2>
            <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>
              {t('provinces.cantons', { count: prov.cities.length })} &rarr;
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProvincesOverview;
