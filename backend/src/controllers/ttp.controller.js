const { Op, fn, col } = require('sequelize');
const { 
  MitreTactic,
  MitreTechnique, 
  MitreProcedure,
  ThreatActor,
  Organization 
} = require('../database/models').models;

// MITRE TACTICS CONTROLLERS

// Get all MITRE tactics
const getMitreTactics = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const {
      search = '',
      isActive = '',
      dataSource = '',
      includeCustom = 'true',
      sortBy = 'order',
      sortOrder = 'asc'
    } = req.query;

    // Build where clause for global and organization-specific tactics
    const whereClause = {
      [Op.or]: [
        { organizationId: null }, // Global MITRE tactics
        ...(includeCustom === 'true' ? [{ organizationId }] : [])
      ],
      ...(isActive && { isActive: isActive === 'true' }),
      ...(dataSource && { dataSource }),
    };

    if (search) {
      whereClause[Op.and] = [
        {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { mitreId: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
          ]
        }
      ];
    }

    const tactics = await MitreTactic.findAll({
      where: whereClause,
      include: [
        {
          model: MitreTechnique,
          as: 'techniques',
          attributes: ['id', 'mitreId', 'name'],
          where: { isActive: true },
          required: false,
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    res.json({
      success: true,
      data: tactics,
    });
  } catch (error) {
    console.error('Error fetching MITRE tactics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MITRE tactics',
      error: error.message,
    });
  }
};

// Get single MITRE tactic by ID
const getMitreTacticById = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const tactic = await MitreTactic.findOne({
      where: { 
        id,
        [Op.or]: [
          { organizationId: null },
          { organizationId }
        ]
      },
      include: [
        {
          model: MitreTechnique,
          as: 'techniques',
          include: [
            {
              model: MitreProcedure,
              as: 'procedures',
              limit: 5, // Limit procedures for performance
            },
          ],
        },
      ],
    });

    if (!tactic) {
      return res.status(404).json({
        success: false,
        message: 'MITRE tactic not found',
      });
    }

    res.json({
      success: true,
      data: tactic,
    });
  } catch (error) {
    console.error('Error fetching MITRE tactic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MITRE tactic',
      error: error.message,
    });
  }
};

// Create custom MITRE tactic
const createMitreTactic = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const tacticData = {
      ...req.body,
      organizationId,
      dataSource: 'custom',
    };

    // Validate required fields
    if (!tacticData.name || !tacticData.description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required',
      });
    }

    const tactic = await MitreTactic.create(tacticData);

    res.status(201).json({
      success: true,
      message: 'Custom MITRE tactic created successfully',
      data: tactic,
    });
  } catch (error) {
    console.error('Error creating MITRE tactic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create MITRE tactic',
      error: error.message,
    });
  }
};

// MITRE TECHNIQUES CONTROLLERS

