import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  AlertTriangle,
  Shield,
  Server,
  Eye,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sliders,
  X,
  Clock,
  Star
} from 'lucide-react';
import { RootState, AppDispatch } from '../../store';
import {
  performSearch,
  setQuery,
  setSearchType,
  setSelectedEntities,
  toggleEntity,
  setLimit,
  setOffset,
  nextPage,
  prevPage,
  resetPagination,
  clearResults
} from '../../store/searchSlice';
import searchService from '../../services/searchService';

const SearchResults: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    query,
    searchType,
    selectedEntities,
    results,
    totalItems,
    pagination,
    isSearching,
    error,
    preferences
  } = useSelector((state: RootState) => state.search);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Available entity types
  const entityTypes = [
    { key: 'alerts', label: 'Alerts', icon: AlertTriangle, color: 'text-red-500' },
    { key: 'incidents', label: 'Incidents', icon: Shield, color: 'text-orange-500' },
    { key: 'assets', label: 'Assets', icon: Server, color: 'text-blue-500' },
    { key: 'iocs', label: 'Threat Intel', icon: Eye, color: 'text-purple-500' },
    { key: 'playbooks', label: 'Playbooks', icon: BookOpen, color: 'text-green-500' }
  ];

  // Initialize from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    const urlType = searchParams.get('type') as 'keyword' | 'vector' | 'hybrid' | null;
    const urlEntities = searchParams.get('entities')?.split(',');

    if (urlQuery && urlQuery !== query) {
      dispatch(setQuery(urlQuery));
    }
    if (urlType && urlType !== searchType) {
      dispatch(setSearchType(urlType));
    }
    if (urlEntities && JSON.stringify(urlEntities) !== JSON.stringify(selectedEntities)) {
      dispatch(setSelectedEntities(urlEntities));
    }

    // Set auth token
    const token = localStorage.getItem('accessToken');
    if (token) {
      searchService.setAuthToken(token);
    }
  }, [searchParams, dispatch]);

  // Perform search when parameters change
  useEffect(() => {
    if (query.trim()) {
      dispatch(performSearch({
        query: query.trim(),
        searchType,
        entities: selectedEntities,
        limit: pagination.limit,
        offset: pagination.offset
      }));
    }
  }, [dispatch, query, searchType, selectedEntities, pagination.limit, pagination.offset]);

  // Update URL when search params change
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (query) newParams.set('q', query);
    if (searchType !== 'hybrid') newParams.set('type', searchType);
    if (selectedEntities.length !== entityTypes.length) {
      newParams.set('entities', selectedEntities.join(','));
    }
    setSearchParams(newParams, { replace: true });
  }, [query, searchType, selectedEntities, setSearchParams]);

  // Handle entity toggle
  const handleEntityToggle = (entityType: string) => {
    dispatch(toggleEntity(entityType));
    dispatch(resetPagination());
  };

  // Handle search type change
  const handleSearchTypeChange = (newType: 'keyword' | 'vector' | 'hybrid') => {
    dispatch(setSearchType(newType));
    dispatch(resetPagination());
  };

  // Handle result click
  const handleResultClick = (result: any) => {
    const route = searchService.getEntityRoute(result.entityType, result.id);
    navigate(route);
  };

  // Get entity icon
  const getEntityIcon = (entityType: string) => {
    const entityConfig = entityTypes.find(e => e.key === entityType);
    if (entityConfig) {
      const IconComponent = entityConfig.icon;
      return <IconComponent className={`h-5 w-5 ${entityConfig.color}`} />;
    }
    return <FileText className="h-5 w-5 text-slate-500" />;
  };

  // Sort results
  const sortResults = (items: any[]) => {
    return [...items].sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'relevance':
          compareValue = (b.searchMeta?.combinedScore || b.searchMeta?.relevanceScore || b.relevanceScore || 0) - 
                        (a.searchMeta?.combinedScore || a.searchMeta?.relevanceScore || a.relevanceScore || 0);
          break;
        case 'date':
          compareValue = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          break;
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  };

  // Render result item
  const renderResultItem = (result: any, entityType: string) => {
    const IconComponent = entityTypes.find(e => e.key === entityType)?.icon || FileText;
    const iconColor = entityTypes.find(e => e.key === entityType)?.color || 'text-slate-500';

    return (
      <div
        key={result.id}
        onClick={() => handleResultClick(result)}
        className="bg-white dark:bg-soc-dark-800 border border-gray-200 dark:border-soc-dark-700 rounded-lg p-6 hover:shadow-md dark:hover:bg-soc-dark-750 transition-all cursor-pointer"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <IconComponent className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                {result.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                {searchService.getEntityDisplayName(entityType)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {result.severity && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                result.severity >= 4 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                result.severity === 3 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
              }`}>
                Severity {result.severity}
              </span>
            )}
            {result.status && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                searchService.getStatusColor(result.status)
              } bg-slate-100 dark:bg-soc-dark-700`}>
                {result.status.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {result.description && (
          <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
            {result.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{new Date(result.updatedAt).toLocaleDateString()}</span>
            </div>
            
            {(result.searchMeta || result.relevanceScore) && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4" />
                <span>{searchService.formatRelevanceScore(result.searchMeta?.relevanceScore || result.relevanceScore || 0)} match</span>
              </div>
            )}
            
            {result.searchMeta?.searchType && (
              <span className="px-2 py-1 bg-slate-100 dark:bg-soc-dark-700 rounded text-xs capitalize">
                {result.searchMeta.searchType}
              </span>
            )}
          </div>

          {/* Entity-specific metadata */}
          <div className="flex items-center space-x-2 text-xs">
            {result.sourceSystem && (
              <span className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                {result.sourceSystem}
              </span>
            )}
            {result.assignedUser && (
              <span className="bg-purple-50 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                {result.assignedUser.firstName} {result.assignedUser.lastName}
              </span>
            )}
            {result.type && (
              <span className="bg-slate-50 dark:bg-soc-dark-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">
                {result.type}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!query.trim()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-soc-dark-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Global Search
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Enter a search query to find alerts, incidents, assets, threat intelligence, and playbooks
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-soc-dark-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Search Results
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {totalItems} results for "{query}"
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-200 dark:bg-soc-dark-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-soc-dark-700 shadow' : ''}`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-soc-dark-700 shadow' : ''}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters
                    ? 'bg-opensoc-50 dark:bg-opensoc-900 border-opensoc-200 dark:border-opensoc-700 text-opensoc-700 dark:text-opensoc-300'
                    : 'bg-white dark:bg-soc-dark-800 border-gray-200 dark:border-soc-dark-700 hover:bg-gray-50 dark:hover:bg-soc-dark-750'
                }`}
              >
                <Sliders className="h-4 w-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white dark:bg-soc-dark-800 border border-gray-200 dark:border-soc-dark-700 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Search Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Type
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'hybrid', label: 'Hybrid (Recommended)', desc: 'Combines keyword and semantic search' },
                      { value: 'keyword', label: 'Keyword', desc: 'Exact text matching' },
                      { value: 'vector', label: 'Semantic', desc: 'AI-powered meaning search' }
                    ].map(({ value, label, desc }) => (
                      <label key={value} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="searchType"
                          value={value}
                          checked={searchType === value}
                          onChange={(e) => handleSearchTypeChange(e.target.value as any)}
                          className="mt-1 h-4 w-4 text-opensoc-600 focus:ring-opensoc-500"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{label}</div>
                          <div className="text-xs text-slate-500">{desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Entity Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Entity Types
                  </label>
                  <div className="space-y-2">
                    {entityTypes.map(({ key, label, icon: IconComponent, color }) => (
                      <label key={key} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEntities.includes(key)}
                          onChange={() => handleEntityToggle(key)}
                          className="h-4 w-4 text-opensoc-600 focus:ring-opensoc-500 rounded"
                        />
                        <IconComponent className={`h-4 w-4 ${color}`} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort Results
                  </label>
                  <div className="space-y-3">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-soc-dark-700 rounded-lg bg-white dark:bg-soc-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-opensoc-500"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="date">Date Modified</option>
                      <option value="title">Title</option>
                    </select>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSortOrder('desc')}
                        className={`flex items-center space-x-1 px-3 py-2 rounded ${
                          sortOrder === 'desc' ? 'bg-opensoc-100 dark:bg-opensoc-900 text-opensoc-700 dark:text-opensoc-300' : ''
                        }`}
                      >
                        <SortDesc className="h-4 w-4" />
                        <span className="text-sm">Desc</span>
                      </button>
                      <button
                        onClick={() => setSortOrder('asc')}
                        className={`flex items-center space-x-1 px-3 py-2 rounded ${
                          sortOrder === 'asc' ? 'bg-opensoc-100 dark:bg-opensoc-900 text-opensoc-700 dark:text-opensoc-300' : ''
                        }`}
                      >
                        <SortAsc className="h-4 w-4" />
                        <span className="text-sm">Asc</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isSearching && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-opensoc-600 mx-auto mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400">Searching...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Results */}
        {!isSearching && totalItems === 0 && query.trim() && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No results found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}

        {!isSearching && Object.entries(results).map(([entityType, entityResults]) => (
          entityResults.items.length > 0 && (
            <div key={entityType} className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                {getEntityIcon(entityType)}
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {searchService.getEntityDisplayName(entityType)}
                </h2>
                <span className="bg-gray-100 dark:bg-soc-dark-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm">
                  {entityResults.count}
                </span>
              </div>

              <div className={`space-y-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : ''}`}>
                {sortResults(entityResults.items).map(result => 
                  renderResultItem(result, entityType)
                )}
              </div>
            </div>
          )
        ))}

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, totalItems)} of {totalItems} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => dispatch(prevPage())}
                disabled={pagination.offset === 0}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-200 dark:border-soc-dark-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-soc-dark-800"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>
              
              <button
                onClick={() => dispatch(nextPage())}
                disabled={!pagination.hasMore}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-200 dark:border-soc-dark-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-soc-dark-800"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;