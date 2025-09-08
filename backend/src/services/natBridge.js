
class NATBridge {
  constructor() {
    this.mcpServerUrl = 'http://172.21.0.60:9901';
    this.mcpSSEEndpoint = 'http://172.21.0.60:9901/sse';
    this.natFastAPIUrl = 'http://172.21.0.60:8000';
    this.mcpClient = null;
  }


  /**
   * Execute NAT analysis via FastAPI HTTP endpoint on docker internal IP
   */
  async executeNATAnalysis(input, timeoutSeconds = 600) {
    const startTime = Date.now();
    
    try {
      console.log(`🔗 NAT Bridge: Using FastAPI HTTP to communicate with NAT server`);
      
      const axios = require('axios');
      
      // Call NAT FastAPI generate endpoint
      const response = await axios.post(`${this.natFastAPIUrl}/generate`, {
        input_message: input
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: timeoutSeconds * 1000
      });
      
      const duration = Date.now() - startTime;
      
      if (response.data && response.data.value) {
        console.log('✅ NAT analysis successful via FastAPI HTTP');
        return {
          success: true,
          message: 'NAT analysis completed via FastAPI HTTP',
          duration: duration,
          rawOutput: response.data.value
        };
      } else {
        console.error('❌ NAT FastAPI returned invalid response format');
        throw new Error(`Invalid response format: ${JSON.stringify(response.data)}`);
      }
      
    } catch (error) {
      console.error('❌ NAT bridge failed:', error.message);
      
      return {
        success: false,
        message: `NAT bridge failed: ${error.message}`,
        duration: Date.now() - startTime,
        rawOutput: `Error: ${error.message}`
      };
    }
  }

}

module.exports = new NATBridge();