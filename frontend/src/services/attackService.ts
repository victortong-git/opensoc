import axios, { AxiosResponse } from 'axios';
import { getAuthToken } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * MITRE ATT&CK Service
 * Frontend service for consuming ATT&CK API endpoints and AI tool calling
 */

// Types for API responses
export interface AttackTechnique {
  techniqueId: string;
  name: string;
  description: string;
  platforms: string[];
  tactics: string[];
  dataSources: string[];
  isSubTechnique: boolean;
  url?: string;
}

export interface AttackTactic {
  id: string;
  mitreId: string;
  name: string;
  description: string;
  shortName?: string;
  url?: string;
  techniques?: AttackTechnique[];
}

export interface AttackMatrix {
  domain: string;
  tactics: AttackTactic[];
}

export interface ToolCallLog {
  id: string;
  sessionId: string;
  toolName: string;
  toolParameters: any;
  toolResponse: any;
  reasoningEffort: 'low' | 'medium' | 'high';
  toolExecutionSuccess: boolean;
  toolExecutionDurationMs?: number;
  aiReasoning?: string;
  decisionConfidence?: number;
  createdAt: string;
  isDemoSession: boolean;
  hackathonDemoTag?: string;
}

export interface AIToolCallingResult {
  success: boolean;
  sessionId: string;
  response: string;
  toolCalls: any[];
  reasoning: string;
  executionMetadata: {
    modelName: string;
    reasoningEffort: string;
    toolCallCount: number;
    totalExecutionTime: number;
    tokensUsed: number;
  };
}

export interface ToolCallingStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: string;
  averageExecutionTimeMs: number;
  toolUsageStats: Array<{
    toolName: string;
    callCount: number;
    averageExecutionTimeMs: number;
  }>;
}

