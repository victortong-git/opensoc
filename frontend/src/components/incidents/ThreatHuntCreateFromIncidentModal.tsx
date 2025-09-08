import React, { useState, useEffect } from 'react';
import { X, Bot, Loader2, Sparkles, AlertTriangle, Info, Eye, EyeOff, Search } from 'lucide-react';
import incidentService, { ThreatHuntGenerationResponse } from '../../services/incidentService';
import threatHuntingService from '../../services/threatHuntingService';
import { useProofReading } from '../../hooks/useProofReading';
import { ProofReadSuggestion } from '../common/ProofReadComponents';
import { Incident } from '../../types';

interface ThreatHuntCreateFromIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (hunt: any) => void;
  incident: Incident;
}

interface CreateHuntRequest {
  title: string;
  description: string;
  priority: number;
  category: string;
  huntType: 'proactive' | 'reactive' | 'continuous';
  huntingPlan: string;
  successCriteria: string;
  estimatedEffort: string;
  huntQueries: string[];
  investigationSteps: string[];
  expectedFindings: string;
  mitreTactics: string[];
  mitreTechniques: string[];
  threatsDetected: string[];
  coverageGaps: string;
  metadata?: any;
}

const ThreatHuntCreateFromIncidentModal: React.FC<ThreatHuntCreateFromIncidentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  incident
}) => {
  // Form state
  const [formData, setFormData] = useState<CreateHuntRequest>({
    title: '',
    description: '',
    priority: Math.min(incident.severity + 1, 5),
    category: 'targeted_hunt',
    huntType: 'reactive',
    huntingPlan: '',
    successCriteria: '',
    estimatedEffort: '',
    huntQueries: [],
    investigationSteps: [],
    expectedFindings: '',
    mitreTactics: [],
    mitreTechniques: [],
    threatsDetected: [],
    coverageGaps: '',
    metadata: {}
  });

  // AI state
  const [aiGeneratedData, setAiGeneratedData] = useState<any>(null);
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

  // Initialize form with incident-based defaults
  useEffect(() => {
    if (incident && isOpen) {
      setFormData(prev => ({
        ...prev,
        title: `Hunt: ${incident.title}`,
        priority: Math.min(incident.severity + 1, 5),
        huntType: incident.status === 'resolved' ? 'reactive' : 'reactive',
        category: getCategoryFromIncident(incident.category),
        metadata: {
          sourceIncidentId: incident.id,
          sourceIncidentTitle: incident.title,
          sourceIncidentSeverity: incident.severity,
          sourceIncidentCategory: incident.category
        }
      }));
    }
  }, [incident, isOpen]);

  // Get appropriate hunt category based on incident category
  const getCategoryFromIncident = (incidentCategory?: string): string => {
    const categoryMapping: Record<string, string> = {
      'malware': 'malware_hunt',
      'intrusion': 'network_hunt', 
      'data_breach': 'behavioral_hunt',
      'policy_violation': 'endpoint_hunt',
      'insider_threat': 'behavioral_hunt'
    };
    return categoryMapping[incidentCategory || ''] || 'targeted_hunt';
  };

  // Handle AI generation
  const handleGenerateAISuggestions = async () => {
    if (!incident.id) {
      setAiError('Incident ID is required for AI generation');
      return;
    }

    setIsGeneratingAI(true);
    setAiError(null);

    try {
      console.log('🎯 FRONTEND MODAL: Calling generateThreatHuntFromIncident for incident:', incident.id);
      const response: ThreatHuntGenerationResponse = await incidentService.generateThreatHuntFromIncident(incident.id);
      
      console.log('🎯 FRONTEND MODAL: Received response in modal');
      console.log('🎯 FRONTEND MODAL: Response object:', response);
      console.log('🎯 FRONTEND MODAL: Response success:', response.success);
      console.log('🎯 FRONTEND MODAL: Response threatHuntData exists:', !!response.threatHuntData);
      
      // Updated validation to work with flattened threatHuntData structure from frontend service
      if (response.success && response.threatHuntData && response.threatHuntData.title) {
        console.log('🎯 FRONTEND MODAL: Processing successful response with threatHuntData');
        console.log('🎯 FRONTEND MODAL: About to call setAiGeneratedData with:', response.threatHuntData);
        setAiGeneratedData(response.threatHuntData);
        
        // Pre-fill the form with AI suggestions  
        // The threat hunt data is now directly in response.threatHuntData (flattened by frontend service)
        const threatHuntResult = response.threatHuntData;
        console.log('🎯 FRONTEND MODAL: Building updated form data...');
        console.log('🎯 FRONTEND MODAL: Threat hunt result keys:', Object.keys(threatHuntResult));
        const updatedFormData = {
          ...formData,
          title: threatHuntResult.title || formData.title,
          description: threatHuntResult.description || '',
          priority: threatHuntResult.priority || formData.priority,
          category: threatHuntResult.category || formData.category,
          huntType: threatHuntResult.huntType || formData.huntType,
          huntingPlan: threatHuntResult.huntingPlan || '',
          successCriteria: threatHuntResult.successCriteria || '',
          estimatedEffort: threatHuntResult.estimatedEffort || '',
          huntQueries: threatHuntResult.huntQueries || [],
          investigationSteps: threatHuntResult.investigationSteps || [],
          expectedFindings: threatHuntResult.expectedFindings || '',
          mitreTactics: threatHuntResult.mitreTactics || [],
          mitreTechniques: threatHuntResult.mitreTechniques || [],
          threatsDetected: threatHuntResult.threatsDetected || [],
          coverageGaps: threatHuntResult.coverageGaps || '',
          metadata: {
            ...formData.metadata,
            ...threatHuntResult.metadata,
            aiGenerated: true,
            aiConfidence: threatHuntResult.confidence,
            processingTimeMs: response.processingTimeMs
          }
        };
        
        console.log('🎯 FRONTEND MODAL: About to update form data');
        console.log('🎯 FRONTEND MODAL: Updated form data title:', updatedFormData.title);
        console.log('🎯 FRONTEND MODAL: Updated form data keys:', Object.keys(updatedFormData));
        setFormData(updatedFormData);
        console.log('🎯 FRONTEND MODAL: Form data updated successfully');
        
        // Track which fields were AI generated
        console.log('🎯 FRONTEND MODAL: Setting AI generated fields...');
        setAiGeneratedFields(new Set([
          'title', 'description', 'priority', 'category', 'huntType',
          'huntingPlan', 'successCriteria', 'estimatedEffort', 'huntQueries',
          'investigationSteps', 'expectedFindings', 'mitreTactics',
          'mitreTechniques', 'threatsDetected', 'coverageGaps'
        ]));
        
        setShowAdvancedFields(true);
        console.log('🎯 FRONTEND MODAL: AI generation completed successfully!');
      } else {
        console.warn('🎯 FRONTEND MODAL: Response failed validation - success:', response.success, 'threatHuntData:', !!response.threatHuntData);
        console.warn('🎯 FRONTEND MODAL: ThreatHuntData success:', response.threatHuntData?.success);
        console.warn('🎯 FRONTEND MODAL: ThreatHuntData error:', response.threatHuntData?.error);
        
        const errorMessage = response.threatHuntData?.error || response.error || 'AI Threat Hunt Generator failed to create hunt plan';
        console.error('🎯 FRONTEND MODAL: Setting error message:', errorMessage);
        setAiError(errorMessage);
      }
    } catch (error: any) {
      console.error('🎯 FRONTEND MODAL: AI generation error:', error);
      console.error('🎯 FRONTEND MODAL: Error details:', error.response?.data);
      setAiError(error.response?.data?.error || 'AI service is not available. Please try again later.');
    } finally {
      setIsGeneratingAI(false);
      console.log('🎯 FRONTEND MODAL: AI generation process finished');
    }
  };

  // Helper function to safely convert values to strings
  const safeStringTrim = (value: any): string => {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      // Try to extract meaningful content from objects
      return (value.name || value.description || value.content || JSON.stringify(value)).toString().trim();
    }
    // Convert other types to string
    return value.toString().trim();
  };

  // Handle AI proofreading
  const handleHuntProofRead = async () => {
    const fieldsToProofRead = {
      title: safeStringTrim(formData.title),
      description: safeStringTrim(formData.description),
      huntingPlan: safeStringTrim(formData.huntingPlan),
      successCriteria: safeStringTrim(formData.successCriteria),
      estimatedEffort: safeStringTrim(formData.estimatedEffort),
      expectedFindings: safeStringTrim(formData.expectedFindings),
      coverageGaps: safeStringTrim(formData.coverageGaps)
    };

    await handleProofRead(fieldsToProofRead, 'threat_hunt');
  };

  // Handle accepting a proofreading suggestion
  const handleHuntAcceptSuggestion = (fieldName: string, suggestedText: string) => {
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
    
    if (!safeStringTrim(formData.title)) {
      newErrors.title = 'Title is required';
    }
    
    if (!safeStringTrim(formData.description)) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.priority < 1 || formData.priority > 5) {
      newErrors.priority = 'Priority must be between 1 and 5';
    }

    if (!safeStringTrim(formData.huntingPlan)) {
      newErrors.huntingPlan = 'Hunting plan is required';
    }

    if (!safeStringTrim(formData.successCriteria)) {
      newErrors.successCriteria = 'Success criteria is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Map form data to backend model
  // Helper function to convert array/string/object to string for backend
  const formatForBackend = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join('\n\n');
    }
    return safeStringTrim(value);
  };

  const mapFormDataToBackend = () => {
    const priorityMap: { [key: number]: string } = {
      1: 'low',
      2: 'low', 
      3: 'medium',
      4: 'high',
      5: 'critical'
    };

    return {
      name: formatForBackend(formData.title),
      description: formatForBackend(formData.description),
      huntingType: formData.huntType as 'proactive' | 'reactive' | 'intel_driven' | 'scheduled',
      priority: priorityMap[formData.priority] || 'medium',
      scope: formatForBackend(formData.huntingPlan),
      hypothesis: formData.expectedFindings ? formatForBackend(formData.expectedFindings) : undefined,
      huntingTechniques: formData.huntQueries,
      relatedThreatIntel: {
        sourceType: 'incident',
        sourceId: incident.id,
        sourceData: incident,
        aiGenerated: !!aiGeneratedData,
        metadata: formData.metadata
      },
      mitreTactics: formData.mitreTactics,
      mitreTechniques: formData.mitreTechniques,
      planPhase: {
        huntingPlan: formatForBackend(formData.huntingPlan),
        successCriteria: formatForBackend(formData.successCriteria),
        estimatedEffort: formatForBackend(formData.estimatedEffort),
        investigationSteps: formData.investigationSteps,
        threatDetected: formData.threatsDetected,
        coverageGaps: formData.coverageGaps
      },
      confidence: 'medium' as const,
      severity: formData.priority,
      tags: [],
      metadata: {
        ...formData.metadata,
        category: formData.category,
        aiGenerated: !!aiGeneratedData,
        sourceType: 'incident',
        sourceId: incident.id
      }
    };
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const huntData = mapFormDataToBackend();
      
      console.log('🎯 Creating threat hunt from incident:', huntData);
      const response = await threatHuntingService.createThreatHuntingEvent(huntData);
      
      if (response.success) {
        console.log('✅ Threat hunt created successfully:', response.data);
        onSuccess(response.data);
        handleClose();
      } else {
        throw new Error(response.message || 'Failed to create threat hunt');
      }
    } catch (error: any) {
      console.error('❌ Hunt creation failed:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create threat hunt. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: Math.min(incident.severity + 1, 5),
      category: 'targeted_hunt',
      huntType: 'reactive',
      huntingPlan: '',
      successCriteria: '',
      estimatedEffort: '',
      huntQueries: [],
      investigationSteps: [],
      expectedFindings: '',
      mitreTactics: [],
      mitreTechniques: [],
      threatsDetected: [],
      coverageGaps: '',
      metadata: {}
    });
    setAiGeneratedData(null);
    setAiError(null);
    setAiGeneratedFields(new Set());
    setShowAdvancedFields(false);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
          <div className="flex items-center space-x-3">
            <Search className="h-6 w-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Create Threat Hunt</h2>
              <p className="text-sm text-slate-400">From Incident: {incident.title}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {/* AI Generation Section */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Bot className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">AI Threat Hunt Generator</span>
                </div>
                <button
                  onClick={() => setShowAiIndicators(!showAiIndicators)}
                  className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
                >
                  {showAiIndicators ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span>{showAiIndicators ? 'Hide' : 'Show'} AI indicators</span>
                </button>
              </div>
              
              <p className="text-sm text-slate-300 mb-4">
                Generate a comprehensive threat hunting plan based on this incident and related alerts.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleGenerateAISuggestions}
                  disabled={isGeneratingAI}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isGeneratingAI ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>{isGeneratingAI ? 'Generating Hunt Plan...' : 'Generate AI Hunt Plan'}</span>
                </button>
                
                {formData.title && (
                  <button
                    onClick={handleHuntProofRead}
                    disabled={isProofReading}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {isProofReading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                    <span>{isProofReading ? 'Proofreading...' : 'AI Proofread'}</span>
                  </button>
                )}
              </div>
              
              {aiError && (
                <div className="mt-3 flex items-start space-x-2 text-red-400 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}
            </div>

            {/* Incident Context */}
            <div className="bg-soc-dark-900/30 border border-soc-dark-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Incident Context</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Severity:</span>
                  <span className="ml-2 text-white">{incident.severity}</span>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <span className="ml-2 text-white capitalize">{incident.status}</span>
                </div>
                <div>
                  <span className="text-slate-400">Category:</span>
                  <span className="ml-2 text-white capitalize">{incident.category?.replace('_', ' ') || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Alert Count:</span>
                  <span className="ml-2 text-white">{incident.alertCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Form Fields - similar to ThreatHuntingCreateFromIntelModal but adapted */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Hunt Title *
                    {showAiIndicators && aiGeneratedFields.has('title') && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-400">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 bg-soc-dark-900 border border-soc-dark-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter hunt title..."
                    />
                    {showProofReadSuggestions && proofReadSuggestions.title && (
                      <ProofReadSuggestion
                        field="title"
                        suggestion={proofReadSuggestions.title.suggestion}
                        onAccept={() => handleHuntAcceptSuggestion('title', proofReadSuggestions.title!.suggestion)}
                        onReject={() => handleRejectSuggestion('title')}
                        showSuggestions={true}
                      />
                    )}
                  </div>
                  {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Priority *
                    {showAiIndicators && aiGeneratedFields.has('priority') && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-400">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </span>
                    )}
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-soc-dark-900 border border-soc-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 - Low</option>
                    <option value={2}>2 - Medium-Low</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - High</option>
                    <option value={5}>5 - Critical</option>
                  </select>
                  {errors.priority && <p className="text-red-400 text-xs mt-1">{errors.priority}</p>}
                </div>

                {/* Category and Hunt Type - similar structure continues... */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Hunt Category *
                    {showAiIndicators && aiGeneratedFields.has('category') && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-400">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </span>
                    )}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-soc-dark-900 border border-soc-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="malware_hunt">Malware Hunt</option>
                    <option value="network_hunt">Network Hunt</option>
                    <option value="endpoint_hunt">Endpoint Hunt</option>
                    <option value="behavioral_hunt">Behavioral Hunt</option>
                    <option value="infrastructure_hunt">Infrastructure Hunt</option>
                    <option value="apt_hunt">APT Hunt</option>
                    <option value="ttp_hunt">TTP Hunt</option>
                    <option value="campaign_hunt">Campaign Hunt</option>
                    <option value="targeted_hunt">Targeted Hunt</option>
                    <option value="timeline_hunt">Timeline Hunt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Hunt Type *
                    {showAiIndicators && aiGeneratedFields.has('huntType') && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-400">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </span>
                    )}
                  </label>
                  <select
                    value={formData.huntType}
                    onChange={(e) => handleInputChange('huntType', e.target.value as 'proactive' | 'reactive' | 'continuous')}
                    className="w-full px-3 py-2 bg-soc-dark-900 border border-soc-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="reactive">Reactive</option>
                    <option value="proactive">Proactive</option>
                    <option value="continuous">Continuous</option>
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description *
                    {showAiIndicators && aiGeneratedFields.has('description') && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-400">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full px-3 py-2 bg-soc-dark-900 border border-soc-dark-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Describe the threat hunt objectives based on the incident..."
                    />
                    {showProofReadSuggestions && proofReadSuggestions.description && (
                      <ProofReadSuggestion
                        field="description"
                        suggestion={proofReadSuggestions.description.suggestion}
                        onAccept={() => handleHuntAcceptSuggestion('description', proofReadSuggestions.description!.suggestion)}
                        onReject={() => handleRejectSuggestion('description')}
                        showSuggestions={true}
                      />
                    )}
                  </div>
                  {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
                </div>

                {/* Success Criteria */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Success Criteria *
                    {showAiIndicators && aiGeneratedFields.has('successCriteria') && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-400">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.successCriteria}
                      onChange={(e) => handleInputChange('successCriteria', e.target.value)}
                      className="w-full px-3 py-2 bg-soc-dark-900 border border-soc-dark-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Define what constitutes a successful hunt..."
                    />
                    {showProofReadSuggestions && proofReadSuggestions.successCriteria && (
                      <ProofReadSuggestion
                        field="successCriteria"
                        suggestion={proofReadSuggestions.successCriteria.suggestion}
                        onAccept={() => handleHuntAcceptSuggestion('successCriteria', proofReadSuggestions.successCriteria!.suggestion)}
                        onReject={() => handleRejectSuggestion('successCriteria')}
                        showSuggestions={true}
                      />
                    )}
                  </div>
                  {errors.successCriteria && <p className="text-red-400 text-xs mt-1">{errors.successCriteria}</p>}
                </div>
              </div>
            </div>

            {/* Advanced Fields Toggle */}
            <div className="flex items-center justify-between border-t border-soc-dark-700 pt-4">
              <button
                onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                <Info className="h-4 w-4" />
                <span>{showAdvancedFields ? 'Hide' : 'Show'} Advanced Fields</span>
              </button>
            </div>

            {/* Advanced Fields */}
            {showAdvancedFields && (
              <div className="space-y-6 border-t border-soc-dark-700 pt-6">
                {/* Hunting Plan */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Hunting Plan *
                    {showAiIndicators && aiGeneratedFields.has('huntingPlan') && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-400">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.huntingPlan}
                      onChange={(e) => handleInputChange('huntingPlan', e.target.value)}
                      className="w-full px-3 py-2 bg-soc-dark-900 border border-soc-dark-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={6}
                      placeholder="Detailed hunting methodology based on incident analysis..."
                    />
                    {showProofReadSuggestions && proofReadSuggestions.huntingPlan && (
                      <ProofReadSuggestion
                        field="huntingPlan"
                        suggestion={proofReadSuggestions.huntingPlan.suggestion}
                        onAccept={() => handleHuntAcceptSuggestion('huntingPlan', proofReadSuggestions.huntingPlan!.suggestion)}
                        onReject={() => handleRejectSuggestion('huntingPlan')}
                        showSuggestions={true}
                      />
                    )}
                  </div>
                  {errors.huntingPlan && <p className="text-red-400 text-xs mt-1">{errors.huntingPlan}</p>}
                </div>

                {/* Hunt Queries */}
                {formData.huntQueries.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Hunt Queries
                      {showAiIndicators && aiGeneratedFields.has('huntQueries') && (
                        <span className="ml-2 inline-flex items-center text-xs text-blue-400">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Generated
                        </span>
                      )}
                    </label>
                    <div className="space-y-2">
                      {formData.huntQueries.map((query, index) => (
                        <div key={index} className="bg-soc-dark-900 border border-soc-dark-700 rounded p-3">
                          <code className="text-sm text-green-400">
                            {typeof query === 'object' && query !== null ? query.name || query.query || query.description || JSON.stringify(query) : query}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Investigation Steps */}
                {formData.investigationSteps.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Investigation Steps
                      {showAiIndicators && aiGeneratedFields.has('investigationSteps') && (
                        <span className="ml-2 inline-flex items-center text-xs text-blue-400">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Generated
                        </span>
                      )}
                    </label>
                    <div className="space-y-2">
                      {formData.investigationSteps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center mt-0.5">
                            {index + 1}
                          </span>
                          <p className="text-sm text-slate-300">
                            {typeof step === 'object' && step !== null ? step.name || step.step || step.description || JSON.stringify(step) : step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MITRE ATT&CK Tags */}
                {(formData.mitreTactics.length > 0 || formData.mitreTechniques.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.mitreTactics.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          MITRE ATT&CK Tactics
                          {showAiIndicators && aiGeneratedFields.has('mitreTactics') && (
                            <span className="ml-2 inline-flex items-center text-xs text-blue-400">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Generated
                            </span>
                          )}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {formData.mitreTactics.map((tactic, index) => (
                            <span key={index} className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
                              {typeof tactic === 'object' && tactic !== null ? tactic.name || tactic.id || tactic.description || JSON.stringify(tactic) : tactic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.mitreTechniques.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          MITRE ATT&CK Techniques
                          {showAiIndicators && aiGeneratedFields.has('mitreTechniques') && (
                            <span className="ml-2 inline-flex items-center text-xs text-blue-400">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Generated
                            </span>
                          )}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {formData.mitreTechniques.map((technique, index) => (
                            <span key={index} className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                              {typeof technique === 'object' && technique !== null ? technique.name || technique.id || technique.description || JSON.stringify(technique) : technique}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-soc-dark-700 bg-soc-dark-800">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span>{isSubmitting ? 'Creating Hunt...' : 'Create Hunt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreatHuntCreateFromIncidentModal;