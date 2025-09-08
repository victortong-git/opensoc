import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Users,
  Bot,
  Activity,
  CheckCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { AgentActivity } from '../../types';
import { format, subDays, startOfDay } from 'date-fns';

interface AgentProductivityChartsProps {
  activities: AgentActivity[];
  className?: string;
}

interface DailyActivity {
  date: string;
  total: number;
  taskCompleted: number;
  collaboration: number;
  errors: number;
  learningUpdates: number;
}

interface HourlyActivity {
  hour: number;
  count: number;
  peakActivity?: boolean;
}

const AgentProductivityCharts: React.FC<AgentProductivityChartsProps> = ({
  activities,
  className = ''
}) => {
  // Generate last 7 days of data
  const getDailyActivityData = (): DailyActivity[] => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'MMM dd'),
        total: 0,
        taskCompleted: 0,
        collaboration: 0,
        errors: 0,
        learningUpdates: 0
      };
    });

    activities.forEach(activity => {
      const activityDate = format(new Date(activity.timestamp), 'MMM dd');
      const dayData = last7Days.find(day => day.date === activityDate);
      
      if (dayData) {
        dayData.total += 1;
        switch (activity.activityType) {
          case 'task_completed':
            dayData.taskCompleted += 1;
            break;
          case 'collaboration':
            dayData.collaboration += 1;
            break;
          case 'error':
            dayData.errors += 1;
            break;
          case 'learning_update':
            dayData.learningUpdates += 1;
            break;
        }
      }
    });

    return last7Days;
  };

  // Generate hourly activity data for today
  const getHourlyActivityData = (): HourlyActivity[] => {
    const hourlyData: HourlyActivity[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0
    }));

    const today = startOfDay(new Date());
    const todayActivities = activities.filter(activity => 
      startOfDay(new Date(activity.timestamp)).getTime() === today.getTime()
    );

    todayActivities.forEach(activity => {
      const hour = new Date(activity.timestamp).getHours();
      hourlyData[hour].count += 1;
    });

    // Mark peak hours (top 25% activity)
    const maxCount = Math.max(...hourlyData.map(h => h.count));
    const threshold = maxCount * 0.7;
    hourlyData.forEach(hour => {
      hour.peakActivity = hour.count >= threshold && hour.count > 0;
    });

    return hourlyData;
  };

  // Calculate summary metrics
  const getSummaryMetrics = () => {
    const totalActivities = activities.length;
    const completedTasks = activities.filter(a => a.activityType === 'task_completed').length;
    const collaborations = activities.filter(a => a.activityType === 'collaboration').length;
    const errors = activities.filter(a => a.activityType === 'error').length;
    const avgImpact = activities.reduce((sum, a) => {
      const impactValue = { low: 1, medium: 2, high: 3 }[a.impact] || 1;
      return sum + impactValue;
    }, 0) / Math.max(totalActivities, 1);

    return { totalActivities, completedTasks, collaborations, errors, avgImpact };
  };

  const dailyData = getDailyActivityData();
  const hourlyData = getHourlyActivityData();
  const metrics = getSummaryMetrics();
  const maxHourly = Math.max(...hourlyData.map(h => h.count));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-soc-dark-800/30 p-4 rounded-lg border border-soc-dark-700">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-slate-400">Total Activities</span>
          </div>
          <div className="text-xl font-bold text-white">{metrics.totalActivities}</div>
        </div>
        
        <div className="bg-soc-dark-800/30 p-4 rounded-lg border border-soc-dark-700">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-xs text-slate-400">Tasks Completed</span>
          </div>
          <div className="text-xl font-bold text-green-400">{metrics.completedTasks}</div>
        </div>
        
        <div className="bg-soc-dark-800/30 p-4 rounded-lg border border-soc-dark-700">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-slate-400">Collaborations</span>
          </div>
          <div className="text-xl font-bold text-purple-400">{metrics.collaborations}</div>
        </div>
        
        <div className="bg-soc-dark-800/30 p-4 rounded-lg border border-soc-dark-700">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-xs text-slate-400">Errors</span>
          </div>
          <div className="text-xl font-bold text-red-400">{metrics.errors}</div>
        </div>
        
        <div className="bg-soc-dark-800/30 p-4 rounded-lg border border-soc-dark-700">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-slate-400">Avg Impact</span>
          </div>
          <div className="text-xl font-bold text-yellow-400">{metrics.avgImpact.toFixed(1)}</div>
        </div>
      </div>

      {/* Charts Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <div className="bg-soc-dark-800/30 p-6 rounded-lg border border-soc-dark-700">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-opensoc-400" />
            <h3 className="text-lg font-medium text-white">Daily Activity (Last 7 Days)</h3>
          </div>
          
          <div className="space-y-3">
            {dailyData.map((day, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-16 text-xs text-slate-400 font-mono">{day.date}</div>
                <div className="flex-1 flex items-center space-x-2">
                  <div className="flex-1 bg-soc-dark-700 rounded-full h-3 overflow-hidden">
                    <div className="h-full flex">
                      <div 
                        className="bg-green-500 h-full" 
                        style={{ width: `${(day.taskCompleted / Math.max(day.total, 1)) * 100}%` }}
                      ></div>
                      <div 
                        className="bg-purple-500 h-full" 
                        style={{ width: `${(day.collaboration / Math.max(day.total, 1)) * 100}%` }}
                      ></div>
                      <div 
                        className="bg-blue-500 h-full" 
                        style={{ width: `${(day.learningUpdates / Math.max(day.total, 1)) * 100}%` }}
                      ></div>
                      <div 
                        className="bg-red-500 h-full" 
                        style={{ width: `${(day.errors / Math.max(day.total, 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-8 text-xs text-white text-right font-medium">{day.total}</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded"></div>
              <span className="text-slate-400">Tasks</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded"></div>
              <span className="text-slate-400">Collaboration</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded"></div>
              <span className="text-slate-400">Learning</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded"></div>
              <span className="text-slate-400">Errors</span>
            </div>
          </div>
        </div>

        {/* Hourly Activity Heatmap */}
        <div className="bg-soc-dark-800/30 p-6 rounded-lg border border-soc-dark-700">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-opensoc-400" />
            <h3 className="text-lg font-medium text-white">Today's Activity by Hour</h3>
          </div>
          
          <div className="space-y-2">
            {/* Hours grid */}
            <div className="grid grid-cols-12 gap-1">
              {hourlyData.map((hour, index) => {
                const intensity = maxHourly > 0 ? hour.count / maxHourly : 0;
                return (
                  <div
                    key={index}
                    className={`
                      h-8 rounded flex items-center justify-center text-xs font-medium
                      ${hour.count === 0 
                        ? 'bg-soc-dark-700 text-slate-500' 
                        : `bg-opensoc-500 text-white`}
                      ${hour.peakActivity ? 'ring-1 ring-yellow-400' : ''}
                    `}
                    style={{ 
                      opacity: hour.count === 0 ? 0.3 : 0.5 + (intensity * 0.5)
                    }}
                    title={`${hour.hour}:00 - ${hour.count} activities`}
                  >
                    {hour.hour}
                  </div>
                );
              })}
            </div>
            
            {/* Peak hours indicator */}
            <div className="flex items-center justify-between text-xs text-slate-400 mt-3">
              <span>00:00 - 23:00</span>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-opensoc-500 rounded opacity-30"></div>
                  <span>Low</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-opensoc-500 rounded"></div>
                  <span>High</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-opensoc-500 rounded ring-1 ring-yellow-400"></div>
                  <span>Peak</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Type Distribution */}
      <div className="bg-soc-dark-800/30 p-6 rounded-lg border border-soc-dark-700">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="h-5 w-5 text-opensoc-400" />
          <h3 className="text-lg font-medium text-white">Activity Type Distribution</h3>
        </div>
        
        <div className="space-y-3">
          {[
            { type: 'task_completed', label: 'Tasks Completed', count: metrics.completedTasks, color: 'bg-green-500', icon: CheckCircle },
            { type: 'collaboration', label: 'Human Collaboration', count: metrics.collaborations, color: 'bg-purple-500', icon: Users },
            { type: 'learning_update', label: 'Learning Updates', count: activities.filter(a => a.activityType === 'learning_update').length, color: 'bg-blue-500', icon: Bot },
            { type: 'error', label: 'Error Events', count: metrics.errors, color: 'bg-red-500', icon: AlertTriangle },
            { type: 'maintenance', label: 'Maintenance', count: activities.filter(a => a.activityType === 'maintenance').length, color: 'bg-orange-500', icon: Zap }
          ].map((item) => {
            const percentage = metrics.totalActivities > 0 ? (item.count / metrics.totalActivities) * 100 : 0;
            const Icon = item.icon;
            
            return (
              <div key={item.type} className="flex items-center space-x-3">
                <Icon className="h-4 w-4 text-slate-400" />
                <div className="flex-1 flex items-center space-x-3">
                  <div className="w-24 text-sm text-slate-300">{item.label}</div>
                  <div className="flex-1 bg-soc-dark-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="w-12 text-right text-sm text-white font-medium">{item.count}</div>
                  <div className="w-12 text-right text-xs text-slate-400">{percentage.toFixed(0)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AgentProductivityCharts;