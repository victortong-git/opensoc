import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Shield, 
  AlertTriangle, 
  Eye, 
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronFirst,
  ChevronLast
} from 'lucide-react';
import { LogFileLine } from '../../store/logAnalyzerSlice';

interface LogLinesTableProps {
  fileId: string;
  lines: LogFileLine[];
  loading: boolean;
  pagination: any;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRefresh: () => void;
}

const LogLinesTable: React.FC<LogLinesTableProps> = ({
  fileId,
  lines,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
  onRefresh
}) => {
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());

  const toggleLineExpansion = (lineId: string) => {
    const newExpanded = new Set(expandedLines);
    if (newExpanded.has(lineId)) {
      newExpanded.delete(lineId);
    } else {
      newExpanded.add(lineId);
    }
    setExpandedLines(newExpanded);
  };

  const toggleLineSelection = (lineId: string) => {
    const newSelected = new Set(selectedLines);
    if (newSelected.has(lineId)) {
      newSelected.delete(lineId);
    } else {
      newSelected.add(lineId);
    }
    setSelectedLines(newSelected);
  };

  const selectAllLines = () => {
    if (selectedLines.size === lines.length) {
      setSelectedLines(new Set());
    } else {
      setSelectedLines(new Set(lines.map(line => line.id)));
    }
  };

  const getSecurityStatusBadge = (line: LogFileLine) => {
    if (!line.securityAnalyzed) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </span>
      );
    }

    if (line.hasSecurityIssue) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Issue Found
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
        <CheckCircle className="h-3 w-3 mr-1" />
        Safe
      </span>
    );
  };

  const getSeverityBadge = (line: LogFileLine) => {
    if (!line.hasSecurityIssue || !line.securityIssueSeverity) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          -
        </span>
      );
    }

    const severity = line.securityIssueSeverity;
    const colors = {
      low: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      medium: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
      high: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
      critical: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[severity as keyof typeof colors]}`}>
        {getSeverityIcon(severity)}
        <span className="ml-1">{severity.charAt(0).toUpperCase() + severity.slice(1)}</span>
      </span>
    );
  };

  const getAnalysisStatusBadge = (line: LogFileLine) => {
    if (!line.securityAnalyzed) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
        <CheckCircle className="h-3 w-3 mr-1" />
        Completed
      </span>
    );
  };

  const getAlertStatusBadge = (line: LogFileLine) => {
    if (line.createdAlertId) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Has Alert
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        <XCircle className="h-3 w-3 mr-1" />
        No Alert
      </span>
    );
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleBulkAction = (action: string) => {
    // TODO: Implement bulk actions
    console.log(`Bulk action: ${action} for ${selectedLines.size} lines`);
  };

  if (loading && lines.length === 0) {
    return (
      <div className="bg-white dark:bg-soc-dark-900 rounded-lg shadow border border-gray-200 dark:border-soc-dark-700 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-opensoc-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading log lines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-soc-dark-900 rounded-lg shadow border border-gray-200 dark:border-soc-dark-700">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-soc-dark-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Log Lines
            {pagination && pagination.totalItems !== undefined && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                {(() => {
                  const currentPage = pagination.currentPage || 1;
                  const itemsPerPage = pagination.itemsPerPage || 0;
                  const totalItems = pagination.totalItems || 0;
                  
                  if (totalItems === 0) return "0 items";
                  
                  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
                  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
                  
                  return `${startItem}-${endItem} of ${totalItems}`;
                })()}
              </span>
            )}
          </h3>
          
          {selectedLines.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedLines.size} selected
              </span>
              <button
                onClick={() => handleBulkAction('analyze')}
                className="btn-secondary text-xs"
              >
                Analyze Selected
              </button>
              <button
                onClick={() => handleBulkAction('mark_safe')}
                className="btn-secondary text-xs"
              >
                Mark Safe
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-soc-dark-700">
          <thead className="bg-gray-50 dark:bg-soc-dark-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedLines.size === lines.length && lines.length > 0}
                  onChange={selectAllLines}
                  className="rounded border-gray-300 text-opensoc-600 focus:ring-opensoc-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Line
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Security Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Analysis Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Alert Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-soc-dark-900 divide-y divide-gray-200 dark:divide-soc-dark-700">
            {lines.map((line) => (
              <React.Fragment key={line.id}>
                <tr className={`hover:bg-gray-50 dark:hover:bg-soc-dark-800 ${selectedLines.has(line.id) ? 'bg-opensoc-50 dark:bg-opensoc-900/20' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedLines.has(line.id)}
                      onChange={() => toggleLineSelection(line.id)}
                      className="rounded border-gray-300 text-opensoc-600 focus:ring-opensoc-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                    {line.lineNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-2">
                      <button
                        onClick={() => toggleLineExpansion(line.id)}
                        className="mt-1 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {expandedLines.has(line.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                          {expandedLines.has(line.id) ? (
                            <pre className="whitespace-pre-wrap break-words">{line.content}</pre>
                          ) : (
                            <div className="truncate max-w-2xl">{line.content}</div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(line.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSecurityStatusBadge(line)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSeverityBadge(line)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getAnalysisStatusBadge(line)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getAlertStatusBadge(line)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleLineExpansion(line.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {line.createdAlertId && (
                        <button
                          onClick={() => window.open(`/alerts/${line.createdAlertId}`, '_blank')}
                          className="text-orange-500 hover:text-orange-600"
                          title="View Alert"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                
                {/* Expanded Content */}
                {expandedLines.has(line.id) && (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 bg-gray-50 dark:bg-soc-dark-800">
                      <div className="space-y-4">
                        {/* Parsed Data */}
                        {line.parsedData && Object.keys(line.parsedData).length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Parsed Data
                            </h4>
                            <pre className="text-xs bg-white dark:bg-soc-dark-900 p-3 rounded border text-gray-900 dark:text-gray-100 overflow-x-auto">
                              {JSON.stringify(line.parsedData, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {/* Security Analysis */}
                        {line.securityAnalyzed && line.hasSecurityIssue && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Security Analysis
                            </h4>
                            <div className="bg-white dark:bg-soc-dark-900 p-3 rounded border space-y-2">
                              {line.securityIssueType && (
                                <div>
                                  <span className="font-medium">Type:</span> {line.securityIssueType}
                                </div>
                              )}
                              {line.securityIssueDescription && (
                                <div>
                                  <span className="font-medium">Description:</span> {line.securityIssueDescription}
                                </div>
                              )}
                              {line.aiAnalysisTimestamp && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Analyzed: {new Date(line.aiAnalysisTimestamp).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enhanced Pagination */}
      {pagination && pagination.totalItems !== undefined && pagination.currentPage !== undefined && pagination.itemsPerPage !== undefined && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-soc-dark-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            {/* Results Info and Page Size Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {Math.max(1, ((pagination.currentPage - 1) * pagination.itemsPerPage) + 1)} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems?.toLocaleString() || 0} lines
              </div>
              
              {/* Page Size Selector */}
              {onPageSizeChange && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Show:</span>
                  <select
                    value={pagination.itemsPerPage}
                    onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                    className="text-sm border border-gray-300 dark:border-soc-dark-600 rounded px-2 py-1 bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-white"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                  </select>
                  <span className="text-sm text-gray-500 dark:text-gray-400">per page</span>
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            {pagination.totalPages && pagination.totalPages > 1 && (
              <div className="flex items-center space-x-1">
                {/* First Page */}
                <button
                  onClick={() => onPageChange(1)}
                  disabled={pagination.currentPage <= 1}
                  className="p-2 text-sm border border-gray-300 dark:border-soc-dark-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-soc-dark-800"
                  title="First page"
                >
                  <ChevronFirst className="h-4 w-4" />
                </button>
                
                {/* Previous Page */}
                <button
                  onClick={() => onPageChange(Math.max(1, pagination.currentPage - 1))}
                  disabled={pagination.currentPage <= 1}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-soc-dark-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-soc-dark-800"
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {(() => {
                    const currentPage = pagination.currentPage;
                    const totalPages = pagination.totalPages;
                    const pages = [];
                    
                    // Always show first page
                    if (currentPage > 3) {
                      pages.push(1);
                      if (currentPage > 4) {
                        pages.push('...');
                      }
                    }
                    
                    // Show pages around current page
                    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
                      pages.push(i);
                    }
                    
                    // Always show last page
                    if (currentPage < totalPages - 2) {
                      if (currentPage < totalPages - 3) {
                        pages.push('...');
                      }
                      pages.push(totalPages);
                    }
                    
                    return pages.map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-500">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => onPageChange(page as number)}
                          className={`px-3 py-2 text-sm border rounded ${
                            pagination.currentPage === page
                              ? 'bg-opensoc-600 text-white border-opensoc-600'
                              : 'border-gray-300 dark:border-soc-dark-600 hover:bg-gray-50 dark:hover:bg-soc-dark-800'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    ));
                  })()}
                </div>

                {/* Next Page */}
                <button
                  onClick={() => onPageChange(Math.min(pagination.totalPages || 1, pagination.currentPage + 1))}
                  disabled={pagination.currentPage >= (pagination.totalPages || 1)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-soc-dark-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-soc-dark-800"
                >
                  Next
                </button>
                
                {/* Last Page */}
                <button
                  onClick={() => onPageChange(pagination.totalPages || 1)}
                  disabled={pagination.currentPage >= (pagination.totalPages || 1)}
                  className="p-2 text-sm border border-gray-300 dark:border-soc-dark-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-soc-dark-800"
                  title="Last page"
                >
                  <ChevronLast className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Fallback pagination info when data is loading/missing */}
      {!pagination && lines.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-soc-dark-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {lines.length} lines (pagination loading...)
          </div>
        </div>
      )}
      
    </div>
  );
};

export default LogLinesTable;