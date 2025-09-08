import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { format, isAfter, isBefore, subDays } from 'date-fns';

export interface CustomDateRange {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string;   // ISO date string (YYYY-MM-DD)
}

interface CustomDateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (dateRange: CustomDateRange) => void;
  currentRange?: CustomDateRange;
}

const CustomDateRangeModal: React.FC<CustomDateRangeModalProps> = ({
  isOpen,
  onClose,
  onApply,
  currentRange
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  // Initialize with current range or default to last 30 days
  useEffect(() => {
    if (isOpen) {
      if (currentRange) {
        setStartDate(currentRange.startDate);
        setEndDate(currentRange.endDate);
      } else {
        const today = new Date();
        const thirtyDaysAgo = subDays(today, 30);
        setStartDate(format(thirtyDaysAgo, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
      }
      setError('');
    }
  }, [isOpen, currentRange]);

  const validateDates = (start: string, end: string): string => {
    if (!start || !end) {
      return 'Both start and end dates are required';
    }

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const today = new Date();

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return 'Invalid date format';
    }

    if (isAfter(startDateObj, endDateObj)) {
      return 'Start date must be before end date';
    }

    if (isAfter(startDateObj, today)) {
      return 'Start date cannot be in the future';
    }

    if (isAfter(endDateObj, today)) {
      return 'End date cannot be in the future';
    }

    // Check if range is too long (max 1 year)
    const maxDate = subDays(endDateObj, 365);
    if (isBefore(startDateObj, maxDate)) {
      return 'Date range cannot exceed 365 days';
    }

    return '';
  };

  const handleApply = () => {
    const validationError = validateDates(startDate, endDate);
    if (validationError) {
      setError(validationError);
      return;
    }

    onApply({ startDate, endDate });
    onClose();
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setError('');
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setError('');
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    return format(new Date(dateStr), 'MMM dd, yyyy');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-opensoc-400" />
            <h2 className="text-lg font-semibold text-white">Custom Date Range</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-800 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="input-field w-full"
                max={endDate || format(new Date(), 'yyyy-MM-dd')}
              />
              {startDate && (
                <p className="text-xs text-slate-400 mt-1">
                  {formatDateForDisplay(startDate)}
                </p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="input-field w-full"
                min={startDate}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
              {endDate && (
                <p className="text-xs text-slate-400 mt-1">
                  {formatDateForDisplay(endDate)}
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Quick Range Buttons */}
          <div className="border-t border-soc-dark-700 pt-4">
            <p className="text-sm text-slate-400 mb-2">Quick Ranges:</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Last 7 days', days: 7 },
                { label: 'Last 30 days', days: 30 },
                { label: 'Last 90 days', days: 90 }
              ].map((range) => (
                <button
                  key={range.days}
                  onClick={() => {
                    const today = new Date();
                    const startDateObj = subDays(today, range.days);
                    setStartDate(format(startDateObj, 'yyyy-MM-dd'));
                    setEndDate(format(today, 'yyyy-MM-dd'));
                    setError('');
                  }}
                  className="btn-secondary text-xs py-1 px-2"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-soc-dark-700">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button 
            onClick={handleApply}
            className="btn-primary"
            disabled={!startDate || !endDate}
          >
            Apply Range
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDateRangeModal;