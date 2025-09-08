import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Bot, 
  Zap, 
  User,
  ExternalLink
} from 'lucide-react';
import { Alert, AlertTimelineEvent } from '../types';
import IncidentVerificationSimple from '../components/alerts/IncidentVerificationSimple';
import EventTagsComponent from '../components/alerts/EventTagsComponent';
import AlertPlaybookGenerator from '../components/alerts/AlertPlaybookGenerator';
import MitreAlertAnalysis from '../components/mitre/MitreAlertAnalysis';
import AlertHeaderAndInfo from '../components/alerts/AlertHeaderAndInfo';
import AIAnalysisDisplay from '../components/alerts/AIAnalysisDisplay';
import AIVerificationFeedback from '../components/alerts/AIVerificationFeedback';
import AlertSidebarActions from '../components/alerts/AlertSidebarActions';
import AlertTimeline from '../components/alerts/AlertTimeline';
import AlertModals from '../components/alerts/AlertModals';
import OrchestrationModal from '../components/alerts/OrchestrationModal';
import OrchestrationResults from '../components/alerts/OrchestrationResults';
import { AlertLoadingState, AlertErrorState } from '../components/alerts/AlertStateComponents';
import { safeParseDate, safeFormatDistance } from '../utils/alertUtils';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchAlert, deleteAlert } from '../store/alertsAsync';
import { getSecurityEventTypeInfo } from '../utils/securityEventTypes';
import type { EventTag } from '../types';
import { useAlertData } from '../hooks/useAlertData';
import { useAIAnalysisHandlers } from '../hooks/useAIAnalysisHandlers';
import { useAlertFormManagement } from '../hooks/useAlertFormManagement';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';

const AlertDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Delete functionality state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Use custom hook for data loading and state management
  const {
    alert,
    loading,
    error,
    timeline,
    timelineLoading,
    aiAnalysis,
    aiClassification,
    mitreAnalysis,
    relatedIncidents,
    loadAlertDetails,
    loadTimeline,
    loadRelatedIncidents,
    refreshAlertData,
    setAlert
  } = useAlertData(id);
  
  // Use custom hook for AI analysis handlers
  const {
    aiLoading,
    aiError,
    aiProgress,
    aiClassificationLoading,
    aiClassificationError,
    mitreAnalysisLoading,
    mitreAnalysisError,
    immediatePlaybookLoading,
    investigationPlaybookLoading,
    playbookError,
    playbookRefreshTrigger,
    handleAnalyzeAlert,
    handleAIClassification,
    handleMitreAnalysis,
    handleGenerateImmediatePlaybook,
    handleGenerateInvestigationPlaybook,
    handleTagsUpdate,
    setAiAnalysis,
    setAiClassification,
    setMitreAnalysis,
    setAlert: setAlertFromAI,
    setPlaybookRefreshTrigger,
    setAiError,
    setAiClassificationError,
    setMitreAnalysisError,
    setPlaybookError
  } = useAIAnalysisHandlers(alert, { loadAlertDetails, loadTimeline }, { setParentAlert: setAlert });
  
  // Use custom hook for alert form management
  const {
    isEditing,
    updating,
    showResolveModal,
    incidentCreationSuccess,
    editFormData,
    resolveFormData,
    handleStatusChange,
    handleIncidentCreated,
    handleResolveSubmit,
    handleEditToggle,
    handleEditSave,
    setEditFormData,
    setResolveFormData,
    setShowResolveModal,
    setIncidentCreationSuccess,
    getSeverityColor,
    getStatusColor
  } = useAlertFormManagement(alert, id, { setAlert, loadTimeline, loadRelatedIncidents });
  
  // UI state
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showOneClickAnalysisModal, setShowOneClickAnalysisModal] = useState(false);
  const [showOrchestrationModal, setShowOrchestrationModal] = useState(false);
  const [showOrchestrationMCPModal, setShowOrchestrationMCPModal] = useState(false);
  const [orchestrationProtocol, setOrchestrationProtocol] = useState<'api' | 'mcp'>('api');

  // Orchestration state
  const [orchestrationLoading, setOrchestrationLoading] = useState(false);
  const [orchestrationError, setOrchestrationError] = useState<string | null>(null);
  const [orchestrationResult, setOrchestrationResult] = useState<any>(null);
  
  // MCP Orchestration state
  const [orchestrationMCPLoading, setOrchestrationMCPLoading] = useState(false);
  const [orchestrationMCPError, setOrchestrationMCPError] = useState<string | null>(null);
  const [orchestrationMCPResult, setOrchestrationMCPResult] = useState<any>(null);
  
  // Orchestration refresh trigger for results component
  const [orchestrationRefreshTrigger, setOrchestrationRefreshTrigger] = useState(0);

  const handleOneClickAnalysisComplete = async (updatedAlert: Alert) => {
    console.log('✅ One Click Analysis completed, updating alert state');
    setAlert(updatedAlert);
    // Keep modal open to show completion summary and time saved analysis
    // setShowOneClickAnalysisModal(false); // Removed - let user close manually after reviewing results
    
    // Update individual analysis states if they were updated
    if (updatedAlert.aiAnalysis) {
      setAiAnalysis(updatedAlert.aiAnalysis);
    }
    if (updatedAlert.aiClassification) {
      setAiClassification(updatedAlert.aiClassification);
    }
    if (updatedAlert.mitreAnalysis) {
      setMitreAnalysis(updatedAlert.mitreAnalysis);
    }
    
    // Refresh timeline to show all new analysis events (critical fix!)
    await loadTimeline(updatedAlert.id);
    
    // Refresh the alert data from Redux store
    if (id) {
      dispatch(fetchAlert(id));
    }
  };

  const handleOrchestrationAnalysis = async () => {
    setOrchestrationLoading(true);
    setOrchestrationError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/alerts/${alert.id}/orchestration`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrchestrationResult(data.orchestrationResult);
        await loadTimeline(alert.id); // Refresh timeline
        
        // Trigger orchestration results refresh
        console.log('🔄 Triggering orchestration results refresh after API orchestration success');
        setOrchestrationRefreshTrigger(prev => prev + 1);
      } else {
        setOrchestrationError(data.error || 'Orchestration analysis failed');
      }
    } catch (error) {
      console.error('Orchestration error:', error);
      setOrchestrationError('Failed to connect to orchestration service');
    } finally {
      setOrchestrationLoading(false);
    }
  };

  const handleMCPOrchestrationAnalysis = async () => {
    setOrchestrationMCPLoading(true);
    setOrchestrationMCPError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/alerts/${alert.id}/orchestration-mcp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrchestrationMCPResult(data.orchestrationResult);
        await loadTimeline(alert.id); // Refresh timeline
        
        // Trigger orchestration results refresh
        console.log('🔄 Triggering orchestration results refresh after MCP orchestration success');
        setOrchestrationRefreshTrigger(prev => prev + 1);
      } else {
        setOrchestrationMCPError(data.error || 'MCP orchestration analysis failed');
      }
    } catch (error) {
      console.error('MCP Orchestration error:', error);
      setOrchestrationMCPError('Failed to connect to MCP orchestration service');
    } finally {
      setOrchestrationMCPLoading(false);
    }
  };

  const handleOrchestrationComplete = (result: any) => {
    setOrchestrationResult(result);
    // Refresh timeline to show orchestration events
    loadTimeline(alert.id);
    
    // Trigger orchestration results refresh
    console.log('🔄 Triggering orchestration results refresh after API orchestration completion via WebSocket');
    setOrchestrationRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteTimelineEvent = async (eventId: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/alerts/${alert.id}/timeline/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Refresh timeline to remove deleted event
        await loadTimeline(alert.id);
      } else {
        throw new Error(data.error || 'Failed to delete timeline event');
      }
    } catch (error) {
      console.error('Failed to delete timeline event:', error);
      // You could add a toast notification here for better UX
      throw error;
    }
  };

  const handleDeleteAlert = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      await dispatch(deleteAlert(id)).unwrap();
      navigate('/alerts'); // Navigate back to alerts list
    } catch (error) {
      console.error('Error deleting alert:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  if (loading) {
    return <AlertLoadingState />;
  }

  if (error || !alert) {
    return <AlertErrorState error={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Alert Header and Basic Information */}
      <AlertHeaderAndInfo
        alert={alert}
        isEditing={isEditing}
        updating={updating}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        handleStatusChange={handleStatusChange}
        handleEditSave={handleEditSave}
        handleEditToggle={handleEditToggle}
        getSeverityColor={getSeverityColor}
        getStatusColor={getStatusColor}
        safeParseDate={safeParseDate}
        safeFormatDistance={safeFormatDistance}
        incidentCreationSuccess={incidentCreationSuccess}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* AI Analysis Display Component */}
          <AIAnalysisDisplay
            alert={alert}
            aiAnalysis={aiAnalysis}
            aiClassification={aiClassification}
            aiLoading={aiLoading}
            aiError={aiError}
            aiProgress={aiProgress}
            setAiError={setAiError}
          />

          {/* AI Verification Feedback Section */}
          <AIVerificationFeedback
            alert={alert}
            onFeedbackSubmit={async (feedbackData) => {
              try {
                const { alertService } = await import('../services/alertService');
                await alertService.submitAIFeedback(alert.id, feedbackData);
                // Refresh alert data to show updated feedback
                await loadAlertDetails(alert.id);
                // Success feedback to user
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                notification.textContent = '✅ Classification feedback submitted successfully';
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 3000);
              } catch (error) {
                console.error('Failed to submit AI feedback:', error);
                // Error feedback to user
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                notification.textContent = '❌ Failed to submit feedback. Please try again.';
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 3000);
              }
            }}
          />

          {/* MITRE ATT&CK Analysis Section */}
          {(mitreAnalysis || mitreAnalysisLoading) && (
            <MitreAlertAnalysis
              analysisData={mitreAnalysis}
              isLoading={mitreAnalysisLoading}
              alertData={alert ? {
                id: alert.id,
                title: alert.title,
                description: alert.description,
                sourceSystem: alert.sourceSystem,
                assetName: alert.assetName,
                severity: alert.severity,
                rawData: alert.rawData,
                securityEventType: alert.securityEventType
              } : undefined}
            />
          )}

          {/* Orchestration & Automation Section */}
          <div>
            <OrchestrationResults 
              alertId={alert.id}
              refreshTrigger={orchestrationRefreshTrigger}
              onOpenModal={() => setShowOrchestrationModal(true)}
            />
          </div>

          {/* Incident Verification Section */}
          <div>
            <IncidentVerificationSimple 
              alert={alert} 
              onUpdate={() => loadAlertDetails(alert.id)}
            />
          </div>

          {/* Event Tags Section */}
          <div>
            <EventTagsComponent
              tags={alert.eventTags || []}
              confidence={alert.tagsConfidence}
              generatedAt={alert.tagsGeneratedAt}
              isEditable={true}
              onTagsUpdate={handleTagsUpdate}
              loading={aiClassificationLoading}
            />
          </div>

          {/* Alert Playbook Generator Section */}
          <div>
            <AlertPlaybookGenerator
              alert={alert}
              refreshTrigger={playbookRefreshTrigger}
              onPlaybooksGenerated={() => {
                loadAlertDetails(alert.id);
                loadTimeline(alert.id);
              }}
            />
          </div>

          {/* Enhanced Related Incidents */}
          {relatedIncidents.length > 0 && (
            <div>
              <div className="p-6 border-b border-soc-dark-700">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-opensoc-400" />
                  <span>Related Incidents ({relatedIncidents.length})</span>
                </h3>
              </div>
              
              <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-4 space-y-3">
                {relatedIncidents.map((incident: any) => (
                  <div
                    key={incident.id}
                    className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-4 hover:bg-soc-dark-750 transition-colors cursor-pointer"
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-white hover:text-opensoc-400">
                            {incident.title}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded border ${getSeverityColor(incident.severity)}`}>
                            Severity {incident.severity}
                          </span>
                          <span className="text-xs text-slate-400 bg-slate-500/10 border border-slate-500/30 px-2 py-1 rounded">
                            {incident.status?.toUpperCase()}
                          </span>
                        </div>
                        
                        {incident.description && (
                          <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                            {incident.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                          <span>{incident.assignedToName || 'Unassigned'}</span>
                          <span>{safeFormatDistance(incident.createdAt)}</span>
                        </div>
                      </div>
                      
                      <ExternalLink className="h-4 w-4 text-slate-400 flex-shrink-0 ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolve Remarks Section */}
          {alert && alert.resolveRemarks && (
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Resolution Details</h3>
              <div className="bg-soc-dark-800/50 border border-soc-dark-700 rounded-lg p-4 space-y-4">
                {/* Resolution Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {alert.resolveRemarks.autoResolved ? (
                        <Bot className="h-4 w-4 text-opensoc-400" />
                      ) : (
                        <User className="h-4 w-4 text-blue-400" />
                      )}
                      <span className="font-medium text-white">
                        {alert.resolveRemarks.autoResolved ? 'AI Auto-Resolved' : 'Manual Resolution'}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(alert.status)}`}>
                      {alert.resolveRemarks.resolutionType?.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {alert.resolveRemarks.resolvedAt ? safeFormatDistance(alert.resolveRemarks.resolvedAt) : 'Recently'}
                  </span>
                </div>

                {/* Auto-resolution info */}
                {alert.resolveRemarks.autoResolved && alert.resolveRemarks.aiConfidence && (
                  <div className="bg-opensoc-500/10 border border-opensoc-500/30 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="h-4 w-4 text-opensoc-400" />
                      <span className="text-sm font-medium text-opensoc-300">AI Confidence</span>
                      <span className="text-xs bg-opensoc-500/20 text-opensoc-300 px-2 py-1 rounded">
                        {alert.resolveRemarks.aiConfidence}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">
                      This alert was automatically resolved by AI analysis with high confidence.
                    </p>
                  </div>
                )}

                {/* Resolution remarks */}
                {alert.resolveRemarks.remarks && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Resolution Remarks</h4>
                    <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg p-3">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">
                        {alert.resolveRemarks.remarks}
                      </p>
                    </div>
                  </div>
                )}

                {/* Additional reasoning */}
                {alert.resolveRemarks.reasoning && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Additional Reasoning</h4>
                    <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg p-3">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">
                        {alert.resolveRemarks.reasoning}
                      </p>
                    </div>
                  </div>
                )}

                {/* Resolver info */}
                {alert.resolveRemarks.userName && (
                  <div className="text-xs text-slate-500 pt-2 border-t border-soc-dark-700">
                    Resolved by {alert.resolveRemarks.userName} 
                    {alert.resolveRemarks.userEmail && ` (${alert.resolveRemarks.userEmail})`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Raw Event Data */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Raw Event Data</h3>
            <div className="bg-soc-dark-950 border border-soc-dark-700 rounded-lg p-4">
              <pre className="text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(alert.rawData, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Enhanced Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <AlertSidebarActions
            alert={alert}
            isEditing={isEditing}
            updating={updating}
            handleEditToggle={handleEditToggle}
            handleEditSave={handleEditSave}
            setShowIncidentModal={setShowIncidentModal}
            setShowOneClickAnalysisModal={setShowOneClickAnalysisModal}
            handleAIClassification={handleAIClassification}
            handleAnalyzeAlert={handleAnalyzeAlert}
            handleMitreAnalysis={handleMitreAnalysis}
            handleGenerateImmediatePlaybook={handleGenerateImmediatePlaybook}
            handleGenerateInvestigationPlaybook={handleGenerateInvestigationPlaybook}
            handleOrchestrationAnalysis={handleOrchestrationAnalysis}
            handleMCPOrchestrationAnalysis={handleMCPOrchestrationAnalysis}
            setShowOrchestrationModal={setShowOrchestrationModal}
            setShowOrchestrationMCPModal={setShowOrchestrationMCPModal}
            aiClassificationLoading={aiClassificationLoading}
            aiClassificationError={aiClassificationError}
            setAiClassificationError={setAiClassificationError}
            aiLoading={aiLoading}
            aiError={aiError}
            setAiError={setAiError}
            mitreAnalysisLoading={mitreAnalysisLoading}
            mitreAnalysisError={mitreAnalysisError}
            setMitreAnalysisError={setMitreAnalysisError}
            immediatePlaybookLoading={immediatePlaybookLoading}
            investigationPlaybookLoading={investigationPlaybookLoading}
            playbookError={playbookError}
            setPlaybookError={setPlaybookError}
            orchestrationLoading={orchestrationLoading}
            orchestrationError={orchestrationError}
            setOrchestrationError={setOrchestrationError}
            orchestrationMCPLoading={orchestrationMCPLoading}
            orchestrationMCPError={orchestrationMCPError}
            setOrchestrationMCPError={setOrchestrationMCPError}
            onDeleteAlert={handleDeleteAlert}
          />
          {/* Timeline */}
          <AlertTimeline
            timeline={timeline}
            timelineLoading={timelineLoading}
            currentUser={user}
            onDeleteEvent={handleDeleteTimelineEvent}
          />
        </div>
      </div>

      {/* Alert Modals */}
      <AlertModals
        alert={alert}
        showIncidentModal={showIncidentModal}
        setShowIncidentModal={setShowIncidentModal}
        handleIncidentCreated={handleIncidentCreated}
        showOneClickAnalysisModal={showOneClickAnalysisModal}
        setShowOneClickAnalysisModal={setShowOneClickAnalysisModal}
        handleOneClickAnalysisComplete={handleOneClickAnalysisComplete}
        showResolveModal={showResolveModal}
        setShowResolveModal={setShowResolveModal}
        resolveFormData={resolveFormData}
        setResolveFormData={setResolveFormData}
        handleResolveSubmit={handleResolveSubmit}
        updating={updating}
      />

      {/* Orchestration Modal */}
      {/* API Orchestration Modal */}
      <OrchestrationModal
        isOpen={showOrchestrationModal}
        onClose={() => setShowOrchestrationModal(false)}
        alert={alert}
        protocol="api"
        onOrchestrationComplete={handleOrchestrationComplete}
      />
      
      {/* MCP Orchestration Modal */}
      <OrchestrationModal
        isOpen={showOrchestrationMCPModal}
        onClose={() => setShowOrchestrationMCPModal(false)}
        alert={alert}
        protocol="mcp"
        onOrchestrationComplete={(result) => {
          setOrchestrationMCPResult(result);
          loadTimeline(alert.id);
          
          // Trigger orchestration results refresh
          console.log('🔄 Triggering orchestration results refresh after MCP orchestration completion via WebSocket');
          setOrchestrationRefreshTrigger(prev => prev + 1);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Alert"
        message={`Are you sure you want to delete this alert? This action cannot be undone.`}
        confirmText={alert?.title || ''}
        dangerLevel="high"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AlertDetailsPage;
