import React, { useState, useEffect } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import api from '../../../services/api';

interface MitreTactic {
  id: string;
  mitreId: string;
  name: string;
  description: string;
}

interface MitreTechnique {
  id: string;
  mitreId: string;
  name: string;
  description: string;
  platforms: string[];
  dataSources: string[];
  tactic?: {
    id: string;
    mitreId: string;
    name: string;
  };
}

interface TTPsSelectorProps {
  selectedTactics: string[];
  selectedTechniques: string[];
  onTacticsChange: (tactics: string[]) => void;
  onTechniquesChange: (techniques: string[]) => void;
  disabled?: boolean;
}

const TTPsSelector: React.FC<TTPsSelectorProps> = ({
  selectedTactics,
  selectedTechniques,
  onTacticsChange,
  onTechniquesChange,
  disabled = false,
}) => {
  const [tactics, setTactics] = useState<MitreTactic[]>([]);
  const [techniques, setTechniques] = useState<MitreTechnique[]>([]);
  const [filteredTechniques, setFilteredTechniques] = useState<MitreTechnique[]>([]);
  const [tacticsLoading, setTacticsLoading] = useState(false);
  const [techniquesLoading, setTechniquesLoading] = useState(false);
  const [selectedTacticForTechniques, setSelectedTacticForTechniques] = useState<string>('');
  const [techniqueSearchTerm, setTechniqueSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load tactics on component mount
  useEffect(() => {
    loadTactics();
  }, []);

  // Filter techniques when tactic selection or search term changes
  useEffect(() => {
    if (selectedTacticForTechniques && techniques.length > 0) {
      let filtered = techniques.filter(technique => 
        technique.tactic?.mitreId === selectedTacticForTechniques
      );

      if (techniqueSearchTerm) {
        filtered = filtered.filter(technique =>
          technique.name.toLowerCase().includes(techniqueSearchTerm.toLowerCase()) ||
          technique.mitreId.toLowerCase().includes(techniqueSearchTerm.toLowerCase()) ||
          technique.description.toLowerCase().includes(techniqueSearchTerm.toLowerCase())
        );
      }

      setFilteredTechniques(filtered);
    } else {
      setFilteredTechniques([]);
    }
  }, [selectedTacticForTechniques, techniques, techniqueSearchTerm]);

  const loadTactics = async () => {
    setTacticsLoading(true);
    try {
      const response = await api.get('/ttp/tactics');
      if (response.data.success) {
        setTactics(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load MITRE tactics:', error);
    } finally {
      setTacticsLoading(false);
    }
  };

  const loadTechniquesForTactic = async (tacticId: string) => {
    setTechniquesLoading(true);
    try {
      const response = await api.get(`/ttp/techniques?tacticId=${tacticId}`);
      if (response.data.success) {
        setTechniques(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load MITRE techniques:', error);
      setTechniques([]);
    } finally {
      setTechniquesLoading(false);
    }
  };

  const handleTacticSelection = (tacticMitreId: string) => {
    const newSelected = selectedTactics.includes(tacticMitreId)
      ? selectedTactics.filter(t => t !== tacticMitreId)
      : [...selectedTactics, tacticMitreId];
    
    onTacticsChange(newSelected);

    // If selecting for technique view
    if (selectedTacticForTechniques !== tacticMitreId) {
      setSelectedTacticForTechniques(tacticMitreId);
      loadTechniquesForTactic(tacticMitreId);
      setTechniqueSearchTerm('');
    }
  };

  const handleTechniqueSelection = (techniqueId: string) => {
    const newSelected = selectedTechniques.includes(techniqueId)
      ? selectedTechniques.filter(t => t !== techniqueId)
      : [...selectedTechniques, techniqueId];
    
    onTechniquesChange(newSelected);
  };

  const clearSelections = () => {
    onTacticsChange([]);
    onTechniquesChange([]);
    setSelectedTacticForTechniques('');
    setTechniques([]);
    setTechniqueSearchTerm('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-orange-400" />
          <h3 className="text-lg font-medium text-white">MITRE ATT&CK TTPs</h3>
        </div>
        <div className="flex items-center space-x-2">
          {(selectedTactics.length > 0 || selectedTechniques.length > 0) && (
            <button
              onClick={clearSelections}
              disabled={disabled}
              className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-opensoc-400 hover:text-opensoc-300 transition-colors flex items-center space-x-1"
          >
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <p className="text-slate-400 text-sm">
        Select relevant tactics, techniques, and procedures for this hunt
      </p>

      {/* Quick Selection Summary */}
      {(selectedTactics.length > 0 || selectedTechniques.length > 0) && (
        <div className="bg-soc-dark-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Selections:</span>
            <span className="text-sm text-slate-300">
              {selectedTactics.length} tactics, {selectedTechniques.length} techniques
            </span>
          </div>
          
          {selectedTactics.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-slate-400 block mb-1">Tactics:</span>
              <div className="flex flex-wrap gap-1">
                {selectedTactics.map((tacticId) => {
                  const tactic = tactics.find(t => t.mitreId === tacticId);
                  return (
                    <span
                      key={tacticId}
                      className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs flex items-center space-x-1"
                    >
                      <span>{tactic?.name || tacticId}</span>
                      <button
                        onClick={() => handleTacticSelection(tacticId)}
                        disabled={disabled}
                        className="text-blue-400 hover:text-blue-300 disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tactics Selection */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">Tactics</label>
        {tacticsLoading ? (
          <div className="flex items-center space-x-2 text-slate-400">
            <div className="loading-spinner"></div>
            <span>Loading MITRE tactics...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {tactics.map((tactic) => (
              <label
                key={tactic.id}
                className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedTactics.includes(tactic.mitreId)
                    ? 'border-opensoc-500 bg-opensoc-500/10'
                    : 'border-soc-dark-600 hover:border-soc-dark-500'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedTactics.includes(tactic.mitreId)}
                  onChange={() => handleTacticSelection(tactic.mitreId)}
                  disabled={disabled}
                  className="sr-only"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-white">{tactic.name}</span>
                    <span className="text-xs text-slate-400">{tactic.mitreId}</span>
                  </div>
                  {showAdvanced && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{tactic.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Techniques Selection */}
      {showAdvanced && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-400">Techniques</label>
            {selectedTacticForTechniques && (
              <span className="text-xs text-slate-500">
                for {tactics.find(t => t.mitreId === selectedTacticForTechniques)?.name}
              </span>
            )}
          </div>

          {!selectedTacticForTechniques ? (
            <div className="text-slate-500 text-sm p-4 bg-soc-dark-800 rounded-lg text-center">
              Select a tactic above to view available techniques
            </div>
          ) : (
            <div className="space-y-3">
              {/* Technique Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search techniques..."
                  value={techniqueSearchTerm}
                  onChange={(e) => setTechniqueSearchTerm(e.target.value)}
                  className="input-field pl-10 w-full"
                  disabled={disabled || techniquesLoading}
                />
              </div>

              {/* Techniques List */}
              {techniquesLoading ? (
                <div className="flex items-center space-x-2 text-slate-400 p-4">
                  <div className="loading-spinner"></div>
                  <span>Loading techniques...</span>
                </div>
              ) : filteredTechniques.length === 0 ? (
                <div className="text-slate-500 text-sm p-4 bg-soc-dark-800 rounded-lg text-center">
                  {techniqueSearchTerm ? 'No techniques found matching search' : 'No techniques available'}
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredTechniques.map((technique) => (
                    <label
                      key={technique.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTechniques.includes(technique.mitreId)
                          ? 'border-opensoc-500 bg-opensoc-500/10'
                          : 'border-soc-dark-600 hover:border-soc-dark-500'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTechniques.includes(technique.mitreId)}
                        onChange={() => handleTechniqueSelection(technique.mitreId)}
                        disabled={disabled}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-white">{technique.name}</span>
                          <span className="text-xs text-slate-400">{technique.mitreId}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{technique.description}</p>
                        {technique.platforms && technique.platforms.length > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            <span className="text-xs text-slate-500">Platforms:</span>
                            <span className="text-xs text-slate-400">{technique.platforms.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-slate-500 bg-soc-dark-800 rounded-lg p-3">
        <p className="mb-1">
          <strong>Quick mode:</strong> Select tactics to quickly categorize your hunt.
        </p>
        <p>
          <strong>Advanced mode:</strong> Select specific techniques within each tactic for detailed threat modeling.
        </p>
      </div>
    </div>
  );
};

export default TTPsSelector;