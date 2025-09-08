import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, Theme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown';
  className?: string;
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  className = '',
  showLabel = false,
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  // Simple toggle button variant
  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-soc-dark-800 ${className}`}
        title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <div className="relative w-5 h-5">
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5 text-yellow-500 transition-all duration-300 transform rotate-0" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400 transition-all duration-300 transform rotate-180" />
          )}
        </div>
        {showLabel && (
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
          </span>
        )}
      </button>
    );
  }

  // Dropdown variant with all theme options
  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-col space-y-1">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Theme
        </div>
        
        <div className="space-y-1">
          {/* Light Theme Option */}
          <button
            onClick={() => setTheme('light')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              theme === 'light'
                ? 'bg-opensoc-100 dark:bg-opensoc-900/20 text-opensoc-600 dark:text-opensoc-400'
                : 'hover:bg-gray-100 dark:hover:bg-soc-dark-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Sun className="w-4 h-4 mr-3" />
            <div className="flex-1">
              <div className="text-sm font-medium">Light</div>
              <div className="text-xs opacity-75">Bright theme</div>
            </div>
            {theme === 'light' && (
              <div className="w-2 h-2 bg-opensoc-500 rounded-full" />
            )}
          </button>

          {/* Dark Theme Option */}
          <button
            onClick={() => setTheme('dark')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              theme === 'dark'
                ? 'bg-opensoc-100 dark:bg-opensoc-900/20 text-opensoc-600 dark:text-opensoc-400'
                : 'hover:bg-gray-100 dark:hover:bg-soc-dark-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Moon className="w-4 h-4 mr-3" />
            <div className="flex-1">
              <div className="text-sm font-medium">Dark</div>
              <div className="text-xs opacity-75">Dark theme</div>
            </div>
            {theme === 'dark' && (
              <div className="w-2 h-2 bg-opensoc-500 rounded-full" />
            )}
          </button>

          {/* System Theme Option */}
          <button
            onClick={() => setTheme('system')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              theme === 'system'
                ? 'bg-opensoc-100 dark:bg-opensoc-900/20 text-opensoc-600 dark:text-opensoc-400'
                : 'hover:bg-gray-100 dark:hover:bg-soc-dark-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Monitor className="w-4 h-4 mr-3" />
            <div className="flex-1">
              <div className="text-sm font-medium">System</div>
              <div className="text-xs opacity-75">
                Follow system ({resolvedTheme})
              </div>
            </div>
            {theme === 'system' && (
              <div className="w-2 h-2 bg-opensoc-500 rounded-full" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeToggle;