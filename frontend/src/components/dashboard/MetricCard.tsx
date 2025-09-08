import React from 'react';
import { LucideIcon, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color: 'red' | 'orange' | 'yellow' | 'blue' | 'green' | 'purple';
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  subtitle
}) => {
  const colorClasses = {
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  };

  const getChangeIcon = () => {
    if (!change) return <Minus className="h-3 w-3" />;
    if (change > 0) return <ArrowUp className="h-3 w-3" />;
    return <ArrowDown className="h-3 w-3" />;
  };

  const getChangeColor = () => {
    if (!change) return 'text-slate-400';
    if (change > 0) return 'text-green-400';
    return 'text-red-400';
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-slate-400 text-sm font-medium mb-1">
            {title}
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {value}
          </div>
          {subtitle && (
            <div className="text-slate-500 text-xs">
              {subtitle}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          
          {change !== undefined && (
            <div className={`flex items-center space-x-1 text-xs ${getChangeColor()}`}>
              {getChangeIcon()}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;