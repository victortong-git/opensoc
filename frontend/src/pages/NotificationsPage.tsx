import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  Filter,
  Settings,
  X,
  Clock,
  AlertTriangle,
  Shield,
  Info,
  CheckCircle,
  ExternalLink,
  MessageCircle,
  ChevronDown,
  Archive,
  Trash2,
  RefreshCcw,
  Eye,
  EyeOff
} from 'lucide-react';
import notificationService from '../services/notificationService';

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

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMounted, setIsMounted] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    type: '' as 'alert' | 'incident' | 'system' | 'security' | 'info' | '',
    priority: '' as 'low' | 'medium' | 'high' | 'critical' | '',
    isRead: '' as 'true' | 'false' | '',
    actionRequired: '' as 'true' | 'false' | '',
    includeArchived: false,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority' | 'type'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch notifications with current filters and pagination
  const fetchNotifications = useCallback(async () => {
    if (!isMounted) return;
    
    try {
      setLoading(true);
      const query: any = {
        page: currentPage,
        limit: 20,
        sortBy,
        sortOrder,
        ...filters
      };

      // Convert boolean string filters to actual booleans
      if (filters.isRead) query.isRead = filters.isRead === 'true';
      if (filters.actionRequired) query.actionRequired = filters.actionRequired === 'true';

      // Remove empty filters
      Object.keys(query).forEach(key => {
        if (query[key] === '' || query[key] === undefined) {
          delete query[key];
        }
      });

      const response = await notificationService.getNotifications(query);
      
      if (isMounted) {
        setNotifications(response.data.notifications);
        setTotalPages(response.data.pagination.totalPages);
        setUnreadCount(response.data.unreadCount);
      }
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [currentPage, filters, sortBy, sortOrder, isMounted]);

  // Initial fetch and setup WebSocket
  useEffect(() => {
    setIsMounted(true);
    
    const initializeNotifications = async () => {
      try {
        // Initialize WebSocket connection
        await notificationService.initializeWebSocket();
        
        // Setup real-time event handlers with mounted check
        const newNotificationHandler = (notification: Notification) => {
          if (isMounted) {
            setNotifications(prev => [notification, ...prev.slice(0, 19)]);
            setUnreadCount(prev => prev + 1);
          }
        };

        const notificationUpdatedHandler = (notification: Notification) => {
          if (isMounted) {
            setNotifications(prev => prev.map(n => n.id === notification.id ? notification : n));
          }
        };

        const notificationDeletedHandler = (notificationId: string) => {
          if (isMounted) {
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
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

        const notificationsBulkReadHandler = (data: any) => {
          if (isMounted) {
            setNotifications(prev => prev.map(n => 
              !n.isRead ? { ...n, isRead: true, readAt: new Date() } : n
            ));
            setUnreadCount(0);
          }
        };

        const unreadCountHandler = (count: number) => {
          if (isMounted) {
            setUnreadCount(count);
          }
        };

        // Attach event handlers
        notificationService.on('newNotification', newNotificationHandler);
        notificationService.on('notificationUpdated', notificationUpdatedHandler);
        notificationService.on('notificationDeleted', notificationDeletedHandler);
        notificationService.on('notificationRead', notificationReadHandler);
        notificationService.on('notificationsBulkRead', notificationsBulkReadHandler);
        notificationService.on('unreadCount', unreadCountHandler);

        // Fetch initial data
        if (isMounted) {
          await fetchNotifications();
        }

        // Store handlers for cleanup
        return {
          newNotificationHandler,
          notificationUpdatedHandler,
          notificationDeletedHandler,
          notificationReadHandler,
          notificationsBulkReadHandler,
          unreadCountHandler
        };

      } catch (error) {
        console.error('Error initializing notifications:', error);
        // Still fetch notifications even if WebSocket fails
        if (isMounted) {
          await fetchNotifications();
        }
        return null;
      }
    };

    let handlersCleanup: any = null;
    initializeNotifications().then((handlers) => {
      handlersCleanup = handlers;
    });

    // Cleanup WebSocket on unmount
    return () => {
      setIsMounted(false);
      
      // Remove specific event handlers if they were created
      if (handlersCleanup) {
        notificationService.off('newNotification', handlersCleanup.newNotificationHandler);
        notificationService.off('notificationUpdated', handlersCleanup.notificationUpdatedHandler);
        notificationService.off('notificationDeleted', handlersCleanup.notificationDeletedHandler);
        notificationService.off('notificationRead', handlersCleanup.notificationReadHandler);
        notificationService.off('notificationsBulkRead', handlersCleanup.notificationsBulkReadHandler);
        notificationService.off('unreadCount', handlersCleanup.unreadCountHandler);
      }
      
      // Disconnect WebSocket
      notificationService.disconnectWebSocket();
    };
  }, []);

  // Refetch when filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters, sortBy, sortOrder]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle search input with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchNotifications();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'incident': return <Shield className="h-4 w-4 text-orange-400" />;
      case 'system': return <Settings className="h-4 w-4 text-blue-400" />;
      case 'security': return <Shield className="h-4 w-4 text-purple-400" />;
      case 'info': return <Info className="h-4 w-4 text-slate-400" />;
      default: return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
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

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleArchiveNotification = async (notificationId: string) => {
    try {
      await notificationService.archiveNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  const handleBulkAction = async (action: 'read' | 'delete' | 'archive') => {
    const selectedIds = Array.from(selectedNotifications);
    
    try {
      switch (action) {
        case 'read':
          await Promise.all(selectedIds.map(id => notificationService.markAsRead(id)));
          setNotifications(prev => prev.map(n => 
            selectedIds.includes(n.id) ? { ...n, isRead: true, readAt: new Date() } : n
          ));
          break;
        case 'delete':
          await Promise.all(selectedIds.map(id => notificationService.deleteNotification(id)));
          setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
          break;
        case 'archive':
          await Promise.all(selectedIds.map(id => notificationService.archiveNotification(id)));
          setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
          break;
      }
      setSelectedNotifications(new Set());
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate to related item if available
    if (notification.relatedId && notification.relatedType) {
      const routes = {
        alert: `/alerts/${notification.relatedId}`,
        incident: `/incidents/${notification.relatedId}`,
        asset: `/assets/${notification.relatedId}`,
        user: `/users/${notification.relatedId}`
      };
      
      // Navigate to the appropriate route
      navigate(routes[notification.relatedType]);
    }
  };

  const handleSelectNotification = (notificationId: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-soc-dark-950 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All notifications read'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchNotifications()}
              className="btn-secondary"
              disabled={loading}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="btn-secondary"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-soc-dark-900 rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-soc-dark-700">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-soc-dark-600 rounded-lg focus:ring-2 focus:ring-opensoc-500 focus:border-transparent bg-white dark:bg-soc-dark-800 text-gray-900 dark:text-white"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary ${showFilters ? 'bg-opensoc-100 dark:bg-opensoc-900/20' : ''}`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {showFilters && <ChevronDown className="h-4 w-4 ml-2 rotate-180" />}
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="p-4 bg-gray-50 dark:bg-soc-dark-800/50 border-b border-gray-200 dark:border-soc-dark-700">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <select
                  className="input"
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <option value="">All Types</option>
                  <option value="alert">Alert</option>
                  <option value="incident">Incident</option>
                  <option value="system">System</option>
                  <option value="security">Security</option>
                  <option value="info">Info</option>
                </select>

                <select
                  className="input"
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <option value="">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  className="input"
                  value={filters.isRead}
                  onChange={(e) => setFilters(prev => ({ ...prev, isRead: e.target.value as any }))}
                >
                  <option value="">All Status</option>
                  <option value="false">Unread</option>
                  <option value="true">Read</option>
                </select>

                <select
                  className="input"
                  value={filters.actionRequired}
                  onChange={(e) => setFilters(prev => ({ ...prev, actionRequired: e.target.value as any }))}
                >
                  <option value="">All Actions</option>
                  <option value="true">Action Required</option>
                  <option value="false">No Action</option>
                </select>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeArchived"
                    className="mr-2"
                    checked={filters.includeArchived}
                    onChange={(e) => setFilters(prev => ({ ...prev, includeArchived: e.target.checked }))}
                  />
                  <label htmlFor="includeArchived" className="text-sm text-gray-700 dark:text-gray-300">
                    Include Archived
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedNotifications.size > 0 && (
            <div className="p-4 bg-opensoc-50 dark:bg-opensoc-900/20 border-b border-gray-200 dark:border-soc-dark-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedNotifications.size} notification{selectedNotifications.size !== 1 ? 's' : ''} selected
                </span>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleBulkAction('read')}
                    className="btn-sm btn-secondary"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Mark Read
                  </button>
                  <button
                    onClick={() => handleBulkAction('archive')}
                    className="btn-sm btn-secondary"
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="btn-sm text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-soc-dark-900 rounded-lg shadow">
          {/* List Header */}
          <div className="p-4 border-b border-gray-200 dark:border-soc-dark-700">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedNotifications.size === notifications.length && notifications.length > 0}
                onChange={handleSelectAll}
                className="rounded"
              />
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">Sort by:</span>
                <select
                  className="text-sm border-0 bg-transparent text-gray-700 dark:text-gray-300"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="createdAt">Date</option>
                  <option value="priority">Priority</option>
                  <option value="type">Type</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="text-sm text-opensoc-600 dark:text-opensoc-400 hover:text-opensoc-700"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCcw className="h-8 w-8 mx-auto mb-4 animate-spin text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notifications found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {Object.values(filters).some(v => v !== '' && v !== false) 
                  ? 'Try adjusting your filters'
                  : 'All caught up! No new notifications.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-soc-dark-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-soc-dark-800/50 transition-colors ${
                    !notification.isRead ? 'bg-opensoc-50/30 dark:bg-opensoc-900/10' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1 rounded"
                    />
                    
                    <div className={`w-1 h-16 rounded-full ${getPriorityColor(notification.priority)}`} />
                    
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            notification.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'
                          }`}>
                            {notification.title}
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-opensoc-500 rounded-full inline-block ml-2" />
                            )}
                          </h4>
                          <p className={`text-sm mt-1 ${
                            notification.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                            </div>
                            
                            <span className={`px-2 py-1 rounded text-xs capitalize ${
                              notification.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                              notification.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' :
                              notification.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                              'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            }`}>
                              {notification.priority}
                            </span>
                            
                            <span className="px-2 py-1 bg-gray-100 dark:bg-soc-dark-700 text-gray-600 dark:text-gray-400 text-xs rounded capitalize">
                              {notification.type}
                            </span>
                            
                            {notification.actionRequired && (
                              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs rounded">
                                Action Required
                              </span>
                            )}
                            
                            {notification.sourceSystem && (
                              <span className="text-xs text-gray-400">
                                from {notification.sourceSystem}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {notification.relatedId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification);
                              }}
                              className="p-1 text-gray-400 hover:text-opensoc-500 transition-colors"
                              title="View Related Item"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          )}
                          
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="p-1 text-gray-400 hover:text-opensoc-500 transition-colors"
                              title="Mark as Read"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveNotification(notification.id);
                            }}
                            className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
                            title="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-soc-dark-700">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;