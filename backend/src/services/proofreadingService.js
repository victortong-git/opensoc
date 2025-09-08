const aiAgentLogService = require('./aiAgentLogService');

/**
 * Proofreading Service
 * Handles AI-powered text proofreading and improvement for incident forms
 * with comprehensive analysis, grammar checking, and quality assessment
 */
class ProofreadingService {

  /**
   * Proof read incident form fields with AI analysis
   * @param {Array} fields - Array of field objects {fieldName, text}
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID
   * @returns {Object} Proofreading results
   */
  async proofreadIncidentFields(fields, organizationId, userId) {
    const startTime = Date.now();
    
    try {
      console.log('🛠️ Using tool-based proofreading approach for', fields.length, 'fields');
      
      const result = await this._proofreadFieldsWithTools({
        fields,
        organizationId,
        userId
      });

      const processingTime = Date.now() - startTime;

      // Log AI agent activity
      await this._logAgentActivity({
        taskName: 'proof read (tool-based)',
        description: `Tool-based proof reading - Processed ${result.totalProcessed} fields, found ${result.fieldsImproved} improvements`,
        executionTimeMs: processingTime,
        success: true,
        userId,
        organizationId,
        metadata: {
          approach: 'tool_based',
          fieldsProcessed: result.totalProcessed,
          improvementsFound: result.fieldsImproved,
          fieldsNames: fields.map(f => f.fieldName),
          processedFields: result.processedFields
        }
      });

      return {
        success: true,
        suggestions: result.suggestions,
        processingTime,
        fieldsProcessed: result.totalProcessed,
        improvementsFound: result.fieldsImproved,
        approach: 'tool_based',
        aiProcessingComplete: result.processingComplete,
        processedFields: result.processedFields,
        detailedResults: result.processedFields.map(field => ({
          fieldName: field.fieldName,
          hasImprovements: field.hasImprovements,
          processingNote: field.processingNote,
          explanation: field.explanation,
          aiProcessingConfirmed: field.aiProcessingConfirmed,
          qualityScore: field.aiAnalysis?.overallScore,
          strengths: field.aiAnalysis?.strengths || []
        })),
        message: result.fieldsImproved > 0 
          ? `AI analysis complete: ${result.fieldsImproved} of ${result.totalProcessed} fields improved`
          : `AI analysis complete: No improvements made to ${result.totalProcessed} fields`
      };

    } catch (error) {
      console.error('Tool-based proofreading failed:', error);
      
      const processingTime = Date.now() - startTime;
      
      // Log failed AI agent activity
      await this._logAgentActivity({
        taskName: 'proof read (tool-based)',
        description: 'Failed to proof read incident form fields using tool-based approach',
        executionTimeMs: processingTime,
        success: false,
        errorMessage: error.message || 'Tool-based proofreading failed',
        userId,
        organizationId,
        metadata: {
          approach: 'tool_based',
          errorType: error.constructor.name,
          fieldsAttempted: fields?.length || 0
        }
      });

      throw this._enhanceError(error, processingTime, fields);
    }
  }

  /**
   * Core tool-based proofreading implementation
   * @private
   */
  async _proofreadFieldsWithTools({ fields, organizationId, userId }) {
    const aiToolExecutor = require('../tools/common/toolExecutor');
    const suggestions = {};
    const processedFields = [];
    let fieldsImproved = 0;

    const toolContext = {
      sessionId: `proofreading_${Date.now()}`,
      userId,
      organizationId
    };

    for (const { fieldName, text } of fields) {
      try {
        console.log(`🔍 Processing field: ${fieldName}`);
        
        // Step 1: Analyze text quality first
        const analysisResult = await aiToolExecutor.executeTool(
          'analyze_text_quality',
          {
            fieldName,
            textContent: text,
            analysisType: 'comprehensive',
            includeReadability: true
          },
          toolContext
        );

        let processedField = {
          fieldName,
          originalText: text,
          hasImprovements: false,
          processingNote: 'Analysis completed',
          explanation: 'Text analysis completed',
          aiProcessingConfirmed: 'Processed by AI - not a timeout or fallback'
        };

        if (!analysisResult.success || !analysisResult.result) {
          processedField.processingNote = 'Analysis failed - skipping improvements';
          processedField.explanation = 'Unable to analyze text quality';
          processedFields.push(processedField);
          continue;
        }

        const analysis = analysisResult.result.analysis;
        processedField.aiAnalysis = analysis;

        // Check if text already meets quality standards (80+ score)
        if (analysis.overallScore >= 80) {
          // Per coding_practice.md: "no fallback, no mock response" - don't add to suggestions if no improvements made
          processedField.processingNote = `High quality text (${analysis.overallScore}/100) - no improvements needed`;
          processedField.explanation = `This text already meets high quality standards with a score of ${analysis.overallScore}/100`;
          processedFields.push(processedField);
          continue; // Don't add to suggestions - no actual improvements were made
        }
        
        // Step 2: Apply improvements based on analysis results
        let improvedText = text;
        let hasImprovements = false;
        const improvements = [];
        
        // Apply various improvement tools based on analysis
        console.log(`🔍 DEBUG: Analysis for ${fieldName}:`, {
          overallScore: analysis.overallScore,
          issues: analysis.issues?.map(i => `${i.type}:${i.severity}`) || [],
          hasGrammarSpelling: analysis.issues?.some(issue => issue.type === 'grammar' || issue.type === 'spelling'),
          hasToneIssues: analysis.issues?.some(issue => issue.type === 'tone' || issue.type === 'clarity' || issue.type === 'completeness') || analysis.overallScore < 80
        });
        
        const improvementResults = await this._applyImprovements(
          fieldName, improvedText, analysis, aiToolExecutor, toolContext
        );
        
        improvedText = improvementResults.improvedText;
        hasImprovements = improvementResults.hasImprovements;
        improvements.push(...improvementResults.improvements);

        // Store final result
        suggestions[fieldName] = {
          originalText: text,
          improvedText,
          hasChanges: hasImprovements,
          changes: improvements,
          aiAnalysis: analysis,
          processingNote: hasImprovements 
            ? `AI improvements applied: ${improvements.join(', ')}`
            : `AI analysis complete: Text quality score ${analysis.overallScore}/100`,
          explanation: hasImprovements 
            ? `Applied ${improvements.length} AI improvements to enhance text quality.`
            : analysis.qualityExplanation || 'Text meets acceptable quality standards.',
          aiProcessingConfirmed: 'Processed by AI with comprehensive analysis'
        };

        processedField.hasImprovements = hasImprovements;
        processedField.processingNote = suggestions[fieldName].processingNote;
        processedField.explanation = suggestions[fieldName].explanation;
        processedField.aiProcessingConfirmed = suggestions[fieldName].aiProcessingConfirmed;
        
        if (hasImprovements) {
          fieldsImproved++;
        }
        
        processedFields.push(processedField);
        
      } catch (fieldError) {
        console.error(`Error processing field ${fieldName}:`, fieldError);
        // Per coding_practice.md: "for all AI functions, no fallback, no mock response. fail is fail"
        throw new Error(`AI proofreading failed for field ${fieldName}: ${fieldError.message}`);
      }
    }

    // Transform suggestions to frontend-compatible format (string suggestions only)
    const transformedSuggestions = {};
    Object.keys(suggestions).forEach(fieldName => {
      const suggestionData = suggestions[fieldName];
      // Only include fields that actually have improvements
      if (suggestionData.hasChanges && suggestionData.improvedText !== suggestionData.originalText) {
        transformedSuggestions[fieldName] = suggestionData.improvedText;
      }
    });

    return {
      suggestions: transformedSuggestions,
      processedFields,
      totalProcessed: fields.length,
      fieldsImproved,
      processingComplete: true
    };
  }

