const { models, sequelize } = require('../database/models');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/error.middleware');
const embeddingHelper = require('../services/embeddingHelper');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

/**
 * Get all assets with filtering and pagination
 * GET /api/assets
 */
const getAssets = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    assetType,
    status,
    criticality,
    search,
    riskScoreMin,
    riskScoreMax,
    isActive,
  } = req.query;

  // Build where clause
  const where = { organizationId };

  // Apply filters
  if (assetType) {
    const typeArray = Array.isArray(assetType) ? assetType : [assetType];
    where.assetType = { [Op.in]: typeArray };
  }

  if (status) {
    const statusArray = Array.isArray(status) ? status : [status];
    where.status = { [Op.in]: statusArray };
  }

  if (criticality) {
    const criticalityArray = Array.isArray(criticality) ? criticality : [criticality];
    where.criticality = { [Op.in]: criticalityArray.map(c => parseInt(c)) };
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (riskScoreMin || riskScoreMax) {
    where.riskScore = {};
    if (riskScoreMin) where.riskScore[Op.gte] = parseInt(riskScoreMin);
    if (riskScoreMax) where.riskScore[Op.lte] = parseInt(riskScoreMax);
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { hostname: { [Op.iLike]: `%${search}%` } },
      { ipAddress: { [Op.iLike]: `%${search}%` } },
      { owner: { [Op.iLike]: `%${search}%` } },
      { location: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Calculate offset
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    console.log(`Fetching assets: page=${page}, limit=${limit}, offset=${offset}, where=`, JSON.stringify(where));
    
    // Get assets with pagination
    const { count, rows: assets } = await models.Asset.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: models.Alert,
          as: 'alerts',
          attributes: ['id', 'title', 'severity', 'status', 'eventTime'],
          limit: 3,
          order: [['eventTime', 'DESC']],
          required: false,
        },
      ],
    });

    console.log(`Assets query result: count=${count}, assets=${assets.length}`);

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / parseInt(limit));
    const hasNext = parseInt(page) < totalPages;
    const hasPrev = parseInt(page) > 1;

    const response = {
      assets,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNext,
        hasPrev,
      },
    };

    console.log(`Assets response: pagination=`, JSON.stringify(response.pagination));
    res.status(200).json(response);

  } catch (error) {
    console.error('Assets query failed:', error);
    
    // Return empty response with error indication
    res.status(200).json({
      assets: [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: parseInt(limit),
        hasNext: false,
        hasPrev: false,
      },
      error: 'Failed to fetch assets',
    });
  }
});

/**
 * Get single asset by ID
 * GET /api/assets/:id
 */
const getAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const asset = await models.Asset.findOne({
    where: { id, organizationId },
    include: [
      {
        model: models.Alert,
        as: 'alerts',
        order: [['eventTime', 'DESC']],
        limit: 10,
      },
    ],
  });

  if (!asset) {
    throw new NotFoundError('Asset not found');
  }

  res.status(200).json({ asset });
});

/**
 * Create new asset
 * POST /api/assets
 */
const createAsset = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  const assetData = {
    ...req.body,
    organizationId,
    lastSeen: new Date(),
  };

  // Validate required fields
  if (!assetData.name || !assetData.assetType) {
    throw new ValidationError('Name and asset type are required');
  }

  const asset = await models.Asset.create(assetData);

  // Trigger automatic embedding generation (fire-and-forget)
  embeddingHelper.triggerEmbeddingForRecord('asset', asset.id, 'create');

  // Get the created asset with associations
  const createdAsset = await models.Asset.findByPk(asset.id, {
    include: [
      {
        model: models.Alert,
        as: 'alerts',
        limit: 3,
        order: [['eventTime', 'DESC']],
        required: false,
      },
    ],
  });

  res.status(201).json({
    message: 'Asset created successfully',
    asset: createdAsset,
  });
});

/**
 * Update asset
 * PUT /api/assets/:id
 */
const updateAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const asset = await models.Asset.findOne({
    where: { id, organizationId },
  });

  if (!asset) {
    throw new NotFoundError('Asset not found');
  }

  // Update lastSeen if the asset is being marked as online
  const updateData = { ...req.body };
  if (updateData.status === 'online') {
    updateData.lastSeen = new Date();
  }

  // Store original status before update
  const originalStatus = asset.status;
  
  await asset.update(updateData);

  // Trigger automatic embedding generation for updates (fire-and-forget)
  embeddingHelper.triggerEmbeddingForRecord('asset', asset.id, 'update');

  // Get updated asset with associations
  const updatedAsset = await models.Asset.findByPk(asset.id, {
    include: [
      {
        model: models.Alert,
        as: 'alerts',
        limit: 3,
        order: [['eventTime', 'DESC']],
        required: false,
      },
    ],
  });

  // Create notifications for status changes
  try {
    if (updateData.status && originalStatus !== updateData.status) {
      // Add previous status to updatedAsset for notification service
      updatedAsset.previousStatus = originalStatus;
      await notificationService.createFromAsset(updatedAsset, updateData.status);
    }
  } catch (error) {
    console.error('Failed to create notification for asset update:', error);
    // Don't fail the request if notification creation fails
  }

  res.status(200).json({
    message: 'Asset updated successfully',
    asset: updatedAsset,
  });
});

