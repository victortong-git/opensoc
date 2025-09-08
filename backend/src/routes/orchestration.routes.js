const express = require('express');
const router = express.Router();
const natService = require('../services/natService');
const orchestrationController = require('../controllers/orchestration.controller');

/**
 * @route GET /api/orchestration/nat/status
 * @desc Get NAT server status and health information
 */
router.get('/nat/status', async (req, res) => {
  try {
    const status = await natService.getServerStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching NAT status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NAT server status',
      details: error.message
    });
  }
});

/**
 * @route POST /api/orchestration/nat/test-hello
 * @desc Test hello agent via NAT server
 */
router.post('/nat/test-hello', async (req, res) => {
  try {
    const { input } = req.body;
    const result = await natService.testHelloAgent(input);
    
    res.json({
      success: result.success,
      message: result.message,
      duration: result.duration,
      timestamp: new Date().toISOString(),
      rawOutput: result.rawOutput
    });
  } catch (error) {
    console.error('Error testing hello agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test hello agent',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/orchestration/nat/test-calculation
 * @desc Test calculation agent via NAT server
 */
router.post('/nat/test-calculation', async (req, res) => {
  try {
    const { input } = req.body;
    const result = await natService.testCalculationAgent(input);
    
    res.json({
      success: result.success,
      message: result.message,
      duration: result.duration,
      timestamp: new Date().toISOString(),
      rawOutput: result.rawOutput,
      fullResponse: result.fullResponse
    });
  } catch (error) {
    console.error('Error testing calculation agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test calculation agent',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/orchestration/nat/test-connection
 * @desc Test basic connection to NAT server
 */
router.post('/nat/test-connection', async (req, res) => {
  try {
    const result = await natService.testConnection();
    
    res.json({
      success: result.success,
      message: result.message,
      duration: result.duration,
      timestamp: new Date().toISOString(),
      details: result.details
    });
  } catch (error) {
    console.error('Error testing NAT connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test NAT connection',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/orchestration/nat/tools
 * @desc Get available workflows from NAT server using HTTP API
 */
router.get('/nat/tools', async (req, res) => {
  try {
    console.log('🔄 Route: Fetching available workflows...');
    const tools = await natService.getAvailableTools();
    console.log(`✅ Route: Retrieved ${tools ? tools.length : 0} workflows`);
    
    res.json({
      success: true,
      tools: tools || [],
      count: (tools || []).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error listing NAT workflows:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to list NAT workflows',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/orchestration/nat/workflows/:workflowName/schema
 * @desc Get detailed schema for a specific NAT workflow
 */
router.get('/nat/workflows/:workflowName/schema', async (req, res) => {
  try {
    const { workflowName } = req.params;
    const schema = await natService.getToolSchema(workflowName);
    
    if (schema) {
      res.json({
        success: true,
        workflow: schema,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Workflow not found',
        workflowName: workflowName,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error getting workflow schema:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow schema',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/orchestration/nat/test-workflow
 * @desc Test any NAT workflow with provided input
 */
router.post('/nat/test-workflow', async (req, res) => {
  try {
    const { workflowName, inputMessage, timeout } = req.body;
    
    if (!inputMessage) {
      return res.status(400).json({
        success: false,
        error: 'Input message is required',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await natService.executeNATRequest(inputMessage, timeout || 900);
    
    res.json({
      success: result.success,
      message: result.message,
      duration: result.duration,
      timestamp: new Date().toISOString(),
      rawOutput: result.rawOutput,
      workflowName: workflowName,
      inputMessage: inputMessage
    });
  } catch (error) {
    console.error('Error testing NAT workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test NAT workflow',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/orchestration/nat/test-virustotal
 * @desc Test VirusTotal analyzer via NAT server
 */
router.post('/nat/test-virustotal', async (req, res) => {
  try {
    const { input, testType } = req.body;
    
    const result = await natService.testVirusTotalAnalyzer(input, testType);
    
    res.json({
      success: result.success,
      message: result.message,
      duration: result.duration,
      timestamp: new Date().toISOString(),
      rawOutput: result.rawOutput,
      fullResponse: result.fullResponse,
      testType: result.testType,
      testInput: result.testInput
    });
  } catch (error) {
    console.error('Error testing VirusTotal analyzer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test VirusTotal analyzer',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/orchestration/nat/test-orchestration
 * @desc Test orchestration analysis via NAT server
 */
router.post('/nat/test-orchestration', async (req, res) => {
  try {
    const { alertData } = req.body;
    
    if (!alertData) {
      return res.status(400).json({
        success: false,
        error: 'alertData is required',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await natService.executeOrchestrationAnalysis(alertData);
    
    res.json({
      success: result.success,
      message: result.message,
      duration: result.duration,
      timestamp: new Date().toISOString(),
      rawOutput: result.rawOutput,
      fullResponse: result.fullResponse
    });
  } catch (error) {
    console.error('Error testing orchestration analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test orchestration analysis',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/orchestration/nat/workflows
 * @desc Get list of available NAT workflows
 */
router.get('/nat/workflows', async (req, res) => {
  try {
    const workflows = await natService.getAvailableTools();
    
    res.json({
      success: true,
      workflows: workflows,
      count: workflows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching NAT workflows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NAT workflows',
      details: error.message,
      workflows: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/orchestration/nat/logs
 * @desc Get recent NAT server logs
 */
router.get('/nat/logs', async (req, res) => {
  try {
    const { lines = 50 } = req.query;
    const result = await natService.getServerLogs(parseInt(lines));
    
    res.json({
      success: result.success,
      logs: result.logs,
      error: result.error,
      timestamp: result.timestamp,
      linesRequested: parseInt(lines)
    });
  } catch (error) {
    console.error('Error fetching NAT logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NAT server logs',
      details: error.message,
      logs: [],
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/orchestration/nat/restart
 * @desc Restart NAT server container (admin only)
 */
router.post('/nat/restart', async (req, res) => {
  try {
    // Check if user is admin (you may need to add auth middleware)
    // const { user } = req;
    // if (user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }
    
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    await execPromise(`docker compose restart nvidia-nat`);
    
    // Wait a moment for container to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get updated status
    const status = await natService.getServerStatus();
    
    res.json({
      success: true,
      message: 'NAT server restarted successfully',
      status: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error restarting NAT server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restart NAT server',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// MCP Server routes
router.get('/mcp/status', orchestrationController.getMCPStatus);
router.get('/mcp/workflows', orchestrationController.getMCPTools);
router.post('/mcp/test-connection', orchestrationController.testMCPConnection);
router.post('/mcp/test-calculation', orchestrationController.testMCPCalculation);
router.post('/mcp/test-virustotal', orchestrationController.testMCPVirusTotal);
router.post('/mcp/test-workflow', orchestrationController.testMCPWorkflow);

module.exports = router;