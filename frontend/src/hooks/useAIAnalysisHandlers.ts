import { useState } from 'react';
import { Alert } from '../types';
import alertService, { AlertAIAnalysis, AIClassificationResult, MitreAnalysisResponse } from '../services/alertService';
import ToastService from '../services/toastService';
import type { EventTag } from '../types';

export interface UseAIAnalysisHandlersReturn {
  // AI Analysis State
  aiLoading: boolean;
  aiError: string | null;
  aiProgress: number;
  
  // AI Classification State
  aiClassificationLoading: boolean;
  aiClassificationError: string | null;
  
  // MITRE Analysis State
  mitreAnalysisLoading: boolean;
  mitreAnalysisError: string | null;
  
  // Playbook Generation State
  immediatePlaybookLoading: boolean;
  investigationPlaybookLoading: boolean;
  playbookError: string | null;
  playbookRefreshTrigger: number;
  
  // Handler Functions
  handleAnalyzeAlert: () => Promise<void>;
  handleAIClassification: () => Promise<void>;
  handleMitreAnalysis: () => Promise<void>;
  handleGenerateImmediatePlaybook: () => Promise<void>;
  handleGenerateInvestigationPlaybook: () => Promise<void>;
  handleTagsUpdate: (updatedTags: EventTag[]) => Promise<void>;
  
  // State Setters for external updates
  setAiAnalysis: (analysis: AlertAIAnalysis | null) => void;
  setAiClassification: (classification: AIClassificationResult | null) => void;
  setMitreAnalysis: (analysis: MitreAnalysisResponse | null) => void;
  setAlert: (alert: Alert | null) => void;
  setPlaybookRefreshTrigger: (trigger: number) => void;
  
  // Error Setters for dismissal functionality
  setAiError: (error: string | null) => void;
  setAiClassificationError: (error: string | null) => void;
  setMitreAnalysisError: (error: string | null) => void;
  setPlaybookError: (error: string | null) => void;
}

/**
 * Custom hook for managing AI analysis operations and state
 * Handles AI analysis, classification, MITRE analysis, and playbook generation
 */
