import { apiRequest } from './api';
import { aiMapThreatHunt, aiAnalyze, searchTechniques, getTechniqueDetails } from './attackService';
import { parseMitreAnalysis, MitreAnalysisSection, ParsedMitreAnalysis } from '../utils/mitreAnalysisParser';

export interface ThreatHuntMitreEnhancement {
  huntId: string;
  sessionId: string;
  mappedTechniques: MitreTechnique[];
  analysisStructured: ParsedMitreAnalysis;
  detectionStrategies: DetectionStrategy[];
  toolCallingSummary: ToolCallingSummary;
  enhancementTimestamp: string;
  aiReasoningEffort: 'high';
  confidenceScore: number;
}

export interface MitreTechnique {
  techniqueId: string;
  name: string;
  description: string;
  tactics: string[];
  platforms: string[];
  dataSources: string[];
  confidenceScore: number;
  relevanceReason: string;
  detectionMethods: string[];
  huntingQueries: string[];
}

export interface DetectionStrategy {
  techniqueId: string;
  techniqueName: string;
  strategy: string;
  dataSources: string[];
  queries: string[];
  falsePositiveConsiderations: string[];
  validationCriteria: string[];
}

export interface ToolCallingSummary {
  sessionId: string;
  totalToolCalls: number;
  successfulCalls: number;
  failedCalls: number;
  toolsUsed: string[];
  processingTimeMs: number;
  reasoningEffort: 'high';
}

class MitreEnhancementService {
  private processingRequests = new Map<string, Promise<ThreatHuntMitreEnhancement>>();

  /**
   * Enhance threat hunt with MITRE ATTACK mapping using tool calling approach
   * Uses high reasoning effort as required
   */
  async enhanceThreatHuntWithMitre(
    huntId: string,
    huntData: {
      name: string;
      description: string;
      huntType: string;
      scope: string;
      methodology?: string;
      hypothesis?: string;
      targetSystems?: string;
    }
  ): Promise<ThreatHuntMitreEnhancement> {
    // Check if request is already in progress
    if (this.processingRequests.has(huntId)) {
      console.debug(`🔄 MITRE enhancement for hunt ${huntId} already in progress, returning existing promise`);
      return this.processingRequests.get(huntId)!;
    }

    const sessionId = `mitre_enhance_${huntId}_${Date.now()}`;
    const startTime = Date.now();

    // Create and cache the promise
    const enhancementPromise = this.performEnhancement(huntId, huntData, sessionId, startTime);
    this.processingRequests.set(huntId, enhancementPromise);

    try {
      const result = await enhancementPromise;
      return result;
    } finally {
      // Clean up the cache when done
      this.processingRequests.delete(huntId);
    }
  }

  private async performEnhancement(
    huntId: string, 
    huntData: any, 
    sessionId: string, 
    startTime: number
  ): Promise<ThreatHuntMitreEnhancement> {
    try {
      console.log(`🎯 Starting MITRE enhancement for hunt ${huntId} with tool calling approach`);

      // Call the backend endpoint that uses tool calling with high reasoning
      const response = await apiRequest.post(`/threat-hunting/hunts/${huntId}/mitre-enhance`, {
        huntData,
        aiReasoningEffort: 'high',
        toolCallingEnabled: true
      }, {
        timeout: 120000 // 2 minutes for comprehensive tool calling
      });

      if (!response.success) {
        throw new Error(`MITRE enhancement failed: ${response.error || 'Unknown error'}`);
      }

      // Parse the backend response into our interface
      const backendData = response.data;
      
      console.log('🔍 Backend MITRE response:', backendData);
      console.log('📝 AI analysis text preview:', backendData.analysis?.substring(0, 500) + '...');
      
      // Parse AI analysis using existing parser
      const analysisStructured = parseMitreAnalysis(
        { analysis: backendData.analysis },
        backendData.analysis || ''
      );
      
      // Add the original text to analysisStructured for reference
      analysisStructured.originalText = backendData.analysis || '';
      
      console.log('📊 Parsed analysis structure:', {
        sectionsCount: analysisStructured.sections?.length || 0,
        sections: analysisStructured.sections?.map(s => ({ id: s.id, title: s.title, type: s.type })),
        techniquesFound: analysisStructured.techniques?.length || 0
      });

      // Extract techniques from the AI text analysis (since we don't have tool calls)
      let mappedTechniques: MitreTechnique[] = [];
      try {
        mappedTechniques = await this.extractTechniquesFromAnalysis(
          backendData.analysis || '',
          sessionId
        );
      } catch (error) {
        console.error('Failed to extract techniques from analysis, continuing with empty set:', error);
        // Continue with empty techniques array rather than failing completely
      }
      
      console.log(`🎯 Extracted ${mappedTechniques.length} techniques from AI analysis:`, 
        mappedTechniques.map(t => `${t.techniqueId} (${t.name})`)
      );

      // Generate detection strategies based on the analysis
      const detectionStrategies = await this.generateDetectionStrategies(
        mappedTechniques,
        huntData,
        sessionId
      );

      // Create tool calling summary from our processing
      const toolCallingSummary = {
        sessionId: sessionId,
        totalToolCalls: 1, // We made one AI call
        successfulCalls: 1,
        failedCalls: 0,
        toolsUsed: ['ai_mitre_analysis'],
        processingTimeMs: backendData.processingTimeMs || 0,
        reasoningEffort: 'high' as const
      };

      const enhancement: ThreatHuntMitreEnhancement = {
        huntId,
        sessionId: sessionId,
        mappedTechniques,
        analysisStructured,
        detectionStrategies,
        toolCallingSummary,
        enhancementTimestamp: backendData.enhancementTimestamp || new Date().toISOString(),
        aiReasoningEffort: 'high',
        confidenceScore: this.calculateOverallConfidence(mappedTechniques)
      };

      // Save the enhancement results to database
      await this.saveMitreEnhancement(huntId, enhancement);

      console.log(`✅ MITRE enhancement completed for hunt ${huntId} in ${Date.now() - startTime}ms`);
      return enhancement;

    } catch (error) {
      console.error(`❌ MITRE enhancement failed for hunt ${huntId}:`, error);
      throw error;
    }
  }

