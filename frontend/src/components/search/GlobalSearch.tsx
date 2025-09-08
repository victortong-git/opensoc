import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  Clock, 
  Filter,
  Settings,
  Loader2,
  AlertTriangle,
  Shield,
  Server,
  Eye,
  BookOpen,
  ArrowRight,
  FileText
} from 'lucide-react';
import { RootState, AppDispatch } from '../../store';
import { 
  performQuickSearch, 
  loadSuggestions,
  setQuery,
  clearQuickResults,
  clearSuggestions,
  addToSearchHistory
} from '../../store/searchSlice';
import searchService from '../../services/searchService';

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
  onResultClick?: (result: any) => void;
  showAdvancedLink?: boolean;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  placeholder = "Search alerts, incidents, assets...",
  className = "",
  onResultClick,
  showAdvancedLink = true
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { 
    query,
    quickResults,
    quickTotalItems,
    quickHasMore,
    suggestions,
    searchHistory,
    isQuickSearching,
    isLoadingSuggestions,
    searchType
  } = useSelector((state: RootState) => state.search);

  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'results' | 'suggestions' | 'history'>('results');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<number>();

  // Initialize search service with auth token
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      searchService.setAuthToken(token);
    }
  }, []);

  // Handle input changes with debounced search
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    dispatch(setQuery(value));
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length >= 2) {
      setShowDropdown(true);
      
      searchTimeoutRef.current = window.setTimeout(() => {
        // Perform quick search and load suggestions in parallel
        dispatch(performQuickSearch({ query: value.trim(), searchType, limit: 5 }));
        dispatch(loadSuggestions({ query: value.trim(), limit: 5 }));
        setActiveTab('results');
      }, 300);
    } else if (value.trim().length === 0) {
      dispatch(clearQuickResults());
      dispatch(clearSuggestions());
      setActiveTab('history');
    }
  }, [dispatch, searchType]);

  // Handle input focus
  const handleFocus = () => {
    setShowDropdown(true);
    if (inputValue.trim().length === 0 && searchHistory.length > 0) {
      setActiveTab('history');
    }
  };

  // Handle input blur (with delay to allow clicks)
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  }, []);

  // Handle clear
  const handleClear = () => {
    setInputValue('');
    dispatch(setQuery(''));
    dispatch(clearQuickResults());
    dispatch(clearSuggestions());
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Handle result click
  const handleResultClick = (result: any) => {
    const route = searchService.getEntityRoute(result.entityType, result.id);
    dispatch(addToSearchHistory(inputValue.trim()));
    setShowDropdown(false);
    
    if (onResultClick) {
      onResultClick(result);
    } else {
      navigate(route);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: any) => {
    setInputValue(suggestion.text);
    dispatch(setQuery(suggestion.text));
    handleInputChange(suggestion.text);
    inputRef.current?.focus();
  };

  // Handle history click
  const handleHistoryClick = (historyQuery: string) => {
    setInputValue(historyQuery);
    dispatch(setQuery(historyQuery));
    handleInputChange(historyQuery);
    inputRef.current?.focus();
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      dispatch(addToSearchHistory(inputValue.trim()));
      setShowDropdown(false);
      if (showAdvancedLink) {
        navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  // Get entity icon component
  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'alerts':
        return <AlertTriangle className="h-4 w-4" />;
      case 'incidents':
        return <Shield className="h-4 w-4" />;
      case 'assets':
        return <Server className="h-4 w-4" />;
      case 'iocs':
        return <Eye className="h-4 w-4" />;
      case 'playbooks':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isQuickSearching ? (
            <Loader2 className="h-5 w-5 text-opensoc-500 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-slate-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-soc-dark-800 border border-gray-200 dark:border-soc-dark-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-opensoc-500 focus:border-transparent transition-colors"
        />

        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Panel */}
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-soc-dark-900 border border-gray-200 dark:border-soc-dark-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-soc-dark-700">
              {inputValue.trim().length >= 2 && (
                <button
                  onClick={() => setActiveTab('results')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'results'
                      ? 'border-opensoc-500 text-opensoc-600 dark:text-opensoc-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Results ({quickTotalItems})
                </button>
              )}
              
              {suggestions.length > 0 && (
                <button
                  onClick={() => setActiveTab('suggestions')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'suggestions'
                      ? 'border-opensoc-500 text-opensoc-600 dark:text-opensoc-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Suggestions
                </button>
              )}
              
              {searchHistory.length > 0 && (
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'history'
                      ? 'border-opensoc-500 text-opensoc-600 dark:text-opensoc-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Recent
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {/* Search Results */}
              {activeTab === 'results' && (
                <div className="py-2">
                  {Object.entries(quickResults).length === 0 && !isQuickSearching && inputValue.trim().length >= 2 && (
                    <div className="px-4 py-6 text-center text-slate-400">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No results found</p>
                    </div>
                  )}
                  
                  {Object.entries(quickResults).map(([entityType, results]) => (
                    <div key={entityType} className="mb-4">
                      <div className="px-4 py-2 bg-slate-50 dark:bg-soc-dark-800 border-b border-gray-100 dark:border-soc-dark-700">
                        <div className="flex items-center space-x-2">
                          {getEntityIcon(entityType)}
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {searchService.getEntityDisplayName(entityType)} ({results.length})
                          </h4>
                        </div>
                      </div>
                      
                      {results.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-soc-dark-800 border-b border-gray-100 dark:border-soc-dark-700 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {result.title}
                              </h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {result.description}
                              </p>
                              <div className="flex items-center space-x-4 mt-2">
                                {result.severity && (
                                  <span className={`text-xs ${searchService.getSeverityColor(result.severity)}`}>
                                    Severity {result.severity}
                                  </span>
                                )}
                                {result.status && (
                                  <span className={`text-xs ${searchService.getStatusColor(result.status)}`}>
                                    {result.status.replace('_', ' ')}
                                  </span>
                                )}
                                <span className="text-xs text-slate-400">
                                  {searchService.formatRelevanceScore(result.searchMeta?.relevanceScore || result.relevanceScore || 0)} match
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-400 ml-3 flex-shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                  
                  {quickHasMore && showAdvancedLink && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-soc-dark-700">
                      <button
                        onClick={() => {
                          navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`);
                          setShowDropdown(false);
                        }}
                        className="w-full text-sm text-opensoc-600 dark:text-opensoc-400 hover:text-opensoc-700 dark:hover:text-opensoc-300 font-medium"
                      >
                        View all results ({quickTotalItems}+)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Suggestions */}
              {activeTab === 'suggestions' && (
                <div className="py-2">
                  {isLoadingSuggestions ? (
                    <div className="px-4 py-6 text-center">
                      <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin text-opensoc-500" />
                      <p className="text-sm text-slate-500">Loading suggestions...</p>
                    </div>
                  ) : (
                    suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-soc-dark-800 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {getEntityIcon(suggestion.entityType)}
                          <div>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {suggestion.text}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                              in {searchService.getEntityDisplayName(suggestion.entityType)}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Search History */}
              {activeTab === 'history' && (
                <div className="py-2">
                  {searchHistory.length === 0 ? (
                    <div className="px-4 py-6 text-center text-slate-400">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No recent searches</p>
                    </div>
                  ) : (
                    searchHistory.map((historyQuery, index) => (
                      <button
                        key={index}
                        onClick={() => handleHistoryClick(historyQuery)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-soc-dark-800 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {historyQuery}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {showAdvancedLink && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-soc-dark-700 bg-gray-50 dark:bg-soc-dark-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Press Enter for advanced search
                  </span>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-400 capitalize">
                      {searchType} search
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GlobalSearch;