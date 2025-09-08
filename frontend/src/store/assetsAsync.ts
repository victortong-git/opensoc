import { createAsyncThunk } from '@reduxjs/toolkit';
import assetService from '../services/assetService';
import { Asset } from '../types';

// Fetch assets with pagination and filters
export const fetchAssets = createAsyncThunk(
  'assets/fetchAssets',
  async (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    assetType?: string | string[];
    status?: string | string[];
    criticality?: number | number[];
    location?: string | string[];
    owner?: string;
    search?: string;
    riskScoreMin?: number;
    riskScoreMax?: number;
  }) => {
    const response = await assetService.getAssets(params);
    return response;
  }
);

// Fetch single asset
export const fetchAsset = createAsyncThunk(
  'assets/fetchAsset',
  async (assetId: string) => {
    const asset = await assetService.getAsset(assetId);
    return asset;
  }
);

// Update asset
export const updateAsset = createAsyncThunk(
  'assets/updateAsset',
  async ({ 
    id, 
    updates 
  }: { 
    id: string; 
    updates: {
      name?: string;
      assetType?: 'server' | 'workstation' | 'network_device' | 'mobile' | 'iot' | 'cloud';
      ipAddress?: string;
      hostname?: string;
      os?: string;
      osVersion?: string;
      criticality?: number;
      status?: 'online' | 'offline' | 'maintenance' | 'compromised';
      location?: string;
      owner?: string;
      metadata?: Record<string, any>;
      vulnerabilityCount?: number;
      riskScore?: number;
    }
  }) => {
    const asset = await assetService.updateAsset(id, updates);
    return asset;
  }
);

// Create new asset
export const createAsset = createAsyncThunk(
  'assets/createAsset',
  async (assetData: {
    name: string;
    assetType: 'server' | 'workstation' | 'network_device' | 'mobile' | 'iot' | 'cloud';
    ipAddress: string;
    hostname: string;
    os: string;
    osVersion: string;
    criticality: number;
    status: 'online' | 'offline' | 'maintenance' | 'compromised';
    location: string;
    owner: string;
    metadata?: Record<string, any>;
  }) => {
    const asset = await assetService.createAsset(assetData);
    return asset;
  }
);

// Delete asset
export const deleteAsset = createAsyncThunk(
  'assets/deleteAsset',
  async (assetId: string) => {
    await assetService.deleteAsset(assetId);
    return assetId;
  }
);

// Fetch asset statistics
export const fetchAssetStats = createAsyncThunk(
  'assets/fetchAssetStats',
  async () => {
    const stats = await assetService.getAssetStats();
    return stats;
  }
);

// Fetch assets by incident
export const fetchAssetsByIncident = createAsyncThunk(
  'assets/fetchAssetsByIncident',
  async (incidentId: string) => {
    const assets = await assetService.getAssetsByIncident(incidentId);
    return assets;
  }
);

// Fetch incidents by asset
export const fetchIncidentsByAsset = createAsyncThunk(
  'assets/fetchIncidentsByAsset',
  async (assetId: string) => {
    const incidents = await assetService.getIncidentsByAsset(assetId);
    return incidents;
  }
);

// Fetch alerts by asset
export const fetchAlertsByAsset = createAsyncThunk(
  'assets/fetchAlertsByAsset',
  async (assetId: string) => {
    const alerts = await assetService.getAlertsByAsset(assetId);
    return alerts;
  }
);