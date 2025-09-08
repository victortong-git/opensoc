const { models, sequelize } = require('../database/models');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/error.middleware');
const embeddingHelper = require('../services/embeddingHelper');
const { Op } = require('sequelize');

/**
 * Get all IOCs with filtering and pagination
 * GET /api/threat-intel/iocs
 */
const getIOCs = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const {
    page = 1,
    limit = 20,
    sortBy = 'lastSeen',
    sortOrder = 'desc',
    type,
    confidence,
    severity,
    source,
    isActive,
    search,
    tags,
    mitreAttack,
    startDate,
    endDate,
  } = req.query;

  // Build where clause
  const where = { organizationId };

  // Apply filters
  if (type) {
    const typeArray = Array.isArray(type) ? type : [type];
    where.type = { [Op.in]: typeArray };
  }

  if (confidence) {
    const confidenceArray = Array.isArray(confidence) ? confidence : [confidence];
    where.confidence = { [Op.in]: confidenceArray };
  }

  if (severity) {
    const severityArray = Array.isArray(severity) ? severity : [severity];
    where.severity = { [Op.in]: severityArray.map(s => parseInt(s)) };
  }

  if (source) {
    where.source = { [Op.iLike]: `%${source}%` };
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    where.tags = { [Op.overlap]: tagArray };
  }

  if (mitreAttack) {
    const mitreArray = Array.isArray(mitreAttack) ? mitreAttack : [mitreAttack];
    where.mitreAttack = { [Op.overlap]: mitreArray };
  }

  if (startDate && endDate) {
    where.lastSeen = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  } else if (startDate) {
    where.lastSeen = { [Op.gte]: new Date(startDate) };
  } else if (endDate) {
    where.lastSeen = { [Op.lte]: new Date(endDate) };
  }

  if (search) {
    where[Op.or] = [
      { value: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { source: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Calculate offset
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Get IOCs with pagination
  const { count, rows: iocs } = await models.IOC.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
  });

  // Calculate pagination metadata
  const totalPages = Math.ceil(count / parseInt(limit));
  const hasNext = parseInt(page) < totalPages;
  const hasPrev = parseInt(page) > 1;

  res.status(200).json({
    iocs,
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
 * Get single IOC by ID
 * GET /api/threat-intel/iocs/:id
 */
const getIOC = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const ioc = await models.IOC.findOne({
    where: { id, organizationId },
  });

  if (!ioc) {
    throw new NotFoundError('IOC not found');
  }

  res.status(200).json({ ioc });
});

/**
 * Create new IOC
 * POST /api/threat-intel/iocs
 */
const createIOC = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  const iocData = {
    ...req.body,
    organizationId,
    firstSeen: req.body.firstSeen || new Date(),
    lastSeen: req.body.lastSeen || new Date(),
  };

  const ioc = await models.IOC.create(iocData);

  // Trigger automatic embedding generation (fire-and-forget)
  embeddingHelper.triggerEmbeddingForRecord('ioc', ioc.id, 'create');

  res.status(201).json({
    message: 'IOC created successfully',
    ioc,
  });
});

/**
 * Create multiple IOCs in bulk
 * POST /api/threat-intel/iocs/bulk
 */
const createBulkIOCs = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { iocs: iocsData } = req.body;

  if (!iocsData || !Array.isArray(iocsData) || iocsData.length === 0) {
    throw new ValidationError('IOCs array is required');
  }

  // Add organization ID and timestamps to each IOC
  const enrichedIOCs = iocsData.map(ioc => ({
    ...ioc,
    organizationId,
    firstSeen: ioc.firstSeen || new Date(),
    lastSeen: ioc.lastSeen || new Date(),
  }));

  const createdIOCs = await models.IOC.bulkCreate(enrichedIOCs, {
    returning: true,
    validate: true,
  });

  // Trigger automatic embedding generation for all created IOCs (fire-and-forget)
  createdIOCs.forEach(ioc => {
    embeddingHelper.triggerEmbeddingForRecord('ioc', ioc.id, 'create');
  });

  res.status(201).json({
    message: `${createdIOCs.length} IOCs created successfully`,
    count: createdIOCs.length,
    iocs: createdIOCs,
  });
});

/**
 * Update IOC
 * PUT /api/threat-intel/iocs/:id
 */
const updateIOC = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const ioc = await models.IOC.findOne({
    where: { id, organizationId },
  });

  if (!ioc) {
    throw new NotFoundError('IOC not found');
  }

  // Update lastSeen timestamp if not explicitly provided
  const updateData = {
    ...req.body,
    lastSeen: req.body.lastSeen || new Date(),
  };

  await ioc.update(updateData);

  // Trigger automatic embedding generation for updates (fire-and-forget)
  embeddingHelper.triggerEmbeddingForRecord('ioc', ioc.id, 'update');

  res.status(200).json({
    message: 'IOC updated successfully',
    ioc,
  });
});

