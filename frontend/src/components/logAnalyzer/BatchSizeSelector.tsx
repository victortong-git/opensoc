import React from 'react';
import { Zap } from 'lucide-react';

interface BatchSizeSelectorProps {
  selectedBatchSize: number;
  onBatchSizeChange: (size: number) => void;
  selectedBatchCount: number | null;
  onBatchCountChange: (count: number | null) => void;
  maxBatches: number;
  totalLines?: number;
  isLoading: boolean;
  onStartAnalysis: () => void;
  onCancel: () => void;
  showBatchSizeSelector: boolean;
  isForNewAnalysis?: boolean;
  title?: string;
  description?: string;
}

const BatchSizeSelector: React.FC<BatchSizeSelectorProps> = ({
  selectedBatchSize,
  onBatchSizeChange,
  selectedBatchCount,
  onBatchCountChange,
  maxBatches,
  totalLines,
  isLoading,
  onStartAnalysis,
  onCancel,
  showBatchSizeSelector,
  isForNewAnalysis = false,
  title = "AI Security Analysis",
  description = "Analyze log lines for security threats and anomalies"
}) => {
  if (!showBatchSizeSelector) return null;

  const renderBatchSizeOptions = () => (
    <div className="mb-4 p-4 bg-gray-50 dark:bg-soc-dark-800 rounded-lg">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Batch Size
      </label>
      <div className="grid grid-cols-6 gap-2">
        {[1, 5, 10, 25, 50, 100].map((size) => (
          <button
            key={size}
            onClick={() => onBatchSizeChange(size)}
            className={`px-3 py-2 text-sm rounded border ${
              selectedBatchSize === size
                ? 'bg-opensoc-600 text-white border-opensoc-600'
                : 'bg-white dark:bg-soc-dark-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-soc-dark-600 hover:bg-gray-50 dark:hover:bg-soc-dark-800'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
      <div className="mt-2 space-y-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {selectedBatchSize <= 10 ? 'Slower processing, minimal resource usage' :
           selectedBatchSize <= 50 ? 'Balanced performance and resource usage' :
           'Faster processing, higher resource usage'}
        </p>
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
          <strong>GPU VRAM Guidelines:</strong><br/>
          • <strong>16GB VRAM</strong>: Max batch size 10 (recommended)<br/>
          • <strong>24GB+ VRAM</strong>: Can use larger batch sizes<br/>
          • Large batches may exceed token context window causing errors
        </div>
      </div>

      {/* Batch Count Slider */}
      {maxBatches > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-soc-dark-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Number of Batches to Process
          </label>
          <div className="space-y-3">
            <div className="relative">
              <input
                type="range"
                min="1"
                max={maxBatches}
                value={selectedBatchCount || maxBatches}
                onChange={(e) => onBatchCountChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-soc-dark-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${((selectedBatchCount || maxBatches) / maxBatches) * 100}%, #E5E7EB ${((selectedBatchCount || maxBatches) / maxBatches) * 100}%, #E5E7EB 100%)`
                }}
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">1 batch</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-opensoc-600 dark:text-opensoc-400">
                  {selectedBatchCount || maxBatches} / {maxBatches} batches
                </span>
                {selectedBatchCount && selectedBatchCount < maxBatches && (
                  <button
                    onClick={() => onBatchCountChange(null)}
                    className="text-xs text-opensoc-500 hover:text-opensoc-700 dark:text-opensoc-400 dark:hover:text-opensoc-300"
                  >
                    (Set All)
                  </button>
                )}
              </div>
              <span className="text-gray-500 dark:text-gray-400">{maxBatches} batches</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {selectedBatchCount && selectedBatchCount < maxBatches ? (
              <span>
                Process {selectedBatchCount} batch{selectedBatchCount > 1 ? 'es' : ''} 
                <span className="font-medium text-opensoc-600 dark:text-opensoc-400 ml-1">
                  ({(selectedBatchCount * selectedBatchSize).toLocaleString()} lines)
                </span>
                <span className="text-gray-400 ml-1">
                  of {totalLines?.toLocaleString()} total lines
                </span>
              </span>
            ) : (
              <span>
                Process all batches 
                <span className="font-medium text-opensoc-600 dark:text-opensoc-400 ml-1">
                  ({totalLines?.toLocaleString()} lines)
                </span>
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );

  const renderPausedJobBatchSelector = () => (
    <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-yellow-700 dark:text-yellow-300">
          Change Batch Size
        </label>
        <span className="text-xs text-yellow-600 dark:text-yellow-400">
          Current: {selectedBatchSize}
        </span>
      </div>
      <div className="grid grid-cols-6 gap-2 mb-3">
        {[1, 5, 10, 25, 50, 100].map((size) => (
          <button
            key={size}
            onClick={() => onBatchSizeChange(size)}
            className={`px-3 py-2 text-sm rounded border ${
              selectedBatchSize === size
                ? 'bg-yellow-600 text-white border-yellow-600'
                : 'bg-white dark:bg-soc-dark-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-soc-dark-600 hover:bg-gray-50 dark:hover:bg-soc-dark-800'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onStartAnalysis}
          disabled={isLoading}
          className="px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Updating...' : 'Apply Changes'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-400 dark:hover:bg-gray-500"
        >
          Cancel
        </button>
      </div>
      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
        {selectedBatchSize <= 10 ? 'Slower processing, minimal resource usage' :
         selectedBatchSize <= 50 ? 'Balanced performance and resource usage' :
         'Faster processing, higher resource usage'}
      </p>
    </div>
  );

  if (isForNewAnalysis) {
    return (
      <div className="bg-white dark:bg-soc-dark-900 rounded-lg border border-gray-200 dark:border-soc-dark-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-opensoc-100 dark:bg-opensoc-900/20 rounded-lg">
              <Zap className="h-5 w-5 text-opensoc-600 dark:text-opensoc-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            </div>
          </div>
        </div>

        {renderBatchSizeOptions()}

        <button
          onClick={onStartAnalysis}
          disabled={isLoading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Starting Analysis...</span>
            </div>
          ) : (
            selectedBatchCount && selectedBatchCount < maxBatches
              ? `Start Analysis (${selectedBatchCount}/${maxBatches} batches, ${selectedBatchSize} lines each)`
              : `Start Analysis (All ${maxBatches} batches, ${selectedBatchSize} lines each)`
          )}
        </button>

        <button
          onClick={onCancel}
          className="w-full mt-2 btn-secondary"
        >
          Cancel
        </button>
      </div>
    );
  }

  return renderPausedJobBatchSelector();
};

export default BatchSizeSelector;