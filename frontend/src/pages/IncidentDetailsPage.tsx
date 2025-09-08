import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Calendar, 
  User, 
  ExternalLink, 
  CheckCircle, 
  Activity, 
  FileText,
  ChevronRight,
  Plus,
  X,
  Eye,
  Sparkles,
  Loader2,
  Bot,
  Wand2,
  Search,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Incident } from '../types';
import incidentService, { AIDraftAdditionalInfoResponse } from '../services/incidentService';
import { useProofReading } from '../hooks/useProofReading';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import { ProofReadSuggestion, ProofReadIndicator, AIDraftIndicator } from '../components/common/ProofReadComponents';
import ThreatHuntCreateFromIncidentModal from '../components/incidents/ThreatHuntCreateFromIncidentModal';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { deleteIncident } from '../store/incidentsAsync';

const IncidentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedAlerts, setRelatedAlerts] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [timelineFormData, setTimelineFormData] = useState({
    type: 'action' as 'alert' | 'action' | 'note' | 'status_change' | 'escalation',
    title: '',
    description: '',
    useCustomDateTime: false,
    customDateTime: ''
  });
  const [showThreatHuntModal, setShowThreatHuntModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Proof reading functionality
  const {
    isProofReading,
    proofReadSuggestions,
    proofReadError,
    showProofReadSuggestions,
    acceptedSuggestions,
    handleProofRead,
    handleAcceptSuggestion,
    handleRejectSuggestion,
    resetProofReading
  } = useProofReading();

  // AI Draft Additional Information state
  const [isDraftingAI, setIsDraftingAI] = useState(false);
  const [aiDraftError, setAiDraftError] = useState<string | null>(null);
  const [aiDraftedFields, setAiDraftedFields] = useState<Set<string>>(new Set());
  const [aiDraftConfidence, setAiDraftConfidence] = useState<number>(0);
  const [showDraftingProgress, setShowDraftingProgress] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string;
    severity: number;
    category: string;
    assignedToName: string;
    responseplan: string;
    impactAssessment: string;
    investigationPlan: string;
    containmentStrategy: string;
    estimatedTimeline: string;
  }>({
    title: '',
    description: '',
    severity: 1,
    category: '',
    assignedToName: '',
    responseplan: '',
    impactAssessment: '',
    investigationPlan: '',
    containmentStrategy: '',
    estimatedTimeline: ''
  });

  // Helper function to safely parse dates
  const safeParseDate = (dateValue: string | Date): Date => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') {
      try {
        return parseISO(dateValue);
      } catch {
        return new Date(dateValue);
      }
    }
    return new Date();
  };

  // Safe date formatting helper
  const safeFormatDistance = (dateValue: string | Date): string => {
    try {
      const parsedDate = safeParseDate(dateValue);
      if (isNaN(parsedDate.getTime())) return 'Unknown';
      return formatDistanceToNow(parsedDate, { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  // Markdown display component for additional information fields
  const MarkdownDisplay: React.FC<{ content: string; fallbackText: string }> = ({ content, fallbackText }) => {
    if (!content || content.trim() === '') {
      return (
        <div className="text-slate-400 bg-soc-dark-900/30 border border-soc-dark-700 rounded p-3 italic">
          {fallbackText}
        </div>
      );
    }

    return (
      <div className="text-slate-300 bg-soc-dark-900/30 border border-soc-dark-700 rounded p-3 prose prose-invert prose-sm max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            // Custom styling for markdown elements to match the dark theme
            h1: ({ children }) => <h1 className="text-lg font-semibold text-white mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-semibold text-white mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-200 mb-1">{children}</h3>,
            p: ({ children }) => <p className="text-slate-300 mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc list-inside text-slate-300 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside text-slate-300 mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="text-slate-300">{children}</li>,
            strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
            em: ({ children }) => <em className="text-slate-200 italic">{children}</em>,
            code: ({ children, className }) => {
              const isInline = !className?.includes('language-');
              return isInline ? (
                <code className="bg-soc-dark-800 text-slate-200 px-1 py-0.5 rounded text-sm">{children}</code>
              ) : (
                <code className={`block bg-soc-dark-800 text-slate-200 p-3 rounded text-sm overflow-x-auto ${className}`}>{children}</code>
              );
            },
            pre: ({ children }) => <pre className="bg-soc-dark-800 rounded p-3 overflow-x-auto mb-2">{children}</pre>,
            blockquote: ({ children }) => <blockquote className="border-l-4 border-slate-600 pl-4 text-slate-400 italic mb-2">{children}</blockquote>,
            a: ({ children, href }) => <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
            table: ({ children }) => <table className="min-w-full border border-slate-600 mb-2">{children}</table>,
            th: ({ children }) => <th className="border border-slate-600 px-2 py-1 bg-soc-dark-800 text-slate-200 font-semibold text-left">{children}</th>,
            td: ({ children }) => <td className="border border-slate-600 px-2 py-1 text-slate-300">{children}</td>,
            hr: () => <hr className="border-slate-600 my-3" />,
            br: () => <br className="block my-1" />
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 5: return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 4: return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 3: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 2: return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 1: return 'text-green-400 bg-green-500/10 border-green-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'investigating': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'contained': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'resolved': return 'text-green-400 bg-green-500/10 border-green-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  useEffect(() => {
    if (id) {
      fetchIncidentDetails(id);
    }
  }, [id]);

  // Update edit form data when incident changes
  useEffect(() => {
    if (incident) {
      setEditFormData({
        title: incident.title || '',
        description: incident.description || '',
        severity: incident.severity || 1,
        category: incident.category || '',
        assignedToName: incident.assignedToName || '',
        responseplan: incident.metadata?.responseplan || '',
        impactAssessment: incident.metadata?.impactAssessment || '',
        investigationPlan: incident.metadata?.investigationPlan || '',
        containmentStrategy: incident.metadata?.containmentStrategy || '',
        estimatedTimeline: incident.metadata?.estimatedTimeline || ''
      });
    }
  }, [incident]);

  const fetchIncidentDetails = async (incidentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const freshIncident = await incidentService.getIncident(incidentId);
      setIncident(freshIncident);
      
      // Extract related alerts if available  
      if ('relatedAlerts' in freshIncident && (freshIncident as any).relatedAlerts) {
        setRelatedAlerts((freshIncident as any).relatedAlerts);
      }
    } catch (err: any) {
      console.error('Failed to fetch incident details:', err);
      let errorMessage = 'Failed to load incident details';
      
      if (err.response?.status === 404) {
        errorMessage = 'Incident not found. Please check the incident ID.';
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many requests. Please try again in a moment.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        errorMessage = 'Network error. Please check your connection and backend server.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: Incident['status']) => {
    if (!incident) return;
    
    try {
      setUpdating(true);
      await incidentService.updateIncident(incident.id, { status: newStatus });
      
      // Update local state
      setIncident({ ...incident, status: newStatus, updatedAt: new Date().toISOString() } as Incident);
    } catch (error) {
      console.error('Failed to update incident status:', error);
      // Could add a toast notification here
    } finally {
      setUpdating(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form data to original values
      if (incident) {
        setEditFormData({
          title: incident.title || '',
          description: incident.description || '',
          severity: incident.severity || 1,
          category: incident.category || '',
          assignedToName: incident.assignedToName || '',
          responseplan: incident.metadata?.responseplan || '',
          impactAssessment: incident.metadata?.impactAssessment || '',
          investigationPlan: incident.metadata?.investigationPlan || '',
          containmentStrategy: incident.metadata?.containmentStrategy || '',
          estimatedTimeline: incident.metadata?.estimatedTimeline || ''
        });
      }
      // Reset proof reading and AI drafting when canceling edit
      resetProofReading();
      setAiDraftedFields(new Set());
      setAiDraftError(null);
      setAiDraftConfidence(0);
      setShowDraftingProgress(false);
    }
    setIsEditing(!isEditing);
  };

  // Handle proof reading for edit form
  const handleEditProofRead = async () => {
    const fieldsToProofRead = {
      responseplan: editFormData.responseplan?.trim() || '',
      impactAssessment: editFormData.impactAssessment?.trim() || '',
      investigationPlan: editFormData.investigationPlan?.trim() || '',
      containmentStrategy: editFormData.containmentStrategy?.trim() || '',
      estimatedTimeline: editFormData.estimatedTimeline?.trim() || ''
    };

    await handleProofRead(fieldsToProofRead);
  };

  // Handle accepting proof reading suggestions in edit form
  const handleEditAcceptSuggestion = (fieldName: string, suggestedText: string) => {
    handleAcceptSuggestion(fieldName, suggestedText, (field, value) => {
      setEditFormData(prev => ({
        ...prev,
        [field]: value
      }));
    });
  };

  // Handle AI Draft Additional Information
  const handleAIDraftAdditionalInfo = async () => {
    if (!incident) return;
    
    setIsDraftingAI(true);
    setAiDraftError(null);
    setShowDraftingProgress(false);

    // Show progress message after 30 seconds
    const progressTimer = setTimeout(() => {
      setShowDraftingProgress(true);
    }, 30000);

    try {
      const response: AIDraftAdditionalInfoResponse = await incidentService.draftAdditionalInformation(incident.id);
      
      if (response.success) {
        // Convert backend field names to frontend camelCase
        const frontendFields: Record<string, string> = {};
        if (response.draftedFields.responseplan) frontendFields.responseplan = response.draftedFields.responseplan;
        if (response.draftedFields.impactassessment) frontendFields.impactAssessment = response.draftedFields.impactassessment;
        if (response.draftedFields.investigationplan) frontendFields.investigationPlan = response.draftedFields.investigationplan;
        if (response.draftedFields.containmentstrategy) frontendFields.containmentStrategy = response.draftedFields.containmentstrategy;
        if (response.draftedFields.estimatedtimeline) frontendFields.estimatedTimeline = response.draftedFields.estimatedtimeline;

        // Update form data with AI-drafted content
        setEditFormData(prev => ({
          ...prev,
          ...frontendFields
        }));

        // Track AI drafted fields
        setAiDraftedFields(new Set(Object.keys(frontendFields)));
        setAiDraftConfidence(response.confidence);
        
        if (Object.keys(frontendFields).length === 0) {
          setAiDraftError('All additional information fields already have content. No new drafts generated.');
        } else {
          setAiDraftError(null);
        }
      } else {
        setAiDraftError(response.error || 'AI drafting failed. Please try again.');
        setAiDraftedFields(new Set());
        setAiDraftConfidence(0);
      }
    } catch (error) {
      console.error('AI drafting error:', error);
      setAiDraftError('AI drafting service is not available. Please try again later.');
      setAiDraftedFields(new Set());
      setAiDraftConfidence(0);
    } finally {
      clearTimeout(progressTimer);
      setIsDraftingAI(false);
      setShowDraftingProgress(false);
    }
  };

  // Helper function to track changes between original and edited incident data
  const trackChanges = (original: Incident, edited: any): string[] => {
    const changes: string[] = [];
    
    // Track basic field changes
    if (original.title.trim() !== edited.title.trim()) {
      changes.push(`Title changed from "${original.title}" to "${edited.title}"`);
    }
    
    if (original.description.trim() !== edited.description.trim()) {
      changes.push(`Description updated`);
    }
    
    if (original.severity !== edited.severity) {
      changes.push(`Severity changed from ${original.severity} to ${edited.severity}`);
    }
    
    if (original.category !== edited.category) {
      changes.push(`Category changed from "${original.category}" to "${edited.category}"`);
    }
    
    // Track assigned user changes
    const originalAssignedName = original.assignedToName || '';
    const editedAssignedName = edited.assignedToName || '';
    if (originalAssignedName.trim() !== editedAssignedName.trim()) {
      if (editedAssignedName.trim()) {
        changes.push(`Assigned to ${editedAssignedName}`);
      } else {
        changes.push(`Assignment removed`);
      }
    }
    
    // Track metadata field changes (additional information)
    const originalMeta = original.metadata || {};
    const editedMeta = edited.metadata || {};
    
    const metaFields = [
      { key: 'responseplan', label: 'Response Plan' },
      { key: 'impactAssessment', label: 'Impact Assessment' },
      { key: 'investigationPlan', label: 'Investigation Plan' },
      { key: 'containmentStrategy', label: 'Containment Strategy' },
      { key: 'estimatedTimeline', label: 'Estimated Timeline' }
    ];
    
    metaFields.forEach(field => {
      const originalValue = (originalMeta[field.key] || '').trim();
      const editedValue = (editedMeta[field.key] || '').trim();
      
      if (originalValue !== editedValue) {
        if (editedValue && !originalValue) {
          changes.push(`${field.label} added`);
        } else if (!editedValue && originalValue) {
          changes.push(`${field.label} removed`);
        } else if (editedValue && originalValue) {
          changes.push(`${field.label} updated`);
        }
      }
    });
    
    return changes;
  };

  const handleEditSave = async () => {
    if (!incident) return;
    
    // Prepare update data including metadata, removing empty strings
    const updateData: any = {
      title: editFormData.title.trim(),
      description: editFormData.description.trim(),
      severity: editFormData.severity,
      category: editFormData.category,
      metadata: {
        ...incident.metadata,
        responseplan: editFormData.responseplan.trim(),
        impactAssessment: editFormData.impactAssessment.trim(),
        investigationPlan: editFormData.investigationPlan.trim(),
        containmentStrategy: editFormData.containmentStrategy.trim(),
        estimatedTimeline: editFormData.estimatedTimeline.trim()
      }
    };
    
    // Handle assignedToName - set to null if empty to avoid validation issues  
    if (editFormData.assignedToName.trim()) {
      updateData.assignedToName = editFormData.assignedToName.trim();
    } else {
      updateData.assignedToName = null;
    }
    
    // Track what changes are being made before updating
    const changes = trackChanges(incident, updateData);
    
    try {
      setUpdating(true);
      
      console.log('Updating incident with data:', updateData);
      await incidentService.updateIncident(incident.id, updateData);
      
      // Create timeline event for the edit if there are changes
      if (changes.length > 0) {
        try {
          await incidentService.addTimelineEvent(incident.id, {
            type: 'action',
            title: 'Incident Updated',
            description: changes.join('; ')
          });
          console.log('Timeline event created for incident edit:', changes);
        } catch (timelineError) {
          console.error('Failed to create timeline event for edit:', timelineError);
          // Don't fail the edit if timeline creation fails
        }
      }
      
      // Update local state
      setIncident({
        ...incident,
        ...updateData,
        updatedAt: new Date().toISOString()
      } as Incident);
      
      // Refresh incident details to show new timeline event
      if (id && changes.length > 0) {
        try {
          await fetchIncidentDetails(id);
        } catch (refreshError) {
          console.error('Failed to refresh incident details:', refreshError);
          // Don't fail if refresh fails
        }
      }
      
      // Exit edit mode
      setIsEditing(false);
      
      console.log('Incident updated successfully');
    } catch (error: any) {
      console.error('Failed to update incident:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestData: updateData
      });
      
      // Show error to user - for now just alert, could add toast later
      alert('Failed to update incident. Please check console for details.');
    } finally {
      setUpdating(false);
    }
  };

  const handleTimelineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident || !timelineFormData.title.trim()) return;

    try {
      setUpdating(true);
      
      // Prepare timeline event data
      const timelineData: any = {
        type: timelineFormData.type,
        title: timelineFormData.title.trim(),
        description: timelineFormData.description.trim() || undefined
      };

      // Include custom timestamp if specified
      if (timelineFormData.useCustomDateTime && timelineFormData.customDateTime) {
        timelineData.timestamp = new Date(timelineFormData.customDateTime).toISOString();
      }

      await incidentService.addTimelineEvent(incident.id, timelineData);

      // Reset form and close modal
      setTimelineFormData({
        type: 'action',
        title: '',
        description: '',
        useCustomDateTime: false,
        customDateTime: ''
      });
      setShowTimelineModal(false);

      // Refresh incident data to show new timeline event
      if (id) {
        fetchIncidentDetails(id);
      }
    } catch (error) {
      console.error('Failed to add timeline event:', error);
      alert('Failed to add timeline event. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleTimelineCancel = () => {
    setTimelineFormData({
      type: 'action',
      title: '',
      description: '',
      useCustomDateTime: false,
      customDateTime: ''
    });
    setShowTimelineModal(false);
  };

  const handleThreatHuntSuccess = (hunt: any) => {
    console.log('Threat hunt created successfully:', hunt);
    setShowThreatHuntModal(false);
    
    // Navigate to the threat hunting page to show the new hunt
    navigate('/threat-hunting');
  };

  const handleDeleteIncident = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!incident?.id) return;

    try {
      setIsDeleting(true);
      await dispatch(deleteIncident(incident.id)).unwrap();
      navigate('/incidents'); // Navigate back to incidents list
    } catch (error) {
      console.error('Error deleting incident:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Loading Incident...</h1>
          </div>
          <button
            onClick={() => navigate('/incidents')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Incidents</span>
          </button>
        </div>
        
        <div className="card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-opensoc-400 mx-auto"></div>
          <p className="text-slate-400 mt-2">Loading incident details...</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Incident Not Found</h1>
          </div>
          <button
            onClick={() => navigate('/incidents')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Incidents</span>
          </button>
        </div>
        
        <div className="card p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Incident Not Found</h3>
          <p className="text-slate-400">{error || 'The requested incident could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg overflow-hidden">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between p-4 border-b border-soc-dark-700 bg-soc-dark-950">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/incidents')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <nav className="text-sm">
              <span className="text-slate-400">Dashboard</span>
              <ChevronRight className="h-4 w-4 mx-2 inline text-slate-500" />
              <button 
                onClick={() => navigate('/incidents')}
                className="text-opensoc-400 hover:text-opensoc-300"
              >
                Incidents
              </button>
              <ChevronRight className="h-4 w-4 mx-2 inline text-slate-500" />
              <span className="text-white">Incident Details</span>
            </nav>
          </div>
          
          <button
            onClick={() => navigate('/incidents')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Incidents</span>
          </button>
        </div>

        {/* Main Header */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">{incident.title}</h2>
              <div className="flex items-center space-x-4 mt-1">
                <span className={`text-xs px-2 py-1 rounded border ${getSeverityColor(incident.severity)}`}>
                  Severity {incident.severity}
                </span>
                <select
                  value={incident.status}
                  onChange={(e) => handleStatusChange(e.target.value as Incident['status'])}
                  disabled={updating}
                  className={`text-xs px-2 py-1 rounded border ${getStatusColor(incident.status)} ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                >
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="contained">Contained</option>
                  <option value="resolved">Resolved</option>
                </select>
                {incident.category && (
                  <span className="text-xs text-slate-400 bg-slate-500/10 border border-slate-500/30 px-2 py-1 rounded">
                    {incident.category.replace('_', ' ').toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-1">Incident ID: {incident.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Incident Details */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-white">Incident Details</h3>
        </div>
        
        <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-4 space-y-4">
          {/* Title - Editable */}
          <div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-300">Title</label>
              {isEditing && <ProofReadIndicator field="title" acceptedSuggestions={acceptedSuggestions} />}
            </div>
            <div className="mt-1">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="w-full bg-soc-dark-900 border border-soc-dark-700 rounded px-3 py-2 text-white"
                  />
                  <ProofReadSuggestion 
                    field="title" 
                    suggestion={proofReadSuggestions.title}
                    onAccept={handleEditAcceptSuggestion}
                    onReject={handleRejectSuggestion}
                    showSuggestions={showProofReadSuggestions}
                  />
                </>
              ) : (
                <span className="text-white font-medium">{incident.title}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Severity - Editable */}
            <div>
              <label className="text-sm font-medium text-slate-300">Severity</label>
              <div className="mt-1">
                {isEditing ? (
                  <select
                    value={editFormData.severity}
                    onChange={(e) => setEditFormData({...editFormData, severity: Number(e.target.value)})}
                    className="w-full bg-soc-dark-900 border border-soc-dark-700 rounded px-3 py-2 text-white"
                  >
                    {[1,2,3,4,5].map(num => (
                      <option key={num} value={num}>Severity {num}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(incident.severity)}`}>
                    Severity {incident.severity}
                  </span>
                )}
              </div>
            </div>

            {/* Category - Editable */}
            <div>
              <label className="text-sm font-medium text-slate-300">Category</label>
              <div className="mt-1">
                {isEditing ? (
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                    className="w-full bg-soc-dark-900 border border-soc-dark-700 rounded px-3 py-2 text-white"
                  >
                    <option value="">Select Category</option>
                    <option value="malware">Malware</option>
                    <option value="intrusion">Intrusion</option>
                    <option value="data_breach">Data Breach</option>
                    <option value="policy_violation">Policy Violation</option>
                    <option value="insider_threat">Insider Threat</option>
                  </select>
                ) : (
                  <span className="text-white capitalize">{incident.category?.replace('_', ' ') || 'Uncategorized'}</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300">Created</label>
              <div className="flex items-center space-x-2 text-slate-400 mt-1">
                <Calendar className="h-4 w-4" />
                <span>{safeFormatDistance(incident.createdAt)}</span>
              </div>
            </div>

            {/* Assigned To - Editable */}
            <div>
              <label className="text-sm font-medium text-slate-300">Assigned To</label>
              <div className="mt-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.assignedToName}
                    onChange={(e) => setEditFormData({...editFormData, assignedToName: e.target.value})}
                    placeholder="Enter assignee name"
                    className="w-full bg-soc-dark-900 border border-soc-dark-700 rounded px-3 py-2 text-white"
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-slate-400">
                    <User className="h-4 w-4" />
                    <span>{incident.assignedToName || 'Unassigned'}</span>
                  </div>
                )}
              </div>
            </div>

            {incident.resolvedAt && (
              <div>
                <label className="text-sm font-medium text-slate-300">Resolved</label>
                <div className="flex items-center space-x-2 text-slate-400 mt-1">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>{safeFormatDistance(incident.resolvedAt)}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-300">Alert Count</label>
              <div className="flex items-center space-x-2 text-slate-400 mt-1">
                <AlertTriangle className="h-4 w-4" />
                <span>{incident.alertCount || 0} alert{incident.alertCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Description - Editable */}
          <div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-300">Description</label>
              {isEditing && <ProofReadIndicator field="description" acceptedSuggestions={acceptedSuggestions} />}
            </div>
            <div className="mt-1">
              {isEditing ? (
                <>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    rows={4}
                    className="w-full bg-soc-dark-900 border border-soc-dark-700 rounded px-3 py-2 text-slate-300 leading-relaxed resize-none"
                    placeholder="Enter incident description"
                  />
                  <ProofReadSuggestion 
                    field="description" 
                    suggestion={proofReadSuggestions.description}
                    onAccept={handleEditAcceptSuggestion}
                    onReject={handleRejectSuggestion}
                    showSuggestions={showProofReadSuggestions}
                  />
                </>
              ) : (
                <div className="text-slate-400 whitespace-pre-wrap bg-soc-dark-900/30 border border-soc-dark-700 rounded p-3">
                  {incident.description || 'No description provided'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Enhanced Related Alerts */}
          {relatedAlerts.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white flex items-center space-x-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span>Related Alerts ({relatedAlerts.length})</span>
              </h3>
              
              <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-4 space-y-3">
                {relatedAlerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-4 hover:bg-soc-dark-750 transition-colors cursor-pointer"
                    onClick={() => navigate(`/alerts/${alert.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-white hover:text-opensoc-400">
                            {alert.title}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded border ${getSeverityColor(alert.severity)}`}>
                            Severity {alert.severity}
                          </span>
                          <span className="text-xs text-slate-400 bg-slate-500/10 border border-slate-500/30 px-2 py-1 rounded">
                            {alert.status?.toUpperCase()}
                          </span>
                        </div>
                        
                        {alert.description && (
                          <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                            {alert.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                          <span>{alert.sourceSystem}</span>
                          {alert.assetName && <span>Asset: {alert.assetName}</span>}
                          <span>{safeFormatDistance(alert.eventTime)}</span>
                        </div>
                      </div>
                      
                      <ExternalLink className="h-4 w-4 text-slate-400 flex-shrink-0 ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Metadata */}
          {incident.metadata && Object.keys(incident.metadata).length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white flex items-center space-x-2 mb-3">
                <FileText className="h-5 w-5 text-blue-400" />
                <span>Additional Information</span>
              </h3>
              
              <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-4 space-y-4">
                {/* Response Plan - Editable */}
                <div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-slate-300">Response Plan</label>
                    {isEditing && <ProofReadIndicator field="responseplan" acceptedSuggestions={acceptedSuggestions} />}
                    {isEditing && <AIDraftIndicator field="responseplan" aiDraftedFields={aiDraftedFields} />}
                  </div>
                  <div className="mt-1">
                    {isEditing ? (
                      <>
                        <textarea
                          value={editFormData.responseplan}
                          onChange={(e) => setEditFormData({...editFormData, responseplan: e.target.value})}
                          rows={3}
                          className="w-full bg-soc-dark-900 border border-soc-dark-700 rounded px-3 py-2 text-slate-300 leading-relaxed resize-none"
                          placeholder="Enter response plan"
                        />
                        <ProofReadSuggestion 
                          field="responseplan" 
                          suggestion={proofReadSuggestions.responseplan}
                          onAccept={handleEditAcceptSuggestion}
                          onReject={handleRejectSuggestion}
                          showSuggestions={showProofReadSuggestions}
                        />
                      </>
                    ) : (
                      <MarkdownDisplay 
                        content={incident.metadata?.responseplan || ''} 
                        fallbackText="No response plan defined" 
                      />
                    )}
                  </div>
                </div>
                
                {/* Impact Assessment - Editable */}
                <div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-slate-300">Impact Assessment</label>
                    {isEditing && <ProofReadIndicator field="impactAssessment" acceptedSuggestions={acceptedSuggestions} />}
                    {isEditing && <AIDraftIndicator field="impactAssessment" aiDraftedFields={aiDraftedFields} />}
                  </div>
                  <div className="mt-1">
                    {isEditing ? (
                      <>
                        <textarea
                          value={editFormData.impactAssessment}
                          onChange={(e) => setEditFormData({...editFormData, impactAssessment: e.target.value})}
                          rows={3}
                          className="w-full bg-soc-dark-900 border border-soc-dark-700 rounded px-3 py-2 text-slate-300 leading-relaxed resize-none"
                          placeholder="Enter impact assessment"
                        />
                        <ProofReadSuggestion 
                          field="impactAssessment" 
                          suggestion={proofReadSuggestions.impactAssessment}
                          onAccept={handleEditAcceptSuggestion}
                          onReject={handleRejectSuggestion}
                          showSuggestions={showProofReadSuggestions}
                        />
                      </>
                    ) : (
                      <MarkdownDisplay 
                        content={incident.metadata?.impactAssessment || ''} 
                        fallbackText="No impact assessment provided" 
                      />
                    )}
                  </div>
                </div>
                
                {/* Investigation Plan - Editable */}
                <div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-slate-300">Investigation Plan</label>
                    {isEditing && <ProofReadIndicator field="investigationPlan" acceptedSuggestions={acceptedSuggestions} />}
                    {isEditing && <AIDraftIndicator field="investigationPlan" aiDraftedFields={aiDraftedFields} />}
                  </div>
                  <div className="mt-1">
                    {isEditing ? (
                      <>
                        <textarea
                          value={editFormData.investigationPlan}
                          onChange={(e) => setEditFormData({...editFormData, investigationPlan: e.target.value})}
                          rows={3}
                          className="w-full bg-soc-dark-900 border border-soc-dark-700 rounded px-3 py-2 text-slate-300 leading-relaxed resize-none"
                          placeholder="Enter investigation plan"
                        />
                        <ProofReadSuggestion 
                          field="investigationPlan" 
                          suggestion={proofReadSuggestions.investigationPlan}
                          onAccept={handleEditAcceptSuggestion}
                          onReject={handleRejectSuggestion}
                          showSuggestions={showProofReadSuggestions}
                        />
                      </>
                    ) : (
                      <MarkdownDisplay 
                        content={incident.metadata?.investigationPlan || ''} 
                        fallbackText="No investigation plan defined" 
                      />
                    )}
                  </div>
                </div>
                
                {/* Containment Strategy - Editable */}
                <div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-slate-300">Containment Strategy</label>
                    {isEditing && <ProofReadIndicator field="containmentStrategy" acceptedSuggestions={acceptedSuggestions} />}
                    {isEditing && <AIDraftIndicator field="containmentStrategy" aiDraftedFields={aiDraftedFields} />}
                  </div>
                  <div className="mt-1">
                    {isEditing ? (
                      <>
                        <textarea
                          value={editFormData.containmentStrategy}
                          onChange={(e) => setEditFormData({...editFormData, containmentStrategy: e.target.value})}
                          rows={3}
                          className="w-full bg-soc-dark-900 border border-soc-dark-700 rounded px-3 py-2 text-slate-300 leading-relaxed resize-none"
                          placeholder="Enter containment strategy"
                        />
                        <ProofReadSuggestion 
                          field="containmentStrategy" 
                          suggestion={proofReadSuggestions.containmentStrategy}
                          onAccept={handleEditAcceptSuggestion}
                          onReject={handleRejectSuggestion}
                          showSuggestions={showProofReadSuggestions}
                        />
                      </>
                    ) : (
                      <MarkdownDisplay 
                        content={incident.metadata?.containmentStrategy || ''} 
                        fallbackText="No containment strategy defined" 
                      />
                    )}
                  </div>
                </div>
                
                {/* Estimated Timeline - Editable */}
                <div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-slate-300">Estimated Timeline</label>
                    {isEditing && <ProofReadIndicator field="estimatedTimeline" acceptedSuggestions={acceptedSuggestions} />}
                    {isEditing && <AIDraftIndicator field="estimatedTimeline" aiDraftedFields={aiDraftedFields} />}
                  </div>
                  <div className="mt-1">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editFormData.estimatedTimeline}
                          onChange={(e) => setEditFormData({...editFormData, estimatedTimeline: e.target.value})}
                          className="w-full bg-soc-dark-900 border border-soc-dark-700 rounded px-3 py-2 text-white"
                          placeholder="Enter estimated timeline"
                        />
                        <ProofReadSuggestion 
                          field="estimatedTimeline" 
                          suggestion={proofReadSuggestions.estimatedTimeline}
                          onAccept={handleEditAcceptSuggestion}
                          onReject={handleRejectSuggestion}
                          showSuggestions={showProofReadSuggestions}
                        />
                      </>
                    ) : (
                      <MarkdownDisplay 
                        content={incident.metadata?.estimatedTimeline || ''} 
                        fallbackText="No timeline estimate provided" 
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Timeline Events */}
          <div>
            <div className="mb-3">
              <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-400" />
                <span>Timeline</span>
              </h3>
            </div>
            
            <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-4">
              {incident.timeline && incident.timeline.length > 0 ? (
                <div className="space-y-3">
                  {incident.timeline.map((event: any, index: number) => (
                    <div key={event.id || index} className="flex space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 bg-opensoc-400 rounded-full"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-white">{event.title}</h4>
                          <span className="text-xs text-slate-500">
                            {safeFormatDistance(event.timestamp)}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-slate-400 mt-1">{event.description}</p>
                        )}
                        {event.userName && (
                          <p className="text-xs text-slate-500 mt-1">by {event.userName}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-4">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                  <p>No timeline events yet.</p>
                  <p className="text-xs mt-1">Add the first timeline entry to track incident progress.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">Actions</h3>
            <div className="space-y-3">
              {!isEditing ? (
                <button 
                  onClick={handleEditToggle}
                  className="btn-secondary w-full flex items-center justify-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>Edit Incident</span>
                </button>
              ) : (
                <div className="bg-soc-dark-900/50 border border-opensoc-500/20 rounded-lg p-3 space-y-3">
                  <p className="text-opensoc-400 text-sm text-center">Edit Mode Active</p>
                  
                  {/* Proof Reading Controls */}
                  <div className="space-y-2">
                    <button
                      onClick={handleEditProofRead}
                      disabled={isProofReading || updating}
                      className="btn-secondary w-full flex items-center justify-center space-x-2 text-sm py-2"
                    >
                      {isProofReading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Proofreading...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Proof Read</span>
                        </>
                      )}
                    </button>

                    {Object.keys(proofReadSuggestions).length > 0 && (
                      <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded px-2 py-1 text-center">
                        {Object.keys(proofReadSuggestions).length} suggestions available
                      </div>
                    )}

                    {proofReadError && (
                      <div className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-1 text-center">
                        {proofReadError}
                      </div>
                    )}
                  </div>

                  {/* AI Draft Additional Information Controls */}
                  <div className="space-y-2">
                    <button
                      onClick={handleAIDraftAdditionalInfo}
                      disabled={isDraftingAI || updating}
                      className="btn-secondary w-full flex items-center justify-center space-x-2 text-sm py-2 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 text-purple-300"
                    >
                      {isDraftingAI ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>AI Drafting... (up to 2-3 minutes)</span>
                        </>
                      ) : (
                        <>
                          <Bot className="h-4 w-4" />
                          <span>AI Draft Additional Info</span>
                        </>
                      )}
                    </button>

                    {aiDraftedFields.size > 0 && (
                      <div className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded px-2 py-1 text-center">
                        {aiDraftedFields.size} field{aiDraftedFields.size !== 1 ? 's' : ''} drafted
                        {aiDraftConfidence > 0 && ` (${aiDraftConfidence}% confidence)`}
                      </div>
                    )}

                    {showDraftingProgress && isDraftingAI && (
                      <div className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1 text-center">
                        AI is analyzing incident context and generating comprehensive drafts. This may take 2-3 minutes for complex incidents.
                      </div>
                    )}

                    {aiDraftError && (
                      <div className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded px-2 py-1 text-center">
                        {aiDraftError}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={handleEditSave}
                      disabled={updating}
                      className="btn-primary flex-1 text-sm py-2 disabled:opacity-50"
                    >
                      {updating ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="btn-secondary flex-1 text-sm py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => setShowTimelineModal(true)}
                disabled={isEditing}
                className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>Add Timeline Entry</span>
              </button>

              <button 
                onClick={() => setShowThreatHuntModal(true)}
                disabled={isEditing}
                className="btn-secondary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                <span>Create Threat Hunt</span>
              </button>

              <button 
                onClick={handleDeleteIncident}
                disabled={isEditing}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Incident</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(incident.status)}`}>
                  {incident.status?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Severity</span>
                <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(incident.severity)}`}>
                  Level {incident.severity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Alerts</span>
                <span className="text-white">{incident.alertCount || 0}</span>
              </div>
              {incident.category && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Category</span>
                  <span className="text-white capitalize">{incident.category.replace('_', ' ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Creation Modal */}
      {showTimelineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-soc-dark-700">
              <h3 className="text-lg font-medium text-white">Add Timeline Entry</h3>
              <button
                onClick={handleTimelineCancel}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleTimelineSubmit} className="p-4 space-y-4">
              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Event Type
                </label>
                <select
                  value={timelineFormData.type}
                  onChange={(e) => setTimelineFormData({
                    ...timelineFormData,
                    type: e.target.value as 'alert' | 'action' | 'note' | 'status_change' | 'escalation'
                  })}
                  className="w-full bg-soc-dark-800 border border-soc-dark-700 rounded px-3 py-2 text-white"
                >
                  <option value="action">Action Taken</option>
                  <option value="note">Note/Observation</option>
                  <option value="status_change">Status Change</option>
                  <option value="alert">Alert</option>
                  <option value="escalation">Escalation</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={timelineFormData.title}
                  onChange={(e) => setTimelineFormData({
                    ...timelineFormData,
                    title: e.target.value
                  })}
                  className="w-full bg-soc-dark-800 border border-soc-dark-700 rounded px-3 py-2 text-white"
                  placeholder="Enter a brief title for this timeline entry"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={timelineFormData.description}
                  onChange={(e) => setTimelineFormData({
                    ...timelineFormData,
                    description: e.target.value
                  })}
                  rows={3}
                  className="w-full bg-soc-dark-800 border border-soc-dark-700 rounded px-3 py-2 text-white resize-none"
                  placeholder="Enter detailed description (optional)"
                />
              </div>

              {/* Date/Time Selection */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    id="useCustomDateTime"
                    checked={timelineFormData.useCustomDateTime}
                    onChange={(e) => {
                      const useCustom = e.target.checked;
                      setTimelineFormData({
                        ...timelineFormData,
                        useCustomDateTime: useCustom,
                        customDateTime: useCustom ? new Date().toISOString().slice(0, 16) : ''
                      });
                    }}
                    className="w-4 h-4 text-blue-400 bg-soc-dark-800 border-soc-dark-700 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="useCustomDateTime" className="text-sm font-medium text-slate-300">
                    Use custom date/time
                  </label>
                </div>
                
                {timelineFormData.useCustomDateTime && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={timelineFormData.customDateTime}
                      onChange={(e) => setTimelineFormData({
                        ...timelineFormData,
                        customDateTime: e.target.value
                      })}
                      max={new Date().toISOString().slice(0, 16)}
                      className="w-full bg-soc-dark-800 border border-soc-dark-700 rounded px-3 py-2 text-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {!timelineFormData.useCustomDateTime && "Defaults to current time"}
                      {timelineFormData.useCustomDateTime && "Cannot be set to future date/time"}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handleTimelineCancel}
                  className="btn-secondary"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center space-x-2"
                  disabled={updating || !timelineFormData.title.trim()}
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Add Entry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Threat Hunt Creation Modal */}
      {incident && (
        <ThreatHuntCreateFromIncidentModal
          isOpen={showThreatHuntModal}
          onClose={() => setShowThreatHuntModal(false)}
          onSuccess={handleThreatHuntSuccess}
          incident={incident}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Incident"
        message={`Are you sure you want to delete incident "${incident?.title || 'Unknown'}"? This action cannot be undone.`}
        confirmText={incident?.title || ''}
        dangerLevel="high"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default IncidentDetailsPage;