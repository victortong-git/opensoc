import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  AlertTriangle, 
  Database, 
  FileText, 
  Shield 
} from 'lucide-react';
import CodeBlock from './CodeBlock';

interface MessageContentProps {
  content: string;
  role: 'user' | 'assistant';
  enableMarkdown?: boolean;
  ragContext?: {
    query: string;
    resultsFound: number;
    sources: Array<{
      type: string;
      id: string;
      similarity: number;
    }>;
    searchMetadata?: {
      query: string;
      searchBreakdown: Array<{
        dataSource: string;
        resultsFound: number;
        searchTime: number;
        topSimilarity?: number;
      }>;
      totalSearchTime: number;
      similarityThreshold: number;
      maxResults: number;
      completedAt: string;
    };
  };
  toolExecutions?: Array<{
    toolName: string;
    displayName: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    result?: any;
    error?: string;
    parameters?: any;
  }>;
  enabledTools?: string[];
}

const MessageContent: React.FC<MessageContentProps> = ({ 
  content, 
  role, 
  enableMarkdown = true,
  ragContext,
  toolExecutions,
  enabledTools
}) => {
  const [showRagSources, setShowRagSources] = useState(false);

  // Helper function to get icon for source type
  const getSourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'incident':
        return <Shield className="h-4 w-4 text-orange-400" />;
      case 'asset':
        return <Database className="h-4 w-4 text-blue-400" />;
      case 'ioc':
        return <Database className="h-4 w-4 text-purple-400" />;
      case 'playbook':
        return <FileText className="h-4 w-4 text-green-400" />;
      default:
        return <Database className="h-4 w-4 text-slate-400" />;
    }
  };

  // Helper function to get link path for source
  const getSourceLink = (type: string, id: string) => {
    const baseType = type.toLowerCase();
    switch (baseType) {
      case 'alert':
        return `/alerts?id=${id}`;
      case 'incident':
        return `/incidents?id=${id}`;
      case 'asset':
        return `/assets?id=${id}`;
      case 'ioc':
        return `/threat-intel?id=${id}`;
      case 'playbook':
        return `/playbooks?id=${id}`;
      default:
        return `#`;
    }
  };
  // For user messages, always show plain text
  if (role === 'user' || !enableMarkdown) {
    return (
      <div className="whitespace-pre-wrap break-words text-sm">
        {content}
      </div>
    );
  }

  // Custom components for markdown rendering
  const components = {
    // Headers
    h1: ({ children }: any) => (
      <h1 className="text-lg font-bold text-white mb-2 mt-4 first:mt-0">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-base font-bold text-white mb-2 mt-3 first:mt-0">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-sm font-semibold text-white mb-1 mt-2 first:mt-0">{children}</h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-sm font-medium text-slate-200 mb-1 mt-2 first:mt-0">{children}</h4>
    ),
    h5: ({ children }: any) => (
      <h5 className="text-sm font-medium text-slate-300 mb-1 mt-1 first:mt-0">{children}</h5>
    ),
    h6: ({ children }: any) => (
      <h6 className="text-sm text-slate-400 mb-1 mt-1 first:mt-0">{children}</h6>
    ),

    // Paragraphs - handle properly to avoid nesting issues
    p: ({ node, children }: any) => {
      // Check if this paragraph contains only a code block
      const hasCodeBlockChild = node?.children?.some((child: any) => 
        child.tagName === 'code' && !child.properties?.inline
      );
      
      if (hasCodeBlockChild) {
        // Return as div to avoid invalid nesting of block elements in p
        return <div className="mb-3 last:mb-0 text-sm leading-relaxed">{children}</div>;
      }
      
      return <p className="mb-3 last:mb-0 text-sm leading-relaxed">{children}</p>;
    },

    // Lists
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside mb-3 space-y-1 text-sm pl-2">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside mb-3 space-y-1 text-sm pl-2">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="text-slate-200">{children}</li>
    ),

    // Code blocks and inline code
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeString = String(children).replace(/\n$/, '');

      if (inline) {
        return <CodeBlock code={codeString} inline={true} />;
      }

      return <CodeBlock code={codeString} language={language} />;
    },

    // Blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-opensoc-500 pl-4 my-3 text-slate-300 italic bg-soc-dark-700/30 py-2 rounded-r">
        {children}
      </blockquote>
    ),

    // Links
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-opensoc-400 hover:text-opensoc-300 underline transition-colors"
      >
        {children}
      </a>
    ),

    // Tables
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-3">
        <table className="min-w-full border border-soc-dark-600 rounded-lg overflow-hidden">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-soc-dark-700">{children}</thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="bg-soc-dark-800">{children}</tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="border-b border-soc-dark-600 last:border-0">{children}</tr>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-2 text-left text-sm font-medium text-white border-r border-soc-dark-600 last:border-0">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-2 text-sm text-slate-200 border-r border-soc-dark-600 last:border-0">
        {children}
      </td>
    ),

    // Horizontal rule
    hr: () => (
      <hr className="border-soc-dark-600 my-4" />
    ),

    // Strong and emphasis
    strong: ({ children }: any) => (
      <strong className="font-semibold text-white">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-slate-200">{children}</em>
    ),

    // Task lists (GFM)
    input: ({ checked, ...props }: any) => (
      <input
        type="checkbox"
        checked={checked}
        disabled
        className="mr-2 accent-opensoc-500"
        {...props}
      />
    ),
  };

  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
        // Security: Only allow safe protocols
        urlTransform={(uri) => {
          const allowedProtocols = ['http:', 'https:', 'mailto:'];
          try {
            const url = new URL(uri);
            return allowedProtocols.includes(url.protocol) ? uri : '#';
          } catch {
            return '#';
          }
        }}
      >
        {content}
      </ReactMarkdown>
      
      {/* Tool Execution Display */}
      {(toolExecutions && toolExecutions.length > 0) || (enabledTools && enabledTools.length > 0) ? (
        <div className="mt-4 p-3 bg-opensoc-900/20 border border-opensoc-600/30 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-opensoc-400">
            <Shield className="h-4 w-4" />
            <span>
              AI used {toolExecutions?.length || 0} security tool{toolExecutions?.length !== 1 ? 's' : ''}
              {enabledTools && enabledTools.length > 0 && (
                <span className="text-slate-500 ml-1">
                  • {enabledTools.length} enabled
                </span>
              )}
            </span>
          </div>
          
          {toolExecutions && toolExecutions.length > 0 && (
            <div className="mt-2 space-y-1">
              {toolExecutions.map((tool, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    {tool.displayName || tool.toolName.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    tool.status === 'completed' 
                      ? 'bg-green-900/30 text-green-400' 
                      : tool.status === 'error'
                      ? 'bg-red-900/30 text-red-400'
                      : tool.status === 'running'
                      ? 'bg-blue-900/30 text-blue-400'
                      : 'bg-gray-900/30 text-gray-400'
                  }`}>
                    {tool.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
      
      {/* RAG Sources Display */}
      {ragContext && ragContext.sources && ragContext.sources.length > 0 && (
        <div className="mt-4 p-3 bg-soc-dark-800/50 border border-soc-dark-600 rounded-lg">
          <button
            onClick={() => setShowRagSources(!showRagSources)}
            className="flex items-center justify-between w-full text-sm text-slate-300 hover:text-white transition-colors"
          >
            <span className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>
                Referenced {ragContext.resultsFound} source{ragContext.resultsFound !== 1 ? 's' : ''} from SOC data
                {ragContext.searchMetadata && (
                  <span className="text-slate-500 ml-1">
                    • {ragContext.searchMetadata.totalSearchTime}ms search
                  </span>
                )}
              </span>
            </span>
            {showRagSources ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {showRagSources && (
            <div className="mt-3 space-y-4">
              {/* Search Breakdown Summary */}
              {ragContext.searchMetadata && (
                <div className="p-3 bg-soc-dark-700/50 rounded-lg border border-soc-dark-600">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-white">Search Performance</h5>
                    <span className="text-xs text-slate-400">
                      {new Date(ragContext.searchMetadata.completedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-slate-400">Total Search Time</div>
                      <div className="text-sm font-medium text-white">
                        {ragContext.searchMetadata.totalSearchTime}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Similarity Threshold</div>
                      <div className="text-sm font-medium text-white">
                        {(ragContext.searchMetadata.similarityThreshold * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Data Sources Breakdown */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-300">Sources Searched:</div>
                    {ragContext.searchMetadata.searchBreakdown.map((breakdown, index) => (
                      <div
                        key={breakdown.dataSource}
                        className="flex items-center justify-between p-2 bg-soc-dark-800 rounded text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          {getSourceIcon(breakdown.dataSource)}
                          <span className="text-slate-300 capitalize">
                            {breakdown.dataSource === 'iocs' ? 'Threat Intel (IOCs)' : 
                             breakdown.dataSource.charAt(0).toUpperCase() + breakdown.dataSource.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-slate-400">
                          <span>{breakdown.resultsFound} results</span>
                          <span>{breakdown.searchTime}ms</span>
                          {breakdown.topSimilarity && breakdown.topSimilarity > 0 && (
                            <span className="text-green-400">
                              {(breakdown.topSimilarity * 100).toFixed(1)}% top match
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Sources */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-white">Retrieved Sources:</div>
                {ragContext.sources.map((source, index) => (
                  <div
                    key={`${source.type}-${source.id}-${index}`}
                    className="flex items-center justify-between p-3 bg-soc-dark-700 rounded border border-soc-dark-600"
                  >
                    <div className="flex items-center space-x-3">
                      {getSourceIcon(source.type)}
                      <div>
                        <div className="text-sm font-medium text-white capitalize">
                          {source.type} #{source.id}
                        </div>
                        <div className="text-xs text-slate-400">
                          Similarity: {(source.similarity * 100).toFixed(1)}% • Used in AI response
                        </div>
                      </div>
                    </div>
                    
                    <a
                      href={getSourceLink(source.type, source.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-3 py-1 text-xs bg-opensoc-600/20 text-opensoc-300 
                               rounded-lg hover:bg-opensoc-600/30 hover:text-opensoc-200 transition-colors"
                    >
                      <span>View Details</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
              
              <div className="pt-2 border-t border-soc-dark-600 text-xs text-slate-500">
                💡 These sources were retrieved using semantic similarity search and provided context for the AI response.
                {ragContext.searchMetadata && (
                  <span className="block mt-1">
                    Query processed: "{ragContext.searchMetadata.query}"
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageContent;