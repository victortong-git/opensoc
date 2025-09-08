import React, { useState, useEffect } from 'react';
import { X, Target, AlertTriangle, Info, Clock, Users } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { closeCreateModal } from '../../store/threatHuntingSlice';
import { createThreatHuntingEvent } from '../../store/threatHuntingAsync';
import TTPsSelector from './TTPs/TTPsSelector';

interface ThreatHuntingCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  description: string;
  huntingType: 'proactive' | 'reactive' | 'intel_driven' | 'scheduled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scope: string;
  hypothesis: string;
  confidence: 'low' | 'medium' | 'high' | 'very_high';
  severity: number;
  estimatedHours: number;
  targetAssets: string[];
  huntingTechniques: string[];
  mitreTactics: string[];
  mitreTechniques: string[];
  tags: string[];
}

const ThreatHuntingCreateModal: React.FC<ThreatHuntingCreateModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { eventLoading } = useSelector((state: RootState) => state.threatHunting);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    huntingType: 'proactive',
    priority: 'medium',
    scope: '',
    hypothesis: '',
    confidence: 'medium',
    severity: 3,
    estimatedHours: 8,
    targetAssets: [],
    huntingTechniques: [],
    mitreTactics: [],
    mitreTechniques: [],
    tags: [],
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Hunt name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    // Scope and hypothesis are optional for basic hunt creation

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(createThreatHuntingEvent({
        ...formData,
        scope: formData.scope || 'General threat hunting scope',
        status: 'planned',
        isTestData: false,
        metadata: {},
      })).unwrap();

      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to create hunting event:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      huntingType: 'proactive',
      priority: 'medium',
      scope: '',
      hypothesis: '',
      confidence: 'medium',
      severity: 3,
      estimatedHours: 8,
      targetAssets: [],
      huntingTechniques: [],
      mitreTactics: [],
      mitreTechniques: [],
      tags: [],
    });
    setErrors({});
  };

  const handleClose = () => {
    if (!eventLoading) {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-soc-dark-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" role="dialog">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-opensoc-500/20 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-opensoc-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Threat Hunting Event</h2>
              <p className="text-slate-400 text-sm">Plan a new threat hunting operation</p>
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
                Hypothesis *
              </label>
              <textarea
                name="hypothesis"
                value={formData.hypothesis}
                onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
                className={`input-field w-full h-24 resize-none ${errors.hypothesis ? 'border-red-500' : ''}`}
                placeholder="State your hunting hypothesis"
                disabled={eventLoading}
                required
              />
              {errors.hypothesis && (
                <p className="text-red-400 text-sm mt-1">{errors.hypothesis}</p>
              )}
            </div>
          </div>

          {/* Severity and Estimated Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>

          {/* MITRE ATT&CK TTPs Section */}
          <div className="bg-soc-dark-800 rounded-lg p-4">
            <TTPsSelector
              selectedTactics={formData.mitreTactics}
              selectedTechniques={formData.mitreTechniques}
              onTacticsChange={(tactics) => setFormData({ ...formData, mitreTactics: tactics })}
              onTechniquesChange={(techniques) => setFormData({ ...formData, mitreTechniques: techniques })}
              disabled={eventLoading}
            />
          </div>
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
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Target className="h-4 w-4" />
                <span>Create Hunt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreatHuntingCreateModal;