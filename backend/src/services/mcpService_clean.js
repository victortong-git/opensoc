const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const natBridge = require('./natBridge');

class MCPService {
  constructor() {
    // Use container network for backend-to-MCP communication
    this.mcpServerUrl = 'http://172.21.0.60:9901';
    this.containerName = 'agentic-soc-nvidia-nat';
  }

  /**
   * Execute orchestration analysis via NAT bridge to bypass Docker permission issues
   */
  async executeOrchestrationAnalysis(alertInput) {
    try {
      const startTime = Date.now();
      
      // Execute NAT analysis via bridge (bypasses Docker permission issues)
      const analysisInput = `Please perform comprehensive orchestration analysis: ${alertInput}`;
      const natResult = await natBridge.executeNATAnalysis(analysisInput, 600);
      
      const totalDuration = Date.now() - startTime;
      
      // Return NAT bridge result directly
      return {
        success: natResult.success,
        message: natResult.message || 'Orchestration analysis completed',
        duration: totalDuration,
        rawOutput: natResult.rawOutput,
        fullResponse: `=== NAT Orchestration Response ===\n\n${natResult.rawOutput}\n\nDuration: ${natResult.duration}ms\nSuccess: ${natResult.success}`
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Orchestration analysis failed: ${error.message}`,
        duration: 0,
        rawOutput: `Error: ${error.message}`
      };
    }
  }

  /**
   * Execute script generation via NAT bridge
   */
  async executeScriptGeneration(threatData, scriptLanguage = 'bash') {
    try {
      const startTime = Date.now();
      
      // Execute NAT analysis via bridge
      const scriptInput = `Generate automation scripts for threat data: ${threatData} using language: ${scriptLanguage}`;
      const natResult = await natBridge.executeNATAnalysis(scriptInput, 600);
      
      const totalDuration = Date.now() - startTime;
      
      return {
        success: natResult.success,
        message: natResult.message || 'Script generation completed',
        duration: totalDuration,
        rawOutput: natResult.rawOutput,
        fullResponse: `=== Script Generation Response ===\n\n${natResult.rawOutput}\n\nDuration: ${natResult.duration}ms\nSuccess: ${natResult.success}`
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Script generation failed: ${error.message}`,
        duration: 0,
        rawOutput: `Error: ${error.message}`
      };
    }
  }

  /**
   * Execute takedown procedures generation via NAT bridge
   */
  async executeTakedownProcedures(orchestrationData, takedownType = 'network_isolation') {
    try {
      const startTime = Date.now();
      
      // Execute NAT analysis via bridge
      const takedownInput = `Generate takedown procedures for: ${orchestrationData} with type: ${takedownType}`;
      const natResult = await natBridge.executeNATAnalysis(takedownInput, 600);
      
      const totalDuration = Date.now() - startTime;
      
      return {
        success: natResult.success,
        message: natResult.message || 'Takedown procedures completed',
        duration: totalDuration,
        rawOutput: natResult.rawOutput,
        fullResponse: `=== Takedown Procedures Response ===\n\n${natResult.rawOutput}\n\nDuration: ${natResult.duration}ms\nSuccess: ${natResult.success}`
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Takedown procedures failed: ${error.message}`,
        duration: 0,
        rawOutput: `Error: ${error.message}`
      };
    }
  }
}

module.exports = new MCPService();