/**
 * Delete IOC
 * DELETE /api/threat-intel/iocs/:id
 */
const deleteIOC = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const ioc = await models.IOC.findOne({
    where: { id, organizationId },
  });

  if (!ioc) {
    throw new NotFoundError('IOC not found');
  }

  await ioc.destroy();

  res.status(200).json({
    message: 'IOC deleted successfully',
  });
});

/**
 * Deactivate IOC (soft delete)
 * POST /api/threat-intel/iocs/:id/deactivate
 */
const deactivateIOC = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organizationId = req.user.organizationId;

  const ioc = await models.IOC.findOne({
    where: { id, organizationId },
  });

  if (!ioc) {
    throw new NotFoundError('IOC not found');
  }

  await ioc.update({ isActive: false });

  res.status(200).json({
    message: 'IOC deactivated successfully',
    ioc,
  });
});

/**
 * Search IOCs by value pattern
 * POST /api/threat-intel/iocs/search
 */
const searchIOCs = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  const { values, exactMatch = false } = req.body;

  if (!values || !Array.isArray(values) || values.length === 0) {
    throw new ValidationError('Values array is required');
  }

  let whereConditions;
  if (exactMatch) {
    whereConditions = {
      organizationId,
      value: { [Op.in]: values },
      isActive: true,
    };
  } else {
    const likeConditions = values.map(value => ({
      value: { [Op.iLike]: `%${value}%` }
    }));
    whereConditions = {
      organizationId,
      [Op.or]: likeConditions,
      isActive: true,
    };
  }

  const iocs = await models.IOC.findAll({
    where: whereConditions,
    order: [['severity', 'DESC'], ['confidence', 'DESC']],
  });

  res.status(200).json({
    matches: iocs,
    count: iocs.length,
    searchTerm: values,
    exactMatch,
  });
});

/**
 * Get IOC statistics
 * GET /api/threat-intel/iocs/stats
 */
const getIOCStats = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;

  // Get statistics using raw queries for better performance
  const stats = await Promise.all([
    // Total IOCs
    models.IOC.count({ where: { organizationId } }),
    
    // Active IOCs
    models.IOC.count({ where: { organizationId, isActive: true } }),
    
    // IOCs by type
    sequelize.query(`
      SELECT type, COUNT(*) as count 
      FROM iocs 
      WHERE organization_id = :orgId AND is_active = true
      GROUP BY type
    `, {
      replacements: { orgId: organizationId },
      type: sequelize.QueryTypes.SELECT
    }),
    
    // IOCs by confidence
    sequelize.query(`
      SELECT confidence, COUNT(*) as count 
      FROM iocs 
      WHERE organization_id = :orgId AND is_active = true
      GROUP BY confidence
    `, {
      replacements: { orgId: organizationId },
      type: sequelize.QueryTypes.SELECT
    }),
    
    // IOCs by severity
    sequelize.query(`
      SELECT severity, COUNT(*) as count 
      FROM iocs 
      WHERE organization_id = :orgId AND is_active = true
      GROUP BY severity
      ORDER BY severity DESC
    `, {
      replacements: { orgId: organizationId },
      type: sequelize.QueryTypes.SELECT
    }),

    // Recent IOCs (last 7 days)
    models.IOC.count({
      where: {
        organizationId,
        lastSeen: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        isActive: true,
      }
    }),
  ]);

  res.status(200).json({
    total: stats[0],
    active: stats[1],
    byType: stats[2],
    byConfidence: stats[3],
    bySeverity: stats[4],
    recentCount: stats[5],
  });
});

/**
 * Helper function to create an IOC (used by test data generation)
 * Creates IOC with proper embedding triggers
 */
const createIOCHelper = async (iocData, user) => {
  const organizationId = user.organizationId;
  
  const finalIOCData = {
    ...iocData,
    organizationId,
    // Explicitly handle isTestData parameter for test data consistency
    isTestData: iocData.isTestData === true || iocData.isTestData === 'true',
    firstSeen: iocData.firstSeen || new Date(),
    lastSeen: iocData.lastSeen || new Date(),
    isActive: iocData.isActive !== undefined ? iocData.isActive : true,
  };

  const ioc = await models.IOC.create(finalIOCData);

  // Trigger automatic embedding generation (fire-and-forget)
  embeddingHelper.triggerEmbeddingForRecord('ioc', ioc.id, 'create');

  // Get the created IOC (no complex associations needed for IOCs)
  const createdIOC = await models.IOC.findByPk(ioc.id);

  return createdIOC;
};

module.exports = {
  getIOCs,
  getIOC,
  createIOC,
  createBulkIOCs,
  updateIOC,
  deleteIOC,
  deactivateIOC,
  searchIOCs,
  getIOCStats,
  createIOCHelper,
};