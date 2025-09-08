const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { models } = require('../database/models');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { asyncHandler, AuthenticationError, ValidationError } = require('../middleware/error.middleware');

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Find user by username or email
  const user = await models.User.findOne({
    where: {
      [Op.or]: [
        { username: username },
        { email: username }
      ],
    },
    include: [
      {
        model: models.Organization,
        as: 'organization',
      },
    ],
  });

  if (!user) {
    throw new AuthenticationError('Invalid username or password');
  }

  if (!user.isActive) {
    throw new AuthenticationError('Account is inactive');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid username or password');
  }

  // Generate tokens
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  // Update last login time
  await user.update({ 
    updatedAt: new Date(),
  });

  // Return user data and tokens
  res.status(200).json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
      organization: user.organization,
    },
    tokens: {
      accessToken: token,
      refreshToken: refreshToken,
    },
  });
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new ValidationError('Refresh token is required');
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(token);
  
  // Get user
  const user = await models.User.findByPk(decoded.id, {
    include: [
      {
        model: models.Organization,
        as: 'organization',
      },
    ],
  });

  if (!user || !user.isActive) {
    throw new AuthenticationError('Invalid refresh token');
  }

  // Generate new access token
  const newAccessToken = generateToken(user);

  res.status(200).json({
    message: 'Token refreshed successfully',
    accessToken: newAccessToken,
  });
});

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  // In a more complex implementation, you might want to blacklist the token
  // For now, we'll just return a success message as the frontend will remove the token
  
  res.status(200).json({
    message: 'Logout successful',
  });
});

/**
 * Get current user profile
 * GET /api/auth/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  // User is already available from auth middleware
  const user = await models.User.findByPk(req.user.id, {
    include: [
      {
        model: models.Organization,
        as: 'organization',
      },
    ],
    attributes: { exclude: ['passwordHash'] },
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
      organization: user.organization,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { email, firstName, lastName } = req.body;
  
  const user = await models.User.findByPk(req.user.id);
  
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Update user data
  await user.update({
    ...(email && { email }),
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
  });

  // Get updated user with organization
  const updatedUser = await models.User.findByPk(user.id, {
    include: [
      {
        model: models.Organization,
        as: 'organization',
      },
    ],
    attributes: { exclude: ['passwordHash'] },
  });

  res.status(200).json({
    message: 'Profile updated successfully',
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      organizationId: updatedUser.organizationId,
      organization: updatedUser.organization,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    },
  });
});

/**
 * Change password
 * PUT /api/auth/password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = await models.User.findByPk(req.user.id);
  
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    throw new ValidationError('Current password is incorrect');
  }

  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await user.update({
    passwordHash: hashedNewPassword,
  });

  res.status(200).json({
    message: 'Password changed successfully',
  });
});

/**
 * Register new user (admin only)
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName, role = 'viewer' } = req.body;

  // Check if user with username or email already exists
  const existingUser = await models.User.findOne({
    where: {
      [Op.or]: [
        { username: username },
        { email: email }
      ],
    },
  });

  if (existingUser) {
    if (existingUser.username === username) {
      throw new ValidationError('Username already exists');
    }
    if (existingUser.email === email) {
      throw new ValidationError('Email already exists');
    }
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await models.User.create({
    username,
    email,
    passwordHash: hashedPassword,
    firstName,
    lastName,
    role,
    organizationId: req.user.organizationId, // Use same organization as admin
  });

  // Get user with organization
  const newUser = await models.User.findByPk(user.id, {
    include: [
      {
        model: models.Organization,
        as: 'organization',
      },
    ],
    attributes: { exclude: ['passwordHash'] },
  });

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      organizationId: newUser.organizationId,
      organization: newUser.organization,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
    },
  });
});

module.exports = {
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  register,
};