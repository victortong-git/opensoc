import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  User, 
  LogOut, 
  X,
  Clock,
  AlertTriangle,
  Shield,
  Settings,
  Info,
  CheckCircle,
  ExternalLink,
  MessageCircle,
  ChevronDown,
  Key,
  Menu,
  Book
} from 'lucide-react';
import { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import ChangePasswordModal, { ChangePasswordData } from '../modals/ChangePasswordModal';
import authService from '../../services/authService';
import notificationService from '../../services/notificationService';
import GlobalSearch from '../search/GlobalSearch';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'incident' | 'system' | 'security' | 'info';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  actionRequired: boolean;
  relatedId?: string;
  relatedType?: 'alert' | 'incident' | 'asset' | 'user';
  sourceSystem?: string;
  notificationChannel: 'web' | 'email' | 'webhook' | 'websocket';
  archivedAt?: Date;
  readAt?: Date;
  notificationSettings: any;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface NavbarProps {
  onChatToggle?: () => void;
  isChatOpen?: boolean;
  onMobileSidebarToggle?: () => void;
  isMobileSidebarOpen?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onChatToggle, 
  isChatOpen = false, 
  onMobileSidebarToggle, 
  isMobileSidebarOpen = false 
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { stats } = useSelector((state: RootState) => state.dashboard);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showNotificationDetail, setShowNotificationDetail] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(true);

  // Fetch recent notifications for navbar
  const fetchRecentNotifications = useCallback(async () => {
    if (!isMounted) return;
    
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        includeArchived: false
      });
      
      if (isMounted) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [isMounted]);

  // Initialize notification service and setup real-time updates
  useEffect(() => {
    setIsMounted(true);
    
    const initializeNotifications = async () => {
      try {
        // Set token for API calls - match the key used by authSlice
        const token = localStorage.getItem('accessToken');
        if (token) {
          notificationService.setToken(token);
        }

        // Initialize WebSocket connection
        await notificationService.initializeWebSocket();
        
        // Setup real-time event handlers with mounted check
        const newNotificationHandler = (notification: Notification) => {
          if (isMounted) {
            setNotifications(prev => [notification, ...prev.slice(0, 4)]);
            setUnreadCount(prev => prev + 1);
          }
        };

        const notificationReadHandler = (data: any) => {
          if (isMounted) {
            setNotifications(prev => prev.map(n => 
              n.id === data.notificationId 
                ? { ...n, isRead: true, readAt: new Date(data.readAt) }
                : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        };

        const unreadCountHandler = (count: number) => {
          if (isMounted) {
            setUnreadCount(count);
          }
        };

        // Attach event handlers
        notificationService.on('newNotification', newNotificationHandler);
        notificationService.on('notificationRead', notificationReadHandler);
        notificationService.on('unreadCount', unreadCountHandler);

        // Fetch initial notifications
        if (isMounted) {
          await fetchRecentNotifications();
        }

        // Store handlers for cleanup
        return {
          newNotificationHandler,
          notificationReadHandler,
          unreadCountHandler
        };

      } catch (error) {
        console.error('Error initializing notifications:', error);
        // Still fetch notifications even if WebSocket fails
        if (isMounted) {
          await fetchRecentNotifications();
        }
        return null;
      }
    };

    let handlersCleanup: any = null;
    if (user) {
      initializeNotifications().then((handlers) => {
        handlersCleanup = handlers;
      });
    }

    // Cleanup WebSocket on unmount
    return () => {
      setIsMounted(false);
      
      // Remove specific event handlers if they were created
      if (handlersCleanup) {
        notificationService.off('newNotification', handlersCleanup.newNotificationHandler);
        notificationService.off('notificationRead', handlersCleanup.notificationReadHandler);
        notificationService.off('unreadCount', handlersCleanup.unreadCountHandler);
      }
      
      // Disconnect WebSocket
      notificationService.disconnectWebSocket();
    };
  }, [user, fetchRecentNotifications]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleNavigateToProfile = () => {
    navigate('/profile');
    setShowUserMenu(false);
  };

  const handleOpenChangePasswordModal = () => {
    setShowChangePasswordModal(true);
    setShowUserMenu(false);
  };

  const handleChangePassword = async (passwordData: ChangePasswordData): Promise<void> => {
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
    } catch (error) {
      // Re-throw error to be handled by the modal
      throw error;
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'incident': return <Shield className="h-4 w-4 text-orange-400" />;
      case 'system': return <Settings className="h-4 w-4 text-blue-400" />;
      case 'security': return <Shield className="h-4 w-4 text-purple-400" />;
      case 'info': return <Info className="h-4 w-4 text-slate-400" />;
      default: return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-blue-500';
      default: return 'border-l-slate-500';
    }
  };

  const formatRelativeTime = (date: Date | string): string => {
    return notificationService.formatRelativeTime(date);
  };

  const markAsRead = async (notificationId: string) => {
    if (markingAsRead === notificationId || !isMounted) return; // Prevent double-clicks
    
    try {
      setMarkingAsRead(notificationId);
      await notificationService.markAsRead(notificationId);
      
      // Update local state immediately for better UX
      if (isMounted) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId 
            ? { ...n, isRead: true, readAt: new Date() }
            : n
        ));
        
        // Update selected notification if it's the current one
        if (selectedNotification?.id === notificationId) {
          setSelectedNotification(prev => prev ? { ...prev, isRead: true, readAt: new Date() } : null);
        }
        
        // Decrease unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert optimistic update on error
      if (isMounted) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId 
            ? { ...n, isRead: false, readAt: null }
            : n
        ));
        if (selectedNotification?.id === notificationId) {
          setSelectedNotification(prev => prev ? { ...prev, isRead: false, readAt: null } : null);
        }
        setUnreadCount(prev => prev + 1);
      }
    } finally {
      if (isMounted) {
        setMarkingAsRead(null);
      }
    }
  };

  const markAllAsRead = async () => {
    if (!isMounted) return;
    
    try {
      await notificationService.markAllAsRead();
      
      if (isMounted) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!isMounted) return;
    
    try {
      await notificationService.deleteNotification(notificationId);
      
      if (isMounted) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const openNotificationDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowNotificationDetail(true);
    setShowNotifications(false);
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const closeNotificationDetail = () => {
    setShowNotificationDetail(false);
    setSelectedNotification(null);
  };

  const handleViewRelatedItem = (notification: Notification) => {
    if (!notification.relatedId || !notification.relatedType) return;
    
    // Navigate to the related item based on type
    let path = '';
    switch (notification.relatedType) {
      case 'alert':
        path = `/alerts/${notification.relatedId}`;
        break;
      case 'incident':
        path = `/incidents/${notification.relatedId}`;
        break;
      case 'asset':
        path = `/assets/${notification.relatedId}`;
        break;
      case 'user':
        path = `/users/${notification.relatedId}`;
        break;
      default:
        // For unknown types, try a generic approach
        path = `/${notification.relatedType}s/${notification.relatedId}`;
        break;
    }
    
    // Close the notification modal and navigate
    closeNotificationDetail();
    navigate(path);
  };

  const getRelatedItemLabel = (type?: string) => {
    switch (type) {
      case 'alert': return 'View Alert';
      case 'incident': return 'View Incident';
      case 'asset': return 'View Asset';
      case 'user': return 'View User';
      default: return 'View Details';
    }
  };

  return (
    <nav className="navbar px-6 py-4 bg-white dark:bg-soc-dark-900 border-b border-gray-200 dark:border-soc-dark-700">
      <div className="flex items-center justify-between w-full">
        {/* Left section - Mobile menu + Search */}
        <div className="flex items-center space-x-4">
          {/* Mobile hamburger menu */}
          <button
            onClick={onMobileSidebarToggle}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isMobileSidebarOpen
                ? 'bg-opensoc-600 text-white'
                : 'hover:bg-gray-100 dark:hover:bg-soc-dark-800 text-slate-600 dark:text-slate-400'
            }`}
            aria-label="Toggle mobile menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <GlobalSearch 
            className="w-80 hidden sm:block"
            placeholder="Search alerts, incidents, assets..."
            showAdvancedLink={true}
          />
          {/* Mobile search - smaller on very small screens */}
          <GlobalSearch 
            className="w-48 sm:hidden"
            placeholder="Search..."
            showAdvancedLink={false}
          />
        </div>


        {/* Right section - Documentation, Chat, Notifications and user */}
        <div className="flex items-center space-x-4">
          {/* AI SOC Consultant Chat */}
          <div className="relative">
            <button 
              onClick={onChatToggle}
              className={`p-2 rounded-lg transition-colors ${
                isChatOpen 
                  ? 'bg-opensoc-600 text-white' 
                  : 'hover:bg-gray-100 dark:hover:bg-soc-dark-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
              title={isChatOpen ? 'Close AI SOC Consultant' : 'Open AI SOC Consultant'}
            >
              <MessageCircle className="h-5 w-5" />
            </button>
          </div>

          {/* Documentation */}
          <div className="relative">
            <a 
              href="https://c6web.com/opensoc/documentation/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-soc-dark-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              title="Open Documentation"
              aria-label="Open Documentation"
            >
              <Book className="h-5 w-5" />
            </a>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-soc-dark-800 transition-colors"
            >
              <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Modal */}
            {showNotifications && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)}
                />
                
                {/* Notifications Panel */}
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-soc-dark-900 border border-gray-200 dark:border-soc-dark-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-soc-dark-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Notifications ({unreadCount} unread)
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          navigate('/notifications');
                          setShowNotifications(false);
                        }}
                        className="text-sm text-opensoc-400 hover:text-opensoc-300 font-medium"
                      >
                        View All
                      </button>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-opensoc-400 hover:text-opensoc-300"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-80 overflow-y-auto scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {notifications
                          .sort((a, b) => {
                            const aDate = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
                            const bDate = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
                            return bDate.getTime() - aDate.getTime();
                          })
                          .map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} hover:bg-soc-dark-800 transition-colors cursor-pointer ${
                              !notification.isRead ? 'bg-soc-dark-800/30' : ''
                            }`}
                            onClick={() => openNotificationDetail(notification)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className={`text-sm font-medium ${
                                      notification.isRead ? 'text-slate-300' : 'text-white'
                                    }`}>
                                      {notification.title}
                                      {!notification.isRead && (
                                        <span className="w-2 h-2 bg-opensoc-400 rounded-full inline-block ml-2" />
                                      )}
                                    </h4>
                                    <p className={`text-xs mt-1 ${
                                      notification.isRead ? 'text-slate-400' : 'text-slate-300'
                                    }`}>
                                      {notification.message}
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2 ml-2">
                                    {notification.actionRequired && (
                                      <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                        Action
                                      </span>
                                    )}
                                    {notification.relatedId && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openNotificationDetail(notification);
                                        }}
                                        className="p-1 text-slate-400 hover:text-opensoc-400"
                                        title={getRelatedItemLabel(notification.relatedType)}
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                      }}
                                      className="p-1 text-slate-400 hover:text-red-400"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center space-x-2">
                                    <Clock className="h-3 w-3 text-slate-500" />
                                    <span className="text-xs text-slate-500">
                                      {formatRelativeTime(notification.createdAt)}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-xs capitalize ${
                                      notification.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                                      notification.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                      notification.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                      'bg-blue-500/20 text-blue-400'
                                    }`}>
                                      {notification.priority}
                                    </span>
                                  </div>
                                  
                                  {notification.expiresAt && (
                                    <span className="text-xs text-slate-500">
                                      Expires: {formatRelativeTime(notification.expiresAt)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-soc-dark-700 text-center">
                      <button 
                        onClick={() => {
                          navigate('/notifications');
                          setShowNotifications(false);
                        }}
                        className="text-sm text-opensoc-400 hover:text-opensoc-300"
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-soc-dark-800 transition-colors"
            >
              <div className="text-right">
                <div className="text-sm font-medium text-slate-800 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{user?.role}</div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-opensoc-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)}
                />
                
                {/* Dropdown Panel */}
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-soc-dark-900 border border-gray-200 dark:border-soc-dark-700 rounded-lg shadow-xl z-50">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-soc-dark-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-opensoc-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-gray-900 dark:text-white font-medium">
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-sm">@{user?.username}</div>
                        <div className="text-slate-600 dark:text-slate-500 text-xs mt-1 capitalize">
                          {user?.role === 'admin' ? 'Administrator' : 
                           user?.role === 'analyst' ? 'Security Analyst' : 
                           user?.role === 'viewer' ? 'Viewer' : user?.role}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={handleNavigateToProfile}
                      className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-soc-dark-800 transition-colors text-gray-900 dark:text-white"
                    >
                      <User className="h-4 w-4 mr-3 text-slate-500 dark:text-slate-400" />
                      <div>
                        <div className="text-sm font-medium">My Profile</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">View and edit profile information</div>
                      </div>
                    </button>

                    <button
                      onClick={handleOpenChangePasswordModal}
                      className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-soc-dark-800 transition-colors text-gray-900 dark:text-white"
                    >
                      <Key className="h-4 w-4 mr-3 text-slate-500 dark:text-slate-400" />
                      <div>
                        <div className="text-sm font-medium">Change Password</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Update your security credentials</div>
                      </div>
                    </button>

                    <div className="border-t border-gray-200 dark:border-soc-dark-700 my-2"></div>

                    <button
                      onClick={() => {
                        handleLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      <div>
                        <div className="text-sm font-medium">Logout</div>
                        <div className="text-xs text-red-500 dark:text-red-400/70">Sign out of your account</div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>


      {/* Detailed Notification Modal */}
      {showNotificationDetail && selectedNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-soc-dark-900 border border-soc-dark-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-soc-dark-700">
              <div className="flex items-center space-x-3">
                {getNotificationIcon(selectedNotification.type)}
                <div>
                  <h2 className="text-xl font-semibold text-white">Notification Details</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded text-xs capitalize ${
                      selectedNotification.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                      selectedNotification.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      selectedNotification.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {selectedNotification.priority} Priority
                    </span>
                    <span className="px-2 py-1 bg-soc-dark-700 text-slate-300 text-xs rounded capitalize">
                      {selectedNotification.type}
                    </span>
                    {selectedNotification.actionRequired && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                        Action Required
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={closeNotificationDetail}
                className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                {/* Title and Message */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">{selectedNotification.title}</h3>
                  <div className="bg-soc-dark-800/50 p-4 rounded-lg">
                    <p className="text-slate-300 leading-relaxed">{selectedNotification.message}</p>
                  </div>
                </div>

                {/* Notification Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-white font-medium">Notification Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Type</label>
                        <div className="flex items-center space-x-2">
                          {getNotificationIcon(selectedNotification.type)}
                          <span className="text-white capitalize">{selectedNotification.type.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Priority</label>
                        <span className={`px-2 py-1 rounded text-sm capitalize ${
                          selectedNotification.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                          selectedNotification.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          selectedNotification.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {selectedNotification.priority}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Status</label>
                        <span className={`px-2 py-1 rounded text-sm ${
                          selectedNotification.isRead ? 'bg-slate-500/20 text-slate-400' : 'bg-opensoc-500/20 text-opensoc-400'
                        }`}>
                          {selectedNotification.isRead ? 'Read' : 'Unread'}
                        </span>
                      </div>
                      {selectedNotification.actionRequired && (
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">Action Required</label>
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded">
                            Yes - User action needed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-white font-medium">Timing Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Created</label>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className="text-white">
                            {(typeof selectedNotification.createdAt === 'string' 
                              ? new Date(selectedNotification.createdAt) 
                              : selectedNotification.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          ({formatRelativeTime(selectedNotification.createdAt)})
                        </span>
                      </div>
                      {selectedNotification.expiresAt && (
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">Expires</label>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-white">
                              {(typeof selectedNotification.expiresAt === 'string' 
                                ? new Date(selectedNotification.expiresAt) 
                                : selectedNotification.expiresAt).toLocaleString()}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            ({formatRelativeTime(selectedNotification.expiresAt)})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Related Item Information */}
                {selectedNotification.relatedId && selectedNotification.relatedType && (
                  <div>
                    <h4 className="text-white font-medium mb-3">Related Item</h4>
                    <div className="bg-soc-dark-800/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-opensoc-600/20 rounded-lg flex items-center justify-center">
                            <ExternalLink className="h-5 w-5 text-opensoc-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {selectedNotification.relatedType?.charAt(0).toUpperCase() + selectedNotification.relatedType?.slice(1)} ID: {selectedNotification.relatedId}
                            </p>
                            <p className="text-slate-400 text-sm">
                              Click to view related {selectedNotification.relatedType}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleViewRelatedItem(selectedNotification)}
                          className="btn-secondary text-sm"
                        >
                          {getRelatedItemLabel(selectedNotification.relatedType)}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Recommendations */}
                {selectedNotification.actionRequired && (
                  <div>
                    <h4 className="text-white font-medium mb-3">Recommended Actions</h4>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-yellow-200 font-medium mb-2">Action Required</p>
                          <div className="space-y-2">
                            {selectedNotification.type === 'alert' && (
                              <ul className="text-yellow-300 text-sm space-y-1">
                                <li>• Investigate the alert details immediately</li>
                                <li>• Assess the threat severity and impact</li>
                                <li>• Take appropriate containment measures</li>
                                <li>• Document investigation findings</li>
                              </ul>
                            )}
                            {selectedNotification.type === 'incident' && (
                              <ul className="text-yellow-300 text-sm space-y-1">
                                <li>• Review incident escalation details</li>
                                <li>• Coordinate with security team members</li>
                                <li>• Follow incident response procedures</li>
                                <li>• Update incident status regularly</li>
                              </ul>
                            )}
                            {selectedNotification.type === 'security' && (
                              <ul className="text-yellow-300 text-sm space-y-1">
                                <li>• Review security policy violations</li>
                                <li>• Implement necessary security controls</li>
                                <li>• Verify user access permissions</li>
                                <li>• Update security configurations</li>
                              </ul>
                            )}
                            {selectedNotification.type === 'system' && (
                              <ul className="text-yellow-300 text-sm space-y-1">
                                <li>• Check system status and performance</li>
                                <li>• Verify backup and recovery procedures</li>
                                <li>• Monitor system resources</li>
                                <li>• Schedule maintenance if required</li>
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-6 border-t border-soc-dark-700">
              <div className="flex items-center space-x-3">
                {!selectedNotification.isRead && (
                  <button 
                    onClick={() => markAsRead(selectedNotification.id)}
                    disabled={markingAsRead === selectedNotification.id}
                    className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {markingAsRead === selectedNotification.id ? (
                      <>
                        <div className="loading-spinner-sm mr-2"></div>
                        Marking as Read...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Read
                      </>
                    )}
                  </button>
                )}
                <button 
                  onClick={() => {
                    deleteNotification(selectedNotification.id);
                    closeNotificationDetail();
                  }}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Delete Notification
                </button>
              </div>
              
              <div className="flex space-x-3">
                {selectedNotification.relatedId && (
                  <button 
                    onClick={() => handleViewRelatedItem(selectedNotification)}
                    className="btn-primary"
                  >
                    {getRelatedItemLabel(selectedNotification.relatedType)}
                  </button>
                )}
                <button onClick={closeNotificationDetail} className="btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onChangePassword={handleChangePassword}
      />
    </nav>
  );
};

export default Navbar;