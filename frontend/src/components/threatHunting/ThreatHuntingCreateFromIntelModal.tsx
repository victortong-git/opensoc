import React, { useState, useEffect } from 'react';
import { X, Bot, Loader2, Sparkles, AlertTriangle, Info, Eye, EyeOff, Search } from 'lucide-react';
import threatIntelService, { ThreatHuntSuggestions, IOC, ThreatActor, Campaign } from '../../services/threatIntelService';
import threatHuntingService from '../../services/threatHuntingService';
import { useProofReading } from '../../hooks/useProofReading';
import { ProofReadSuggestion } from '../common/ProofReadComponents';

interface ThreatHuntingCreateFromIntelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (hunt: any) => void;
  sourceType: 'ioc' | 'threat_actor' | 'campaign';
  sourceId: string;
  sourceData?: IOC | ThreatActor | Campaign;
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

const ThreatHuntingCreateFromIntelModal: React.FC<ThreatHuntingCreateFromIntelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  sourceType,
  sourceId,
  sourceData
}) => {
  // Form state
  const [formData, setFormData] = useState<CreateHuntRequest>({
    title: '',
    description: '',
    priority: 3,
    category: 'network_hunt',
    huntType: 'proactive',
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
  const [aiSuggestions, setAiSuggestions] = useState<ThreatHuntSuggestions | null>(null);
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

  // Handle AI generation
  const handleGenerateAISuggestions = async () => {
    if (!sourceId) {
      setAiError('Source ID is required for AI generation');
      return;
    }

    setIsGeneratingAI(true);
    setAiError(null);

    try {
      let response;
      switch (sourceType) {
        case 'ioc':
          response = await threatIntelService.generateIOCHunt(sourceId);
          break;
        case 'threat_actor':
          response = await threatIntelService.generateThreatActorHunt(sourceId);
          break;
        case 'campaign':
          response = await threatIntelService.generateCampaignHunt(sourceId);
          break;
        default:
          throw new Error('Invalid source type');
      }
      
      if (response.success && response.suggestions) {
        setAiSuggestions(response.suggestions);
        
        // Pre-fill the form with AI suggestions
        const updatedFormData = {
          ...formData,
          title: response.suggestions.title,
          description: response.suggestions.description,
          priority: response.suggestions.priority,
          category: response.suggestions.category,
          huntType: response.suggestions.huntType,
          huntingPlan: response.suggestions.huntingPlan,
          successCriteria: response.suggestions.successCriteria,
          estimatedEffort: response.suggestions.estimatedEffort,
          huntQueries: response.suggestions.huntQueries,
          investigationSteps: response.suggestions.investigationSteps,
          expectedFindings: response.suggestions.expectedFindings,
          mitreTactics: response.suggestions.mitreTactics,
          mitreTechniques: response.suggestions.mitreTechniques,
          threatsDetected: response.suggestions.threatsDetected,
          coverageGaps: response.suggestions.coverageGaps,
          metadata: {
            ...formData.metadata,
            aiGenerated: true,
            aiConfidence: response.suggestions.confidence,
            sourceType: sourceType,
            sourceId: sourceId,
            sourceData: response.sourceIOC || response.sourceThreatActor || response.sourceCampaign
          }
        };
        
        setFormData(updatedFormData);
        
        // Track which fields were AI generated
        setAiGeneratedFields(new Set([
          'title', 'description', 'priority', 'category', 'huntType',
          'huntingPlan', 'successCriteria', 'estimatedEffort', 'huntQueries',
          'investigationSteps', 'expectedFindings', 'mitreTactics',
          'mitreTechniques', 'threatsDetected', 'coverageGaps'
        ]));
        
        setShowAdvancedFields(true);
      } else {
        setAiError(response.error || 'AI Threat Hunt Generator failed to create hunt plan');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      setAiError('AI service is not available. Please try again later.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Handle AI proofreading
  const handleHuntProofRead = async () => {
    const fieldsToProofRead = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      huntingPlan: formData.huntingPlan.trim(),
      successCriteria: formData.successCriteria.trim(),
      estimatedEffort: formData.estimatedEffort.trim(),
      expectedFindings: formData.expectedFindings.trim(),
      coverageGaps: formData.coverageGaps.trim()
    };

    await handleProofRead(fieldsToProofRead);
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
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.priority < 1 || formData.priority > 5) {
      newErrors.priority = 'Priority must be between 1 and 5';
    }

    if (!formData.huntingPlan.trim()) {
      newErrors.huntingPlan = 'Hunting plan is required';
    }

    if (!formData.successCriteria.trim()) {
      newErrors.successCriteria = 'Success criteria is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Map form data to backend model
  const mapFormDataToBackend = () => {
    // Map priority number to enum
    const priorityMap: { [key: number]: string } = {
      1: 'low',
      2: 'low', 
      3: 'medium',
      4: 'high',
      5: 'critical'
    };

    // Create the backend-compatible data structure
    const backendData = {
      name: formData.title,
      description: formData.description,
      huntingType: formData.huntType as 'proactive' | 'reactive' | 'intel_driven' | 'scheduled',
      priority: priorityMap[formData.priority] || 'medium',
      scope: formData.huntingPlan, // Use huntingPlan as scope since it describes what to hunt
      hypothesis: formData.expectedFindings || undefined,
      huntingTechniques: formData.huntQueries,
      relatedThreatIntel: {
        sourceType,
        sourceId,
        sourceData,
        aiGenerated: !!aiSuggestions,
        metadata: formData.metadata
      },
      mitreTactics: formData.mitreTactics,
      mitreTechniques: formData.mitreTechniques,
      planPhase: {
        huntingPlan: formData.huntingPlan,
        successCriteria: formData.successCriteria,
        estimatedEffort: formData.estimatedEffort,
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
        aiGenerated: !!aiSuggestions,
        sourceType,
        sourceId
      }
    };

    return backendData;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Map form data to backend model
      const huntData = mapFormDataToBackend();
      
      // Call the real API to create the hunt
      console.log('🎯 Creating threat hunt:', huntData);
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
      
      // Show user-friendly error message
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
      priority: 3,
      category: 'network_hunt',
      huntType: 'proactive',
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
    setAiSuggestions(null);
    setAiError(null);
    setAiGeneratedFields(new Set());
    setShowAdvancedFields(false);
    setErrors({});
    onClose();
  };

  // Get source display name
  const getSourceDisplayName = () => {
    if (sourceData) {
      switch (sourceType) {
        case 'ioc':
          return `IOC: ${(sourceData as IOC).value}`;
        case 'threat_actor':
          return `Actor: ${(sourceData as ThreatActor).name}`;
        case 'campaign':
          return `Campaign: ${(sourceData as Campaign).name}`;
      }
    }
    return `${sourceType.replace('_', ' ').toUpperCase()}: ${sourceId}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Search className="h-6 w-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Create Threat Hunt</h2>
              <p className="text-sm text-gray-400">From: {getSourceDisplayName()}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1"
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
                  className="text-xs text-gray-400 hover:text-white flex items-center space-x-1"
                >
                  {showAiIndicators ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span>{showAiIndicators ? 'Hide' : 'Show'} AI indicators</span>
                </button>
              </div>
              
              <p className="text-sm text-gray-300 mb-4">
                Generate a comprehensive threat hunting plan based on the selected threat intelligence.
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

            {/* Form Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 - Low</option>
                    <option value={2}>2 - Medium-Low</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - High</option>
                    <option value={5}>5 - Critical</option>
                  </select>
                  {errors.priority && <p className="text-red-400 text-xs mt-1">{errors.priority}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <option value="sector_hunt">Sector Hunt</option>
                    <option value="timeline_hunt">Timeline Hunt</option>
                  </select>
                </div>

                {/* Hunt Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="proactive">Proactive</option>
                    <option value="reactive">Reactive</option>
                    <option value="continuous">Continuous</option>
                  </select>
                </div>

                {/* Estimated Effort */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Estimated Effort
                    {showAiIndicators && aiGeneratedFields.has('estimatedEffort') && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-400">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.estimatedEffort}
                    onChange={(e) => handleInputChange('estimatedEffort', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 2-4 hours"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Describe the threat hunt objectives and context..."
                    />
                    {showProofReadSuggestions && proofReadSuggestions.description && (
                      <ProofReadSuggestion
                        suggestion={proofReadSuggestions.description}
                        onAccept={() => handleHuntAcceptSuggestion('description', proofReadSuggestions.description!.suggestion)}
                        onReject={() => handleRejectSuggestion('description')}
                        isAccepted={acceptedSuggestions.has('description')}
                      />
                    )}
                  </div>
                  {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
                </div>

                {/* Success Criteria */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Define what constitutes a successful hunt..."
                    />
                    {showProofReadSuggestions && proofReadSuggestions.successCriteria && (
                      <ProofReadSuggestion
                        suggestion={proofReadSuggestions.successCriteria}
                        onAccept={() => handleHuntAcceptSuggestion('successCriteria', proofReadSuggestions.successCriteria!.suggestion)}
                        onReject={() => handleRejectSuggestion('successCriteria')}
                        isAccepted={acceptedSuggestions.has('successCriteria')}
                      />
                    )}
                  </div>
                  {errors.successCriteria && <p className="text-red-400 text-xs mt-1">{errors.successCriteria}</p>}
                </div>
              </div>
            </div>

            {/* Advanced Fields Toggle */}
            <div className="flex items-center justify-between border-t border-gray-700 pt-4">
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
              <div className="space-y-6 border-t border-gray-700 pt-6">
                {/* Hunting Plan */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={6}
                      placeholder="Detailed hunting methodology and approach..."
                    />
                    {showProofReadSuggestions && proofReadSuggestions.huntingPlan && (
                      <ProofReadSuggestion
                        suggestion={proofReadSuggestions.huntingPlan}
                        onAccept={() => handleHuntAcceptSuggestion('huntingPlan', proofReadSuggestions.huntingPlan!.suggestion)}
                        onReject={() => handleRejectSuggestion('huntingPlan')}
                        isAccepted={acceptedSuggestions.has('huntingPlan')}
                      />
                    )}
                  </div>
                  {errors.huntingPlan && <p className="text-red-400 text-xs mt-1">{errors.huntingPlan}</p>}
                </div>

                {/* Expected Findings */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expected Findings
                    {showAiIndicators && aiGeneratedFields.has('expectedFindings') && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-400">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.expectedFindings}
                      onChange={(e) => handleInputChange('expectedFindings', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="What we expect to discover during the hunt..."
                    />
                    {showProofReadSuggestions && proofReadSuggestions.expectedFindings && (
                      <ProofReadSuggestion
                        suggestion={proofReadSuggestions.expectedFindings}
                        onAccept={() => handleHuntAcceptSuggestion('expectedFindings', proofReadSuggestions.expectedFindings!.suggestion)}
                        onReject={() => handleRejectSuggestion('expectedFindings')}
                        isAccepted={acceptedSuggestions.has('expectedFindings')}
                      />
                    )}
                  </div>
                </div>

                {/* Coverage Gaps */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Coverage Gaps
                    {showAiIndicators && aiGeneratedFields.has('coverageGaps') && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-400">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.coverageGaps}
                      onChange={(e) => handleInputChange('coverageGaps', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Analysis of potential blind spots and additional hunts needed..."
                    />
                    {showProofReadSuggestions && proofReadSuggestions.coverageGaps && (
                      <ProofReadSuggestion
                        suggestion={proofReadSuggestions.coverageGaps}
                        onAccept={() => handleHuntAcceptSuggestion('coverageGaps', proofReadSuggestions.coverageGaps!.suggestion)}
                        onReject={() => handleRejectSuggestion('coverageGaps')}
                        isAccepted={acceptedSuggestions.has('coverageGaps')}
                      />
                    )}
                  </div>
                </div>

                {/* Hunt Queries */}
                {formData.huntQueries.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                        <div key={index} className="bg-gray-700 border border-gray-600 rounded p-3">
                          <code className="text-sm text-green-400">{query}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Investigation Steps */}
                {formData.investigationSteps.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                          <p className="text-sm text-gray-300">{step}</p>
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
                        <label className="block text-sm font-medium text-gray-300 mb-2">
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
                              {tactic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.mitreTechniques.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
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
                              {technique}
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
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700 bg-gray-800">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
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

export default ThreatHuntingCreateFromIntelModal;