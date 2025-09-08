import { apiRequest } from './api';
import { DashboardStats, SecurityEvent } from '../types';

export interface DashboardStatsResponse {
  stats: DashboardStats;
  recentEvents: SecurityEvent[];
  assets: any[];
  timestamp: Date;
}

export interface AlertTrendData {
  time: string;
  timestamp: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface AlertTrendsResponse {
  alertTrends: AlertTrendData[];
  message: string;
}

export interface IncidentData {
  id: string;
  title: string;
  description: string;
  severity: number;
  status: string;
  category: string;
  assignedToName: string;
  alertCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDistribution {
  open: { count: number; percentage: string };
  investigating: { count: number; percentage: string };
  contained: { count: number; percentage: string };
  resolved: { count: number; percentage: string };
}

export interface IncidentsResponse {
  incidents: IncidentData[];
  workflowDistribution: WorkflowDistribution;
  totalIncidents: number;
  message: string;
}

export interface IncidentTrendData {
  time: string;
  timestamp: string;
  open: number;
  investigating: number;
  contained: number;
  resolved: number;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface IncidentTrendsResponse {
  incidentTrends: IncidentTrendData[];
  message: string;
}

export interface AlertTrend {
  date: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface IncidentTrend {
  date: string;
  total: number;
  resolved: number;
  open: number;
}

export interface AlertTrendsResponse {
  alertTrends: AlertTrend[];
  incidentTrends: IncidentTrend[];
}

export interface TopThreat {
  name: string;
  count: number;
  trend: number;
  averageSeverity: string;
}

export interface AttackVector {
  vector: string;
  count: number;
  percentage: number;
}

export interface TopThreatsResponse {
  topThreats: TopThreat[];
  attackVectors: AttackVector[];
}

export interface AssetStat {
  assetType: string;
  status: string;
  count: number;
  averageRisk: number;
}

export interface AssetOverviewResponse {
  assetStats: AssetStat[];
  topVulnerableAssets: any[];
}

export interface ResponseMetricsResponse {
  averageResponseTime: number;
  slaCompliance: number;
  incidentsByCategory: Array<{ name: string; value: number; color: string }>;
  message: string;
}

export interface TeamMember {
  name: string;
  resolved: number;
  active: number;
}

export interface TeamPerformanceResponse {
  teamPerformance: TeamMember[];
  message: string;
}

export interface AIAgent {
  name: string;
  status: 'active' | 'processing' | 'inactive' | 'error';
  lastActivity: string;
  tasksCompleted: number;
  accuracy: number;
}

export interface AIAgentsStatusResponse {
  aiAgents: AIAgent[];
  message: string;
}

class DashboardService {
  // Get dashboard statistics
  async getStats(): Promise<DashboardStatsResponse> {
    try {
      const response = await apiRequest.get<any>('/dashboard/stats');
      
      if (!response) {
        throw new Error('No data received from dashboard API');
      }
      
      // Transform API response to expected format
      return {
        stats: response.stats,
        recentEvents: response.recentEvents || [],
        assets: response.assets || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Dashboard API error:', error);
      throw error;
    }
  }

  // Get alert and incident trends
  async getTrends(days?: number): Promise<AlertTrendsResponse> {
    const params = days ? { days: days.toString() } : {};
    const response = await apiRequest.get<AlertTrendsResponse>('/dashboard/trends', { params });
    return response.data;
  }

  // Get top threats and attack vectors
  async getTopThreats(): Promise<TopThreatsResponse> {
    const response = await apiRequest.get<TopThreatsResponse>('/dashboard/threats');
    return response.data;
  }

  // Get asset overview
  async getAssetOverview(): Promise<AssetOverviewResponse> {
    const response = await apiRequest.get<AssetOverviewResponse>('/dashboard/assets');
    return response.data;
  }

  // Get alert trends by severity
  async getAlertTrends(hours: number = 24): Promise<AlertTrendsResponse> {
    try {
      const response = await apiRequest.get<AlertTrendsResponse>('/dashboard/alert-trends', {
        params: { hours: hours.toString() }
      });
      return response;
    } catch (error) {
      console.error('Alert trends API error:', error);
      throw error;
    }
  }

  // Get recent incidents with workflow distribution
  async getIncidents(limit: number = 5): Promise<IncidentsResponse> {
    try {
      const response = await apiRequest.get<IncidentsResponse>('/dashboard/incidents', {
        params: { limit: limit.toString() }
      });
      return response;
    } catch (error) {
      console.error('Incidents API error:', error);
      throw error;
    }
  }

  // Get response metrics and incident distribution
  async getResponseMetrics(): Promise<ResponseMetricsResponse> {
    try {
      const response = await apiRequest.get<ResponseMetricsResponse>('/dashboard/response-metrics');
      return response;
    } catch (error) {
      console.error('Response metrics API error:', error);
      throw error;
    }
  }

  // Get team performance statistics
  async getTeamPerformance(): Promise<TeamPerformanceResponse> {
    try {
      const response = await apiRequest.get<TeamPerformanceResponse>('/dashboard/team-performance');
      return response;
    } catch (error) {
      console.error('Team performance API error:', error);
      throw error;
    }
  }

  // Get AI agents status
  async getAIAgentsStatus(): Promise<AIAgentsStatusResponse> {
    try {
      const response = await apiRequest.get<AIAgentsStatusResponse>('/dashboard/ai-agents-status');
      return response;
    } catch (error) {
      console.error('AI agents status API error:', error);
      throw error;
    }
  }

  // Get incident trends by status and severity
  async getIncidentTrends(hours: number = 24): Promise<IncidentTrendsResponse> {
    try {
      const response = await apiRequest.get<IncidentTrendsResponse>('/dashboard/incident-trends', {
        params: { hours: hours.toString() }
      });
      return response;
    } catch (error) {
      console.error('Incident trends API error:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;