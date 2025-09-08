import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { 
  Target, Bot, Loader2, Sparkles, AlertTriangle, Info, Save, ArrowLeft, 
  RefreshCw, Shield, Activity, Clock, Database, ChevronDown, ChevronUp,
  FileText, BarChart3, Settings, ShieldCheck, Edit, Trash2
} from 'lucide-react';
import threatHuntingService from '../services/threatHuntingService';
import threatIntelService from '../services/threatIntelService';
import toastNotificationService from '../services/toastNotificationService';
import MitreAttackEnhancement from '../components/threatHunting/MitreAttackEnhancement';

// Professional Hunt Types from redesigned controller
const HUNT_TYPES = {
  'proactive_exploration': {
    name: 'Proactive Exploration',
    description: 'Open-ended threat discovery and environment exploration'
  },
  'hypothesis_driven': {
    name: 'Hypothesis-Driven Hunt',
    description: 'Specific threat hypothesis testing with measurable outcomes'
  },
  'intel_driven': {
    name: 'Intelligence-Driven Hunt', 
    description: 'Hunt based on external threat intelligence feeds and IOCs'
  },
  'behavioral_analysis': {
    name: 'Behavioral Analysis Hunt',
    description: 'User and system behavior anomaly hunting and analysis'
  },
  'infrastructure_hunt': {
    name: 'Infrastructure Hunt',
    description: 'Network and system-focused threat hunting activities'
  },
  'campaign_tracking': {
    name: 'Campaign Tracking',
    description: 'APT campaign identification and attribution hunting'
  },
  'threat_reaction': {
    name: 'Threat Reaction Hunt',
    description: 'Reactive hunting in response to specific threat indicators'
  },
  'compliance_hunt': {
    name: 'Compliance Hunt',
    description: 'Regulatory compliance verification and audit support'
  },
  'red_team_verification': {
    name: 'Red Team Verification',
    description: 'Validation of detection capabilities and security controls'
  },
  'threat_landscape': {
    name: 'Threat Landscape Hunt',
    description: 'Industry and sector-specific threat analysis'
  }
};

interface ThreatHuntFormData {
  // Core simplified fields matching new schema
  name: string;
  description: string;
  huntType: keyof typeof HUNT_TYPES;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  
  // Professional methodology fields
  hypothesis: string;
  scope: string;
  targetSystems: string;
  timeframe: string;
  methodology: string;
  successCriteria: string;
  businessJustification: string;
  
  // Results fields
  findings: string;
  recommendations: string;
  evidence: string;
  lessonsLearned: string;
  
  // Context from threat intel
  sourceIntelType?: 'ioc' | 'threat_actor' | 'campaign' | 'manual';
  sourceIntelId?: string;
  sourceIntelContext?: any;
  
  // Tags for organization
  tags: string[];
}

interface SourceData {
  type: 'ioc' | 'threat_actor' | 'campaign';
  id: string;
  data?: any;
}

const ThreatHuntCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: huntId } = useParams<{ id?: string }>();
  
  // Determine page mode
  const isCreating = !huntId;
  const isViewing = huntId && searchParams.get('mode') !== 'edit';
  const isEditing = huntId && searchParams.get('mode') === 'edit';
  
  // Extract source information from URL parameters
  const sourceType = searchParams.get('sourceType') as 'ioc' | 'threat_actor' | 'campaign' | null;
  const sourceId = searchParams.get('sourceId');
  
  // Form state using simplified schema
  const [formData, setFormData] = useState<ThreatHuntFormData>({
    name: '',
    description: '',
    huntType: 'proactive_exploration',
    priority: 'medium',
    status: 'planned',
    hypothesis: '',
    scope: '',
    targetSystems: '',
    timeframe: '',
    methodology: '',
    successCriteria: '',
    businessJustification: '',
    findings: '',
    recommendations: '',
    evidence: '',
    lessonsLearned: '',
    tags: []
  });

  // Source data state
  const [sourceData, setSourceData] = useState<SourceData | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);
  
  // Existing hunt data state
  const [existingHunt, setExistingHunt] = useState<any>(null);
  const [loadingHunt, setLoadingHunt] = useState(false);
  
  // Track recently updated fields for visual highlighting
  const [recentlyUpdatedFields, setRecentlyUpdatedFields] = useState<Set<string>>(new Set());
  
  // AI Enhancement tracking
  const [enhancedFields, setEnhancedFields] = useState<Set<string>>(new Set());
  
  // Helper function to get enhanced field styling
  const getFieldClasses = (fieldName: string, baseClasses: string) => {
    const isEnhanced = enhancedFields.has(fieldName);
    const isRecentlyUpdated = recentlyUpdatedFields.has(fieldName);
    
    let additionalClasses = '';
    
    if (isRecentlyUpdated) {
      // Recently updated gets priority styling (green with pulse animation)
      additionalClasses = 'ring-2 ring-green-400 border-green-400 bg-green-50 dark:bg-green-900/20 animate-pulse';
    } else if (isEnhanced) {
      // Enhanced styling (blue)
      additionalClasses = 'ring-2 ring-blue-400 border-blue-400 bg-blue-50 dark:bg-blue-900/20';
    }
    
    return `${baseClasses} ${additionalClasses}`.trim();
  };
  
  // Helper function to render field label with AI enhancement indicator
  const renderFieldLabel = (text: string, fieldName: string, required = false) => {
    const isEnhanced = enhancedFields.has(fieldName);
    const isRecentlyUpdated = recentlyUpdatedFields.has(fieldName);
    
    return (
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {text}{required && <span className="text-red-400 ml-1">*</span>}
        {isEnhanced && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            AI Enhanced
          </span>
        )}
        {isRecentlyUpdated && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 animate-pulse">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Just Updated
          </span>
        )}
      </label>
    );
  };

  // AI state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isEnhancingAI, setIsEnhancingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basic', 'methodology', ...(sourceType && sourceId ? ['source-intel'] : [])])
  );

  // Tab state for improved UX
  const [activeTab, setActiveTab] = useState('overview');

  // Load source data if provided
  useEffect(() => {
    const loadSourceData = async () => {
      if (!sourceType || !sourceId) return;

      setLoadingSource(true);
      try {
        // Load source data and pre-populate form
        let data = null;
        
        switch (sourceType) {
          case 'ioc':
            console.log('Loading IOC:', sourceId);
            try {
              const iocResponse = await threatIntelService.getIOC(sourceId);
              data = iocResponse.ioc;
              console.log('✅ IOC loaded successfully:', data);
            } catch (error) {
              console.error('❌ Failed to load IOC:', error);
              setAiError('Failed to load IOC data for hunt creation');
            }
            break;
          case 'threat_actor':
            console.log('Loading Threat Actor:', sourceId);
            // TODO: Implement getThreatActorById method
            setAiError('Threat Actor loading not yet implemented');
            break;
          case 'campaign':
            console.log('Loading Campaign:', sourceId);
            // TODO: Implement getCampaignById method
            setAiError('Campaign loading not yet implemented');
            break;
        }
        
        if (data) {
          setSourceData({ type: sourceType, id: sourceId, data });
          
          // Pre-populate form with intelligent defaults based on source
          const huntTypeMapping = {
            'ioc': 'intel_driven' as const,
            'threat_actor': 'campaign_tracking' as const,
            'campaign': 'campaign_tracking' as const
          };
          
          // Generate intelligent hunt name and description from threat intel
          let huntName = '';
          let huntDescription = '';
          let huntScope = '';
          
          if (sourceType === 'ioc' && data) {
            huntName = `IOC Investigation: ${data.value || data.indicator || 'Unknown Indicator'}`;
            huntDescription = `Threat hunt investigating IOC "${data.value || data.indicator}" (${data.type || 'unknown type'})${data.description ? '. ' + data.description : ''}`;
            huntScope = `Monitor for presence and activity related to ${data.type || 'indicator'}: ${data.value || data.indicator}`;
          }
          
          setFormData(prev => ({
            ...prev,
            name: huntName || prev.name,
            description: huntDescription || prev.description,
            scope: huntScope || prev.scope,
            huntType: huntTypeMapping[sourceType] || 'intel_driven',
            sourceIntelType: sourceType,
            sourceIntelId: sourceId,
            sourceIntelContext: data
          }));
          
          console.log('✅ Form pre-populated with threat intel context');
        }
      } catch (error) {
        console.error('Failed to load source data:', error);
        setAiError('Failed to load source threat intelligence data');
      } finally {
        setLoadingSource(false);
      }
    };

    loadSourceData();
  }, [sourceType, sourceId]);

  // Load existing hunt data if editing/viewing
  useEffect(() => {
    const loadExistingHunt = async () => {
      if (!huntId) return;

      setLoadingHunt(true);
      try {
        // Use the new simplified API endpoint
        const response = await threatHuntingService.getThreatHuntById(huntId);
        
        if (response.success) {
          const hunt = response.data;
          setExistingHunt(hunt);
          
          // Map hunt data to simplified form structure
          setFormData({
            name: hunt.name || '',
            description: hunt.description || '',
            huntType: hunt.huntType || 'proactive_exploration',
            priority: hunt.priority || 'medium',
            status: hunt.status || 'planned',
            hypothesis: hunt.hypothesis || '',
            scope: hunt.scope || '',
            targetSystems: hunt.targetSystems || '',
            timeframe: hunt.timeframe || '',
            methodology: hunt.methodology || '',
            successCriteria: hunt.successCriteria || '',
            businessJustification: hunt.businessJustification || '',
            findings: hunt.findings || '',
            recommendations: hunt.recommendations || '',
            evidence: hunt.evidence || '',
            lessonsLearned: hunt.lessonsLearned || '',
            sourceIntelType: hunt.sourceIntelType || undefined,
            sourceIntelId: hunt.sourceIntelId || undefined,
            sourceIntelContext: hunt.sourceIntelContext || {},
            tags: hunt.tags || []
          });
        } else {
          throw new Error(response.message || 'Failed to load threat hunt');
        }
      } catch (error: any) {
        console.error('Failed to load existing hunt:', error);
        setAiError(`Failed to load hunt: ${error.message}`);
        navigate('/threat-hunting');
      } finally {
        setLoadingHunt(false);
      }
    };

    loadExistingHunt();
  }, [huntId, navigate]);

  // Generate AI content for new hunts from threat intel
  const handleGenerateAIContent = async () => {
    if (!sourceId || !sourceType) {
      setAiError('Source information is required for AI generation');
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
        // Apply AI suggestions to simplified form
        setFormData(prev => ({
          ...prev,
          name: response.suggestions.title || prev.name,
          description: response.suggestions.description || prev.description,
          huntType: response.suggestions.huntType || prev.huntType,
          priority: response.suggestions.priority || prev.priority,
          hypothesis: response.suggestions.hypothesis || response.suggestions.expectedFindings || prev.hypothesis,
          scope: response.suggestions.scope || response.suggestions.huntingPlan || prev.scope,
          successCriteria: response.suggestions.successCriteria || prev.successCriteria,
          methodology: response.suggestions.methodology || response.suggestions.huntingPlan || prev.methodology,
          businessJustification: response.suggestions.businessJustification || prev.businessJustification
        }));

        toastNotificationService.showNotification({
          title: '🤖 AI Content Generated',
          body: 'Professional threat hunt content generated from threat intelligence'
        });
      }
    } catch (error: any) {
      console.error('AI generation failed:', error);
      setAiError(error.message || 'AI content generation failed');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Enhance existing hunt with AI
  const handleEnhanceWithAI = async () => {
    if (!huntId) {
      setAiError('AI enhancement is only available for existing hunts');
      return;
    }

    setIsEnhancingAI(true);
    setAiError(null);

    try {
      const response = await threatHuntingService.enhanceThreatHuntContent(
        huntId,
        'comprehensive',
        JSON.stringify(formData),
        { huntType: formData.huntType, priority: formData.priority }
      );

      if (response.success && response.enhancement) {
        // Apply AI enhancements to form
        const enhancement = response.enhancement;
        console.log('🔍 Enhancement response structure:', enhancement);
        console.log('🔍 Enhancement keys:', Object.keys(enhancement));
        
        // Track which fields are being updated by AI enhancement
        const updatedFields: string[] = [];
        const newFormData: any = { ...formData };
        
        // Map individual fields from AI response and track updates
        if (enhancement.name && enhancement.name !== formData.name) {
          newFormData.name = enhancement.name;
          updatedFields.push('name');
        }
        if (enhancement.description || enhancement.enhancedContent) {
          const newDescription = enhancement.description || enhancement.enhancedContent;
          if (newDescription !== formData.description) {
            newFormData.description = newDescription;
            updatedFields.push('description');
          }
        }
        if (enhancement.hypothesis && enhancement.hypothesis !== formData.hypothesis) {
          newFormData.hypothesis = enhancement.hypothesis;
          updatedFields.push('hypothesis');
        }
        if (enhancement.methodology) {
          const newMethodology = typeof enhancement.methodology === 'object' 
            ? JSON.stringify(enhancement.methodology, null, 2)
            : enhancement.methodology;
          if (newMethodology !== formData.methodology) {
            newFormData.methodology = newMethodology;
            updatedFields.push('methodology');
          }
        }
        if (enhancement.scope) {
          const newScope = typeof enhancement.scope === 'object' 
            ? JSON.stringify(enhancement.scope, null, 2)
            : enhancement.scope;
          if (newScope !== formData.scope) {
            newFormData.scope = newScope;
            updatedFields.push('scope');
          }
        }
        if (enhancement.successCriteria && enhancement.successCriteria !== formData.successCriteria) {
          newFormData.successCriteria = enhancement.successCriteria;
          updatedFields.push('successCriteria');
        }
        if (enhancement.businessJustification && enhancement.businessJustification !== formData.businessJustification) {
          newFormData.businessJustification = enhancement.businessJustification;
          updatedFields.push('businessJustification');
        }
        if (enhancement.timeframe && enhancement.timeframe !== formData.timeframe) {
          newFormData.timeframe = enhancement.timeframe;
          updatedFields.push('timeframe');
        }
        
        // Update form data
        setFormData(newFormData);
        
        // Mark fields as enhanced and recently updated
        if (updatedFields.length > 0) {
          setEnhancedFields(prev => new Set([...prev, ...updatedFields]));
          setRecentlyUpdatedFields(new Set(updatedFields));
          
          // Clear the recently updated indicator after 5 seconds
          setTimeout(() => {
            setRecentlyUpdatedFields(new Set());
          }, 5000);
          
          console.log(`🔄 AI Enhancement updated ${updatedFields.length} fields:`, updatedFields);
        }

        toastNotificationService.showNotification({
          title: '✨ Hunt Enhanced',
          body: `AI enhanced ${updatedFields.length} fields: ${updatedFields.join(', ')}`
        });
      }
    } catch (error: any) {
      console.error('AI enhancement failed:', error);
      setAiError(error.message || 'AI enhancement failed');
    } finally {
      setIsEnhancingAI(false);
    }
  };

  // Generate hunt using AI from threat intel context
  const handleGenerateWithAI = async () => {
    if (!sourceData || !sourceData.data) {
      setAiError('AI generation requires threat intelligence context');
      return;
    }

    setIsGeneratingAI(true);
    setAiError(null);

    try {
      // Create AI prompt based on threat intel type and data
      let aiPrompt = '';
      let contextData = sourceData.data;
      
      switch (sourceData.type) {
        case 'ioc':
          aiPrompt = `Generate a professional threat hunting methodology for investigating this IOC:
          
IOC Details:
- Indicator: ${contextData.value || contextData.indicator || 'Unknown'}
- Type: ${contextData.type || 'Unknown'}
- Description: ${contextData.description || 'No description available'}
- Confidence: ${contextData.confidence || 'Unknown'}
- Threat Level: ${contextData.threat_level || 'Unknown'}

Please generate:
1. Enhanced hunt name and description
2. Detailed methodology for investigating this IOC
3. Success criteria for the hunt
4. Hypothesis about potential threats
5. Recommended scope and target systems
6. Business justification for the hunt`;
          break;
          
        case 'threat_actor':
          aiPrompt = `Generate a professional threat hunting methodology for tracking this threat actor:
          
Threat Actor: ${contextData.name || 'Unknown'}
Description: ${contextData.description || 'No description available'}

Please generate comprehensive hunt content.`;
          break;
          
        case 'campaign':
          aiPrompt = `Generate a professional threat hunting methodology for investigating this campaign:
          
Campaign: ${contextData.name || 'Unknown'}
Description: ${contextData.description || 'No description available'}

Please generate comprehensive hunt content.`;
          break;
      }

      // Call AI enhancement service with threat intel context
      const response = await threatHuntingService.enhanceThreatHuntContent(
        'ai-generation-placeholder-id',
        'generation', // section name
        aiPrompt, // current content (the prompt)
        { 
          huntType: formData.huntType, 
          priority: formData.priority,
          sourceIntel: sourceData,
          generationType: 'full_hunt_from_intel'
        }
      );

      if (response.success && response.enhancement) {
        const enhancement = response.enhancement;
        
        console.log('🤖 AI Response received:', {
          success: response.success,
          huntId: response.huntId,
          section: response.section,
          enhancementKeys: Object.keys(enhancement),
          enhancement: enhancement
        });
        
        // Defensive check for enhancement data
        if (!enhancement || (typeof enhancement === 'object' && Object.keys(enhancement).length === 0)) {
          console.warn('⚠️ Empty enhancement data received');
          setAiError('AI enhancement returned empty data. Please try again.');
          return;
        }

        // Log current form state before update
        console.log('📋 Form state before AI enhancement:', formData);
        
        // Apply AI-generated content to form with detailed logging
        // Handle nested response structure: enhancement might be in enhancement.result
        const enhancementData = enhancement.result || enhancement;
        console.log('🔍 Enhancement data structure:', {
          hasResult: !!enhancement.result,
          enhancementKeys: Object.keys(enhancement),
          enhancementDataKeys: Object.keys(enhancementData || {})
        });
        
        // Additional defensive check for enhancementData
        if (!enhancementData || (typeof enhancementData === 'object' && Object.keys(enhancementData).length === 0)) {
          console.warn('⚠️ Enhancement data is empty after extracting from response');
          setAiError('AI enhancement data is malformed. Please try again.');
          return;
        }
        
        const updatedFormData = {
          ...formData,
          name: enhancementData.name || enhancementData.enhancedName || enhancementData.enhancedTitle || formData.name,
          description: enhancementData.description || enhancementData.enhancedDescription || formData.description,
          methodology: enhancementData.methodology || enhancementData.enhancedMethodology || enhancementData.enhancedPlan || formData.methodology,
          successCriteria: enhancementData.successCriteria || enhancementData.enhancedCriteria || enhancementData.enhancedSuccessCriteria || formData.successCriteria,
          hypothesis: enhancementData.hypothesis || enhancementData.enhancedHypothesis || formData.hypothesis,
          scope: enhancementData.scope && typeof enhancementData.scope === 'object' 
            ? JSON.stringify(enhancementData.scope, null, 2) 
            : enhancementData.scope || enhancementData.enhancedScope || formData.scope,
          businessJustification: enhancementData.businessJustification || enhancementData.enhancedJustification || enhancementData.enhancedBusinessCase || formData.businessJustification,
          targetSystems: enhancementData.targetSystems || enhancementData.enhancedTargetSystems || formData.targetSystems,
          timeframe: enhancementData.timeframe || enhancementData.enhancedTimeframe || formData.timeframe,
          // Handle nested methodology object if it exists
          ...(enhancementData.methodology && typeof enhancementData.methodology === 'object' 
            ? { methodology: JSON.stringify(enhancementData.methodology, null, 2) } 
            : {})
        };

        // Store original form data for comparison BEFORE state update
        const originalFormData = { ...formData };
        
        // Log field-by-field updates
        console.log('🔄 AI Enhancement field updates:');
        console.log('  📝 Name:', { 
          before: originalFormData.name, 
          after: updatedFormData.name, 
          changed: originalFormData.name !== updatedFormData.name 
        });
        console.log('  📄 Description:', { 
          before: originalFormData.description?.substring(0, 50) + '...', 
          after: updatedFormData.description?.substring(0, 50) + '...', 
          changed: originalFormData.description !== updatedFormData.description 
        });
        console.log('  🔍 Methodology:', { 
          before: originalFormData.methodology?.substring(0, 50) + '...', 
          after: updatedFormData.methodology?.substring(0, 50) + '...', 
          changed: originalFormData.methodology !== updatedFormData.methodology 
        });
        console.log('  💭 Hypothesis:', { 
          before: originalFormData.hypothesis?.substring(0, 50) + '...', 
          after: updatedFormData.hypothesis?.substring(0, 50) + '...', 
          changed: originalFormData.hypothesis !== updatedFormData.hypothesis 
        });
        console.log('  🎯 Scope:', { 
          before: originalFormData.scope?.substring(0, 50) + '...', 
          after: updatedFormData.scope?.substring(0, 50) + '...', 
          changed: originalFormData.scope !== updatedFormData.scope 
        });
        
        // Determine enhanced fields BEFORE state update to avoid React timing issues
        const enhancedFieldsList = [];
        const enhancedFieldsSet = new Set<string>();
        const enhancedFieldSelectors = [];
        
        if (originalFormData.name !== updatedFormData.name) {
          enhancedFieldsList.push('Hunt Name');
          enhancedFieldsSet.add('name');
          enhancedFieldSelectors.push('input[name="name"]');
        }
        if (originalFormData.description !== updatedFormData.description) {
          enhancedFieldsList.push('Description');
          enhancedFieldsSet.add('description');
          enhancedFieldSelectors.push('textarea[name="description"]');
        }
        if (originalFormData.methodology !== updatedFormData.methodology) {
          enhancedFieldsList.push('Methodology');
          enhancedFieldsSet.add('methodology');
          enhancedFieldSelectors.push('textarea[name="methodology"]');
        }
        if (originalFormData.hypothesis !== updatedFormData.hypothesis) {
          enhancedFieldsList.push('Hypothesis');
          enhancedFieldsSet.add('hypothesis');
          enhancedFieldSelectors.push('textarea[name="hypothesis"]');
        }
        if (originalFormData.scope !== updatedFormData.scope) {
          enhancedFieldsList.push('Scope');
          enhancedFieldsSet.add('scope');
          enhancedFieldSelectors.push('textarea[name="scope"]');
        }
        if (originalFormData.successCriteria !== updatedFormData.successCriteria) {
          enhancedFieldsList.push('Success Criteria');
          enhancedFieldsSet.add('successCriteria');
          enhancedFieldSelectors.push('textarea[name="successCriteria"]');
        }
        if (originalFormData.businessJustification !== updatedFormData.businessJustification) {
          enhancedFieldsList.push('Business Justification');
          enhancedFieldsSet.add('businessJustification');
          enhancedFieldSelectors.push('textarea[name="businessJustification"]');
        }
        if (originalFormData.timeframe !== updatedFormData.timeframe) {
          enhancedFieldsList.push('Timeframe');
          enhancedFieldsSet.add('timeframe');
          enhancedFieldSelectors.push('input[name="timeframe"]');
        }
        
        console.log('✨ Enhanced fields:', enhancedFieldsList);
        
        // Update enhanced fields state for visual indicators
        setEnhancedFields(enhancedFieldsSet);
        
        // NOW update the form state
        console.log('🔄 Updating form state with AI content...');
        setFormData(updatedFormData);
        console.log('✅ Form state updated successfully');
        
        // Enhanced fields were already computed above - no need to recompute

        toastNotificationService.showNotification({
          title: '🤖 AI Hunt Enhanced',
          body: `Enhanced ${enhancedFieldsList.length} fields: ${enhancedFieldsList.join(', ') || 'None'} from ${sourceData.type.toUpperCase()}: ${sourceData.id.slice(0, 8)}...`
        });
        
        console.log('✅ AI hunt generation completed successfully');
      } else {
        console.warn('⚠️ AI enhancement response was not successful:', response);
        setAiError('AI enhancement failed. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ AI hunt generation failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      setAiError(error.message || 'AI hunt generation failed. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

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

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare data for new simplified API
      const huntData = {
        ...formData,
        // Clean up tags
        tags: formData.tags.filter(tag => tag.trim().length > 0),
        // Ensure source intel context is included for traceability
        sourceIntelType: sourceData?.type || formData.sourceIntelType,
        sourceIntelId: sourceData?.id || formData.sourceIntelId,
        sourceIntelContext: sourceData?.data || formData.sourceIntelContext
      };

      let response;
      if (isCreating) {
        console.log('🎯 Creating threat hunt with simplified schema:', huntData);
        response = await threatHuntingService.createThreatHunt(huntData);
      } else {
        console.log('📝 Updating threat hunt:', huntId, huntData);
        response = await threatHuntingService.updateThreatHunt(huntId!, huntData);
      }
      
      if (response.success) {
        const action = isCreating ? 'created' : 'updated';
        
        navigate('/threat-hunting', { 
          state: { 
            message: `🎯 Threat hunt "${response.data.name}" ${action} successfully!`,
            huntId: response.data.id 
          }
        });
      } else {
        throw new Error(response.message || `Failed to ${isCreating ? 'create' : 'update'} threat hunt`);
      }
    } catch (error: any) {
      console.error(`❌ Hunt ${isCreating ? 'creation' : 'update'} failed:`, error);
      const action = isCreating ? 'create' : 'update';
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${action} threat hunt`;
      setAiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle hunt deletion
  const handleDeleteHunt = async () => {
    if (!huntId) {
      console.error('No hunt ID available for deletion');
      return;
    }

    const huntName = formData.name || 'this hunt';
    const confirmMessage = `Are you sure you want to delete "${huntName}"? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        setIsSubmitting(true);
        console.log(`🗑️ Deleting hunt: ${huntId}`);
        
        const response = await threatHuntingService.deleteThreatHunt(huntId);
        
        if (response.success) {
          console.log('✅ Hunt deleted successfully');
          
          // Navigate back to threat hunting list
          navigate('/threat-hunting', { 
            state: { 
              message: `🗑️ Threat hunt "${huntName}" deleted successfully`,
              type: 'success'
            }
          });
        } else {
          throw new Error(response.message || 'Failed to delete hunt');
        }
      } catch (error: any) {
        console.error('❌ Hunt deletion failed:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete hunt';
        setAiError(`Delete failed: ${errorMessage}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'methodology', label: 'Methodology', icon: Activity },
    ...(formData.sourceIntelType || sourceData ? [{ id: 'source-intel', label: 'Source Intel', icon: Shield }] : []),
    ...(huntId || formData.findings || formData.recommendations ? [{ id: 'results', label: 'Results', icon: BarChart3 }] : []),
    ...(!isViewing ? [{ id: 'actions', label: 'Actions', icon: Settings }] : [])
  ];

  // Tab Button Component
  interface TabButtonProps {
    id: string;
    label: string;
    icon: React.ComponentType<any>;
    isActive: boolean;
    onClick: (id: string) => void;
  }

  const TabButton: React.FC<TabButtonProps> = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-700'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );

  // Section component for organized layout
  const Section: React.FC<{
    id: string;
    title: string;
    icon: React.ComponentType<any>;
    children: React.ReactNode;
  }> = ({ id, title, icon: Icon, children }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-750 transition-colors"
          onClick={() => toggleSection(id)}
        >
          <div className="flex items-center space-x-3">
            <Icon className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">{title}</h3>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
        
        {isExpanded && (
          <div className="p-4 pt-0 border-t border-gray-700">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Show loading state
  if (loadingHunt) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="w-[90%] mx-auto">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <span className="text-lg">Loading threat hunt...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="w-[90%] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/threat-hunting')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-3">
                <Target className="h-8 w-8 text-blue-400" />
                <span>
                  {isCreating ? 'Create Professional Threat Hunt' : 
                   isViewing ? 'Threat Hunt Details' : 
                   'Edit Threat Hunt'}
                </span>
              </h1>
              {existingHunt && (
                <p className="text-gray-400 mt-1">
                  Hunt ID: {existingHunt.id} • Status: {existingHunt.status?.toUpperCase()}
                </p>
              )}
              {sourceData && (
                <div className="mt-2">
                  <p className="text-blue-400 text-sm flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>
                      Created from {sourceData.type.replace('_', ' ').toUpperCase()}: 
                      <code className="ml-1 px-1 bg-blue-900/30 rounded">{sourceData.id}</code>
                    </span>
                  </p>
                  
                  {sourceData.data && sourceData.type === 'ioc' && (
                    <div className="mt-1 text-xs text-gray-400">
                      <span className="font-medium">Indicator:</span> {sourceData.data.value || sourceData.data.indicator || 'Unknown'} 
                      <span className="mx-2">•</span>
                      <span className="font-medium">Type:</span> {sourceData.data.type || 'Unknown'}
                      {sourceData.data.confidence && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="font-medium">Confidence:</span> {sourceData.data.confidence}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Edit Hunt button - Only show in view mode */}
            {isViewing && huntId && (
              <button
                onClick={() => navigate(`/threat-hunting/${huntId}?mode=edit`)}
                className="flex items-center space-x-2 px-4 py-2 bg-opensoc-600 hover:bg-opensoc-700 text-white rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Hunt</span>
              </button>
            )}
            {/* View Hunt button - Only show in edit mode */}
            {isEditing && huntId && (
              <button
                onClick={() => navigate(`/threat-hunting/${huntId}`)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>View Hunt</span>
              </button>
            )}
            {/* Delete Hunt button - Show in both view and edit modes */}
            {(isViewing || isEditing) && huntId && (
              <button
                onClick={handleDeleteHunt}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Hunt</span>
              </button>
            )}

            {/* MITRE Enhancement button - Show in view mode */}
            {isViewing && huntId && huntId !== 'ai-generation-placeholder-id' && (
              <button
                onClick={() => {
                  // Scroll to MITRE section or trigger enhancement directly
                  const mitreSection = document.querySelector('[data-section="mitre-enhancement"]');
                  if (mitreSection) {
                    mitreSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Target className="h-4 w-4" />
                <span>MITRE Analysis</span>
              </button>
            )}

            {/* AI Generation for new hunts from threat intel */}
            {sourceData && isCreating && (
              <button
                onClick={handleGenerateWithAI}
                disabled={isGeneratingAI || loadingSource}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-colors"
              >
                {isGeneratingAI ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
                <span>
                  {loadingSource ? 'Loading Intel...' : 
                   isGeneratingAI ? 'Enhancing Detail...' :
                   'AI Enhance Detail'}
                </span>
              </button>
            )}

            {/* AI Enhancement for existing hunts */}
            {huntId && !isViewing && (
              <button
                onClick={handleEnhanceWithAI}
                disabled={isEnhancingAI}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-800 disabled:to-pink-800 text-white rounded-lg transition-colors"
              >
                {isEnhancingAI ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>Enhance with AI</span>
              </button>
            )}

            {/* MITRE ATT&CK Integration */}
            {!isViewing && (
              <button
                onClick={() => {
                  // Open MITRE page in new tab with context
                  const mitreUrl = `/mitre?context=threat_hunt&hunt_id=${huntId || 'new'}&description=${encodeURIComponent(formData.description || '')}`;
                  window.open(mitreUrl, '_blank');
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-lg transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>MITRE ATT&CK</span>
              </button>
            )}
            
            {/* Save button (only show in create or edit mode) */}
            {!isViewing && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>
                  {isSubmitting ? 
                    (isCreating ? 'Creating...' : 'Updating...') : 
                    (isCreating ? 'Create Hunt' : 'Update Hunt')}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {aiError && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-red-300">{aiError}</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700">
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              isActive={activeTab === tab.id}
              onClick={setActiveTab}
            />
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <div className="space-y-10">
                {/* Hunt Name - Full Width */}
                <div>
                  {renderFieldLabel('Hunt Name', 'name', true)}
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Professional threat hunt title..."
                    disabled={isViewing}
                    className={getFieldClasses('name', "w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed break-words")}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                </div>

                {/* Hunt Type and Priority - Two Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Hunt Type *
                    </label>
                    <select
                      value={formData.huntType}
                      onChange={(e) => setFormData(prev => ({ ...prev, huntType: e.target.value as keyof typeof HUNT_TYPES }))}
                      disabled={isViewing}
                      className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed"
                    >
                      {Object.entries(HUNT_TYPES).map(([key, type]) => (
                        <option key={key} value={key}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-400">
                      {HUNT_TYPES[formData.huntType]?.description || 'Professional threat hunting methodology'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Priority *
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical' }))}
                      disabled={isViewing}
                      className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Description - Full Width with Larger Textarea */}
                <div>
                  {renderFieldLabel('Description', 'description', true)}
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Professional threat hunt description including business context and objectives..."
                    rows={8}
                    disabled={isViewing}
                    className={getFieldClasses('description', "w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed resize-y")}
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Methodology Tab */}
          {activeTab === 'methodology' && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <div className="space-y-10">
                {/* Threat Hypothesis - Full Width */}
                <div>
                  {renderFieldLabel('Threat Hypothesis', 'hypothesis')}
                  {isViewing && formData.hypothesis ? (
                    <div className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white min-h-[150px] overflow-hidden">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          p: ({children}) => <p className="mb-4 text-gray-200 leading-7 break-words">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-4 text-gray-200 space-y-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-4 text-gray-200 space-y-2">{children}</ol>,
                          li: ({children}) => <li className="text-gray-200 leading-6 break-words">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic text-gray-300">{children}</em>,
                          code: ({children}) => <code className="bg-gray-900 px-2 py-1 rounded text-blue-300 text-sm font-mono break-all word-break-break-all overflow-wrap-anywhere">{children}</code>,
                          pre: ({children}) => <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4 text-sm leading-6 whitespace-pre-wrap break-words word-break-break-all">{children}</pre>,
                          // Tables
                          table: ({children}) => (
                            <div className="overflow-x-auto my-4">
                              <table className="min-w-full table-fixed border border-gray-600 rounded-lg overflow-hidden">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({children}) => (
                            <thead className="bg-gray-700">{children}</thead>
                          ),
                          tbody: ({children}) => (
                            <tbody className="bg-gray-800">{children}</tbody>
                          ),
                          tr: ({children}) => (
                            <tr className="border-b border-gray-600 last:border-0">{children}</tr>
                          ),
                          th: ({children}) => (
                            <th className="px-4 py-3 text-left text-sm font-medium text-white border-r border-gray-600 last:border-0 break-words word-break-break-all">
                              {children}
                            </th>
                          ),
                          td: ({children}) => (
                            <td className="px-4 py-3 text-sm text-gray-200 border-r border-gray-600 last:border-0 break-words leading-6 word-break-break-all overflow-wrap-anywhere">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {formData.hypothesis}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      name="hypothesis"
                      value={formData.hypothesis}
                      onChange={(e) => setFormData(prev => ({ ...prev, hypothesis: e.target.value }))}
                      placeholder="Testable hypothesis about potential threats... (Markdown supported)"
                      rows={8}
                      disabled={isViewing}
                      className={getFieldClasses('hypothesis', "w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed resize-y leading-6 break-words")}
                    />
                  )}
                </div>

                {/* Hunt Scope - Full Width */}
                <div>
                  {renderFieldLabel('Hunt Scope', 'scope', true)}
                  {isViewing && formData.scope ? (
                    <div className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white min-h-[150px] overflow-hidden">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          p: ({children}) => <p className="mb-4 text-gray-200 leading-7 break-words">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-4 text-gray-200 space-y-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-4 text-gray-200 space-y-2">{children}</ol>,
                          li: ({children}) => <li className="text-gray-200 leading-6 break-words">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic text-gray-300">{children}</em>,
                          code: ({children}) => <code className="bg-gray-900 px-2 py-1 rounded text-blue-300 text-sm font-mono break-all word-break-break-all overflow-wrap-anywhere">{children}</code>,
                          pre: ({children}) => <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4 text-sm leading-6 whitespace-pre-wrap break-words word-break-break-all">{children}</pre>,
                          // Tables
                          table: ({children}) => (
                            <div className="overflow-x-auto my-4">
                              <table className="min-w-full table-fixed border border-gray-600 rounded-lg overflow-hidden">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({children}) => (
                            <thead className="bg-gray-700">{children}</thead>
                          ),
                          tbody: ({children}) => (
                            <tbody className="bg-gray-800">{children}</tbody>
                          ),
                          tr: ({children}) => (
                            <tr className="border-b border-gray-600 last:border-0">{children}</tr>
                          ),
                          th: ({children}) => (
                            <th className="px-4 py-3 text-left text-sm font-medium text-white border-r border-gray-600 last:border-0 break-words word-break-break-all">
                              {children}
                            </th>
                          ),
                          td: ({children}) => (
                            <td className="px-4 py-3 text-sm text-gray-200 border-r border-gray-600 last:border-0 break-words leading-6 word-break-break-all overflow-wrap-anywhere">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {formData.scope}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      name="scope"
                      value={formData.scope}
                      onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value }))}
                      placeholder="Define the scope of hunting activities... (Markdown supported)"
                      rows={8}
                      disabled={isViewing}
                      className={getFieldClasses('scope', "w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed resize-y leading-6 break-words")}
                    />
                  )}
                  {errors.scope && <p className="mt-1 text-sm text-red-400">{errors.scope}</p>}
                </div>

                {/* Hunting Methodology - Full Width */}
                <div>
                  {renderFieldLabel('Hunting Methodology', 'methodology')}
                  {isViewing && formData.methodology ? (
                    <div className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white min-h-[200px] overflow-hidden">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          p: ({children}) => <p className="mb-4 text-gray-200 leading-7 break-words">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-4 text-gray-200 space-y-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-4 text-gray-200 space-y-2">{children}</ol>,
                          li: ({children}) => <li className="text-gray-200 leading-6 break-words">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic text-gray-300">{children}</em>,
                          code: ({children}) => <code className="bg-gray-900 px-2 py-1 rounded text-blue-300 text-sm font-mono break-all word-break-break-all overflow-wrap-anywhere">{children}</code>,
                          pre: ({children}) => <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4 text-sm leading-6 whitespace-pre-wrap break-words word-break-break-all">{children}</pre>,
                          h1: ({children}) => <h1 className="text-xl font-bold text-white mb-3 mt-4 first:mt-0">{children}</h1>,
                          h2: ({children}) => <h2 className="text-lg font-semibold text-white mb-2 mt-3 first:mt-0">{children}</h2>,
                          h3: ({children}) => <h3 className="text-md font-medium text-white mb-2 mt-3 first:mt-0">{children}</h3>,
                          // Tables
                          table: ({children}) => (
                            <div className="overflow-x-auto my-4">
                              <table className="min-w-full table-fixed border border-gray-600 rounded-lg overflow-hidden">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({children}) => (
                            <thead className="bg-gray-700">{children}</thead>
                          ),
                          tbody: ({children}) => (
                            <tbody className="bg-gray-800">{children}</tbody>
                          ),
                          tr: ({children}) => (
                            <tr className="border-b border-gray-600 last:border-0">{children}</tr>
                          ),
                          th: ({children}) => (
                            <th className="px-4 py-3 text-left text-sm font-medium text-white border-r border-gray-600 last:border-0 break-words word-break-break-all">
                              {children}
                            </th>
                          ),
                          td: ({children}) => (
                            <td className="px-4 py-3 text-sm text-gray-200 border-r border-gray-600 last:border-0 break-words leading-6 word-break-break-all overflow-wrap-anywhere">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {formData.methodology}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      name="methodology"
                      value={formData.methodology}
                      onChange={(e) => setFormData(prev => ({ ...prev, methodology: e.target.value }))}
                      placeholder="Detailed hunting methodology and approach documentation... (Markdown supported)"
                      rows={12}
                      disabled={isViewing}
                      className={getFieldClasses('methodology', "w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed resize-y leading-6 break-words")}
                    />
                  )}
                </div>

                {/* Success Criteria - Full Width */}
                <div>
                  {renderFieldLabel('Success Criteria', 'successCriteria')}
                  {isViewing && formData.successCriteria ? (
                    <div className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white min-h-[150px] overflow-hidden">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          p: ({children}) => <p className="mb-4 text-gray-200 leading-7 break-words">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-4 text-gray-200 space-y-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-4 text-gray-200 space-y-2">{children}</ol>,
                          li: ({children}) => <li className="text-gray-200 leading-6 break-words">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic text-gray-300">{children}</em>,
                          code: ({children}) => <code className="bg-gray-900 px-2 py-1 rounded text-blue-300 text-sm font-mono break-all word-break-break-all overflow-wrap-anywhere">{children}</code>,
                          pre: ({children}) => <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4 text-sm leading-6 whitespace-pre-wrap break-words word-break-break-all">{children}</pre>,
                          // Tables
                          table: ({children}) => (
                            <div className="overflow-x-auto my-4">
                              <table className="min-w-full table-fixed border border-gray-600 rounded-lg overflow-hidden">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({children}) => (
                            <thead className="bg-gray-700">{children}</thead>
                          ),
                          tbody: ({children}) => (
                            <tbody className="bg-gray-800">{children}</tbody>
                          ),
                          tr: ({children}) => (
                            <tr className="border-b border-gray-600 last:border-0">{children}</tr>
                          ),
                          th: ({children}) => (
                            <th className="px-4 py-3 text-left text-sm font-medium text-white border-r border-gray-600 last:border-0 break-words word-break-break-all">
                              {children}
                            </th>
                          ),
                          td: ({children}) => (
                            <td className="px-4 py-3 text-sm text-gray-200 border-r border-gray-600 last:border-0 break-words leading-6 word-break-break-all overflow-wrap-anywhere">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {formData.successCriteria}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      name="successCriteria"
                      value={formData.successCriteria}
                      onChange={(e) => setFormData(prev => ({ ...prev, successCriteria: e.target.value }))}
                      placeholder="Measurable criteria defining successful completion... (Markdown supported)"
                      rows={8}
                      disabled={isViewing}
                      className={getFieldClasses('successCriteria', "w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed resize-y leading-6 break-words")}
                    />
                  )}
                </div>

                {/* Business Justification - Full Width */}
                <div>
                  {renderFieldLabel('Business Justification', 'businessJustification')}
                  {isViewing && formData.businessJustification ? (
                    <div className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white min-h-[150px] overflow-hidden">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          p: ({children}) => <p className="mb-4 text-gray-200 leading-7 break-words">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-4 text-gray-200 space-y-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-4 text-gray-200 space-y-2">{children}</ol>,
                          li: ({children}) => <li className="text-gray-200 leading-6 break-words">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic text-gray-300">{children}</em>,
                          code: ({children}) => <code className="bg-gray-900 px-2 py-1 rounded text-blue-300 text-sm font-mono break-all word-break-break-all overflow-wrap-anywhere">{children}</code>,
                          pre: ({children}) => <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4 text-sm leading-6 whitespace-pre-wrap break-words word-break-break-all">{children}</pre>,
                          // Tables
                          table: ({children}) => (
                            <div className="overflow-x-auto my-4">
                              <table className="min-w-full table-fixed border border-gray-600 rounded-lg overflow-hidden">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({children}) => (
                            <thead className="bg-gray-700">{children}</thead>
                          ),
                          tbody: ({children}) => (
                            <tbody className="bg-gray-800">{children}</tbody>
                          ),
                          tr: ({children}) => (
                            <tr className="border-b border-gray-600 last:border-0">{children}</tr>
                          ),
                          th: ({children}) => (
                            <th className="px-4 py-3 text-left text-sm font-medium text-white border-r border-gray-600 last:border-0 break-words word-break-break-all">
                              {children}
                            </th>
                          ),
                          td: ({children}) => (
                            <td className="px-4 py-3 text-sm text-gray-200 border-r border-gray-600 last:border-0 break-words leading-6 word-break-break-all overflow-wrap-anywhere">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {formData.businessJustification}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      name="businessJustification"
                      value={formData.businessJustification}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessJustification: e.target.value }))}
                      placeholder="Business rationale and risk-based justification... (Markdown supported)"
                      rows={8}
                      disabled={isViewing}
                      className={getFieldClasses('businessJustification', "w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed resize-y leading-6 break-words")}
                    />
                  )}
                </div>

                {/* Target Systems and Timeframe - Two Columns for these shorter fields */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Systems
                    </label>
                    {isViewing && formData.targetSystems ? (
                      <div className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white min-h-[60px] flex items-center overflow-hidden">
                        <span className="text-gray-200 break-words">{formData.targetSystems}</span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={formData.targetSystems}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetSystems: e.target.value }))}
                        placeholder="Specific systems, networks, or assets..."
                        disabled={isViewing}
                        className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed break-words"
                      />
                    )}
                  </div>

                  <div>
                    {renderFieldLabel('Timeframe', 'timeframe')}
                    {isViewing && formData.timeframe ? (
                      <div className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white min-h-[60px] flex items-center overflow-hidden">
                        <span className="text-gray-200 break-words">{formData.timeframe}</span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        name="timeframe"
                        value={formData.timeframe}
                        onChange={(e) => setFormData(prev => ({ ...prev, timeframe: e.target.value }))}
                        placeholder="Expected duration (e.g., 2-4 hours, 1 week)"
                        disabled={isViewing}
                        className={getFieldClasses('timeframe', "w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed break-words")}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Source Intelligence Tab */}
          {activeTab === 'source-intel' && (formData.sourceIntelType || formData.sourceIntelId || sourceData) && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <div className="space-y-6">
                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="h-5 w-5 text-blue-400" />
                    <h4 className="text-lg font-medium text-blue-400">Threat Intelligence Source</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-300 mb-1">Source Type</p>
                      <p className="text-white">
                        {(formData.sourceIntelType || sourceData?.type)?.replace('_', ' ').toUpperCase() || 'Manual'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-300 mb-1">Source ID</p>
                      <div className="flex items-center space-x-2">
                        <code className="px-2 py-1 bg-blue-900/40 text-blue-300 rounded text-sm font-mono">
                          {formData.sourceIntelId || sourceData?.id || 'N/A'}
                        </code>
                        {(formData.sourceIntelId || sourceData?.id) && (
                          <button
                            onClick={() => {
                              const sourceType = formData.sourceIntelType || sourceData?.type;
                              const sourceId = formData.sourceIntelId || sourceData?.id;
                              if (sourceType === 'ioc') {
                                // Direct link to IOC detail page
                                window.open(`/threat-intel/iocs/${sourceId}`, '_blank');
                              } else if (sourceType === 'threat_actor') {
                                // Fall back to search since detail pages don't exist yet
                                window.open(`/threat-intel?tab=actors&search=${sourceId}`, '_blank');
                              } else if (sourceType === 'campaign') {
                                // Fall back to search since detail pages don't exist yet
                                window.open(`/threat-intel?tab=campaigns&search=${sourceId}`, '_blank');
                              }
                            }}
                            className="text-blue-400 hover:text-blue-300 text-xs underline"
                          >
                            View Source
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {(sourceData?.data || formData.sourceIntelContext) && (
                    <div className="mt-4 pt-4 border-t border-blue-700/30">
                      <p className="text-sm font-medium text-gray-300 mb-2">Intelligence Context</p>
                      <div className="bg-gray-800 rounded-lg p-4">
                        {sourceData?.type === 'ioc' && sourceData?.data ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm text-gray-400">Indicator:</span>
                                <p className="text-white font-mono text-lg break-all">
                                  {sourceData.data.value || sourceData.data.indicator || 'Unknown'}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-400">Type:</span>
                                <p className="text-white font-medium">
                                  {sourceData.data.type || 'Unknown'}
                                </p>
                              </div>
                            </div>
                            {sourceData.data.description && (
                              <div>
                                <span className="text-sm text-gray-400">Description:</span>
                                <p className="text-white mt-1">{sourceData.data.description}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                              {sourceData.data.confidence && (
                                <div>
                                  <span className="text-xs text-gray-400">Confidence:</span>
                                  <p className="text-yellow-400 font-medium">{sourceData.data.confidence}</p>
                                </div>
                              )}
                              {sourceData.data.threat_level && (
                                <div>
                                  <span className="text-xs text-gray-400">Threat Level:</span>
                                  <p className="text-red-400 font-medium">{sourceData.data.threat_level}</p>
                                </div>
                              )}
                              {sourceData.data.firstSeen && (
                                <div>
                                  <span className="text-xs text-gray-400">First Seen:</span>
                                  <p className="text-white text-xs">{new Date(sourceData.data.firstSeen).toLocaleDateString()}</p>
                                </div>
                              )}
                              {sourceData.data.lastSeen && (
                                <div>
                                  <span className="text-xs text-gray-400">Last Seen:</span>
                                  <p className="text-white text-xs">{new Date(sourceData.data.lastSeen).toLocaleDateString()}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (sourceData?.type === 'threat_actor' || sourceData?.type === 'campaign') && sourceData?.data ? (
                          <div className="space-y-3">
                            <div>
                              <span className="text-sm text-gray-400">Name:</span>
                              <p className="text-white font-medium text-lg">{sourceData.data.name || 'Unknown'}</p>
                            </div>
                            {sourceData.data.description && (
                              <div>
                                <span className="text-sm text-gray-400">Description:</span>
                                <p className="text-white mt-1">{sourceData.data.description}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(sourceData?.data || formData.sourceIntelContext, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 text-xs text-blue-300">
                    💡 This hunt was created from the threat intelligence source above. SOC managers can use this information to trace back to the original intelligence that triggered this hunt.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && (huntId || formData.findings || formData.recommendations) && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <div className="space-y-10">
                {/* Key Findings - Full Width */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Key Findings
                  </label>
                  {isViewing && formData.findings ? (
                    <div className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white min-h-[200px] overflow-hidden">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          p: ({children}) => <p className="mb-4 text-gray-200 leading-7 break-words">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-4 text-gray-200 space-y-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-4 text-gray-200 space-y-2">{children}</ol>,
                          li: ({children}) => <li className="text-gray-200 leading-6 break-words">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic text-gray-300">{children}</em>,
                          code: ({children}) => <code className="bg-gray-900 px-2 py-1 rounded text-blue-300 text-sm font-mono break-all word-break-break-all overflow-wrap-anywhere">{children}</code>,
                          pre: ({children}) => <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4 text-sm leading-6 whitespace-pre-wrap break-words word-break-break-all">{children}</pre>,
                          h1: ({children}) => <h1 className="text-xl font-bold text-white mb-3 mt-4 first:mt-0">{children}</h1>,
                          h2: ({children}) => <h2 className="text-lg font-semibold text-white mb-2 mt-3 first:mt-0">{children}</h2>,
                          h3: ({children}) => <h3 className="text-md font-medium text-white mb-2 mt-3 first:mt-0">{children}</h3>,
                        }}
                      >
                        {formData.findings}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      value={formData.findings}
                      onChange={(e) => setFormData(prev => ({ ...prev, findings: e.target.value }))}
                      placeholder="Document key findings and discoveries... (Markdown supported)"
                      rows={10}
                      disabled={isViewing}
                      className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed resize-y leading-6 break-words"
                    />
                  )}
                </div>

                {/* Recommendations and Evidence - Two Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    {renderFieldLabel('Recommendations', 'recommendations')}
                    {isViewing && formData.recommendations ? (
                      <div className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white min-h-[150px] overflow-hidden">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                                                    components={{
                            p: ({children}) => <p className="mb-4 text-gray-200 leading-7 break-words">{children}</p>,
                            ul: ({children}) => <ul className="list-disc list-inside mb-4 text-gray-200 space-y-2">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal list-inside mb-4 text-gray-200 space-y-2">{children}</ol>,
                            li: ({children}) => <li className="text-gray-200 leading-6 break-words">{children}</li>,
                            strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                            em: ({children}) => <em className="italic text-gray-300">{children}</em>,
                            code: ({children}) => <code className="bg-gray-900 px-2 py-1 rounded text-blue-300 text-sm font-mono break-all word-break-break-all overflow-wrap-anywhere">{children}</code>,
                            pre: ({children}) => <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4 text-sm leading-6 whitespace-pre-wrap break-words word-break-break-all">{children}</pre>,
                          }}
                        >
                          {formData.recommendations}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <textarea
                        value={formData.recommendations}
                        onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
                        placeholder="Actionable recommendations... (Markdown supported)"
                        rows={8}
                        disabled={isViewing}
                        className={getFieldClasses('recommendations', "w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed resize-y leading-6 break-words")}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Evidence Summary
                    </label>
                    {isViewing && formData.evidence ? (
                      <div className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white min-h-[150px] overflow-hidden">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                                                    components={{
                            p: ({children}) => <p className="mb-4 text-gray-200 leading-7 break-words">{children}</p>,
                            ul: ({children}) => <ul className="list-disc list-inside mb-4 text-gray-200 space-y-2">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal list-inside mb-4 text-gray-200 space-y-2">{children}</ol>,
                            li: ({children}) => <li className="text-gray-200 leading-6 break-words">{children}</li>,
                            strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                            em: ({children}) => <em className="italic text-gray-300">{children}</em>,
                            code: ({children}) => <code className="bg-gray-900 px-2 py-1 rounded text-blue-300 text-sm font-mono break-all word-break-break-all overflow-wrap-anywhere">{children}</code>,
                            pre: ({children}) => <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4 text-sm leading-6 whitespace-pre-wrap break-words word-break-break-all">{children}</pre>,
                          }}
                        >
                          {formData.evidence}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <textarea
                        value={formData.evidence}
                        onChange={(e) => setFormData(prev => ({ ...prev, evidence: e.target.value }))}
                        placeholder="Evidence collection summary... (Markdown supported)"
                        rows={8}
                        disabled={isViewing}
                        className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed resize-y leading-6 break-words"
                      />
                    )}
                  </div>
                </div>

                {/* Lessons Learned - Full Width */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Lessons Learned
                  </label>
                  {isViewing && formData.lessonsLearned ? (
                    <div className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white min-h-[150px] overflow-hidden">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          p: ({children}) => <p className="mb-4 text-gray-200 leading-7 break-words">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-4 text-gray-200 space-y-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-4 text-gray-200 space-y-2">{children}</ol>,
                          li: ({children}) => <li className="text-gray-200 leading-6 break-words">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic text-gray-300">{children}</em>,
                          code: ({children}) => <code className="bg-gray-900 px-2 py-1 rounded text-blue-300 text-sm font-mono break-all word-break-break-all overflow-wrap-anywhere">{children}</code>,
                          pre: ({children}) => <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4 text-sm leading-6 whitespace-pre-wrap break-words word-break-break-all">{children}</pre>,
                          // Tables
                          table: ({children}) => (
                            <div className="overflow-x-auto my-4">
                              <table className="min-w-full table-fixed border border-gray-600 rounded-lg overflow-hidden">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({children}) => (
                            <thead className="bg-gray-700">{children}</thead>
                          ),
                          tbody: ({children}) => (
                            <tbody className="bg-gray-800">{children}</tbody>
                          ),
                          tr: ({children}) => (
                            <tr className="border-b border-gray-600 last:border-0">{children}</tr>
                          ),
                          th: ({children}) => (
                            <th className="px-4 py-3 text-left text-sm font-medium text-white border-r border-gray-600 last:border-0 break-words word-break-break-all">
                              {children}
                            </th>
                          ),
                          td: ({children}) => (
                            <td className="px-4 py-3 text-sm text-gray-200 border-r border-gray-600 last:border-0 break-words leading-6 word-break-break-all overflow-wrap-anywhere">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {formData.lessonsLearned}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      value={formData.lessonsLearned}
                      onChange={(e) => setFormData(prev => ({ ...prev, lessonsLearned: e.target.value }))}
                      placeholder="Key lessons for future hunts... (Markdown supported)"
                      rows={6}
                      disabled={isViewing}
                      className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed resize-y leading-6 break-words"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MITRE ATT&CK Enhancement - Show in view and edit modes */}
          {(isViewing || isEditing) && huntId && huntId !== 'ai-generation-placeholder-id' && (
            <div className="mt-8" data-section="mitre-enhancement">
              <MitreAttackEnhancement
                huntId={huntId}
                huntData={{
                  name: formData.name,
                  description: formData.description,
                  huntType: formData.huntType,
                  scope: formData.scope,
                  methodology: formData.methodology,
                  hypothesis: formData.hypothesis,
                  targetSystems: formData.targetSystems
                }}
                isViewMode={isViewing}
                onEnhancementComplete={(mitreData) => {
                  // Update form with MITRE analysis data
                  setFormData(prev => ({
                    ...prev,
                    methodology: prev.methodology 
                      ? `${prev.methodology}\n\n## MITRE ATT&CK Enhancement\n\n### Mapped Techniques:\n${mitreData.mitreTechniques.join(', ')}\n\n### Mapped Tactics:\n${mitreData.mitreTactics.join(', ')}\n\n### AI Analysis:\n${mitreData.mitreAnalysis}`
                      : `## MITRE ATT&CK Enhancement\n\n### Mapped Techniques:\n${mitreData.mitreTechniques.join(', ')}\n\n### Mapped Tactics:\n${mitreData.mitreTactics.join(', ')}\n\n### AI Analysis:\n${mitreData.mitreAnalysis}`,
                    recommendations: prev.recommendations
                      ? `${prev.recommendations}\n\n## MITRE-Based Recommendations\n\nBased on the mapped MITRE techniques (${mitreData.mitreTechniques.join(', ')}), focus threat hunting efforts on detecting activities related to ${mitreData.mitreTactics.join(', ')} tactics.`
                      : `## MITRE-Based Recommendations\n\nBased on the mapped MITRE techniques (${mitreData.mitreTechniques.join(', ')}), focus threat hunting efforts on detecting activities related to ${mitreData.mitreTactics.join(', ')} tactics.`
                  }));
                  
                  // Mark fields as enhanced and recently updated
                  setEnhancedFields(prev => new Set([...prev, 'methodology', 'recommendations']));
                  setRecentlyUpdatedFields(new Set(['methodology', 'recommendations']));
                  
                  // Clear the recently updated indicator after 5 seconds
                  setTimeout(() => {
                    setRecentlyUpdatedFields(new Set());
                  }, 5000);
                  
                  // Show success message
                  toastNotificationService.showNotification({
                    title: 'Form Updated',
                    body: 'MITRE analysis has been added to methodology and recommendations'
                  });
                }}
              />
            </div>
          )}

          {/* Actions Tab - Only show in create/edit mode */}
          {activeTab === 'actions' && !isViewing && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-white mb-4">Actions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* AI Generation for new hunts from threat intel */}
                  {sourceData && isCreating && (
                    <button
                      onClick={handleGenerateWithAI}
                      disabled={isGeneratingAI || loadingSource}
                      className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-colors"
                    >
                      {isGeneratingAI ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                      <span>
                        {loadingSource ? 'Loading Intel...' : 
                         isGeneratingAI ? 'Enhancing Detail...' :
                         'AI Enhance Detail'}
                      </span>
                    </button>
                  )}

                  {/* AI Enhancement for existing hunts */}
                  {huntId && !isViewing && (
                    <button
                      onClick={handleEnhanceWithAI}
                      disabled={isEnhancingAI}
                      className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-800 disabled:to-pink-800 text-white rounded-lg transition-colors"
                    >
                      {isEnhancingAI ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                      <span>Enhance with AI</span>
                    </button>
                  )}
                  
                  {/* Save button */}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center justify-center space-x-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    <span>
                      {isSubmitting ? 
                        (isCreating ? 'Creating...' : 'Updating...') : 
                        (isCreating ? 'Create Hunt' : 'Update Hunt')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ThreatHuntCreatePage;
