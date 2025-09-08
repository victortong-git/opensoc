import { apiRequest } from './api';
import { Incident } from '../types';

export interface IncidentsResponse {
  incidents: Incident[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateIncidentRequest {
  title: string;
  description?: string;
  severity: number;
  category?: 'malware' | 'intrusion' | 'data_breach' | 'policy_violation' | 'insider_threat';
  assignedTo?: string;
  alertIds?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  severity?: number;
  status?: 'open' | 'investigating' | 'contained' | 'resolved';
  category?: 'malware' | 'intrusion' | 'data_breach' | 'policy_violation' | 'insider_threat';
  assignedTo?: string;
  alertIds?: string[];
  metadata?: Record<string, any>;
}

export interface CloseIncidentRequest {
  resolution?: string;
}

export interface AddNoteRequest {
  note: string;
}

export interface AIDraftAdditionalInfoResponse {
  success: boolean;
  draftedFields: {
    responseplan?: string;
    impactassessment?: string;
    investigationplan?: string;
    containmentstrategy?: string;
    estimatedtimeline?: string;
  };
  confidence: number;
  processingTime: number;
  incident: {
    id: string;
    title: string;
    severity: number;
    status: string;
  };
  error?: string;
}

export interface ThreatHuntGenerationResponse {
  success: boolean;
  threatHuntData: {
    title: string;
    description: string;
    priority: number;
    category: string;
    huntType: 'proactive' | 'reactive' | 'intel_driven';
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
    confidence: number;
    metadata: any;
  };
  incident: {
    id: string;
    title: string;
    severity: number;
    status: string;
    category: string;
  };
  processingTimeMs: number;
  generatedAt: string;
  error?: string;
}

class IncidentService {
  // Get incidents with filtering and pagination
  async getIncidents(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    severity?: number | number[];
    status?: string | string[];
    category?: string | string[];
    assignedTo?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }): Promise<IncidentsResponse> {
    const response = await apiRequest.get<IncidentsResponse>('/incidents', { params });
    return response;
  }

  // Get single incident
  async getIncident(id: string): Promise<Incident> {
    const response = await apiRequest.get<{ incident: Incident }>(`/incidents/${id}`);
    return response.incident;
  }

  // Create new incident
  async createIncident(data: CreateIncidentRequest): Promise<Incident> {
    const response = await apiRequest.post<{ incident: Incident; message: string }>('/incidents', data);
    return response.incident;
  }

  // Update incident
  async updateIncident(id: string, data: UpdateIncidentRequest): Promise<Incident> {
    const response = await apiRequest.put<{ incident: Incident; message: string }>(`/incidents/${id}`, data);
    return response.incident;
  }

  // Close incident
  async closeIncident(id: string, data?: CloseIncidentRequest): Promise<Incident> {
    const response = await apiRequest.post<{ incident: Incident; message: string }>(`/incidents/${id}/close`, data);
    return response.incident;
  }

  // Add note to incident
  async addNote(id: string, data: AddNoteRequest): Promise<any> {
    const response = await apiRequest.post<{ note: any; message: string }>(`/incidents/${id}/notes`, data);
    return response.note;
  }

  // Delete incident
  async deleteIncident(id: string): Promise<void> {
    await apiRequest.delete<{ message: string }>(`/incidents/${id}`);
  }

  // Resolve incident (alias for closeIncident)
  async resolveIncident(id: string, resolution: string): Promise<Incident> {
    return this.closeIncident(id, { resolution });
  }

  // Add timeline event to incident
  async addTimelineEvent(id: string, data: {
    type: 'alert' | 'action' | 'note' | 'status_change' | 'escalation';
    title: string;
    description?: string;
    timestamp?: string | Date;
  }): Promise<any> {
    const response = await apiRequest.post<{ timelineEvent: any; message: string }>(`/incidents/${id}/timeline`, data);
    return response.timelineEvent;
  }

  // Get incident statistics
  async getIncidentStats(days?: number): Promise<any> {
    const params = days ? { days: days.toString() } : {};
    const response = await apiRequest.get<any>('/incidents/stats', { params });
    return response;
  }

  // AI draft additional information for incident
  async draftAdditionalInformation(id: string): Promise<AIDraftAdditionalInfoResponse> {
    try {
      const response = await apiRequest.post<AIDraftAdditionalInfoResponse>(`/incidents/${id}/ai-draft-additional-info`, {}, {
        timeout: 150000 // 2.5 minutes for AI drafting - longer than backend to avoid frontend timeout
      });
      return response;
    } catch (error: any) {
      console.error('AI drafting failed:', error);
      
      // Extract specific error message from API response
      let errorMessage = 'AI drafting service is not available. Please try again later.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error occurred during AI drafting. Please try again later.';
      } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        errorMessage = 'AI drafting is taking longer than expected. This is normal for complex incidents. Please try again.';
      } else if (error?.code === 'NETWORK_ERROR' || error?.response?.status === 0) {
        errorMessage = 'Network connection error. Please check your connection and try again.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'AI drafting service not found. Please contact system administrator.';
      } else if (error?.response?.status >= 400 && error?.response?.status < 500) {
        errorMessage = 'Invalid request for AI drafting. Please try again or contact support.';
      }
      
      return {
        success: false,
        draftedFields: {},
        confidence: 0,
        processingTime: 0,
        incident: {
          id: id,
          title: 'Unknown',
          severity: 0,
          status: 'unknown'
        },
        error: errorMessage
      };
    }
  }

  // Generate threat hunt from incident
  async generateThreatHuntFromIncident(id: string): Promise<ThreatHuntGenerationResponse> {
    try {
      console.log('🎯 FRONTEND DEBUG: Starting threat hunt generation for incident:', id);
      
      const response = await apiRequest.post<ThreatHuntGenerationResponse>(`/incidents/${id}/generate-threat-hunt`, {}, {
        timeout: 180000 // 3 minutes for threat hunt generation - longer than backend to avoid frontend timeout
      });
      
      console.log('🎯 FRONTEND DEBUG: Received threat hunt response');
      console.log('🎯 FRONTEND DEBUG: Response success:', response?.success);
      console.log('🎯 FRONTEND DEBUG: Response has threatHuntData:', !!response?.threatHuntData);
      console.log('🎯 FRONTEND DEBUG: Response keys:', Object.keys(response || {}));
      
      // Handle nested result structure from backend
      if (response?.threatHuntData && response.threatHuntData.result) {
        console.log('🎯 FRONTEND DEBUG: Flattening nested threatHuntData.result structure');
        const flattenedData = {
          ...response,
          threatHuntData: {
            ...response.threatHuntData.result,
            // Keep any metadata from the wrapper
            confidence: response.threatHuntData.result.confidence || response.threatHuntData.confidence || 0,
            metadata: response.threatHuntData.result.metadata || response.threatHuntData.metadata || {}
          }
        };
        console.log('🎯 FRONTEND DEBUG: Flattened threatHuntData title:', flattenedData.threatHuntData.title);
        console.log('🎯 FRONTEND DEBUG: Flattened threatHuntData priority:', flattenedData.threatHuntData.priority);
        return flattenedData;
      }
      
      // Validate that we have the expected fields
      if (response?.threatHuntData && !response.threatHuntData.title) {
        console.warn('🎯 FRONTEND DEBUG: Missing title in threatHuntData - may indicate backend data structure issue');
        console.warn('🎯 FRONTEND DEBUG: ThreatHuntData keys:', Object.keys(response.threatHuntData));
      }
      
      return response;
    } catch (error: any) {
      console.error('🎯 FRONTEND DEBUG: Threat hunt generation failed:', error);
      
      // Extract specific error message from API response
      let errorMessage = 'Threat hunt generation service is not available. Please try again later.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error occurred during threat hunt generation. Please try again later.';
      } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        errorMessage = 'Threat hunt generation is taking longer than expected. This is normal for complex incidents. Please try again.';
      } else if (error?.code === 'NETWORK_ERROR' || error?.response?.status === 0) {
        errorMessage = 'Network connection error. Please check your connection and try again.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Threat hunt generation service not found. Please contact system administrator.';
      } else if (error?.response?.status >= 400 && error?.response?.status < 500) {
        errorMessage = 'Invalid request for threat hunt generation. Please try again or contact support.';
      }
      
      return {
        success: false,
        threatHuntData: {
          title: '',
          description: '',
          priority: 1,
          category: '',
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
          confidence: 0,
          metadata: {}
        },
        incident: {
          id: id,
          title: 'Unknown',
          severity: 0,
          status: 'unknown',
          category: 'unknown'
        },
        processingTimeMs: 0,
        generatedAt: new Date().toISOString(),
        error: errorMessage
      };
    }
  }

  // Proof-read threat hunt content
  async proofReadThreatHuntContent(fieldsToProofRead: Record<string, string>): Promise<{
    success: boolean;
    suggestions?: any;
    processingTimeMs?: number;
    proofReadAt?: string;
    error?: string;
  }> {
    try {
      console.log('🔍 FRONTEND DEBUG: Starting threat hunt proof-reading...');
      console.log('🔍 FRONTEND DEBUG: Fields to proof-read:', Object.keys(fieldsToProofRead));
      
      const response = await apiRequest.post<{
        success: boolean;
        suggestions: any;
        processingTimeMs: number;
        proofReadAt: string;
      }>('/incidents/threat-hunt/proof-read', {
        fieldsToProofRead
      }, {
        timeout: 120000 // 2 minutes for proof-reading
      });
      
      console.log('🔍 FRONTEND DEBUG: Received proof-reading response');
      console.log('🔍 FRONTEND DEBUG: Response success:', response.success);
      console.log('🔍 FRONTEND DEBUG: Complete response:', JSON.stringify(response, null, 2));
      console.log('🔍 FRONTEND DEBUG: Response.suggestions:', JSON.stringify(response.suggestions, null, 2));
      console.log('🔍 FRONTEND DEBUG: Response.suggestions?.result:', JSON.stringify(response.suggestions?.result, null, 2));
      
      return response;
    } catch (error: any) {
      console.error('🔍 FRONTEND DEBUG: Threat hunt proof-reading failed:', error);
      
      // Extract specific error message from API response
      let errorMessage = 'Threat hunt proof-reading service is not available. Please try again later.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error occurred during proof-reading. Please try again later.';
      } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        errorMessage = 'Proof-reading is taking longer than expected. Please try again.';
      } else if (error?.code === 'NETWORK_ERROR' || error?.response?.status === 0) {
        errorMessage = 'Network connection error. Please check your connection and try again.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Threat hunt proof-reading service not found. Please contact system administrator.';
      } else if (error?.response?.status >= 400 && error?.response?.status < 500) {
        errorMessage = 'Invalid request for proof-reading. Please try again or contact support.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

export const incidentService = new IncidentService();
export default incidentService;