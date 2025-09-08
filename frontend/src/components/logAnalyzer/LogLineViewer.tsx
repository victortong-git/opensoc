import React, { useState, useEffect } from 'react';
import { LogFileLine, Pagination } from '../../store/logAnalyzerSlice';
import { Hash, Calendar, Tag, Search, ChevronDown, ChevronRight, RefreshCw, Edit, Trash2, Plus, Shield, ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import EditLineModal from './EditLineModal';
import AddLineModal from './AddLineModal';
import logAnalyzerService from '../../services/logAnalyzerService';

interface LogLineViewerProps {
  lines: LogFileLine[];
  loading: boolean;
  pagination: Pagination | null;
  fileId: string;
  onPageChange: (page: number) => void;
  onRefresh?: () => void;
}

const LogLineViewer: React.FC<LogLineViewerProps> = ({
  lines,
  loading,
  pagination,
  fileId,
  onPageChange,
  onRefresh
}) => {
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const [showParsedData, setShowParsedData] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState<LogFileLine | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [securityAnalysisLoading, setSecurityAnalysisLoading] = useState(false);
  const [securityStats, setSecurityStats] = useState<any>(null);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [batchSize, setBatchSize] = useState<number>(10);

  // Load security analysis stats on mount and when fileId changes
  useEffect(() => {
    loadSecurityStats();
  }, [fileId]);

  const loadSecurityStats = async () => {
    try {
      const response = await logAnalyzerService.getSecurityAnalysisStats(fileId);
      setSecurityStats(response.data);
    } catch (error) {
      console.error('Failed to load security stats:', error);
    }
  };

  const handleSecurityAnalysis = async () => {
    if (securityAnalysisLoading) return;

    setSecurityAnalysisLoading(true);
    setAnalysisProgress('Initializing AI security analysis...');
    setAnalysisResults(null);
    
    try {
      // Start analysis with selected batch size
      setAnalysisProgress(`Processing up to ${batchSize} unanalyzed log entries...`);
      const response = await logAnalyzerService.analyzeFileSecurity(fileId, batchSize);
      
      // Set detailed results
      setAnalysisResults(response.data);
      setAnalysisProgress(`Analysis completed! Processed ${response.data.totalAnalyzed} lines in ${response.data.batchStats?.length || 0} batches.`);
      
      // Reload security stats and refresh lines
      await loadSecurityStats();
      if (onRefresh) {
        onRefresh();
      }
      
      // Clear progress message after a delay
      setTimeout(() => {
        setAnalysisProgress('');
      }, 5000);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to analyze security';
      setAnalysisProgress(`Error: ${errorMessage}`);
      setAnalysisResults(null);
      
      // Clear error message after delay
      setTimeout(() => {
        setAnalysisProgress('');
      }, 5000);
    } finally {
      setSecurityAnalysisLoading(false);
    }
  };

  const toggleLineExpansion = (lineId: string) => {
    const newExpanded = new Set(expandedLines);
    if (newExpanded.has(lineId)) {
      newExpanded.delete(lineId);
    } else {
      newExpanded.add(lineId);
    }
    setExpandedLines(newExpanded);
  };

  const highlightSearchTerms = (content: string, searchTerm?: string) => {
    if (!searchTerm) return content;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return content.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  };

  const formatParsedData = (parsedData: Record<string, any>) => {
    if (!parsedData || Object.keys(parsedData).length === 0) {
      return null;
    }

    return (
      <div className="mt-2 p-3 bg-gray-50 dark:bg-soc-dark-800 rounded-lg border border-gray-200 dark:border-soc-dark-600">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
          Parsed Data
        </h4>
        <div className="space-y-1">
          {Object.entries(parsedData).map(([key, value]) => (
            <div key={key} className="flex items-start text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium min-w-20 mr-2">
                {key}:
              </span>
              <span className="text-gray-700 dark:text-gray-300 break-all">
                {Array.isArray(value) ? value.join(', ') : String(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getLogLevelColor = (level?: string) => {
    if (!level) return '';
    
    switch (level.toUpperCase()) {
      case 'ERROR':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'WARN':
      case 'WARNING':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'INFO':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'DEBUG':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
      case 'TRACE':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const handleEditLine = (line: LogFileLine) => {
    setSelectedLine(line);
    setShowEditModal(true);
  };

  const handleDeleteLine = async (line: LogFileLine) => {
    if (!confirm(`Are you sure you want to delete line #${line.lineNumber}?`)) {
      return;
    }

    setActionLoading(line.id);
    try {
      await logAnalyzerService.deleteLine(fileId, line.id);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || error.message || 'Failed to delete line');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLineActionSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const getSecuritySeverityColor = (severity?: string) => {
    if (!severity) return '';
    
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/50';
      case 'high':
        return 'text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/30';
      case 'medium':
        return 'text-orange-600 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30';
      case 'low':
        return 'text-yellow-600 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30';
    }
  };

  const getSecuritySeverityIcon = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return <ShieldAlert className="h-3 w-3" />;
      case 'medium':
        return <AlertTriangle className="h-3 w-3" />;
      case 'low':
        return <Info className="h-3 w-3" />;
      default:
        return <Shield className="h-3 w-3" />;
    }
  };

  if (loading && lines.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-soc-dark-700 rounded h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="p-6 text-center">
        <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          No log lines found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This file may not have been processed yet, or your search didn't match any lines.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Options */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-soc-dark-800 border-b border-gray-200 dark:border-soc-dark-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {pagination && (
              <span>
                Showing {lines.length} of {pagination.total} lines
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-xs flex items-center"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Line
            </button>
            
            {/* Batch Size Selector */}
            <div className="flex items-center space-x-2">
              <label htmlFor="batch-size" className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Batch Size:
              </label>
              <div className="relative">
                <select
                  id="batch-size"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                  className="text-xs px-3 py-1 pr-8 border border-gray-300 dark:border-soc-dark-600 rounded bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-opensoc-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value={1}>1 line</option>
                  <option value={5}>5 lines</option>
                  <option value={10}>10 lines</option>
                  <option value={20}>20 lines</option>
                  <option value={50}>50 lines</option>
                  <option value={100}>100 lines</option>
                </select>
                {/* Custom dropdown arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSecurityAnalysis}
              disabled={securityAnalysisLoading}
              className="btn-secondary text-xs flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
            >
              {securityAnalysisLoading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1" />
              ) : (
                <Shield className="h-3 w-3 mr-1" />
              )}
              {securityAnalysisLoading ? `Analyzing (${batchSize})...` : `🤖 AI Security Analysis (${batchSize} lines)`}
            </button>

            {securityStats && (
              <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-soc-dark-800 px-2 py-1 rounded">
                {securityStats.analysisProgress}% analyzed 
                {securityStats.securityIssues > 0 && (
                  <span className="ml-2 text-red-600 dark:text-red-400">
                    {securityStats.securityIssues} issues
                  </span>
                )}
              </div>
            )}
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showParsedData}
                onChange={(e) => setShowParsedData(e.target.checked)}
                className="mr-2 rounded"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Show parsed data
              </span>
            </label>
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Refresh lines"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Analysis Progress */}
        {analysisProgress && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
            <div className="flex items-center">
              {securityAnalysisLoading && (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-2" />
              )}
              <span className="text-blue-700 dark:text-blue-300">{analysisProgress}</span>
            </div>
          </div>
        )}
        
        {/* Analysis Results */}
        {analysisResults && (
          <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
            <div className="text-xs text-green-800 dark:text-green-200">
              <div className="font-semibold mb-2 flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                AI Security Analysis Results
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <span className="font-medium">Analyzed:</span>
                  <span className="ml-1">{analysisResults.totalAnalyzed}</span>
                </div>
                <div>
                  <span className="font-medium">Issues Found:</span>
                  <span className="ml-1 text-red-600 dark:text-red-400">{analysisResults.securityIssuesFound}</span>
                </div>
                <div>
                  <span className="font-medium">Alerts Created:</span>
                  <span className="ml-1 text-orange-600 dark:text-orange-400">{analysisResults.alertsCreated}</span>
                </div>
                <div>
                  <span className="font-medium">Batches:</span>
                  <span className="ml-1">{analysisResults.batchStats?.length || 0}</span>
                </div>
                {/* Debug logging for LogLineViewer */}
                {(() => {
                  console.log('🔍 LogLineViewer - Alert count debugging:', {
                    component: 'LogLineViewer',
                    analysisResultsAlertsCreated: analysisResults.alertsCreated,
                    analysisResultsSecurityIssuesFound: analysisResults.securityIssuesFound,
                    batchStatsLength: analysisResults.batchStats?.length,
                    fullAnalysisResults: analysisResults
                  });
                  return null;
                })()}
              </div>
              {analysisResults.errors && analysisResults.errors.length > 0 && (
                <div className="mt-2 text-red-600 dark:text-red-400">
                  <span className="font-medium">Errors:</span> {analysisResults.errors.length}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Log Lines */}
      <div className="max-h-96 overflow-y-auto">
        {lines.map((line) => {
          const isExpanded = expandedLines.has(line.id);
          const logLevel = line.parsedData?.level;
          const timestamp = line.parsedData?.timestamp;
          const ipAddresses = line.parsedData?.ip_addresses;
          
          return (
            <div
              key={line.id}
              className={`border-b border-gray-100 dark:border-soc-dark-700 hover:bg-gray-50 dark:hover:bg-soc-dark-800 transition-colors ${
                logLevel ? getLogLevelColor(logLevel) : ''
              }`}
            >
              <div className="p-4">
                {/* Line Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Hash className="h-3 w-3 mr-1" />
                      <span className="font-mono">{line.lineNumber}</span>
                    </div>
                    
                    {logLevel && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLogLevelColor(logLevel)}`}>
                        {logLevel}
                      </span>
                    )}
                    
                    {timestamp && (
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span className="font-mono">{timestamp}</span>
                      </div>
                    )}
                    
                    {ipAddresses && ipAddresses.length > 0 && (
                      <div className="flex items-center space-x-1">
                        {ipAddresses.slice(0, 2).map((ip: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded font-mono"
                          >
                            {ip}
                          </span>
                        ))}
                        {ipAddresses.length > 2 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{ipAddresses.length - 2} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Security Analysis Indicators */}
                    {line.securityAnalyzed && (
                      <div className="flex items-center space-x-1">
                        {line.hasSecurityIssue ? (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${
                              getSecuritySeverityColor(line.securityIssueSeverity)
                            }`}
                            title={line.securityIssueDescription || 'Security issue detected'}
                          >
                            {getSecuritySeverityIcon(line.securityIssueSeverity)}
                            <span className="ml-1">
                              {line.securityIssueSeverity?.toUpperCase() || 'ISSUE'}
                            </span>
                          </span>
                        ) : (
                          <span
                            className="px-2 py-1 text-xs font-medium rounded-full flex items-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                            title="Analyzed - no security issues detected"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            SAFE
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEditLine(line)}
                        disabled={actionLoading === line.id}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Edit line"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteLine(line)}
                        disabled={actionLoading === line.id}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete line"
                      >
                        {actionLoading === line.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    
                    {showParsedData && Object.keys(line.parsedData || {}).length > 0 && (
                      <button
                        onClick={() => toggleLineExpansion(line.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Line Content */}
                <div className="font-mono text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: highlightSearchTerms(line.content) 
                    }}
                  />
                </div>

                {/* Parsed Data */}
                {showParsedData && isExpanded && formatParsedData(line.parsedData)}

                {/* Security Analysis Details */}
                {showParsedData && isExpanded && line.securityAnalyzed && line.hasSecurityIssue && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h4 className="text-xs font-semibold text-red-700 dark:text-red-300 mb-2 uppercase tracking-wide flex items-center">
                      <ShieldAlert className="h-3 w-3 mr-1" />
                      Security Issue Details
                    </h4>
                    <div className="space-y-2">
                      {line.securityIssueType && (
                        <div className="flex items-start text-xs">
                          <span className="text-red-500 dark:text-red-400 font-medium min-w-16 mr-2">Type:</span>
                          <span className="text-red-700 dark:text-red-300">{line.securityIssueType}</span>
                        </div>
                      )}
                      {line.securityIssueDescription && (
                        <div className="flex items-start text-xs">
                          <span className="text-red-500 dark:text-red-400 font-medium min-w-16 mr-2">Issue:</span>
                          <span className="text-red-700 dark:text-red-300">{line.securityIssueDescription}</span>
                        </div>
                      )}
                      {line.aiAnalysisMetadata?.aiResponse?.recommendedActions && (
                        <div className="flex items-start text-xs">
                          <span className="text-red-500 dark:text-red-400 font-medium min-w-16 mr-2">Actions:</span>
                          <div className="text-red-700 dark:text-red-300">
                            {line.aiAnalysisMetadata.aiResponse.recommendedActions.map((action: string, index: number) => (
                              <div key={index} className="flex items-start">
                                <span className="mr-1">•</span>
                                <span>{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {line.createdAlertId && (
                        <div className="flex items-start text-xs">
                          <span className="text-red-500 dark:text-red-400 font-medium min-w-16 mr-2">Alert:</span>
                          <span className="text-red-700 dark:text-red-300">
                            Security alert created (ID: {line.createdAlertId.slice(0, 8)}...)
                          </span>
                        </div>
                      )}
                      {line.aiAnalysisTimestamp && (
                        <div className="flex items-start text-xs">
                          <span className="text-red-500 dark:text-red-400 font-medium min-w-16 mr-2">Analyzed:</span>
                          <span className="text-red-700 dark:text-red-300">
                            {new Date(line.aiAnalysisTimestamp).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-soc-dark-800 border-t border-gray-200 dark:border-soc-dark-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Page {pagination.page} of {pagination.pages}
            </div>
            
            <div className="flex space-x-1">
              <button
                onClick={() => onPageChange(1)}
                disabled={pagination.page <= 1}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-soc-dark-600 rounded hover:bg-gray-100 dark:hover:bg-soc-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-soc-dark-600 rounded hover:bg-gray-100 dark:hover:bg-soc-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-1 text-sm border border-gray-300 dark:border-soc-dark-600 rounded bg-white dark:bg-soc-dark-900">
                {pagination.page}
              </span>
              
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-soc-dark-600 rounded hover:bg-gray-100 dark:hover:bg-soc-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              
              <button
                onClick={() => onPageChange(pagination.pages)}
                disabled={pagination.page >= pagination.pages}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-soc-dark-600 rounded hover:bg-gray-100 dark:hover:bg-soc-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Line Modal */}
      <AddLineModal
        isOpen={showAddModal}
        fileId={fileId}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleLineActionSuccess}
      />

      {/* Edit Line Modal */}
      <EditLineModal
        isOpen={showEditModal}
        fileId={fileId}
        line={selectedLine}
        onClose={() => {
          setShowEditModal(false);
          setSelectedLine(null);
        }}
        onSuccess={handleLineActionSuccess}
      />
    </div>
  );
};

export default LogLineViewer;