import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  fetchLogFiles, 
  fetchStorageStats,
  fetchFileDetails
} from '../store/logAnalyzerAsync';
import { setFilters, setSelectedFile } from '../store/logAnalyzerSlice';
import { FileText, Upload, Database, Search, Filter, Trash2, FileX, RefreshCw } from 'lucide-react';

// Import components
import FileUpload from '../components/logAnalyzer/FileUpload';
import FileList from '../components/logAnalyzer/FileList';
import FileDetails from '../components/logAnalyzer/FileDetails';
import CleanupControls from '../components/logAnalyzer/CleanupControls';
import SpaceUsageWidget from '../components/logAnalyzer/SpaceUsageWidget';

const LogAnalyzerPage: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    files, 
    selectedFile, 
    filesPagination,
    loading, 
    error,
    uploadError,
    storageStats,
    filters
  } = useSelector((state: RootState) => state.logAnalyzer);

  const [currentPage, setCurrentPage] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const [showCleanup, setShowCleanup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load initial data
  useEffect(() => {
    dispatch(fetchLogFiles({ page: 1 }));
    dispatch(fetchStorageStats());
  }, [dispatch]);

  // Refresh files when filters change
  useEffect(() => {
    const params = {
      page: currentPage,
      search: searchTerm || undefined,
      status: statusFilter || undefined
    };
    dispatch(fetchLogFiles(params));
  }, [dispatch, currentPage, searchTerm, statusFilter]);


  const handleFileSelect = (file: any) => {
    dispatch(setSelectedFile(file));
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    dispatch(fetchLogFiles({ page: 1 }));
    dispatch(fetchStorageStats());
  };

  const handleCleanupComplete = () => {
    setShowCleanup(false);
    dispatch(fetchStorageStats());
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh files list
      await dispatch(fetchLogFiles({ 
        page: currentPage,
        search: searchTerm || undefined,
        status: statusFilter || undefined
      }));
      
      // Refresh storage stats
      await dispatch(fetchStorageStats());
      
      // Refresh selected file details if there's one selected
      if (selectedFile) {
        await dispatch(fetchFileDetails(selectedFile.id));
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFileUpdate = () => {
    // Refresh files list and selected file details
    handleRefresh();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <FileText className="mr-3 h-8 w-8 text-opensoc-600" />
              Log Event Analyzer
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Upload and analyze log files line by line
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-secondary flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => setShowCleanup(true)}
              className="btn-secondary flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cleanup
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="btn-primary flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Log File
            </button>
          </div>
        </div>
      </div>

      {/* Storage Stats */}
      {storageStats && (
        <div className="mb-6">
          <SpaceUsageWidget stats={storageStats} />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <FileX className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - File List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-soc-dark-900 rounded-lg shadow border border-gray-200 dark:border-soc-dark-700">
            <div className="p-4 border-b border-gray-200 dark:border-soc-dark-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Log Files
              </h2>
              
              {/* Search */}
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-soc-dark-600 rounded-lg bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-opensoc-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div className="mb-3">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-soc-dark-600 rounded-lg bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-opensoc-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="uploading">Uploading</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
            
            <FileList
              files={files}
              selectedFile={selectedFile}
              loading={loading.files}
              pagination={filesPagination}
              onFileSelect={handleFileSelect}
              onPageChange={handlePageChange}
              onRefresh={handleRefresh}
            />
          </div>
        </div>

        {/* Right Panel - File Details */}
        <div className="lg:col-span-2">
          {selectedFile ? (
            <FileDetails
              file={selectedFile}
              loading={loading.fileDetails}
              onFileUpdate={handleFileUpdate}
            />
          ) : (
            <div className="bg-white dark:bg-soc-dark-900 rounded-lg shadow border border-gray-200 dark:border-soc-dark-700 p-8">
              <div className="text-center">
                <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No File Selected
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Select a log file from the list to view its details. Use "View Log Lines" to see the file contents.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <FileUpload
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
          uploadError={uploadError}
          loading={loading.upload}
        />
      )}

      {/* Cleanup Modal */}
      {showCleanup && (
        <CleanupControls
          isOpen={showCleanup}
          onClose={() => setShowCleanup(false)}
          onComplete={handleCleanupComplete}
          loading={loading.cleanup}
          storageStats={storageStats}
        />
      )}
    </div>
  );
};

export default LogAnalyzerPage;