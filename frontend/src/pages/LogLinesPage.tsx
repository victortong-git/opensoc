import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  fetchFileDetails, 
  fetchFileLines, 
  fetchSecurityAnalysisStats 
} from '../store/logAnalyzerAsync';
import { setLinesSearch, setSelectedFile, updateFileProcessingStats } from '../store/logAnalyzerSlice';
import { 
  ArrowLeft, 
  FileText, 
  Shield, 
  Activity, 
  AlertTriangle,
  Clock,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import websocketService from '../services/websocketService';
import toastNotificationService from '../services/toastNotificationService';

// Import components
import LogLinesFilters from '../components/logAnalyzer/LogLinesFilters';
import LogLinesStatusDashboard from '../components/logAnalyzer/LogLinesStatusDashboard';
import LogLinesTable from '../components/logAnalyzer/LogLinesTable';
import AIJobProgressPanel from '../components/logAnalyzer/AIJobProgressPanel';

const LogLinesPage: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { 
    selectedFile, 
    fileLines, 
    linesPagination, 
    loading, 
    error, 
    linesSearch,
    linesFilters 
  } = useSelector((state: RootState) => state.logAnalyzer);

  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [securityStats, setSecurityStats] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Load file details and lines when fileId changes
  useEffect(() => {
    if (fileId) {
      dispatch(setSelectedFile(fileId));
      dispatch(fetchFileDetails(fileId));
      dispatch(fetchFileLines({ fileId, page: 1, limit: pageSize }));
      loadSecurityStats();
    }
  }, [fileId, dispatch, pageSize]);

  // Setup WebSocket connection and notifications
  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const initializeServices = async () => {
      try {
        // Request notification permission (this always works)
        await toastNotificationService.requestPermission();

        // Try to connect to WebSocket, but don't fail if it can't connect
        try {
          await websocketService.connect();
          setWsConnected(true);

          // Subscribe to batch processing updates for real-time file statistics sync
          if (fileId) {
            const batchProgressSubscription = websocketService.subscribe('ai_batch_completed', (data) => {
              if (data.fileId === fileId && data.linesProcessed) {
                dispatch(updateFileProcessingStats({
                  fileId: fileId,
                  linesProcessed: data.linesProcessed
                }));
              }
            }, fileId);

            const analysisProgressSubscription = websocketService.subscribe('ai_analysis_progress', (data) => {
              if (data.fileId === fileId && data.linesProcessed) {
                dispatch(updateFileProcessingStats({
                  fileId: fileId,
                  linesProcessed: data.linesProcessed
                }));
              }
            }, fileId);

            const analysisCompletedSubscription = websocketService.subscribe('ai_analysis_completed', (data) => {
              if (data.fileId === fileId) {
                // Refresh security stats when analysis completes
                loadSecurityStats();
                // Update file processing stats with final counts
                if (data.linesProcessed) {
                  dispatch(updateFileProcessingStats({
                    fileId: fileId,
                    linesProcessed: data.linesProcessed
                  }));
                }
              }
            }, fileId);

            // Store subscriptions for cleanup
            const originalCleanup = cleanup;
            cleanup = () => {
              websocketService.unsubscribe(batchProgressSubscription);
              websocketService.unsubscribe(analysisProgressSubscription);
              websocketService.unsubscribe(analysisCompletedSubscription);
              if (originalCleanup) originalCleanup();
            };
          }

          // Subscribe to file analysis notifications if we have a file
          if (fileId && selectedFile) {
            const toastCleanup = toastNotificationService.subscribeToFileAnalysis(
              fileId, 
              selectedFile.originalName
            );
            
            // Combine with WebSocket cleanup
            const originalCleanup = cleanup;
            cleanup = () => {
              if (toastCleanup) toastCleanup();
              if (originalCleanup) originalCleanup();
            };
          }
        } catch (wsError) {
          console.warn('WebSocket connection failed, continuing without real-time updates:', wsError.message);
          setWsConnected(false);
        }
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      if (cleanup) {
        cleanup();
      }
      websocketService.disconnect();
    };
  }, [fileId, selectedFile]);

  const loadSecurityStats = async () => {
    if (fileId) {
      try {
        const stats = await dispatch(fetchSecurityAnalysisStats(fileId)).unwrap();
        setSecurityStats(stats);
      } catch (error) {
        console.error('Failed to load security stats:', error);
      }
    }
  };

  const handleBack = () => {
    navigate('/log-analyzer');
  };

  // Helper function to build complete filter parameters
  const buildFilterParams = (page: number, limit: number) => {
    const params: any = {
      fileId: fileId!,
      page,
      limit
    };

    // Only include non-empty filter parameters
    const search = linesFilters.search || linesSearch;
    if (search && search.trim()) params.search = search;
    if (linesFilters.securityStatus && linesFilters.securityStatus.trim()) params.securityStatus = linesFilters.securityStatus;
    if (linesFilters.severity && linesFilters.severity.trim()) params.severity = linesFilters.severity;
    if (linesFilters.analysisStatus && linesFilters.analysisStatus.trim()) params.analysisStatus = linesFilters.analysisStatus;
    if (linesFilters.hasAlerts && linesFilters.hasAlerts.trim()) {
      params.hasAlerts = linesFilters.hasAlerts === 'true';
    }
    if (linesFilters.logLevel && linesFilters.logLevel.trim()) params.logLevel = linesFilters.logLevel;
    if (linesFilters.dateFrom && linesFilters.dateFrom.trim()) params.dateFrom = linesFilters.dateFrom;
    if (linesFilters.dateTo && linesFilters.dateTo.trim()) params.dateTo = linesFilters.dateTo;
    if (linesFilters.ipAddress && linesFilters.ipAddress.trim()) params.ipAddress = linesFilters.ipAddress;

    return params;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (fileId) {
      dispatch(fetchFileLines(buildFilterParams(page, pageSize)));
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
    if (fileId) {
      dispatch(fetchFileLines(buildFilterParams(1, newPageSize)));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (fileId) {
        await dispatch(fetchFileDetails(fileId));
        await dispatch(fetchFileLines(buildFilterParams(currentPage, pageSize)));
        await loadSecurityStats();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export functionality to be implemented');
  };

  if (!fileId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-soc-dark-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            File ID Missing
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No file ID provided in the URL.
          </p>
          <button
            onClick={handleBack}
            className="btn-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Log Analyzer
          </button>
        </div>
      </div>
    );
  }

  if (loading.fileDetails && !selectedFile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-soc-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-opensoc-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading file details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-soc-dark-950">
      {/* Header */}
      <div className="bg-white dark:bg-soc-dark-900 border-b border-gray-200 dark:border-soc-dark-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-soc-dark-800"
                title="Back to Log Analyzer"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-opensoc-500" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedFile?.originalName || 'Log File'}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedFile?.totalLines?.toLocaleString()} lines • {selectedFile ? (selectedFile.fileSize / 1024 / 1024).toFixed(2) : '0'} MB
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  console.log('Filter toggle clicked, current showFilters:', showFilters);
                  setShowFilters(!showFilters);
                  console.log('Filter toggle set to:', !showFilters);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-opensoc-100 text-opensoc-600 dark:bg-opensoc-900 dark:text-opensoc-300' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-soc-dark-800'
                }`}
                title="Toggle Filters"
              >
                <Filter className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleExport}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-soc-dark-800"
                title="Export Lines"
              >
                <Download className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-soc-dark-800 disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0">
        {/* Filters Panel */}
        {showFilters && (
          <div className="w-80 flex-shrink-0 bg-white dark:bg-soc-dark-900 border-r border-gray-200 dark:border-soc-dark-700 h-[calc(100vh-theme(spacing.16))] overflow-y-auto">
            <LogLinesFilters fileId={fileId} />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Status Dashboard */}
            <LogLinesStatusDashboard 
              fileId={fileId}
              securityStats={securityStats}
              onStatsUpdate={setSecurityStats}
            />

            {/* AI Job Progress Panel */}
            <AIJobProgressPanel fileId={fileId} />

            {/* Log Lines Table */}
            <LogLinesTable
              fileId={fileId}
              lines={fileLines}
              loading={loading.fileLines}
              pagination={linesPagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogLinesPage;