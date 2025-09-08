import React, { useState, useEffect } from 'react';
import { X, Save, Server } from 'lucide-react';
import { Asset } from '../../types';

interface AssetEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Partial<Asset>) => void;
  asset: Asset | null;
  isLoading?: boolean;
}

const AssetEditModal: React.FC<AssetEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  asset,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    assetType: 'server' as Asset['assetType'],
    ipAddress: '',
    hostname: '',
    osType: '',
    osVersion: '',
    criticality: 'medium' as Asset['criticality'],
    status: 'active' as Asset['status'],
    location: '',
    owner: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || '',
        assetType: asset.assetType || 'server',
        ipAddress: asset.ipAddress || '',
        hostname: asset.hostname || '',
        osType: asset.osType || '',
        osVersion: asset.osVersion || '',
        criticality: asset.criticality || 'medium',
        status: asset.status || 'active',
        location: asset.location || '',
        owner: asset.owner || '',
      });
    }
  }, [asset]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required';
    }

    if (!formData.ipAddress.trim()) {
      newErrors.ipAddress = 'IP address is required';
    } else {
      // Basic IP address validation
      const ipRegex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
      if (!ipRegex.test(formData.ipAddress)) {
        newErrors.ipAddress = 'Please enter a valid IP address';
      }
    }

    if (!formData.hostname.trim()) {
      newErrors.hostname = 'Hostname is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.owner.trim()) {
      newErrors.owner = 'Owner is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-300 bg-green-500/20';
      case 'inactive': return 'text-gray-300 bg-gray-500/20';
      case 'maintenance': return 'text-yellow-300 bg-yellow-500/20';
      case 'decommissioned': return 'text-red-300 bg-red-500/20';
      default: return 'text-gray-300 bg-gray-500/20';
    }
  };

  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Server className="w-6 h-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Asset
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Asset Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter asset name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="assetType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Asset Type
              </label>
              <select
                id="assetType"
                name="assetType"
                value={formData.assetType}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="server">Server</option>
                <option value="workstation">Workstation</option>
                <option value="network_device">Network Device</option>
                <option value="mobile_device">Mobile Device</option>
                <option value="iot_device">IoT Device</option>
                <option value="virtual_machine">Virtual Machine</option>
                <option value="container">Container</option>
                <option value="cloud_service">Cloud Service</option>
              </select>
            </div>

            <div>
              <label htmlFor="criticality" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Criticality
              </label>
              <div className="flex items-center space-x-3">
                <select
                  id="criticality"
                  name="criticality"
                  value={formData.criticality}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                           disabled:opacity-50 disabled:cursor-not-allowed
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <div className={`w-4 h-4 rounded ${getCriticalityColor(formData.criticality)}`}></div>
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="decommissioned">Decommissioned</option>
              </select>
            </div>

            <div>
              <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                IP Address *
              </label>
              <input
                type="text"
                id="ipAddress"
                name="ipAddress"
                value={formData.ipAddress}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         ${errors.ipAddress ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="192.168.1.100"
              />
              {errors.ipAddress && <p className="mt-1 text-sm text-red-600">{errors.ipAddress}</p>}
            </div>
          </div>

          {/* Network Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="hostname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hostname *
              </label>
              <input
                type="text"
                id="hostname"
                name="hostname"
                value={formData.hostname}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         ${errors.hostname ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="server01.example.com"
              />
              {errors.hostname && <p className="mt-1 text-sm text-red-600">{errors.hostname}</p>}
            </div>

            <div>
              <label htmlFor="osType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Operating System
              </label>
              <input
                type="text"
                id="osType"
                name="osType"
                value={formData.osType}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Windows Server 2019"
              />
            </div>

            <div>
              <label htmlFor="osVersion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                OS Version
              </label>
              <input
                type="text"
                id="osVersion"
                name="osVersion"
                value={formData.osVersion}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="10.0.17763"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed
                         ${errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Data Center 1"
              />
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </div>
          </div>

          {/* Ownership Information */}
          <div>
            <label htmlFor="owner" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Owner *
            </label>
            <input
              type="text"
              id="owner"
              name="owner"
              value={formData.owner}
              onChange={handleInputChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed
                       ${errors.owner ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="IT Department"
            />
            {errors.owner && <p className="mt-1 text-sm text-red-600">{errors.owner}</p>}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                       bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 
                       rounded-md hover:bg-gray-50 dark:hover:bg-slate-600
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                       rounded-md disabled:opacity-50 disabled:cursor-not-allowed
                       focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetEditModal;