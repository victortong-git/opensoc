/**
 * Specific Record Query Tools
 * High-performance direct database lookup tools for exact record retrieval
 * Complements vector-based RAG search with precise structured queries
 */
// @ts-nocheck

const { models } = require('../../database/models');
const { Op } = require('sequelize');
const { Alert, Incident, Asset, IOC, Playbook } = models;

/**
 * Tool Definitions for Specific Record Queries
 */
const SPECIFIC_RECORD_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_specific_alert_by_id",
      description: "Retrieve specific alert by exact ID, title, or unique identifier with full details",
      category: "Specific Record Lookup",
      parameters: {
        type: "object",
        properties: {
          identifier: {
            type: "string",
            description: "Alert ID (UUID), title, or unique identifier"
          },
          includeRelated: {
            type: "boolean",
            default: true,
            description: "Include related incidents, timeline, and analysis data"
          },
          includeTimeline: {
            type: "boolean",
            default: true,
            description: "Include alert timeline events and status changes"
          }
        },
        required: ["identifier"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_specific_incident_by_id",
      description: "Retrieve specific incident by exact ID, title, or unique identifier with full details",
      category: "Specific Record Lookup",
      parameters: {
        type: "object",
        properties: {
          identifier: {
            type: "string",
            description: "Incident ID (UUID), title, or unique identifier"
          },
          includeAlerts: {
            type: "boolean",
            default: true,
            description: "Include all related alerts and their details"
          },
          includeTimeline: {
            type: "boolean",
            default: true,
            description: "Include incident timeline events and resolution history"
          }
        },
        required: ["identifier"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_alerts_by_criteria",
      description: "Retrieve alerts using precise structured criteria (time, severity, status, source, etc.)",
      category: "Structured Filtering",
      parameters: {
        type: "object",
        properties: {
          timeRange: {
            type: "object",
            properties: {
              start: { type: "string", description: "Start time (ISO string or relative like '24h')" },
              end: { type: "string", description: "End time (ISO string)" },
              preset: { type: "string", enum: ["today", "yesterday", "last_24h", "last_7d", "last_30d"] }
            },
            description: "Time range filter"
          },
          severity: {
            type: "object",
            properties: {
              operator: { type: "string", enum: ["equals", "gte", "lte", "gt", "lt"], default: "equals" },
              value: { type: "integer", minimum: 1, maximum: 5 }
            },
            description: "Severity filter"
          },
          status: {
            type: "array",
            items: {
              type: "string",
              enum: ["new", "incident_likely", "analysis_uncertain", "review_required", "investigating", "resolved", "false_positive"]
            },
            description: "Alert status filter"
          },
          sourceSystem: {
            type: "array",
            items: { type: "string" },
            description: "Source systems to filter by"
          },
          assetName: {
            type: "array",
            items: { type: "string" },
            description: "Asset names to filter by"
          },
          ipAddresses: {
            type: "array",
            items: { type: "string" },
            description: "IP addresses to search in alert data"
          },
          domains: {
            type: "array",
            items: { type: "string" },
            description: "Domain names to search in alert data"
          },
          containsText: {
            type: "string",
            description: "Text search in title and description"
          },
          limit: {
            type: "integer",
            default: 50,
            maximum: 200,
            description: "Maximum number of results"
          },
          sortBy: {
            type: "string",
            enum: ["eventTime", "severity", "status", "createdAt"],
            default: "eventTime",
            description: "Sort field"
          },
          sortOrder: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
            description: "Sort order"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_incidents_by_criteria",
      description: "Retrieve incidents using precise structured criteria with comprehensive details",
      category: "Structured Filtering",
      parameters: {
        type: "object",
        properties: {
          timeRange: {
            type: "object",
            properties: {
              start: { type: "string", description: "Start time (ISO string or relative like '24h')" },
              end: { type: "string", description: "End time (ISO string)" },
              preset: { type: "string", enum: ["today", "yesterday", "last_24h", "last_7d", "last_30d"] }
            },
            description: "Time range filter"
          },
          severity: {
            type: "object",
            properties: {
              operator: { type: "string", enum: ["equals", "gte", "lte", "gt", "lt"], default: "equals" },
              value: { type: "integer", minimum: 1, maximum: 5 }
            },
            description: "Severity filter"
          },
          status: {
            type: "array",
            items: {
              type: "string",
              enum: ["new", "investigating", "resolved", "closed"]
            },
            description: "Incident status filter"
          },
          category: {
            type: "array",
            items: { type: "string" },
            description: "Incident categories to filter by"
          },
          assignedTo: {
            type: "string",
            description: "User ID or name of assigned investigator"
          },
          containsText: {
            type: "string",
            description: "Text search in title and description"
          },
          minAlertCount: {
            type: "integer",
            description: "Minimum number of related alerts"
          },
          limit: {
            type: "integer",
            default: 30,
            maximum: 100,
            description: "Maximum number of results"
          },
          sortBy: {
            type: "string",
            enum: ["createdAt", "severity", "status", "alertCount"],
            default: "createdAt",
            description: "Sort field"
          },
          sortOrder: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
            description: "Sort order"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_assets_by_attributes",
      description: "Find assets by specific attributes like IP, hostname, asset type, or criticality",
      category: "Asset Lookup",
      parameters: {
        type: "object",
        properties: {
          ipAddress: {
            type: "string",
            description: "Exact IP address to search for"
          },
          ipRange: {
            type: "string",
            description: "IP range in CIDR notation (e.g., 192.168.1.0/24)"
          },
          hostname: {
            type: "string",
            description: "Hostname or partial hostname match"
          },
          assetName: {
            type: "string",
            description: "Asset name or partial name match"
          },
          assetType: {
            type: "array",
            items: {
              type: "string",
              enum: ["server", "workstation", "network_device", "mobile_device", "iot_device", "virtual_machine", "container", "cloud_service"]
            },
            description: "Asset types to filter by"
          },
          criticality: {
            type: "array",
            items: {
              type: "string",
              enum: ["low", "medium", "high", "critical"]
            },
            description: "Asset criticality levels"
          },
          osType: {
            type: "string",
            description: "Operating system type or partial match"
          },
          includeAlerts: {
            type: "boolean",
            default: false,
            description: "Include recent alerts for found assets"
          },
          limit: {
            type: "integer",
            default: 50,
            maximum: 200,
            description: "Maximum number of results"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_iocs_by_criteria",
      description: "Find Indicators of Compromise (IOCs) by type, value, confidence, or related attributes",
      category: "IOC Lookup",
      parameters: {
        type: "object",
        properties: {
          iocType: {
            type: "array",
            items: {
              type: "string",
              enum: ["ip", "domain", "url", "file_hash", "email", "registry_key"]
            },
            description: "IOC types to search for"
          },
          value: {
            type: "string",
            description: "Exact IOC value or partial match"
          },
          confidence: {
            type: "object",
            properties: {
              operator: { type: "string", enum: ["equals", "gte", "lte"], default: "gte" },
              level: { type: "string", enum: ["low", "medium", "high", "very_high"] }
            },
            description: "Confidence level filter"
          },
          severity: {
            type: "object",
            properties: {
              operator: { type: "string", enum: ["equals", "gte", "lte", "gt", "lt"], default: "gte" },
              value: { type: "integer", minimum: 1, maximum: 5 }
            },
            description: "IOC severity filter"
          },
          isActive: {
            type: "boolean",
            description: "Filter by active/inactive IOCs"
          },
          source: {
            type: "string",
            description: "IOC source system or feed"
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "IOC tags to filter by"
          },
          timeRange: {
            type: "object",
            properties: {
              start: { type: "string", description: "Start time for firstSeen/lastSeen" },
              end: { type: "string", description: "End time for firstSeen/lastSeen" },
              field: { type: "string", enum: ["firstSeen", "lastSeen"], default: "lastSeen" }
            },
            description: "Time range filter for IOC activity"
          },
          limit: {
            type: "integer",
            default: 50,
            maximum: 200,
            description: "Maximum number of results"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "intelligent_query_router",
      description: "Analyze query intent and route to optimal retrieval method (specific record, structured filter, or semantic search)",
      category: "Query Intelligence",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "User's natural language query to analyze and route"
          },
          context: {
            type: "object",
            properties: {
              userId: { type: "string" },
              organizationId: { type: "string" },
              conversationHistory: { type: "array", items: { type: "string" } }
            },
            description: "Additional context for query routing decisions"
          },
          performValidation: {
            type: "boolean",
            default: true,
            description: "Validate classification against actual database content"
          }
        },
        required: ["query"]
      }
    }
  }
];

/**
 * Specific Record Tools Executor
 */
class SpecificRecordExecutor {
  constructor() {
    this.Alert = Alert;
    this.Incident = Incident;
    this.Asset = Asset;
    this.IOC = IOC;
    this.Playbook = Playbook;
    this.queryClassificationService = null; // Will be injected to avoid circular dependency
  }

  /**
   * Set query classification service (dependency injection)
   */
  setQueryClassificationService(service) {
    this.queryClassificationService = service;
  }

  /**
   * Get specific alert by ID with comprehensive details
   */
  async getSpecificAlertById(params) {
    try {
      const { identifier, includeRelated = true, includeTimeline = true } = params;
      
      console.log(`🔍 Looking up specific alert: ${identifier}`);

      // Extract UUID from identifier if it contains one
      const uuidPattern = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
      const uuidMatch = identifier.match(uuidPattern);
      const extractedUUID = uuidMatch ? uuidMatch[0] : null;

      // Build where clause based on identifier type
      let whereClause;
      
      if (extractedUUID) {
        // If we found a UUID, search by ID first, then fallback to text search
        whereClause = {
          [Op.or]: [
            { id: extractedUUID },
            { title: { [Op.iLike]: `%${extractedUUID}%` } },
            { description: { [Op.iLike]: `%${extractedUUID}%` } }
          ]
        };
      } else if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(identifier)) {
        // Pure UUID
        whereClause = { id: identifier };
      } else {
        // Text-based search
        whereClause = {
          [Op.or]: [
            { title: { [Op.iLike]: `%${identifier}%` } },
            { description: { [Op.iLike]: `%${identifier}%` } }
          ]
        };
      }

      const alert = await this.Alert.findOne({
        where: whereClause,
        include: includeRelated ? [
          // Include related models if available
        ] : []
      });

      if (!alert) {
        return {
          success: false,
          error: `No alert found matching identifier: ${identifier}`,
          identifier,
          searchStrategy: 'specific_id_lookup'
        };
      }

      const result = {
        success: true,
        alert: alert.toJSON(),
        searchStrategy: 'specific_id_lookup',
        identifier,
        metadata: {
          matchType: alert.id === identifier ? 'exact_id' : 'text_match',
          found: 1
        }
      };

      // Add timeline if requested
      if (includeTimeline) {
        result.timeline = await this.getAlertTimeline(alert.id);
      }

      // Add related incidents if requested
      if (includeRelated) {
        result.relatedIncidents = await this.getRelatedIncidents(alert.id);
      }

      return result;

    } catch (error) {
      console.error('❌ Error getting specific alert:', error);
      return {
        success: false,
        error: error.message,
        identifier: params.identifier
      };
    }
  }

  /**
   * Get specific incident by ID with comprehensive details
   */
  async getSpecificIncidentById(params) {
    try {
      const { identifier, includeAlerts = true, includeTimeline = true } = params;
      
      console.log(`🔍 Looking up specific incident: ${identifier}`);

      // Extract UUID from identifier if it contains one
      const uuidPattern = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
      const uuidMatch = identifier.match(uuidPattern);
      const extractedUUID = uuidMatch ? uuidMatch[0] : null;

      // Build where clause based on identifier type
      let whereClause;
      
      if (extractedUUID) {
        whereClause = {
          [Op.or]: [
            { id: extractedUUID },
            { title: { [Op.iLike]: `%${extractedUUID}%` } },
            { description: { [Op.iLike]: `%${extractedUUID}%` } }
          ]
        };
      } else if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(identifier)) {
        whereClause = { id: identifier };
      } else {
        whereClause = {
          [Op.or]: [
            { title: { [Op.iLike]: `%${identifier}%` } },
            { description: { [Op.iLike]: `%${identifier}%` } }
          ]
        };
      };

      const incident = await this.Incident.findOne({
        where: whereClause
      });

      if (!incident) {
        return {
          success: false,
          error: `No incident found matching identifier: ${identifier}`,
          identifier,
          searchStrategy: 'specific_id_lookup'
        };
      }

      const result = {
        success: true,
        incident: incident.toJSON(),
        searchStrategy: 'specific_id_lookup',
        identifier,
        metadata: {
          matchType: incident.id === identifier ? 'exact_id' : 'text_match',
          found: 1
        }
      };

      // Add related alerts if requested
      if (includeAlerts && incident.alertIds && incident.alertIds.length > 0) {
        result.relatedAlerts = await this.Alert.findAll({
          where: {
            id: { [Op.in]: incident.alertIds }
          },
          order: [['eventTime', 'DESC']]
        });
      }

      return result;

    } catch (error) {
      console.error('❌ Error getting specific incident:', error);
      return {
        success: false,
        error: error.message,
        identifier: params.identifier
      };
    }
  }

  /**
   * Get alerts by structured criteria
   */
  async getAlertsByCriteria(params) {
    try {
      const {
        timeRange,
        severity,
        status,
        sourceSystem,
        assetName,
        ipAddresses,
        domains,
        containsText,
        limit = 50,
        sortBy = 'eventTime',
        sortOrder = 'desc'
      } = params;

      console.log(`🔍 Searching alerts with structured criteria`);

      const whereClause = {};
      const searchComponents = [];

      // Time range filter
      if (timeRange) {
        const timeFilter = this.buildTimeRangeFilter(timeRange);
        if (timeFilter) {
          whereClause.eventTime = timeFilter;
          searchComponents.push(`time: ${JSON.stringify(timeRange)}`);
        }
      }

      // Severity filter
      if (severity) {
        whereClause.severity = this.buildComparisonFilter(severity);
        searchComponents.push(`severity ${severity.operator || 'equals'} ${severity.value}`);
      }

      // Status filter
      if (status && status.length > 0) {
        whereClause.status = { [Op.in]: status };
        searchComponents.push(`status: ${status.join(', ')}`);
      }

      // Source system filter
      if (sourceSystem && sourceSystem.length > 0) {
        whereClause.sourceSystem = { [Op.in]: sourceSystem };
        searchComponents.push(`source: ${sourceSystem.join(', ')}`);
      }

      // Asset name filter
      if (assetName && assetName.length > 0) {
        whereClause.assetName = { [Op.in]: assetName };
        searchComponents.push(`asset: ${assetName.join(', ')}`);
      }

      // IP address search
      if (ipAddresses && ipAddresses.length > 0) {
        const ipConditions = ipAddresses.map(ip => ({
          [Op.or]: [
            { rawData: { [Op.iLike]: `%${ip}%` } },
            { description: { [Op.iLike]: `%${ip}%` } },
            { title: { [Op.iLike]: `%${ip}%` } }
          ]
        }));
        whereClause[Op.or] = whereClause[Op.or] ? [...whereClause[Op.or], ...ipConditions] : ipConditions;
        searchComponents.push(`IPs: ${ipAddresses.join(', ')}`);
      }

      // Domain search
      if (domains && domains.length > 0) {
        const domainConditions = domains.map(domain => ({
          [Op.or]: [
            { rawData: { [Op.iLike]: `%${domain}%` } },
            { description: { [Op.iLike]: `%${domain}%` } },
            { title: { [Op.iLike]: `%${domain}%` } }
          ]
        }));
        whereClause[Op.or] = whereClause[Op.or] ? [...whereClause[Op.or], ...domainConditions] : domainConditions;
        searchComponents.push(`domains: ${domains.join(', ')}`);
      }

      // Text search
      if (containsText) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${containsText}%` } },
          { description: { [Op.iLike]: `%${containsText}%` } }
        ];
        searchComponents.push(`text: "${containsText}"`);
      }

      // Execute query
      const alerts = await this.Alert.findAll({
        where: whereClause,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: Math.min(limit, 200)
      });

      return {
        success: true,
        alerts: alerts.map(alert => alert.toJSON()),
        searchStrategy: 'structured_criteria',
        criteria: searchComponents,
        metadata: {
          found: alerts.length,
          limited: alerts.length === limit,
          sortBy,
          sortOrder,
          searchComponents
        }
      };

    } catch (error) {
      console.error('❌ Error searching alerts by criteria:', error);
      return {
        success: false,
        error: error.message,
        criteria: params
      };
    }
  }

  /**
   * Get incidents by structured criteria
   */
  async getIncidentsByCriteria(params) {
    try {
      const {
        timeRange,
        severity,
        status,
        category,
        assignedTo,
        containsText,
        minAlertCount,
        limit = 30,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      console.log(`🔍 Searching incidents with structured criteria`);

      const whereClause = {};
      const searchComponents = [];

      // Time range filter
      if (timeRange) {
        const timeFilter = this.buildTimeRangeFilter(timeRange);
        if (timeFilter) {
          whereClause.createdAt = timeFilter;
          searchComponents.push(`time: ${JSON.stringify(timeRange)}`);
        }
      }

      // Severity filter
      if (severity) {
        whereClause.severity = this.buildComparisonFilter(severity);
        searchComponents.push(`severity ${severity.operator || 'equals'} ${severity.value}`);
      }

      // Status filter
      if (status && status.length > 0) {
        whereClause.status = { [Op.in]: status };
        searchComponents.push(`status: ${status.join(', ')}`);
      }

      // Category filter
      if (category && category.length > 0) {
        whereClause.category = { [Op.in]: category };
        searchComponents.push(`category: ${category.join(', ')}`);
      }

      // Assigned to filter
      if (assignedTo) {
        whereClause[Op.or] = [
          { assignedTo: assignedTo },
          { assignedToName: { [Op.iLike]: `%${assignedTo}%` } }
        ];
        searchComponents.push(`assigned to: ${assignedTo}`);
      }

      // Text search
      if (containsText) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${containsText}%` } },
          { description: { [Op.iLike]: `%${containsText}%` } }
        ];
        searchComponents.push(`text: "${containsText}"`);
      }

      // Minimum alert count filter
      if (minAlertCount) {
        whereClause.alertCount = { [Op.gte]: minAlertCount };
        searchComponents.push(`min alerts: ${minAlertCount}`);
      }

      const incidents = await this.Incident.findAll({
        where: whereClause,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: Math.min(limit, 100)
      });

      return {
        success: true,
        incidents: incidents.map(incident => incident.toJSON()),
        searchStrategy: 'structured_criteria',
        criteria: searchComponents,
        metadata: {
          found: incidents.length,
          limited: incidents.length === limit,
          sortBy,
          sortOrder,
          searchComponents
        }
      };

    } catch (error) {
      console.error('❌ Error searching incidents by criteria:', error);
      return {
        success: false,
        error: error.message,
        criteria: params
      };
    }
  }

  /**
   * Search assets by attributes
   */
  async searchAssetsByAttributes(params) {
    try {
      const {
        ipAddress,
        ipRange,
        hostname,
        assetName,
        assetType,
        criticality,
        osType,
        includeAlerts = false,
        limit = 50
      } = params;

      console.log(`🔍 Searching assets by attributes`);

      const whereClause = {};
      const searchComponents = [];

      // IP address filters
      if (ipAddress) {
        whereClause.ipAddress = ipAddress;
        searchComponents.push(`IP: ${ipAddress}`);
      }

      if (ipRange) {
        // For CIDR range matching, we'd need more complex logic
        // For now, do partial matching
        const baseIp = ipRange.split('/')[0].substring(0, ipRange.lastIndexOf('.'));
        whereClause.ipAddress = { [Op.iLike]: `${baseIp}.%` };
        searchComponents.push(`IP range: ${ipRange}`);
      }

      // Hostname filter
      if (hostname) {
        whereClause.hostname = { [Op.iLike]: `%${hostname}%` };
        searchComponents.push(`hostname: ${hostname}`);
      }

      // Asset name filter
      if (assetName) {
        whereClause.name = { [Op.iLike]: `%${assetName}%` };
        searchComponents.push(`asset: ${assetName}`);
      }

      // Asset type filter
      if (assetType && assetType.length > 0) {
        whereClause.assetType = { [Op.in]: assetType };
        searchComponents.push(`type: ${assetType.join(', ')}`);
      }

      // Criticality filter
      if (criticality && criticality.length > 0) {
        whereClause.criticality = { [Op.in]: criticality };
        searchComponents.push(`criticality: ${criticality.join(', ')}`);
      }

      // OS type filter
      if (osType) {
        whereClause.osType = { [Op.iLike]: `%${osType}%` };
        searchComponents.push(`OS: ${osType}`);
      }

      const assets = await this.Asset.findAll({
        where: whereClause,
        limit: Math.min(limit, 200),
        order: [['name', 'ASC']]
      });

      const result = {
        success: true,
        assets: assets.map(asset => asset.toJSON()),
        searchStrategy: 'asset_attributes',
        criteria: searchComponents,
        metadata: {
          found: assets.length,
          limited: assets.length === limit,
          searchComponents
        }
      };

      // Include recent alerts for assets if requested
      if (includeAlerts && assets.length > 0) {
        const assetNames = assets.map(asset => asset.name);
        const recentAlerts = await this.Alert.findAll({
          where: {
            assetName: { [Op.in]: assetNames }
          },
          order: [['eventTime', 'DESC']],
          limit: 10
        });
        result.recentAlerts = recentAlerts.map(alert => alert.toJSON());
      }

      return result;

    } catch (error) {
      console.error('❌ Error searching assets by attributes:', error);
      return {
        success: false,
        error: error.message,
        criteria: params
      };
    }
  }

  /**
   * Get IOCs by criteria
   */
  async getIOCsByCriteria(params) {
    try {
      const {
        iocType,
        value,
        confidence,
        severity,
        isActive,
        source,
        tags,
        timeRange,
        limit = 50
      } = params;

      console.log(`🔍 Searching IOCs by criteria`);

      const whereClause = {};
      const searchComponents = [];

      // IOC type filter
      if (iocType && iocType.length > 0) {
        whereClause.type = { [Op.in]: iocType };
        searchComponents.push(`type: ${iocType.join(', ')}`);
      }

      // Value filter
      if (value) {
        whereClause.value = { [Op.iLike]: `%${value}%` };
        searchComponents.push(`value: ${value}`);
      }

      // Confidence filter
      if (confidence) {
        const confidenceLevels = { low: 1, medium: 2, high: 3, very_high: 4 };
        const confidenceValue = confidenceLevels[confidence.level];
        if (confidenceValue) {
          whereClause.confidence = this.buildComparisonFilter({
            operator: confidence.operator,
            value: confidenceValue
          });
          searchComponents.push(`confidence ${confidence.operator} ${confidence.level}`);
        }
      }

      // Severity filter
      if (severity) {
        whereClause.severity = this.buildComparisonFilter(severity);
        searchComponents.push(`severity ${severity.operator || 'equals'} ${severity.value}`);
      }

      // Active status filter
      if (typeof isActive === 'boolean') {
        whereClause.isActive = isActive;
        searchComponents.push(`active: ${isActive}`);
      }

      // Source filter
      if (source) {
        whereClause.source = { [Op.iLike]: `%${source}%` };
        searchComponents.push(`source: ${source}`);
      }

      // Tags filter (JSONB array search)
      if (tags && tags.length > 0) {
        whereClause.tags = { [Op.contains]: tags };
        searchComponents.push(`tags: ${tags.join(', ')}`);
      }

      // Time range filter
      if (timeRange) {
        const timeFilter = this.buildTimeRangeFilter(timeRange);
        const timeField = timeRange.field || 'lastSeen';
        if (timeFilter) {
          whereClause[timeField] = timeFilter;
          searchComponents.push(`${timeField}: ${JSON.stringify(timeRange)}`);
        }
      }

      const iocs = await this.IOC.findAll({
        where: whereClause,
        order: [['lastSeen', 'DESC']],
        limit: Math.min(limit, 200)
      });

      return {
        success: true,
        iocs: iocs.map(ioc => ioc.toJSON()),
        searchStrategy: 'ioc_criteria',
        criteria: searchComponents,
        metadata: {
          found: iocs.length,
          limited: iocs.length === limit,
          searchComponents
        }
      };

    } catch (error) {
      console.error('❌ Error searching IOCs by criteria:', error);
      return {
        success: false,
        error: error.message,
        criteria: params
      };
    }
  }

  /**
   * Intelligent query router - uses classification service
   */
  async intelligentQueryRouter(params) {
    try {
      const { query, context = {}, performValidation = true } = params;

      if (!this.queryClassificationService) {
        return {
          success: false,
          error: 'Query classification service not available',
          fallback: 'Use semantic search for this query'
        };
      }

      console.log(`🧠 Routing query: "${query}"`);

      // Classify the query
      const classification = await this.queryClassificationService.classifyQuery(query, context);

      // Validate classification if requested
      let validation = null;
      if (performValidation) {
        validation = await this.queryClassificationService.validateClassification(classification);
      }

      return {
        success: true,
        classification,
        validation,
        recommendations: this.generateRoutingRecommendations(classification, validation),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error in intelligent query router:', error);
      return {
        success: false,
        error: error.message,
        fallback: 'Use semantic search for this query'
      };
    }
  }

  /**
   * Helper methods
   */

  buildTimeRangeFilter(timeRange) {
    if (timeRange.preset) {
      const now = new Date();
      switch (timeRange.preset) {
        case 'today':
          return { [Op.gte]: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
          const endOfYesterday = new Date(startOfYesterday);
          endOfYesterday.setDate(endOfYesterday.getDate() + 1);
          return { [Op.between]: [startOfYesterday, endOfYesterday] };
        case 'last_24h':
          return { [Op.gte]: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
        case 'last_7d':
          return { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        case 'last_30d':
          return { [Op.gte]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      }
    }

    if (timeRange.start && timeRange.end) {
      return { [Op.between]: [new Date(timeRange.start), new Date(timeRange.end)] };
    }

    if (timeRange.start) {
      // Handle relative time strings like '24h', '7d'
      if (typeof timeRange.start === 'string' && /^\d+[hdwm]$/.test(timeRange.start)) {
        const value = parseInt(timeRange.start);
        const unit = timeRange.start.slice(-1);
        const multipliers = { h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000, w: 7 * 24 * 60 * 60 * 1000, m: 30 * 24 * 60 * 60 * 1000 };
        const milliseconds = value * (multipliers[unit] || multipliers.h);
        return { [Op.gte]: new Date(Date.now() - milliseconds) };
      }
      return { [Op.gte]: new Date(timeRange.start) };
    }

    return null;
  }

  buildComparisonFilter(comparison) {
    const { operator = 'equals', value } = comparison;
    
    switch (operator) {
      case 'equals': return value;
      case 'gte': return { [Op.gte]: value };
      case 'lte': return { [Op.lte]: value };
      case 'gt': return { [Op.gt]: value };
      case 'lt': return { [Op.lt]: value };
      default: return value;
    }
  }

  async getAlertTimeline(alertId) {
    try {
      // This would query alert timeline events if that model exists
      // For now, return basic info
      return [
        {
          timestamp: new Date().toISOString(),
          event: 'Alert retrieved via specific record lookup',
          source: 'system'
        }
      ];
    } catch (error) {
      console.error('Error getting alert timeline:', error);
      return [];
    }
  }

  async getRelatedIncidents(alertId) {
    try {
      const incidents = await this.Incident.findAll({
        where: {
          alertIds: { [Op.contains]: [alertId] }
        }
      });
      return incidents.map(incident => incident.toJSON());
    } catch (error) {
      console.error('Error getting related incidents:', error);
      return [];
    }
  }

  generateRoutingRecommendations(classification, validation) {
    const recommendations = [];
    const { queryType, confidence, suggestedTools } = classification;

    recommendations.push(`Primary approach: ${queryType} (${Math.round(confidence * 100)}% confidence)`);
    recommendations.push(`Suggested tools: ${suggestedTools.join(', ')}`);

    if (validation) {
      if (validation.potentialRecords === 0) {
        recommendations.push('No exact matches found - consider broadening search criteria');
      } else if (validation.potentialRecords > 0) {
        recommendations.push(`Approximately ${validation.potentialRecords} records match your criteria`);
      }

      validation.suggestions.forEach(suggestion => {
        recommendations.push(suggestion);
      });
    }

    return recommendations;
  }
}

module.exports = {
  SPECIFIC_RECORD_TOOLS,
  SpecificRecordExecutor
};