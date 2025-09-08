import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Alert, AlertTimelineEvent } from '../types';
import alertService, { AlertAIAnalysis, AIClassificationResult, MitreAnalysisResponse } from '../services/alertService';
import { AppDispatch } from '../store';
import { fetchAlert } from '../store/alertsAsync';

export interface UseAlertDataReturn {
  // Core alert data
  alert: Alert | null;
  loading: boolean;
  error: string | null;
  
  // Timeline data
  timeline: AlertTimelineEvent[];
  timelineLoading: boolean;
  
  // AI analysis data
  aiAnalysis: AlertAIAnalysis | null;
  aiClassification: AIClassificationResult | null;
  mitreAnalysis: MitreAnalysisResponse | null;
  
  // Related data
  relatedIncidents: any[];
  
  // Loading functions
  loadAlertDetails: (alertId: string) => Promise<void>;
  loadTimeline: (alertId: string) => Promise<void>;
  loadRelatedIncidents: (alertId: string) => Promise<void>;
  refreshAlertData: () => Promise<void>;
  
  // State setter for external updates
  setAlert: (alert: Alert | null) => void;
}

/**
 * Custom hook for managing alert data loading and state
 * Handles alert details, timeline, related incidents, and AI analysis data
 */
export const useAlertData = (alertId: string | undefined): UseAlertDataReturn => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Core alert state
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Timeline state
  const [timeline, setTimeline] = useState<AlertTimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  
  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = useState<AlertAIAnalysis | null>(null);
  const [aiClassification, setAiClassification] = useState<AIClassificationResult | null>(null);
  const [mitreAnalysis, setMitreAnalysis] = useState<MitreAnalysisResponse | null>(null);
  
  // Related data state
  const [relatedIncidents, setRelatedIncidents] = useState<any[]>([]);

  // Safe date parsing helper
  const safeParseDate = (dateValue: string | Date): Date => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') {
      try {
        return new Date(dateValue);
      } catch {
        return new Date(dateValue);
      }
    }
    return new Date();
  };

  const loadAlertDetails = async (alertId: string) => {
    try {
      setLoading(true);
      setError(null);
      const fetchedAlert = await alertService.getAlert(alertId);
      setAlert(fetchedAlert);
      
      // Load AI analysis if available
      if (fetchedAlert.aiAnalysis) {
        setAiAnalysis(fetchedAlert.aiAnalysis);
      }
      
      // Load MITRE analysis if available
      if (fetchedAlert.mitreAnalysis) {
        // Create comprehensive transformation to match component expectations
        const dbAnalysis = fetchedAlert.mitreAnalysis;
        
        const transformedAnalysis = {
          success: true, // Ensure success field is present for component check
          data: {
            // Map database structure to expected component structure
            domain_classification: {
              classified_domains: dbAnalysis.summary?.classified_domains || [],
              domain_scores: dbAnalysis.summary?.domain_scores || {},
              analysis_summary: {
                primary_domain: dbAnalysis.summary?.classified_domains?.[0] || 'enterprise',
                confidence: 0.9,
                total_domains: dbAnalysis.summary?.classified_domains?.length || 0
              }
            },
            ttp_mapping: dbAnalysis.ttp_mapping || { techniques: [] },
            summary: {
              classified_domains: dbAnalysis.summary?.classified_domains || [],
              total_techniques_mapped: dbAnalysis.total_techniques_mapped || 0,
              high_confidence_techniques: dbAnalysis.high_confidence_techniques || 0,
              kill_chain_coverage: dbAnalysis.summary?.kill_chain_coverage || {},
              ai_enhancement_applied: dbAnalysis.summary?.ai_enhancement_applied || false
            },
            enriched_analysis: {
              success: dbAnalysis.enriched_analysis?.success || false,
              ai_analysis: dbAnalysis.enriched_analysis?.ai_analysis || '',
              analyst_guidance: dbAnalysis.enriched_analysis?.analyst_guidance || [],
              processing_time_ms: dbAnalysis.enriched_analysis?.processing_time_ms || 0,
              ai_model: dbAnalysis.enriched_analysis?.ai_model || ''
            },
            alert_id: fetchedAlert.id
          },
          metadata: {
            analysis_timestamp: fetchedAlert.mitreAnalysisTimestamp || new Date().toISOString(),
            restored_from_database: true
          }
        };
        
        // Debug logging for database restoration
        console.log('🔍 Database Restoration Structure:', {
          dbHasEnrichedAnalysis: !!dbAnalysis.enriched_analysis,
          dbHasAnalystGuidance: !!dbAnalysis.enriched_analysis?.analyst_guidance,
          dbGuidanceLength: dbAnalysis.enriched_analysis?.analyst_guidance?.length || 0,
          transformedHasSuccess: !!transformedAnalysis.success,
          transformedHasData: !!transformedAnalysis.data,
          transformedGuidanceLength: transformedAnalysis.data?.enriched_analysis?.analyst_guidance?.length || 0
        });
        
        setMitreAnalysis(transformedAnalysis);
        console.log('✅ MITRE analysis restored and transformed for full component compatibility');
      }
    } catch (err: any) {
      console.error('Failed to load alert:', err);
      let errorMessage = 'Failed to load alert details';
      
      if (err.response?.status === 404) {
        errorMessage = 'Alert not found. Please check the alert ID.';
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many requests. Please try again in a moment.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        errorMessage = 'Network error. Please check your connection and backend server.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async (alertId: string) => {
    try {
      setTimelineLoading(true);
      const response = await alertService.getAlertTimeline(alertId);
      if (response.success) {
        // Convert timestamp strings to Date objects
        const timelineWithDates = response.timeline.map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
        setTimeline(timelineWithDates);
      } else {
        console.error('Failed to load timeline:', response.error);
      }
    } catch (err: any) {
      console.error('Failed to load timeline:', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const loadRelatedIncidents = async (alertId: string) => {
    try {
      const response = await alertService.getAlertIncidents(alertId);
      if (response.success) {
        setRelatedIncidents(response.incidents);
      }
    } catch (error) {
      console.error('Failed to load related incidents:', error);
    }
  };

  // Refresh all alert data
  const refreshAlertData = async () => {
    if (!alertId) return;
    
    await Promise.all([
      loadAlertDetails(alertId),
      loadTimeline(alertId),
      loadRelatedIncidents(alertId)
    ]);
    
    // Refresh Redux store
    dispatch(fetchAlert(alertId));
  };

  // Load data when alertId changes
  useEffect(() => {
    if (alertId) {
      loadAlertDetails(alertId);
      loadRelatedIncidents(alertId);
      loadTimeline(alertId);
    }
  }, [alertId]);

  // Update AI analysis states when alert changes
  useEffect(() => {
    if (alert?.aiAnalysis) {
      setAiAnalysis(alert.aiAnalysis);
    }
    if (alert?.aiClassification) {
      setAiClassification(alert.aiClassification);
    }
    if (alert?.mitreAnalysis) {
      setMitreAnalysis(alert.mitreAnalysis);
    }
  }, [alert]);

  return {
    // Core alert data
    alert,
    loading,
    error,
    
    // Timeline data
    timeline,
    timelineLoading,
    
    // AI analysis data
    aiAnalysis,
    aiClassification,
    mitreAnalysis,
    
    // Related data
    relatedIncidents,
    
    // Loading functions
    loadAlertDetails,
    loadTimeline,
    loadRelatedIncidents,
    refreshAlertData,
    
    // State setter for external updates
    setAlert
  };
};