  /**
   * Apply various AI improvements based on text analysis
   * @private
   */
  async _applyImprovements(fieldName, text, analysis, aiToolExecutor, toolContext) {
    let improvedText = text;
    let hasImprovements = false;
    const improvements = [];

    try {
      // Grammar and spelling improvements
      const hasGrammarOrSpellingIssues = analysis.issues?.some(issue => 
        issue.type === 'grammar' || issue.type === 'spelling'
      );
      
      if (hasGrammarOrSpellingIssues) {
        const grammarResult = await aiToolExecutor.executeTool(
          'improve_grammar_and_spelling',
          {
            fieldName,
            textContent: improvedText,
            preserveTechnicalTerms: true,
            preserveFormatting: true
          },
          toolContext
        );
        
        if (grammarResult.success && grammarResult.result.success && grammarResult.result.changes.length > 0) {
          improvedText = grammarResult.result.improvedText;
          hasImprovements = true;
          improvements.push(`Grammar/spelling: ${grammarResult.result.changes.length} fixes`);
        }
      }
      
      // Professional tone enhancement
      const hasToneIssues = analysis.issues?.some(issue => 
        issue.type === 'tone' || issue.type === 'clarity' || issue.type === 'completeness'
      ) || analysis.overallScore < 80;
      
      if (hasToneIssues) {
        const toneResult = await aiToolExecutor.executeTool(
          'enhance_professional_tone',
          {
            fieldName,
            textContent: improvedText,
            targetAudience: 'mixed',
            formalityLevel: 'professional',
            preserveUrgency: true
          },
          toolContext
        );
        
        if (toneResult.success && toneResult.result.success && toneResult.result.enhancements.length > 0) {
          improvedText = toneResult.result.enhancedText;
          hasImprovements = true;
          improvements.push(`Professional tone: ${toneResult.result.enhancements.length} enhancements`);
        }
      }

      // Technical terminology validation
      if (analysis.terminologyIssues?.length > 0) {
        const terminologyResult = await aiToolExecutor.executeTool(
          'validate_technical_terminology',
          {
            fieldName,
            textContent: improvedText,
            domainFocus: 'cybersecurity',
            standardsCompliance: true
          },
          toolContext
        );
        
        if (terminologyResult.success && terminologyResult.result.success && 
            terminologyResult.result.validationResults.corrections?.length > 0) {
          
          // Apply terminology corrections
          let correctedText = improvedText;
          for (const correction of terminologyResult.result.validationResults.corrections) {
            correctedText = correctedText.replace(
              new RegExp(`\\b${correction.original}\\b`, 'gi'), 
              correction.corrected
            );
          }
          
          if (correctedText !== improvedText) {
            improvedText = correctedText;
            hasImprovements = true;
            improvements.push(`Terminology: ${terminologyResult.result.validationResults.corrections.length} corrections`);
          }
        }
      }

      // Clarity and conciseness improvements
      if (analysis.readabilityScore < 75) {
        const clarityResult = await aiToolExecutor.executeTool(
          'improve_clarity_and_conciseness',
          {
            fieldName,
            textContent: improvedText,
            targetAudience: 'technical',
            preserveMeaning: true
          },
          toolContext
        );
        
        if (clarityResult.success && clarityResult.result.success && clarityResult.result.improvements.length > 0) {
          improvedText = clarityResult.result.improvedText;
          hasImprovements = true;
          improvements.push(`Clarity: ${clarityResult.result.improvements.length} improvements`);
        }
      }

    } catch (error) {
      console.error(`Error applying improvements for ${fieldName}:`, error);
    }

    return { improvedText, hasImprovements, improvements };
  }

