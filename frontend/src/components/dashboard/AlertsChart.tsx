import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AlertsChart: React.FC = () => {
  // Mock data for triage status over the last 24 hours
  const data = [
    { hour: '00:00', incident_likely: 2, review_required: 5, analysis_uncertain: 3, new: 8, investigating: 4, resolved: 15 },
    { hour: '02:00', incident_likely: 1, review_required: 3, analysis_uncertain: 2, new: 6, investigating: 3, resolved: 12 },
    { hour: '04:00', incident_likely: 0, review_required: 2, analysis_uncertain: 1, new: 4, investigating: 2, resolved: 10 },
    { hour: '06:00', incident_likely: 1, review_required: 4, analysis_uncertain: 3, new: 7, investigating: 5, resolved: 18 },
    { hour: '08:00', incident_likely: 3, review_required: 6, analysis_uncertain: 4, new: 9, investigating: 7, resolved: 22 },
    { hour: '10:00', incident_likely: 2, review_required: 5, analysis_uncertain: 3, new: 8, investigating: 6, resolved: 19 },
    { hour: '12:00', incident_likely: 4, review_required: 7, analysis_uncertain: 5, new: 10, investigating: 8, resolved: 25 },
    { hour: '14:00', incident_likely: 3, review_required: 6, analysis_uncertain: 4, new: 9, investigating: 7, resolved: 21 },
    { hour: '16:00', incident_likely: 5, review_required: 8, analysis_uncertain: 6, new: 12, investigating: 9, resolved: 28 },
    { hour: '18:00', incident_likely: 2, review_required: 6, analysis_uncertain: 4, new: 10, investigating: 8, resolved: 24 },
    { hour: '20:00', incident_likely: 1, review_required: 4, analysis_uncertain: 2, new: 7, investigating: 5, resolved: 16 },
    { hour: '22:00', incident_likely: 3, review_required: 5, analysis_uncertain: 3, new: 8, investigating: 6, resolved: 19 }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-soc-dark-800 border border-soc-dark-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 font-medium">{`Time: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value} alerts`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="hour" 
            stroke="#64748b" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#64748b" 
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          <Line
            type="monotone"
            dataKey="incident_likely"
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            name="Incident Likely"
          />
          <Line
            type="monotone"
            dataKey="review_required"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
            name="Review Required"
          />
          <Line
            type="monotone"
            dataKey="analysis_uncertain"
            stroke="#eab308"
            strokeWidth={2}
            dot={{ fill: '#eab308', strokeWidth: 2, r: 3 }}
            name="Analysis Uncertain"
          />
          <Line
            type="monotone"
            dataKey="new"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
            name="New"
          />
          <Line
            type="monotone"
            dataKey="investigating"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 2 }}
            name="Investigating"
          />
          <Line
            type="monotone"
            dataKey="resolved"
            stroke="#10b981"
            strokeWidth={1}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 2 }}
            name="Resolved"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AlertsChart;