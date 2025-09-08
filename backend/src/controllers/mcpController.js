const mcpService = require('../services/mcpService');

class MCPController {
  async getMCPStatus(req, res) {
    try {
      console.info('🔍 Getting MCP server status...');
      
      const health = await mcpService.checkMCPServerHealth();
      
      res.json({
        success: true,
        isHealthy: health.isHealthy,
        serverName: 'OpenSOC NAT MCP Server',
        containerStatus: health.isHealthy ? 'running' : 'error',
        containerHealth: health.isHealthy ? 'healthy' : 'unhealthy',
        endpoint: health.endpoint,
        error: health.error
      });
    } catch (error) {
      console.error('❌ Failed to get MCP status:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        isHealthy: false,
        containerStatus: 'error'
      });
    }
  }

  async getMCPTools(req, res) {
    try {
      console.info('🔍 Getting MCP tools...');
      
      const toolsResult = await mcpService.getMCPTools();
      
      res.json({
        success: toolsResult.success,
        workflows: toolsResult.tools || [],
        error: toolsResult.error
      });
    } catch (error) {
      console.error('❌ Failed to get MCP tools:', error);
      res.status(500).json({
        success: false,
        workflows: [],
        error: error.message
      });
    }
  }

  async testMCPConnection(req, res) {
    try {
      console.info('🔗 Testing MCP connection...');
      
      const result = await mcpService.testMCPConnection();
      
      res.json(result);
    } catch (error) {
      console.error('❌ MCP connection test failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: `Connection test failed: ${error.message}`
      });
    }
  }

  async testMCPCalculation(req, res) {
    try {
      const { input } = req.body;
      console.info(`🧮 Testing MCP calculation: ${input}`);
      
      const result = await mcpService.callMCPTool('code_execution', input);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'MCP calculation completed successfully',
          rawOutput: JSON.stringify(result.result, null, 2),
          fullResponse: result.result,
          duration: result.duration
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          message: `Calculation failed: ${result.error}`
        });
      }
    } catch (error) {
      console.error('❌ MCP calculation test failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: `Calculation test failed: ${error.message}`
      });
    }
  }

  async testMCPVirusTotal(req, res) {
    try {
      const { input, testType } = req.body;
      console.info(`🦠 Testing MCP VirusTotal: ${testType} - ${input}`);
      
      const samples = {
        hash: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
        url: 'https://www.google.com',
        domain: 'google.com'
      };
      
      const testInput = input || samples[testType] || samples.hash;
      const virusPrompt = `Analyze this ${testType} using VirusTotal: ${testInput}. Provide detailed threat analysis.`;
      
      const result = await mcpService.callMCPTool('virustotal_analyzer', virusPrompt);
      
      if (result.success) {
        res.json({
          success: true,
          message: `MCP VirusTotal ${testType} analysis completed`,
          rawOutput: JSON.stringify(result.result, null, 2),
          fullResponse: result.result,
          duration: result.duration
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          message: `VirusTotal analysis failed: ${result.error}`
        });
      }
    } catch (error) {
      console.error('❌ MCP VirusTotal test failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: `VirusTotal test failed: ${error.message}`
      });
    }
  }

  async testMCPWorkflow(req, res) {
    try {
      const { workflowName, inputMessage, timeout } = req.body;
      console.info(`🔧 Testing MCP workflow: ${workflowName}`);
      
      const result = await mcpService.callMCPTool(workflowName, inputMessage, { timeout });
      
      if (result.success) {
        res.json({
          success: true,
          message: `MCP workflow ${workflowName} completed successfully`,
          rawOutput: JSON.stringify(result.result, null, 2),
          fullResponse: result.result,
          duration: result.duration
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          message: `Workflow ${workflowName} failed: ${result.error}`
        });
      }
    } catch (error) {
      console.error(`❌ MCP workflow ${req.body.workflowName} test failed:`, error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: `Workflow test failed: ${error.message}`
      });
    }
  }

  async runMCPOrchestration(req, res) {
    try {
      const { alertId } = req.params;
      const { alertData, assetInfo, userContext } = req.body;
      
      console.info(`🎯 Starting MCP orchestration for alert ${alertId}...`);
      
      const result = await mcpService.performMCPOrchestration(alertData, assetInfo, userContext);
      
      if (result.status === 'completed') {
        res.json({
          success: true,
          orchestrationResult: result,
          message: 'MCP orchestration completed successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          message: `MCP orchestration failed: ${result.error}`
        });
      }
    } catch (error) {
      console.error('❌ MCP orchestration failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: `Orchestration failed: ${error.message}`
      });
    }
  }
}

module.exports = new MCPController();