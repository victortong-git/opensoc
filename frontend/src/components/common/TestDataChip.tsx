import React from 'react';
import { TestTube2 } from 'lucide-react';

interface TestDataChipProps {
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'badge' | 'inline';
}

const TestDataChip: React.FC<TestDataChipProps> = ({ 
  className = '', 
  size = 'sm',
  variant = 'badge'
}) => {
  const baseClasses = 'inline-flex items-center text-yellow-400 bg-yellow-500/20 border border-yellow-500/30 rounded-full font-medium';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  const variantClasses = {
    badge: 'gap-1',
    inline: 'gap-1.5'
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      <TestTube2 className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
      <span>Test data</span>
    </span>
  );
};

export default TestDataChip;