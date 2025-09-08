import { formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Alert Utility Functions
 * Common utilities for working with alerts and related data
 */

/**
 * Safely parse a date value that could be a string or Date object
 * @param dateValue - The date value to parse
 * @returns A valid Date object
 */
export const safeParseDate = (dateValue: string | Date): Date => {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') {
    try {
      return parseISO(dateValue);
    } catch {
      return new Date(dateValue);
    }
  }
  return new Date();
};

/**
 * Safely format a date value to a human-readable distance string
 * @param dateValue - The date value to format
 * @returns A formatted distance string like "2 hours ago" or "Unknown"
 */
export const safeFormatDistance = (dateValue: string | Date): string => {
  try {
    const parsedDate = safeParseDate(dateValue);
    if (isNaN(parsedDate.getTime())) return 'Unknown';
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  } catch {
    return 'Unknown';
  }
};

/**
 * Get severity color classes for alert severity levels
 * @param severity - The severity level (1-5)
 * @returns CSS class string for styling
 */
export const getSeverityColor = (severity: number): string => {
  switch (severity) {
    case 1:
      return 'text-green-400 bg-green-500/20 border-green-500/30';
    case 2:
      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 3:
      return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    case 4:
      return 'text-red-400 bg-red-500/20 border-red-500/30';
    case 5:
      return 'text-red-400 bg-red-600/30 border-red-600/40';
    default:
      return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
};

/**
 * Get status color classes for alert status
 * @param status - The alert status
 * @returns CSS class string for styling
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'new':
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case 'investigating':
      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 'resolved':
      return 'text-green-400 bg-green-500/20 border-green-500/30';
    case 'false_positive':
      return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    default:
      return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
  }
};

/**
 * Interface for different alert count data sources
 */
export interface AlertCountSources {
  jobProgress?: {
    alertsCreated: number;
    issuesFound: number;
  };
  securityStats?: {
    alertsCreated: number;
    securityIssues: number;
  };
  analysisResults?: {
    alertsCreated: number;
    securityIssuesFound: number;
  };
}

/**
 * Consolidated alert count data
 */
export interface ConsolidatedAlertCounts {
  alertsCreated: number;
  securityIssues: number;
  source: 'job_progress' | 'security_stats' | 'analysis_results' | 'fallback';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Consolidate alert count data from multiple sources with priority fallback
 * Priority: 1) Security Stats (most accurate), 2) Job Progress (real-time), 3) Analysis Results (completion)
 * @param sources - Object containing different data sources
 * @param debugContext - Context for debugging logs
 * @returns Consolidated alert count data with source information
 */
export const consolidateAlertCounts = (
  sources: AlertCountSources,
  debugContext?: string
): ConsolidatedAlertCounts => {
  const context = debugContext || 'unknown';
  
  console.log(`🔍 [${context}] Consolidating alert counts:`, sources);

  // Priority 1: Security Stats (database-backed, most accurate for final counts)
  if (sources.securityStats && (sources.securityStats.alertsCreated > 0 || sources.securityStats.securityIssues > 0)) {
    const result = {
      alertsCreated: Math.max(0, sources.securityStats.alertsCreated || 0),
      securityIssues: Math.max(0, sources.securityStats.securityIssues || 0),
      source: 'security_stats' as const,
      confidence: 'high' as const
    };
    console.log(`✅ [${context}] Using security stats (high confidence):`, result);
    return result;
  }

  // Priority 2: Job Progress (real-time during processing)
  if (sources.jobProgress && (sources.jobProgress.alertsCreated > 0 || sources.jobProgress.issuesFound > 0)) {
    const result = {
      alertsCreated: Math.max(0, sources.jobProgress.alertsCreated || 0),
      securityIssues: Math.max(0, sources.jobProgress.issuesFound || 0),
      source: 'job_progress' as const,
      confidence: 'medium' as const
    };
    console.log(`📊 [${context}] Using job progress (medium confidence):`, result);
    return result;
  }

  // Priority 3: Analysis Results (completion summary)
  if (sources.analysisResults && (sources.analysisResults.alertsCreated > 0 || sources.analysisResults.securityIssuesFound > 0)) {
    const result = {
      alertsCreated: Math.max(0, sources.analysisResults.alertsCreated || 0),
      securityIssues: Math.max(0, sources.analysisResults.securityIssuesFound || 0),
      source: 'analysis_results' as const,
      confidence: 'medium' as const
    };
    console.log(`📋 [${context}] Using analysis results (medium confidence):`, result);
    return result;
  }

  // Priority 4: Use any available data even if zero (showing processing state)
  if (sources.securityStats) {
    const result = {
      alertsCreated: Math.max(0, sources.securityStats.alertsCreated || 0),
      securityIssues: Math.max(0, sources.securityStats.securityIssues || 0),
      source: 'security_stats' as const,
      confidence: 'high' as const
    };
    console.log(`🔄 [${context}] Using security stats with zero values (high confidence):`, result);
    return result;
  }

  if (sources.jobProgress) {
    const result = {
      alertsCreated: Math.max(0, sources.jobProgress.alertsCreated || 0),
      securityIssues: Math.max(0, sources.jobProgress.issuesFound || 0),
      source: 'job_progress' as const,
      confidence: 'medium' as const
    };
    console.log(`🔄 [${context}] Using job progress with zero values (medium confidence):`, result);
    return result;
  }

  // Fallback: No data available
  const result = {
    alertsCreated: 0,
    securityIssues: 0,
    source: 'fallback' as const,
    confidence: 'low' as const
  };
  console.log(`⚠️ [${context}] No data available, using fallback (low confidence):`, result);
  return result;
};