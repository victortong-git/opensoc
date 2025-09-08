import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Search,
  Filter,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  User,
  Shield,
  Clock,
  MapPin,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Monitor,
  Smartphone,
  Globe,
  Calendar
} from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { fetchUsers, fetchUserStats, fetchAllActivities, createUser, updateUser, deleteUser } from '../store/usersAsync';
import { openCreateModal, closeCreateModal, openEditModal, closeEditModal } from '../store/usersSlice';

interface TabButtonProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: (id: string) => void;
  count?: number;
}

const TabButton: React.FC<TabButtonProps> = ({ id, label, isActive, onClick, count }) => (
  <button
    onClick={() => onClick(id)}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-opensoc-600 text-white'
        : 'text-slate-400 hover:text-white hover:bg-soc-dark-700'
    }`}
  >
    {label}
    {count !== undefined && (
      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
        isActive ? 'bg-opensoc-700' : 'bg-soc-dark-600'
      }`}>
        {count}
      </span>
    )}
  </button>
);

const UsersPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    users, 
    userStats,
    allActivities,
    usersPagination,
    allActivitiesPagination,
    isLoading,
    usersLoading,
    userStatsLoading,
    allActivitiesLoading,
    error,
    isCreateModalOpen,
    isEditModalOpen
  } = useSelector((state: RootState) => state.users);

  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Form state for create/edit user
  const [createFormData, setCreateFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'viewer' as 'admin' | 'analyst' | 'viewer'
  });
  
  const [editFormData, setEditFormData] = useState<{
    id: string;
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'analyst' | 'viewer';
    isActive: boolean;
  } | null>(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Refresh all user data
  const handleRefresh = () => {
    dispatch(fetchUsers({ 
      page: usersPagination.currentPage,
      limit: usersPagination.itemsPerPage,
      search: searchTerm || undefined,
      role: selectedRole === 'all' ? undefined : selectedRole,
      status: selectedStatus === 'all' ? undefined : selectedStatus
    }));
    dispatch(fetchUserStats());
    dispatch(fetchAllActivities({
      page: allActivitiesPagination.currentPage,
      limit: allActivitiesPagination.itemsPerPage
    }));
  };
  
  // Form handlers
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(createUser(createFormData)).unwrap();
      // Reset form and close modal
      setCreateFormData({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'viewer'
      });
      dispatch(closeCreateModal());
      // Refresh users list
      dispatch(fetchUsers({ 
        search: searchTerm || undefined,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        isActive: selectedStatus !== 'all' ? selectedStatus === 'active' : undefined
      }));
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };
  
  const handleEditUser = (user: any) => {
    setEditFormData({
      id: user.id,
      username: user.username,
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive
    });
    dispatch(openEditModal());
  };
  
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    
    try {
      const updateData: any = {
        username: editFormData.username,
        email: editFormData.email,
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        role: editFormData.role,
        isActive: editFormData.isActive
      };
      
      // Only include password if it's not empty
      if (editFormData.password.trim() !== '') {
        updateData.password = editFormData.password;
      }
      
      await dispatch(updateUser({ 
        id: editFormData.id, 
        userData: updateData 
      })).unwrap();
      
      // Close modal and refresh users
      setEditFormData(null);
      dispatch(closeEditModal());
      dispatch(fetchUsers({ 
        search: searchTerm || undefined,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        isActive: selectedStatus !== 'all' ? selectedStatus === 'active' : undefined
      }));
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    try {
      await dispatch(deleteUser(userId)).unwrap();
      setShowDeleteConfirm(null);
      // Refresh users list
      dispatch(fetchUsers({ 
        search: searchTerm || undefined,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        isActive: selectedStatus !== 'all' ? selectedStatus === 'active' : undefined
      }));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };
  
  // Load data on component mount and when filters change
  useEffect(() => {
    dispatch(fetchUserStats());
    dispatch(fetchUsers({ 
      search: searchTerm || undefined,
      role: selectedRole !== 'all' ? selectedRole : undefined,
      isActive: selectedStatus !== 'all' ? selectedStatus === 'active' : undefined
    }));
    dispatch(fetchAllActivities());
  }, [dispatch, searchTerm, selectedRole, selectedStatus]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400';
      case 'analyst': return 'bg-blue-500/20 text-blue-400';
      case 'viewer': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile') || userAgent.includes('iPhone') || userAgent.includes('Android')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const tabs = [
    { id: 'users', label: 'Users', count: usersPagination?.totalItems || users.length },
    { id: 'sessions', label: 'Active Sessions', count: 0 }, // Will need sessions API
    { id: 'activity', label: 'Activity Log', count: allActivitiesPagination?.totalItems || allActivities.length },
    { id: 'roles', label: 'Roles & Permissions', count: 3 }
  ];

  // Users are already filtered by the API based on searchTerm and selectedRole
  const filteredUsers = users;
  
  // Activities are already filtered by the API 
  const filteredActivities = allActivities.filter(activity => {
    if (!searchTerm) return true;
    return activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           activity.action.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Mock sessions data for now (would need sessions API endpoint)
  const mockSessions = [
    {
      id: '1',
      userName: 'Current User',
      isActive: true,
      ipAddress: '192.168.1.100',
      location: 'New York, US',
      startTime: new Date(Date.now() - 3600000),
      lastActivity: new Date(Date.now() - 300000),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  ];
  
  const filteredSessions = mockSessions.filter(session => {
    const matchesSearch = session.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && session.isActive) ||
                         (selectedStatus === 'inactive' && !session.isActive);
    return matchesSearch && matchesStatus;
  });

  // Show error state if there's an error
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-slate-400 mt-2">Error loading user data</p>
          </div>
        </div>
        <div className="card p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to Load Users</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button 
            onClick={() => {
              dispatch(fetchUsers());
              dispatch(fetchUserStats());
              dispatch(fetchAllActivities());
            }}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 mt-2">
            Manage users, roles, sessions, and monitor security activities
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center space-x-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="btn-secondary">
            <Shield className="h-4 w-4 mr-2" />
            Audit Report
          </button>
          <button 
            onClick={() => dispatch(openCreateModal())}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {userStatsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-slate-700 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-slate-600 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-slate-700 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{userStats?.total || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Users</p>
                <p className="text-2xl font-bold text-white">{userStats?.active || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Administrators</p>
                <p className="text-2xl font-bold text-white">
                  {userStats?.byRole.find(r => r.role === 'admin')?.count || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Recent Activities</p>
                <p className="text-2xl font-bold text-white">{userStats?.recentActivity || 0}</p>
                <p className="text-xs text-slate-400">Last 24 hours</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-soc-dark-700">
        {tabs.map(tab => (
          <TabButton
            key={tab.id}
            id={tab.id}
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={setActiveTab}
            count={tab.count}
          />
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users, activities, sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary ${showFilters ? 'bg-opensoc-600' : ''}`}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrator</option>
                <option value="analyst">Security Analyst</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field w-full"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Last Login</label>
              <select className="input-field w-full">
                <option>All time</option>
                <option>Last 24 hours</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Users ({filteredUsers.length})
              </h3>
            </div>
            
            <div className="space-y-4">
              {usersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="card animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                            <div className="h-3 bg-slate-600 rounded w-1/2"></div>
                            <div className="h-3 bg-slate-600 rounded w-1/4"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-600 rounded w-20"></div>
                          <div className="h-3 bg-slate-600 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                filteredUsers.map((user) => (
                <div key={user.id} className="card hover:bg-soc-dark-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-opensoc-600 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-white font-medium">{user.firstName} {user.lastName}</h4>
                          <span className={`px-2 py-1 rounded text-xs ${getRoleColor(user.role)}`}>
                            {user.role.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">{user.email}</p>
                        <p className="text-slate-500 text-xs">@{user.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right text-sm">
                        <div className="flex items-center text-green-400">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span>Active</span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1">
                          Last login: {user.lastLoginAt ? formatRelativeTime(new Date(user.lastLoginAt)) : 'Never'}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-soc-dark-700 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(user.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-soc-dark-700 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                User Sessions ({filteredSessions.length})
              </h3>
            </div>
            
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <div key={session.id} className="card hover:bg-soc-dark-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                        {getDeviceIcon(session.userAgent)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-white font-medium">{session.userName}</h4>
                          {session.isActive ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">ACTIVE</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">ENDED</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-1" />
                            <span>{session.ipAddress}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{session.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>Started: {formatDate(session.startTime)}</span>
                          </div>
                        </div>
                        <p className="text-slate-500 text-xs mt-1 truncate">
                          {session.userAgent}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right text-sm">
                        <p className="text-slate-400">
                          Duration: {Math.floor((session.lastActivity.getTime() - session.startTime.getTime()) / 60000)}m
                        </p>
                        <p className="text-slate-500 text-xs">
                          Last activity: {formatRelativeTime(session.lastActivity)}
                        </p>
                      </div>
                      
                      {session.isActive && (
                        <button className="btn-secondary text-xs py-1 px-2">
                          Terminate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Activity Log ({filteredActivities.length})
              </h3>
              <button className="btn-secondary text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                Export Log
              </button>
            </div>
            
            <div className="space-y-4">
              {allActivitiesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="card animate-pulse">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                          <div className="h-3 bg-slate-600 rounded w-2/3"></div>
                          <div className="h-3 bg-slate-600 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                filteredActivities.map((activity) => (
                  <div key={activity.id} className="card hover:bg-soc-dark-800 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-opensoc-600/20 rounded-full flex items-center justify-center mt-1">
                        {activity.action.includes('alert') && <AlertTriangle className="h-5 w-5 text-orange-400" />}
                        {activity.action.includes('incident') && <Shield className="h-5 w-5 text-red-400" />}
                        {activity.action.includes('user') && <User className="h-5 w-5 text-blue-400" />}
                        {!activity.action.includes('alert') && !activity.action.includes('incident') && !activity.action.includes('user') && (
                          <Activity className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-white font-medium capitalize">{activity.action.replace('_', ' ')}</h4>
                            <p className="text-slate-400 text-sm mt-1">{activity.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                              {activity.ip_address && <span>IP: {activity.ip_address}</span>}
                              <span>{formatDate(new Date(activity.timestamp))}</span>
                            </div>
                            
                            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                              <div className="mt-2 p-2 bg-soc-dark-800 rounded text-xs">
                                <span className="text-slate-400">Details: </span>
                                <span className="text-slate-300">
                                  {JSON.stringify(activity.metadata, null, 2)}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <span className="text-xs text-slate-400">
                            {formatRelativeTime(new Date(activity.timestamp))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Roles & Permissions</h3>
              <button className="btn-secondary">
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                {
                  name: 'Administrator',
                  description: 'Full system access and management capabilities',
                  users: parseInt(userStats?.byRole.find(r => r.role === 'admin')?.count || '0'),
                  permissions: ['System Management', 'User Management', 'Security Configuration', 'Audit Access', 'Alert Management', 'Incident Response'],
                  color: 'red'
                },
                {
                  name: 'Security Analyst',
                  description: 'Security monitoring and incident response',
                  users: parseInt(userStats?.byRole.find(r => r.role === 'analyst')?.count || '0'),
                  permissions: ['Alert Investigation', 'Incident Management', 'Threat Intelligence', 'Report Generation', 'Asset Monitoring'],
                  color: 'blue'
                },
                {
                  name: 'Viewer',
                  description: 'Read-only access to security dashboards',
                  users: parseInt(userStats?.byRole.find(r => r.role === 'viewer')?.count || '0'),
                  permissions: ['Dashboard Access', 'Report Viewing', 'Alert Viewing'],
                  color: 'green'
                }
              ].map((role, index) => (
                <div key={index} className="card">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-${role.color}-500/20 rounded-lg flex items-center justify-center`}>
                          <Shield className={`h-6 w-6 text-${role.color}-400`} />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">{role.name}</h4>
                          <p className="text-slate-400 text-sm">{role.users} users</p>
                        </div>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-white hover:bg-soc-dark-700 rounded">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <p className="text-slate-400 text-sm">{role.description}</p>
                    
                    <div className="space-y-2">
                      <h5 className="text-white text-sm font-medium">Permissions</h5>
                      <div className="space-y-1">
                        {role.permissions.map(permission => (
                          <div key={permission} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-slate-300 text-sm">{permission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-soc-dark-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add New User</h3>
              <button
                onClick={() => dispatch(closeCreateModal())}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Username <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  className="input-field w-full" 
                  placeholder="Enter username"
                  value={createFormData.username}
                  onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Email <span className="text-red-400">*</span></label>
                <input 
                  type="email" 
                  className="input-field w-full" 
                  placeholder="Enter email address"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Password <span className="text-red-400">*</span></label>
                <input 
                  type="password" 
                  className="input-field w-full" 
                  placeholder="Enter initial password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">First Name <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  className="input-field w-full" 
                  placeholder="Enter first name"
                  value={createFormData.firstName}
                  onChange={(e) => setCreateFormData({ ...createFormData, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Last Name <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  className="input-field w-full" 
                  placeholder="Enter last name"
                  value={createFormData.lastName}
                  onChange={(e) => setCreateFormData({ ...createFormData, lastName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Role</label>
                <select 
                  className="input-field w-full"
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as 'admin' | 'analyst' | 'viewer' })}
                >
                  <option value="viewer">Viewer</option>
                  <option value="analyst">Security Analyst</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => dispatch(closeCreateModal())}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-soc-dark-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Edit User</h3>
              <button
                onClick={() => {
                  setEditFormData(null);
                  dispatch(closeEditModal());
                }}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Username <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  className="input-field w-full" 
                  placeholder="Enter username"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Email <span className="text-red-400">*</span></label>
                <input 
                  type="email" 
                  className="input-field w-full" 
                  placeholder="Enter email address"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Password <span className="text-slate-500">(leave empty to keep current)</span></label>
                <input 
                  type="password" 
                  className="input-field w-full" 
                  placeholder="Enter new password or leave empty"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">First Name <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  className="input-field w-full" 
                  placeholder="Enter first name"
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Last Name <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  className="input-field w-full" 
                  placeholder="Enter last name"
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Role</label>
                <select 
                  className="input-field w-full"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'admin' | 'analyst' | 'viewer' })}
                >
                  <option value="viewer">Viewer</option>
                  <option value="analyst">Security Analyst</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    className="rounded bg-soc-dark-800 border-soc-dark-600 text-opensoc-600 focus:ring-opensoc-600 focus:ring-offset-soc-dark-900"
                  />
                  <span className="text-sm text-slate-400">Active User</span>
                </label>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditFormData(null);
                    dispatch(closeEditModal());
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-soc-dark-900 rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400 mr-3" />
              <h3 className="text-lg font-semibold text-white">Delete User</h3>
            </div>
            <p className="text-slate-400 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;