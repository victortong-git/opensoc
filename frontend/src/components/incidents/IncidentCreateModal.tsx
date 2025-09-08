import React, { useState, useEffect } from 'react';
import { X, Bot, Loader2, Sparkles, AlertTriangle, Info, Eye, EyeOff } from 'lucide-react';
import { CreateIncidentRequest } from '../../services/incidentService';
import { AIIncidentFormSuggestions } from '../../services/alertService';
import incidentService from '../../services/incidentService';
import alertService from '../../services/alertService';
import { Alert } from '../../types';
import { useProofReading } from '../../hooks/useProofReading';
import { ProofReadSuggestion, ProofReadIndicator } from '../common/ProofReadComponents';

interface IncidentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (incident: any) => void;
  alertId?: string; // Optional - if creating from alert (legacy)
  sourceAlert?: Alert; // Preferred - full alert object for better AI context
}

const IncidentCreateModal: React.FC<IncidentCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  alertId,
  sourceAlert
}) => {
  // Determine the alert ID to use - prefer sourceAlert.id over alertId
  const effectiveAlertId = sourceAlert?.id || alertId;
  // Form state
  const [formData, setFormData] = useState<CreateIncidentRequest & {
    responseplan?: string;
    impactAssessment?: string;
    recommendedActions?: string[];
    stakeholders?: string[];
    estimatedTimeline?: string;
    investigationPlan?: string;
    containmentStrategy?: string;
  }>({
    title: '',
    description: '',
    severity: 3,
    category: 'malware',
    assignedTo: '',
    alertIds: effectiveAlertId ? [effectiveAlertId] : [],
    metadata: {},
    responseplan: '',
    impactAssessment: '',
    recommendedActions: [],
    stakeholders: [],
    estimatedTimeline: '',
    investigationPlan: '',
    containmentStrategy: ''
  });

  // AI state
  const [aiSuggestions, setAiSuggestions] = useState<AIIncidentFormSuggestions | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiGeneratedFields, setAiGeneratedFields] = useState<Set<string>>(new Set());
  const [showAiIndicators, setShowAiIndicators] = useState(true);

  // Proofreading functionality
  const {
    isProofReading,
    proofReadSuggestions,
    proofReadError,
    showProofReadSuggestions,
    acceptedSuggestions,
    handleProofRead,
    handleAcceptSuggestion,
    handleRejectSuggestion
  } = useProofReading();

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  // Auto-generation removed - user must manually click AI draft button

  // Handle AI generation
  const handleGenerateAISuggestions = async () => {
    if (!effectiveAlertId) {
      setAiError('Alert ID is required for AI generation');
      return;
    }

    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const response = await alertService.generateIncidentForm(effectiveAlertId);
      
      if (response.success && response.suggestions) {
        setAiSuggestions(response.suggestions);
        
        // Pre-fill the form with AI SOC Consultant draft
        const updatedFormData = {
          ...formData,
          title: response.suggestions.title,
          description: response.suggestions.description,
          severity: response.suggestions.severity,
          category: response.suggestions.category,
          responseplan: response.suggestions.responseplan,
          impactAssessment: response.suggestions.impactAssessment,
          recommendedActions: response.suggestions.recommendedActions,
          stakeholders: response.suggestions.stakeholders,
          estimatedTimeline: response.suggestions.estimatedTimeline,
          investigationPlan: response.suggestions.investigationPlan,
          containmentStrategy: response.suggestions.containmentStrategy,
          metadata: {
            ...formData.metadata,
            aiGenerated: true,
            aiConfidence: response.suggestions.confidence,
            sourceAlert: effectiveAlertId
          }
        };
        
        setFormData(updatedFormData);
        
        // Track which fields were AI generated
        setAiGeneratedFields(new Set([
          'title', 'description', 'severity', 'category', 'responseplan',
          'impactAssessment', 'recommendedActions', 'stakeholders',
          'estimatedTimeline', 'investigationPlan', 'containmentStrategy'
        ]));
        
        setShowAdvancedFields(true);
      } else {
        setAiError(response.error || 'AI SOC Consultant failed to draft incident form');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      setAiError('AI service is not available. Please try again later.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Handle AI proofreading using the hook
  const handleCreateProofRead = async () => {
    const fieldsToProofRead = {
      title: formData.title.trim(),
      description: (formData.description || '').trim(),
      responseplan: formData.responseplan?.trim() || '',
      impactAssessment: formData.impactAssessment?.trim() || '',
      investigationPlan: formData.investigationPlan?.trim() || '',
      containmentStrategy: formData.containmentStrategy?.trim() || '',
      estimatedTimeline: formData.estimatedTimeline?.trim() || ''
    };

    await handleProofRead(fieldsToProofRead);
  };

  // Handle accepting a proofreading suggestion using the hook
  const handleCreateAcceptSuggestion = (fieldName: string, suggestedText: string) => {
    handleAcceptSuggestion(fieldName, suggestedText, handleInputChange);
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Remove from AI generated fields if user manually changes
    setAiGeneratedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(field);
      return newSet;
    });
    
    // Clear field error
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    // Description is optional, but warn if empty
    if (!formData.description || !formData.description.trim()) {
      // Don't add to errors, but could add a warning in UI if needed
      console.log('Note: Incident created without description');
    }
    
    if (formData.severity < 1 || formData.severity > 5) {
      newErrors.severity = 'Severity must be between 1 and 5';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Creating incident with data:', {
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        category: formData.category,
        alertIds: formData.alertIds
      });

      // Prepare data for API
      const submitData: CreateIncidentRequest = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        severity: formData.severity,
        category: formData.category,
        assignedTo: formData.assignedTo?.trim() || undefined,
        alertIds: formData.alertIds,
        metadata: {
          ...formData.metadata,
          responseplan: formData.responseplan?.trim() || undefined,
          impactAssessment: formData.impactAssessment?.trim() || undefined,
          recommendedActions: formData.recommendedActions?.filter(action => action.trim()) || [],
          stakeholders: formData.stakeholders?.filter(stakeholder => stakeholder.trim()) || [],
          estimatedTimeline: formData.estimatedTimeline?.trim() || undefined,
          investigationPlan: formData.investigationPlan?.trim() || undefined,
          containmentStrategy: formData.containmentStrategy?.trim() || undefined
        }
      };
      
      console.log('Submitting incident data:', submitData);
      const createdIncident = await incidentService.createIncident(submitData);
      console.log('Incident created successfully:', createdIncident);
      
      onSuccess(createdIncident);
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        severity: 3,
        category: 'malware',
        assignedTo: '',
        alertIds: effectiveAlertId ? [effectiveAlertId] : [],
        metadata: {},
        responseplan: '',
        impactAssessment: '',
        recommendedActions: [],
        stakeholders: [],
        estimatedTimeline: '',
        investigationPlan: '',
        containmentStrategy: ''
      });
      setAiSuggestions(null);
      setAiGeneratedFields(new Set());
    } catch (error: any) {
      console.error('Failed to create incident:', error);
      
      // Extract more specific error message
      let errorMessage = 'Failed to create incident. Please try again.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 400) {
        errorMessage = 'Invalid incident data. Please check all required fields.';
      } else if (error?.response?.status === 401) {
        errorMessage = 'You are not authorized to create incidents. Please log in again.';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // AI Indicator component
  const AIIndicator: React.FC<{ field: string }> = ({ field }) => {
    if (!showAiIndicators || !aiGeneratedFields.has(field)) return null;
    
    return (
      <div className="inline-flex items-center space-x-1 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded px-2 py-1 ml-2">
        <Sparkles className="h-3 w-3" />
        <span>AI Generated</span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-soc-dark-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <h2 className="text-xl font-semibold text-white">
              {effectiveAlertId ? 'Create Incident from Alert' : 'Create New Incident'}
            </h2>
            {aiSuggestions && (
              <div className="flex items-center space-x-2 text-sm text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1">
                <Bot className="h-4 w-4" />
                <span>AI-Powered</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* AI Indicators Toggle */}
            <button
              onClick={() => setShowAiIndicators(!showAiIndicators)}
              className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-800 rounded-lg"
              title={showAiIndicators ? 'Hide AI indicators' : 'Show AI indicators'}
            >
              {showAiIndicators ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-800 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* AI Controls */}
        <div className="p-4 bg-soc-dark-950 border-b border-soc-dark-700 flex-shrink-0 space-y-3">
          {/* AI Generation Controls (Alert-specific) */}
          {effectiveAlertId && (
            <div className="space-y-3">
              {!aiSuggestions && !isGeneratingAI && (
                <button
                  onClick={handleGenerateAISuggestions}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Bot className="h-4 w-4" />
                  <span>Draft by AI SOC Consultant</span>
                </button>
              )}
              
              {isGeneratingAI && (
                <div className="flex items-center space-x-2 text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI SOC Consultant analyzing alert and drafting incident...</span>
                </div>
              )}
              
              {aiError && (
                <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{aiError}</span>
                  <button
                    onClick={handleGenerateAISuggestions}
                    className="ml-auto text-sm underline hover:no-underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              
              {aiSuggestions && !isGeneratingAI && (
                <div className="flex items-center justify-between text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4" />
                    <span>AI SOC Consultant draft completed. Review and modify as needed before submitting.</span>
                    <span className="text-xs text-slate-400">
                      (Confidence: {aiSuggestions.confidence}%)
                    </span>
                  </div>
                  <button
                    onClick={handleGenerateAISuggestions}
                    className="btn-secondary flex items-center space-x-1 ml-4"
                    disabled={isGeneratingAI}
                  >
                    <Bot className="h-3 w-3" />
                    <span>Draft Again</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AI Proofreading Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreateProofRead}
              disabled={isProofReading || isGeneratingAI}
              className="btn-secondary flex items-center space-x-2"
            >
              {isProofReading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Proofreading...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Proof Read</span>
                </>
              )}
            </button>

            {Object.keys(proofReadSuggestions).length > 0 && (
              <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded px-2 py-1">
                {Object.keys(proofReadSuggestions).length} suggestions available
              </span>
            )}
          </div>

          {proofReadError && (
            <div className="flex items-center space-x-2 text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <Info className="h-4 w-4" />
              <span>{proofReadError}</span>
            </div>
          )}
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto flex-1 min-h-0">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Basic Information</h3>
              
              {/* Title */}
              <div>
                <div className="flex items-center space-x-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Incident Title *
                  </label>
                  <AIIndicator field="title" />
                  <ProofReadIndicator field="title" acceptedSuggestions={acceptedSuggestions} />
                </div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="input-field w-full mt-1"
                  placeholder="Enter incident title..."
                  required
                />
                {errors.title && (
                  <p className="text-red-400 text-xs mt-1">{errors.title}</p>
                )}
                <ProofReadSuggestion 
                  field="title" 
                  suggestion={proofReadSuggestions.title}
                  onAccept={handleCreateAcceptSuggestion}
                  onReject={handleRejectSuggestion}
                  showSuggestions={showProofReadSuggestions}
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center space-x-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Description
                  </label>
                  <AIIndicator field="description" />
                  <ProofReadIndicator field="description" acceptedSuggestions={acceptedSuggestions} />
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="input-field w-full mt-1 h-24 resize-none"
                  placeholder="Describe the incident (optional)..."
                />
                {errors.description && (
                  <p className="text-red-400 text-xs mt-1">{errors.description}</p>
                )}
                <ProofReadSuggestion 
                  field="description" 
                  suggestion={proofReadSuggestions.description}
                  onAccept={handleCreateAcceptSuggestion}
                  onReject={handleRejectSuggestion}
                  showSuggestions={showProofReadSuggestions}
                />
              </div>

              {/* Severity and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Severity *
                    </label>
                    <AIIndicator field="severity" />
                  </div>
                  <select
                    value={formData.severity}
                    onChange={(e) => handleInputChange('severity', parseInt(e.target.value))}
                    className="input-field w-full mt-1"
                    required
                  >
                    <option value={1}>1 - Low</option>
                    <option value={2}>2 - Medium-Low</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - High</option>
                    <option value={5}>5 - Critical</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Category
                    </label>
                    <AIIndicator field="category" />
                  </div>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value as any)}
                    className="input-field w-full mt-1"
                  >
                    <option value="malware">Malware</option>
                    <option value="intrusion">Intrusion</option>
                    <option value="data_breach">Data Breach</option>
                    <option value="policy_violation">Policy Violation</option>
                    <option value="insider_threat">Insider Threat</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Advanced Fields Toggle */}
            <div className="border-t border-soc-dark-700 pt-4">
              <button
                type="button"
                onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                className="flex items-center space-x-2 text-opensoc-400 hover:text-opensoc-300"
              >
                <span>{showAdvancedFields ? 'Hide' : 'Show'} Advanced Fields</span>
              </button>
            </div>

            {/* Advanced Fields */}
            {showAdvancedFields && (
              <div className="space-y-4">
                {/* Response Plan */}
                <div>
                  <div className="flex items-center space-x-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Response Plan
                    </label>
                    <AIIndicator field="responseplan" />
                    <ProofReadIndicator field="responseplan" acceptedSuggestions={acceptedSuggestions} />
                  </div>
                  <textarea
                    value={formData.responseplan}
                    onChange={(e) => handleInputChange('responseplan', e.target.value)}
                    className="input-field w-full mt-1 h-20 resize-none"
                    placeholder="Incident response plan..."
                  />
                  <ProofReadSuggestion 
                    field="responseplan" 
                    suggestion={proofReadSuggestions.responseplan}
                    onAccept={handleCreateAcceptSuggestion}
                    onReject={handleRejectSuggestion}
                    showSuggestions={showProofReadSuggestions}
                  />
                </div>

                {/* Impact Assessment */}
                <div>
                  <div className="flex items-center space-x-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Impact Assessment
                    </label>
                    <AIIndicator field="impactAssessment" />
                    <ProofReadIndicator field="impactAssessment" acceptedSuggestions={acceptedSuggestions} />
                  </div>
                  <textarea
                    value={formData.impactAssessment}
                    onChange={(e) => handleInputChange('impactAssessment', e.target.value)}
                    className="input-field w-full mt-1 h-20 resize-none"
                    placeholder="Business impact assessment..."
                  />
                  <ProofReadSuggestion 
                    field="impactAssessment" 
                    suggestion={proofReadSuggestions.impactAssessment}
                    onAccept={handleCreateAcceptSuggestion}
                    onReject={handleRejectSuggestion}
                    showSuggestions={showProofReadSuggestions}
                  />
                </div>

                {/* Investigation Plan */}
                <div>
                  <div className="flex items-center space-x-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Investigation Plan
                    </label>
                    <AIIndicator field="investigationPlan" />
                    <ProofReadIndicator field="investigationPlan" acceptedSuggestions={acceptedSuggestions} />
                  </div>
                  <textarea
                    value={formData.investigationPlan}
                    onChange={(e) => handleInputChange('investigationPlan', e.target.value)}
                    className="input-field w-full mt-1 h-20 resize-none"
                    placeholder="Investigation steps and procedures..."
                  />
                  <ProofReadSuggestion 
                    field="investigationPlan" 
                    suggestion={proofReadSuggestions.investigationPlan}
                    onAccept={handleCreateAcceptSuggestion}
                    onReject={handleRejectSuggestion}
                    showSuggestions={showProofReadSuggestions}
                  />
                </div>

                {/* Containment Strategy */}
                <div>
                  <div className="flex items-center space-x-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Containment Strategy
                    </label>
                    <AIIndicator field="containmentStrategy" />
                    <ProofReadIndicator field="containmentStrategy" acceptedSuggestions={acceptedSuggestions} />
                  </div>
                  <textarea
                    value={formData.containmentStrategy}
                    onChange={(e) => handleInputChange('containmentStrategy', e.target.value)}
                    className="input-field w-full mt-1 h-20 resize-none"
                    placeholder="Containment measures and procedures..."
                  />
                  <ProofReadSuggestion 
                    field="containmentStrategy" 
                    suggestion={proofReadSuggestions.containmentStrategy}
                    onAccept={handleCreateAcceptSuggestion}
                    onReject={handleRejectSuggestion}
                    showSuggestions={showProofReadSuggestions}
                  />
                </div>

                {/* Timeline */}
                <div>
                  <div className="flex items-center space-x-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Estimated Timeline
                    </label>
                    <AIIndicator field="estimatedTimeline" />
                    <ProofReadIndicator field="estimatedTimeline" acceptedSuggestions={acceptedSuggestions} />
                  </div>
                  <input
                    type="text"
                    value={formData.estimatedTimeline}
                    onChange={(e) => handleInputChange('estimatedTimeline', e.target.value)}
                    className="input-field w-full mt-1"
                    placeholder="e.g., 4-8 hours for initial response..."
                  />
                  <ProofReadSuggestion 
                    field="estimatedTimeline" 
                    suggestion={proofReadSuggestions.estimatedTimeline}
                    onAccept={handleCreateAcceptSuggestion}
                    onReject={handleRejectSuggestion}
                    showSuggestions={showProofReadSuggestions}
                  />
                </div>
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded p-3">
                {errors.submit}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-soc-dark-700 bg-soc-dark-950 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>Create Incident</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncidentCreateModal;