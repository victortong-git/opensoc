import { useState } from 'react';
import alertService from '../services/alertService';
import incidentService from '../services/incidentService';

export interface ProofReadingState {
  isProofReading: boolean;
  proofReadSuggestions: Record<string, string>;
  proofReadError: string | null;
  showProofReadSuggestions: boolean;
  acceptedSuggestions: Set<string>;
}

export interface UseProofReadingReturn extends ProofReadingState {
  handleProofRead: (fields: Record<string, string>, context?: 'incident' | 'threat_hunt') => Promise<void>;
  handleAcceptSuggestion: (fieldName: string, suggestedText: string, onFieldUpdate: (field: string, value: string) => void) => void;
  handleRejectSuggestion: (fieldName: string) => void;
  resetProofReading: () => void;
}

export const useProofReading = (): UseProofReadingReturn => {
  const [isProofReading, setIsProofReading] = useState(false);
  const [proofReadSuggestions, setProofReadSuggestions] = useState<Record<string, string>>({});
  const [proofReadError, setProofReadError] = useState<string | null>(null);
  const [showProofReadSuggestions, setShowProofReadSuggestions] = useState(true);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set());

  const handleProofRead = async (fields: Record<string, string>, context: 'incident' | 'threat_hunt' = 'incident') => {
    setIsProofReading(true);
    setProofReadError(null);

    try {
      // Filter out empty fields
      const nonEmptyFields = Object.fromEntries(
        Object.entries(fields).filter(([_, value]) => value && value.trim().length > 0)
      );

      if (Object.keys(nonEmptyFields).length === 0) {
        setProofReadError('No text content to proofread. Please fill in some form fields first.');
        return;
      }

      let response;
      
      if (context === 'threat_hunt') {
        // Use threat hunt specific proof-reading service
        console.log('🔍 Using threat hunt proof-reading service');
        response = await incidentService.proofReadThreatHuntContent(nonEmptyFields);
      } else {
        // Use incident proof-reading service (existing behavior)
        console.log('🔍 Using incident proof-reading service');
        
        // Convert field names to lowercase for backend compatibility
        const backendFields = Object.fromEntries(
          Object.entries(nonEmptyFields).map(([key, value]) => {
            // Convert camelCase to lowercase for backend
            const backendKey = key === 'impactAssessment' ? 'impactassessment' :
                              key === 'investigationPlan' ? 'investigationplan' :
                              key === 'containmentStrategy' ? 'containmentstrategy' :
                              key === 'estimatedTimeline' ? 'estimatedtimeline' :
                              key;
            return [backendKey, value];
          })
        );

        response = await alertService.proofReadIncidentFields(backendFields);
      }
      
      if (response.success) {
        let frontendSuggestions;
        
        if (context === 'threat_hunt') {
          // For threat hunts, extract suggestions from nested result structure and convert field names
          console.log('🔍 HOOK DEBUG: Raw response.suggestions:', JSON.stringify(response.suggestions, null, 2));
          const rawSuggestions = response.suggestions?.result || {};
          
          // Convert UPPERCASE field names to camelCase and extract suggestion text
          frontendSuggestions = Object.fromEntries(
            Object.entries(rawSuggestions).map(([key, value]) => {
              // Convert UPPERCASE AI field names back to camelCase frontend field names
              const frontendKey = key === 'TITLE' ? 'title' :
                                 key === 'DESCRIPTION' ? 'description' :
                                 key === 'HUNTINGPLAN' ? 'huntingPlan' :
                                 key === 'SUCCESSCRITERIA' ? 'successCriteria' :
                                 key === 'ESTIMATEDEFFORT' ? 'estimatedEffort' :
                                 key === 'EXPECTEDFINDINGS' ? 'expectedFindings' :
                                 key === 'COVERAGEGAPS' ? 'coverageGaps' :
                                 key.toLowerCase();
              
              // Keep the full suggestion object with reasoning and confidence for the UI
              return [frontendKey, value];
            })
          );
          
          console.log('🔍 HOOK DEBUG: Converted field names and extracted frontendSuggestions:', JSON.stringify(frontendSuggestions, null, 2));
        } else {
          // For incidents, convert response field names back from lowercase to camelCase
          frontendSuggestions = Object.fromEntries(
            Object.entries(response.suggestions || {}).map(([key, value]) => {
              // Convert lowercase back to camelCase for frontend
              const frontendKey = key === 'impactassessment' ? 'impactAssessment' :
                                key === 'investigationplan' ? 'investigationPlan' :
                                key === 'containmentstrategy' ? 'containmentStrategy' :
                                key === 'estimatedtimeline' ? 'estimatedTimeline' :
                                key;
              return [frontendKey, value];
            })
          );
        }
        
        setProofReadSuggestions(frontendSuggestions);
        if (Object.keys(frontendSuggestions).length === 0) {
          setProofReadError('No improvements found. Your text looks good!');
        } else {
          setProofReadError(null);
          setShowProofReadSuggestions(true);
        }
      } else {
        // Enhanced error message with more details
        const errorMessage = response.error || 'Proofreading failed. Please try again.';
        const helpMessage = response.helpMessage || '';
        const errorType = response.isNetworkError ? ' (Network Error)' :
                         response.isToolExecutorError ? ' (Tool Error)' :
                         response.isConfigError ? ' (Config Error)' :
                         response.isTimeout ? ' (Timeout)' : '';
        
        const fullErrorMessage = `${errorMessage}${errorType}${helpMessage ? ` - ${helpMessage}` : ''}`;
        console.error('Proofreading failed:', {
          error: response.error,
          errorDetails: response.errorDetails,
          technicalError: response.technicalError,
          errorType: response.errorType,
          fieldsAttempted: response.fieldsAttempted
        });
        
        setProofReadError(fullErrorMessage);
        setProofReadSuggestions({});
      }
    } catch (error) {
      console.error('Proofreading error:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.message || 
                          'AI proofreading service is not available. Please try again later.';
      setProofReadError(errorMessage);
      setProofReadSuggestions({});
    } finally {
      setIsProofReading(false);
    }
  };

  const handleAcceptSuggestion = (
    fieldName: string, 
    suggestedText: string, 
    onFieldUpdate: (field: string, value: string) => void
  ) => {
    onFieldUpdate(fieldName, suggestedText);
    setAcceptedSuggestions(prev => new Set([...prev, fieldName]));
    
    // Remove the suggestion after accepting
    setProofReadSuggestions(prev => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  };

  const handleRejectSuggestion = (fieldName: string) => {
    setProofReadSuggestions(prev => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  };

  const resetProofReading = () => {
    setIsProofReading(false);
    setProofReadSuggestions({});
    setProofReadError(null);
    setShowProofReadSuggestions(true);
    setAcceptedSuggestions(new Set());
  };

  return {
    isProofReading,
    proofReadSuggestions,
    proofReadError,
    showProofReadSuggestions,
    acceptedSuggestions,
    handleProofRead,
    handleAcceptSuggestion,
    handleRejectSuggestion,
    resetProofReading
  };
};