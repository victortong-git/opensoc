import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Shield,
  Globe,
  Hash,
  Mail,
  Link,
  FileText,
  Eye,
  EyeOff,
  Clock,
  TrendingUp,
  MapPin,
  Users,
  Zap,
  Target,
  SearchIcon
} from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { 
  fetchIOCs, 
  fetchThreatActors, 
  fetchCampaigns, 
  fetchThreatIntelStats,
  updateIOC,
  deactivateIOC
} from '../store/threatIntelAsync';
import { 
  openCreateModal, 
  closeCreateModal, 
  openImportModal, 
  closeImportModal,
  setSelectedIOC,
  setSelectedThreatActor,
  setSelectedCampaign,
  openThreatActorDetailModal,
  closeThreatActorDetailModal,
  openCampaignDetailModal,
  closeCampaignDetailModal,
  setIOCsPagination,
  setIOCsPageSize,
  setThreatActorsPagination,
  setThreatActorsPageSize,
  setCampaignsPagination,
  setCampaignsPageSize
} from '../store/threatIntelSlice';
import Pagination from '../components/common/Pagination';
import RowsPerPageSelector from '../components/common/RowsPerPageSelector';
import RecordId from '../components/common/RecordId';
import TestDataChip from '../components/common/TestDataChip';
import ThreatHuntingCreateFromIntelModal from '../components/threatHunting/ThreatHuntingCreateFromIntelModal';

interface TabButtonProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: (id: string) => void;
  count?: number;
}

const TabButton: React.FC<TabButtonProps> = ({ id, label, isActive, onClick, count }) => (
  <button
    onClick={() => onClick(id)}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-opensoc-600 text-white'
        : 'text-slate-400 hover:text-white hover:bg-soc-dark-700'
    }`}
  >
    {label}
    {count !== undefined && (
      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
        isActive ? 'bg-opensoc-700' : 'bg-soc-dark-600'
      }`}>
        {count}
      </span>
    )}
  </button>
);

const ThreatIntelPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { 
    iocs,
    threatActors,
    campaigns,
    summaryStats,
    iocsPagination,
    threatActorsPagination,
    campaignsPagination,
    isLoading,
    iocsLoading,
    threatActorsLoading,
    campaignsLoading,
    summaryStatsLoading,
    error,
    selectedThreatActorId,
    selectedCampaignId,
    isCreateModalOpen,
    isImportModalOpen,
    isThreatActorDetailModalOpen,
    isCampaignDetailModalOpen
  } = useSelector((state: RootState) => state.threatIntel);

  const [activeTab, setActiveTab] = useState('iocs');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedConfidence, setSelectedConfidence] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Threat hunting modal state
  const [showHuntModal, setShowHuntModal] = useState(false);
  const [huntModalData, setHuntModalData] = useState<{
    type: 'ioc' | 'threat_actor' | 'campaign';
    id: string;
    data?: any;
  } | null>(null);

  // Get selected objects
  const selectedThreatActor = threatActors.find(actor => actor.id === selectedThreatActorId);
  const selectedCampaign = campaigns.find(campaign => campaign.id === selectedCampaignId);

  // Refresh all threat intelligence data
  const handleRefresh = () => {
    dispatch(fetchThreatIntelStats());
    dispatch(fetchIOCs({
      page: iocsPagination?.currentPage,
      limit: iocsPagination?.itemsPerPage,
      search: searchTerm || undefined,
      confidence: selectedConfidence === 'all' ? undefined : selectedConfidence,
      iocType: selectedType === 'all' ? undefined : selectedType,
      status: selectedStatus === 'all' ? undefined : selectedStatus
    }));
    dispatch(fetchThreatActors({ 
      page: threatActorsPagination?.currentPage,
      limit: threatActorsPagination?.itemsPerPage,
      search: searchTerm || undefined 
    }));
    dispatch(fetchCampaigns({ 
      page: campaignsPagination?.currentPage,
      limit: campaignsPagination?.itemsPerPage,
      search: searchTerm || undefined 
    }));
  };
  
  // Load data on component mount and when filters change
  useEffect(() => {
    dispatch(fetchThreatIntelStats());
  }, [dispatch]);

  // Load IOCs when pagination or filters change
  useEffect(() => {
    dispatch(fetchIOCs({
      page: iocsPagination?.currentPage,
      limit: iocsPagination?.itemsPerPage,
      search: searchTerm || undefined,
      confidence: selectedConfidence !== 'all' ? selectedConfidence : undefined,
      type: selectedType !== 'all' ? selectedType : undefined,
      isActive: selectedStatus !== 'all' ? selectedStatus === 'active' : undefined
    }));
  }, [dispatch, searchTerm, selectedConfidence, selectedType, selectedStatus, iocsPagination?.currentPage, iocsPagination?.itemsPerPage]);

  // Load Threat Actors when pagination or filters change
  useEffect(() => {
    dispatch(fetchThreatActors({ 
      page: threatActorsPagination?.currentPage,
      limit: threatActorsPagination?.itemsPerPage,
      search: searchTerm || undefined 
    }));
  }, [dispatch, searchTerm, threatActorsPagination?.currentPage, threatActorsPagination?.itemsPerPage]);

  // Load Campaigns when pagination or filters change
  useEffect(() => {
    dispatch(fetchCampaigns({ 
      page: campaignsPagination?.currentPage,
      limit: campaignsPagination?.itemsPerPage,
      search: searchTerm || undefined 
    }));
  }, [dispatch, searchTerm, campaignsPagination?.currentPage, campaignsPagination?.itemsPerPage]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ip': return <Globe className="h-4 w-4" />;
      case 'domain': return <Link className="h-4 w-4" />;
      case 'url': return <Link className="h-4 w-4" />;
      case 'file_hash': return <Hash className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'registry_key': return <FileText className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
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

  const getSophisticationColor = (sophistication: string) => {
    switch (sophistication) {
      case 'expert': return 'text-red-400 bg-red-500/20';
      case 'advanced': return 'text-orange-400 bg-orange-500/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20';
      case 'minimal': return 'text-green-400 bg-green-500/20';
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

  // Click handlers for opening detail modals
  const handleIOCClick = (iocId: string) => {
    navigate(`/threat-intel/iocs/${iocId}`);
  };

  const handleThreatActorClick = (actorId: string) => {
    dispatch(setSelectedThreatActor(actorId));
    dispatch(openThreatActorDetailModal());
  };

  const handleCampaignClick = (campaignId: string) => {
    dispatch(setSelectedCampaign(campaignId));
    dispatch(openCampaignDetailModal());
  };

  // Hunt creation handlers - navigate to dedicated page
  const handleCreateHuntFromIOC = (e: React.MouseEvent, ioc: any) => {
    e.stopPropagation(); // Prevent row click
    navigate(`/threat-hunting/create?sourceType=ioc&sourceId=${ioc.id}`);
  };

  const handleCreateHuntFromThreatActor = (e: React.MouseEvent, actor: any) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/threat-hunting/create?sourceType=threat_actor&sourceId=${actor.id}`);
  };

  const handleCreateHuntFromCampaign = (e: React.MouseEvent, campaign: any) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/threat-hunting/create?sourceType=campaign&sourceId=${campaign.id}`);
  };

  const handleHuntModalClose = () => {
    setShowHuntModal(false);
    setHuntModalData(null);
  };

  const handleHuntCreated = (hunt: any) => {
    console.log('Hunt created:', hunt);
    
    // Show success notification with more details
    const huntName = hunt.name || hunt.title || 'New Hunt';
    alert(`🎯 Threat hunt "${huntName}" created successfully!\n\nStatus: ${hunt.status || 'planned'}\nPriority: ${hunt.priority || 'medium'}\n\nYou can view and manage this hunt in the Threat Hunting section.`);
    
    // Optional: Navigate to threat hunting page after a delay
    // setTimeout(() => {
    //   window.location.href = '/threat-hunting';
    // }, 2000);
  };

  // Pagination handlers
  const handleIOCsPageChange = (page: number) => {
    dispatch(setIOCsPagination({ 
      page, 
      limit: iocsPagination?.itemsPerPage || 25 
    }));
  };

  const handleIOCsPageSizeChange = (pageSize: number) => {
    dispatch(setIOCsPageSize(pageSize));
  };

  const handleThreatActorsPageChange = (page: number) => {
    dispatch(setThreatActorsPagination({ 
      page, 
      limit: threatActorsPagination?.itemsPerPage || 25 
    }));
  };

  const handleThreatActorsPageSizeChange = (pageSize: number) => {
    dispatch(setThreatActorsPageSize(pageSize));
  };

  const handleCampaignsPageChange = (page: number) => {
    dispatch(setCampaignsPagination({ 
      page, 
      limit: campaignsPagination?.itemsPerPage || 25 
    }));
  };

  const handleCampaignsPageSizeChange = (pageSize: number) => {
    dispatch(setCampaignsPageSize(pageSize));
  };

  // IOC status toggle handlers
  const handleToggleIOCStatus = async (e: React.MouseEvent, iocId: string, currentStatus: boolean) => {
    e.stopPropagation(); // Prevent opening the detail modal
    
    try {
      if (currentStatus) {
        // If active, deactivate it
        await dispatch(deactivateIOC(iocId)).unwrap();
      } else {
        // If inactive, reactivate it
        await dispatch(updateIOC({ 
          id: iocId, 
          iocData: { isActive: true } 
        })).unwrap();
      }
      
      // Refresh the IOCs list
      dispatch(fetchIOCs({
        page: iocsPagination?.currentPage,
        limit: iocsPagination?.itemsPerPage,
        search: searchTerm || undefined,
        confidence: selectedConfidence !== 'all' ? selectedConfidence : undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        isActive: selectedStatus !== 'all' ? selectedStatus === 'active' : undefined
      }));
      
      // Refresh stats to update the summary cards
      dispatch(fetchThreatIntelStats());
    } catch (error) {
      console.error('Failed to toggle IOC status:', error);
    }
  };

  const tabs = [
    { id: 'iocs', label: 'Indicators', count: iocsPagination?.totalItems || iocs.length },
    { id: 'actors', label: 'Threat Actors', count: threatActorsPagination?.totalItems || threatActors.length },
    { id: 'campaigns', label: 'Campaigns', count: campaignsPagination?.totalItems || campaigns.length },
    { id: 'feeds', label: 'Intel Feeds', count: 12 }
  ];

  // Data is already filtered by the API, no need for client-side filtering
  const filteredIOCs = iocs;
  const filteredActors = threatActors;
  const filteredCampaigns = campaigns;

  // Show error state if there's an error
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">Threat Intelligence</h1>
            <p className="text-slate-400 mt-2">Error loading threat intelligence data</p>
          </div>
        </div>
        <div className="card p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to Load Threat Intelligence</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button 
            onClick={() => {
              dispatch(fetchThreatIntelStats());
              dispatch(fetchIOCs());
              dispatch(fetchThreatActors());
              dispatch(fetchCampaigns());
            }}
            className="btn-primary"
          >
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
          <h1 className="text-3xl font-bold text-white">Threat Intelligence</h1>
          <p className="text-slate-400 mt-2">
            Manage indicators of compromise, threat actors, and security campaigns
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
          <button 
            onClick={() => dispatch(openImportModal())}
            className="btn-secondary"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import IOCs
          </button>
          <button className="btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button 
            onClick={() => dispatch(openCreateModal())}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add IOC
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryStatsLoading ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active IOCs</p>
                <p className="text-2xl font-bold text-white">
                  {summaryStats?.activeIOCs || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Threat Actors</p>
                <p className="text-2xl font-bold text-white">
                  {summaryStats?.threatActors || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Campaigns</p>
                <p className="text-2xl font-bold text-white">
                  {summaryStats?.activeCampaigns || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Intelligence Feeds</p>
                <p className="text-2xl font-bold text-white">{summaryStats?.intelligenceFeeds || 0}</p>
                <p className="text-xs text-green-400">All operational</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-soc-dark-700">
        {tabs.map(tab => (
          <TabButton
            key={tab.id}
            id={tab.id}
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={setActiveTab}
            count={tab.count}
          />
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between space-x-4 flex-wrap gap-4">
        <div className="flex-1 relative min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search indicators, actors, campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

          {activeTab === 'iocs' && iocsPagination && (
            <RowsPerPageSelector
              value={iocsPagination.itemsPerPage}
              onChange={handleIOCsPageSizeChange}
              disabled={iocsLoading}
            />
          )}
          {activeTab === 'actors' && threatActorsPagination && (
            <RowsPerPageSelector
              value={threatActorsPagination.itemsPerPage}
              onChange={handleThreatActorsPageSizeChange}
              disabled={threatActorsLoading}
            />
          )}
          {activeTab === 'campaigns' && campaignsPagination && (
            <RowsPerPageSelector
              value={campaignsPagination.itemsPerPage}
              onChange={handleCampaignsPageSizeChange}
              disabled={campaignsLoading}
            />
          )}

          <div className="text-sm text-slate-400">
            {activeTab === 'iocs' && `${iocsPagination?.totalItems || 0} indicators`}
            {activeTab === 'actors' && `${threatActorsPagination?.totalItems || 0} actors`}
            {activeTab === 'campaigns' && `${campaignsPagination?.totalItems || 0} campaigns`}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">All IOCs (Active & Inactive)</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Confidence Level</label>
              <select
                value={selectedConfidence}
                onChange={(e) => setSelectedConfidence(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">All Confidence Levels</option>
                <option value="very_high">Very High</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Indicator Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">All Types</option>
                <option value="ip">IP Address</option>
                <option value="domain">Domain</option>
                <option value="url">URL</option>
                <option value="file_hash">File Hash</option>
                <option value="email">Email</option>
                <option value="registry_key">Registry Key</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Time Range</label>
              <select className="input-field w-full">
                <option>Last 30 days</option>
                <option>Last 7 days</option>
                <option>Last 24 hours</option>
                <option>Custom range</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6 overflow-x-auto">
        {activeTab === 'iocs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h3 className="text-lg font-semibold text-white">
                Indicators of Compromise ({filteredIOCs.length})
              </h3>
              <div className="flex items-center space-x-4 text-sm flex-wrap">
                <span className="text-green-400 flex-shrink-0">
                  {filteredIOCs.filter(ioc => ioc.isActive).length} active
                </span>
                <span className="text-gray-400 flex-shrink-0">
                  {filteredIOCs.filter(ioc => !ioc.isActive).length} inactive
                </span>
                {selectedStatus !== 'all' && (
                  <span className="px-2 py-1 bg-opensoc-600 text-white text-xs rounded flex-shrink-0">
                    {selectedStatus === 'active' ? 'Showing active only' : 'Showing inactive only'}
                  </span>
                )}
              </div>
            </div>
            
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead className="bg-soc-dark-800">
                    <tr>
                      <th className="table-header w-[10%]">Type</th>
                      <th className="table-header w-[35%]">IOC Value</th>
                      <th className="table-header w-[12%]">Status</th>
                      <th className="table-header w-[13%]">Confidence</th>
                      <th className="table-header w-[10%]">Severity</th>
                      <th className="table-header w-[15%]">Source</th>
                      <th className="table-header w-[8%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-soc-dark-900">
                    {iocsLoading ? (
                      [1, 2, 3].map(i => (
                        <tr key={i} className="table-row animate-pulse">
                          <td className="table-cell"><div className="w-6 h-4 bg-slate-700 rounded"></div></td>
                          <td className="table-cell"><div className="h-4 bg-slate-700 rounded w-3/4"></div></td>
                          <td className="table-cell"><div className="w-16 h-4 bg-slate-700 rounded"></div></td>
                          <td className="table-cell"><div className="w-12 h-4 bg-slate-700 rounded"></div></td>
                          <td className="table-cell"><div className="w-12 h-4 bg-slate-700 rounded"></div></td>
                          <td className="table-cell"><div className="w-20 h-4 bg-slate-700 rounded"></div></td>
                          <td className="table-cell"><div className="w-8 h-4 bg-slate-700 rounded"></div></td>
                        </tr>
                      ))
                    ) : (
                      filteredIOCs.map((ioc) => (
                        <tr 
                          key={ioc.id} 
                          className={`table-row group cursor-pointer ${
                            !ioc.isActive ? 'opacity-60' : ''
                          }`}
                          onClick={() => handleIOCClick(ioc.id)}
                        >
                          <td className="table-cell">
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(ioc.type)}
                              <RecordId type="ioc" id={ioc.id} variant="inline" className="text-xs" />
                              {ioc.isTestData && <TestDataChip size="sm" />}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="min-w-0 max-w-80">
                              <p className="text-white font-mono text-sm truncate" title={ioc.value}>
                                {ioc.value}
                              </p>
                              <p className="text-slate-400 text-xs truncate" title={ioc.description}>
                                {ioc.description}
                              </p>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className={`px-2 py-1 rounded text-xs ${
                              ioc.isActive 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {ioc.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className={`px-2 py-1 rounded text-xs ${getConfidenceColor(ioc.confidence)}`}>
                              {ioc.confidence.replace('_', ' ').toUpperCase()}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className={`px-2 py-1 rounded text-xs ${getSeverityColor(ioc.severity)}`}>
                              SEV {ioc.severity}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="text-sm min-w-0 max-w-48">
                              <div className="truncate" title={ioc.source}>{ioc.source}</div>
                              <div className="text-xs text-slate-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDate(new Date(ioc.lastSeen))}
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => handleCreateHuntFromIOC(e, ioc)}
                                className="p-1 rounded hover:bg-blue-600/20 transition-colors text-blue-400 hover:text-blue-300"
                                title="Create threat hunt from this IOC"
                              >
                                <SearchIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => handleToggleIOCStatus(e, ioc.id, ioc.isActive)}
                                className={`p-1 rounded hover:bg-soc-dark-700 transition-colors ${
                                  ioc.isActive 
                                    ? 'text-green-400 hover:text-green-300' 
                                    : 'text-gray-400 hover:text-gray-300'
                                }`}
                                title={ioc.isActive ? 'Click to deactivate IOC' : 'Click to activate IOC'}
                              >
                                {ioc.isActive ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* IOCs Pagination */}
            {!iocsLoading && filteredIOCs.length > 0 && iocsPagination && (
              <Pagination
                currentPage={iocsPagination.currentPage}
                totalPages={iocsPagination.totalPages}
                totalItems={iocsPagination.totalItems}
                itemsPerPage={iocsPagination.itemsPerPage}
                onPageChange={handleIOCsPageChange}
                isLoading={iocsLoading}
              />
            )}
          </div>
        )}

        {activeTab === 'actors' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Threat Actors ({filteredActors.length})
              </h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-x-auto">
              {threatActorsLoading ? (
                <div className="col-span-full grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[1, 2].map(i => (
                    <div key={i} className="card animate-pulse">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="h-6 bg-slate-700 rounded w-1/3 mb-2"></div>
                            <div className="h-4 bg-slate-600 rounded w-full mb-3"></div>
                          </div>
                          <div className="w-16 h-6 bg-slate-700 rounded"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                          <div className="h-4 bg-slate-600 rounded w-2/3"></div>
                          <div className="h-4 bg-slate-600 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                filteredActors.map((actor) => (
                <div 
                  key={actor.id} 
                  className="card hover:bg-soc-dark-800 transition-colors cursor-pointer"
                  onClick={() => handleThreatActorClick(actor.id)}
                >
                  <div className="space-y-4 overflow-x-auto">
                    <div className="flex items-start justify-between min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2 flex-wrap">
                          <h4 className="text-lg font-semibold text-white truncate" title={actor.name}>{actor.name}</h4>
                          <RecordId type="threat_actor" id={actor.id} variant="inline" showPrefix={true} />
                          {actor.isTestData && <TestDataChip size="sm" />}
                          {actor.isActive ? (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded flex-shrink-0">ACTIVE</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded flex-shrink-0">INACTIVE</span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm mb-3 line-clamp-2" title={actor.description}>{actor.description}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs flex-shrink-0 ${getSophisticationColor(actor.sophistication)}`}>
                        {actor.sophistication.toUpperCase()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-white truncate" title={actor.origin}>{actor.origin}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-300 truncate" title={`Aliases: ${actor.aliases.join(', ')}`}>
                          Aliases: {actor.aliases.slice(0, 3).join(', ')}{actor.aliases.length > 3 ? '...' : ''}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-300">
                          {actor.campaigns.length} campaigns, {actor.techniques.length} techniques
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">TARGET SECTORS</p>
                      <div className="flex flex-wrap gap-1">
                        {actor.targetSectors.slice(0, 4).map(sector => (
                          <span key={sector} className="px-2 py-1 bg-soc-dark-700 text-xs text-slate-300 rounded truncate max-w-24" title={sector}>
                            {sector}
                          </span>
                        ))}
                        {actor.targetSectors.length > 4 && (
                          <span className="text-xs text-slate-400">+{actor.targetSectors.length - 4}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-soc-dark-700 flex-wrap gap-2">
                      <div className="text-xs text-slate-500 space-y-1">
                        <div>First seen: {formatDate(actor.firstSeen)}</div>
                        <div>Last seen: {formatDate(actor.lastSeen)}</div>
                      </div>
                      <button
                        onClick={(e) => handleCreateHuntFromThreatActor(e, actor)}
                        className="flex items-center space-x-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 rounded text-xs transition-colors"
                        title="Create threat hunt from this actor"
                      >
                        <SearchIcon className="h-3 w-3" />
                        <span>Create Hunt</span>
                      </button>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>

            {/* Threat Actors Pagination */}
            {!threatActorsLoading && filteredActors.length > 0 && threatActorsPagination && (
              <Pagination
                currentPage={threatActorsPagination.currentPage}
                totalPages={threatActorsPagination.totalPages}
                totalItems={threatActorsPagination.totalItems}
                itemsPerPage={threatActorsPagination.itemsPerPage}
                onPageChange={handleThreatActorsPageChange}
                isLoading={threatActorsLoading}
              />
            )}
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Security Campaigns ({filteredCampaigns.length})
              </h3>
            </div>
            
            <div className="space-y-6 overflow-x-auto">
              {campaignsLoading ? (
                <div className="space-y-6">
                  {[1, 2].map(i => (
                    <div key={i} className="card animate-pulse">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="h-6 bg-slate-700 rounded w-1/3 mb-2"></div>
                            <div className="h-4 bg-slate-600 rounded w-full mb-3"></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <div className="h-3 bg-slate-600 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                          </div>
                          <div className="space-y-1">
                            <div className="h-3 bg-slate-600 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                          </div>
                          <div className="space-y-1">
                            <div className="h-3 bg-slate-600 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                filteredCampaigns.map((campaign) => (
                <div 
                  key={campaign.id} 
                  className="card hover:bg-soc-dark-800 transition-colors cursor-pointer"
                  onClick={() => handleCampaignClick(campaign.id)}
                >
                  <div className="space-y-4 overflow-x-auto">
                    <div className="flex items-start justify-between min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2 flex-wrap">
                          <h4 className="text-lg font-semibold text-white truncate" title={campaign.name}>{campaign.name}</h4>
                          <RecordId type="campaign" id={campaign.id} variant="inline" showPrefix={true} />
                          {campaign.isTestData && <TestDataChip size="sm" />}
                          {campaign.isActive ? (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded flex-shrink-0">ACTIVE</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded flex-shrink-0">ENDED</span>
                          )}
                          <div className={`px-2 py-1 rounded text-xs flex-shrink-0 ${getSeverityColor(campaign.severity)}`}>
                            SEV {campaign.severity}
                          </div>
                        </div>
                        <p className="text-slate-400 text-sm mb-3 line-clamp-2" title={campaign.description}>{campaign.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 mb-1">THREAT ACTOR</p>
                        <p className="text-sm text-white truncate" title={campaign.threatActor}>{campaign.threatActor}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 mb-1">AFFECTED ASSETS</p>
                        <p className="text-sm text-white">{campaign.affectedAssets} assets</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 mb-1">DURATION</p>
                        <p className="text-sm text-white truncate" title={`${formatDate(campaign.startDate)} - ${campaign.endDate ? formatDate(campaign.endDate) : 'Ongoing'}`}>
                          {formatDate(campaign.startDate)} - {campaign.endDate ? formatDate(campaign.endDate) : 'Ongoing'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">TARGET SECTORS</p>
                      <div className="flex flex-wrap gap-1">
                        {campaign.targetSectors.slice(0, 4).map(sector => (
                          <span key={sector} className="px-2 py-1 bg-soc-dark-700 text-xs text-slate-300 rounded truncate max-w-24" title={sector}>
                            {sector}
                          </span>
                        ))}
                        {campaign.targetSectors.length > 4 && (
                          <span className="text-xs text-slate-400">+{campaign.targetSectors.length - 4}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">MITRE ATT&CK TECHNIQUES</p>
                      <div className="flex flex-wrap gap-1">
                        {campaign.techniques.slice(0, 6).map(technique => (
                          <span key={technique} className="px-2 py-1 bg-opensoc-600/20 text-opensoc-300 text-xs rounded font-mono truncate max-w-20" title={technique}>
                            {technique}
                          </span>
                        ))}
                        {campaign.techniques.length > 6 && (
                          <span className="text-xs text-slate-400">+{campaign.techniques.length - 6}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-soc-dark-700">
                      <button
                        onClick={(e) => handleCreateHuntFromCampaign(e, campaign)}
                        className="flex items-center space-x-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 rounded text-xs transition-colors"
                        title="Create threat hunt from this campaign"
                      >
                        <SearchIcon className="h-3 w-3" />
                        <span>Create Hunt</span>
                      </button>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>

            {/* Campaigns Pagination */}
            {!campaignsLoading && filteredCampaigns.length > 0 && campaignsPagination && (
              <Pagination
                currentPage={campaignsPagination.currentPage}
                totalPages={campaignsPagination.totalPages}
                totalItems={campaignsPagination.totalItems}
                itemsPerPage={campaignsPagination.itemsPerPage}
                onPageChange={handleCampaignsPageChange}
                isLoading={campaignsLoading}
              />
            )}
          </div>
        )}

        {activeTab === 'feeds' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h3 className="text-lg font-semibold text-white">Intelligence Feeds</h3>
              <button className="btn-secondary">
                <Plus className="h-4 w-4 mr-2" />
                Add Feed
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-x-auto">
              {[
                { name: 'VirusTotal', status: 'active', lastUpdate: '5 minutes ago', iocs: 1247 },
                { name: 'MISP Threat Sharing', status: 'active', lastUpdate: '12 minutes ago', iocs: 892 },
                { name: 'AlienVault OTX', status: 'active', lastUpdate: '18 minutes ago', iocs: 634 },
                { name: 'Emerging Threats', status: 'active', lastUpdate: '25 minutes ago', iocs: 445 },
                { name: 'Abuse.ch', status: 'warning', lastUpdate: '2 hours ago', iocs: 312 },
                { name: 'Custom Feed', status: 'error', lastUpdate: '6 hours ago', iocs: 0 }
              ].map((feed, index) => (
                <div key={index} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">{feed.name}</h4>
                    <div className={`px-2 py-1 rounded text-xs ${
                      feed.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      feed.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {feed.status.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Update:</span>
                      <span className="text-white">{feed.lastUpdate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">IOCs Received:</span>
                      <span className="text-white">{feed.iocs.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>


      {/* Threat Actor Detail Modal */}
      {isThreatActorDetailModalOpen && selectedThreatActor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <Users className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h2 className="text-xl font-semibold text-white">{selectedThreatActor.name}</h2>
                      <RecordId type="threat_actor" id={selectedThreatActor.id} variant="badge" showPrefix={true} />
                    </div>
                    <p className="text-sm text-slate-400">Threat Actor Profile</p>
                  </div>
                </div>
                <button
                  onClick={() => dispatch(closeThreatActorDetailModal())}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Basic Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className={selectedThreatActor.isActive ? 'text-red-400' : 'text-gray-400'}>
                          {selectedThreatActor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sophistication:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getSophisticationColor(selectedThreatActor.sophistication)}`}>
                          {selectedThreatActor.sophistication.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Origin:</span>
                        <span className="text-white">{selectedThreatActor.origin}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Timeline</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">First Seen:</span>
                        <span className="text-white">{formatDate(selectedThreatActor.firstSeen)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Last Seen:</span>
                        <span className="text-white">{formatDate(selectedThreatActor.lastSeen)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                  <p className="text-slate-300">{selectedThreatActor.description}</p>
                </div>

                {selectedThreatActor.aliases && selectedThreatActor.aliases.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Known Aliases</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedThreatActor.aliases.map((alias, index) => (
                        <span key={index} className="px-3 py-1 bg-soc-dark-700 text-slate-300 rounded-full text-sm">
                          {alias}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedThreatActor.campaigns && selectedThreatActor.campaigns.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Associated Campaigns</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedThreatActor.campaigns.map((campaign, index) => (
                        <div key={index} className="p-3 bg-soc-dark-800 rounded-lg">
                          <span className="text-opensoc-400">{campaign}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedThreatActor.techniques && selectedThreatActor.techniques.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">MITRE ATT&CK Techniques</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedThreatActor.techniques.map((technique, index) => (
                        <span key={index} className="px-3 py-1 bg-opensoc-600/20 text-opensoc-300 rounded text-sm font-mono">
                          {technique}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedThreatActor.targetSectors && selectedThreatActor.targetSectors.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Target Sectors</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedThreatActor.targetSectors.map((sector, index) => (
                        <span key={index} className="px-3 py-1 bg-yellow-600/20 text-yellow-300 rounded text-sm">
                          {sector}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => dispatch(closeThreatActorDetailModal())}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {isCampaignDetailModalOpen && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Target className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h2 className="text-xl font-semibold text-white">{selectedCampaign.name}</h2>
                      <RecordId type="campaign" id={selectedCampaign.id} variant="badge" showPrefix={true} />
                    </div>
                    <p className="text-sm text-slate-400">Security Campaign</p>
                  </div>
                </div>
                <button
                  onClick={() => dispatch(closeCampaignDetailModal())}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Campaign Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className={selectedCampaign.isActive ? 'text-red-400' : 'text-gray-400'}>
                          {selectedCampaign.isActive ? 'Active' : 'Ended'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Severity:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(selectedCampaign.severity)}`}>
                          Level {selectedCampaign.severity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Threat Actor:</span>
                        <span className="text-opensoc-400">{selectedCampaign.threatActor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Affected Assets:</span>
                        <span className="text-white">{selectedCampaign.affectedAssets} assets</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Timeline</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Start Date:</span>
                        <span className="text-white">{formatDate(selectedCampaign.startDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">End Date:</span>
                        <span className="text-white">
                          {selectedCampaign.endDate ? formatDate(selectedCampaign.endDate) : 'Ongoing'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                  <p className="text-slate-300">{selectedCampaign.description}</p>
                </div>

                {selectedCampaign.targetSectors && selectedCampaign.targetSectors.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Target Sectors</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCampaign.targetSectors.map((sector, index) => (
                        <span key={index} className="px-3 py-1 bg-yellow-600/20 text-yellow-300 rounded text-sm">
                          {sector}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCampaign.techniques && selectedCampaign.techniques.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">MITRE ATT&CK Techniques</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCampaign.techniques.map((technique, index) => (
                        <span key={index} className="px-3 py-1 bg-opensoc-600/20 text-opensoc-300 rounded text-sm font-mono">
                          {technique}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => dispatch(closeCampaignDetailModal())}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Threat Hunting Modal */}
      {showHuntModal && huntModalData && (
        <ThreatHuntingCreateFromIntelModal
          isOpen={showHuntModal}
          onClose={handleHuntModalClose}
          onSuccess={handleHuntCreated}
          sourceType={huntModalData.type}
          sourceId={huntModalData.id}
          sourceData={huntModalData.data}
        />
      )}
    </div>
  );
};

export default ThreatIntelPage;