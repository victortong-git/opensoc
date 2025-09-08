import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Server, 
  Laptop, 
  Router, 
  Smartphone, 
  Shield,
  Cloud,
  ArrowLeft,
  Activity,
  Edit3,
  Trash2
} from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { Asset } from '../types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fetchAssets, deleteAsset } from '../store/assetsAsync';
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

const AssetDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { assets, isLoading } = useSelector((state: RootState) => state.assets);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const safeFormatLocaleString = (dateValue: string | Date): string => {
    try {
      const parsedDate = safeParseDate(dateValue);
      if (isNaN(parsedDate.getTime())) return 'Unknown';
      return parsedDate.toLocaleString();
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

  const handleEditAsset = () => {
    setShowEditModal(true);
  };

  const handleSaveAsset = async (updatedData: Partial<Asset>) => {
    if (!asset) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        const updatedAsset = await response.json();
        setAsset(updatedAsset);
        setShowEditModal(false);
      } else {
        console.error('Failed to update asset');
      }
    } catch (error) {
      console.error('Error updating asset:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAsset = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!asset?.id) return;

    try {
      setIsDeleting(true);
      await dispatch(deleteAsset(asset.id)).unwrap();
      navigate('/assets'); // Navigate back to assets list
    } catch (error) {
      console.error('Error deleting asset:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  // Load assets if not already loaded
  useEffect(() => {
    if (assets.length === 0 && !isLoading) {
      dispatch(fetchAssets({ page: 1, limit: 100 }));
    }
  }, [dispatch, assets.length, isLoading]);

  // Find the asset by ID
  useEffect(() => {
    if (id && assets.length > 0) {
      const foundAsset = assets.find(a => a.id === id);
      if (foundAsset) {
        setAsset(foundAsset);
        setNotFound(false);
      } else {
        setAsset(null);
        setNotFound(true);
      }
    }
  }, [id, assets]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/assets')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Assets</span>
          </button>
        </div>
        <div className="card p-12 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-slate-400">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (notFound || !asset) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/assets')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Assets</span>
          </button>
        </div>
        <div className="card p-12 text-center">
          <Shield className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Asset not found</h3>
          <p className="text-slate-400">The asset you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const displayAsset = transformAssetForDisplay(asset);
  const displayStatus = getDisplayStatus(asset.status);
  const Icon = getAssetIcon(asset.assetType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/assets')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Assets</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-opensoc-500/20 rounded-lg">
              <Icon className="h-8 w-8 text-opensoc-400" />
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-3xl font-bold text-white">{asset.name}</h1>
                <RecordId type="asset" id={asset.id} variant="badge" showPrefix={true} />
                {asset.isTestData && <TestDataChip />}
              </div>
              <p className="text-slate-400 font-mono">{asset.ipAddress}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(asset.status)}`}>
            {displayStatus}
          </span>
          <span className={`px-3 py-2 rounded border text-sm font-medium ${getCriticalityColor(asset.criticality)}`}>
            {getCriticalityLabel(asset.criticality)}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Asset Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Asset Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-white capitalize">{asset.assetType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hostname:</span>
                  <span className="text-white font-mono">{asset.hostname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IP Address:</span>
                  <span className="text-white font-mono">{asset.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-white">{asset.location}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Operating System:</span>
                  <span className="text-white">{displayAsset.os}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">OS Version:</span>
                  <span className="text-white">{asset.osVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Owner:</span>
                  <span className="text-opensoc-400">{asset.owner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Organization:</span>
                  <span className="text-white">{asset.organizationId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Status */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Security Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="card p-4 bg-soc-dark-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Vulnerabilities</span>
                  <span className={`text-xl font-bold ${safeNumber(displayAsset.vulnerabilityCount, 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {safeNumber(displayAsset.vulnerabilityCount, 0)}
                  </span>
                </div>
              </div>
              <div className="card p-4 bg-soc-dark-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Risk Score</span>
                  <span className={`text-xl font-bold ${getRiskScoreColor(safeNumber(displayAsset.riskScore, 0))}`}>
                    {safeNumber(displayAsset.riskScore, 0)}/100
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Overall Risk Level</span>
                <span>{safeNumber(displayAsset.riskScore, 0)}%</span>
              </div>
              <div className="w-full bg-soc-dark-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    safeNumber(displayAsset.riskScore, 0) >= 80 ? 'bg-red-500' :
                    safeNumber(displayAsset.riskScore, 0) >= 60 ? 'bg-orange-500' :
                    safeNumber(displayAsset.riskScore, 0) >= 40 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${safeNumber(displayAsset.riskScore, 0)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          {asset.metadata && Object.keys(asset.metadata).length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(asset.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="text-white">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Activity & Status */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-green-400" />
                  <span className="text-slate-400">Status</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                  {displayStatus}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-yellow-400" />
                  <span className="text-slate-400">Criticality</span>
                </div>
                <span className={`px-2 py-1 rounded border text-xs font-medium ${getCriticalityColor(asset.criticality)}`}>
                  {getCriticalityLabel(asset.criticality)}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Last Seen:</span>
                <span className="text-white text-sm">{safeFormatLocaleString(asset.lastSeen)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Created:</span>
                <span className="text-white text-sm">{safeFormatLocaleString(asset.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Updated:</span>
                <span className="text-white text-sm">{safeFormatLocaleString(asset.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Actions</h2>
            <div className="space-y-3">
              <button className="w-full btn-secondary text-left">
                View Security Events
              </button>
              <button className="w-full btn-secondary text-left">
                Run Vulnerability Scan
              </button>
              <button 
                onClick={handleEditAsset}
                className="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Asset</span>
              </button>
              <button 
                onClick={handleDeleteAsset}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Asset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Asset Modal */}
      <AssetEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveAsset}
        asset={asset}
        isLoading={isUpdating}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Asset"
        message={`Are you sure you want to delete asset "${asset?.name || 'Unknown'}"? This action cannot be undone.`}
        confirmText={asset?.name || ''}
        dangerLevel="high"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AssetDetailsPage;