import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, Filter } from 'lucide-react';

interface ConversationSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
}

const ConversationSearchBar: React.FC<ConversationSearchBarProps> = ({
  onSearch,
  placeholder = 'Search conversations...',
  initialValue = ''
}) => {
  const [query, setQuery] = useState(initialValue);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number>();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('chat_recent_searches');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed.slice(0, 5)); // Keep only 5 most recent
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim() !== initialValue) {
      setIsTyping(true);
      searchTimeoutRef.current = window.setTimeout(() => {
        onSearch(query.trim());
        setIsTyping(false);
        
        // Save to recent searches if not empty
        if (query.trim()) {
          saveRecentSearch(query.trim());
        }
      }, 300);
    }

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, onSearch, initialValue]);

  const saveRecentSearch = (searchQuery: string) => {
    setRecentSearches(prev => {
      const updated = [searchQuery, ...prev.filter(s => s !== searchQuery)].slice(0, 5);
      localStorage.setItem('chat_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('chat_recent_searches');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const filteredRecentSearches = recentSearches.filter(search => 
    search.toLowerCase().includes(query.toLowerCase()) && search !== query
  );

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className={`h-5 w-5 transition-colors ${
            isTyping ? 'text-opensoc-500 animate-pulse' : 'text-slate-400'
          }`} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 bg-soc-dark-800 border border-soc-dark-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-opensoc-500 focus:border-opensoc-500 transition-colors"
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Suggestions */}
      {showSuggestions && (filteredRecentSearches.length > 0 || query) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-soc-dark-800 border border-soc-dark-600 rounded-lg shadow-lg z-10">
          {/* Recent Searches */}
          {filteredRecentSearches.length > 0 && (
            <div className="p-2 border-b border-soc-dark-600">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Recent Searches</span>
                </div>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Clear
                </button>
              </div>
              
              <div className="space-y-1">
                {filteredRecentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full text-left px-2 py-1 text-sm text-slate-300 hover:bg-soc-dark-700 rounded transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Tips */}
          {query && (
            <div className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <span className="text-xs text-slate-400 uppercase tracking-wide">Search Tips</span>
              </div>
              <div className="space-y-1 text-xs text-slate-500">
                <div>• Search by conversation title or message content</div>
                <div>• Use quotes for exact phrases: "incident response"</div>
                <div>• Search is case-insensitive</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click overlay to close suggestions */}
      {showSuggestions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};

export default ConversationSearchBar;