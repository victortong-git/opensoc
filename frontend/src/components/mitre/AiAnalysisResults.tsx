import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { 
  FileText, 
  Code, 
  Copy, 
  ExternalLink, 
  Clock, 
  Cpu, 
  Target,
  Shield,
  Search,
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react';
import { parseMitreAnalysis, MitreAnalysisSection } from '../../utils/mitreAnalysisParser';

interface AiAnalysisResultsProps {
  aiResponse: any;
  rawContent?: string;
  onTechniqueClick?: (techniqueId: string) => void;
}

const AiAnalysisResults: React.FC<AiAnalysisResultsProps> = ({
  aiResponse,
  rawContent = '',
  onTechniqueClick
}) => {
  const [activeTab, setActiveTab] = useState<'formatted' | 'raw'>('formatted');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showAllTechniques, setShowAllTechniques] = useState(false);

  // Parse the AI response into structured data
  const parsedAnalysis = useMemo(() => {
    try {
      return parseMitreAnalysis(aiResponse, rawContent);
    } catch (error) {
      console.error('Error parsing AI analysis:', error);
      // Return fallback structure
      return {
        sections: [{
          id: 'raw',
          title: 'AI Analysis',
          content: rawContent || JSON.stringify(aiResponse, null, 2),
          type: 'other' as const,
          icon: '🤖',
          color: 'blue' as const
        }],
        summary: 'AI analysis completed',
        techniques: [],
        metadata: {
          model: aiResponse?.data?.model || 'AI Provider',
          processingTime: aiResponse?.execution_time_ms || 0,
          confidence: 'unknown'
        }
      };
    }
  }, [aiResponse, rawContent]);

  // Auto-expand first section when analysis loads
  React.useEffect(() => {
    if (parsedAnalysis.sections.length > 0 && expandedSections.size === 0) {
      setExpandedSections(new Set([parsedAnalysis.sections[0].id]));
    }
  }, [parsedAnalysis.sections]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleTechniqueClick = (techniqueId: string) => {
    if (onTechniqueClick) {
      onTechniqueClick(techniqueId);
    }
  };

  const getSectionColorClasses = (color: string) => {
    const colorMap = {
      purple: 'border-purple-500/30 bg-purple-900/20',
      red: 'border-red-500/30 bg-red-900/20',
      blue: 'border-blue-500/30 bg-blue-900/20',
      green: 'border-green-500/30 bg-green-900/20',
      orange: 'border-orange-500/30 bg-orange-900/20',
      gray: 'border-gray-500/30 bg-gray-900/20'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  const renderFormattedResults = () => (
    <div className="space-y-6">
      {/* Analysis Summary */}
      <div className="bg-soc-dark-700 rounded-lg p-6 border border-soc-dark-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Target className="h-5 w-5 mr-2 text-opensoc-400" />
            Analysis Summary
          </h3>
          <div className="flex items-center space-x-4 text-sm text-slate-400">
            <div className="flex items-center">
              <Cpu className="h-4 w-4 mr-1" />
              {parsedAnalysis.metadata.model}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {parsedAnalysis.metadata.processingTime}ms
            </div>
            {parsedAnalysis.metadata.confidence !== 'unknown' && (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-400" />
                <span className="capitalize">{parsedAnalysis.metadata.confidence} Confidence</span>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-slate-300 leading-relaxed">{parsedAnalysis.summary}</p>
        
        {/* Technique Pills */}
        {parsedAnalysis.techniques.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">MITRE ATT&CK Techniques Identified:</p>
              {parsedAnalysis.techniques.length > 8 && (
                <button
                  onClick={() => setShowAllTechniques(!showAllTechniques)}
                  className="text-xs text-opensoc-400 hover:text-opensoc-300 transition-colors flex items-center"
                >
                  {showAllTechniques ? (
                    <>
                      <Eye className="h-3 w-3 mr-1 rotate-180" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Show All ({parsedAnalysis.techniques.length})
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(showAllTechniques ? parsedAnalysis.techniques : parsedAnalysis.techniques.slice(0, 8)).map((technique) => (
                <button
                  key={technique}
                  onClick={() => handleTechniqueClick(technique)}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-900/40 text-purple-300 hover:bg-purple-900/60 transition-colors border border-purple-500/30"
                >
                  <Target className="h-3 w-3 mr-1" />
                  {technique}
                </button>
              ))}
              {!showAllTechniques && parsedAnalysis.techniques.length > 8 && (
                <button
                  onClick={() => setShowAllTechniques(true)}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors border border-slate-600"
                >
                  +{parsedAnalysis.techniques.length - 8} more
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Sections */}
      <div className="space-y-4">
        {parsedAnalysis.sections.map((section) => (
          <div
            key={section.id}
            className={`rounded-lg border ${getSectionColorClasses(section.color)} overflow-hidden`}
          >
            {/* Section Header */}
            <div 
              className="p-4 cursor-pointer hover:bg-soc-dark-700/50 transition-colors"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white flex items-center">
                  <span className="text-lg mr-2">{section.icon}</span>
                  {section.title}
                </h4>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(section.content);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-300 transition-colors"
                    title="Copy section content"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <Eye className={`h-4 w-4 transition-transform ${
                    expandedSections.has(section.id) ? 'rotate-0' : 'rotate-180'
                  }`} />
                </div>
              </div>
            </div>

            {/* Section Content */}
            {expandedSections.has(section.id) && (
              <div className="px-4 pb-4">
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      // Custom renderer for technique IDs
                      code: ({ node, inline, className, children, ...props }) => {
                        const match = /T\d{4}(?:\.\d{3})?/.test(String(children));
                        if (inline && match) {
                          return (
                            <button
                              onClick={() => handleTechniqueClick(String(children))}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-purple-900/40 text-purple-300 hover:bg-purple-900/60 transition-colors border border-purple-500/30 mx-1"
                            >
                              <Target className="h-3 w-3 mr-1" />
                              {children}
                            </button>
                          );
                        }
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                      // Enhanced table styling
                      table: ({ children }) => (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-soc-dark-600 border border-soc-dark-600 rounded-lg">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-soc-dark-800">
                          {children}
                        </thead>
                      ),
                      th: ({ children }) => (
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider border-b border-soc-dark-600">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-3 text-sm text-slate-300 border-b border-soc-dark-700">
                          {children}
                        </td>
                      ),
                      // Enhanced list styling
                      ul: ({ children }) => (
                        <ul className="space-y-2 ml-4">
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => (
                        <li className="flex items-start">
                          <span className="text-opensoc-400 mr-2">•</span>
                          <span>{children}</span>
                        </li>
                      )
                    }}
                  >
                    {section.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderRawResponse = () => {
    const rawText = aiResponse?.data?.analysis || 
                   aiResponse?.data?.content || 
                   aiResponse?.analysis || 
                   aiResponse?.content || 
                   rawContent ||
                   JSON.stringify(aiResponse, null, 2);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Code className="h-5 w-5 mr-2 text-opensoc-400" />
            Raw AI Response
          </h3>
          <button
            onClick={() => copyToClipboard(rawText)}
            className="flex items-center px-3 py-2 text-sm bg-soc-dark-700 hover:bg-soc-dark-600 text-slate-300 rounded-md border border-soc-dark-600 transition-colors"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy All
          </button>
        </div>
        
        <div className="bg-soc-dark-700 rounded-lg border border-soc-dark-600 overflow-hidden">
          <pre className="p-4 text-sm text-slate-300 overflow-auto max-h-96 whitespace-pre-wrap leading-relaxed">
            {rawText}
          </pre>
        </div>
        
        {/* Response Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-soc-dark-800 rounded-lg p-4 border border-soc-dark-700">
            <div className="flex items-center text-sm text-slate-400">
              <Cpu className="h-4 w-4 mr-2" />
              Model
            </div>
            <p className="text-white font-medium mt-1">
              {parsedAnalysis.metadata.model}
            </p>
          </div>
          
          <div className="bg-soc-dark-800 rounded-lg p-4 border border-soc-dark-700">
            <div className="flex items-center text-sm text-slate-400">
              <Clock className="h-4 w-4 mr-2" />
              Processing Time
            </div>
            <p className="text-white font-medium mt-1">
              {parsedAnalysis.metadata.processingTime}ms
            </p>
          </div>
          
          <div className="bg-soc-dark-800 rounded-lg p-4 border border-soc-dark-700">
            <div className="flex items-center text-sm text-slate-400">
              <FileText className="h-4 w-4 mr-2" />
              Content Length
            </div>
            <p className="text-white font-medium mt-1">
              {rawText.length.toLocaleString()} characters
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-soc-dark-800 rounded-lg shadow-sm border border-soc-dark-700 overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-soc-dark-700">
        <nav className="flex" aria-label="AI Results Tabs">
          {[
            { id: 'formatted', name: 'Formatted Results', icon: FileText },
            { id: 'raw', name: 'Raw Response', icon: Code }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-opensoc-500 text-opensoc-400 bg-soc-dark-700/50'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
              } whitespace-nowrap py-3 px-6 border-b-2 font-medium text-sm flex items-center transition-colors`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'formatted' && renderFormattedResults()}
        {activeTab === 'raw' && renderRawResponse()}
      </div>
    </div>
  );
};

export default AiAnalysisResults;