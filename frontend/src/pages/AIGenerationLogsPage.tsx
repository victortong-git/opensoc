import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  RefreshCw,
  Calendar,
  Settings,
} from 'lucide-react';
import aiGenerationLogsService, {
  AIGenerationLog,
  AIGenerationLogsFilters,
  AIGenerationLogsStats,
} from '../services/aiGenerationLogsService';
import ToastService from '../services/toastService';

const AIGenerationLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AIGenerationLog[]>([]);
  const [stats, setStats] = useState<AIGenerationLogsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AIGenerationLog | null>(null);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter state
  const [filters, setFilters] = useState<AIGenerationLogsFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Search and filter UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDataType, setSelectedDataType] = useState('');
  const [selectedSuccess, setSelectedSuccess] = useState('');
  const [selectedValidation, setSelectedValidation] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Load logs
  const loadLogs = async (newFilters: AIGenerationLogsFilters = filters) => {
    try {
      setLoading(true);
      const response = await aiGenerationLogsService.getAIGenerationLogs(newFilters);
      setLogs(response.logs);
      setCurrentPage(response.pagination.currentPage);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (error) {
      console.error('Failed to load AI generation logs:', error);
      ToastService.error('Failed to load AI generation logs');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStats = async (days: number = 30) => {
    try {
      setStatsLoading(true);
      const statsData = await aiGenerationLogsService.getAIGenerationLogsStats(days);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load AI generation logs stats:', error);
      ToastService.error('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    const newFilters: AIGenerationLogsFilters = {
      ...filters,
      page: 1,
      scenario: searchTerm || undefined,
      dataType: selectedDataType || undefined,
      success: selectedSuccess !== '' ? selectedSuccess === 'true' : undefined,
      validation: selectedValidation || undefined,
      fromDate: dateFrom || undefined,
      toDate: dateTo || undefined,
    };
    
    setFilters(newFilters);
    loadLogs(newFilters);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDataType('');
    setSelectedSuccess('');
    setSelectedValidation('');
    setDateFrom('');
    setDateTo('');
    
    const newFilters: AIGenerationLogsFilters = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    
    setFilters(newFilters);
    loadLogs(newFilters);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadLogs(newFilters);
  };

  // View log details
  const viewLogDetails = async (logId: number) => {
    try {
      const log = await aiGenerationLogsService.getAIGenerationLogById(logId);
      setSelectedLog(log);
      setShowLogDetail(true);
    } catch (error) {
      ToastService.error('Failed to load log details');
    }
  };

  // Delete log
  const deleteLog = async (logId: number) => {
    if (!window.confirm('Are you sure you want to delete this log entry?')) return;
    
    try {
      await aiGenerationLogsService.deleteAIGenerationLog(logId);
      ToastService.success('Log entry deleted successfully');
      loadLogs();
    } catch (error) {
      ToastService.error('Failed to delete log entry');
    }
  };

  // Export logs
  const exportLogs = () => {
    try {
      aiGenerationLogsService.exportToCSV(logs);
      ToastService.success('Logs exported successfully');
    } catch (error) {
      ToastService.error('Failed to export logs');
    }
  };

  // Cleanup logs
  const cleanupLogs = async () => {
    if (!window.confirm('This will delete ALL AI generation logs. Continue?')) return;
    
    try {
      const result = await aiGenerationLogsService.cleanupAIGenerationLogs({});
      
      if (result.success) {
        if (result.deletedCount > 0) {
          ToastService.success(result.message);
          loadLogs(); // Reload logs to reflect the changes
        } else {
          ToastService.info(`No logs were deleted. ${result.message}`);
        }
      } else {
        // Handle different failure reasons
        switch (result.reason) {
          case 'no_logs_found':
            ToastService.info(result.message);
            break;
          case 'deletion_failed':
            ToastService.error(result.message);
            break;
          default:
            ToastService.warning(result.message);
        }
      }
    } catch (error: any) {
      console.error('Cleanup logs error:', error);
      ToastService.error(`Failed to cleanup logs: ${error.message || 'Unknown error'}`);
    }
  };

  // Initial load
  useEffect(() => {
    loadLogs();
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Database className="w-8 h-8 text-opensoc-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Test Data Generation Log</h1>
            <p className="text-gray-600 dark:text-slate-400">Monitor and manage AI test data generation history</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className="btn-primary flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>{showStats ? 'Hide Stats' : 'Show Stats'}</span>
          </button>
          
          <button
            onClick={exportLogs}
            disabled={logs.length === 0}
            className="btn-success flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={() => loadLogs()}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && stats && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.summary.totalLogs}</p>
                <p className="text-xs text-gray-500 dark:text-slate-500">{stats.period}</p>
              </div>
              <Database className="w-8 h-8 text-opensoc-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats.summary.successRate}%</p>
                <p className="text-xs text-gray-500 dark:text-slate-500">{stats.summary.successfulLogs} successful</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Avg Execution Time</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.performance.avgExecutionTime 
                    ? aiGenerationLogsService.formatExecutionTime(stats.performance.avgExecutionTime)
                    : 'N/A'
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-500">per generation</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Failed Logs</p>
                <p className="text-2xl font-bold text-red-600">{stats.summary.failedLogs}</p>
                <p className="text-xs text-gray-500 dark:text-slate-500">need attention</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Search Scenario</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by scenario..."
                className="input-field w-full pl-10 pr-3 py-2"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Data Type</label>
            <select
              value={selectedDataType}
              onChange={(e) => setSelectedDataType(e.target.value)}
              className="input-field w-full px-3 py-2"
            >
              <option value="">All Types</option>
              <option value="alert">Alert</option>
              <option value="incident">Incident</option>
              <option value="asset">Asset</option>
              <option value="ioc">IOC</option>
              <option value="playbook">Playbook</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Status</label>
            <select
              value={selectedSuccess}
              onChange={(e) => setSelectedSuccess(e.target.value)}
              className="input-field w-full px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Validation</label>
            <select
              value={selectedValidation}
              onChange={(e) => setSelectedValidation(e.target.value)}
              className="input-field w-full px-3 py-2"
            >
              <option value="">All Validation</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
              <option value="Pending">Pending</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date Range</label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-field flex-1 px-2 py-2"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-field flex-1 px-2 py-2"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={applyFilters}
            className="btn-primary flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Apply Filters</span>
          </button>
          
          <button
            onClick={clearFilters}
            className="btn-secondary"
          >
            Clear
          </button>
          
          <div className="flex-1 text-right text-sm text-gray-500 dark:text-slate-400">
            Showing {logs.length} of {totalItems} entries
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-opensoc-500" />
            <span className="ml-2 text-gray-600 dark:text-slate-400">Loading logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <Database className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Logs Found</h3>
            <p className="text-gray-600 dark:text-slate-400">No AI generation logs match your current filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-soc-dark-700">
                <thead className="table-header">
                  <tr>
                    <th className="table-header">ID</th>
                    <th className="table-header">Date/Time</th>
                    <th className="table-header">User</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Scenario</th>
                    <th className="table-header">Quantity</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Validation</th>
                    <th className="table-header">Duration</th>
                    <th className="table-header">AI Provider</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-soc-dark-800 divide-y divide-gray-200 dark:divide-soc-dark-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="table-row">
                      <td className="table-cell font-medium">
                        #{log.id}
                      </td>
                      <td className="table-cell">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.user.firstName} {log.user.lastName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400">{log.user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {aiGenerationLogsService.getDataTypeIcon(log.dataType)}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {log.dataType}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        {log.scenario || 'N/A'}
                      </td>
                      <td className="table-cell">
                        {log.quantity}
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          aiGenerationLogsService.getStatusBadgeColor(log.success)
                        }`}>
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">{aiGenerationLogsService.getValidationIcon(log.validation)}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            aiGenerationLogsService.getValidationBadgeColor(log.validation)
                          }`}>
                            {log.validation}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        {aiGenerationLogsService.formatExecutionTime(log.executionTime)}
                      </td>
                      <td className="table-cell">
                        <div className="text-xs">
                          <div className="font-medium">{log.aiProvider || 'N/A'}</div>
                          {log.aiModel && (
                            <div className="text-gray-400 dark:text-slate-500 truncate max-w-20" title={log.aiModel}>
                              {log.aiModel}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell space-x-2">
                        <button
                          onClick={() => viewLogDetails(log.id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteLog(log.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                          title="Delete Log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 dark:bg-soc-dark-800 px-6 py-3 border-t border-gray-200 dark:border-soc-dark-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-slate-300">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="btn-secondary px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="btn-secondary px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Log Detail Modal */}
      {showLogDetail && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-soc-dark-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-soc-dark-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Generation Log #{selectedLog.id}
              </h2>
              <button
                onClick={() => setShowLogDetail(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-400"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Request Details</h3>
                  <div className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
                    <div><strong className="text-gray-900 dark:text-white">Data Type:</strong> {selectedLog.dataType}</div>
                    <div><strong className="text-gray-900 dark:text-white">Quantity:</strong> {selectedLog.quantity}</div>
                    <div><strong className="text-gray-900 dark:text-white">Scenario:</strong> {selectedLog.scenario || 'N/A'}</div>
                    <div><strong className="text-gray-900 dark:text-white">Created:</strong> {new Date(selectedLog.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Execution Details</h3>
                  <div className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
                    <div>
                      <strong className="text-gray-900 dark:text-white">Status:</strong>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        aiGenerationLogsService.getStatusBadgeColor(selectedLog.success)
                      }`}>
                        {selectedLog.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    <div>
                      <strong className="text-gray-900 dark:text-white">Validation:</strong>
                      <span className="ml-2">{aiGenerationLogsService.getValidationIcon(selectedLog.validation)}</span>
                      <span className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        aiGenerationLogsService.getValidationBadgeColor(selectedLog.validation)
                      }`}>
                        {selectedLog.validation}
                      </span>
                    </div>
                    <div><strong className="text-gray-900 dark:text-white">Execution Time:</strong> {aiGenerationLogsService.formatExecutionTime(selectedLog.executionTime)}</div>
                    <div><strong className="text-gray-900 dark:text-white">User:</strong> {selectedLog.user.firstName} {selectedLog.user.lastName} ({selectedLog.user.username})</div>
                    <div><strong className="text-gray-900 dark:text-white">AI Provider:</strong> {selectedLog.aiProvider || 'N/A'}</div>
                    <div><strong className="text-gray-900 dark:text-white">AI Model:</strong> {selectedLog.aiModel || 'N/A'}</div>
                    {selectedLog.modelVersion && (
                      <div><strong className="text-gray-900 dark:text-white">Model Version:</strong> {selectedLog.modelVersion}</div>
                    )}
                    {selectedLog.aiEndpoint && (
                      <div><strong className="text-gray-900 dark:text-white">AI Endpoint:</strong> <span className="font-mono text-xs break-all">{selectedLog.aiEndpoint}</span></div>
                    )}
                    {selectedLog.errorMessage && (
                      <div><strong className="text-gray-900 dark:text-white">Error:</strong> <span className="text-red-600 dark:text-red-400">{selectedLog.errorMessage}</span></div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI Prompt</h3>
                <div className="bg-gray-50 dark:bg-soc-dark-700 p-4 rounded-md">
                  <pre className="text-sm text-gray-800 dark:text-slate-200 whitespace-pre-wrap">{selectedLog.prompt}</pre>
                </div>
              </div>
              
              {selectedLog.aiResponse && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI Response</h3>
                  <div className="bg-gray-50 dark:bg-soc-dark-700 p-4 rounded-md max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-800 dark:text-slate-200 whitespace-pre-wrap">{selectedLog.aiResponse}</pre>
                  </div>
                </div>
              )}
              
              {selectedLog.providerMetadata && Object.keys(selectedLog.providerMetadata).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Provider Configuration</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                    <pre className="text-sm text-gray-800 dark:text-slate-200">{JSON.stringify(selectedLog.providerMetadata, null, 2)}</pre>
                  </div>
                </div>
              )}
              
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Generation Metadata</h3>
                  <div className="bg-gray-50 dark:bg-soc-dark-700 p-4 rounded-md">
                    <pre className="text-sm text-gray-800 dark:text-slate-200">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-soc-dark-700 space-x-3">
              <button
                onClick={() => deleteLog(selectedLog.id)}
                className="btn-danger"
              >
                Delete Log
              </button>
              <button
                onClick={() => setShowLogDetail(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Section */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Log Maintenance</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Clean up all AI generation logs to maintain database performance and free up storage space.
                {totalItems > 0 && (
                  <span className="block mt-1">
                    Currently showing {totalItems} log{totalItems !== 1 ? 's' : ''} that will be deleted.
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={cleanupLogs}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-md transition-colors duration-200 flex items-center space-x-2"
            title="Delete all AI generation logs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIGenerationLogsPage;