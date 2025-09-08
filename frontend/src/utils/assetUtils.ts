import { Asset } from '../types';

/**
 * Maps backend criticality string values to display-friendly numeric values
 */
export const getCriticalityLevel = (criticality: Asset['criticality']): number => {
  switch (criticality) {
    case 'critical': return 5;
    case 'high': return 4;
    case 'medium': return 3;
    case 'low': return 2;
    default: return 1;
  }
};

/**
 * Maps backend criticality string values to display labels
 */
export const getCriticalityLabel = (criticality: Asset['criticality']): string => {
  switch (criticality) {
    case 'critical': return 'Critical';
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return 'Unknown';
  }
};

/**
 * Maps backend status values to frontend display values
 */
export const getDisplayStatus = (status: Asset['status']): 'online' | 'offline' | 'maintenance' | 'compromised' => {
  switch (status) {
    case 'active': return 'online';
    case 'inactive': return 'offline';
    case 'maintenance': return 'maintenance';
    case 'decommissioned': return 'offline';
    default: return 'offline';
  }
};

/**
 * Transforms backend asset data to include computed fields for display
 */
export const transformAssetForDisplay = (asset: Asset): Asset => {
  return {
    ...asset,
    os: asset.osType, // Map osType to os for display
    vulnerabilityCount: asset.vulnerabilityCount || 0, // Default to 0 if not provided
    riskScore: asset.riskScore || 0, // Default to 0 if not provided
  };
};

/**
 * Gets color classes for criticality display
 */
export const getCriticalityColor = (criticality: Asset['criticality']): string => {
  switch (criticality) {
    case 'critical': return 'text-red-400 bg-red-500/20';
    case 'high': return 'text-orange-400 bg-orange-500/20';
    case 'medium': return 'text-yellow-400 bg-yellow-500/20';
    case 'low': return 'text-blue-400 bg-blue-500/20';
    default: return 'text-gray-400 bg-gray-500/20';
  }
};

/**
 * Gets color classes for status display (using mapped display status)
 */
export const getStatusColor = (status: Asset['status']): string => {
  const displayStatus = getDisplayStatus(status);
  switch (displayStatus) {
    case 'online': return 'text-green-400 bg-green-500/20';
    case 'offline': return 'text-red-400 bg-red-500/20';
    case 'maintenance': return 'text-yellow-400 bg-yellow-500/20';
    case 'compromised': return 'text-red-500 bg-red-500/30 border border-red-500/50';
    default: return 'text-gray-400 bg-gray-500/20';
  }
};

/**
 * Gets color classes for risk score display
 */
export const getRiskScoreColor = (score: number): string => {
  if (score >= 80) return 'text-red-400';
  if (score >= 60) return 'text-orange-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-green-400';
};