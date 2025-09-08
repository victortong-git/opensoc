import React, { useState, useEffect } from 'react';
import { Search, Filter, ExternalLink, Sparkles, Brain, Loader2 } from 'lucide-react';
import { 
  AttackTechnique, 
  searchTechniques, 
  getTactics, 
  getPlatforms,
  formatTechniqueId,
  getTechniqueUrl,
  getTacticColor,
  getPlatformIcon 
} from '../../services/attackService';

interface TechniqueSelectorProps {
  onTechniqueSelect: (technique: AttackTechnique) => void;
  selectedTechniques?: AttackTechnique[];
  domain?: string;
  maxSelections?: number;
  showAIAssist?: boolean;
  className?: string;
}

const TechniqueSelector: React.FC<TechniqueSelectorProps> = ({
  onTechniqueSelect,
  selectedTechniques = [],
  domain = 'enterprise',
  maxSelections = 10,
  showAIAssist = true,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [techniques, setTechniques] = useState<AttackTechnique[]>([]);
  const [tactics, setTactics] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [selectedTactic, setSelectedTactic] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [includeSubTechniques, setIncludeSubTechniques] = useState(true);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [domain]);

  // Search techniques when filters change
  useEffect(() => {
    if (searchQuery || selectedTactic || selectedPlatform) {
      searchForTechniques();
    }
  }, [searchQuery, selectedTactic, selectedPlatform, includeSubTechniques]);

  const loadInitialData = async () => {
    try {
      const [tacticsResponse, platformsResponse] = await Promise.all([
        getTactics(domain),
        getPlatforms(domain)
      ]);

      if (tacticsResponse.success) {
        setTactics(tacticsResponse.data);
      }
      
      if (platformsResponse.success) {
        setPlatforms(platformsResponse.data);
      }

      // Load some default techniques
      await searchForTechniques();
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const searchForTechniques = async () => {
    setLoading(true);
    try {
      const response = await searchTechniques({
        query: searchQuery || undefined,
        domain,
        tactic: selectedTactic || undefined,
        platform: selectedPlatform || undefined,
        max_results: 50,
        include_sub_techniques: includeSubTechniques
      });

      if (response.success) {
        setTechniques(response.data);
      }
    } catch (error) {
      console.error('Error searching techniques:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTechniqueClick = (technique: AttackTechnique) => {
    if (selectedTechniques.length >= maxSelections) {
      alert(`Maximum of ${maxSelections} techniques allowed`);
      return;
    }

    const isAlreadySelected = selectedTechniques.some(
      selected => selected.techniqueId === technique.techniqueId
    );

    if (!isAlreadySelected) {
      onTechniqueSelect(technique);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTactic('');
    setSelectedPlatform('');
  };

  const isTechniqueSelected = (techniqueId: string) => {
    return selectedTechniques.some(selected => selected.techniqueId === techniqueId);
  };

  return (
    <div className={`bg-soc-dark-800 border border-soc-dark-600 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-soc-dark-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-opensoc-400" />
            <h3 className="text-lg font-medium text-white">MITRE ATT&CK Techniques</h3>
            <span className="px-2 py-1 text-xs bg-opensoc-600 text-white rounded">
              {domain.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {showAIAssist && (
              <button className="flex items-center space-x-1 text-sm text-opensoc-400 hover:text-opensoc-300">
                <Sparkles className="h-4 w-4" />
                <span>AI Assist</span>
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded ${showFilters ? 'bg-opensoc-600' : 'hover:bg-soc-dark-700'}`}
            >
              <Filter className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search techniques (e.g., persistence, T1055, lateral movement)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-soc-dark-900 border border-soc-dark-600 rounded-md text-white placeholder-slate-400 focus:border-opensoc-500 focus:ring-1 focus:ring-opensoc-500"
          />
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 border-b border-soc-dark-600 bg-soc-dark-900">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Tactic</label>
              <select
                value={selectedTactic}
                onChange={(e) => setSelectedTactic(e.target.value)}
                className="w-full p-2 bg-soc-dark-800 border border-soc-dark-600 rounded text-white"
              >
                <option value="">All Tactics</option>
                {tactics.map(tactic => (
                  <option key={tactic.mitreId} value={tactic.shortName || tactic.name}>
                    {tactic.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Platform</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full p-2 bg-soc-dark-800 border border-soc-dark-600 rounded text-white"
              >
                <option value="">All Platforms</option>
                {platforms.map(platform => (
                  <option key={platform} value={platform}>
                    {getPlatformIcon(platform)} {platform}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Options</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={includeSubTechniques}
                    onChange={(e) => setIncludeSubTechniques(e.target.checked)}
                    className="text-opensoc-500"
                  />
                  <span>Include sub-techniques</span>
                </label>
                <button
                  onClick={clearFilters}
                  className="text-sm text-opensoc-400 hover:text-opensoc-300"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedTechniques.length > 0 && (
        <div className="p-4 border-b border-soc-dark-600 bg-opensoc-900/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">
              {selectedTechniques.length} of {maxSelections} techniques selected
            </span>
            <div className="flex flex-wrap gap-1">
              {selectedTechniques.slice(0, 3).map(technique => (
                <span
                  key={technique.techniqueId}
                  className="px-2 py-1 text-xs bg-opensoc-600 text-white rounded"
                >
                  {technique.techniqueId}
                </span>
              ))}
              {selectedTechniques.length > 3 && (
                <span className="px-2 py-1 text-xs bg-slate-600 text-white rounded">
                  +{selectedTechniques.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Techniques List */}
      <div className="max-h-96 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-opensoc-400" />
            <span className="ml-2 text-slate-400">Searching techniques...</span>
          </div>
        )}

        {!loading && techniques.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            No techniques found. Try adjusting your search or filters.
          </div>
        )}

        {!loading && techniques.length > 0 && (
          <div className="divide-y divide-soc-dark-600">
            {techniques.map(technique => {
              const isSelected = isTechniqueSelected(technique.techniqueId);
              
              return (
                <div
                  key={technique.techniqueId}
                  className={`p-4 hover:bg-soc-dark-700 cursor-pointer transition-colors ${
                    isSelected ? 'bg-opensoc-900/30 border-l-4 border-opensoc-500' : ''
                  }`}
                  onClick={() => handleTechniqueClick(technique)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-mono text-sm text-opensoc-400">
                          {formatTechniqueId(technique.techniqueId)}
                        </span>
                        {technique.isSubTechnique && (
                          <span className="px-1.5 py-0.5 text-xs bg-purple-600 text-white rounded">
                            SUB
                          </span>
                        )}
                        <a
                          href={getTechniqueUrl(technique.techniqueId, domain)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <h4 className="text-white font-medium text-sm mb-1">
                        {technique.name}
                      </h4>
                      <p className="text-slate-400 text-xs line-clamp-2 mb-2">
                        {technique.description}
                      </p>
                      
                      {/* Tactics */}
                      {technique.tactics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {technique.tactics.map(tactic => (
                            <span
                              key={tactic}
                              className={`px-2 py-0.5 text-xs rounded border ${getTacticColor(tactic)}`}
                            >
                              {tactic.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Platforms */}
                      {technique.platforms.length > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-slate-400">
                          <span>Platforms:</span>
                          {technique.platforms.slice(0, 3).map(platform => (
                            <span key={platform} className="flex items-center space-x-1">
                              <span>{getPlatformIcon(platform)}</span>
                              <span>{platform}</span>
                            </span>
                          ))}
                          {technique.platforms.length > 3 && (
                            <span className="text-slate-500">
                              +{technique.platforms.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {isSelected && (
                      <div className="ml-2 text-opensoc-400">
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-soc-dark-600 bg-soc-dark-900 text-xs text-slate-500">
        {techniques.length > 0 && (
          <span>
            Showing {techniques.length} techniques • 
            Data from MITRE ATT&CK {domain} domain
          </span>
        )}
      </div>
    </div>
  );
};

export default TechniqueSelector;