/**
 * Delete asset
 * DELETE /api/assets/:id
 */
const deleteAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const asset = await models.Asset.findOne({
    where: { id, organizationId },
  });

  if (!asset) {
    throw new NotFoundError('Asset not found');
  }

  await asset.destroy();

  res.status(200).json({
    message: 'Asset deleted successfully',
  });
});

/**
 * Get asset vulnerability summary
 * GET /api/assets/:id/vulnerabilities
 */
const getAssetVulnerabilities = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const asset = await models.Asset.findOne({
    where: { id, organizationId },
  });

  if (!asset) {
    throw new NotFoundError('Asset not found');
  }

  // Mock vulnerability data - in real implementation this would come from vulnerability scanners
  const vulnerabilities = {
    critical: asset.metadata?.vulnerabilities?.critical || 0,
    high: asset.metadata?.vulnerabilities?.high || 0,
    medium: asset.metadata?.vulnerabilities?.medium || 0,
    low: asset.metadata?.vulnerabilities?.low || 0,
    info: asset.metadata?.vulnerabilities?.info || 0,
    lastScan: asset.metadata?.lastVulnerabilityScan || null,
    summary: `${asset.vulnerabilityCount} total vulnerabilities found`,
  };

  res.status(200).json({
    asset: {
      id: asset.id,
      name: asset.name,
      hostname: asset.hostname,
      ipAddress: asset.ipAddress,
    },
    vulnerabilities,
  });
});

/**
 * Get asset security events
 * GET /api/assets/:id/events
 */
const getAssetEvents = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 20, page = 1 } = req.query;
  const organizationId = req.user.organizationId;

  const asset = await models.Asset.findOne({
    where: { id, organizationId },
  });

  if (!asset) {
    throw new NotFoundError('Asset not found');
  }

  // Get alerts related to this asset
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { count, rows: alerts } = await models.Alert.findAndCountAll({
    where: {
      organizationId,
      assetName: asset.name, // Assuming alerts reference assets by name for now
    },
    limit: parseInt(limit),
    offset,
    order: [['eventTime', 'DESC']],
  });

  // Calculate pagination metadata
  const totalPages = Math.ceil(count / parseInt(limit));
  const hasNext = parseInt(page) < totalPages;
  const hasPrev = parseInt(page) > 1;

  res.status(200).json({
    asset: {
      id: asset.id,
      name: asset.name,
      hostname: asset.hostname,
    },
    events: alerts,
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
 * Helper function to create an asset (used by test data generation)
 * Creates asset with proper embedding triggers
 */
const createAssetHelper = async (assetData, user) => {
  console.log('🔧 DEBUG: createAssetHelper called with:', { name: assetData?.name, isTestData: assetData?.isTestData });
  const organizationId = user.organizationId;
  
  // Validate and clean IP address
  let ipAddress = assetData.ipAddress;
  if (ipAddress === 'N/A' || ipAddress === '' || ipAddress === 'null' || ipAddress === 'undefined') {
    ipAddress = null;
  } else if (ipAddress && typeof ipAddress === 'string') {
    // Basic IP address validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    if (!ipRegex.test(ipAddress)) {
      console.log(`🔧 DEBUG: Invalid IP address "${ipAddress}" for asset ${assetData?.name}, setting to null`);
      ipAddress = null;
    }
  }
  
  const finalAssetData = {
    ...assetData,
    organizationId,
    ipAddress,
    // Explicitly handle isTestData parameter for test data consistency
    isTestData: assetData.isTestData === true || assetData.isTestData === 'true',
    lastSeen: assetData.lastSeen || new Date(),
    firstDiscovered: assetData.firstDiscovered || new Date(),
  };

  const asset = await models.Asset.create(finalAssetData);
  console.log('🔧 DEBUG: Asset created with ID:', asset.id);

  // Trigger automatic embedding generation (fire-and-forget)
  console.log('🔧 DEBUG: About to trigger embedding for asset', asset.id);
  embeddingHelper.triggerEmbeddingForRecord('asset', asset.id, 'create');
  console.log('🔧 DEBUG: Triggered embedding for asset', asset.id);

  // Get the created asset (no complex associations needed for assets)
  const createdAsset = await models.Asset.findByPk(asset.id);

  return createdAsset;
};

module.exports = {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetVulnerabilities,
  getAssetEvents,
  createAssetHelper,
};