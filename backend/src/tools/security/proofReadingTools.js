/**
 * AI Proofreading Tools for Security Incident Documentation
 * Provides specialized AI-powered tools for improving grammar, style, and professionalism
 * of incident documentation using real AI instead of rule-based processing
 */

const aiGenerationService = require('../../services/aiGenerationService');

const PROOFREADING_TOOLS = [
  {
    type: "function",
    function: {
      name: "analyze_text_quality",
      description: "Analyze text content for grammar, spelling, style, and professional tone issues to identify areas needing improvement",
      category: "Text Analysis",
      parameters: {
        type: "object",
        properties: {
          fieldName: {
            type: "string",
            description: "Name of the field being analyzed (e.g., 'responseplan', 'impactAssessment')"
          },
          textContent: {
            type: "string",
            description: "Text content to analyze for quality issues"
          },
          contentType: {
            type: "string",
            enum: ["incident_report", "response_plan", "technical_analysis", "general"],
            default: "general",
            description: "Type of security content for context-appropriate analysis"
          },
          analysisDepth: {
            type: "string",
            enum: ["basic", "detailed", "comprehensive"],
            default: "detailed",
            description: "Depth of quality analysis to perform"
          }
        },
        required: ["fieldName", "textContent"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "improve_grammar_and_spelling",
      description: "Improve grammar, spelling, and punctuation while preserving technical terminology and original meaning",
      category: "Language Improvement",
      parameters: {
        type: "object",
        properties: {
          fieldName: {
            type: "string", 
            description: "Name of the field being improved"
          },
          textContent: {
            type: "string",
            description: "Text content to improve for grammar and spelling"
          },
          preserveTechnicalTerms: {
            type: "boolean",
            default: true,
            description: "Preserve cybersecurity and technical terminology"
          },
          preserveFormatting: {
            type: "boolean",
            default: true,
            description: "Maintain existing formatting structure like bullet points and lists"
          }
        },
        required: ["fieldName", "textContent"]
      }
    }
  },
  {
    type: "function", 
    function: {
      name: "enhance_professional_tone",
      description: "Enhance professional tone and clarity while maintaining technical accuracy and incident context",
      category: "Style Enhancement",
      parameters: {
        type: "object",
        properties: {
          fieldName: {
            type: "string",
            description: "Name of the field being enhanced"
          },
          textContent: {
            type: "string",
            description: "Text content to enhance for professional tone"
          },
          targetAudience: {
            type: "string",
            enum: ["technical", "executive", "general", "mixed"],
            default: "mixed",
            description: "Target audience for tone adjustment"
          },
          formalityLevel: {
            type: "string",
            enum: ["formal", "professional", "conversational"],
            default: "professional",
            description: "Desired level of formality"
          },
          preserveUrgency: {
            type: "boolean",
            default: true,
            description: "Maintain urgency indicators appropriate for incident severity"
          }
        },
        required: ["fieldName", "textContent"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "validate_technical_terminology",
      description: "Validate and suggest corrections for cybersecurity and IT terminology, ensuring accuracy and consistency",
      category: "Technical Validation",
      parameters: {
        type: "object",
        properties: {
          fieldName: {
            type: "string",
            description: "Name of the field being validated"
          },
          textContent: {
            type: "string", 
            description: "Text content to validate for technical terminology"
          },
          domainFocus: {
            type: "string",
            enum: ["cybersecurity", "network", "system_admin", "forensics", "compliance"],
            default: "cybersecurity",
            description: "Primary technical domain for terminology validation"
          },
          standardsCompliance: {
            type: "boolean",
            default: true,
            description: "Ensure terminology follows industry standards (NIST, ISO, etc.)"
          }
        },
        required: ["fieldName", "textContent"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "assess_content_completeness",
      description: "Assess content completeness and suggest areas that may need additional information or clarification",
      category: "Content Assessment",
      parameters: {
        type: "object",
        properties: {
          fieldName: {
            type: "string",
            description: "Name of the field being assessed"
          },
          textContent: {
            type: "string",
            description: "Text content to assess for completeness"
          },
          fieldType: {
            type: "string",
            enum: ["response_plan", "impact_assessment", "investigation_plan", "containment_strategy", "timeline", "description"],
            description: "Type of incident documentation field for context-specific assessment"
          },
          incidentSeverity: {
            type: "integer",
            minimum: 1,
            maximum: 5,
            description: "Incident severity level for appropriate completeness standards"
          }
        },
        required: ["fieldName", "textContent", "fieldType"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ensure_clarity_and_conciseness",
      description: "Improve text clarity and conciseness while maintaining all essential information and technical details",
      category: "Clarity Enhancement",
      parameters: {
        type: "object",
        properties: {
          fieldName: {
            type: "string",
            description: "Name of the field being clarified"
          },
          textContent: {
            type: "string",
            description: "Text content to improve for clarity and conciseness"
          },
          maxReduction: {
            type: "number",
            default: 0.2,
            minimum: 0.1,
            maximum: 0.5,
            description: "Maximum percentage reduction in text length (0.2 = 20% reduction max)"
          },
          maintainDetail: {
            type: "boolean",
            default: true,
            description: "Maintain technical details and specific information"
          },
          improveReadability: {
            type: "boolean",
            default: true,
            description: "Focus on improving readability and flow"
          }
        },
        required: ["fieldName", "textContent"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "validate_consistency",
      description: "Check for consistency in terminology, formatting, and style across multiple text fields",
      category: "Consistency Validation", 
      parameters: {
        type: "object",
        properties: {
          fieldsData: {
            type: "object",
            description: "Object containing multiple field names and their text content",
            additionalProperties: {
              type: "string"
            }
          },
          checkTerminology: {
            type: "boolean",
            default: true,
            description: "Check for consistent use of technical terms"
          },
          checkFormatting: {
            type: "boolean",
            default: true,
            description: "Check for consistent formatting patterns"
          },
          checkTone: {
            type: "boolean",
            default: true,
            description: "Check for consistent professional tone"
          }
        },
        required: ["fieldsData"]
      }
    }
  }
];

/**
 * AI-Powered Proofreading Tools Executor
 * Executes proofreading and text improvement tools using actual AI calls
 */
class ProofreadingExecutor {
  constructor() {
    this.aiService = aiGenerationService;
  }

  /**
   * Analyze text quality and identify improvement areas using AI
   */
  async analyzeTextQuality(params) {
    try {
      const {
        fieldName,
        textContent,
        contentType = 'general',
        analysisDepth = 'detailed',
        organizationId,
        userId
      } = params;

      console.log(`🔍 AI analyzing text quality for field: ${fieldName} (${analysisDepth})`);
      console.log(`🔍 Parameters: organizationId=${organizationId}, userId=${userId}`);

      if (!organizationId) {
        throw new Error('organizationId is required for AI text analysis');
      }

      if (!userId) {
        throw new Error('userId is required for AI text analysis');
      }

      if (!textContent || textContent.trim().length === 0) {
        throw new Error('Cannot analyze empty text content');
      }

      const prompt = `You are a JSON generator. You must respond with ONLY valid JSON. Do not include any explanations, text, or commentary.

TASK: Analyze text quality and return quality score with issues found.

TEXT: """${textContent}"""

{
  "overallScore": 45,
  "priority": "medium",
  "issues": [
    {
      "type": "spelling",
      "severity": "high", 
      "description": "Multiple spelling errors found",
      "suggestion": "Correct spelling mistakes"
    }
  ],
  "strengths": ["Clear intent"],
  "mainRecommendations": ["Fix spelling", "Improve grammar"],
  "qualityExplanation": "Text has obvious quality issues that need correction",
  "aiProcessingNote": "AI analysis completed",
  "wordCount": ${textContent.split(/\s+/).length},
  "readabilityLevel": "elementary"
}

RESPOND WITH ONLY THE JSON ABOVE WITH ACTUAL ANALYSIS - NO OTHER TEXT`;

      console.log(`🔍 Calling AI service for text quality analysis...`);
      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'text_quality_analysis',
        contextId: fieldName,
        maxTokens: 1500,
        temperature: 0.3
      });
      
      console.log(`🔍 AI service response received:`, {
        hasResponse: !!aiResult,
        responseLength: (aiResult?.response || aiResult?.content)?.length,
        hasError: !!aiResult?.error
      });

      if (!aiResult) {
        throw new Error('AI service returned null/undefined response');
      }
      
      if (aiResult.error) {
        throw new Error(`AI service error: ${aiResult.error}`);
      }

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - (params.startTime || Date.now());
      
      if (!aiResponse) {
        throw new Error('AI service returned empty response');
      }
      
      console.log(`🔍 AI text analysis response length:`, aiResponse?.length || 0);

      // Parse AI response - use same robust approach as incident form generation
      let analysis;
      try {
        // Method 1: Try direct JSON parsing first
        try {
          analysis = JSON.parse(aiResponse);
          console.log('🔧 Direct JSON parsing successful');
        } catch (directError) {
          console.log('🔧 Direct parsing failed, trying extraction methods');
          
          // Method 2: Extract from markdown code blocks
          let jsonString = null;
          const markdownMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
          if (markdownMatch) {
            jsonString = markdownMatch[1];
            console.log('🔧 Found JSON in markdown code block');
          }
          
          // Method 3: Find the largest complete JSON object
          if (!jsonString) {
            const jsonMatches = aiResponse.match(/\{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*\}/g);
            if (jsonMatches && jsonMatches.length > 0) {
              // Sort by length and take the largest one (most likely to be complete)
              jsonString = jsonMatches.sort((a, b) => b.length - a.length)[0];
              console.log('🔧 Found JSON using largest object method');
            }
          }
          
          if (jsonString) {
            console.log(`🔍 Attempting to parse extracted JSON (${jsonString.length} chars)`);
            analysis = JSON.parse(jsonString);
          } else {
            throw new Error('No JSON found in AI analysis response');
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI analysis JSON:', parseError);
        console.error('AI response sample:', aiResponse.substring(0, 500) + '...');
        throw new Error(`AI text analysis failed: ${parseError.message}`);
      }

      return {
        success: true,
        analysis: {
          fieldName,
          contentType,
          analysisDepth,
          ...analysis
        },
        processingTime,
        completedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error in AI text quality analysis:', error);
      throw error; // No fallback - fail is fail
    }
  }

  /**
   * Improve grammar and spelling using AI
   */
  async improveGrammarAndSpelling(params) {
    try {
      const {
        fieldName,
        textContent,
        preserveTechnicalTerms = true,
        preserveFormatting = true,
        organizationId,
        userId
      } = params;

      console.log(`✏️ AI improving grammar and spelling for: ${fieldName}`);

      if (!textContent || textContent.trim().length === 0) {
        throw new Error('Cannot improve empty text content');
      }

      const prompt = `You are a JSON generator. Fix grammar and spelling in the text. Respond with ONLY valid JSON.

TEXT: """${textContent}"""

{
  "originalText": "${textContent.replace(/"/g, '\\"')}",
  "improvedText": "Fix the grammar and spelling of the original text",
  "changes": [
    {
      "type": "spelling",
      "original": "bad word",
      "corrected": "fixed word", 
      "reason": "corrected spelling"
    }
  ],
  "changeCount": 3,
  "improvementScore": 85
}

RESPOND WITH ONLY THE JSON ABOVE WITH ACTUAL CORRECTIONS - NO OTHER TEXT`;

      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'grammar_spelling_improvement',
        contextId: fieldName,
        maxTokens: 2000,
        temperature: 0.2
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - (params.startTime || Date.now());
      
      console.log(`✏️ AI grammar improvement response length:`, aiResponse?.length || 0);

      // Parse AI response
      let improvement;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          improvement = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI grammar improvement response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI grammar improvement JSON:', parseError);
        throw new Error(`AI grammar improvement failed: ${parseError.message}`);
      }

      return {
        success: true,
        originalText: textContent,
        improvedText: improvement.improvedText,
        changes: improvement.changes || [],
        improvementMetrics: {
          totalChanges: improvement.changeCount || 0,
          improvementScore: improvement.improvementScore || 0
        },
        processingTime
      };

    } catch (error) {
      console.error('❌ Error in AI grammar and spelling improvement:', error);
      throw error; // No fallback - fail is fail
    }
  }

  /**
   * Enhance professional tone using AI
   */
  async enhanceProfessionalTone(params) {
    try {
      const {
        fieldName,
        textContent,
        targetAudience = 'mixed',
        formalityLevel = 'professional',
        preserveUrgency = true,
        organizationId,
        userId
      } = params;

      console.log(`🎯 AI enhancing professional tone for: ${fieldName} (${targetAudience}, ${formalityLevel})`);

      if (!textContent || textContent.trim().length === 0) {
        throw new Error('Cannot enhance tone of empty text content');
      }

      const prompt = `As a professional communications expert specializing in cybersecurity incident documentation, enhance the professional tone of the following text while maintaining its technical accuracy and urgency.

TEXT TO ENHANCE:
Field: ${fieldName}
Target Audience: ${targetAudience}
Formality Level: ${formalityLevel}
Preserve Urgency: ${preserveUrgency ? 'Yes' : 'No'}
Original: """${textContent}"""

INSTRUCTIONS:
- Enhance professional tone appropriate for ${targetAudience} audience
- Apply ${formalityLevel} formality level
- ${preserveUrgency ? 'MAINTAIN all urgency indicators and critical language' : 'Adjust urgency language as appropriate'}
- Improve clarity and professional vocabulary
- Keep all technical details and factual content unchanged
- Maintain the original meaning and intent
- Use industry-standard cybersecurity terminology

Return ONLY a JSON response in this exact format:
{
  "originalText": "${textContent.replace(/"/g, '\\"')}",
  "enhancedText": "professionally enhanced version",
  "enhancements": [
    {
      "type": "vocabulary|tone|formality|clarity",
      "original": "original phrase",
      "enhanced": "enhanced phrase",
      "reason": "explanation of the enhancement"
    }
  ],
  "enhancementCount": number_of_enhancements,
  "toneScore": 0-100,
  "audienceAppropriate": true|false
}`;

      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'professional_tone_enhancement',
        contextId: fieldName,
        maxTokens: 2000,
        temperature: 0.3
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - (params.startTime || Date.now());
      
      console.log(`🎯 AI tone enhancement response length:`, aiResponse?.length || 0);

      // Parse AI response
      let enhancement;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          enhancement = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI tone enhancement response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI tone enhancement JSON:', parseError);
        throw new Error(`AI tone enhancement failed: ${parseError.message}`);
      }

      return {
        success: true,
        originalText: textContent,
        enhancedText: enhancement.enhancedText,
        enhancements: enhancement.enhancements || [],
        enhancementMetrics: {
          totalEnhancements: enhancement.enhancementCount || 0,
          toneScore: enhancement.toneScore || 0,
          audienceAppropriate: enhancement.audienceAppropriate || true
        },
        processingTime
      };

    } catch (error) {
      console.error('❌ Error in AI professional tone enhancement:', error);
      throw error; // No fallback - fail is fail
    }
  }

  /**
   * Validate technical terminology using AI
   */
  async validateTechnicalTerminology(params) {
    try {
      const {
        fieldName,
        textContent,
        domainFocus = 'cybersecurity',
        standardsCompliance = true,
        organizationId,
        userId
      } = params;

      console.log(`🔬 AI validating technical terminology for: ${fieldName} (${domainFocus})`);

      if (!textContent || textContent.trim().length === 0) {
        throw new Error('Cannot validate terminology in empty text content');
      }

      const prompt = `As a cybersecurity expert and technical terminology specialist, validate the technical terms used in the following text and suggest corrections for accuracy and industry standards compliance.

TEXT TO VALIDATE:
Field: ${fieldName}
Domain Focus: ${domainFocus}
Standards Compliance: ${standardsCompliance ? 'Required (NIST, ISO, MITRE ATT&CK)' : 'Not required'}
Text: """${textContent}"""

INSTRUCTIONS:
- Identify all technical terms and acronyms
- Validate accuracy and proper usage
- Check for common misspellings or incorrect variants
- ${standardsCompliance ? 'Ensure compliance with NIST, ISO 27001, MITRE ATT&CK, and other industry standards' : 'Focus on general accuracy'}
- Suggest corrections for any incorrect or non-standard terminology
- Consider context-appropriate usage

Return ONLY a JSON response in this exact format:
{
  "validationResults": {
    "fieldName": "${fieldName}",
    "domainFocus": "${domainFocus}",
    "totalTermsFound": number,
    "validTerms": ["list of correct terms"],
    "issues": [
      {
        "term": "problematic term",
        "issue": "what's wrong with it",
        "severity": "low|medium|high",
        "correction": "suggested correction",
        "reason": "why this correction is better",
        "standardReference": "applicable standard (if any)"
      }
    ],
    "suggestions": ["additional terminology improvement suggestions"]
  },
  "qualityScore": 0-100,
  "complianceLevel": 0-100
}`;

      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'technical_terminology_validation',
        contextId: fieldName,
        maxTokens: 2000,
        temperature: 0.2
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - (params.startTime || Date.now());
      
      console.log(`🔬 AI terminology validation response length:`, aiResponse?.length || 0);

      // Parse AI response
      let validation;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          validation = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI terminology validation response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI terminology validation JSON:', parseError);
        throw new Error(`AI terminology validation failed: ${parseError.message}`);
      }

      return {
        success: true,
        validationResults: validation.validationResults,
        qualityScore: validation.qualityScore || 0,
        complianceLevel: validation.complianceLevel || 0,
        processingTime,
        recommendedCorrections: validation.validationResults?.issues?.filter(issue => issue.correction) || []
      };

    } catch (error) {
      console.error('❌ Error in AI technical terminology validation:', error);
      throw error; // No fallback - fail is fail
    }
  }

  /**
   * Assess content completeness using AI
   */
  async assessContentCompleteness(params) {
    try {
      const {
        fieldName,
        textContent,
        fieldType,
        incidentSeverity,
        organizationId,
        userId
      } = params;

      console.log(`📋 AI assessing content completeness for: ${fieldName} (${fieldType})`);

      if (!textContent || textContent.trim().length === 0) {
        throw new Error('Cannot assess completeness of empty text content');
      }

      const prompt = `As a cybersecurity incident response expert, assess the completeness of the following incident documentation field and identify any missing critical information.

CONTENT TO ASSESS:
Field: ${fieldName}
Field Type: ${fieldType}
Incident Severity: ${incidentSeverity}/5
Content: """${textContent}"""

ASSESSMENT CRITERIA for ${fieldType}:
${this.getFieldCompletionCriteria(fieldType, incidentSeverity)}

INSTRUCTIONS:
- Evaluate completeness against industry best practices
- Consider incident severity level ${incidentSeverity} requirements  
- Identify missing critical elements
- Assess information depth and detail adequacy
- Check for logical flow and structure
- Consider stakeholder information needs

Return ONLY a JSON response in this exact format:
{
  "assessment": {
    "fieldName": "${fieldName}",
    "fieldType": "${fieldType}",
    "incidentSeverity": ${incidentSeverity},
    "completenessScore": 0-100,
    "requiredElements": ["elements that should be present"],
    "presentElements": ["elements that are present"],
    "missingElements": ["critical missing elements"],
    "recommendations": ["specific improvement recommendations"],
    "qualityIndicators": {
      "hasSpecificDetails": true|false,
      "hasActionItems": true|false,
      "hasTimelines": true|false,
      "hasStakeholders": true|false
    }
  },
  "priorityActions": ["most important missing elements to add"]
}`;

      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'content_completeness_assessment',
        contextId: fieldName,
        maxTokens: 2000,
        temperature: 0.3
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - (params.startTime || Date.now());
      
      console.log(`📋 AI completeness assessment response length:`, aiResponse?.length || 0);

      // Parse AI response
      let assessment;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          assessment = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI completeness assessment response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI completeness assessment JSON:', parseError);
        throw new Error(`AI completeness assessment failed: ${parseError.message}`);
      }

      return {
        success: true,
        assessment: assessment.assessment,
        priorityActions: assessment.priorityActions || [],
        processingTime
      };

    } catch (error) {
      console.error('❌ Error in AI content completeness assessment:', error);
      throw error; // No fallback - fail is fail
    }
  }

  /**
   * Ensure clarity and conciseness using AI
   */
  async ensureClarityAndConciseness(params) {
    try {
      const {
        fieldName,
        textContent,
        maxReduction = 0.2,
        maintainDetail = true,
        improveReadability = true,
        organizationId,
        userId
      } = params;

      console.log(`🎯 AI improving clarity and conciseness for: ${fieldName}`);

      if (!textContent || textContent.trim().length === 0) {
        throw new Error('Cannot improve clarity of empty text content');
      }

      const originalLength = textContent.length;
      const maxAllowedLength = Math.floor(originalLength * (1 - maxReduction));

      const prompt = `As a professional technical writer specializing in cybersecurity documentation, improve the clarity and conciseness of the following text while maintaining all essential information.

TEXT TO IMPROVE:
Field: ${fieldName}
Original Length: ${originalLength} characters
Maximum Reduction: ${(maxReduction * 100).toFixed(0)}% (target length: ~${maxAllowedLength} characters)
Maintain Detail: ${maintainDetail ? 'Yes - preserve all technical details' : 'No - focus on key points'}
Improve Readability: ${improveReadability ? 'Yes' : 'No'}
Content: """${textContent}"""

INSTRUCTIONS:
- Improve clarity and readability
- Reduce wordiness and redundancy
- ${maintainDetail ? 'PRESERVE all technical details and specific information' : 'Focus on the most important information'}
- Maintain professional tone and meaning
- ${improveReadability ? 'Improve sentence flow and structure' : 'Focus on conciseness only'}
- Do not exceed ${(maxReduction * 100).toFixed(0)}% reduction in length
- Keep all critical incident response information

Return ONLY a JSON response in this exact format:
{
  "originalText": "${textContent.replace(/"/g, '\\"')}",
  "improvedText": "clearer and more concise version",
  "improvements": [
    {
      "type": "conciseness|clarity|readability|redundancy",
      "original": "original phrase",
      "improved": "improved phrase",
      "reason": "explanation of improvement"
    }
  ],
  "metrics": {
    "originalLength": ${originalLength},
    "finalLength": number,
    "reductionPercentage": number,
    "clarityScore": 0-100,
    "readabilityScore": 0-100
  }
}`;

      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'clarity_conciseness_improvement',
        contextId: fieldName,
        maxTokens: 2000,
        temperature: 0.3
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - (params.startTime || Date.now());
      
      console.log(`🎯 AI clarity improvement response length:`, aiResponse?.length || 0);

      // Parse AI response
      let improvement;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          improvement = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI clarity improvement response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI clarity improvement JSON:', parseError);
        throw new Error(`AI clarity improvement failed: ${parseError.message}`);
      }

      return {
        success: true,
        originalText: textContent,
        improvedText: improvement.improvedText,
        improvements: improvement.improvements || [],
        metrics: improvement.metrics || {
          originalLength: originalLength,
          finalLength: improvement.improvedText?.length || originalLength,
          reductionPercentage: 0,
          clarityScore: 0,
          readabilityScore: 0
        },
        processingTime
      };

    } catch (error) {
      console.error('❌ Error in AI clarity and conciseness improvement:', error);
      throw error; // No fallback - fail is fail
    }
  }

  /**
   * Validate consistency across multiple fields using AI
   */
  async validateConsistency(params) {
    try {
      const {
        fieldsData,
        checkTerminology = true,
        checkFormatting = true,
        checkTone = true,
        organizationId,
        userId
      } = params;

      console.log(`🔍 AI validating consistency across ${Object.keys(fieldsData).length} fields`);

      if (!fieldsData || Object.keys(fieldsData).length === 0) {
        throw new Error('Cannot validate consistency with no field data provided');
      }

      const fieldsContent = Object.entries(fieldsData)
        .map(([fieldName, content]) => `${fieldName}: """${content}"""`).join('\n\n');

      const prompt = `As a cybersecurity documentation expert, analyze the following incident documentation fields for consistency in terminology, formatting, and professional tone.

FIELDS TO ANALYZE:
${fieldsContent}

CONSISTENCY CHECKS:
- Terminology: ${checkTerminology ? 'Check for consistent use of technical terms and acronyms' : 'Skip'}
- Formatting: ${checkFormatting ? 'Check for consistent formatting patterns and structure' : 'Skip'}
- Tone: ${checkTone ? 'Check for consistent professional tone and style' : 'Skip'}

INSTRUCTIONS:
- Identify inconsistencies between fields
- Check for different spellings/variations of same terms
- Analyze tone and formality consistency
- Review formatting patterns and structure
- Suggest standardization improvements
- Consider professional incident documentation standards

Return ONLY a JSON response in this exact format:
{
  "consistencyResults": {
    "fieldCount": ${Object.keys(fieldsData).length},
    "issues": [
      {
        "type": "terminology|formatting|tone",
        "severity": "low|medium|high",
        "description": "specific inconsistency found",
        "affectedFields": ["field1", "field2"],
        "examples": ["example of inconsistency"],
        "recommendation": "how to fix it"
      }
    ],
    "consistencyScore": 0-100,
    "analyses": {
      "terminology": {"consistent": true|false, "issues": ["issues found"]},
      "formatting": {"consistent": true|false, "issues": ["issues found"]},
      "tone": {"consistent": true|false, "issues": ["issues found"]}
    }
  },
  "priorityFixes": ["most important consistency issues to address"],
  "recommendations": ["overall improvement recommendations"]
}`;

      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'consistency_validation',
        contextId: 'multi_field_analysis',
        maxTokens: 2000,
        temperature: 0.3
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - (params.startTime || Date.now());
      
      console.log(`🔍 AI consistency validation response length:`, aiResponse?.length || 0);

      // Parse AI response
      let validation;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          validation = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI consistency validation response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI consistency validation JSON:', parseError);
        throw new Error(`AI consistency validation failed: ${parseError.message}`);
      }

      return {
        success: true,
        consistencyResults: validation.consistencyResults,
        priorityFixes: validation.priorityFixes || [],
        recommendations: validation.recommendations || [],
        processingTime
      };

    } catch (error) {
      console.error('❌ Error in AI consistency validation:', error);
      throw error; // No fallback - fail is fail
    }
  }

  /**
   * Get field completion criteria based on field type and incident severity
   */
  getFieldCompletionCriteria(fieldType, severity) {
    const criteriaMap = {
      'response_plan': `
- Executive summary of incident and response approach
- Immediate containment actions taken or planned
- Investigation steps and methodology
- Communication plan and stakeholder notifications
- Resource allocation and team assignments
- Timeline with key milestones
${severity >= 4 ? '- Executive escalation procedures (HIGH/CRITICAL severity)' : ''}
${severity >= 3 ? '- Legal/compliance considerations' : ''}`,
      
      'impact_assessment': `
- Technical impact on systems and services
- Business impact on operations and revenue
- Data exposure or compromise assessment
- Service availability impact
- Customer/stakeholder impact
${severity >= 4 ? '- Regulatory reporting requirements (HIGH/CRITICAL severity)' : ''}
${severity >= 3 ? '- Financial impact estimation' : ''}`,

      'investigation_plan': `
- Investigation objectives and scope
- Evidence collection methodology
- Forensic analysis procedures
- Timeline reconstruction approach
- Root cause analysis methodology
${severity >= 4 ? '- Advanced forensic techniques (HIGH/CRITICAL severity)' : ''}
${severity >= 3 ? '- Third-party expert involvement if needed' : ''}`,

      'containment_strategy': `
- Immediate containment measures
- Short-term isolation procedures
- Long-term remediation steps
- System recovery procedures
- Monitoring and validation steps
${severity >= 4 ? '- Emergency business continuity measures (HIGH/CRITICAL severity)' : ''}
${severity >= 3 ? '- Stakeholder communication during containment' : ''}`,

      'timeline': `
- Key event timestamps
- Response action timeline
- Investigation milestones
- Recovery phase timeline
- Lessons learned schedule
${severity >= 4 ? '- Regulatory reporting deadlines (HIGH/CRITICAL severity)' : ''}`,

      'description': `
- Clear incident summary
- Initial detection details
- Affected systems/assets
- Preliminary impact assessment
- Current status and actions taken
${severity >= 4 ? '- Executive summary for leadership (HIGH/CRITICAL severity)' : ''}`
    };

    return criteriaMap[fieldType] || 'Standard completeness criteria for incident documentation.';
  }
}

module.exports = {
  PROOFREADING_TOOLS,
  ProofreadingExecutor
};