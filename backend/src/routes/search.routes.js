const express = require('express');
const { body, query, validationResult } = require('express-validator');
const router = express.Router();
const { search, getSuggestions, quickSearch } = require('../controllers/search.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  };
};

// Search validation schemas
const searchBodySchema = [
  body('query')
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Query must be between 1 and 500 characters'),
  body('searchType')
    .optional()
    .isIn(['keyword', 'vector', 'hybrid'])
    .withMessage('Search type must be keyword, vector, or hybrid'),
  body('entities')
    .optional()
    .isArray()
    .withMessage('Entities must be an array')
    .custom((entities) => {
      const valid = ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'];
      const invalid = entities.filter(e => !valid.includes(e));
      if (invalid.length > 0) {
        throw new Error(`Invalid entities: ${invalid.join(', ')}`);
      }
      return true;
    }),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  body('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be 0 or greater')
];

const suggestionQuerySchema = [
  query('q')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Query must be between 1 and 100 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
];

const quickSearchQuerySchema = [
  query('q')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Query must be between 1 and 200 characters'),
  query('type')
    .optional()
    .isIn(['keyword', 'vector', 'hybrid'])
    .withMessage('Search type must be keyword, vector, or hybrid'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Limit must be between 1 and 10')
];

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/search
 * Global search across all entities
 */
router.post('/',
  validate(searchBodySchema),
  search
);

/**
 * GET /api/search/suggestions
 * Get search suggestions for autocomplete
 */
router.get('/suggestions',
  validate(suggestionQuerySchema),
  getSuggestions
);

/**
 * GET /api/search/quick
 * Quick search for navbar with limited results
 */
router.get('/quick',
  validate(quickSearchQuerySchema),
  quickSearch
);

module.exports = router;