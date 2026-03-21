import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { searchCities } from '../api/weatherApi';

const SearchBar = ({ onCitySelect, onClear }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
        if (onClear) onClear();
      } else if (query.trim().length > 2) {
        const results = await searchCities(query);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (city) => {
    setQuery(city.name);
    setShowSuggestions(false);
    onCitySelect({
      name: city.name,
      admin1: city.admin1,
      country: city.country,
      lat: city.latitude,
      lon: city.longitude
    }); 
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) handleSelect(suggestions[0]);
  };

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <form className="search-container" onSubmit={handleFormSubmit}>
        <input
          type="text"
          className="search-input"
          placeholder="Escribe una ciudad y verás opciones..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
          aria-label="Buscar ciudad en Ecuador"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
        />
        <button type="submit" className="search-btn" aria-label="Buscar">
          <Search size={22} />
        </button>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((city) => (
             <div key={city.id} className="suggestion-item" onClick={() => handleSelect(city)}>
               <span className="suggestion-name">{city.name}</span>
               <span className="suggestion-desc">
                 {city.admin1}{city.admin1 ? ', ' : ''}{city.country} 
               </span>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