// Get all MITRE techniques
const getMitreTechniques = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const {
      page = 1,
      limit = 50,
      search = '',
      tacticId = '',
      isActive = '',
      dataSource = '',
      platforms = '',
      includeCustom = 'true',
      isSubTechnique = '',
      sortBy = 'mitreId',
      sortOrder = 'asc'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const whereClause = {
      [Op.or]: [
        { organizationId: null }, // Global MITRE techniques
        ...(includeCustom === 'true' ? [{ organizationId }] : [])
      ],
      ...(tacticId && { tacticId }),
      ...(isActive && { isActive: isActive === 'true' }),
      ...(dataSource && { dataSource }),
      ...(isSubTechnique && { isSubTechnique: isSubTechnique === 'true' }),
    };

    if (search) {
      whereClause[Op.and] = [
        {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { mitreId: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
          ]
        }
      ];
    }

    if (platforms) {
      whereClause.platforms = {
        [Op.overlap]: platforms.split(',')
      };
    }

    const totalItems = await MitreTechnique.count({
      where: whereClause,
    });

    const techniques = await MitreTechnique.findAll({
      where: whereClause,
      include: [
        {
          model: MitreTactic,
          as: 'tactic',
          attributes: ['id', 'mitreId', 'name'],
        },
        {
          model: MitreTechnique,
          as: 'parentTechnique',
          attributes: ['id', 'mitreId', 'name'],
        },
        {
          model: MitreTechnique,
          as: 'subTechniques',
          attributes: ['id', 'mitreId', 'name'],
        },
        {
          model: MitreProcedure,
          as: 'procedures',
          attributes: ['id', 'name'],
          limit: 3, // Limit for performance
        },
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    const totalPages = Math.ceil(totalItems / parseInt(limit));

    res.json({
      success: true,
      data: techniques,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching MITRE techniques:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MITRE techniques',
      error: error.message,
    });
  }
};

// Get single MITRE technique by ID
const getMitreTechniqueById = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const technique = await MitreTechnique.findOne({
      where: { 
        id,
        [Op.or]: [
          { organizationId: null },
          { organizationId }
        ]
      },
      include: [
        {
          model: MitreTactic,
          as: 'tactic',
          attributes: ['id', 'mitreId', 'name', 'description'],
        },
        {
          model: MitreTechnique,
          as: 'parentTechnique',
          attributes: ['id', 'mitreId', 'name'],
        },
        {
          model: MitreTechnique,
          as: 'subTechniques',
        },
        {
          model: MitreProcedure,
          as: 'procedures',
          include: [
            {
              model: ThreatActor,
              as: 'threatActor',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    });

    if (!technique) {
      return res.status(404).json({
        success: false,
        message: 'MITRE technique not found',
      });
    }

    res.json({
      success: true,
      data: technique,
    });
  } catch (error) {
    console.error('Error fetching MITRE technique:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MITRE technique',
      error: error.message,
    });
  }
};

// Create custom MITRE technique
const createMitreTechnique = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const techniqueData = {
      ...req.body,
      organizationId,
      dataSource: 'custom',
    };

    // Validate required fields
    if (!techniqueData.name || !techniqueData.description || !techniqueData.tacticId) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and tacticId are required',
      });
    }

    const technique = await MitreTechnique.create(techniqueData);

    // Fetch created technique with associations
    const createdTechnique = await MitreTechnique.findOne({
      where: { id: technique.id },
      include: [
        {
          model: MitreTactic,
          as: 'tactic',
          attributes: ['id', 'mitreId', 'name'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Custom MITRE technique created successfully',
      data: createdTechnique,
    });
  } catch (error) {
    console.error('Error creating MITRE technique:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create MITRE technique',
      error: error.message,
    });
  }
};

// MITRE PROCEDURES CONTROLLERS

// Get all MITRE procedures
const getMitreProcedures = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const {
      page = 1,
      limit = 25,
      search = '',
      techniqueId = '',
      threatActorId = '',
      malwareFamily = '',
      confidence = '',
      severity = '',
      complexity = '',
      isActive = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      [Op.or]: [
        { organizationId: null },
        { organizationId }
      ],
      ...(techniqueId && { techniqueId }),
      ...(threatActorId && { threatActorId }),
      ...(malwareFamily && { malwareFamily: { [Op.iLike]: `%${malwareFamily}%` } }),
      ...(confidence && { confidence }),
      ...(severity && { severity: parseInt(severity) }),
      ...(complexity && { complexity }),
      ...(isActive && { isActive: isActive === 'true' }),
    };

    if (search) {
      whereClause[Op.and] = [
        {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
            { malwareFamily: { [Op.iLike]: `%${search}%` } },
            { toolName: { [Op.iLike]: `%${search}%` } },
          ]
        }
      ];
    }

    const totalItems = await MitreProcedure.count({
      where: whereClause,
    });

    const procedures = await MitreProcedure.findAll({
      where: whereClause,
      include: [
        {
          model: MitreTechnique,
          as: 'technique',
          attributes: ['id', 'mitreId', 'name'],
          include: [
            {
              model: MitreTactic,
              as: 'tactic',
              attributes: ['id', 'mitreId', 'name'],
            },
          ],
        },
        {
          model: ThreatActor,
          as: 'threatActor',
          attributes: ['id', 'name', 'aliases'],
        },
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    const totalPages = Math.ceil(totalItems / parseInt(limit));

    res.json({
      success: true,
      data: procedures,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching MITRE procedures:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MITRE procedures',
      error: error.message,
    });
  }
};

// Get single MITRE procedure by ID
const getMitreProcedureById = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const procedure = await MitreProcedure.findOne({
      where: { 
        id,
        [Op.or]: [
          { organizationId: null },
          { organizationId }
        ]
      },
      include: [
        {
          model: MitreTechnique,
          as: 'technique',
          include: [
            {
              model: MitreTactic,
              as: 'tactic',
            },
          ],
        },
        {
          model: ThreatActor,
          as: 'threatActor',
        },
      ],
    });

    if (!procedure) {
      return res.status(404).json({
        success: false,
        message: 'MITRE procedure not found',
      });
    }

    res.json({
      success: true,
      data: procedure,
    });
  } catch (error) {
    console.error('Error fetching MITRE procedure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MITRE procedure',
      error: error.message,
    });
  }
};

// Create MITRE procedure
const createMitreProcedure = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const procedureData = {
      ...req.body,
      organizationId,
    };

    // Validate required fields
    if (!procedureData.name || !procedureData.description || !procedureData.techniqueId) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and techniqueId are required',
      });
    }

    const procedure = await MitreProcedure.create(procedureData);

    // Fetch created procedure with associations
    const createdProcedure = await MitreProcedure.findOne({
      where: { id: procedure.id },
      include: [
        {
          model: MitreTechnique,
          as: 'technique',
          attributes: ['id', 'mitreId', 'name'],
        },
        {
          model: ThreatActor,
          as: 'threatActor',
          attributes: ['id', 'name'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'MITRE procedure created successfully',
      data: createdProcedure,
    });
  } catch (error) {
    console.error('Error creating MITRE procedure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create MITRE procedure',
      error: error.message,
    });
  }
};

// Update MITRE procedure
const updateMitreProcedure = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;

    const [updatedCount] = await MitreProcedure.update(updateData, {
      where: { id, organizationId },
      returning: true,
    });

    if (updatedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'MITRE procedure not found or unauthorized',
      });
    }

    // Fetch updated procedure with associations
    const updatedProcedure = await MitreProcedure.findOne({
      where: { id },
      include: [
        {
          model: MitreTechnique,
          as: 'technique',
          attributes: ['id', 'mitreId', 'name'],
        },
        {
          model: ThreatActor,
          as: 'threatActor',
          attributes: ['id', 'name'],
        },
      ],
    });

    res.json({
      success: true,
      message: 'MITRE procedure updated successfully',
      data: updatedProcedure,
    });
  } catch (error) {
    console.error('Error updating MITRE procedure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update MITRE procedure',
      error: error.message,
    });
  }
};

// Delete MITRE procedure
const deleteMitreProcedure = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    const deletedCount = await MitreProcedure.destroy({
      where: { id, organizationId },
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'MITRE procedure not found or unauthorized',
      });
    }

    res.json({
      success: true,
      message: 'MITRE procedure deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting MITRE procedure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete MITRE procedure',
      error: error.message,
    });
  }
};

// Get TTP statistics and overview
const getTTPStats = async (req, res) => {
  try {
    const { organizationId } = req.user;

    const [
      totalTactics,
      totalTechniques,
      totalProcedures,
      customTactics,
      customTechniques,
      customProcedures,
    ] = await Promise.all([
      MitreTactic.count({
        where: {
          [Op.or]: [{ organizationId: null }, { organizationId }]
        }
      }),
      MitreTechnique.count({
        where: {
          [Op.or]: [{ organizationId: null }, { organizationId }]
        }
      }),
      MitreProcedure.count({
        where: {
          [Op.or]: [{ organizationId: null }, { organizationId }]
        }
      }),
      MitreTactic.count({ where: { organizationId } }),
      MitreTechnique.count({ where: { organizationId } }),
      MitreProcedure.count({ where: { organizationId } }),
    ]);

    // Get platform distribution for techniques
    const platformStats = await MitreTechnique.findAll({
      where: {
        [Op.or]: [{ organizationId: null }, { organizationId }],
        platforms: { [Op.not]: [] }
      },
      attributes: [
        'platforms',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['platforms'],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalTactics,
          totalTechniques,
          totalProcedures,
          customTactics,
          customTechniques,
          customProcedures,
        },
        platformDistribution: platformStats,
      },
    });
  } catch (error) {
    console.error('Error fetching TTP statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch TTP statistics',
      error: error.message,
    });
  }
};

module.exports = {
  // Tactics
  getMitreTactics,
  getMitreTacticById,
  createMitreTactic,
  
  // Techniques
  getMitreTechniques,
  getMitreTechniqueById,
  createMitreTechnique,
  
  // Procedures
  getMitreProcedures,
  getMitreProcedureById,
  createMitreProcedure,
  updateMitreProcedure,
  deleteMitreProcedure,
  
  // Statistics
  getTTPStats,
};