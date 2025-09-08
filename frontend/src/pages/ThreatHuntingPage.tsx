import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Target,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Users,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { 
  fetchThreatHuntingEvents,
  fetchThreatHuntingStats,
  deleteThreatHuntingEvent,
  cloneThreatHuntingEvent
} from '../store/threatHuntingAsync';
import {
  setFilters,
  setPage,
  setPageSize,
  setSort,
  resetFilters
} from '../store/threatHuntingSlice';
import Pagination from '../components/common/Pagination';
import RowsPerPageSelector from '../components/common/RowsPerPageSelector';
import ThreatHuntTable from '../components/threatHunting/ThreatHuntTable';

const ThreatHuntingPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const {
    events,
    eventsLoading,
    statsLoading,
    pagination,
    filters,
    sortBy,
    sortOrder,
    stats,
    error
  } = useSelector((state: RootState) => state.threatHunting);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  // Initialize data on component mount
  useEffect(() => {
    dispatch(fetchThreatHuntingEvents({ 
      page: pagination?.currentPage || 1,
      limit: pagination?.itemsPerPage || 25,
      ...filters,
      sortBy,
      sortOrder
    }));
    dispatch(fetchThreatHuntingStats());
  }, [dispatch]);

  // Refresh data when filters or sorting change
  useEffect(() => {
    if (pagination) {
      dispatch(fetchThreatHuntingEvents({ 
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters,
        sortBy,
        sortOrder
      }));
    }
  }, [dispatch, pagination?.currentPage, pagination?.itemsPerPage, filters, sortBy, sortOrder]);

  const handleRefresh = () => {
    dispatch(fetchThreatHuntingEvents({ 
      page: pagination?.currentPage || 1,
      limit: pagination?.itemsPerPage || 25,
      ...filters,
      sortBy,
      sortOrder
    }));
    dispatch(fetchThreatHuntingStats());
  };

  const handleFilterChange = (key: string, value: string) => {
    dispatch(setFilters({ [key]: value }));
    dispatch(setPage(1)); // Reset to first page when filtering
  };

  const handleSearch = (searchTerm: string) => {
    dispatch(setFilters({ search: searchTerm }));
    dispatch(setPage(1));
  };

  const handleSort = (column: string) => {
    const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    dispatch(setSort({ sortBy: column, sortOrder: newSortOrder }));
  };

  const handlePageChange = (page: number) => {
    dispatch(setPage(page));
  };

  const handlePageSizeChange = (pageSize: number) => {
    dispatch(setPageSize(pageSize));
  };

  const handleViewEvent = (event: any) => {
    navigate(`/threat-hunting/${event.id}`);
  };

  const handleEditEvent = (event: any) => {
    navigate(`/threat-hunting/${event.id}?mode=edit`);
  };

  const handleCloneEvent = async (eventId: string) => {
    try {
      await dispatch(cloneThreatHuntingEvent(eventId)).unwrap();
    } catch (error) {
      console.error('Failed to clone event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this threat hunting event?')) {
      try {
        await dispatch(deleteThreatHuntingEvent(eventId)).unwrap();
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventIds(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEventIds.length === events.length) {
      setSelectedEventIds([]);
    } else {
      setSelectedEventIds(events.map(event => event.id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'text-blue-400 bg-blue-500/20';
      case 'in_progress': return 'text-yellow-400 bg-yellow-500/20';
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'cancelled': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getHuntingTypeIcon = (type: string) => {
    switch (type) {
      // New professional hunt types
      case 'proactive_exploration': return <Target className="h-4 w-4" />;
      case 'hypothesis_driven': return <Search className="h-4 w-4" />;
      case 'intel_driven': return <BarChart3 className="h-4 w-4" />;
      case 'behavioral_analysis': return <Activity className="h-4 w-4" />;
      case 'infrastructure_hunt': return <Users className="h-4 w-4" />;
      case 'campaign_tracking': return <TrendingUp className="h-4 w-4" />;
      case 'threat_reaction': return <AlertTriangle className="h-4 w-4" />;
      case 'compliance_hunt': return <CheckCircle className="h-4 w-4" />;
      case 'red_team_verification': return <Eye className="h-4 w-4" />;
      case 'threat_landscape': return <Calendar className="h-4 w-4" />;
      // Legacy hunt types (backwards compatibility)
      case 'proactive': return <Target className="h-4 w-4" />;
      case 'reactive': return <AlertTriangle className="h-4 w-4" />;
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">Threat Hunting</h1>
            <p className="text-slate-400 mt-2">Error loading threat hunting data</p>
          </div>
        </div>
        <div className="card p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to Load Threat Hunting Data</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button onClick={handleRefresh} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Threat Hunting</h1>
          <p className="text-slate-400 mt-2">
            Proactive threat detection and investigation activities
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center space-x-2"
            disabled={eventsLoading}
          >
            <RefreshCw className={`h-4 w-4 ${eventsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={() => navigate('/threat-hunting/create')}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Hunt
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-slate-700 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-slate-600 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-slate-700 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card" data-testid="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Hunts</p>
                <p className="text-2xl font-bold text-white">
                  {stats.overview.totalHunts}
                </p>
              </div>
              <div className="w-12 h-12 bg-opensoc-500/20 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-opensoc-400" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">In Progress</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {stats.overview.inProgressHunts}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Completed</p>
                <p className="text-2xl font-bold text-green-400">
                  {stats.overview.completedHunts}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Duration</p>
                <p className="text-2xl font-bold text-blue-400">
                  {stats.overview.averageDurationDays}d
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center justify-between space-x-4 flex-wrap gap-4">
        <div className="flex-1 relative min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search hunting events..."
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        
        <div className="flex items-center space-x-3 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'bg-opensoc-600' : ''}`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>

          {pagination && (
            <RowsPerPageSelector
              value={pagination.itemsPerPage}
              onChange={handlePageSizeChange}
              disabled={eventsLoading}
            />
          )}

          <div className="text-sm text-slate-400">
            {pagination?.totalItems || 0} hunting events
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field w-full"
              >
                <option value="">All Statuses</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="input-field w-full"
              >
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Hunting Type</label>
              <select
                value={filters.huntingType}
                onChange={(e) => handleFilterChange('huntingType', e.target.value)}
                className="input-field w-full"
              >
                <option value="">All Types</option>
                <option value="proactive">Proactive</option>
                <option value="reactive">Reactive</option>
                <option value="intel_driven">Intel Driven</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Confidence</label>
              <select
                value={filters.confidence}
                onChange={(e) => handleFilterChange('confidence', e.target.value)}
                className="input-field w-full"
              >
                <option value="">All Confidence Levels</option>
                <option value="very_high">Very High</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => dispatch(resetFilters())}
                className="btn-secondary w-full"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events Table */}
      <ThreatHuntTable
        events={events}
        isLoading={eventsLoading}
        selectedEventIds={selectedEventIds}
        onSelectEvent={handleSelectEvent}
        onSelectAll={handleSelectAll}
        onViewEvent={handleViewEvent}
        onEditEvent={handleEditEvent}
        onCloneEvent={handleCloneEvent}
        onDeleteEvent={handleDeleteEvent}
        getStatusColor={getStatusColor}
        getPriorityColor={getPriorityColor}
        getHuntingTypeIcon={getHuntingTypeIcon}
        formatDate={formatDate}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Pagination */}
      {!eventsLoading && events.length > 0 && pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={handlePageChange}
          isLoading={eventsLoading}
        />
      )}

      {/* Empty State */}
      {!eventsLoading && events.length === 0 && (
        <div className="card p-12 text-center">
          <Target className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No hunting events found</h3>
          <p className="text-slate-400 mb-4">
            Get started by creating your first threat hunting event.
          </p>
          <button 
            onClick={() => navigate('/threat-hunting/create')}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Hunt
          </button>
        </div>
      )}

    </div>
  );
};

export default ThreatHuntingPage;