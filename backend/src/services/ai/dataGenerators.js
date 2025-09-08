const AIGenerator = require('./aiGenerator');

class DataGenerators {
  constructor() {
    this.aiGenerator = new AIGenerator();
  }

  /**
   * Helper method to add custom context to any prompt
   */
  addCustomContext(basePrompt, config = {}) {
    let enhancedPrompt = basePrompt;

    if (config.customDescription) {
      enhancedPrompt += `

Additional Context: ${config.customDescription}`;
    }

    if (config.customRequirements) {
      enhancedPrompt += `

Specific Requirements: ${config.customRequirements}`;
    }

    if (config.customExamples) {
      enhancedPrompt += `

Example Reference: ${config.customExamples}`;
    }
    
    return enhancedPrompt;
  }

  /**
   * Generate test alerts
   */
  async generateAlerts(config) {
    const { quantity, severityDistribution, scenario, timeRange } = config;
    const prompt = this.buildAlertPrompt(quantity, severityDistribution, scenario, timeRange, config);
    
    const result = await this.aiGenerator.generate(prompt);
    const data = this.aiGenerator.parseJsonResponse(result.response);
    
    // Enforce exact quantity
    const trimmedData = data.slice(0, quantity);
    console.log(`🎯 Alert quantity control: requested=${quantity}, parsed=${data.length}, final=${trimmedData.length}`);
    
    const validatedData = this.aiGenerator.validateGeneratedData(trimmedData, 'alert');
    
    return {
      data: validatedData,
      metadata: result
    };
  }

  /**
   * Generate test incidents
   */
  async generateIncidents(config) {
    const { quantity, scenario, timeRange } = config;
    const prompt = this.buildIncidentPrompt(quantity, scenario, timeRange, config);
    
    const result = await this.aiGenerator.generate(prompt);
    const data = this.aiGenerator.parseJsonResponse(result.response);
    
    // Enforce exact quantity
    const trimmedData = data.slice(0, quantity);
    console.log(`🎯 Incident quantity control: requested=${quantity}, parsed=${data.length}, final=${trimmedData.length}`);
    
    const validatedData = this.aiGenerator.validateGeneratedData(trimmedData, 'incident');
    
    return {
      data: validatedData,
      metadata: result
    };
  }

  /**
   * Generate test assets
   */
  async generateAssets(config) {
    const { quantity, scenario } = config;
    const prompt = this.buildAssetPrompt(quantity, scenario, config);
    
    const result = await this.aiGenerator.generate(prompt);
    const data = this.aiGenerator.parseJsonResponse(result.response);
    
    // Enforce exact quantity
    const trimmedData = data.slice(0, quantity);
    console.log(`🎯 Asset quantity control: requested=${quantity}, parsed=${data.length}, final=${trimmedData.length}`);
    
    const validatedData = this.aiGenerator.validateGeneratedData(trimmedData, 'asset');
    
    return {
      data: validatedData,
      metadata: result
    };
  }

  /**
   * Generate test IOCs
   */
  async generateIOCs(config) {
    const { quantity, scenario } = config;
    const prompt = this.buildIOCPrompt(quantity, scenario, config);
    
    const result = await this.aiGenerator.generate(prompt);
    const data = this.aiGenerator.parseJsonResponse(result.response);
    
    // Enforce exact quantity
    const trimmedData = data.slice(0, quantity);
    console.log(`🎯 IOC quantity control: requested=${quantity}, parsed=${data.length}, final=${trimmedData.length}`);
    
    const validatedData = this.aiGenerator.validateGeneratedData(trimmedData, 'ioc');
    
    return {
      data: validatedData,
      metadata: result
    };
  }

  /**
   * Generate test playbooks
   */
  async generatePlaybooks(config) {
    const { quantity, scenario } = config;
    const prompt = this.buildPlaybookPrompt(quantity, scenario, config);
    
    const result = await this.aiGenerator.generate(prompt);
    const data = this.aiGenerator.parseJsonResponse(result.response);
    
    // Enforce exact quantity
    const trimmedData = data.slice(0, quantity);
    console.log(`🎯 Playbook quantity control: requested=${quantity}, parsed=${data.length}, final=${trimmedData.length}`);
    
    const validatedData = this.aiGenerator.validateGeneratedData(trimmedData, 'playbook');
    
    return {
      data: validatedData,
      metadata: result
    };
  }

  /**
   * Generate test threat actors
   */
  async generateThreatActors(config) {
    const { quantity, scenario } = config;
    const prompt = this.buildThreatActorPrompt(quantity, scenario, config);
    
    const result = await this.aiGenerator.generate(prompt);
    const data = this.aiGenerator.parseJsonResponse(result.response);
    
    // Enforce exact quantity
    const trimmedData = data.slice(0, quantity);
    console.log(`🎯 Threat Actor quantity control: requested=${quantity}, parsed=${data.length}, final=${trimmedData.length}`);
    
    const validatedData = this.aiGenerator.validateGeneratedData(trimmedData, 'threat_actor');
    
    return {
      data: validatedData,
      metadata: result
    };
  }

  /**
   * Generate test threat campaigns
   */
  async generateThreatCampaigns(config) {
    const { quantity, scenario } = config;
    const prompt = this.buildThreatCampaignPrompt(quantity, scenario, config);
    
    const result = await this.aiGenerator.generate(prompt);
    const data = this.aiGenerator.parseJsonResponse(result.response);
    
    // Enforce exact quantity
    const trimmedData = data.slice(0, quantity);
    console.log(`🎯 Threat Campaign quantity control: requested=${quantity}, parsed=${data.length}, final=${trimmedData.length}`);
    
    const validatedData = this.aiGenerator.validateGeneratedData(trimmedData, 'threat_campaign');
    
    return {
      data: validatedData,
      metadata: result
    };
  }

  /**
   * Build alert generation prompt
   */
  buildAlertPrompt(quantity, severityDistribution, scenario, timeRange, config = {}) {
    const basePrompt = `Generate ${quantity} realistic cybersecurity alerts in JSON format for SOC testing.

Scenario: ${scenario}
Time range: ${timeRange}
Severity distribution: ${JSON.stringify(severityDistribution)}

Each alert must have these exact fields:
- title: string (descriptive alert title)
- description: string (detailed description)
- severity: number (1-5, distribute according to severityDistribution)
- sourceSystem: string (detection system name)
- category: string (malware/intrusion/data_breach/policy_violation/insider_threat)
- assetName: string (affected asset name)
- eventTime: string (ISO timestamp)
- status: string (MUST be one of: new/investigating/resolved/false_positive)
- rawData: object (sample log data)
- enrichmentData: object (additional context)

Return only valid JSON array with no markdown formatting.`;

    return this.addCustomContext(basePrompt, config);
  }

  /**
   * Build incident generation prompt
   */
  buildIncidentPrompt(quantity, scenario, timeRange, config = {}) {
    const basePrompt = `Generate ${quantity} realistic security incidents in JSON format for SOC testing.

Scenario: ${scenario}
Time range: ${timeRange}

Each incident must have these exact fields:
- title: string (incident title)
- description: string (detailed description)
- severity: number (1-5)
- category: string (malware/intrusion/data_breach/policy_violation/insider_threat)
- status: string (open/investigating/contained/resolved)
- priority: string (low/medium/high/critical)
- assignedTo: string (analyst name)
- assignedToName: string (full analyst name)
- alertCount: number (number of related alerts, 0-10)
- metadata: object (additional incident data)

Return only valid JSON array with no markdown formatting.`;

    return this.addCustomContext(basePrompt, config);
  }

  /**
   * Build asset generation prompt
   */
  buildAssetPrompt(quantity, scenario, config = {}) {
    const basePrompt = `Generate ${quantity} realistic IT assets in JSON format for SOC testing.

Scenario: ${scenario}

Each asset must have these exact fields:
- name: string (unique asset name)
- assetType: string (server/workstation/network_device/mobile_device/iot_device/virtual_machine/container/cloud_service)
- ipAddress: string (valid IPv4 address or null)
- hostname: string (hostname or null)
- osType: string (Windows/Linux/macOS/iOS/Android or null)
- operatingSystem: string (detailed OS version or null)
- criticality: string (low/medium/high/critical)
- location: string (physical/logical location)
- owner: string (asset owner name)
- description: string (asset description)
- status: string (active/inactive/maintenance/decommissioned)
- environment: string (production/staging/development/test)

Return only valid JSON array with no markdown formatting.`;

    return this.addCustomContext(basePrompt, config);
  }

