const express = require('express');
const router = express.Router();

const {
  getAIProviders,
  getActiveAIProvider,
  createAIProvider,
  updateAIProvider,
  deleteAIProvider,
  setActiveAIProvider,
  testAIProviderConnection,
  testAIProviderMessage,
  updateGlobalSettings,
  getAIProviderStats,
} = require('../controllers/ai-providers.controller');

const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const Joi = require('joi');

// Validation schemas
const createProviderSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  type: Joi.string().valid('ollama', 'vllm').required(),
  host: Joi.string().required().min(1).max(255),
  port: Joi.number().integer().min(1).max(65535).required(),
  availableModels: Joi.array().items(Joi.string()).min(1).required(),
  selectedModel: Joi.string().required(),
  maxTokens: Joi.number().integer().min(1024).max(32768).default(4096),
  maxTokenWindow: Joi.number().integer().min(2048).max(65536).default(8192),
  temperature: Joi.number().min(0).max(1).default(0.7),
  description: Joi.string().optional().allow(''),
  isEnabled: Joi.boolean().default(true),
});

const updateProviderSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  type: Joi.string().valid('ollama', 'vllm').optional(),
  host: Joi.string().min(1).max(255).optional(),
  port: Joi.number().integer().min(1).max(65535).optional(),
  availableModels: Joi.array().items(Joi.string()).min(1).optional(),
  selectedModel: Joi.string().optional(),
  maxTokens: Joi.number().integer().min(1024).max(32768).optional(),
  maxTokenWindow: Joi.number().integer().min(2048).max(65536).optional(),
  temperature: Joi.number().min(0).max(1).optional(),
  description: Joi.string().optional().allow(''),
  isEnabled: Joi.boolean().optional(),
});

const globalSettingsSchema = Joi.object({
  timeout: Joi.number().integer().min(5).max(300).optional(),
  retryAttempts: Joi.number().integer().min(1).max(10).optional(),
  enableLogging: Joi.boolean().optional(),
  enableMetrics: Joi.boolean().optional(),
  healthCheckInterval: Joi.number().integer().min(60).max(3600).optional(),
});

const uuidSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const testMessageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
});

// Apply auth middleware to all routes
router.use(requireAuth);

// Routes
router.get('/', getAIProviders);
router.get('/active', getActiveAIProvider);
router.get('/stats', getAIProviderStats);
router.post('/', validate(createProviderSchema), createAIProvider);
router.put('/global-settings', validate(globalSettingsSchema), updateGlobalSettings);
router.put('/:id', validate(updateProviderSchema), updateAIProvider);
router.delete('/:id', deleteAIProvider);
router.put('/:id/set-active', setActiveAIProvider);
router.post('/:id/test-message', validate(testMessageSchema), testAIProviderMessage);
router.post('/:id/test', testAIProviderConnection);

module.exports = router;