  /**
   * Extract techniques from AI text analysis
   */
  private async extractTechniquesFromAnalysis(
    analysis: string,
    sessionId: string
  ): Promise<MitreTechnique[]> {
    const techniques: MitreTechnique[] = [];
    const techniqueIds = new Set<string>();

    // Extract technique IDs from the AI analysis text and validate them
    const matches = analysis.match(/T\d{4}(?:\.\d{3})?/g);
    const invalidIds: string[] = [];
    
    if (matches) {
      matches.forEach(id => {
        // Basic validation: filter out obviously invalid technique IDs
        if (this.isValidTechniqueId(id)) {
          techniqueIds.add(id);
        } else {
          invalidIds.push(id);
        }
      });
    }

    // Log invalid IDs as a single grouped message to reduce console spam
    if (invalidIds.length > 0) {
      console.debug(`🔍 Filtered ${invalidIds.length} invalid technique IDs from AI analysis: ${invalidIds.slice(0, 5).join(', ')}${invalidIds.length > 5 ? ` (+${invalidIds.length - 5} more)` : ''}`);
    }

    // Get detailed information for each technique with concurrent processing
    const techniquePromises = Array.from(techniqueIds).map(async (techniqueId) => {
      try {
        const details = await getTechniqueDetails(techniqueId, 'enterprise');
        
        if (details.success && details.data) {
          return {
            techniqueId: details.data.id,
            name: details.data.name,
            description: details.data.description,
            tactics: details.data.tactics || [],
            platforms: details.data.platforms || [],
            dataSources: details.data.data_sources || [],
            confidenceScore: 0.85, // High confidence from AI analysis
            relevanceReason: 'Identified through AI MITRE ATT&CK analysis',
            detectionMethods: this.extractDetectionMethods(details.data.description),
            huntingQueries: this.generateBasicQueries(techniqueId, details.data.name)
          };
        }
        return null;
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Silently skip 404s as they're expected for invalid IDs that passed initial validation
          console.debug(`🔍 Technique ${techniqueId} not found in MITRE database`);
        } else {
          console.warn(`⚠️ Failed to get details for technique ${techniqueId}:`, error.message);
        }
        return null;
      }
    });

    // Wait for all promises to resolve and filter out null results
    const results = await Promise.all(techniquePromises);
    techniques.push(...results.filter(t => t !== null) as MitreTechnique[]);

