const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { models } = require('../database/models');
const { asyncHandler, ValidationError, NotFoundError, AuthenticationError } = require('../middleware/error.middleware');

/**
 * Generate a secure API key
 */
const generateApiKey = () => {
  const randomBytes = crypto.randomBytes(32);
  const apiKey = `opensoc_${randomBytes.toString('hex')}`;
  return apiKey;
};

/**
 * Hash API key for secure storage
 */
const hashApiKey = async (apiKey) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(apiKey, saltRounds);
};

/**
 * Get organization's API keys
 * GET /api/settings/api-keys
 */
const getApiKeys = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  
  const apiKeys = await models.ApiKey.findByOrganization(organizationId);
  
  // If no API keys exist, return empty array
  if (!apiKeys || apiKeys.length === 0) {
    return res.json({ keys: [], count: 0 });
  }
  
  // Remove sensitive information before sending to client
  const sanitizedKeys = apiKeys.map(key => ({
    id: key.id,
    name: key.name,
    keyPrefix: key.keyPrefix,
    isActive: key.isActive,
    lastUsedAt: key.lastUsedAt,
    expiresAt: key.expiresAt,
    permissions: key.permissions,
    createdAt: key.createdAt,
    creator: key.creator ? {
      id: key.creator.id,
      username: key.creator.username,
      firstName: key.creator.firstName,
      lastName: key.creator.lastName,
    } : null,
    metadata: {
      usageCount: key.metadata?.usageCount || 0,
      lastUsed: key.metadata?.lastUsed || null,
    }
  }));

  res.status(200).json({
    success: true,
    apiKeys: sanitizedKeys,
    count: sanitizedKeys.length,
  });
});

/**
 * Generate new API key
 * POST /api/settings/api-keys
 */
