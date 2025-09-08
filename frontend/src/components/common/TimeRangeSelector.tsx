import React from 'react';
import { Clock, ChevronDown } from 'lucide-react';

export interface TimeRangeOption {
  value: string;
  label: string;
  hours: number;
}

export interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: '24h', label: '24 Hours', hours: 24 },
  { value: '7d', label: '7 Days', hours: 168 },
  { value: '30d', label: '30 Days', hours: 720 }
];

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = ''
}) => {
  const selectedOption = TIME_RANGE_OPTIONS.find(option => option.value === value);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className="h-4 w-4 text-slate-400" />
      <span className="text-sm text-slate-400">Time Range:</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`
            appearance-none bg-soc-dark-800 border border-soc-dark-600 rounded-lg 
            px-3 py-2 pr-8 text-sm text-white
            focus:outline-none focus:ring-2 focus:ring-opensoc-500 focus:border-opensoc-500
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:border-soc-dark-500 transition-colors
          `}
        >
          {TIME_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default TimeRangeSelector;
export { TIME_RANGE_OPTIONS };