// Create axios instance with auth
const createAxiosInstance = () => {
  const token = getAuthToken();
  return axios.create({
    baseURL: API_BASE,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Validate STIX data availability
 */
export const validateSTIXData = async (): Promise<{
  success: boolean;
  data: {
    enterprise: boolean;
    mobile: boolean;
    ics: boolean;
    baseDirectory: boolean;
  };
  message: string;
}> => {
  const api = createAxiosInstance();
  const response = await api.get('/attack/validate');
  return response.data;
};

/**
 * Get ATT&CK tactics for specified domain
 */
export const getTactics = async (domain: string = 'enterprise'): Promise<{
  success: boolean;
  data: AttackTactic[];
  domain: string;
  count: number;
}> => {
  const api = createAxiosInstance();
  const response = await api.get('/attack/tactics', { params: { domain } });
  return response.data;
};

/**
 * Search ATT&CK techniques
 */
export const searchTechniques = async (params: {
  query?: string;
  domain?: string;
  platform?: string;
  tactic?: string;
  max_results?: number;
  include_sub_techniques?: boolean;
}): Promise<{
  success: boolean;
  data: AttackTechnique[];
  query: string;
  domain: string;
  count: number;
}> => {
  const api = createAxiosInstance();
  const response = await api.get('/attack/techniques', { params });
  return response.data;
};

/**
 * Get technique details by MITRE ID
 */
export const getTechniqueDetails = async (
  mitreId: string, 
  domain: string = 'enterprise'
): Promise<{
  success: boolean;
  data: AttackTechnique;
  mitreId: string;
  domain: string;
}> => {
  const api = createAxiosInstance();
  const response = await api.get(`/attack/techniques/${mitreId}`, { params: { domain } });
  return response.data;
};

/**
 * Get ATT&CK matrix
 */
export const getAttackMatrix = async (
  domain: string = 'enterprise',
  platformFilter?: string
): Promise<{
  success: boolean;
  data: AttackMatrix;
  statistics: {
    totalTactics: number;
    totalTechniques: number;
    averageTechniquesPerTactic: number;
  };
}> => {
  const api = createAxiosInstance();
  const params: any = { domain };
  if (platformFilter) params.platform_filter = platformFilter;
  
  const response = await api.get('/attack/matrix', { params });
  return response.data;
};

/**
 * Get available platforms
 */
export const getPlatforms = async (domain: string = 'enterprise'): Promise<{
  success: boolean;
  data: string[];
  domain: string;
  count: number;
}> => {
  const api = createAxiosInstance();
  const response = await api.get('/attack/platforms', { params: { domain } });
  return response.data;
};

/**
 * Get data sources
 */
export const getDataSources = async (domain: string = 'enterprise'): Promise<{
  success: boolean;
  data: string[];
  domain: string;
  count: number;
}> => {
  const api = createAxiosInstance();
  const response = await api.get('/attack/data-sources', { params: { domain } });
  return response.data;
};

// === AI TOOL CALLING ENDPOINTS ===

/**
 * AI-powered search using GPT-OSS tool calling
 */
export const aiSearch = async (params: {
  query: string;
  sessionId?: string;
  isDemoSession?: boolean;
  hackathonDemoTag?: string;
}): Promise<{
  success: boolean;
  data: AIToolCallingResult;
  message: string;
}> => {
  const api = createAxiosInstance();
  const response = await api.post('/attack/ai-search', params);
  return response.data;
};

/**
 * AI-powered threat hunt mapping
 */
export const aiMapThreatHunt = async (params: {
  huntDescription: string;
  huntMethodology?: string;
  targetPlatform?: string;
  scope?: string;
  sessionId?: string;
  isDemoSession?: boolean;
  hackathonDemoTag?: string;
  threatHuntId?: string;
}): Promise<{
  success: boolean;
  data: AIToolCallingResult;
  message: string;
}> => {
  const api = createAxiosInstance();
  const response = await api.post('/attack/ai-map-hunt', params);
  return response.data;
};

/**
 * Comprehensive AI analysis with tool calling
 */
export const aiAnalyze = async (params: {
  prompt: string;
  sessionId?: string;
  isDemoSession?: boolean;
  hackathonDemoTag?: string;
}): Promise<{
  success: boolean;
  data: AIToolCallingResult;
  message: string;
}> => {
  const api = createAxiosInstance();
  const response = await api.post('/attack/ai-analyze', params);
  return response.data;
};

// === TOOL CALLING LOG ENDPOINTS ===

/**
 * Get tool calling activity logs
 */
export const getToolCallingLogs = async (params?: {
  sessionId?: string;
  isDemoSession?: boolean;
  hackathonDemoTag?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  success: boolean;
  data: ToolCallLog[];
  filters: any;
  count: number;
}> => {
  const api = createAxiosInstance();
  const response = await api.get('/attack/tool-calling-logs', { params });
  return response.data;
};

/**
 * Get tool calling statistics
 */
export const getToolCallingStats = async (params?: {
  isDemoSession?: boolean;
  startDate?: string;
  endDate?: string;
}): Promise<{
  success: boolean;
  data: ToolCallingStats;
  filters: any;
  generatedAt: string;
}> => {
  const api = createAxiosInstance();
  const response = await api.get('/attack/tool-calling-stats', { params });
  return response.data;
};

/**
 * Get logs for specific session
 */
export const getSessionLogs = async (
  sessionId: string,
  includeToolResponse: boolean = true
): Promise<{
  success: boolean;
  data: ToolCallLog[];
  sessionId: string;
  count: number;
  timeline: {
    startTime: string;
    endTime: string;
  };
}> => {
  const api = createAxiosInstance();
  const response = await api.get(`/attack/session-logs/${sessionId}`, {
    params: { includeToolResponse }
  });
  return response.data;
};

/**
 * Get demo logs for hackathon presentation
 */
export const getDemoLogs = async (params?: {
  hackathonDemoTag?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  data: {
    logs: ToolCallLog[];
    logsBySession: Record<string, ToolCallLog[]>;
    sessions: string[];
  };
  demoMetadata: {
    organizationId: string;
    hackathonDemoTag?: string;
    totalSessions: number;
    totalLogs: number;
  };
}> => {
  const api = createAxiosInstance();
  const response = await api.get('/attack/demo-logs', { params });
  return response.data;
};

// === UTILITY FUNCTIONS ===

/**
 * Format technique ID for display
 */
export const formatTechniqueId = (techniqueId: string): string => {
  // Add proper formatting for sub-techniques (T1566.001 -> T1566.001)
  return techniqueId;
};

/**
 * Get technique URL
 */
export const getTechniqueUrl = (techniqueId: string, domain: string = 'enterprise'): string => {
  const baseUrl = 'https://attack.mitre.org/techniques';
  return `${baseUrl}/${techniqueId}/`;
};

/**
 * Format confidence score
 */
export const formatConfidence = (confidence?: number): string => {
  if (confidence === undefined) return 'N/A';
  return `${Math.round(confidence * 100)}%`;
};

/**
 * Get tactic color for UI
 */
export const getTacticColor = (tacticName: string): string => {
  const colors: Record<string, string> = {
    'reconnaissance': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'resource-development': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'initial-access': 'bg-red-500/20 text-red-400 border-red-500/30',
    'execution': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'persistence': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'privilege-escalation': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'defense-evasion': 'bg-lime-500/20 text-lime-400 border-lime-500/30',
    'credential-access': 'bg-green-500/20 text-green-400 border-green-500/30',
    'discovery': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'lateral-movement': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    'collection': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'command-and-control': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    'exfiltration': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'impact': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  };
  
  const normalizedName = tacticName.toLowerCase().replace(/\s+/g, '-');
  return colors[normalizedName] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
};

/**
 * Get platform icon
 */
export const getPlatformIcon = (platform: string): string => {
  const icons: Record<string, string> = {
    'Windows': '🪟',
    'Linux': '🐧',
    'macOS': '🍎',
    'Network': '🌐',
    'Containers': '📦',
    'SaaS': '☁️',
    'IaaS': '🏗️',
    'Android': '🤖',
    'iOS': '📱'
  };
  
  return icons[platform] || '💻';
};

export default {
  validateSTIXData,
  getTactics,
  searchTechniques,
  getTechniqueDetails,
  getAttackMatrix,
  getPlatforms,
  getDataSources,
  aiSearch,
  aiMapThreatHunt,
  aiAnalyze,
  getToolCallingLogs,
  getToolCallingStats,
  getSessionLogs,
  getDemoLogs,
  formatTechniqueId,
  getTechniqueUrl,
  formatConfidence,
  getTacticColor,
  getPlatformIcon
};