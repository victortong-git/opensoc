import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  Search, 
  Plus, 
  RefreshCw,
  Eye, 
  Activity,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Filter,
  TrendingUp,
  Shield,
  Target,
  GitBranch,
  MessageSquare,
  Paperclip,
  User,
  Tag,
  ExternalLink,
  Edit3,
  Trash2
} from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { Incident } from '../types';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { fetchIncidents, deleteIncident } from '../store/incidentsAsync';
import { setPagination, setPageSize, setFilters } from '../store/incidentsSlice';
import Pagination from '../components/common/Pagination';
import RowsPerPageSelector from '../components/common/RowsPerPageSelector';
import RecordId from '../components/common/RecordId';
import TestDataChip from '../components/common/TestDataChip';
import IncidentTrendsChart from '../components/dashboard/IncidentTrendsChart';
import IncidentCreateModal from '../components/incidents/IncidentCreateModal';
import IncidentEditModal from '../components/incidents/IncidentEditModal';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import TimeRangeSelector, { TIME_RANGE_OPTIONS } from '../components/common/TimeRangeSelector';
import dashboardService from '../services/dashboardService';

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
const safeFormatDistance = (dateValue: string | Date, options?: { addSuffix?: boolean }): string => {
  try {
    const parsedDate = safeParseDate(dateValue);
    if (isNaN(parsedDate.getTime())) return 'Unknown';
    return formatDistanceToNow(parsedDate, options);
  } catch {
    return 'Unknown';
  }
};

const IncidentsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { incidents, isLoading, pagination, filters } = useSelector((state: RootState) => state.incidents);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'workflow'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'actions' | 'evidence'>('details');
  const [incidentTrends, setIncidentTrends] = useState<any[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [deletingIncident, setDeletingIncident] = useState<Incident | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refresh all incident data
  const handleRefresh = () => {
    dispatch(fetchIncidents({
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      ...filters
    }));
    // Refresh trends data
    const selectedOption = TIME_RANGE_OPTIONS.find(option => option.value === selectedTimeRange);
    const hours = selectedOption?.hours || 24;
    dashboardService.getIncidentTrends(hours).then(response => {
      setIncidentTrends(response.incidentTrends || []);
    }).catch(error => {
      console.error('Failed to refresh incident trends:', error);
    });
  };

  // Load incidents on component mount and when pagination/filters change
  useEffect(() => {
    dispatch(fetchIncidents({
      page: pagination.page,
      limit: pagination.limit,
      ...filters,
    }));
  }, [dispatch, pagination.page, pagination.limit, filters]);

  // Update Redux filters when local filter state changes
  useEffect(() => {
    handleFiltersChange();
  }, [statusFilter, severityFilter, categoryFilter, searchTerm]);

  // Load incident trends
  useEffect(() => {
    const loadIncidentTrends = async () => {
      try {
        setIsLoadingTrends(true);
        const selectedOption = TIME_RANGE_OPTIONS.find(option => option.value === selectedTimeRange);
        const hours = selectedOption?.hours || 24;
        const trendsResponse = await dashboardService.getIncidentTrends(hours);
        setIncidentTrends(trendsResponse.incidentTrends || []);
      } catch (error) {
        console.error('Failed to load incident trends:', error);
      } finally {
        setIsLoadingTrends(false);
      }
    };

    loadIncidentTrends();
  }, [selectedTimeRange]);

  // Use incidents from Redux (already filtered on server-side)
  const filteredIncidents = incidents;

  // Pagination handlers
  const handlePageChange = (page: number) => {
    dispatch(setPagination({ page, limit: pagination.limit }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    dispatch(setPageSize(pageSize));
  };

  // Filter handlers
  const handleFiltersChange = () => {
    const filterValues = {
      status: statusFilter ? [statusFilter] : undefined,
      severity: severityFilter ? [parseInt(severityFilter)] : undefined,
      category: categoryFilter ? [categoryFilter] : undefined,
      search: searchTerm || undefined,
    };

    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(filterValues).filter(([_, value]) => value !== undefined)
    );

    dispatch(setFilters(cleanFilters));
  };

  // Calculate metrics for dashboard
  const metrics = {
    total: pagination.total,
    open: incidents.filter(i => i.status === 'open').length,
    investigating: incidents.filter(i => i.status === 'investigating').length,
    contained: incidents.filter(i => i.status === 'contained').length,
    resolved: incidents.filter(i => i.status === 'resolved').length,
    critical: incidents.filter(i => i.severity === 5).length,
    high: incidents.filter(i => i.severity === 4).length,
    averageResolutionTime: '4.2 hours'
  };

  // Navigation handlers for bi-directional linking
  const handleIncidentClick = (incident: Incident) => {
    navigate(`/incidents/${incident.id}`);
  };

  const handleAlertClick = (alertId: string) => {
    navigate(`/alerts/${alertId}`);
  };

  const handleIncidentNavigation = (incidentId: string) => {
    navigate(`/incidents/${incidentId}`);
  };

  const handleCreateIncident = (newIncident: any) => {
    // Refresh the incidents list to show the new incident
    dispatch(fetchIncidents({
      page: pagination.page,
      limit: pagination.limit,
      ...filters,
    }));
  };

  const handleEditIncident = (incident: Incident) => {
    setEditingIncident(incident);
    setShowEditModal(true);
  };

  const handleDeleteIncident = (incident: Incident) => {
    setDeletingIncident(incident);
    setShowDeleteModal(true);
  };

  const handleSaveIncident = async (updatedData: Partial<Incident>) => {
    if (!editingIncident) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/incidents/${editingIncident.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingIncident(null);
        // Refresh incidents list
        dispatch(fetchIncidents({
          page: pagination.page,
          limit: pagination.limit,
          ...filters,
        }));
      } else {
        console.error('Failed to update incident');
      }
    } catch (error) {
      console.error('Error updating incident:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingIncident) return;

    try {
      setIsDeleting(true);
      await dispatch(deleteIncident(deletingIncident.id)).unwrap();
      setShowDeleteModal(false);
      setDeletingIncident(null);
    } catch (error) {
      console.error('Error deleting incident:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingIncident(null);
  };


  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 5: return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 4: return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 3: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 2: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-300 bg-red-500/20';
      case 'investigating': return 'text-yellow-300 bg-yellow-500/20';
      case 'contained': return 'text-blue-300 bg-blue-500/20';
      case 'resolved': return 'text-green-300 bg-green-500/20';
      default: return 'text-gray-300 bg-gray-500/20';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'malware': return 'text-red-400';
      case 'intrusion': return 'text-orange-400';
      case 'data_breach': return 'text-purple-400';
      case 'policy_violation': return 'text-yellow-400';
      case 'insider_threat': return 'text-pink-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return '🔴';
      case 'investigating': return '🟡';
      case 'contained': return '🔵';
      case 'resolved': return '✅';
      default: return '⚪';
    }
  };

  const getWorkflowStageIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'investigating': return <Activity className="h-4 w-4 text-yellow-400" />;
      case 'contained': return <Shield className="h-4 w-4 text-blue-400" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-400" />;
      default: return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getWorkflowProgress = (status: string) => {
    switch (status) {
      case 'open': return 25;
      case 'investigating': return 50;
      case 'contained': return 75;
      case 'resolved': return 100;
      default: return 0;
    }
  };

  const WorkflowVisualization: React.FC<{ incident: Incident }> = ({ incident }) => {
    const stages = ['open', 'investigating', 'contained', 'resolved'];
    const currentStageIndex = stages.indexOf(incident.status);

    return (
      <div className="flex items-center space-x-4 p-4 bg-soc-dark-800/30 rounded-lg">
        {stages.map((stage, index) => (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center space-y-2">
              <div className={`p-2 rounded-full border-2 ${
                index <= currentStageIndex 
                  ? 'border-opensoc-500 bg-opensoc-500/20' 
                  : 'border-soc-dark-600 bg-soc-dark-800'
              }`}>
                {getWorkflowStageIcon(stage)}
              </div>
              <span className={`text-xs font-medium ${
                index <= currentStageIndex ? 'text-white' : 'text-slate-500'
              }`}>
                {stage.charAt(0).toUpperCase() + stage.slice(1)}
              </span>
            </div>
            {index < stages.length - 1 && (
              <div className={`flex-1 h-px ${
                index < currentStageIndex 
                  ? 'bg-opensoc-500' 
                  : 'bg-soc-dark-600'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const EnhancedModal: React.FC<{ incident: Incident; onClose: () => void }> = ({ incident, onClose }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-lg border text-lg font-bold ${getSeverityColor(incident.severity)}`}>
              SEV {incident.severity}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{incident.title}</h2>
              <p className="text-sm text-slate-400">Incident ID: {incident.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-800 rounded-lg"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Workflow Progress */}
        <div className="p-6 border-b border-soc-dark-700">
          <WorkflowVisualization incident={incident} />
        </div>

        {/* Modal Content */}
        <div className="flex h-[calc(90vh-200px)]">
          {/* Tabs Sidebar */}
          <div className="w-48 border-r border-soc-dark-700 p-4">
            <div className="space-y-2">
              {[
                { id: 'details', label: 'Details', icon: FileText },
                { id: 'timeline', label: 'Timeline', icon: GitBranch },
                { id: 'actions', label: 'Actions', icon: Target },
                { id: 'evidence', label: 'Evidence', icon: Paperclip }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left ${
                    activeTab === tab.id 
                      ? 'bg-opensoc-600 text-white' 
                      : 'text-slate-300 hover:bg-soc-dark-800'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Incident Overview</h3>
                  <p className="text-slate-300 leading-relaxed">{incident.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-white">Basic Information</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                          {incident.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Category:</span>
                        <span className="text-white font-medium">{incident.category?.replace('_', ' ') || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Assigned to:</span>
                        <span className="text-opensoc-400">{incident.assignedToName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Alert Count:</span>
                        <span className="text-white">{incident.alertCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-white">Timeline Information</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Created:</span>
                        <span className="text-white">{format(safeParseDate(incident.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Last Updated:</span>
                        <span className="text-white">{format(safeParseDate(incident.updatedAt), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      {incident.resolvedAt && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Resolved:</span>
                          <span className="text-green-400">{format(safeParseDate(incident.resolvedAt), 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-400">Time Open:</span>
                        <span className="text-white">
                          {safeFormatDistance(incident.createdAt, { addSuffix: false })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-white mb-3">Impact Assessment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-slate-400">Affected Users</span>
                      </div>
                      <div className="text-xl font-bold text-white">247</div>
                    </div>
                    <div className="card p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-4 w-4 text-orange-400" />
                        <span className="text-sm text-slate-400">Compromised Assets</span>
                      </div>
                      <div className="text-xl font-bold text-white">12</div>
                    </div>
                    <div className="card p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-red-400" />
                        <span className="text-sm text-slate-400">Financial Impact</span>
                      </div>
                      <div className="text-xl font-bold text-white">$45K</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Investigation Timeline</h3>
                  <button className="btn-secondary flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Entry</span>
                  </button>
                </div>
                
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-soc-dark-600"></div>
                  <div className="space-y-6">
                    {incident.timeline.map((event) => (
                      <div key={event.id} className="flex items-start space-x-4">
                        <div className={`relative z-10 p-2 rounded-full border-2 ${
                          event.type === 'status_change' ? 'border-opensoc-500 bg-opensoc-500/20' :
                          event.type === 'alert' ? 'border-red-500 bg-red-500/20' :
                          event.type === 'action' ? 'border-blue-500 bg-blue-500/20' :
                          'border-gray-500 bg-gray-500/20'
                        }`}>
                          {event.type === 'status_change' && <Activity className="h-3 w-3" />}
                          {event.type === 'alert' && <AlertTriangle className="h-3 w-3" />}
                          {event.type === 'action' && <Target className="h-3 w-3" />}
                          {event.type === 'note' && <MessageSquare className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 bg-soc-dark-800/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium">{event.title}</h4>
                            <span className="text-xs text-slate-400">
                              {format(safeParseDate(event.timestamp), 'MMM dd, HH:mm')}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-slate-300 text-sm mb-2">{event.description}</p>
                          )}
                          <div className="flex items-center space-x-2 text-xs text-slate-400">
                            <User className="h-3 w-3" />
                            <span>{event.userName}</span>
                            <Tag className="h-3 w-3 ml-2" />
                            <span>{event.type?.replace('_', ' ') || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-white">Response Actions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-md font-medium text-white">Quick Actions</h4>
                    <div className="space-y-2">
                      <button className="btn-primary w-full flex items-center justify-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Escalate Incident</span>
                      </button>
                      <button className="btn-secondary w-full flex items-center justify-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Assign to Team</span>
                      </button>
                      <button className="btn-secondary w-full flex items-center justify-center space-x-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>Add Comment</span>
                      </button>
                      <button className="btn-secondary w-full flex items-center justify-center space-x-2">
                        <ExternalLink className="h-4 w-4" />
                        <span>Create Ticket</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-md font-medium text-white">Status Actions</h4>
                    <div className="space-y-2">
                      <button className="btn-secondary w-full flex items-center justify-center space-x-2">
                        <Play className="h-4 w-4" />
                        <span>Start Investigation</span>
                      </button>
                      <button className="btn-secondary w-full flex items-center justify-center space-x-2">
                        <Pause className="h-4 w-4" />
                        <span>Contain Threat</span>
                      </button>
                      <button className="btn-success w-full flex items-center justify-center space-x-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Mark Resolved</span>
                      </button>
                      <button className="btn-secondary w-full flex items-center justify-center space-x-2">
                        <XCircle className="h-4 w-4" />
                        <span>Close as False Positive</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-white mb-3">Automated Playbooks</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-soc-dark-800/50 rounded-lg">
                      <div>
                        <span className="text-white font-medium">Malware Response Playbook</span>
                        <p className="text-slate-400 text-sm">Automated containment and analysis</p>
                      </div>
                      <button className="btn-secondary">Execute</button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-soc-dark-800/50 rounded-lg">
                      <div>
                        <span className="text-white font-medium">Data Breach Response</span>
                        <p className="text-slate-400 text-sm">Compliance and notification workflow</p>
                      </div>
                      <button className="btn-secondary">Execute</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'evidence' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Evidence & Artifacts</h3>
                  <button className="btn-secondary flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Evidence</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-white mb-3">Digital Evidence</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-soc-dark-800/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Paperclip className="h-4 w-4 text-slate-400" />
                          <div>
                            <span className="text-white text-sm">malware_sample.exe</span>
                            <p className="text-slate-400 text-xs">Binary file • 2.3 MB</p>
                          </div>
                        </div>
                        <button className="text-opensoc-400 hover:text-opensoc-300">
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-soc-dark-800/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Paperclip className="h-4 w-4 text-slate-400" />
                          <div>
                            <span className="text-white text-sm">network_capture.pcap</span>
                            <p className="text-slate-400 text-xs">Network capture • 15.7 MB</p>
                          </div>
                        </div>
                        <button className="text-opensoc-400 hover:text-opensoc-300">
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-soc-dark-800/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Paperclip className="h-4 w-4 text-slate-400" />
                          <div>
                            <span className="text-white text-sm">system_logs.zip</span>
                            <p className="text-slate-400 text-xs">Log archive • 8.1 MB</p>
                          </div>
                        </div>
                        <button className="text-opensoc-400 hover:text-opensoc-300">
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-white mb-3">IOC Matches</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="h-4 w-4 text-red-400" />
                          <span className="text-red-400 font-medium">Malicious IP</span>
                        </div>
                        <p className="text-white font-mono text-sm">192.168.1.100</p>
                        <p className="text-slate-400 text-xs">Known C&C server</p>
                      </div>
                      <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="h-4 w-4 text-orange-400" />
                          <span className="text-orange-400 font-medium">Suspicious Domain</span>
                        </div>
                        <p className="text-white font-mono text-sm">malware-c2.example.com</p>
                        <p className="text-slate-400 text-xs">APT28 infrastructure</p>
                      </div>
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="h-4 w-4 text-yellow-400" />
                          <span className="text-yellow-400 font-medium">File Hash</span>
                        </div>
                        <p className="text-white font-mono text-sm">a1b2c3d4e5f6...</p>
                        <p className="text-slate-400 text-xs">Known malware signature</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-soc-dark-700">
          <button onClick={onClose} className="btn-secondary">Close</button>
          <button className="btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Incidents</h1>
          <p className="text-slate-400 mt-1">
            Manage and track security incident response workflows
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center space-x-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Incident</span>
          </button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="card p-4">
          <div className="flex items-center space-x-2 mb-1">
            <FileText className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">Total</span>
          </div>
          <div className="text-2xl font-bold text-white">{metrics.total}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center space-x-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-slate-400">Open</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{metrics.open}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center space-x-2 mb-1">
            <Activity className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-slate-400">Investigating</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">{metrics.investigating}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center space-x-2 mb-1">
            <Shield className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-slate-400">Contained</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{metrics.contained}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center space-x-2 mb-1">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-sm text-slate-400">Resolved</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{metrics.resolved}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center space-x-2 mb-1">
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-slate-400">Critical</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{metrics.critical}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center space-x-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <span className="text-sm text-slate-400">High</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">{metrics.high}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">Avg Time</span>
          </div>
          <div className="text-lg font-bold text-white">{metrics.averageResolutionTime}</div>
        </div>
      </div>

      {/* Incident Trends Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Incident Trends by Status</h2>
          <TimeRangeSelector
            value={selectedTimeRange}
            onChange={setSelectedTimeRange}
            disabled={isLoadingTrends}
          />
        </div>
        <IncidentTrendsChart 
          data={incidentTrends} 
          loading={isLoadingTrends}
          showSeverity={true}
        />
      </div>

      {/* Filters and View Controls */}
      <div className="card p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search incidents by title, description, or assignee..."
                  className="input-field pl-10 pr-4 py-2 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* View Mode and Filter Controls */}
            <div className="flex items-center space-x-3">
              <div className="flex bg-soc-dark-800 rounded-lg p-1">
                {[
                  { mode: 'grid', icon: FileText, label: 'Grid' },
                  { mode: 'list', icon: Activity, label: 'List' },
                  { mode: 'workflow', icon: GitBranch, label: 'Workflow' }
                ].map((view) => (
                  <button
                    key={view.mode}
                    onClick={() => setViewMode(view.mode as any)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      viewMode === view.mode
                        ? 'bg-opensoc-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-soc-dark-700'
                    }`}
                  >
                    <view.icon className="h-4 w-4" />
                    <span>{view.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary flex items-center space-x-2 ${showFilters ? 'bg-opensoc-600 text-white' : ''}`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>

              <RowsPerPageSelector
                value={pagination.limit}
                onChange={handlePageSizeChange}
                disabled={isLoading}
              />

              <div className="text-sm text-slate-400">
                {pagination.total} incidents
              </div>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="pt-4 border-t border-soc-dark-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="contained">Contained</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Severity</label>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">All Severities</option>
                    <option value="5">Critical (5)</option>
                    <option value="4">High (4)</option>
                    <option value="3">Medium (3)</option>
                    <option value="2">Low (2)</option>
                    <option value="1">Info (1)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">All Categories</option>
                    <option value="malware">Malware</option>
                    <option value="intrusion">Intrusion</option>
                    <option value="data_breach">Data Breach</option>
                    <option value="policy_violation">Policy Violation</option>
                    <option value="insider_threat">Insider Threat</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStatusFilter('');
                      setSeverityFilter('');
                      setCategoryFilter('');
                      setSearchTerm('');
                    }}
                    className="btn-secondary w-full"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Content View */}
      {isLoading ? (
        <div className="card p-12 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-slate-400">Loading incidents...</p>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No incidents found</h3>
          <p className="text-slate-400">No incidents match your current filters.</p>
        </div>
      ) : (
        <div>
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredIncidents.map((incident) => (
                <div key={incident.id} className="card p-6 hover:bg-soc-dark-800/50 transition-colors cursor-pointer group"
                     onClick={() => handleIncidentClick(incident)}>
                  {/* Enhanced Grid Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2 flex-wrap">
                        <RecordId type="incident" id={incident.id} variant="badge" />
                        <span className={`px-2 py-1 rounded border text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                          SEV {incident.severity}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                          {getStatusIcon(incident.status)} {incident.status.toUpperCase()}
                        </span>
                        {incident.isTestData && <TestDataChip size="sm" />}
                      </div>
                      <h3 className="text-white font-medium text-sm leading-tight line-clamp-2">
                        {incident.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                    {incident.description}
                  </p>

                  {/* Workflow Progress Indicator */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Workflow Progress</span>
                      <span className="text-xs text-slate-400">{getWorkflowProgress(incident.status)}%</span>
                    </div>
                    <div className="w-full bg-soc-dark-700 rounded-full h-1">
                      <div 
                        className="bg-opensoc-500 h-1 rounded-full transition-all duration-300" 
                        style={{ width: `${getWorkflowProgress(incident.status)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Category:</span>
                      <span className={`font-medium capitalize ${getCategoryColor(incident.category)}`}>
                        {incident.category?.replace('_', ' ') || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned to:</span>
                      <span className="text-opensoc-400">{incident.assignedToName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Alerts:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white">{incident.alertCount}</span>
                        {incident.alertCount > 0 && (
                          <div 
                            className="flex items-center space-x-1 bg-blue-500/20 border border-blue-500/40 rounded px-1.5 py-0.5 cursor-pointer hover:bg-blue-500/30 transition-colors"
                            title={`View ${incident.alertCount} related alert${incident.alertCount !== 1 ? 's' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the incident click
                              // Navigate to alerts page - in the future could filter by incident
                              navigate('/alerts');
                            }}
                          >
                            <AlertTriangle className="h-3 w-3 text-blue-400" />
                            <span className="text-xs text-blue-400 font-medium">
                              View
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-soc-dark-700 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {safeFormatDistance(incident.updatedAt, { addSuffix: true })}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-xs text-opensoc-400">
                        <Eye className="h-3 w-3" />
                        <span>Details</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditIncident(incident);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-400 rounded transition-colors"
                        title="Edit incident"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteIncident(incident);
                        }}
                        className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                        title="Delete incident"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-soc-dark-800">
                    <tr>
                      <th className="table-header">Incident ID</th>
                      <th className="table-header">Incident</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Severity</th>
                      <th className="table-header">Category</th>
                      <th className="table-header">Assigned To</th>
                      <th className="table-header">Alerts</th>
                      <th className="table-header">Updated</th>
                      <th className="table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-soc-dark-900">
                    {filteredIncidents.map((incident) => (
                      <tr key={incident.id} className="table-row group">
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <RecordId type="incident" id={incident.id} variant="table" />
                            {incident.isTestData && <TestDataChip size="sm" />}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="max-w-xs">
                            <div className="font-medium text-white truncate">{incident.title}</div>
                            <div className="text-xs text-slate-400 truncate">{incident.description}</div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            {getWorkflowStageIcon(incident.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                              {incident.status.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(incident.severity)}`}>
                            SEV {incident.severity}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className={`capitalize ${getCategoryColor(incident.category)}`}>
                            {incident.category?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className="text-opensoc-400">{incident.assignedToName}</span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{incident.alertCount}</span>
                            {incident.alertCount > 0 && (
                              <div 
                                className="flex items-center space-x-1 bg-blue-500/20 border border-blue-500/40 rounded px-1.5 py-0.5 cursor-pointer hover:bg-blue-500/30 transition-colors"
                                title={`View ${incident.alertCount} related alert${incident.alertCount !== 1 ? 's' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/alerts');
                                }}
                              >
                                <AlertTriangle className="h-3 w-3 text-blue-400" />
                                <span className="text-xs text-blue-400 font-medium">
                                  View
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="text-slate-400 text-sm">
                            {safeFormatDistance(incident.updatedAt, { addSuffix: true })}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigate(`/incidents/${incident.id}`)}
                              className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-700 rounded transition-colors"
                              title="View incident details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditIncident(incident);
                              }}
                              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-soc-dark-700 rounded transition-colors"
                              title="Edit incident"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteIncident(incident);
                              }}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-soc-dark-700 rounded transition-colors"
                              title="Delete incident"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'workflow' && (
            <div className="space-y-6">
              {['open', 'investigating', 'contained', 'resolved'].map((status) => {
                const statusIncidents = filteredIncidents.filter(incident => incident.status === status);
                if (statusIncidents.length === 0) return null;

                return (
                  <div key={status} className="card">
                    <div className="p-6 border-b border-soc-dark-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getWorkflowStageIcon(status)}
                          <h3 className="text-lg font-medium text-white capitalize">
                            {status} ({statusIncidents.length})
                          </h3>
                        </div>
                        <div className="text-sm text-slate-400">
                          {((statusIncidents.length / filteredIncidents.length) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {statusIncidents.map((incident) => (
                          <div key={incident.id} 
                               className="p-4 bg-soc-dark-800/30 rounded-lg hover:bg-soc-dark-800/50 transition-colors cursor-pointer border border-soc-dark-700 group"
                               onClick={() => handleIncidentClick(incident)}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2 flex-wrap">
                                <RecordId type="incident" id={incident.id} variant="inline" showPrefix={false} />
                                <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(incident.severity)}`}>
                                  SEV {incident.severity}
                                </span>
                                {incident.isTestData && <TestDataChip size="sm" />}
                              </div>
                              <span className="text-xs text-slate-400">
                                {safeFormatDistance(incident.updatedAt, { addSuffix: true })}
                              </span>
                            </div>
                            
                            <h4 className="text-white font-medium text-sm mb-2 line-clamp-2">
                              {incident.title}
                            </h4>
                            
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-opensoc-400">{incident.assignedToName}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-slate-400">{incident.alertCount} alerts</span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditIncident(incident);
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-400 rounded transition-colors"
                                    title="Edit incident"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteIncident(incident);
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                                    title="Delete incident"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filteredIncidents.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={Math.ceil(pagination.total / pagination.limit)}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      )}

      {/* Create Incident Modal */}
      <IncidentCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateIncident}
      />

      {/* Edit Incident Modal */}
      <IncidentEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveIncident}
        incident={editingIncident}
        isLoading={isUpdating}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Incident"
        message={`Are you sure you want to delete incident "${deletingIncident?.title || 'Unknown'}"? This action cannot be undone.`}
        confirmText={deletingIncident?.title || ''}
        dangerLevel="high"
        isLoading={isDeleting}
      />

    </div>
  );
};

export default IncidentsPage;