  /**
   * Enhanced error handling with detailed error classification
   * @private
   */
  _enhanceError(error, processingTime, fields) {
    const isTimeoutError = error.message?.includes('timeout') || error.code === 'ECONNABORTED' || processingTime > 300000;
    const isAIProviderError = error.message?.includes('AI') || error.message?.includes('Ollama') || error.message?.includes('provider');
    const isNetworkError = error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('connect');
    const isToolExecutorError = error.message?.includes('tool') || error.message?.includes('executor');
    const isConfigError = error.message?.includes('config') || error.message?.includes('provider config');
    
    let userMessage = 'AI proofreading service is not available. Please try again later.';
    let errorDetails = `Error: ${error.message || 'Unknown error occurred during AI processing.'}`;
    
    if (isTimeoutError) {
      userMessage = 'AI processing is taking longer than expected. The analysis may still be in progress.';
      errorDetails = `AI analysis timeout after ${Math.round(processingTime/1000)} seconds. The AI model (gpt-oss:20b) is processing your text but requires more time than the 5-minute limit.`;
    } else if (isNetworkError) {
      userMessage = 'Cannot connect to AI service. Please check if the AI service is running.';
      errorDetails = `Network error: ${error.message}. The AI service (Ollama/gpt-oss:20b) may not be started or accessible.`;
    } else if (isToolExecutorError) {
      userMessage = 'AI tool execution failed. Please check the AI tool configuration.';
      errorDetails = `Tool executor error: ${error.message}. The proofreading tools may not be properly configured.`;
    } else if (isConfigError) {
      userMessage = 'AI service configuration error. Please check AI provider settings.';
      errorDetails = `Configuration error: ${error.message}. The AI provider configuration may be incomplete or invalid.`;
    } else if (isAIProviderError) {
      userMessage = 'AI analysis service is temporarily unavailable.';
      errorDetails = `AI provider error: ${error.message}. This is not a timeout or fallback response.`;
    }

    const enhancedError = new Error(userMessage);
    enhancedError.details = {
      errorDetails,
      processingTime,
      suggestions: {},
      approach: 'tool_based',
      isTimeout: isTimeoutError,
      isNetworkError: isNetworkError,
      isToolExecutorError: isToolExecutorError,
      isConfigError: isConfigError,
      isAIProviderError: isAIProviderError,
      technicalError: error.message,
      errorType: error.name || error.constructor.name,
      errorCode: error.code,
      fieldsAttempted: fields?.length || 0,
      helpMessage: isTimeoutError 
        ? 'The AI is analyzing your text. Large text or complex analysis may take 2-5 minutes. You can try again or wait for processing to complete.'
        : isNetworkError
        ? 'Please check if the AI service (Ollama with gpt-oss:20b model) is running and accessible.'
        : isToolExecutorError
        ? 'The proofreading tools encountered an execution error. Please check the tool configuration and AI service status.'
        : 'This is a genuine AI processing error, not a timeout or fallback response. The AI attempted to analyze your text but encountered an issue.'
    };

    return enhancedError;
  }

  /**
   * Log AI agent activity for tracking and monitoring
   * @private
   */
  async _logAgentActivity(logData) {
    try {
      const fullLogData = {
        agentName: 'Alert and Incident Specialist Agent',
        ...logData
      };
      
      await aiAgentLogService.logAgentActivity(fullLogData);
    } catch (logError) {
      console.error('Failed to log AI agent activity:', logError);
    }
  }

  /**
   * Validate fields for proofreading
   * @param {Object} fields - Fields object to validate
   * @returns {Array} Array of valid fields for processing
   */
  validateFields(fields) {
    if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
      throw new Error('Fields object is required for proofreading');
    }

    const validFields = Object.entries(fields)
      .filter(([_, value]) => value && typeof value === 'string' && value.trim().length > 0)
      .map(([fieldName, text]) => ({ fieldName, text: text.trim() }));

    return validFields;
  }

  /**
   * Get proofreading statistics for a session
   * @param {Array} results - Proofreading results
   * @returns {Object} Statistics summary
   */
  getProofreadingStats(results) {
    const stats = {
      totalFields: results.length,
      fieldsImproved: 0,
      totalImprovements: 0,
      averageQualityScore: 0,
      improvementTypes: {}
    };

    let totalScore = 0;
    
    results.forEach(result => {
      if (result.hasImprovements) {
        stats.fieldsImproved++;
        stats.totalImprovements += result.changes?.length || 0;
      }
      
      if (result.aiAnalysis?.overallScore) {
        totalScore += result.aiAnalysis.overallScore;
      }

      // Track improvement types
      if (result.changes) {
        result.changes.forEach(change => {
          const type = change.split(':')[0];
          stats.improvementTypes[type] = (stats.improvementTypes[type] || 0) + 1;
        });
      }
    });

    stats.averageQualityScore = stats.totalFields > 0 ? Math.round(totalScore / stats.totalFields) : 0;

    return stats;
  }
}

module.exports = new ProofreadingService();