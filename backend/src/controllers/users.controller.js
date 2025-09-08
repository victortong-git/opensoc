const bcrypt = require('bcryptjs');
const { models, sequelize } = require('../database/models');
const { asyncHandler, NotFoundError, ValidationError, ConflictError } = require('../middleware/error.middleware');
const { Op } = require('sequelize');

/**
 * Get all users with filtering and pagination
 * GET /api/users
 */
const getUsers = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    role,
    isActive,
    search,
  } = req.query;

  // Build where clause
  const where = { organizationId };

  // Apply filters
  if (role) {
    const roleArray = Array.isArray(role) ? role : [role];
    where.role = { [Op.in]: roleArray };
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (search) {
    where[Op.or] = [
      { username: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Calculate offset
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Get users with pagination
  const { count, rows: users } = await models.User.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
    attributes: { exclude: ['passwordHash'] }, // Never return password hash
    include: [
      {
        model: models.Organization,
        as: 'organization',
        attributes: ['id', 'name', 'domain'],
      },
    ],
  });

  // Calculate pagination metadata
  const totalPages = Math.ceil(count / parseInt(limit));
  const hasNext = parseInt(page) < totalPages;
  const hasPrev = parseInt(page) > 1;

  res.status(200).json({
    users,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: count,
      itemsPerPage: parseInt(limit),
      hasNext,
      hasPrev,
    },
  });
});

/**
 * Get single user by ID
 * GET /api/users/:id
 */
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const user = await models.User.findOne({
    where: { id, organizationId },
    attributes: { exclude: ['passwordHash'] },
    include: [
      {
        model: models.Organization,
        as: 'organization',
        attributes: ['id', 'name', 'domain'],
      },
      {
        model: models.Incident,
        as: 'assignedIncidents',
        attributes: ['id', 'title', 'status', 'severity'],
        limit: 5,
        order: [['createdAt', 'DESC']],
      },
    ],
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.status(200).json({ user });
});

/**
 * Create new user
 * POST /api/users
 */
const createUser = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { username, email, password, firstName, lastName, role = 'viewer' } = req.body;

  // Check if user already exists
  const existingUser = await models.User.findOne({
    where: {
      [Op.or]: [{ username }, { email }],
      organizationId,
    },
  });

  if (existingUser) {
    throw new ConflictError('User with this username or email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  const userData = {
    username,
    email,
    passwordHash,
    firstName,
    lastName,
    role,
    organizationId,
    isActive: true,
  };

  const user = await models.User.create(userData);

  // Log user creation activity
  await logUserActivity(req.user.id, 'user_created', `Created user: ${username}`, {
    targetUserId: user.id,
    targetUsername: username,
    role: role,
  });

  // Return user without password hash
  const { passwordHash: _, ...userResponse } = user.toJSON();

  res.status(201).json({
    message: 'User created successfully',
    user: userResponse,
  });
});

/**
 * Update user
 * PUT /api/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const user = await models.User.findOne({
    where: { id, organizationId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check for username/email conflicts if being changed
  const { username, email, password, ...otherUpdates } = req.body;
  
  if (username && username !== user.username) {
    const existingUser = await models.User.findOne({
      where: { username, organizationId, id: { [Op.ne]: id } },
    });
    if (existingUser) {
      throw new ConflictError('Username already exists');
    }
  }

  if (email && email !== user.email) {
    const existingUser = await models.User.findOne({
      where: { email, organizationId, id: { [Op.ne]: id } },
    });
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }
  }

  // Prepare update data
  const updateData = { ...otherUpdates };
  if (username) updateData.username = username;
  if (email) updateData.email = email;

  // Hash new password if provided
  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 12);
  }

  // Track changes for activity log
  const changes = [];
  Object.keys(updateData).forEach(key => {
    if (key !== 'passwordHash' && updateData[key] !== user[key]) {
      changes.push(`${key}: ${user[key]} → ${updateData[key]}`);
    }
  });

  if (password) {
    changes.push('password: changed');
  }

  await user.update(updateData);

  // Log user update activity
  if (changes.length > 0) {
    await logUserActivity(req.user.id, 'user_updated', `Updated user: ${user.username}`, {
      targetUserId: user.id,
      targetUsername: user.username,
      changes: changes,
    });
  }

  // Return updated user without password hash
  const { passwordHash: _, ...userResponse } = user.toJSON();

  res.status(200).json({
    message: 'User updated successfully',
    user: userResponse,
  });
});

/**
 * Delete user
 * DELETE /api/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const user = await models.User.findOne({
    where: { id, organizationId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Cannot delete self
  if (user.id === req.user.id) {
    throw new ValidationError('Cannot delete your own account');
  }

  // Log user deletion activity
  await logUserActivity(req.user.id, 'user_deleted', `Deleted user: ${user.username}`, {
    targetUserId: user.id,
    targetUsername: user.username,
    targetRole: user.role,
  });

  await user.destroy();

  res.status(200).json({
    message: 'User deleted successfully',
  });
});

/**
 * Deactivate user (soft delete)
 * POST /api/users/:id/deactivate
 */
const deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const user = await models.User.findOne({
    where: { id, organizationId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Cannot deactivate self
  if (user.id === req.user.id) {
    throw new ValidationError('Cannot deactivate your own account');
  }

  await user.update({ isActive: false });

  // Log user deactivation activity
  await logUserActivity(req.user.id, 'user_deactivated', `Deactivated user: ${user.username}`, {
    targetUserId: user.id,
    targetUsername: user.username,
  });

  res.status(200).json({
    message: 'User deactivated successfully',
    user: { ...user.toJSON(), passwordHash: undefined },
  });
});

/**
 * Activate user
 * POST /api/users/:id/activate
 */
const activateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const user = await models.User.findOne({
    where: { id, organizationId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  await user.update({ isActive: true });

  // Log user activation activity
  await logUserActivity(req.user.id, 'user_activated', `Activated user: ${user.username}`, {
    targetUserId: user.id,
    targetUsername: user.username,
  });

  res.status(200).json({
    message: 'User activated successfully',
    user: { ...user.toJSON(), passwordHash: undefined },
  });
});

/**
 * Get user activity logs
 * GET /api/users/:id/activity
 */
const getUserActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20, action, startDate, endDate } = req.query;
  const organizationId = req.user.organizationId;

  // Verify user exists and belongs to organization
  const user = await models.User.findOne({
    where: { id, organizationId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Build activity query
  const where = { 
    [Op.or]: [
      { userId: id },      // Activities performed by this user
      { 'metadata.targetUserId': id }  // Activities performed on this user
    ]
  };

  if (action) {
    where.action = action;
  }

  if (startDate && endDate) {
    where.timestamp = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }

  // Calculate offset
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Get activity logs with pagination
  const activities = await sequelize.query(`
    SELECT * FROM user_activities 
    WHERE (user_id = :userId OR metadata->>'targetUserId' = :userId)
    ${action ? "AND action = :action" : ""}
    ${startDate && endDate ? "AND timestamp BETWEEN :startDate AND :endDate" : ""}
    ORDER BY timestamp DESC
    LIMIT :limit OFFSET :offset
  `, {
    replacements: { 
      userId: id, 
      action,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      limit: parseInt(limit),
      offset
    },
    type: sequelize.QueryTypes.SELECT
  });

  const total = await sequelize.query(`
    SELECT COUNT(*) as count FROM user_activities 
    WHERE (user_id = :userId OR metadata->>'targetUserId' = :userId)
    ${action ? "AND action = :action" : ""}
    ${startDate && endDate ? "AND timestamp BETWEEN :startDate AND :endDate" : ""}
  `, {
    replacements: { 
      userId: id, 
      action,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
    type: sequelize.QueryTypes.SELECT
  });

  const totalPages = Math.ceil(parseInt(total[0].count) / parseInt(limit));

  res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    activities,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: parseInt(total[0].count),
      itemsPerPage: parseInt(limit),
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1,
    },
  });
});

/**
 * Log user activity
 */
const logUserActivity = async (userId, action, description, metadata = {}) => {
  try {
    // Create user_activities table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ip_address INET,
        user_agent TEXT
      )
    `);

    await sequelize.query(`
      INSERT INTO user_activities (user_id, action, description, metadata)
      VALUES (:userId, :action, :description, :metadata)
    `, {
      replacements: {
        userId,
        action,
        description,
        metadata: JSON.stringify(metadata)
      }
    });
  } catch (error) {
    console.error('Failed to log user activity:', error);
    // Don't throw error - activity logging should not break main functionality
  }
};

/**
 * Get user statistics
 * GET /api/users/stats
 */
const getUserStats = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  const [
    totalUsers,
    activeUsers,
    usersByRole,
    recentActivities
  ] = await Promise.all([
    models.User.count({ where: { organizationId } }),
    models.User.count({ where: { organizationId, isActive: true } }),
    sequelize.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE organization_id = :orgId 
      GROUP BY role
    `, {
      replacements: { orgId: organizationId },
      type: sequelize.QueryTypes.SELECT
    }),
    sequelize.query(`
      SELECT COUNT(*) as count 
      FROM user_activities ua
      JOIN users u ON ua.user_id = u.id
      WHERE u.organization_id = :orgId 
      AND ua.timestamp >= NOW() - INTERVAL '24 hours'
    `, {
      replacements: { orgId: organizationId },
      type: sequelize.QueryTypes.SELECT
    }).catch(() => [{ count: 0 }]) // Handle case where table doesn't exist yet
  ]);

  res.status(200).json({
    total: totalUsers,
    active: activeUsers,
    byRole: usersByRole,
    recentActivity: parseInt(recentActivities[0].count),
  });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  getUserActivity,
  getUserStats,
};