import React, { useState } from 'react';
import { AlertTriangle, Activity, Shield, CheckCircle, Clock, Users, TrendingUp } from 'lucide-react';

interface WorkflowDistribution {
  open: { count: number; percentage: string };
  investigating: { count: number; percentage: string };
  contained: { count: number; percentage: string };
  resolved: { count: number; percentage: string };
}

interface IncidentWorkflowWidgetProps {
  workflowDistribution: WorkflowDistribution;
  totalIncidents: number;
  loading?: boolean;
  onStageClick?: (stage: string) => void;
}

const IncidentWorkflowWidget: React.FC<IncidentWorkflowWidgetProps> = ({
  workflowDistribution,
  totalIncidents,
  loading = false,
  onStageClick
}) => {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'open': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'investigating': return <Activity className="h-4 w-4 text-yellow-400" />;
      case 'contained': return <Shield className="h-4 w-4 text-blue-400" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-400" />;
      default: return null;
    }
  };

  const getStageHoverColors = (stage: string) => {
    switch (stage) {
      case 'open': return 'hover:border-red-400 hover:bg-red-500/30';
      case 'investigating': return 'hover:border-yellow-400 hover:bg-yellow-500/30';
      case 'contained': return 'hover:border-blue-400 hover:bg-blue-500/30';
      case 'resolved': return 'hover:border-green-400 hover:bg-green-500/30';
      default: return 'hover:border-slate-400 hover:bg-slate-500/30';
    }
  };

  const getStageTrend = (stage: string) => {
    // Mock trend data - in real app this would come from props
    const trends = {
      open: { direction: 'up', value: 12 },
      investigating: { direction: 'down', value: 8 },
      contained: { direction: 'up', value: 5 },
      resolved: { direction: 'up', value: 15 }
    };
    return trends[stage as keyof typeof trends] || { direction: 'stable', value: 0 };
  };

  const stages = [
    { key: 'open', name: 'Open', data: workflowDistribution.open },
    { key: 'investigating', name: 'Investigating', data: workflowDistribution.investigating },
    { key: 'contained', name: 'Contained', data: workflowDistribution.contained },
    { key: 'resolved', name: 'Resolved', data: workflowDistribution.resolved }
  ];

  if (loading) {
    return (
      <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-opensoc-500"></div>
          <span className="text-slate-400 ml-3">Loading workflow data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Incident Workflow</h3>
        <div className="text-sm text-slate-400">
          Total: <span className="text-white font-medium">{totalIncidents}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm space-y-2 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2 text-slate-400">
              <Clock className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Avg. Resolution: 4.2h</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400">
              <Users className="h-4 w-4" />
              <span className="text-xs sm:text-sm">5 Active Analysts</span>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Updated 2 min ago
          </div>
        </div>
      </div>

      {/* Enhanced Interactive Timeline */}
      <div className="bg-slate-800/20 rounded-lg p-4 border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-1 sm:space-y-0">
          <h4 className="text-sm font-medium text-slate-300">Workflow Pipeline</h4>
          <div className="text-xs text-slate-500">Click stages to filter incidents</div>
        </div>
        
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => {
            const trend = getStageTrend(stage.key);
            const isActive = stage.data.count > 0;
            const isHovered = hoveredStage === stage.key;
            
            return (
              <React.Fragment key={stage.key}>
                <div 
                  className="flex flex-col items-center space-y-2 group cursor-pointer"
                  onMouseEnter={() => setHoveredStage(stage.key)}
                  onMouseLeave={() => setHoveredStage(null)}
                  onClick={() => onStageClick?.(stage.key)}
                >
                  {/* Stage Circle */}
                  <div className={`relative p-3 rounded-full border-2 transition-all duration-200 ${
                    isActive 
                      ? stage.key === 'open' ? 'border-red-500 bg-red-500/20' :
                        stage.key === 'investigating' ? 'border-yellow-500 bg-yellow-500/20' :
                        stage.key === 'contained' ? 'border-blue-500 bg-blue-500/20' :
                        'border-green-500 bg-green-500/20'
                      : 'border-slate-600 bg-slate-800'
                  } ${getStageHoverColors(stage.key)} ${isHovered ? 'scale-110' : ''}`}>
                    {getStageIcon(stage.key)}
                    
                    {/* Count Badge */}
                    {stage.data.count > 0 && (
                      <div className="absolute -top-2 -right-2 bg-slate-900 border border-slate-600 rounded-full min-w-[24px] h-6 flex items-center justify-center">
                        <span className="text-xs font-bold text-white px-1">{stage.data.count}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Stage Info */}
                  <div className="text-center space-y-1 px-1">
                    <div className="text-xs font-medium text-slate-300 truncate">{stage.name}</div>
                    <div className="text-xs text-slate-500">{stage.data.percentage}%</div>
                    
                    {/* Trend Indicator */}
                    {trend.value > 0 && (
                      <div className={`flex items-center justify-center space-x-1 text-xs ${
                        trend.direction === 'up' ? 'text-red-400' : 
                        trend.direction === 'down' ? 'text-green-400' : 'text-slate-400'
                      }`}>
                        <TrendingUp className={`h-3 w-3 ${
                          trend.direction === 'down' ? 'rotate-180' : 
                          trend.direction === 'stable' ? 'rotate-90' : ''
                        }`} />
                        <span>{trend.value}%</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Hover Tooltip - Better mobile positioning */}
                  {isHovered && (
                    <div className="absolute top-full mt-2 bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg z-20 min-w-[180px] left-1/2 transform -translate-x-1/2 sm:left-0 sm:transform-none sm:min-w-[200px]">
                      <div className="text-sm font-medium text-white mb-2">Recent Activity</div>
                      <div className="space-y-1 text-xs text-slate-300">
                        <div>• Last update: 5 min ago</div>
                        <div>• Avg. time in stage: 2.3h</div>
                        <div>• {stage.data.count > 0 ? 'Click to view incidents' : 'No active incidents'}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Connection Line */}
                {index < stages.length - 1 && (
                  <div className={`flex-1 mx-2 sm:mx-4 h-px transition-colors duration-200 ${
                    isActive ? 'bg-slate-500' : 'bg-slate-700'
                  } group-hover:bg-slate-400`}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        {/* Summary Actions */}
        <div className="mt-6 pt-4 border-t border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs space-y-2 sm:space-y-0">
            <div className="text-slate-400">
              Pipeline efficiency: <span className="text-green-400 font-medium">87%</span>
            </div>
            <button className="text-blue-400 hover:text-blue-300 transition-colors text-left sm:text-right">
              View detailed workflow →
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default IncidentWorkflowWidget;