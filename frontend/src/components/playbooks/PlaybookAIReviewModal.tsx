import React, { useState } from 'react';
import { 
  X,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  Target,
  Zap,
  RefreshCw,
  TrendingUp,
  Award,
  AlertCircle,
  Info,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface ReviewScore {
  category: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  findings: string[];
  recommendations: string[];
}

interface ReviewFinding {
  id: string;
  type: 'security_gap' | 'compliance_issue' | 'efficiency_concern' | 'best_practice';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  category: string;
  impact: string;
  recommendation: string;
  autoFixAvailable: boolean;
  stepReference?: string;
}

interface PlaybookAIReviewModalProps {
  playbook: any;
  isOpen: boolean;
  onClose: () => void;
  onApplyFixes: (fixes: ReviewFinding[]) => void;
  isAnalyzing: boolean;
}

const PlaybookAIReviewModal: React.FC<PlaybookAIReviewModalProps> = ({
  playbook,
  isOpen,
  onClose,
  onApplyFixes,
  isAnalyzing
}) => {
  const [reviewResults, setReviewResults] = useState<{
    scores: ReviewScore[];
    findings: ReviewFinding[];
    overallScore: number;
    overallGrade: string;
  } | null>(null);
  const [selectedFixes, setSelectedFixes] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'compliance' | 'efficiency'>('overview');

  // Load real AI review data when modal opens
  React.useEffect(() => {
    if (isOpen && !reviewResults && !isAnalyzing) {
      // Check if we have review data from the API call
      const reviewData = (window as any).latestReviewData;
      if (reviewData && reviewData.review) {
        console.log('📊 Loading real AI review data:', reviewData.review.findings.length, 'findings');
        loadRealReviewData(reviewData);
      }
    }
  }, [isOpen, isAnalyzing, reviewResults]);

  // Reset state when modal opens or closes
  React.useEffect(() => {
    if (isOpen) {
      setReviewResults(null);
      setSelectedFixes(new Set());
      setActiveTab('overview');
    }
  }, [isOpen]);

  if (!isOpen || !playbook) return null;

  const loadRealReviewData = (apiData: any) => {
    const review = apiData.review;
    const scores = apiData.review.scores;
    
    // Map API data to component format
    const reviewData = {
      scores: [
        {
          category: 'Security',
          score: scores.security,
          maxScore: 100,
          status: scores.security >= 80 ? 'excellent' as const : scores.security >= 60 ? 'good' as const : 'needs_improvement' as const,
          findings: review.findings.filter((f: any) => f.category === 'Security').map((f: any) => f.title),
          recommendations: review.findings.filter((f: any) => f.category === 'Security').map((f: any) => f.recommendation)
        },
        {
          category: 'Compliance', 
          score: scores.compliance,
          maxScore: 100,
          status: scores.compliance >= 80 ? 'excellent' as const : scores.compliance >= 60 ? 'good' as const : 'needs_improvement' as const,
          findings: review.findings.filter((f: any) => f.category === 'Compliance').map((f: any) => f.title),
          recommendations: review.findings.filter((f: any) => f.category === 'Compliance').map((f: any) => f.recommendation)
        },
        {
          category: 'Efficiency',
          score: scores.efficiency,
          maxScore: 100,
          status: scores.efficiency >= 80 ? 'excellent' as const : scores.efficiency >= 60 ? 'good' as const : 'needs_improvement' as const,
          findings: review.findings.filter((f: any) => f.category === 'Efficiency').map((f: any) => f.title),
          recommendations: review.findings.filter((f: any) => f.category === 'Efficiency').map((f: any) => f.recommendation)
        },
        {
          category: 'Completeness',
          score: scores.completeness,
          maxScore: 100,
          status: scores.completeness >= 80 ? 'excellent' as const : scores.completeness >= 60 ? 'good' as const : 'needs_improvement' as const,
          findings: review.findings.filter((f: any) => f.category === 'Completeness').map((f: any) => f.title),
          recommendations: review.findings.filter((f: any) => f.category === 'Completeness').map((f: any) => f.recommendation)
        }
      ],
      findings: review.findings.map((finding: any) => ({
        id: finding.id,
        type: finding.severity === 'critical' ? 'security_gap' as const : 
              finding.severity === 'major' ? 'compliance_issue' as const : 'process_gap' as const,
        severity: finding.severity === 'critical' ? 'high' as const :
                 finding.severity === 'major' ? 'medium' as const : 'low' as const,
        title: finding.title,
        description: finding.description,
        category: finding.category,
        impact: finding.impact,
        recommendation: finding.recommendation,
        autoFixAvailable: finding.severity !== 'minor',
        stepReference: finding.affectedSteps?.length > 0 ? `Steps: ${finding.affectedSteps.join(', ')}` : undefined
      })),
      overallScore: review.overallScore,
      overallGrade: review.overallScore >= 90 ? 'A' : 
                   review.overallScore >= 80 ? 'B+' : 
                   review.overallScore >= 70 ? 'B' : 
                   review.overallScore >= 60 ? 'C+' : 'C'
    };
    
    setReviewResults(reviewData);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500/20 text-green-400';
      case 'good': return 'bg-blue-500/20 text-blue-400';
      case 'needs_improvement': return 'bg-yellow-500/20 text-yellow-400';
      case 'critical': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/20';
      case 'info': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'security_gap': return <Shield className="h-4 w-4 text-red-400" />;
      case 'compliance_issue': return <Award className="h-4 w-4 text-yellow-400" />;
      case 'efficiency_concern': return <Zap className="h-4 w-4 text-blue-400" />;
      case 'best_practice': return <Target className="h-4 w-4 text-green-400" />;
      default: return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const toggleFix = (findingId: string) => {
    const newSelected = new Set(selectedFixes);
    if (newSelected.has(findingId)) {
      newSelected.delete(findingId);
    } else {
      newSelected.add(findingId);
    }
    setSelectedFixes(newSelected);
  };

  const getFilteredFindings = () => {
    if (!reviewResults) return [];
    if (activeTab === 'overview') return reviewResults.findings;
    
    const typeMap: { [key: string]: string[] } = {
      security: ['security_gap'],
      compliance: ['compliance_issue'],
      efficiency: ['efficiency_concern', 'best_practice']
    };
    
    return reviewResults.findings.filter(f => typeMap[activeTab]?.includes(f.type));
  };

  const handleApplySelected = () => {
    if (!reviewResults) return;
    const selectedFindingsList = reviewResults.findings.filter(f => selectedFixes.has(f.id));
    onApplyFixes(selectedFindingsList);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Search className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">AI Playbook Review</h2>
                <p className="text-sm text-slate-400">
                  Comprehensive analysis of "{playbook.name}"
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Analysis Status */}
          {isAnalyzing && (
            <div className="card p-6 mb-6 bg-blue-500/10 border-blue-500/20">
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                <div>
                  <h3 className="text-white font-medium">Analyzing Playbook Quality...</h3>
                  <p className="text-blue-300 text-sm">
                    Evaluating security, compliance, efficiency, and completeness
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Review Results */}
          {!isAnalyzing && reviewResults && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="card p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Overall Quality Score</h3>
                    <p className="text-slate-300">Comprehensive evaluation across all categories</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(reviewResults.overallScore)}`}>
                      {reviewResults.overallScore}
                    </div>
                    <div className="text-lg text-slate-300">{reviewResults.overallGrade}</div>
                    <div className="text-sm text-slate-400">out of 100</div>
                  </div>
                </div>
              </div>

              {/* Category Scores */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {reviewResults.scores.map((score, index) => (
                  <div key={index} className="card">
                    <div className="text-center mb-4">
                      <div className={`text-2xl font-bold ${getScoreColor(score.score)}`}>
                        {score.score}
                      </div>
                      <div className="text-slate-400 text-sm">/ {score.maxScore}</div>
                      <h3 className="text-white font-medium mt-2">{score.category}</h3>
                      <span className={`px-2 py-1 text-xs rounded mt-2 inline-block ${getStatusColor(score.status)}`}>
                        {score.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Key Findings:</p>
                        <ul className="text-xs text-slate-300 space-y-1">
                          {score.findings.slice(0, 2).map((finding, i) => (
                            <li key={i} className="flex items-start space-x-1">
                              <span className="text-slate-500 mt-1">•</span>
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 bg-soc-dark-800 p-1 rounded-lg">
                {[
                  { id: 'overview', label: 'All Findings', icon: TrendingUp },
                  { id: 'security', label: 'Security', icon: Shield },
                  { id: 'compliance', label: 'Compliance', icon: Award },
                  { id: 'efficiency', label: 'Efficiency', icon: Zap }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-opensoc-600 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-soc-dark-700'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Findings List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">
                    Detailed Findings ({getFilteredFindings().length})
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedFixes(new Set(getFilteredFindings().filter(f => f.autoFixAvailable).map(f => f.id)))}
                      className="text-sm text-opensoc-400 hover:text-opensoc-300"
                    >
                      Select Auto-fixable
                    </button>
                    <span className="text-slate-500">|</span>
                    <button
                      onClick={() => setSelectedFixes(new Set())}
                      className="text-sm text-slate-400 hover:text-slate-300"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {getFilteredFindings().map((finding) => (
                    <div
                      key={finding.id}
                      className={`card cursor-pointer transition-all ${
                        selectedFixes.has(finding.id)
                          ? 'border-opensoc-500 bg-opensoc-500/5'
                          : 'hover:border-soc-dark-600'
                      }`}
                      onClick={() => finding.autoFixAvailable && toggleFix(finding.id)}
                    >
                      <div className="flex items-start space-x-4">
                        {finding.autoFixAvailable && (
                          <div className="flex-shrink-0 mt-1">
                            <input
                              type="checkbox"
                              checked={selectedFixes.has(finding.id)}
                              onChange={() => toggleFix(finding.id)}
                              className="w-4 h-4 text-opensoc-600 bg-soc-dark-800 border-soc-dark-600 rounded focus:ring-opensoc-500 focus:ring-2"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getTypeIcon(finding.type)}
                            <h4 className="text-white font-medium">{finding.title}</h4>
                            <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(finding.severity)}`}>
                              {finding.severity.toUpperCase()}
                            </span>
                            <span className="px-2 py-1 bg-slate-600/20 text-slate-300 text-xs rounded">
                              {finding.category}
                            </span>
                            {finding.autoFixAvailable && (
                              <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">
                                AUTO-FIX
                              </span>
                            )}
                          </div>
                          
                          <p className="text-slate-300 text-sm mb-2">{finding.description}</p>
                          
                          <div className="space-y-2">
                            <div className="bg-soc-dark-800/50 p-3 rounded text-xs">
                              <p className="text-slate-400 mb-1">
                                <strong>Impact:</strong>
                              </p>
                              <p className="text-slate-300 mb-2">{finding.impact}</p>
                              <p className="text-slate-400 mb-1">
                                <strong>Recommendation:</strong>
                              </p>
                              <p className="text-slate-300">{finding.recommendation}</p>
                              {finding.stepReference && (
                                <p className="text-opensoc-400 mt-2">
                                  <strong>Location:</strong> {finding.stepReference}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between mt-6 pt-6 border-t border-soc-dark-700">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
            
            {!isAnalyzing && reviewResults && (
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setReviewResults(null);
                    setSelectedFixes(new Set());
                    setActiveTab('overview');
                    // Clear stored data and close modal to trigger new analysis
                    (window as any).latestReviewData = null;
                    onClose();
                    // Note: User will need to click "AI Review" button again
                  }}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Re-analyze</span>
                </button>
                <button
                  onClick={handleApplySelected}
                  disabled={selectedFixes.size === 0}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Apply Selected Fixes ({selectedFixes.size})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaybookAIReviewModal;