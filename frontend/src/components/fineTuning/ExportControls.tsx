import React from 'react';
import { Download, AlertTriangle } from 'lucide-react';
import { DatasetStats, ExportOptions } from '../../services/fineTuningService';

interface ExportControlsProps {
  stats: DatasetStats | null;
  exportOptions: ExportOptions;
  setExportOptions: (options: ExportOptions) => void;
  onExport: () => void;
  exporting: boolean;
}

const ExportControls: React.FC<ExportControlsProps> = ({
  stats,
  exportOptions,
  setExportOptions,
  onExport,
  exporting
}) => {
  return (
    <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-opensoc-300 mb-4 flex items-center space-x-2">
        <Download className="w-5 h-5" />
        <span>Export Configuration</span>
      </h3>

      <div className="space-y-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={exportOptions.startDate}
              onChange={(e) => setExportOptions({ ...exportOptions, startDate: e.target.value })}
              className="px-3 py-2 bg-soc-dark-700 border border-gray-600 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-opensoc-500"
            />
            <input
              type="date"
              value={exportOptions.endDate}
              onChange={(e) => setExportOptions({ ...exportOptions, endDate: e.target.value })}
              className="px-3 py-2 bg-soc-dark-700 border border-gray-600 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-opensoc-500"
            />
          </div>
        </div>

        {/* Minimum Confidence */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Minimum Human Confidence (1-10): {exportOptions.minConfidence}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={exportOptions.minConfidence}
            onChange={(e) => setExportOptions({ ...exportOptions, minConfidence: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Include Unverified */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="includeUnverified"
            checked={exportOptions.includeUnverified}
            onChange={(e) => setExportOptions({ ...exportOptions, includeUnverified: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="includeUnverified" className="text-sm text-gray-300">
            Include unverified human feedback
          </label>
        </div>

        {/* Export Format */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Export Format</label>
          <select
            value={exportOptions.format}
            onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value as any })}
            className="w-full px-3 py-2 bg-soc-dark-700 border border-gray-600 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-opensoc-500"
          >
            <option value="jsonl">JSONL (Recommended for Training)</option>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>
      </div>

      {/* Export Actions */}
      <div className="mt-4 space-y-3">
        <button
          onClick={onExport}
          disabled={exporting || !stats || (stats.qualityDistribution?.high || 0) < 50}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-opensoc-600 hover:bg-opensoc-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{exporting ? 'Exporting...' : 'Export Training Dataset'}</span>
        </button>

        {stats && (stats.qualityDistribution?.high || 0) < 50 && (
          <div className="flex items-center space-x-2 text-sm text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4" />
            <span>Minimum 50 high-quality alerts required for training data</span>
          </div>
        )}

        <div className="text-xs text-gray-400 space-y-1">
          <div>• Estimated training samples: ~{Math.round((stats?.qualityDistribution?.high || 0) * exportOptions.datasetSplit.training / 100)}</div>
          <div>• Estimated validation samples: ~{Math.round((stats?.qualityDistribution?.high || 0) * exportOptions.datasetSplit.validation / 100)}</div>
          <div>• Estimated test samples: ~{Math.round((stats?.qualityDistribution?.high || 0) * exportOptions.datasetSplit.test / 100)}</div>
        </div>
      </div>
    </div>
  );
};

export default ExportControls;