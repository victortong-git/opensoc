import { apiRequest } from './api';

export interface DashboardMetrics {
  alerts: {
    total: number;
    active: number;
    last24Hours: number;
    last7Days: number;
    bySeverity: { severity: string; count: string }[];
    byStatus: { status: string; count: string }[];
  };
  incidents: {
    total: number;
    open: number;
    last24Hours: number;
    last7Days: number;
    bySeverity: { severity: string; count: string }[];
    byStatus: { status: string; count: string }[];
  };
  assets: {
    total: number;
    online: number;
    byType: { type: string; count: string }[];
    byStatus: { status: string; count: string }[];
    riskDistribution: { risk_level: string; count: string }[];
  };
  iocs: {
    total: number;
    active: number;
    last24Hours: number;
    last7Days: number;
    byType: { type: string; count: string }[];
    byConfidence: { confidence: string; count: string }[];
  };
  trends: {
    alerts: { date: string; count: string }[];
    incidents: { date: string; count: string }[];
    iocs: { date: string; count: string }[];
  };
  timestamp: string;
}

export interface AlertTrendParams {
  period?: '24h' | '7d' | '30d' | '90d';
  groupBy?: 'hour' | 'day' | 'week';
  startDate?: string; // ISO date string (YYYY-MM-DD)
  endDate?: string;   // ISO date string (YYYY-MM-DD)
}

export interface AlertTrends {
  period: string;
  groupBy: string;
  trends: {
    period: string;
    total_alerts: string;
    critical_alerts: string;
    new_alerts: string;
    investigating_alerts: string;
    resolved_alerts: string;
  }[];
  summary: {
    totalPeriods: number;
    totalAlerts: number;
    criticalAlerts: number;
  };
}

export interface SecurityComparisonParams {
  currentPeriod?: '24h' | '7d' | '30d';
  previousPeriod?: '24h' | '7d' | '30d';
}

export interface SecurityComparison {
  currentPeriod: string;
  previousPeriod: string;
  comparison: {
    alerts: { current: number; previous: number; change: number };
    incidents: { current: number; previous: number; change: number };
    criticalAlerts: { current: number; previous: number; change: number };
    newIOCs: { current: number; previous: number; change: number };
  };
  periods: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
}

export interface PerformanceMetrics {
  meanTimeToDetect: number; // in minutes
  meanTimeToRespond: number; // in minutes
  systemHealth: number; // percentage (0-100)
  slaCompliance: number; // percentage (0-100)
  totalIncidentsResolved: number;
  totalResponseTime: number; // in minutes
  timestamp: string;
}

class AnalyticsService {
  private baseUrl = '/analytics';

  /**
   * Get comprehensive dashboard metrics and statistics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await apiRequest.get<DashboardMetrics>(`${this.baseUrl}/dashboard`);
    return response;
  }

  /**
   * Get alert trend analysis with time-based grouping
   */
  async getAlertTrends(params?: AlertTrendParams): Promise<AlertTrends> {
    const response = await apiRequest.get<AlertTrends>(`${this.baseUrl}/alerts/trends`, { params });
    return response;
  }

  /**
   * Get security metrics comparison between periods
   */
  async getSecurityComparison(params?: SecurityComparisonParams): Promise<SecurityComparison> {
    const response = await apiRequest.get<SecurityComparison>(`${this.baseUrl}/security/comparison`, { params });
    return response;
  }

  /**
   * Get performance metrics including MTTR and system health
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const response = await apiRequest.get<PerformanceMetrics>(`${this.baseUrl}/performance`);
    return response;
  }
}

export default new AnalyticsService();