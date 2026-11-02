import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { searchCities } from '../api/weatherApi';
import { useI18n } from '../i18n/I18nContext';

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 500;

const SearchBar = ({ onCitySelect, onClear }) => {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errorCode, setErrorCode] = useState('');
  const [searched, setSearched] = useState(false);
  const wrapperRef = useRef(null);

  // Cierra la lista al hacer clic fuera del buscador
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Búsqueda con debounce; se repite al cambiar de idioma y se ignoran respuestas antiguas
  useEffect(() => {
    let isCurrent = true;

    const timer = setTimeout(async () => {
      const term = query.trim();
      setErrorCode('');

      if (term.length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
        setSearched(false);
        onClear?.();
        return;
      }

      if (term.length < MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setShowSuggestions(false);
        setSearched(false);
        return;
      }

      try {
        const results = await searchCities(term, lang);
        if (!isCurrent) return;
        setSuggestions(results);
      } catch (error) {
        if (!isCurrent) return;
        setSuggestions([]);
        setErrorCode(error.code || 'SEARCH_FAILED');
      }
      setSearched(true);
      setShowSuggestions(true);
    }, DEBOUNCE_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [query, lang, onClear]);

  const handleSelect = (city) => {
    setQuery(city.name);
    setShowSuggestions(false);
    onCitySelect({
      name: city.name,
      admin1: city.admin1,
      country: city.country,
      lat: city.latitude,
      lon: city.longitude,
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) handleSelect(suggestions[0]);
  };

  const showEmptyMessage = showSuggestions && searched && !errorCode && suggestions.length === 0;
  const showError = showSuggestions && errorCode;

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <form className="search-container" onSubmit={handleFormSubmit} role="search">
        <input
          type="text"
          className="search-input"
          placeholder={t('search.placeholder')}
          value={query}
          maxLength={100}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          aria-label={t('search.inputLabel')}
          role="combobox"
          aria-controls="city-suggestions"
          aria-expanded={showSuggestions && suggestions.length > 0}
          aria-autocomplete="list"
        />
        <button type="submit" className="search-btn" aria-label={t('search.submit')}>
          <Search size={22} />
        </button>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown" id="city-suggestions" role="listbox">
          {suggestions.map((city) => (
            <div
              key={city.id}
              className="suggestion-item"
              onClick={() => handleSelect(city)}
              role="option"
              aria-selected="false"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(city);
                }
              }}
            >
              <span className="suggestion-name">{city.name}</span>
              <span className="suggestion-desc">
                {city.admin1}
                {city.admin1 ? ', ' : ''}
                {city.country}
              </span>
            </div>
          ))}
        </div>
      )}

      {(showError || showEmptyMessage) && (
        <div className="suggestions-dropdown" role="status">
          <div className="suggestion-item suggestion-empty">
            {showError ? t(`errors.${errorCode}`) : t('search.noResults')}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
