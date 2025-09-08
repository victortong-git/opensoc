import React from 'react';
import { FileText } from 'lucide-react';

const LogAnalyzerPageSimple: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <FileText className="mr-3 h-8 w-8 text-opensoc-600" />
          Log Event Analyzer
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Upload and analyze log files line by line
        </p>
      </div>

      <div className="bg-white dark:bg-soc-dark-900 rounded-lg shadow border border-gray-200 dark:border-soc-dark-700 p-8">
        <div className="text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Log Analyzer Feature
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            This feature is currently being finalized. It will allow you to:
          </p>
          <ul className="text-left text-gray-600 dark:text-gray-300 space-y-2 max-w-md mx-auto">
            <li>• Upload log files for analysis</li>
            <li>• Parse log lines with structured data extraction</li>
            <li>• Search and filter through log contents</li>
            <li>• Manage storage with cleanup options</li>
            <li>• View detailed file and line information</li>
          </ul>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              The backend API is fully implemented and ready. The frontend interface will be activated soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogAnalyzerPageSimple;