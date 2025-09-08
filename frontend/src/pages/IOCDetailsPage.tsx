import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Globe, 
  Link, 
  Hash, 
  Mail, 
  FileText, 
  AlertTriangle,
  Eye,
  EyeOff,
  Clock,
  SearchIcon,
  Bot,
  Loader2,
  Sparkles
} from 'lucide-react';
import threatIntelService, { IOC } from '../services/threatIntelService';
import RecordId from '../components/common/RecordId';
import TestDataChip from '../components/common/TestDataChip';
import toastNotificationService from '../services/toastNotificationService';

const IOCDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [ioc, setIOC] = useState<IOC | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingAIHunt, setIsGeneratingAIHunt] = useState(false);

  // Load IOC data
  useEffect(() => {
    const loadIOC = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await threatIntelService.getIOC(id);
        setIOC(response.ioc);
      } catch (err: any) {
        console.error('Failed to load IOC:', err);
        setError(err.message || 'Failed to load IOC details');
      } finally {
        setLoading(false);
      }
    };

    loadIOC();
  }, [id]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ip': return <Globe className="h-5 w-5" />;
      case 'domain': return <Link className="h-5 w-5" />;
      case 'url': return <Link className="h-5 w-5" />;
      case 'file_hash': return <Hash className="h-5 w-5" />;
      case 'email': return <Mail className="h-5 w-5" />;
      case 'registry_key': return <FileText className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 5: return 'text-red-400 bg-red-500/20';
      case 4: return 'text-orange-400 bg-orange-500/20';
      case 3: return 'text-yellow-400 bg-yellow-500/20';
      case 2: return 'text-blue-400 bg-blue-500/20';
      case 1: return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'very_high': return 'text-green-400 bg-green-500/20';
      case 'high': return 'text-blue-400 bg-blue-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  const handleToggleStatus = async () => {
    if (!ioc) return;
    
    try {
      if (ioc.isActive) {
        await threatIntelService.deactivateIOC(ioc.id);
      } else {
        await threatIntelService.updateIOC(ioc.id, { isActive: true });
      }
      
      // Refresh IOC data
      const response = await threatIntelService.getIOC(ioc.id);
      setIOC(response.ioc);
      
      toastNotificationService.showNotification({
        title: '✅ IOC Updated',
        body: `IOC ${ioc.isActive ? 'deactivated' : 'activated'} successfully`
      });
    } catch (err: any) {
      console.error('Failed to toggle IOC status:', err);
      toastNotificationService.showNotification({
        title: '❌ Update Failed',
        body: 'Failed to update IOC status'
      });
    }
  };

  const handleCreateHunt = () => {
    if (!ioc) return;
    navigate(`/threat-hunting/create?sourceType=ioc&sourceId=${ioc.id}`);
  };

  const handleCreateAIHunt = async () => {
    if (!ioc) return;
    
    try {
      setIsGeneratingAIHunt(true);
      
      toastNotificationService.showNotification({
        title: '🤖 AI Hunt Generation',
        body: 'Generating threat hunt suggestions from IOC data...'
      });

      const response = await threatIntelService.generateIOCHunt(ioc.id);
      
      if (response.success && response.suggestions) {
        toastNotificationService.showNotification({
          title: '✅ AI Hunt Generated',
          body: 'Threat hunt created successfully with AI suggestions!'
        });
        
        // Navigate to threat hunt creation page with AI suggestions
        navigate(`/threat-hunting/create?sourceType=ioc&sourceId=${ioc.id}&aiGenerated=true`);
      } else {
        throw new Error(response.error || 'AI hunt generation failed');
      }
    } catch (err: any) {
      console.error('AI hunt generation failed:', err);
      toastNotificationService.showNotification({
        title: '❌ AI Generation Failed',
        body: err.message || 'Failed to generate AI hunt. You can still create a hunt manually.'
      });
      
      // Fall back to manual hunt creation
      handleCreateHunt();
    } finally {
      setIsGeneratingAIHunt(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/threat-intel')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Threat Intelligence</span>
          </button>
        </div>
        
        <div className="card p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-opensoc-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Loading IOC Details</h3>
          <p className="text-slate-400">Please wait while we fetch the IOC information...</p>
        </div>
      </div>
    );
  }

  if (error || !ioc) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/threat-intel')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Threat Intelligence</span>
          </button>
        </div>
        
        <div className="card p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">IOC Not Found</h3>
          <p className="text-slate-400 mb-4">{error || 'The requested IOC could not be found.'}</p>
          <button onClick={() => navigate('/threat-intel')} className="btn-primary">
            Return to Threat Intelligence
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/threat-intel')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Threat Intelligence</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-opensoc-500/20 rounded-lg">
              {getTypeIcon(ioc.type)}
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-2xl font-bold text-white">IOC Details</h1>
                <RecordId type="ioc" id={ioc.id} variant="badge" showPrefix={true} />
                {ioc.isTestData && <TestDataChip />}
              </div>
              <p className="text-sm text-slate-400 font-mono">{ioc.value}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCreateHunt}
            className="btn-secondary flex items-center space-x-2"
            title="Create threat hunt from this IOC"
          >
            <SearchIcon className="h-4 w-4" />
            <span>Create Threat Hunt</span>
          </button>
          
          <button
            onClick={handleCreateAIHunt}
            disabled={isGeneratingAIHunt}
            className="btn-primary flex items-center space-x-2"
            title="Generate AI-powered threat hunt from this IOC"
          >
            {isGeneratingAIHunt ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Bot className="h-4 w-4" />
                <span>Create Threat Hunt by AI</span>
                <Sparkles className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* IOC Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Indicator Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Type:</span>
              <span className="text-white capitalize flex items-center space-x-2">
                {getTypeIcon(ioc.type)}
                <span>{ioc.type.replace('_', ' ')}</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Confidence:</span>
              <span className={`px-2 py-1 rounded text-xs ${getConfidenceColor(ioc.confidence)}`}>
                {ioc.confidence.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Severity:</span>
              <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(ioc.severity)}`}>
                Level {ioc.severity}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Status:</span>
              <span className={ioc.isActive ? 'text-green-400' : 'text-gray-400'}>
                {ioc.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Source:</span>
              <span className="text-white">{ioc.source}</span>
            </div>
          </div>
        </div>

        {/* Timeline Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">First Seen:</span>
              <span className="text-white">{formatDate(ioc.firstSeen)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Last Seen:</span>
              <span className="text-white">{formatDate(ioc.lastSeen)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Created:</span>
              <span className="text-white">{formatDate(ioc.createdAt)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Updated:</span>
              <span className="text-white">{formatDate(ioc.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {ioc.description && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
          <p className="text-slate-300 leading-relaxed">{ioc.description}</p>
        </div>
      )}

      {/* Tags */}
      {ioc.tags && ioc.tags.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {ioc.tags.map((tag, index) => (
              <span key={index} className="px-3 py-1 bg-soc-dark-700 text-slate-300 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* MITRE ATT&CK Techniques */}
      {ioc.mitreAttack && ioc.mitreAttack.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">MITRE ATT&CK Techniques</h3>
          <div className="flex flex-wrap gap-2">
            {ioc.mitreAttack.map((technique, index) => (
              <span key={index} className="px-3 py-1 bg-opensoc-600/20 text-opensoc-300 rounded text-sm font-mono">
                {technique}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Related Campaign */}
      {ioc.relatedCampaign && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Related Campaign</h3>
          <p className="text-opensoc-400">{ioc.relatedCampaign}</p>
        </div>
      )}

      {/* Action Panel */}
      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">IOC Management</h3>
            <p className="text-slate-400 text-sm">Manage the status and actions for this indicator</p>
          </div>
          <button
            onClick={handleToggleStatus}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              ioc.isActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {ioc.isActive ? (
              <>
                <EyeOff className="h-4 w-4 mr-2 inline" />
                Deactivate IOC
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2 inline" />
                Activate IOC
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IOCDetailsPage;