    return techniques;
  }

  /**
   * Extract techniques from tool calling results
   */
  private async extractTechniquesFromToolCalls(
    toolCalls: any[],
    sessionId: string
  ): Promise<MitreTechnique[]> {
    const techniques: MitreTechnique[] = [];
    const techniqueIds = new Set<string>();

    // Extract technique IDs from tool call results
    for (const toolCall of toolCalls) {
      if (toolCall.function?.arguments) {
        const args = typeof toolCall.function.arguments === 'string' 
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
        
        // Look for technique IDs in various formats
        const content = JSON.stringify(args);
        const matches = content.match(/T\d{4}(?:\.\d{3})?/g);
        if (matches) {
          matches.forEach(id => techniqueIds.add(id));
        }
      }
    }

    // Get detailed information for each technique
    for (const techniqueId of techniqueIds) {
      try {
        const details = await getTechniqueDetails(techniqueId, 'enterprise');
        
        if (details.success && details.data) {
          const technique: MitreTechnique = {
            techniqueId: details.data.techniqueId,
            name: details.data.name,
            description: details.data.description,
            tactics: details.data.tactics,
            platforms: details.data.platforms,
            dataSources: details.data.dataSources,
            confidenceScore: 0.85, // High confidence from tool calling
            relevanceReason: 'Mapped through AI tool calling with high reasoning effort',
            detectionMethods: this.extractDetectionMethods(details.data.description),
            huntingQueries: this.generateBasicQueries(techniqueId, details.data.name)
          };
          techniques.push(technique);
        }
      } catch (error) {
        console.debug(`🔍 Could not retrieve details for technique ${techniqueId}:`, error.message);
      }
    }

    return techniques;
  }

  /**
   * Extract technique IDs and get detailed information using tool calling (legacy method)
   */
  private async extractAndEnhanceTechniques(
    techniqueIds: string[],
    sessionId: string
  ): Promise<MitreTechnique[]> {
    const techniques: MitreTechnique[] = [];

    for (const techniqueId of techniqueIds) {
      try {
        const details = await getTechniqueDetails(techniqueId, 'enterprise');
        
        if (details.success && details.data) {
          const technique: MitreTechnique = {
            techniqueId: details.data.techniqueId,
            name: details.data.name,
            description: details.data.description,
            tactics: details.data.tactics,
            platforms: details.data.platforms,
            dataSources: details.data.dataSources,
            confidenceScore: 0.8, // Default confidence, can be enhanced with ML
            relevanceReason: 'Mapped through AI analysis with high reasoning effort',
            detectionMethods: this.extractDetectionMethods(details.data.description),
            huntingQueries: this.generateBasicQueries(techniqueId, details.data.name)
          };
          techniques.push(technique);
        }
      } catch (error) {
        console.debug(`🔍 Could not retrieve details for technique ${techniqueId}:`, error.message);
      }
    }

    return techniques;
  }

  /**
   * Generate detection strategies for mapped techniques
   */
  private async generateDetectionStrategies(
    techniques: MitreTechnique[],
    huntData: any,
    sessionId: string
  ): Promise<DetectionStrategy[]> {
    const strategies: DetectionStrategy[] = [];

    for (const technique of techniques) {
      const strategy: DetectionStrategy = {
        techniqueId: technique.techniqueId,
        techniqueName: technique.name,
        strategy: this.buildDetectionStrategy(technique, huntData),
        dataSources: technique.dataSources,
        queries: technique.huntingQueries,
        falsePositiveConsiderations: this.identifyFalsePositives(technique),
        validationCriteria: this.buildValidationCriteria(technique)
      };
      strategies.push(strategy);
    }

    return strategies;
  }

  /**
   * Save MITRE enhancement results to backend
   */
  async saveMitreEnhancement(
    huntId: string,
    enhancement: ThreatHuntMitreEnhancement
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`💾 Saving MITRE enhancement data for hunt ${huntId}...`);
      
      // Send the enhancement data to be saved in the database
      const response = await apiRequest.post(`/threat-hunting/hunts/${huntId}/mitre-enhance`, {
        enhancement: enhancement,
        huntData: null, // Not needed for save operation
        aiReasoningEffort: 'high',
        toolCallingEnabled: true
      });

      console.log(`✅ MITRE enhancement data saved successfully for hunt ${huntId}`);
      return response;
    } catch (error) {
      console.error('Failed to save MITRE enhancement:', error);
      throw error;
    }
  }

  /**
   * Clear MITRE enhancement data for a threat hunt
   */
  async clearMitreEnhancement(huntId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ Clearing MITRE enhancement data for hunt ${huntId}...`);
      
      const response = await apiRequest.delete(`/threat-hunting/hunts/${huntId}/mitre-enhance`);

      console.log(`✅ MITRE enhancement data cleared successfully for hunt ${huntId}`);
      return response;
    } catch (error) {
      console.error('Failed to clear MITRE enhancement:', error);
      throw error;
    }
  }

  /**
   * Get saved MITRE enhancement for a threat hunt
   */
  async getMitreEnhancement(huntId: string): Promise<ThreatHuntMitreEnhancement | null> {
    try {
      console.log(`🔍 Loading MITRE enhancement for hunt ${huntId}...`);
      const response = await apiRequest.get(`/threat-hunting/hunts/${huntId}/mitre-enhance`);
      
      if (response.success && response.data) {
        console.log(`✅ Loaded MITRE enhancement for hunt ${huntId} with ${response.data.mappedTechniques?.length || 0} techniques`);
        console.log('📊 Retrieved enhancement structure:', {
          mappedTechniques: response.data.mappedTechniques?.length || 0,
          analysisStructured: {
            sections: response.data.analysisStructured?.sections?.length || 0,
            summary: response.data.analysisStructured?.summary ? 'present' : 'missing',
            originalText: response.data.analysisStructured?.originalText ? 'present' : 'missing'
          },
          detectionStrategies: response.data.detectionStrategies?.length || 0,
          toolCallingSummary: response.data.toolCallingSummary ? 'present' : 'missing'
        });
        return response.data;
      } else {
        console.log(`ℹ️ No MITRE enhancement found for hunt ${huntId}: ${response.message}`);
        return null;
      }
    } catch (error: any) {
      // Only log non-404 errors to reduce console spam (404 is expected for non-enhanced hunts)
      if (error.response?.status !== 404) {
        console.warn(`Error getting MITRE enhancement for hunt ${huntId}:`, error);
      }
      return null;
    }
  }

  // Helper methods
  private extractPlatformFromScope(scope: string, targetSystems?: string): string {
    const text = `${scope} ${targetSystems || ''}`.toLowerCase();
    
    if (text.includes('windows') || text.includes('win')) return 'Windows';
    if (text.includes('linux') || text.includes('unix')) return 'Linux';
    if (text.includes('macos') || text.includes('mac')) return 'macOS';
    if (text.includes('cloud') || text.includes('aws') || text.includes('azure')) return 'Cloud';
    if (text.includes('network') || text.includes('infrastructure')) return 'Network';
    
    return 'Windows'; // Default assumption
  }

  private extractDetectionMethods(description: string): string[] {
    const methods = [];
    const text = description.toLowerCase();
    
    if (text.includes('process') || text.includes('execution')) {
      methods.push('Process monitoring', 'Command line analysis');
    }
    if (text.includes('network') || text.includes('communication')) {
      methods.push('Network traffic analysis', 'DNS monitoring');
    }
    if (text.includes('file') || text.includes('registry')) {
      methods.push('File integrity monitoring', 'Registry monitoring');
    }
    if (text.includes('authentication') || text.includes('credential')) {
      methods.push('Authentication logs', 'Credential usage monitoring');
    }
    
    return methods.length > 0 ? methods : ['Host-based monitoring', 'Network monitoring'];
  }

  private generateBasicQueries(techniqueId: string, techniqueName: string): string[] {
    return [
      `index=security EventCode=* | search "${techniqueName}"`,
      `index=sysmon EventID=1 | search CommandLine="*${techniqueId}*"`,
      `sourcetype=WinEventLog:Security EventCode=4688 | search Process_Name="*suspicious*"`
    ];
  }

  private buildDetectionStrategy(technique: MitreTechnique, huntData: any): string {
    const dataSources = technique.dataSources && technique.dataSources.length > 0 
      ? technique.dataSources.join(', ') 
      : 'relevant log sources';
      
    const platforms = technique.platforms && technique.platforms.length > 0
      ? technique.platforms.join(', ')
      : 'target platforms';
      
    return `Monitor ${dataSources} for indicators of ${technique.name}. ` +
           `Focus on ${huntData.scope} environment with emphasis on ${platforms} platforms. ` +
           `Use behavioral analysis to identify deviations from baseline activity patterns.`;
  }

  private identifyFalsePositives(technique: MitreTechnique): string[] {
    return [
      'Legitimate administrative activities',
      'Scheduled maintenance tasks',
      'Security tool operations',
      'Backup and recovery processes'
    ];
  }

  private buildValidationCriteria(technique: MitreTechnique): string[] {
    return [
      'Verify activity timing against known maintenance windows',
      'Correlate with legitimate user authentication',
      'Check for presence of security tools or admin scripts',
      'Validate against asset management records'
    ];
  }

  private calculateOverallConfidence(techniques: MitreTechnique[]): number {
    if (techniques.length === 0) return 0;
    const avgConfidence = techniques.reduce((sum, t) => sum + t.confidenceScore, 0) / techniques.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  /**
   * Validate technique ID format only
   * Backend handles MITRE framework validation against database
   */
  private isValidTechniqueId(techniqueId: string): boolean {
    // Basic format validation: T#### or T####.###
    if (!/^T\d{4}(\.\d{3})?$/.test(techniqueId)) {
      return false;
    }

    // Extract parts for basic sanity checks
    const parts = techniqueId.split('.');
    const mainNumber = parseInt(parts[0].substring(1));
    const subNumber = parts[1] ? parseInt(parts[1]) : null;
    
    // Basic sanity checks for obviously invalid ranges
    if (mainNumber < 1000 || mainNumber > 2000) {
      return false;
    }

    // Sub-technique sanity checks
    if (subNumber !== null) {
      if (subNumber === 0 || subNumber > 999) {
        return false;
      }
    }

    return true;
  }
}

export default new MitreEnhancementService();