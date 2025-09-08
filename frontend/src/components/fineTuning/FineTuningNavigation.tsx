import React from 'react';
import { BarChart3, Settings, BookOpen, Code } from 'lucide-react';

interface NavigationTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface FineTuningNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const FineTuningNavigation: React.FC<FineTuningNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabs: NavigationTab[] = [
    {
      id: 'statistics',
      label: 'Statistics & Export',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Dataset metrics and export controls'
    },
    {
      id: 'guide',
      label: 'Training Guide',
      icon: <BookOpen className="w-4 h-4" />,
      description: 'GPT-OSS 20B fine-tuning instructions'
    },
    {
      id: 'examples',
      label: 'Code Examples',
      icon: <Code className="w-4 h-4" />,
      description: 'Implementation examples and scripts'
    }
  ];

  return (
    <div className="bg-soc-dark-800 border border-soc-dark-700 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-opensoc-600 text-white shadow-lg'
                : 'bg-soc-dark-700 text-gray-300 hover:bg-soc-dark-600 hover:text-white'
            }`}
          >
            {tab.icon}
            <div className="text-left">
              <div className="text-sm font-medium">{tab.label}</div>
              <div className="text-xs opacity-75">{tab.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FineTuningNavigation;