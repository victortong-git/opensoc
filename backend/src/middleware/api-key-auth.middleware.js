const { authenticateApiKey } = require('../controllers/api-keys.controller');
const rateLimit = require('express-rate-limit');

/**
 * Extract API key from request headers
 * Supports multiple header formats:
 * - Authorization: Bearer opensoc_xxx
 * - Authorization: opensoc_xxx  
 * - X-API-Key: opensoc_xxx
 */
const extractApiKey = (req) => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    } else if (authHeader.startsWith('opensoc_')) {
      return authHeader;
    }
  }
  
  // Check X-API-Key header
  const apiKeyHeader = req.headers['x-api-key'];
  if (apiKeyHeader) {
    return apiKeyHeader;
  }
  
  return null;
};

/**
 * API Key authentication middleware for external endpoints
 * This is separate from the regular JWT auth middleware
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = extractApiKey(req);
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key authentication required',
        message: 'API key must be provided in Authorization header or X-API-Key header',
        documentation: '/api/integration/help'
      });
    }

    // Authenticate the API key
    const authResult = await authenticateApiKey(apiKey);
    
    if (!authResult) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid or expired'
      });
    }

    // Add API key authentication context to request
    req.apiAuth = {
      apiKey: {
        id: authResult.apiKey.id,
        name: authResult.apiKey.name,
        permissions: authResult.apiKey.permissions,
      },
      organization: {
        id: authResult.organization.id,
        name: authResult.organization.name,
      },
      permissions: authResult.permissions
    };

    // For compatibility with existing code, also set organizationId
    req.organizationId = authResult.organization.id;

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: error.message
      });
    }

    return res.status(500).json({
      error: 'Authentication error',
      message: 'Failed to authenticate API key'
    });
  }
};

/**
 * Check if API key has specific permission
 */
const requireApiKeyPermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiAuth) {
      return res.status(401).json({
        error: 'API key authentication required',
        message: 'This endpoint requires API key authentication'
      });
    }

    if (!req.apiAuth.permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `API key does not have required permission: ${permission}`,
        requiredPermission: permission,
        availablePermissions: req.apiAuth.permissions
      });
    }

    next();
  };
};

/**
 * Rate limiting specifically for API key endpoints
 * More restrictive than regular user endpoints
 */
const apiKeyRateLimit = rateLimit({
  windowMs: parseInt(process.env.API_KEY_RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute default
  max: parseInt(process.env.API_KEY_RATE_LIMIT_MAX_REQUESTS || '30'), // 30 requests per minute default
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many API requests. Please slow down and try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use API key ID for rate limiting instead of IP
  keyGenerator: (req) => {
    return req.apiAuth?.apiKey?.id || req.ip;
  },
  // Skip rate limiting for failed authentication (they don't have apiAuth)
  skip: (req) => {
    return !req.apiAuth;
  }
});

/**
 * Logging middleware for API key requests
 */
const apiKeyLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log the request
  console.log(`[API Key] ${req.method} ${req.originalUrl}`, {
    apiKeyId: req.apiAuth?.apiKey?.id || 'unknown',
    apiKeyName: req.apiAuth?.apiKey?.name || 'unknown',
    organizationId: req.apiAuth?.organization?.id || 'unknown',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Log the response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[API Key] Response ${res.statusCode}`, {
      apiKeyId: req.apiAuth?.apiKey?.id || 'unknown',
      duration: `${duration}ms`,
      status: res.statusCode
    });
  });

  next();
};

/**
 * Validation middleware for external alert creation
 */
const validateExternalAlert = (req, res, next) => {
  const { title, description, severity, sourceSystem } = req.body;
  
  const errors = [];
  
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('title is required and must be a non-empty string');
  }
  
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('description is required and must be a non-empty string');
  }
  
  if (!severity || !Number.isInteger(severity) || severity < 1 || severity > 5) {
    errors.push('severity is required and must be an integer between 1 and 5');
  }
  
  if (!sourceSystem || typeof sourceSystem !== 'string' || sourceSystem.trim().length === 0) {
    errors.push('sourceSystem is required and must be a non-empty string');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid alert data provided',
      details: errors,
      documentation: '/api/integration/help'
    });
  }
  
  next();
};

module.exports = {
  apiKeyAuth,
  requireApiKeyPermission,
  apiKeyRateLimit,
  apiKeyLogger,
  validateExternalAlert,
  extractApiKey
};