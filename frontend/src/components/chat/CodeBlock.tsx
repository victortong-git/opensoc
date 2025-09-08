import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  inline?: boolean;
  className?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ 
  code, 
  language, 
  inline = false, 
  className = '' 
}) => {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  if (inline) {
    return (
      <code className="px-2 py-1 bg-soc-dark-700 text-opensoc-300 rounded text-sm font-mono">
        {code}
      </code>
    );
  }

  return (
    <div className="relative group my-4">
      {/* Language label and copy button */}
      <div className="flex justify-between items-center bg-soc-dark-700 px-4 py-2 rounded-t-lg border-b border-soc-dark-600">
        <span className="text-xs text-slate-400 font-medium uppercase">
          {language || 'code'}
        </span>
        <button
          onClick={copyCode}
          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <pre className={`bg-soc-dark-800 p-4 rounded-b-lg overflow-x-auto text-sm ${className}`}>
        <code className="text-slate-200 font-mono leading-relaxed whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;