const createApiKey = asyncHandler(async (req, res) => {
  const { name, permissions = ['create_alerts'], expiresAt } = req.body;
  const organizationId = req.user.organizationId;
  const userId = req.user.id;

  // Validate input
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('API key name is required');
  }

  if (name.trim().length > 255) {
    throw new ValidationError('API key name must be less than 255 characters');
  }

  // Check if user already has an active API key (POC limitation: one key per org)
  const existingKeys = await models.ApiKey.findByOrganization(organizationId, false);
  if (existingKeys.length > 0) {
    throw new ValidationError('Organization already has an active API key. Please deactivate existing key first.');
  }

  // Generate API key
  const apiKey = generateApiKey();
  const keyHash = await hashApiKey(apiKey);
  const keyPrefix = apiKey.substring(0, 16); // Show first 16 characters

  try {
    // Create API key record
    const newApiKey = await models.ApiKey.create({
      name: name.trim(),
      keyHash,
      keyPrefix,
      organizationId,
      createdBy: userId,
      permissions: Array.isArray(permissions) ? permissions : ['create_alerts'],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      metadata: {
        createdBy: req.user.username,
        createdByEmail: req.user.email,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    });

    // Get the created key with creator information
    const createdKey = await models.ApiKey.findByPk(newApiKey.id, {
      include: [
        {
          model: models.User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'API key created successfully',
      apiKey: {
        id: createdKey.id,
        name: createdKey.name,
        key: apiKey, // Only return the actual key on creation
        keyPrefix: createdKey.keyPrefix,
        permissions: createdKey.permissions,
        expiresAt: createdKey.expiresAt,
        isActive: createdKey.isActive,
        createdAt: createdKey.createdAt,
        creator: createdKey.creator ? {
          id: createdKey.creator.id,
          username: createdKey.creator.username,
          firstName: createdKey.creator.firstName,
          lastName: createdKey.creator.lastName,
        } : null
      }
    });

  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      throw new ValidationError(`Invalid API key data: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
});

/**
 * Deactivate API key
 * DELETE /api/settings/api-keys/:id
 */
const deactivateApiKey = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const apiKey = await models.ApiKey.findOne({
    where: { 
      id, 
      organizationId,
      isActive: true 
    }
  });

  if (!apiKey) {
    throw new NotFoundError('API key not found or already deactivated');
  }

  // Deactivate the key
  await apiKey.update({
    isActive: false,
    metadata: {
      ...apiKey.metadata,
      deactivatedAt: new Date(),
      deactivatedBy: req.user.username,
      deactivatedByEmail: req.user.email
    }
  });

  res.status(200).json({
    success: true,
    message: 'API key deactivated successfully'
  });
});

/**
 * Update API key (limited updates for security)
 * PUT /api/settings/api-keys/:id
 */
const updateApiKey = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const organizationId = req.user.organizationId;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('API key name is required');
  }

  const apiKey = await models.ApiKey.findOne({
    where: { 
      id, 
      organizationId 
    }
  });

  if (!apiKey) {
    throw new NotFoundError('API key not found');
  }

  // Only allow updating the name for security reasons
  await apiKey.update({
    name: name.trim(),
    metadata: {
      ...apiKey.metadata,
      lastUpdated: new Date(),
      updatedBy: req.user.username
    }
  });

  const updatedKey = await models.ApiKey.findByPk(apiKey.id, {
    include: [
      {
        model: models.User,
        as: 'creator',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }
    ]
  });

  res.status(200).json({
    success: true,
    message: 'API key updated successfully',
    apiKey: {
      id: updatedKey.id,
      name: updatedKey.name,
      keyPrefix: updatedKey.keyPrefix,
      permissions: updatedKey.permissions,
      isActive: updatedKey.isActive,
      lastUsedAt: updatedKey.lastUsedAt,
      expiresAt: updatedKey.expiresAt,
      createdAt: updatedKey.createdAt,
      creator: updatedKey.creator ? {
        id: updatedKey.creator.id,
        username: updatedKey.creator.username,
        firstName: updatedKey.creator.firstName,
        lastName: updatedKey.creator.lastName,
      } : null
    }
  });
});

/**
 * Regenerate API key
 * PUT /api/settings/api-keys/:id/regenerate
 */
const regenerateApiKey = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;
  const userId = req.user.id;

  const apiKey = await models.ApiKey.findOne({
    where: { 
      id, 
      organizationId,
      isActive: true 
    },
    include: [
      {
        model: models.User,
        as: 'creator',
        attributes: ['id', 'username', 'firstName', 'lastName', 'email']
      }
    ]
  });

  if (!apiKey) {
    throw new NotFoundError('API key not found or not active');
  }

  // Generate new API key
  const newApiKey = generateApiKey();
  const newKeyHash = await hashApiKey(newApiKey);
  const newKeyPrefix = newApiKey.substring(0, 16); // Show first 16 characters

  try {
    // Update the existing API key with new credentials
    await apiKey.update({
      keyHash: newKeyHash,
      keyPrefix: newKeyPrefix,
      lastUsedAt: null, // Reset usage tracking
      metadata: {
        ...apiKey.metadata,
        regeneratedAt: new Date(),
        regeneratedBy: req.user.username,
        regeneratedByEmail: req.user.email,
        previousRegenerations: (apiKey.metadata?.previousRegenerations || 0) + 1,
        usageCount: 0 // Reset usage count
      }
    });

    res.status(200).json({
      success: true,
      message: 'API key regenerated successfully',
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: newApiKey, // Only return the actual key on regeneration
        keyPrefix: newKeyPrefix,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
        creator: apiKey.creator ? {
          id: apiKey.creator.id,
          username: apiKey.creator.username,
          firstName: apiKey.creator.firstName,
          lastName: apiKey.creator.lastName,
        } : null
      }
    });

  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      throw new ValidationError(`Failed to regenerate API key: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
});

/**
 * Get API key usage statistics
 * GET /api/settings/api-keys/:id/stats
 */
const getApiKeyStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const apiKey = await models.ApiKey.findOne({
    where: { id, organizationId }
  });

  if (!apiKey) {
    throw new NotFoundError('API key not found');
  }

  // Get usage statistics (this could be enhanced with actual usage tracking)
  const stats = {
    totalUsage: apiKey.metadata?.usageCount || 0,
    lastUsed: apiKey.lastUsedAt,
    createdAt: apiKey.createdAt,
    isActive: apiKey.isActive,
    daysActive: apiKey.createdAt ? Math.floor((new Date() - apiKey.createdAt) / (1000 * 60 * 60 * 24)) : 0,
    permissions: apiKey.permissions,
    expiresAt: apiKey.expiresAt,
    isExpired: apiKey.isExpired()
  };

  res.status(200).json({
    success: true,
    stats
  });
});

/**
 * Authenticate request using API key (for external use)
 * This function is used by the API key middleware
 */
const authenticateApiKey = async (keyString) => {
  if (!keyString || !keyString.startsWith('opensoc_')) {
    throw new AuthenticationError('Invalid API key format');
  }

  // Get all active API keys and check each one with bcrypt.compare
  // This is necessary because bcrypt generates different hashes for the same input due to salt
  const activeApiKeys = await models.ApiKey.scope('active').findAll({
    include: [
      {
        model: models.Organization,
        as: 'organization'
      },
      {
        model: models.User,
        as: 'creator',
        attributes: ['id', 'username', 'email', 'firstName', 'lastName']
      }
    ]
  });

  let matchedApiKey = null;
  
  // Check each active API key with bcrypt.compare
  for (const apiKey of activeApiKeys) {
    const isMatch = await bcrypt.compare(keyString, apiKey.keyHash);
    if (isMatch) {
      matchedApiKey = apiKey;
      break;
    }
  }

  if (!matchedApiKey) {
    throw new AuthenticationError('Invalid or expired API key');
  }

  if (!matchedApiKey.isActive) {
    throw new AuthenticationError('API key is deactivated');
  }

  if (matchedApiKey.isExpired()) {
    throw new AuthenticationError('API key has expired');
  }

  // Update last used timestamp (asynchronously to avoid slowing down the request)
  setImmediate(() => {
    matchedApiKey.updateLastUsed().catch(error => {
      console.error('Failed to update API key last used timestamp:', error);
    });
  });

  return {
    apiKey: matchedApiKey,
    organization: matchedApiKey.organization,
    permissions: matchedApiKey.permissions
  };
};

module.exports = {
  getApiKeys,
  createApiKey,
  deactivateApiKey,
  updateApiKey,
  regenerateApiKey,
  getApiKeyStats,
  authenticateApiKey,
  generateApiKey,
  hashApiKey
};