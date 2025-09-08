import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { Incident } from '../../types';

interface IncidentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (incident: Partial<Incident>) => void;
  incident: Incident | null;
  isLoading?: boolean;
}

const IncidentEditModal: React.FC<IncidentEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  incident,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 3,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    category: 'other' as 'malware' | 'intrusion' | 'data_breach' | 'policy_violation' | 'insider_threat' | 'other',
    status: 'open' as 'open' | 'investigating' | 'contained' | 'resolved',
    assignedTo: '',
    estimatedResolutionTime: '',
    impactAssessment: '',
    responseplan: '',
    investigationPlan: '',
    containmentStrategy: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (incident) {
      setFormData({
        title: incident.title || '',
        description: incident.description || '',
        severity: incident.severity || 3,
        priority: incident.priority || 'medium',
        category: incident.category || 'other',
        status: incident.status || 'open',
        assignedTo: incident.assignedTo || '',
        estimatedResolutionTime: incident.estimatedResolutionTime || '',
        impactAssessment: incident.impactAssessment || '',
        responseplan: incident.responseplan || '',
        investigationPlan: incident.investigationPlan || '',
        containmentStrategy: incident.containmentStrategy || '',
      });
    }
  }, [incident]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'severity' ? parseInt(value, 10) : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.severity < 1 || formData.severity > 5) {
      newErrors.severity = 'Severity must be between 1 and 5';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 5: return 'bg-red-500';
      case 4: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 2: return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isOpen || !incident) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-orange-500 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Incident
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter incident title"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Severity *
              </label>
              <div className="flex items-center space-x-3">
                <select
                  id="severity"
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`px-3 py-2 border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                           disabled:opacity-50 disabled:cursor-not-allowed
                           ${errors.severity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                >
                  <option value={5}>5 - Critical</option>
                  <option value={4}>4 - High</option>
                  <option value={3}>3 - Medium</option>
                  <option value={2}>2 - Low</option>
                  <option value={1}>1 - Info</option>
                </select>
                <div className={`w-4 h-4 rounded ${getSeverityColor(formData.severity)}`}></div>
              </div>
              {errors.severity && <p className="mt-1 text-sm text-red-600">{errors.severity}</p>}
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="malware">Malware</option>
                <option value="intrusion">Intrusion</option>
                <option value="data_breach">Data Breach</option>
                <option value="policy_violation">Policy Violation</option>
                <option value="insider_threat">Insider Threat</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="contained">Contained</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={isLoading}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed
                       ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Enter incident description"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="impactAssessment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Impact Assessment
              </label>
              <textarea
                id="impactAssessment"
                name="impactAssessment"
                value={formData.impactAssessment}
                onChange={handleInputChange}
                disabled={isLoading}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the impact of this incident"
              />
            </div>

            <div>
              <label htmlFor="responseplan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Response Plan
              </label>
              <textarea
                id="responseplan"
                name="responseplan"
                value={formData.responseplan}
                onChange={handleInputChange}
                disabled={isLoading}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the response plan"
              />
            </div>

            <div>
              <label htmlFor="investigationPlan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Investigation Plan
              </label>
              <textarea
                id="investigationPlan"
                name="investigationPlan"
                value={formData.investigationPlan}
                onChange={handleInputChange}
                disabled={isLoading}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the investigation plan"
              />
            </div>

            <div>
              <label htmlFor="containmentStrategy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Containment Strategy
              </label>
              <textarea
                id="containmentStrategy"
                name="containmentStrategy"
                value={formData.containmentStrategy}
                onChange={handleInputChange}
                disabled={isLoading}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the containment strategy"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                       bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 
                       rounded-md hover:bg-gray-50 dark:hover:bg-slate-600
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                       rounded-md disabled:opacity-50 disabled:cursor-not-allowed
                       focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentEditModal;