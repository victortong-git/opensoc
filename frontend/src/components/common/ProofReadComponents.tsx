import React from 'react';
import { Sparkles, CheckCircle, XCircle, Bot } from 'lucide-react';

export interface ProofReadSuggestionProps {
  field: string;
  suggestion: string;
  onAccept: (field: string, suggestedText: string) => void;
  onReject: (field: string) => void;
  showSuggestions: boolean;
}

export interface ProofReadIndicatorProps {
  field: string;
  acceptedSuggestions: Set<string>;
}

export const ProofReadSuggestion: React.FC<ProofReadSuggestionProps> = ({ 
  field, 
  suggestion, 
  onAccept, 
  onReject, 
  showSuggestions 
}) => {
  if (!suggestion || !showSuggestions) return null;
  
  return (
    <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
      <div className="flex items-start justify-between space-x-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">AI Suggestion</span>
          </div>
          <div className="text-sm text-slate-300 bg-soc-dark-800 rounded p-2">
            {suggestion}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onAccept(field, suggestion)}
            className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded"
            title="Accept suggestion"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => onReject(field)}
            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
            title="Reject suggestion"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProofReadIndicator: React.FC<ProofReadIndicatorProps> = ({ 
  field, 
  acceptedSuggestions 
}) => {
  if (acceptedSuggestions.has(field)) {
    return (
      <div className="inline-flex items-center space-x-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded px-2 py-1 ml-2">
        <CheckCircle className="h-3 w-3" />
        <span>Improved</span>
      </div>
    );
  }
  return null;
};

export interface AIDraftIndicatorProps {
  field: string;
  aiDraftedFields: Set<string>;
}

export const AIDraftIndicator: React.FC<AIDraftIndicatorProps> = ({ 
  field, 
  aiDraftedFields 
}) => {
  if (aiDraftedFields.has(field)) {
    return (
      <div className="inline-flex items-center space-x-1 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded px-2 py-1 ml-2">
        <Bot className="h-3 w-3" />
        <span>AI Drafted</span>
      </div>
    );
  }
  return null;
};