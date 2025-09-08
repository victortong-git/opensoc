import React from 'react';
import { FileText, Upload } from 'lucide-react';

const LogAnalyzerPageTest: React.FC = () => {
  console.log('🔍 LogAnalyzerPageTest component rendered!');
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <FileText className="mr-3 h-8 w-8 text-opensoc-600" />
              Log Event Analyzer (TEST MODE)
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Upload and analyze log files line by line
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button className="btn-primary flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Upload Log File (TEST)
            </button>
          </div>
        </div>
      </div>

      {/* Simple Upload Area */}
      <div className="bg-white dark:bg-soc-dark-900 rounded-lg shadow border border-gray-200 dark:border-soc-dark-700 p-8">
        <div className="border-2 border-dashed border-gray-300 dark:border-soc-dark-600 rounded-lg p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Drag & Drop Log Files Here
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Or click to browse and select files
          </p>
          <button className="btn-primary">
            Browse Files
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <p className="text-green-700 dark:text-green-300 text-center">
          ✅ Log Analyzer Test Page is Loading Successfully!
          <br />
          This confirms React components are rendering correctly.
        </p>
      </div>
    </div>
  );
};

export default LogAnalyzerPageTest;