import React from 'react';
import { Shield, AlertTriangle, Zap } from 'lucide-react';

interface ThreatLevelIndicatorProps {
  level: 'low' | 'medium' | 'high' | 'critical';
}

const ThreatLevelIndicator: React.FC<ThreatLevelIndicatorProps> = ({ level }) => {
  const getLevelConfig = () => {
    switch (level) {
      case 'critical':
        return {
          color: 'red',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-400',
          icon: Zap,
          description: 'Immediate action required. Multiple active threats detected.',
          pulse: 'animate-pulse'
        };
      case 'high':
        return {
          color: 'orange',
          bgColor: 'bg-orange-500/20',
          borderColor: 'border-orange-500/30',
          textColor: 'text-orange-400',
          icon: AlertTriangle,
          description: 'Elevated threat activity. Enhanced monitoring active.',
          pulse: 'animate-pulse-slow'
        };
      case 'medium':
        return {
          color: 'yellow',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          textColor: 'text-yellow-400',
          icon: Shield,
          description: 'Normal security posture with some alerts.',
          pulse: ''
        };
      default: // low
        return {
          color: 'green',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-400',
          icon: Shield,
          description: 'All systems secure. Normal operations.',
          pulse: ''
        };
    }
  };

  const config = getLevelConfig();
  const Icon = config.icon;

  return (
    <div className={`card p-6 ${config.bgColor} border-2 ${config.borderColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`p-4 rounded-full ${config.bgColor} ${config.pulse}`}>
            <Icon className={`h-8 w-8 ${config.textColor}`} />
          </div>
          <div>
            <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">
              Current Threat Level
            </div>
            <div className={`text-2xl font-bold ${config.textColor} uppercase`}>
              {level}
            </div>
            <div className="text-slate-300 text-sm mt-1">
              {config.description}
            </div>
          </div>
        </div>

        {/* Threat Level Meter */}
        <div className="flex flex-col items-end space-y-2">
          <div className="text-xs text-slate-400 uppercase tracking-wider">
            Security Status
          </div>
          <div className="flex space-x-1">
            {['low', 'medium', 'high', 'critical'].map((levelItem, index) => {
              const isActive = ['low', 'medium', 'high', 'critical'].indexOf(level) >= index;
              const levelColors = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
              
              return (
                <div
                  key={levelItem}
                  className={`w-3 h-8 rounded-sm ${
                    isActive ? levelColors[index] : 'bg-soc-dark-700'
                  }`}
                />
              );
            })}
          </div>
          <div className="text-xs text-slate-500">
            Risk Meter
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="mt-4 pt-4 border-t border-soc-dark-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-white">12</div>
            <div className="text-xs text-slate-400">Active Alerts</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-white">3</div>
            <div className="text-xs text-slate-400">Investigations</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-white">98.7%</div>
            <div className="text-xs text-slate-400">Uptime</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatLevelIndicator;