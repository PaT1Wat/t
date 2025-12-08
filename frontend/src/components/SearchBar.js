import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../services/api';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  // Debounced search for autocomplete
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await searchApi.autocomplete(searchQuery);
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'book') {
      navigate(`/book/${suggestion.id}`);
    } else if (suggestion.type === 'author') {
      navigate(`/search?author=${suggestion.id}`);
    }
    setQuery('');
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="ค้นหามังงะ, นิยาย, ผู้แต่ง..."
            className="w-full px-4 py-2 pl-10 pr-4 text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {loading && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.id}-${index}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full flex items-center px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              {suggestion.cover_image_url || suggestion.image_url ? (
                <img
                  src={suggestion.cover_image_url || suggestion.image_url}
                  alt={suggestion.text}
                  className="w-10 h-14 object-cover rounded mr-3"
                />
              ) : (
                <div className="w-10 h-14 bg-gray-200 rounded mr-3 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
              <div className="text-left">
                <p className="text-gray-900 font-medium">{suggestion.text}</p>
                {suggestion.text_thai && suggestion.text !== suggestion.text_thai && (
                  <p className="text-gray-500 text-sm">{suggestion.text_thai}</p>
                )}
                <span className={`text-xs px-2 py-0.5 rounded ${
                  suggestion.type === 'book' ? 'bg-primary-100 text-primary-700' : 'bg-green-100 text-green-700'
                }`}>
                  {suggestion.type === 'book' ? 'หนังสือ' : 'ผู้แต่ง'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
