import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  BarChart3, 
  AlertTriangle, 
  FileText, 
  Server, 
  Settings,
  Activity,
  Users,
  Database,
  Bot,
  Play,
  Brain,
  TestTube2,
  Zap,
  MessageCircle,
  ExternalLink,
  X,
  Target,
  Network,
  Download
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

interface MenuSection {
  id: string;
  title: string;
  items: MenuItem[];
}

interface SidebarProps {
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { stats } = useSelector((state: RootState) => state.dashboard);

  const menuSections: MenuSection[] = [
    {
      id: 'core',
      title: 'Core',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: BarChart3,
          path: '/dashboard'
        },
        {
          id: 'alerts',
          label: 'Alerts',
          icon: AlertTriangle,
          path: '/alerts',
          badge: stats?.newAlerts || 0
        },
        {
          id: 'incidents',
          label: 'Incidents',
          icon: FileText,
          path: '/incidents',
          badge: stats?.activeIncidents || 0
        },
        {
          id: 'threat-hunting',
          label: 'Threat Hunting',
          icon: Target,
          path: '/threat-hunting'
        },
        {
          id: 'assets',
          label: 'Assets',
          icon: Server,
          path: '/assets'
        }
      ]
    },
    {
      id: 'intelligence',
      title: 'Intelligence',
      items: [
        {
          id: 'analytics',
          label: 'Analytics',
          icon: Activity,
          path: '/analytics'
        },
        {
          id: 'threat-intel',
          label: 'Threat Intel',
          icon: Database,
          path: '/threat-intel'
        },
        {
          id: 'mitre-attack',
          label: 'MITRE ATT&CK',
          icon: Shield,
          path: '/mitre'
        }
      ]
    },
    {
      id: 'automation',
      title: 'Automation',
      items: [
        {
          id: 'playbooks',
          label: 'Playbooks',
          icon: Play,
          path: '/playbooks'
        },
        {
          id: 'ai-agents',
          label: 'AI Agents',
          icon: Bot,
          path: '/ai-agents'
        }
      ]
    },
    {
      id: 'orchestration',
      title: 'Orchestration',
      items: [
        {
          id: 'nat-server',
          label: 'NVIDIA NAT Server',
          icon: Network,
          path: '/orchestration/nat-server'
        },
        {
          id: 'nat-mcp',
          label: 'NVIDIA NAT MCP',
          icon: Zap,
          path: '/orchestration/nat-mcp'
        }
      ]
    },
    {
      id: 'ai-tools',
      title: 'AI Tools',
      items: [
        {
          id: 'ai-provider',
          label: 'AI Provider',
          icon: Brain,
          path: '/ai-provider'
        },
        {
          id: 'text-embedding',
          label: 'Text Embedding',
          icon: Zap,
          path: '/text-embedding'
        },
        {
          id: 'chat-history',
          label: 'Chat History',
          icon: MessageCircle,
          path: '/chat-history'
        },
        {
          id: 'log-analyzer',
          label: 'Log Analyzer',
          icon: FileText,
          path: '/log-analyzer'
        },
        {
          id: 'llm-logs',
          label: 'LLM Logs',
          icon: Database,
          path: '/llm-logs'
        },
        {
          id: 'ai-model-fine-tuning',
          label: 'AI Model Fine-Tuning',
          icon: Brain,
          path: '/ai-tools/ai-model-fine-tuning'
        }
      ]
    },
    {
      id: 'system',
      title: 'System',
      items: [
        {
          id: 'users',
          label: 'Users',
          icon: Users,
          path: '/users'
        },
        {
          id: 'test-data',
          label: 'Test Data',
          icon: TestTube2,
          path: '/test-data'
        },
        {
          id: 'ai-generation-logs',
          label: 'Test Data Log',
          icon: Database,
          path: '/ai-generation-logs'
        },
        {
          id: 'integration',
          label: 'Integration',
          icon: ExternalLink,
          path: '/integration'
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          path: '/settings'
        }
      ]
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close mobile sidebar when navigating on mobile
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <aside className="sidebar w-64 h-full flex flex-col bg-white dark:bg-soc-dark-900 border-r border-gray-200 dark:border-soc-dark-700">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-soc-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <img 
                src="/favicon.svg" 
                alt="OpenSOC Logo" 
                className="h-8 w-8"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">OpenSOC</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Community POC Edition</p>
            </div>
          </div>
          {/* Mobile close button */}
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="md:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-soc-dark-800 text-slate-500 dark:text-slate-400"
              aria-label="Close mobile menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-4">
          {menuSections.map((section) => (
            <div key={section.id}>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-2 mb-2">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNavigation(item.path)}
                        className={`sidebar-item-compact w-full ${isActive ? 'active' : ''}`}
                        title={item.label}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 text-left text-sm truncate">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>


      {/* Version Info */}
      <div className="p-3 border-t border-soc-dark-800">
        <div className="text-xs text-slate-500 text-center">
          <div className="font-medium">OpenSOC v0.1 (POC)</div>
          <div className="mt-1 text-slate-600">© {new Date().getFullYear()}</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;