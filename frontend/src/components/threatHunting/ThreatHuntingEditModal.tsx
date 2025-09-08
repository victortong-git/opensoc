import React, { useState, useEffect } from 'react';
import { X, Edit, AlertTriangle, Save, Sparkles } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { closeEditModal } from '../../store/threatHuntingSlice';
import { updateThreatHuntingEvent } from '../../store/threatHuntingAsync';
import { ThreatHuntingEvent } from '../../services/threatHuntingService';
import MitreAttackEnhancement from './MitreAttackEnhancement';

interface ThreatHuntingEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ThreatHuntingEvent | null;
}

interface FormData {
  name: string;
  description: string;
  huntingType: 'proactive' | 'reactive' | 'intel_driven' | 'scheduled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  scope: string;
  hypothesis: string;
  confidence: 'low' | 'medium' | 'high' | 'very_high';
  severity: number;
  estimatedHours: number;
  actualHours: number;
  targetAssets: string[];
  huntingTechniques: string[];
  mitreTactics: string[];
  mitreTechniques: string[];
  tags: string[];
  methodology?: string;
  recommendations?: string;
}

const ThreatHuntingEditModal: React.FC<ThreatHuntingEditModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { eventLoading } = useSelector((state: RootState) => state.threatHunting);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    huntingType: 'proactive',
    priority: 'medium',
    status: 'planned',
    scope: '',
    hypothesis: '',
    confidence: 'medium',
    severity: 3,
    estimatedHours: 8,
    actualHours: 0,
    targetAssets: [],
    huntingTechniques: [],
    mitreTactics: [],
    mitreTechniques: [],
    tags: [],
    methodology: '',
    recommendations: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Populate form with event data when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        description: event.description,
        huntingType: event.huntingType,
        priority: event.priority,
        status: event.status,
        scope: event.scope,
        hypothesis: event.hypothesis || '',
        confidence: event.confidence,
        severity: event.severity,
        estimatedHours: event.estimatedHours || 8,
        actualHours: event.actualHours || 0,
        targetAssets: event.targetAssets || [],
        huntingTechniques: event.huntingTechniques || [],
        mitreTactics: event.mitreTactics || [],
        mitreTechniques: event.mitreTechniques || [],
        tags: event.tags || [],
        methodology: (event as any).methodology || '',
        recommendations: (event as any).recommendations || '',
      });
    }
  }, [event]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Hunt name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.scope.trim()) {
      newErrors.scope = 'Hunt scope is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !event) {
      return;
    }

    try {
      await dispatch(updateThreatHuntingEvent({
        id: event.id,
        eventData: formData,
      })).unwrap();

      onClose();
    } catch (error) {
      console.error('Failed to update hunting event:', error);
    }
  };

  const handleClose = () => {
    if (!eventLoading) {
      onClose();
      setErrors({});
    }
  };

  if (!isOpen || !event) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'text-blue-400';
      case 'in_progress': return 'text-yellow-400';
      case 'completed': return 'text-green-400';
      case 'cancelled': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-soc-dark-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Edit className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Edit Threat Hunting Event</h2>
              <p className="text-slate-400 text-sm">Update hunting operation details</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={eventLoading}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Hunt Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`input-field w-full ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Enter hunt name"
                disabled={eventLoading}
                required
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as FormData['status'] })}
                className={`input-field w-full ${getStatusColor(formData.status)}`}
                disabled={eventLoading}
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Hunting Type
              </label>
              <select
                name="huntingType"
                value={formData.huntingType}
                onChange={(e) => setFormData({ ...formData, huntingType: e.target.value as FormData['huntingType'] })}
                className="input-field w-full"
                disabled={eventLoading}
              >
                <option value="proactive">Proactive</option>
                <option value="reactive">Reactive</option>
                <option value="intel_driven">Intel Driven</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as FormData['priority'] })}
                className="input-field w-full"
                disabled={eventLoading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confidence Level
              </label>
              <select
                name="confidence"
                value={formData.confidence}
                onChange={(e) => setFormData({ ...formData, confidence: e.target.value as FormData['confidence'] })}
                className="input-field w-full"
                disabled={eventLoading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="very_high">Very High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Severity (1-5)
              </label>
              <input
                type="number"
                name="severity"
                min="1"
                max="5"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value) })}
                className="input-field w-full"
                disabled={eventLoading}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`input-field w-full h-32 resize-none ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Describe the threat hunting event and objectives"
              disabled={eventLoading}
              required
            />
            {errors.description && (
              <p className="text-red-400 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Scope and Hypothesis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Hunt Scope *
              </label>
              <textarea
                name="scope"
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                className={`input-field w-full h-24 resize-none ${errors.scope ? 'border-red-500' : ''}`}
                placeholder="Define the scope and boundaries of the hunt"
                disabled={eventLoading}
                required
              />
              {errors.scope && (
                <p className="text-red-400 text-sm mt-1">{errors.scope}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Hypothesis
              </label>
              <textarea
                name="hypothesis"
                value={formData.hypothesis}
                onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
                className="input-field w-full h-24 resize-none"
                placeholder="State your hunting hypothesis"
                disabled={eventLoading}
              />
            </div>
          </div>

          {/* Time Tracking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                name="estimatedHours"
                min="1"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) })}
                className="input-field w-full"
                disabled={eventLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Actual Hours
              </label>
              <input
                type="number"
                name="actualHours"
                min="0"
                value={formData.actualHours}
                onChange={(e) => setFormData({ ...formData, actualHours: parseInt(e.target.value) })}
                className="input-field w-full"
                disabled={eventLoading}
              />
            </div>
          </div>

          {/* Methodology */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Methodology
            </label>
            <textarea
              name="methodology"
              value={formData.methodology}
              onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
              className="input-field w-full h-32 resize-none"
              placeholder="Describe the hunting methodology and approach"
              disabled={eventLoading}
            />
          </div>

          {/* Recommendations */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Recommendations
            </label>
            <textarea
              name="recommendations"
              value={formData.recommendations}
              onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
              className="input-field w-full h-24 resize-none"
              placeholder="Recommendations and next steps"
              disabled={eventLoading}
            />
          </div>

          {/* MITRE ATT&CK Enhancement Section */}
          {event && (
            <div className="bg-soc-dark-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-400" />
                MITRE ATT&CK Enhancement
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Use AI to enhance this hunt with MITRE ATT&CK framework analysis
              </p>
              
              <MitreAttackEnhancement
                huntId={event.id}
                huntData={{
                  name: formData.name,
                  description: formData.description,
                  huntType: formData.huntingType,
                  scope: formData.scope,
                  methodology: formData.methodology,
                  hypothesis: formData.hypothesis,
                  targetSystems: 'Windows enterprise environment'
                }}
                isViewMode={false}
                onEnhancementComplete={(mitreData) => {
                  // Update form with MITRE analysis data
                  setFormData(prev => ({
                    ...prev,
                    methodology: prev.methodology 
                      ? `${prev.methodology}\n\n## MITRE ATT&CK Enhancement\n\n### Mapped Techniques:\n${mitreData.mitreTechniques.join(', ')}\n\n### Mapped Tactics:\n${mitreData.mitreTactics.join(', ')}\n\n### AI Analysis:\n${mitreData.mitreAnalysis}`
                      : `## MITRE ATT&CK Enhancement\n\n### Mapped Techniques:\n${mitreData.mitreTechniques.join(', ')}\n\n### Mapped Tactics:\n${mitreData.mitreTactics.join(', ')}\n\n### AI Analysis:\n${mitreData.mitreAnalysis}`,
                    recommendations: prev.recommendations
                      ? `${prev.recommendations}\n\n## MITRE-Based Recommendations\n\nBased on the mapped MITRE techniques (${mitreData.mitreTechniques.join(', ')}), focus threat hunting efforts on detecting activities related to ${mitreData.mitreTactics.join(', ')} tactics.`
                      : `## MITRE-Based Recommendations\n\nBased on the mapped MITRE techniques (${mitreData.mitreTechniques.join(', ')}), focus threat hunting efforts on detecting activities related to ${mitreData.mitreTactics.join(', ')} tactics.`,
                    mitreTactics: mitreData.mitreTactics,
                    mitreTechniques: mitreData.mitreTechniques
                  }));
                  
                  console.log('🔄 Updated edit modal form with MITRE data:', { 
                    tactics: mitreData.mitreTactics.length, 
                    techniques: mitreData.mitreTechniques.length,
                    analysisLength: mitreData.mitreAnalysis.length
                  });
                }}
              />
              
              {/* Show current MITRE data */}
              {(formData.mitreTactics.length > 0 || formData.mitreTechniques.length > 0) && (
                <div className="mt-4 p-3 bg-soc-dark-700 rounded">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Current MITRE Mappings:</h4>
                  {formData.mitreTactics.length > 0 && (
                    <div className="mb-1">
                      <span className="text-xs text-slate-400">Tactics: </span>
                      <span className="text-xs text-white">{formData.mitreTactics.join(', ')}</span>
                    </div>
                  )}
                  {formData.mitreTechniques.length > 0 && (
                    <div>
                      <span className="text-xs text-slate-400">Techniques: </span>
                      <span className="text-xs text-white">{formData.mitreTechniques.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-soc-dark-700">
          <button
            type="button"
            onClick={handleClose}
            disabled={eventLoading}
            className="btn-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={eventLoading}
            className="btn-primary disabled:opacity-50 flex items-center space-x-2"
          >
            {eventLoading ? (
              <>
                <div className="loading-spinner"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Update Hunt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreatHuntingEditModal;