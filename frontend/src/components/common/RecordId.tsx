import React from 'react';
import { Copy, Check } from 'lucide-react';
import { formatRecordId, formatDisplayId, handleRecordIdCopy, type RecordType } from '../../utils/recordUtils';

interface RecordIdProps {
  type: RecordType;
  id: string;
  variant?: 'badge' | 'inline' | 'table';
  showPrefix?: boolean;
  showCopyIcon?: boolean;
  className?: string;
  onClick?: () => void;
}

const RecordId: React.FC<RecordIdProps> = ({
  type,
  id,
  variant = 'badge',
  showPrefix = true,
  showCopyIcon = true,
  className = '',
  onClick
}) => {
  const [copied, setCopied] = React.useState(false);
  
  const displayId = formatDisplayId(type, id, showPrefix);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click handlers
    
    if (onClick) {
      onClick();
    } else {
      await handleRecordIdCopy(type, id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'badge':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer';
      case 'inline':
        return 'inline-flex items-center text-xs font-mono text-slate-400 hover:text-slate-300 transition-colors cursor-pointer';
      case 'table':
        return 'inline-flex items-center text-sm font-mono text-slate-300 hover:text-white transition-colors cursor-pointer';
      default:
        return 'inline-flex items-center';
    }
  };

  return (
    <span
      className={`${getVariantClasses()} ${className}`}
      onClick={handleClick}
      title={`Click to copy full ID: ${id}`}
    >
      <span className="select-all">
        {displayId}
      </span>
      
      {showCopyIcon && (
        <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </span>
      )}
    </span>
  );
};

export default RecordId;