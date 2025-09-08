import { apiRequest } from './api';
import { Asset } from '../types';

export interface AssetsResponse {
  assets: Asset[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateAssetRequest {
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
}

export interface UpdateAssetRequest {
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

export interface AssetStats {
  totalAssets: number;
  assetTypeBreakdown: { assetType: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  criticalityBreakdown: { criticality: number; count: number }[];
  riskDistribution: { riskRange: string; count: number }[];
  vulnerabilityCounts: { vulnerabilityCount: number; count: number }[];
}

class AssetService {
  // Get assets with filtering and pagination
  async getAssets(params?: {
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
  }): Promise<AssetsResponse> {
    const response = await apiRequest.get<AssetsResponse>('/assets', { params });
    return response;
  }

  // Get single asset
  async getAsset(id: string): Promise<Asset> {
    const response = await apiRequest.get<{ asset: Asset }>(`/assets/${id}`);
    return response.data.asset;
  }

  // Create new asset
  async createAsset(data: CreateAssetRequest): Promise<Asset> {
    const response = await apiRequest.post<{ asset: Asset; message: string }>('/assets', data);
    return response.data.asset;
  }

  // Update asset
  async updateAsset(id: string, data: UpdateAssetRequest): Promise<Asset> {
    const response = await apiRequest.put<{ asset: Asset; message: string }>(`/assets/${id}`, data);
    return response.data.asset;
  }

  // Delete asset
  async deleteAsset(id: string): Promise<void> {
    await apiRequest.delete<{ message: string }>(`/assets/${id}`);
  }

  // Get asset statistics
  async getAssetStats(): Promise<AssetStats> {
    const response = await apiRequest.get<AssetStats>('/assets/stats');
    return response.data;
  }

  // Get assets by incident
  async getAssetsByIncident(incidentId: string): Promise<Asset[]> {
    const response = await apiRequest.get<{ assets: Asset[] }>(`/incidents/${incidentId}/assets`);
    return response.data.assets;
  }

  // Get incidents for asset
  async getIncidentsByAsset(assetId: string): Promise<any[]> {
    const response = await apiRequest.get<{ incidents: any[] }>(`/assets/${assetId}/incidents`);
    return response.data.incidents;
  }

  // Get alerts for asset
  async getAlertsByAsset(assetId: string): Promise<any[]> {
    const response = await apiRequest.get<{ alerts: any[] }>(`/assets/${assetId}/alerts`);
    return response.data.alerts;
  }
}

export const assetService = new AssetService();
export default assetService;