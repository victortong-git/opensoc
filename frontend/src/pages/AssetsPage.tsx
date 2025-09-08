import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Server, 
  Laptop, 
  Router, 
  Smartphone, 
  Shield,
  Cloud,
  Search,
  RefreshCw,
  AlertTriangle,
  Eye,
  Activity,
  Edit3,
  Trash2
} from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { Asset } from '../types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fetchAssets, deleteAsset } from '../store/assetsAsync';
import { setFilters, setPagination, setPageSize } from '../store/assetsSlice';
import Pagination from '../components/common/Pagination';
import RowsPerPageSelector from '../components/common/RowsPerPageSelector';
import RecordId from '../components/common/RecordId';
import TestDataChip from '../components/common/TestDataChip';
import {
  transformAssetForDisplay,
  getCriticalityLabel,
  getCriticalityColor,
  getStatusColor,
  getDisplayStatus,
  getRiskScoreColor
} from '../utils/assetUtils';
import AssetEditModal from '../components/assets/AssetEditModal';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';

const AssetsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { assets, filteredAssets, isLoading, pagination } = useSelector((state: RootState) => state.assets);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refresh asset data
  const handleRefresh = () => {
    dispatch(fetchAssets({
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
    }));
  };

  // Load assets on component mount with debouncing to prevent rapid-fire requests
  useEffect(() => {
    // Only fetch if we have valid page numbers and we're not currently loading
    if (pagination.currentPage > 0 && !isLoading) {
      // Add a small delay to debounce rapid state changes
      const timeoutId = setTimeout(() => {
        dispatch(fetchAssets({
          page: pagination.currentPage,
          limit: pagination.itemsPerPage,
        }));
      }, 100);
      
      // Cleanup timeout on dependency change
      return () => clearTimeout(timeoutId);
    }
  }, [dispatch, pagination.currentPage, pagination.itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    dispatch(setPagination({ page, limit: pagination.itemsPerPage }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    dispatch(setPageSize(pageSize));
  };

  // Handle search and filter updates
  useEffect(() => {
    const filters: any = {};
    if (searchTerm) filters.search = searchTerm;
    if (statusFilter) filters.status = [statusFilter];
    if (typeFilter) filters.assetType = [typeFilter];
    
    dispatch(setFilters(filters));
  }, [dispatch, searchTerm, statusFilter, typeFilter]);

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setShowEditModal(true);
  };

  const handleSaveAsset = async (updatedData: Partial<Asset>) => {
    if (!editingAsset) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/assets/${editingAsset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingAsset(null);
        // Refresh assets list
        dispatch(fetchAssets({
          page: pagination.currentPage,
          limit: pagination.itemsPerPage,
        }));
      } else {
        console.error('Failed to update asset');
      }
    } catch (error) {
      console.error('Error updating asset:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAsset = (asset: Asset) => {
    setDeletingAsset(asset);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAsset) return;

    try {
      setIsDeleting(true);
      await dispatch(deleteAsset(deletingAsset.id)).unwrap();
      setShowDeleteModal(false);
      setDeletingAsset(null);
    } catch (error) {
      console.error('Error deleting asset:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingAsset(null);
  };

  // Safe date parsing helper
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


  // Safe number conversion helper
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined || value === '') return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'server': return Server;
      case 'workstation': return Laptop;
      case 'network_device': return Router;
      case 'mobile': return Smartphone;
      case 'cloud': return Cloud;
      case 'iot': return Shield;
      default: return Shield;
    }
  };


  // Utility functions moved to assetUtils.ts



  const statusCounts = assets.reduce((acc, asset) => {
    acc[asset.status] = (acc[asset.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Asset Inventory</h1>
          <p className="text-slate-400 mt-1">
            Monitor and manage your organization's IT assets
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center space-x-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-opensoc-600 text-white' : 'bg-soc-dark-800 text-slate-400 hover:text-white'}`}
          >
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
            </div>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-opensoc-600 text-white' : 'bg-soc-dark-800 text-slate-400 hover:text-white'}`}
          >
            <div className="w-4 h-4 flex flex-col gap-0.5">
              <div className="bg-current h-0.5 rounded-sm"></div>
              <div className="bg-current h-0.5 rounded-sm"></div>
              <div className="bg-current h-0.5 rounded-sm"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Assets</p>
              <p className="text-2xl font-bold text-white">{pagination.totalItems}</p>
            </div>
            <Server className="h-8 w-8 text-opensoc-400" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Online</p>
              <p className="text-2xl font-bold text-green-400">{statusCounts.online || 0}</p>
            </div>
            <Activity className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">At Risk</p>
              <p className="text-2xl font-bold text-red-400">{(statusCounts.compromised || 0) + (statusCounts.offline || 0)}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Vulnerabilities</p>
              <p className="text-2xl font-bold text-yellow-400">
                {assets.reduce((sum, asset) => sum + safeNumber(asset.vulnerabilityCount, 0), 0)}
              </p>
            </div>
            <Shield className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search assets by name, IP, hostname..."
                className="input-field pl-10 pr-4 py-2 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Types</option>
              <option value="server">Servers</option>
              <option value="workstation">Workstations</option>
              <option value="network_device">Network Devices</option>
              <option value="mobile">Mobile</option>
              <option value="cloud">Cloud</option>
              <option value="iot">IoT Devices</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
              <option value="compromised">Compromised</option>
            </select>

            <RowsPerPageSelector
              value={pagination.itemsPerPage}
              onChange={handlePageSizeChange}
              disabled={isLoading}
            />

            <div className="text-sm text-slate-400">
              {pagination.totalItems} assets
            </div>
          </div>
        </div>
      </div>

      {/* Assets Display */}
      {isLoading ? (
        <div className="card p-12 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-slate-400">Loading assets...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="card p-12 text-center">
          <Server className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No assets found</h3>
          <p className="text-slate-400">No assets match your current filters.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => {
            const Icon = getAssetIcon(asset.assetType);
            const displayAsset = transformAssetForDisplay(asset);
            const displayStatus = getDisplayStatus(asset.status);
            
            return (
              <div 
                key={asset.id} 
                className="card p-6 hover:bg-soc-dark-800/50 transition-colors cursor-pointer group"
                onClick={() => navigate(`/assets/${asset.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-opensoc-500/20 rounded-lg">
                      <Icon className="h-5 w-5 text-opensoc-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1 flex-wrap">
                        <h3 className="text-white font-medium text-sm">{asset.name}</h3>
                        <RecordId type="asset" id={asset.id} variant="inline" showPrefix={false} />
                        {asset.isTestData && <TestDataChip size="sm" />}
                      </div>
                      <p className="text-slate-400 text-xs font-mono">{asset.ipAddress}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                      {displayStatus}
                    </span>
                    <span className={`px-2 py-1 rounded border text-xs font-medium ${getCriticalityColor(asset.criticality)}`}>
                      {getCriticalityLabel(asset.criticality)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">OS</span>
                    <span className="text-white font-medium">{displayAsset.os}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Location</span>
                    <span className="text-white">{asset.location}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Owner</span>
                    <span className="text-opensoc-400">{asset.owner}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Vulnerabilities</span>
                    <span className={`font-medium ${safeNumber(displayAsset.vulnerabilityCount, 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {safeNumber(displayAsset.vulnerabilityCount, 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Risk Score</span>
                    <span className={`font-medium ${getRiskScoreColor(safeNumber(displayAsset.riskScore, 0))}`}>
                      {safeNumber(displayAsset.riskScore, 0)}/100
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Last Seen</span>
                    <span className="text-slate-400">
                      {safeFormatDistance(asset.lastSeen)}
                    </span>
                  </div>
                </div>

                {/* Risk Score Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Risk Level</span>
                    <span>{safeNumber(displayAsset.riskScore, 0)}%</span>
                  </div>
                  <div className="w-full bg-soc-dark-700 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full ${
                        safeNumber(displayAsset.riskScore, 0) >= 80 ? 'bg-red-500' :
                        safeNumber(displayAsset.riskScore, 0) >= 60 ? 'bg-orange-500' :
                        safeNumber(displayAsset.riskScore, 0) >= 40 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${safeNumber(displayAsset.riskScore, 0)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-soc-dark-700 flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    Last seen {safeFormatDistance(asset.lastSeen)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-xs text-opensoc-400">
                      <Eye className="h-3 w-3" />
                      <span>View Details</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAsset(asset);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-400 rounded transition-colors"
                      title="Edit asset"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAsset(asset);
                      }}
                      className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                      title="Delete asset"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-soc-dark-800">
                <tr>
                  <th className="table-header">Asset ID</th>
                  <th className="table-header">Asset</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">IP Address</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">OS</th>
                  <th className="table-header">Criticality</th>
                  <th className="table-header">Risk Score</th>
                  <th className="table-header">Vulnerabilities</th>
                  <th className="table-header">Last Seen</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-soc-dark-900">
                {filteredAssets.map((asset) => {
                  const Icon = getAssetIcon(asset.assetType);
                  const displayAsset = transformAssetForDisplay(asset);
                  const displayStatus = getDisplayStatus(asset.status);
                  
                  return (
                    <tr key={asset.id} className="table-row group cursor-pointer hover:bg-soc-dark-800/50" onClick={() => navigate(`/assets/${asset.id}`)}>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <RecordId type="asset" id={asset.id} variant="table" />
                          {asset.isTestData && <TestDataChip size="sm" />}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-4 w-4 text-opensoc-400" />
                          <div>
                            <div className="font-medium text-white">{asset.name}</div>
                            <div className="text-xs text-slate-400">{asset.hostname}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="capitalize">{asset.assetType.replace('_', ' ')}</span>
                      </td>
                      <td className="table-cell">
                        <span className="font-mono">{asset.ipAddress}</span>
                      </td>
                      <td className="table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm">{displayAsset.os}</span>
                      </td>
                      <td className="table-cell">
                        <span className={`px-2 py-1 rounded border text-xs font-medium ${getCriticalityColor(asset.criticality)}`}>
                          {getCriticalityLabel(asset.criticality)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`font-medium ${getRiskScoreColor(safeNumber(displayAsset.riskScore, 0))}`}>
                          {safeNumber(displayAsset.riskScore, 0)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`font-medium ${safeNumber(displayAsset.vulnerabilityCount, 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {safeNumber(displayAsset.vulnerabilityCount, 0)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-slate-400">
                          {safeFormatDistance(asset.lastSeen)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/assets/${asset.id}`);
                            }}
                            className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-700 rounded transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAsset(asset);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-soc-dark-700 rounded transition-colors"
                            title="Edit asset"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAsset(asset);
                            }}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-soc-dark-700 rounded transition-colors"
                            title="Delete asset"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filteredAssets.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      )}

      {/* Edit Asset Modal */}
      <AssetEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveAsset}
        asset={editingAsset}
        isLoading={isUpdating}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Asset"
        message={`Are you sure you want to delete asset "${deletingAsset?.name || 'Unknown'}"? This action cannot be undone.`}
        confirmText={deletingAsset?.name || ''}
        dangerLevel="high"
        isLoading={isDeleting}
      />

    </div>
  );
};

export default AssetsPage;