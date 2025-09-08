const express = require('express');
const mcpController = require('../controllers/mcpController');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply authentication to all MCP routes
router.use(authenticateToken);

// MCP Server Status and Health
router.get('/status', mcpController.getMCPStatus);

// MCP Tools Discovery
router.get('/workflows', mcpController.getMCPTools);

// MCP Connection Testing
router.post('/test-connection', mcpController.testMCPConnection);

// MCP Tool Testing
router.post('/test-calculation', mcpController.testMCPCalculation);
router.post('/test-virustotal', mcpController.testMCPVirusTotal);
router.post('/test-workflow', mcpController.testMCPWorkflow);

// MCP Orchestration Execution
router.post('/:alertId/orchestrate', mcpController.runMCPOrchestration);

module.exports = router;