import React from 'react';
import { useSelector } from 'react-redux';
import { Server, Laptop, Router, Smartphone, Shield, AlertTriangle } from 'lucide-react';
import { RootState } from '../../store';

const AssetStatusGrid: React.FC = () => {
  const { assets } = useSelector((state: RootState) => state.assets);

  // Fallback asset data when Redux store is empty
  const fallbackAssets = [
    { id: '1', assetType: 'server', status: 'online', name: 'WEB-SERVER-01' },
    { id: '2', assetType: 'server', status: 'online', name: 'DB-SERVER-01' },
    { id: '3', assetType: 'server', status: 'maintenance', name: 'BACKUP-SERVER-01' },
    { id: '4', assetType: 'workstation', status: 'online', name: 'WORKSTATION-101' },
    { id: '5', assetType: 'workstation', status: 'online', name: 'WORKSTATION-102' },
    { id: '6', assetType: 'workstation', status: 'offline', name: 'WORKSTATION-103' },
    { id: '7', assetType: 'network_device', status: 'online', name: 'FIREWALL-01' },
    { id: '8', assetType: 'network_device', status: 'online', name: 'SWITCH-01' },
    { id: '9', assetType: 'mobile', status: 'online', name: 'TABLET-SEC-01' },
    { id: '10', assetType: 'mobile', status: 'compromised', name: 'LAPTOP-SEC-01' }
  ];

  // Use actual assets if available, otherwise use fallback
  const displayAssets = assets.length > 0 ? assets : fallbackAssets;

  // Group assets by type and calculate stats
  const assetStats = displayAssets.reduce((acc, asset) => {
    // Map API asset types to display types
    let type = asset.assetType;
    if (type === 'mobile_device') type = 'mobile';
    if (type === 'iot_device') type = 'iot';
    
    // Map API status to expected status
    let status = asset.status;
    if (status === 'active') status = 'online';
    if (status === 'inactive') status = 'offline';
    
    if (!acc[type]) {
      acc[type] = {
        total: 0,
        online: 0,
        offline: 0,
        maintenance: 0,
        compromised: 0
      };
    }
    
    acc[type].total++;
    // Safely increment status count, default to offline if status not recognized
    if (acc[type][status] !== undefined) {
      acc[type][status]++;
    } else {
      acc[type].offline++;
    }
    
    return acc;
  }, {} as Record<string, any>);

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'server': return Server;
      case 'workstation': return Laptop;
      case 'network_device': return Router;
      case 'mobile': return Smartphone;
      case 'iot': return Shield;
      default: return Shield;
    }
  };

  const getStatusColor = (status: string, count: number) => {
    if (count === 0) return 'text-slate-600';
    
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'maintenance': return 'text-yellow-400';
      case 'compromised': return 'text-red-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Asset Status Overview</h2>
        <div className="text-sm text-slate-400">
          {displayAssets.length} total assets
          {assets.length === 0 && displayAssets.length > 0 && (
            <span className="ml-2 text-xs text-yellow-400">(demo)</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(assetStats).map(([type, stats]) => {
          const Icon = getAssetIcon(type);
          const onlinePercentage = stats.total > 0 ? (stats.online / stats.total) * 100 : 0;
          
          return (
            <div
              key={type}
              className="p-4 bg-soc-dark-800/30 border border-soc-dark-700 rounded-lg hover:bg-soc-dark-800/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5 text-opensoc-400" />
                  <span className="text-sm font-medium text-white capitalize">
                    {type.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-lg font-bold text-white">{stats.total}</span>
              </div>

              {/* Status breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className={getStatusColor('online', stats.online)}>Online</span>
                  <span className="text-white font-medium">{stats.online}</span>
                </div>
                
                {stats.offline > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className={getStatusColor('offline', stats.offline)}>Offline</span>
                    <span className="text-white font-medium">{stats.offline}</span>
                  </div>
                )}
                
                {stats.maintenance > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className={getStatusColor('maintenance', stats.maintenance)}>Maintenance</span>
                    <span className="text-white font-medium">{stats.maintenance}</span>
                  </div>
                )}
                
                {stats.compromised > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span className={getStatusColor('compromised', stats.compromised)}>Compromised</span>
                    </div>
                    <span className="text-white font-medium">{stats.compromised}</span>
                  </div>
                )}
              </div>

              {/* Health bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Health</span>
                  <span>{onlinePercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-soc-dark-700 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full ${
                      onlinePercentage >= 90 ? 'bg-green-500' :
                      onlinePercentage >= 70 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${onlinePercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="mt-6 pt-4 border-t border-soc-dark-700">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-400">
              {displayAssets.filter(a => a.status === 'active' || a.status === 'online').length}
            </div>
            <div className="text-xs text-slate-400">Online</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-400">
              {displayAssets.filter(a => a.status === 'offline' || a.status === 'inactive').length}
            </div>
            <div className="text-xs text-slate-400">Offline</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-400">
              {displayAssets.filter(a => a.status === 'maintenance').length}
            </div>
            <div className="text-xs text-slate-400">Maintenance</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-500">
              {displayAssets.filter(a => a.status === 'compromised').length}
            </div>
            <div className="text-xs text-slate-400">At Risk</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetStatusGrid;