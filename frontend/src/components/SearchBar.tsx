import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../services/api';
import type { AutocompleteResponse } from '../types';

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  autoFocus?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  initialQuery = '', 
  onSearch, 
  autoFocus = false,
  size = 'md' 
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<AutocompleteResponse | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions(null);
        return;
      }

      setLoading(true);
      try {
        const data = await searchApi.autocomplete(query);
        setSuggestions(data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      if (onSearch) {
        onSearch(query.trim());
      } else {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const handleSuggestionClick = (type: string, id: string, text: string) => {
    setShowSuggestions(false);
    if (type === 'book') {
      navigate(`/book/${id}`);
    } else if (type === 'author') {
      navigate(`/author/${id}`);
    } else if (type === 'tag' || type === 'genre') {
      navigate(`/search?${type}s=${encodeURIComponent(text)}`);
    }
  };

  const hasSuggestions = suggestions && (
    suggestions.books.length > 0 || 
    suggestions.authors.length > 0 || 
    suggestions.tags.length > 0 ||
    suggestions.genres.length > 0
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSearch} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="ค้นหาหนังสือ, ผู้แต่ง, แท็ก..."
          autoFocus={autoFocus}
          className={`w-full ${sizeClasses[size]} pl-10 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
        />
        
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Clear/Loading indicator */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {loading ? (
            <svg className="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : query && (
            <button 
              type="button" 
              onClick={() => { setQuery(''); setSuggestions(null); }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && hasSuggestions && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-auto">
          {/* Books */}
          {suggestions?.books.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 px-2 py-1">หนังสือ</div>
              {suggestions.books.map((book) => (
                <button
                  key={book.id}
                  onClick={() => handleSuggestionClick('book', book.id, book.title)}
                  className="w-full flex items-center px-2 py-2 hover:bg-gray-100 rounded-md"
                >
                  {book.cover_image_url ? (
                    <img 
                      src={book.cover_image_url} 
                      alt={book.title}
                      className="w-10 h-14 object-cover rounded mr-3"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-gray-200 rounded mr-3 flex items-center justify-center">
                      <span className="text-xl">📚</span>
                    </div>
                  )}
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{book.title_thai || book.title}</div>
                    <div className="text-sm text-gray-500">{book.type}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Authors */}
          {suggestions?.authors.length > 0 && (
            <div className="p-2 border-t">
              <div className="text-xs font-semibold text-gray-500 px-2 py-1">ผู้แต่ง</div>
              {suggestions.authors.map((author) => (
                <button
                  key={author.id}
                  onClick={() => handleSuggestionClick('author', author.id, author.name)}
                  className="w-full flex items-center px-2 py-2 hover:bg-gray-100 rounded-md"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full mr-3 flex items-center justify-center">
                    <span className="text-primary-600 text-sm">
                      {author.name[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="font-medium text-gray-900">
                    {author.name_thai || author.name}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Tags & Genres */}
          {(suggestions?.tags.length > 0 || suggestions?.genres.length > 0) && (
            <div className="p-2 border-t">
              <div className="text-xs font-semibold text-gray-500 px-2 py-1">แท็กและหมวดหมู่</div>
              <div className="flex flex-wrap gap-2 px-2 py-1">
                {suggestions?.genres.map((genre, index) => (
                  <button
                    key={`genre-${index}`}
                    onClick={() => handleSuggestionClick('genre', '', genre)}
                    className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm hover:bg-primary-200"
                  >
                    {genre}
                  </button>
                ))}
                {suggestions?.tags.map((tag, index) => (
                  <button
                    key={`tag-${index}`}
                    onClick={() => handleSuggestionClick('tag', '', tag)}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
