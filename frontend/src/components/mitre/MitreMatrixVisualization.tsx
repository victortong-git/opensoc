import React, { useState } from 'react';
import { 
  Grid3X3, 
  Target, 
  Eye, 
  CheckCircle,
  AlertCircle,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import type { MitreTechnique } from '../../services/alertService';

interface MitreMatrixVisualizationProps {
  techniques: MitreTechnique[];
  domain?: 'enterprise' | 'mobile' | 'ics';
  onTechniqueClick?: (technique: MitreTechnique) => void;
}

// MITRE ATT&CK Enterprise Tactics in order
const ENTERPRISE_TACTICS = [
  'reconnaissance',
  'resource-development', 
  'initial-access',
  'execution',
  'persistence',
  'privilege-escalation',
  'defense-evasion',
  'credential-access',
  'discovery',
  'lateral-movement',
  'collection',
  'command-and-control',
  'exfiltration',
  'impact'
];

const TACTIC_COLORS = {
  'reconnaissance': 'bg-purple-500/20 border-purple-500/40',
  'resource-development': 'bg-indigo-500/20 border-indigo-500/40',
  'initial-access': 'bg-blue-500/20 border-blue-500/40',
  'execution': 'bg-cyan-500/20 border-cyan-500/40',
  'persistence': 'bg-green-500/20 border-green-500/40',
  'privilege-escalation': 'bg-yellow-500/20 border-yellow-500/40',
  'defense-evasion': 'bg-orange-500/20 border-orange-500/40',
  'credential-access': 'bg-red-500/20 border-red-500/40',
  'discovery': 'bg-pink-500/20 border-pink-500/40',
  'lateral-movement': 'bg-rose-500/20 border-rose-500/40',
  'collection': 'bg-violet-500/20 border-violet-500/40',
  'command-and-control': 'bg-purple-600/20 border-purple-600/40',
  'exfiltration': 'bg-indigo-600/20 border-indigo-600/40',
  'impact': 'bg-red-600/20 border-red-600/40'
};

const MitreMatrixVisualization: React.FC<MitreMatrixVisualizationProps> = ({
  techniques,
  domain = 'enterprise',
  onTechniqueClick
}) => {
  const [selectedTactic, setSelectedTactic] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showOnlyMapped, setShowOnlyMapped] = useState(true);

  // Group techniques by tactic
  const techniquesByTactic = techniques.reduce((acc, technique) => {
    technique.tactics.forEach(tactic => {
      if (!acc[tactic]) {
        acc[tactic] = [];
      }
      acc[tactic].push(technique);
    });
    return acc;
  }, {} as Record<string, MitreTechnique[]>);

  // Get confidence color for technique
  const getTechniqueConfidenceColor = (technique: MitreTechnique) => {
    const score = technique.confidence_score || 0;
    if (score >= 0.8) return 'bg-green-500 border-green-400';
    if (score >= 0.6) return 'bg-yellow-500 border-yellow-400';
    if (score >= 0.4) return 'bg-orange-500 border-orange-400';
    return 'bg-red-500 border-red-400';
  };

  const resetView = () => {
    setSelectedTactic(null);
    setZoomLevel(1);
    setShowOnlyMapped(true);
  };

  const tactics = showOnlyMapped 
    ? ENTERPRISE_TACTICS.filter(tactic => techniquesByTactic[tactic]?.length > 0)
    : ENTERPRISE_TACTICS;

  const displayedTechniques = selectedTactic 
    ? techniquesByTactic[selectedTactic] || []
    : techniques;

  return (
    <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-soc-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Grid3X3 className="h-5 w-5 text-opensoc-400" />
            <h3 className="text-lg font-medium text-white">MITRE ATT&CK Matrix Visualization</h3>
            <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
              {domain.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowOnlyMapped(!showOnlyMapped)}
              className={`flex items-center space-x-1 px-2 py-1 text-xs rounded border transition-colors ${
                showOnlyMapped
                  ? 'bg-opensoc-500/20 text-opensoc-300 border-opensoc-500/30'
                  : 'bg-slate-500/20 text-slate-300 border-slate-500/30 hover:bg-slate-500/30'
              }`}
            >
              <Filter className="h-3 w-3" />
              <span>Mapped Only</span>
            </button>
            
            <button
              onClick={() => setZoomLevel(Math.min(zoomLevel + 0.2, 2))}
              className="p-1 text-slate-400 hover:text-white hover:bg-soc-dark-700 rounded transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setZoomLevel(Math.max(zoomLevel - 0.2, 0.6))}
              className="p-1 text-slate-400 hover:text-white hover:bg-soc-dark-700 rounded transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            
            <button
              onClick={resetView}
              className="p-1 text-slate-400 hover:text-white hover:bg-soc-dark-700 rounded transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-b border-soc-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-400">Confidence:</span>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded border"></div>
                <span className="text-xs text-slate-400">High (80%+)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded border"></div>
                <span className="text-xs text-slate-400">Medium (60-79%)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-orange-500 rounded border"></div>
                <span className="text-xs text-slate-400">Low (40-59%)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded border"></div>
                <span className="text-xs text-slate-400">Very Low (&lt;40%)</span>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-slate-400">
            {selectedTactic ? (
              <span>Tactic: <span className="text-white capitalize">{selectedTactic.replace('-', ' ')}</span></span>
            ) : (
              <span>{techniques.length} techniques mapped across {Object.keys(techniquesByTactic).length} tactics</span>
            )}
          </div>
        </div>
      </div>

      {/* Matrix View */}
      <div className="p-4" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
        {!selectedTactic ? (
          // Tactic Overview
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {tactics.map(tactic => {
              const tacticTechniques = techniquesByTactic[tactic] || [];
              const hasMapping = tacticTechniques.length > 0;
              
              return (
                <button
                  key={tactic}
                  onClick={() => setSelectedTactic(tactic)}
                  className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    hasMapping
                      ? TACTIC_COLORS[tactic as keyof typeof TACTIC_COLORS] || 'bg-slate-500/20 border-slate-500/40'
                      : 'bg-soc-dark-900/50 border-soc-dark-600 hover:border-soc-dark-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      {hasMapping ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-slate-500" />
                      )}
                    </div>
                    
                    <h4 className="text-sm font-medium text-white mb-1 capitalize">
                      {tactic.replace('-', ' ')}
                    </h4>
                    
                    <div className="text-xs text-slate-400">
                      {tacticTechniques.length} technique{tacticTechniques.length !== 1 ? 's' : ''}
                    </div>
                    
                    {hasMapping && (
                      <div className="mt-2 flex justify-center">
                        <div className="w-8 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded"></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          // Technique Detail View
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-white capitalize flex items-center space-x-2">
                <Target className="h-5 w-5 text-opensoc-400" />
                <span>{selectedTactic.replace('-', ' ')} Techniques</span>
              </h4>
              
              <button
                onClick={() => setSelectedTactic(null)}
                className="text-sm text-opensoc-400 hover:text-opensoc-300 transition-colors"
              >
                ← Back to Matrix
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedTechniques.map(technique => (
                <button
                  key={technique.id}
                  onClick={() => onTechniqueClick?.(technique)}
                  className={`p-3 rounded-lg border-2 text-left transition-all hover:scale-102 hover:shadow-lg ${getTechniqueConfidenceColor(technique)}`}
                >
                  <div className="text-white">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium">{technique.id}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-black/20 rounded">
                        {Math.round((technique.confidence_score || 0) * 100)}%
                      </span>
                    </div>
                    
                    <h5 className="text-sm font-medium mb-2 line-clamp-2">
                      {technique.name}
                    </h5>
                    
                    <p className="text-xs opacity-80 line-clamp-2 mb-2">
                      {technique.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="opacity-70">
                        {technique.platforms.slice(0, 2).join(', ')}
                        {technique.platforms.length > 2 && ' +'}
                      </span>
                      
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>Details</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {displayedTechniques.length === 0 && (
              <div className="text-center py-8">
                <Target className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No techniques mapped for this tactic.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="p-4 border-t border-soc-dark-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-opensoc-400">{techniques.length}</div>
            <div className="text-xs text-slate-400">Total Techniques</div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-green-400">
              {techniques.filter(t => (t.confidence_score || 0) >= 0.7).length}
            </div>
            <div className="text-xs text-slate-400">High Confidence</div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-blue-400">
              {Object.keys(techniquesByTactic).length}
            </div>
            <div className="text-xs text-slate-400">Tactics Covered</div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-purple-400">
              {Math.round((Object.keys(techniquesByTactic).length / ENTERPRISE_TACTICS.length) * 100)}%
            </div>
            <div className="text-xs text-slate-400">Matrix Coverage</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MitreMatrixVisualization;