  /**
   * Build IOC generation prompt
   */
  buildIOCPrompt(quantity, scenario, config = {}) {
    const basePrompt = `Generate ${quantity} realistic indicators of compromise (IOCs) in JSON format for SOC testing.

Scenario: ${scenario}

Each IOC must have these exact fields:
- type: string (ip/domain/url/file_hash/email/registry_key)
- value: string (the actual IOC value)
- confidence: string (low/medium/high/very_high)
- severity: number (1-5)
- description: string (IOC description)
- source: string (threat intelligence source)
- tags: array of strings (relevant tags)
- firstSeen: string (ISO timestamp or null)
- lastSeen: string (ISO timestamp or null)
- isActive: boolean (true/false)
- mitreAttack: array of strings (MITRE ATT&CK techniques)

Return only valid JSON array with no markdown formatting.`;

    return this.addCustomContext(basePrompt, config);
  }

  /**
   * Build playbook generation prompt
   */
  buildPlaybookPrompt(quantity, scenario, config = {}) {
    const basePrompt = `Generate ${quantity} realistic security playbooks in JSON format for SOC testing.

Scenario: ${scenario}

Each playbook must have these exact fields:
- name: string (playbook name)
- description: string (playbook description)
- category: string (incident_response/threat_hunting/forensics/compliance)
- triggerType: string (manual/automatic)
- steps: array of objects (playbook steps with title and description)
- isActive: boolean (true/false)
- executionCount: number (how many times executed, 0-100)
- successRate: number (success percentage, 0-100)
- averageExecutionTime: number (minutes, 1-240)

Return only valid JSON array with no markdown formatting.`;

    return this.addCustomContext(basePrompt, config);
  }

  /**
   * Build threat actor generation prompt
   */
  buildThreatActorPrompt(quantity, scenario, config = {}) {
    const basePrompt = `Generate ${quantity} realistic threat actors in JSON format for SOC testing.

Scenario: ${scenario}

Each threat actor must have these exact fields:
- name: string (threat actor name/codename)
- aliases: array of strings (known aliases)
- description: string (threat actor description)
- motivation: array of strings (financial/espionage/hacktivism/terrorism)
- sophistication: string (basic/intermediate/advanced/expert)
- origin: string (country/region of origin)
- targetSectors: array of strings (targeted industry sectors)
- techniques: array of strings (MITRE ATT&CK techniques used)
- campaigns: array of strings (known campaigns)
- isActive: boolean (currently active)
- firstSeen: string (ISO timestamp)
- lastSeen: string (ISO timestamp)
- metadata: object (additional data)

Return only valid JSON array with no markdown formatting.`;

    return this.addCustomContext(basePrompt, config);
  }

  /**
   * Build threat campaign generation prompt
   */
  buildThreatCampaignPrompt(quantity, scenario, config = {}) {
    const basePrompt = `Generate ${quantity} realistic threat campaigns in JSON format for SOC testing.

Scenario: ${scenario}

Each threat campaign must have these exact fields:
- name: string (campaign name)
- description: string (campaign description)
- startDate: string (ISO timestamp)
- endDate: string (ISO timestamp or null if ongoing)
- isActive: boolean (currently active)
- targetSectors: array of strings (targeted sectors)
- targetGeographies: array of strings (targeted countries/regions)
- techniques: array of strings (MITRE ATT&CK techniques)
- objectives: array of strings (campaign objectives)
- severity: number (1-5)
- confidence: string (low/medium/high/very_high)
- victimCount: number (estimated victims, 1-10000)
- estimatedImpact: string (impact description)
- associatedIOCs: array of strings (related IOC values)
- relatedIncidents: array of strings (related incident IDs)
- tags: array of strings (relevant tags)
- metadata: object (additional data)

Return only valid JSON array with no markdown formatting.`;

    return this.addCustomContext(basePrompt, config);
  }

}

module.exports = DataGenerators;