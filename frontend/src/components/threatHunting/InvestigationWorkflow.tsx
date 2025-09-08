import React, { useState } from 'react';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Circle, 
  ChevronRight, 
  ChevronDown,
  Target,
  Database,
  FileText,
  Shield,
  Settings,
  Plus,
  X,
  Trash2
} from 'lucide-react';
import { InvestigationPhase, InvestigationProcedure, ProcedureStep } from '../../types/investigationTypes';

interface InvestigationWorkflowProps {
  phases: InvestigationPhase[];
  onPhasesChange: (phases: InvestigationPhase[]) => void;
  isViewing?: boolean;
  enhancedFields?: Set<string>;
}

const InvestigationWorkflow: React.FC<InvestigationWorkflowProps> = ({
  phases,
  onPhasesChange,
  isViewing = false,
  enhancedFields = new Set()
}) => {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['preparation']));
  const [expandedProcedures, setExpandedProcedures] = useState<Set<string>>(new Set());

  const togglePhaseExpansion = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const toggleProcedureExpansion = (procedureId: string) => {
    const newExpanded = new Set(expandedProcedures);
    if (newExpanded.has(procedureId)) {
      newExpanded.delete(procedureId);
    } else {
      newExpanded.add(procedureId);
    }
    setExpandedProcedures(newExpanded);
  };

  const getPhaseIcon = (phase: InvestigationPhase) => {
    switch (phase.id) {
      case 'preparation': return <Settings className="h-5 w-5" />;
      case 'collection': return <Database className="h-5 w-5" />;
      case 'analysis': return <Target className="h-5 w-5" />;
      case 'documentation': return <FileText className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-900/30 border-red-700';
      case 'high': return 'text-orange-400 bg-orange-900/30 border-orange-700';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
      case 'low': return 'text-blue-400 bg-blue-900/30 border-blue-700';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-900/30 border-green-700';
      case 'in_progress': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
      case 'pending': return 'text-gray-400 bg-gray-900/30 border-gray-600';
      case 'skipped': return 'text-gray-500 bg-gray-800/30 border-gray-600';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-600';
    }
  };

  const addNewProcedure = (phaseId: string) => {
    const newProcedure: InvestigationProcedure = {
      id: `proc_${Date.now()}`,
      title: 'New Procedure',
      description: 'Procedure description',
      type: 'analysis',
      priority: 'medium',
      requiredTools: [],
      expectedOutputs: [],
      dependencies: [],
      timeEstimate: '30 minutes',
      steps: [],
      validationCriteria: [],
      deliverables: []
    };

    const updatedPhases = phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          procedures: [...(phase.procedures || []), newProcedure]
        };
      }
      return phase;
    });

    onPhasesChange(updatedPhases);
  };

  const removeProcedure = (phaseId: string, procedureId: string) => {
    const updatedPhases = phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          procedures: (phase.procedures || []).filter(proc => proc.id !== procedureId)
        };
      }
      return phase;
    });

    onPhasesChange(updatedPhases);
  };

  const updateProcedure = (phaseId: string, procedureId: string, updates: Partial<InvestigationProcedure>) => {
    const updatedPhases = phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          procedures: (phase.procedures || []).map(proc => 
            proc.id === procedureId ? { ...proc, ...updates } : proc
          )
        };
      }
      return phase;
    });

    onPhasesChange(updatedPhases);
  };

  const updatePhase = (phaseId: string, updates: Partial<InvestigationPhase>) => {
    const updatedPhases = phases.map(phase => 
      phase.id === phaseId ? { ...phase, ...updates } : phase
    );
    onPhasesChange(updatedPhases);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Investigation Workflow</h3>
          <p className="text-sm text-gray-400">Professional-grade investigation procedures for security consultants</p>
        </div>
        {enhancedFields.has('investigationWorkflow') && (
          <span className="text-xs bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full">
            ✨ AI Enhanced
          </span>
        )}
      </div>

      {phases.map((phase, phaseIndex) => (
        <div key={phase.id} className="border border-gray-700 rounded-lg overflow-hidden">
          {/* Phase Header */}
          <div className={`p-4 transition-colors ${
            expandedPhases.has(phase.id) ? 'bg-gray-800' : 'bg-gray-800/60'
          } hover:bg-gray-800`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className={`p-2 rounded-lg ${getStatusColor(phase.status)} mt-1`}>
                  {getPhaseIcon(phase)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    {isViewing ? (
                      <h4 className="text-lg font-semibold text-white">{phase.name}</h4>
                    ) : (
                      <input
                        type="text"
                        value={phase.name}
                        onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                        className="text-lg font-semibold bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Phase name..."
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    {isViewing ? (
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(phase.status)}`}>
                        {phase.status.replace('_', ' ').toUpperCase()}
                      </span>
                    ) : (
                      <select
                        value={phase.status}
                        onChange={(e) => updatePhase(phase.id, { status: e.target.value as 'pending' | 'in_progress' | 'completed' | 'skipped' })}
                        className={`px-2 py-1 rounded text-xs bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(phase.status)}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending">PENDING</option>
                        <option value="in_progress">IN PROGRESS</option>
                        <option value="completed">COMPLETED</option>
                        <option value="skipped">SKIPPED</option>
                      </select>
                    )}
                  </div>
                  
                  {isViewing ? (
                    <p className="text-sm text-gray-400">{phase.description}</p>
                  ) : (
                    <textarea
                      value={phase.description}
                      onChange={(e) => updatePhase(phase.id, { description: e.target.value })}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Phase description..."
                      rows={2}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  
                  <div className="flex items-center space-x-4">
                    {isViewing ? (
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>{phase.estimatedDuration}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={phase.estimatedDuration}
                          onChange={(e) => updatePhase(phase.id, { estimatedDuration: e.target.value })}
                          className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="2-4 hours"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">{phase.procedures?.length || 0} procedures</span>
                  <button
                    onClick={() => togglePhaseExpansion(phase.id)}
                    className="p-1 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                    title="Toggle phase details"
                  >
                    {expandedPhases.has(phase.id) ? 
                      <ChevronDown className="h-5 w-5" /> : 
                      <ChevronRight className="h-5 w-5" />
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Phase Content */}
          {expandedPhases.has(phase.id) && (
            <div className="bg-gray-900/50">
              {/* Procedures */}
              <div className="p-4 space-y-4">
                {(phase.procedures || []).map((procedure, procIndex) => (
                  <div key={procedure.id} className="border border-gray-600 rounded-lg bg-gray-800/50">
                    {/* Procedure Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white text-sm rounded-full flex items-center justify-center mt-1">
                            {procIndex + 1}
                          </span>
                          <div className="flex-1 space-y-3">
                            {/* Title and Priority Row */}
                            <div className="flex items-center space-x-3">
                              {isViewing ? (
                                <>
                                  <div className="flex items-center space-x-2">
                                    <h5 className="font-semibold text-white">{procedure.title}</h5>
                                    {enhancedFields.has('investigationWorkflow') && (
                                      <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded">
                                        ✨ AI Enhanced
                                      </span>
                                    )}
                                  </div>
                                  <span className={`px-2 py-1 rounded text-xs border ${getPriorityColor(procedure.priority)}`}>
                                    {procedure.priority.toUpperCase()}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center space-x-2 flex-1">
                                    <input
                                      type="text"
                                      value={procedure.title}
                                      onChange={(e) => updateProcedure(phase.id, procedure.id, { title: e.target.value })}
                                      className={`flex-1 px-2 py-1 bg-gray-700 border rounded text-white text-sm font-semibold focus:outline-none focus:ring-2 ${
                                        enhancedFields.has('investigationWorkflow') 
                                          ? 'border-purple-500 focus:ring-purple-500' 
                                          : 'border-gray-600 focus:ring-blue-500'
                                      }`}
                                      placeholder="Procedure title..."
                                    />
                                    {enhancedFields.has('investigationWorkflow') && (
                                      <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded">
                                        ✨ AI Enhanced
                                      </span>
                                    )}
                                  </div>
                                  <select
                                    value={procedure.priority}
                                    onChange={(e) => updateProcedure(phase.id, procedure.id, { priority: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
                                    className={`px-2 py-1 rounded text-xs border bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${getPriorityColor(procedure.priority)}`}
                                  >
                                    <option value="low">LOW</option>
                                    <option value="medium">MEDIUM</option>
                                    <option value="high">HIGH</option>
                                    <option value="critical">CRITICAL</option>
                                  </select>
                                </>
                              )}
                            </div>
                            
                            {/* Description */}
                            {isViewing ? (
                              <p className="text-sm text-gray-400">{procedure.description}</p>
                            ) : (
                              <textarea
                                value={procedure.description}
                                onChange={(e) => updateProcedure(phase.id, procedure.id, { description: e.target.value })}
                                className={`w-full px-2 py-1 bg-gray-700 border rounded text-white text-sm focus:outline-none focus:ring-2 ${
                                  enhancedFields.has('investigationWorkflow') 
                                    ? 'border-purple-500 focus:ring-purple-500' 
                                    : 'border-gray-600 focus:ring-blue-500'
                                }`}
                                placeholder="Procedure description..."
                                rows={2}
                              />
                            )}
                            
                            {/* Type and Time Estimate Row */}
                            <div className="flex items-center space-x-4">
                              {isViewing ? (
                                <>
                                  <span className="text-xs text-gray-500 capitalize">{procedure.type}</span>
                                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                                    <Clock className="h-4 w-4" />
                                    <span>{procedure.timeEstimate}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <select
                                    value={procedure.type}
                                    onChange={(e) => updateProcedure(phase.id, procedure.id, { type: e.target.value as 'collection' | 'analysis' | 'validation' | 'documentation' })}
                                    className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="collection">Collection</option>
                                    <option value="analysis">Analysis</option>
                                    <option value="validation">Validation</option>
                                    <option value="documentation">Documentation</option>
                                  </select>
                                  <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <input
                                      type="text"
                                      value={procedure.timeEstimate}
                                      onChange={(e) => updateProcedure(phase.id, procedure.id, { timeEstimate: e.target.value })}
                                      className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="30 minutes"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {!isViewing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeProcedure(phase.id, procedure.id);
                              }}
                              className="p-1 text-red-400 hover:bg-red-900/20 rounded transition-colors"
                              title="Remove procedure"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => toggleProcedureExpansion(procedure.id)}
                            className="p-1 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                            title="Toggle details"
                          >
                            {expandedProcedures.has(procedure.id) ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Procedure Details */}
                    {expandedProcedures.has(procedure.id) && (
                      <div className="border-t border-gray-600 p-4 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Required Tools */}
                          <div className="bg-gray-900/30 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <Database className="h-4 w-4 text-blue-400" />
                                <span className="text-sm font-medium text-blue-400">Required Tools</span>
                              </div>
                              {!isViewing && (
                                <button
                                  onClick={() => {
                                    const newTools = [...(procedure.requiredTools || []), ''];
                                    updateProcedure(phase.id, procedure.id, { requiredTools: newTools });
                                  }}
                                  className="text-blue-400 hover:text-blue-300 text-xs"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <div className="space-y-2">
                              {(procedure.requiredTools || []).map((tool, idx) => (
                                <div key={idx} className="flex items-center space-x-2">
                                  {isViewing ? (
                                    <span className="text-xs bg-blue-900/20 text-blue-300 px-2 py-1 rounded flex-1">
                                      {tool}
                                    </span>
                                  ) : (
                                    <>
                                      <input
                                        type="text"
                                        value={tool}
                                        onChange={(e) => {
                                          const newTools = [...(procedure.requiredTools || [])];
                                          newTools[idx] = e.target.value;
                                          updateProcedure(phase.id, procedure.id, { requiredTools: newTools });
                                        }}
                                        className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Tool name..."
                                      />
                                      <button
                                        onClick={() => {
                                          const newTools = (procedure.requiredTools || []).filter((_, i) => i !== idx);
                                          updateProcedure(phase.id, procedure.id, { requiredTools: newTools });
                                        }}
                                        className="text-red-400 hover:text-red-300"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              ))}
                              {(procedure.requiredTools || []).length === 0 && isViewing && (
                                <span className="text-xs text-gray-500 italic">No tools specified</span>
                              )}
                            </div>
                          </div>

                          {/* Expected Outputs */}
                          <div className="bg-gray-900/30 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <Target className="h-4 w-4 text-green-400" />
                                <span className="text-sm font-medium text-green-400">Expected Outputs</span>
                              </div>
                              {!isViewing && (
                                <button
                                  onClick={() => {
                                    const newOutputs = [...(procedure.expectedOutputs || []), ''];
                                    updateProcedure(phase.id, procedure.id, { expectedOutputs: newOutputs });
                                  }}
                                  className="text-green-400 hover:text-green-300 text-xs"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <div className="space-y-2">
                              {(procedure.expectedOutputs || []).map((output, idx) => (
                                <div key={idx} className="flex items-start space-x-2">
                                  {isViewing ? (
                                    <div className="text-xs text-gray-300">• {output}</div>
                                  ) : (
                                    <>
                                      <span className="text-gray-400 text-xs mt-1">•</span>
                                      <input
                                        type="text"
                                        value={output}
                                        onChange={(e) => {
                                          const newOutputs = [...(procedure.expectedOutputs || [])];
                                          newOutputs[idx] = e.target.value;
                                          updateProcedure(phase.id, procedure.id, { expectedOutputs: newOutputs });
                                        }}
                                        className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                                        placeholder="Expected output..."
                                      />
                                      <button
                                        onClick={() => {
                                          const newOutputs = (procedure.expectedOutputs || []).filter((_, i) => i !== idx);
                                          updateProcedure(phase.id, procedure.id, { expectedOutputs: newOutputs });
                                        }}
                                        className="text-red-400 hover:text-red-300 mt-1"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              ))}
                              {(procedure.expectedOutputs || []).length === 0 && isViewing && (
                                <span className="text-xs text-gray-500 italic">No outputs specified</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Validation Criteria */}
                        <div className="bg-yellow-900/10 border border-yellow-800 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4 text-yellow-400" />
                              <span className="text-sm font-medium text-yellow-400">Validation Criteria</span>
                            </div>
                            {!isViewing && (
                              <button
                                onClick={() => {
                                  const newCriteria = [...(procedure.validationCriteria || []), ''];
                                  updateProcedure(phase.id, procedure.id, { validationCriteria: newCriteria });
                                }}
                                className="text-yellow-400 hover:text-yellow-300 text-xs"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {(procedure.validationCriteria || []).map((criteria, idx) => (
                              <div key={idx} className="flex items-start space-x-2">
                                {isViewing ? (
                                  <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-xs text-gray-300">{criteria}</span>
                                  </div>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0 mt-1" />
                                    <input
                                      type="text"
                                      value={criteria}
                                      onChange={(e) => {
                                        const newCriteria = [...(procedure.validationCriteria || [])];
                                        newCriteria[idx] = e.target.value;
                                        updateProcedure(phase.id, procedure.id, { validationCriteria: newCriteria });
                                      }}
                                      className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                      placeholder="Validation criteria..."
                                    />
                                    <button
                                      onClick={() => {
                                        const newCriteria = (procedure.validationCriteria || []).filter((_, i) => i !== idx);
                                        updateProcedure(phase.id, procedure.id, { validationCriteria: newCriteria });
                                      }}
                                      className="text-red-400 hover:text-red-300 mt-1"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            ))}
                            {(procedure.validationCriteria || []).length === 0 && isViewing && (
                              <span className="text-xs text-gray-500 italic">No validation criteria specified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Procedure Button */}
                {!isViewing && (
                  <button
                    onClick={() => addNewProcedure(phase.id)}
                    className="w-full p-3 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Procedure</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default InvestigationWorkflow;