import React, { useState } from 'react';
import { 
  X,
  Bot,
  Wand2,
  RefreshCw
} from 'lucide-react';

interface AIGenerationRequest {
  incident: string;
  threat: string;
  vulnerability: string;
  context: string;
  priority: string;
}

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (request: AIGenerationRequest) => void;
  isGenerating: boolean;
}

const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({ 
  isOpen, 
  onClose, 
  onGenerate, 
  isGenerating 
}) => {
  const [aiRequest, setAiRequest] = useState<AIGenerationRequest>({
    incident: '',
    threat: '',
    vulnerability: '',
    context: '',
    priority: 'medium'
  });

  if (!isOpen) return null;

  const handleGenerate = () => {
    onGenerate(aiRequest);
    // Reset form after generation
    setAiRequest({
      incident: '',
      threat: '',
      vulnerability: '',
      context: '',
      priority: 'medium'
    });
  };

  const isFormValid = aiRequest.incident || aiRequest.threat || aiRequest.vulnerability;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
          <div className="flex items-center space-x-3">
            <Bot className="h-6 w-6 text-opensoc-400" />
            <h2 className="text-xl font-semibold text-white">AI Playbook Generator</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="card !p-4 bg-opensoc-600/10 border-opensoc-600/20">
            <div className="flex items-center space-x-2 mb-3">
              <Wand2 className="h-5 w-5 text-opensoc-400" />
              <h3 className="text-lg font-medium text-white">Describe the Security Scenario</h3>
            </div>
            <p className="text-opensoc-300 text-sm">
              Provide details about the incident, threat, or vulnerability. The AI will generate a comprehensive 
              playbook with step-by-step response procedures.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Incident Description</label>
              <input
                type="text"
                value={aiRequest.incident}
                onChange={(e) => setAiRequest(prev => ({...prev, incident: e.target.value}))}
                placeholder="e.g., Ransomware attack, Data breach, System compromise..."
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Threat Details</label>
              <input
                type="text"
                value={aiRequest.threat}
                onChange={(e) => setAiRequest(prev => ({...prev, threat: e.target.value}))}
                placeholder="e.g., APT group, Malware family, Attack vector..."
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Vulnerability</label>
              <input
                type="text"
                value={aiRequest.vulnerability}
                onChange={(e) => setAiRequest(prev => ({...prev, vulnerability: e.target.value}))}
                placeholder="e.g., CVE-2024-1234, Zero-day exploit, Configuration issue..."
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Additional Context</label>
              <textarea
                value={aiRequest.context}
                onChange={(e) => setAiRequest(prev => ({...prev, context: e.target.value}))}
                placeholder="Any additional context, affected systems, business impact, compliance requirements..."
                className="input-field w-full h-20 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Priority Level</label>
              <select
                value={aiRequest.priority}
                onChange={(e) => setAiRequest(prev => ({...prev, priority: e.target.value}))}
                className="input-field w-full"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-soc-dark-700">
          <button 
            onClick={onClose} 
            className="btn-secondary"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button 
            onClick={handleGenerate} 
            className="btn-primary flex items-center space-x-2"
            disabled={isGenerating || !isFormValid}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                <span>Generate Playbook</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIGeneratorModal;