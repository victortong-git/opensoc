import React, { useState, useEffect } from 'react';
import { Brain, RefreshCw, Calendar, FileText, Zap } from 'lucide-react';
import fineTuningService, { DatasetStats, ExportOptions } from '../services/fineTuningService';
import DatasetStatsCards from '../components/fineTuning/DatasetStatsCards';
import DataQualityCharts from '../components/fineTuning/DataQualityCharts';
import ExportControls from '../components/fineTuning/ExportControls';
import FineTuningNavigation from '../components/fineTuning/FineTuningNavigation';
import FineTuningGuide from '../components/fineTuning/FineTuningGuide';
import CodeExamples from '../components/fineTuning/CodeExamples';

const FineTuningDataExportPage: React.FC = () => {
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('statistics');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    minConfidence: 7,
    includeUnverified: false,
    format: 'jsonl',
    datasetSplit: {
      training: 70,
      validation: 20,
      test: 10
    }
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await fineTuningService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load fine-tuning stats:', error);
      // Set null to show error state instead of mock data
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await fineTuningService.exportDataset(exportOptions);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fine-tuning-dataset-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please ensure you have sufficient data and try again.');
    } finally {
      setExporting(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-soc-dark-900 flex items-center justify-center">
        <div className="text-opensoc-400">Loading fine-tuning statistics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soc-dark-900 text-white">
      <div className="container mx-auto px-6 py-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-opensoc-300 flex items-center space-x-3">
                <Brain className="w-8 h-8" />
                <span>AI Model Fine-Tuning</span>
              </h1>
              <p className="text-gray-400 mt-2">
                Export training data and fine-tune GPT-OSS 20B for enhanced security analysis
              </p>
            </div>
            <button
              onClick={loadStats}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-opensoc-600 hover:bg-opensoc-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <FineTuningNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        {/* Error State */}
        {!stats && !loading && (
          <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-6 text-center">
            <div className="text-red-400 mb-2">⚠️ Failed to Load Statistics</div>
            <div className="text-gray-300 text-sm mb-4">
              Unable to fetch fine-tuning statistics from the backend API.
            </div>
            <button
              onClick={loadStats}
              className="px-4 py-2 bg-opensoc-600 hover:bg-opensoc-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'statistics' && stats && (
          <>
            {/* Top Section - Stats Cards */}
            <div className="mb-6">
              <DatasetStatsCards stats={stats} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Charts */}
              <div className="lg:col-span-2">
                <DataQualityCharts stats={stats} />
              </div>

              {/* Right Column - Export Controls */}
              <div>
                <ExportControls
                  stats={stats}
                  exportOptions={exportOptions}
                  setExportOptions={setExportOptions}
                  onExport={handleExport}
                  exporting={exporting}
                />
              </div>
            </div>
          </>
        )}


        {activeTab === 'guide' && (
          <FineTuningGuide />
        )}

        {activeTab === 'examples' && (
          <CodeExamples />
        )}

        {/* Bottom Section - Guidelines and Info */}
        {activeTab === 'statistics' && (
          <div className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fine-Tuning Guidelines */}
              <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-opensoc-300 mb-3 flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>LoRA Fine-Tuning Guidelines</span>
                </h3>
                <div className="space-y-1 text-sm text-gray-300">
                  <div>• <strong>Model:</strong> gpt-oss-20b with QLoRA</div>
                  <div>• <strong>Memory:</strong> Requires 14GB VRAM minimum</div>
                  <div>• <strong>Dataset Size:</strong> 1,000+ high-quality examples recommended</div>
                  <div>• <strong>Format:</strong> JSONL with instruction-input-output structure</div>
                  <div>• <strong>Quality:</strong> Human-verified labels ensure better model performance</div>
                </div>
              </div>

              {/* Data Overview */}
              <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-opensoc-300 mb-3">Data Overview</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Data Readiness */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Quality Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Human Reviews:</span>
                        <span className="text-white">{Math.round(((stats?.humanReviewedAlerts || 0) / (stats?.totalAlerts || 1)) * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">High Quality:</span>
                        <span className="text-white">{Math.round(((stats?.qualityDistribution?.high || 0) / (stats?.totalAlerts || 1)) * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">False Positive:</span>
                        <span className="text-white">{Math.round(((stats?.falsePositiveAlerts || 0) / (stats?.humanReviewedAlerts || 1)) * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Reviewers:</span>
                        <span className="text-white">{stats?.reviewerStats.totalReviewers || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Data Coverage */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Coverage</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Earliest:</span>
                        <span className="text-white">{stats?.dateRange.earliest || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Latest:</span>
                        <span className="text-white">{stats?.dateRange.latest || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Time Span:</span>
                        <span className="text-white">
                          {stats && Math.round((new Date(stats.dateRange.latest).getTime() - new Date(stats.dateRange.earliest).getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Guide */}
            <div className="mt-6">
              <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-opensoc-300 mb-3 flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Usage Guide</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-400">
                  <div className="space-y-1">
                    <div>1. Ensure sufficient human-reviewed alerts (1000+ recommended)</div>
                    <div>2. Configure export parameters and date range</div>
                    <div>3. Export dataset in JSONL format for training</div>
                  </div>
                  <div className="space-y-1">
                    <div>4. Use training/validation/test splits for model evaluation</div>
                    <div>5. Monitor data quality metrics for optimal results</div>
                    <div>6. Review feedback consistency for better performance</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FineTuningDataExportPage;