export const useAIAnalysisHandlers = (
  alert: Alert | null,
  refreshData: {
    loadAlertDetails: (alertId: string) => Promise<void>;
    loadTimeline: (alertId: string) => Promise<void>;
  },
  parentStateSetter?: {
    setParentAlert: (alert: Alert) => void;
  }
): UseAIAnalysisHandlersReturn => {
  
  // AI Analysis State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiProgress, setAiProgress] = useState(0);
  
  // AI Classification State
  const [aiClassificationLoading, setAiClassificationLoading] = useState(false);
  const [aiClassificationError, setAiClassificationError] = useState<string | null>(null);
  
  // MITRE Analysis State
  const [mitreAnalysisLoading, setMitreAnalysisLoading] = useState(false);
  const [mitreAnalysisError, setMitreAnalysisError] = useState<string | null>(null);
  
  // Playbook Generation State
  const [immediatePlaybookLoading, setImmediatePlaybookLoading] = useState(false);
  const [investigationPlaybookLoading, setInvestigationPlaybookLoading] = useState(false);
  const [playbookError, setPlaybookError] = useState<string | null>(null);
  const [playbookRefreshTrigger, setPlaybookRefreshTrigger] = useState(0);
  
  // External state setters (for parent component integration)
  const [aiAnalysis, setAiAnalysis] = useState<AlertAIAnalysis | null>(null);
  const [aiClassification, setAiClassification] = useState<AIClassificationResult | null>(null);
  const [mitreAnalysis, setMitreAnalysis] = useState<MitreAnalysisResponse | null>(null);
  const [currentAlert, setAlert] = useState<Alert | null>(alert);

  /**
   * Handle AI Analysis for alert
   */
  const handleAnalyzeAlert = async () => {
    if (!alert) return;
    
    // Clear any previous error and reset progress
    setAiError(null);
    setAiProgress(0);
    setAiLoading(true);
    
    console.log(`🤖 Starting AI analysis for alert ${alert.id}`);
    
    // Simulate progress for user feedback (AI analysis typically takes 15-20 seconds)
    const progressInterval = setInterval(() => {
      setAiProgress(prev => {
        if (prev >= 90) return 90; // Don't go to 100% until actually complete
        return prev + Math.random() * 10;
      });
    }, 1500);
    
    try {
      const analysis = await alertService.analyzeAlert(alert.id);
      
      // Complete progress
      setAiProgress(100);
      
      if (analysis.success && analysis.analysis) {
        console.log('✅ AI analysis successful, updating UI');
        setAiAnalysis(analysis.analysis);
        
        // Refresh alert data to get updated enrichment data
        await refreshData.loadAlertDetails(alert.id);
        
        // Refresh timeline to show new AI analysis events
        await refreshData.loadTimeline(alert.id);
        
        console.log('🎯 AI analysis complete and UI updated');
      } else {
        console.error('❌ AI Analysis API returned failure:', analysis.error);
        setAiError(analysis.error || 'AI analysis failed. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ AI Analysis exception:', error);
      setAiError('An unexpected error occurred during AI analysis. Please try again.');
    } finally {
      clearInterval(progressInterval);
      setAiLoading(false);
      setAiProgress(0);
      console.log('🏁 AI analysis process completed');
    }
  };

  /**
   * Handle AI Classification for alert
   */
  const handleAIClassification = async () => {
    if (!alert) return;
    
    // Clear any previous error
    setAiClassificationError(null);
    setAiClassificationLoading(true);
    
    console.log(`🏷️ FRONTEND: Starting AI classification for alert ${alert.id}`);
    console.log(`🏷️ FRONTEND: Classification expected to return lightweight categorization only`);
    
    try {
      console.log(`🏷️ FRONTEND: Calling alertService.aiClassification(${alert.id})`);
      const classification = await alertService.aiClassification(alert.id);
      
      console.log(`🏷️ FRONTEND: API response received:`, {
        success: classification.success,
        hasClassification: !!classification.classification,
        classificationKeys: classification.classification ? Object.keys(classification.classification) : [],
        hasRecommendedActions: !!(classification.classification?.recommendedActions)
      });
      
      if (classification.success && classification.classification) {
        // Validate that classification doesn't contain analysis data
        if (classification.classification.recommendedActions) {
          console.error('❌ FRONTEND: Classification contaminated with recommendedActions!', classification.classification.recommendedActions);
        }
        if (classification.classification.summary) {
          console.error('❌ FRONTEND: Classification contaminated with summary!', classification.classification.summary);
        }
        if (classification.classification.riskAssessment) {
          console.error('❌ FRONTEND: Classification contaminated with riskAssessment!', classification.classification.riskAssessment);
        }
        
        console.log('✅ FRONTEND: AI classification successful, updating UI state');
        console.log('🏷️ FRONTEND: Classification data being stored:', {
          securityEventType: classification.classification.securityEventType,
          tagCount: classification.classification.tagCount,
          confidence: classification.classification.overallConfidence,
          correlationPotential: classification.classification.correlationPotential
        });
        
        setAiClassification(classification.classification);
        
        // Refresh alert data to get updated tags and event type
        console.log('🏷️ FRONTEND: Refreshing alert details to sync database changes');
        await refreshData.loadAlertDetails(alert.id);
        
        // Refresh timeline to show new AI classification events
        console.log('🏷️ FRONTEND: Refreshing timeline to show classification event');
        await refreshData.loadTimeline(alert.id);
        
        console.log('🎯 FRONTEND: AI classification complete and UI updated');
      } else {
        console.error('❌ FRONTEND: AI Classification API returned failure:', classification.error);
        setAiClassificationError(classification.error || 'AI classification failed. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ FRONTEND: AI Classification exception:', error);
      setAiClassificationError('An unexpected error occurred during AI classification. Please try again.');
    } finally {
      setAiClassificationLoading(false);
      console.log('🏁 FRONTEND: AI classification process completed');
    }
  };

  /**
   * Handle MITRE ATT&CK Analysis for alert
   */
  const handleMitreAnalysis = async () => {
    if (!alert) return;
    
    // Clear any previous error
    setMitreAnalysisError(null);
    setMitreAnalysisLoading(true);
    
    console.log(`🎯 Starting MITRE ATT&CK analysis for alert ${alert.id}`);
    
    try {
      const analysis = await alertService.analyzeMitreAttack(alert.id);
      
      if (analysis.success && analysis.data) {
        console.log('✅ MITRE analysis successful, updating UI');
        
        // Debug logging for data structure
        console.log('🔍 MITRE API Response Structure:', {
          hasSuccess: !!analysis.success,
          hasData: !!analysis.data,
          successValue: analysis.success,
          dataKeys: analysis.data ? Object.keys(analysis.data) : [],
          hasEnrichedAnalysis: !!analysis.data?.enriched_analysis,
          hasAnalystGuidance: !!analysis.data?.enriched_analysis?.analyst_guidance,
          guidanceLength: analysis.data?.enriched_analysis?.analyst_guidance?.length || 0
        });
        
        setMitreAnalysis(analysis);
        
        // Refresh timeline to show new MITRE analysis events
        await refreshData.loadTimeline(alert.id);
        
        console.log('🎯 MITRE analysis complete and UI updated');
      } else {
        console.error('❌ MITRE Analysis API returned failure:', analysis.error);
        setMitreAnalysisError(analysis.error || 'MITRE analysis failed. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ MITRE Analysis exception:', error);
      setMitreAnalysisError('An unexpected error occurred during MITRE analysis. Please try again.');
    } finally {
      setMitreAnalysisLoading(false);
      console.log('🏁 MITRE analysis process completed');
    }
  };

  /**
   * Handle Immediate Playbook Generation
   */
  const handleGenerateImmediatePlaybook = async () => {
    if (!alert?.aiAnalysis) {
      setPlaybookError('AI analysis must be completed before generating playbooks');
      return;
    }

    setImmediatePlaybookLoading(true);
    setPlaybookError(null);

    try {
      const response = await alertService.generateImmediatePlaybook(alert.id);
      
      if (response.success) {
        console.log('✅ Immediate action playbook generated successfully');
        
        // Show success toast
        ToastService.success('Immediate action playbook generated successfully!', {
          icon: '⚡',
          duration: 5000
        });
        
        // Refresh the page data to show the new playbook
        if (alert?.id) {
          const updatedAlert = await alertService.getAlert(alert.id);
          if (updatedAlert.success) {
            setAlert(updatedAlert.data);
            parentStateSetter?.setParentAlert(updatedAlert.data);
          }
          
          // Refresh timeline to show new playbook generation event
          await refreshData.loadTimeline(alert.id);
          
          // Trigger playbook generator component to refresh
          setPlaybookRefreshTrigger(prev => prev + 1);
        }
      } else {
        const errorMsg = response.error || 'Failed to generate immediate action playbook';
        setPlaybookError(errorMsg);
        ToastService.error(errorMsg);
      }
    } catch (error: any) {
      console.error('Immediate playbook generation failed:', error);
      const errorMsg = error.response?.data?.error || 'Failed to generate immediate action playbook. Please try again.';
      setPlaybookError(errorMsg);
      ToastService.error(errorMsg);
    } finally {
      setImmediatePlaybookLoading(false);
    }
  };

  /**
   * Handle Investigation Playbook Generation
   */
  const handleGenerateInvestigationPlaybook = async () => {
    if (!alert?.aiAnalysis) {
      setPlaybookError('AI analysis must be completed before generating playbooks');
      return;
    }

    setInvestigationPlaybookLoading(true);
    setPlaybookError(null);

    try {
      const response = await alertService.generateInvestigationPlaybook(alert.id);
      
      if (response.success) {
        console.log('✅ Investigation playbook generated successfully');
        
        // Show success toast
        ToastService.success('Investigation playbook generated successfully!', {
          icon: '🔍',
          duration: 5000
        });
        
        // Refresh the page data to show the new playbook
        if (alert?.id) {
          const updatedAlert = await alertService.getAlert(alert.id);
          if (updatedAlert.success) {
            setAlert(updatedAlert.data);
            parentStateSetter?.setParentAlert(updatedAlert.data);
          }
          
          // Refresh timeline to show new playbook generation event
          await refreshData.loadTimeline(alert.id);
          
          // Trigger playbook generator component to refresh
          setPlaybookRefreshTrigger(prev => prev + 1);
        }
      } else {
        const errorMsg = response.error || 'Failed to generate investigation playbook';
        setPlaybookError(errorMsg);
        ToastService.error(errorMsg);
      }
    } catch (error: any) {
      console.error('Investigation playbook generation failed:', error);
      const errorMsg = error.response?.data?.error || 'Failed to generate investigation playbook. Please try again.';
      setPlaybookError(errorMsg);
      ToastService.error(errorMsg);
    } finally {
      setInvestigationPlaybookLoading(false);
    }
  };

  /**
   * Handle Tags Update
   */
  const handleTagsUpdate = async (updatedTags: EventTag[]) => {
    if (!alert) return;
    
    try {
      // Update the alert's tags in the UI immediately
      const updatedAlert = {
        ...alert,
        eventTags: updatedTags,
        tagsGeneratedAt: new Date().toISOString()
      };
      setAlert(updatedAlert);
      parentStateSetter?.setParentAlert(updatedAlert);
      
      // Here you could also call an API to save the updated tags to the backend
      // await alertService.updateAlertTags(alert.id, updatedTags);
      
      console.log('Tags updated successfully');
    } catch (error: any) {
      console.error('Failed to update tags:', error);
      ToastService.error('Failed to update tags');
    }
  };

  return {
    // AI Analysis State
    aiLoading,
    aiError,
    aiProgress,
    
    // AI Classification State
    aiClassificationLoading,
    aiClassificationError,
    
    // MITRE Analysis State
    mitreAnalysisLoading,
    mitreAnalysisError,
    
    // Playbook Generation State
    immediatePlaybookLoading,
    investigationPlaybookLoading,
    playbookError,
    playbookRefreshTrigger,
    
    // Handler Functions
    handleAnalyzeAlert,
    handleAIClassification,
    handleMitreAnalysis,
    handleGenerateImmediatePlaybook,
    handleGenerateInvestigationPlaybook,
    handleTagsUpdate,
    
    // State Setters for external updates
    setAiAnalysis,
    setAiClassification,
    setMitreAnalysis,
    setAlert,
    setPlaybookRefreshTrigger,
    
    // Error Setters for dismissal functionality
    setAiError,
    setAiClassificationError,
    setMitreAnalysisError,
    setPlaybookError
  };
};