/**
 * AI Incident Draft Tools for Security Incident Documentation
 * Provides specialized AI-powered tools for generating incident content
 * using real AI instead of rule-based processing
 */

const aiGenerationService = require('../../services/aiGenerationService');
const ContentFormatter = require('./contentFormatter');

const INCIDENT_DRAFT_TOOLS = [
  {
    type: "function",
    function: {
      name: "analyze_incident_context",
      description: "Analyze incident data and context to provide comprehensive insights for content generation",
      category: "Context Analysis",
      parameters: {
        type: "object",
        properties: {
          incidentId: {
            type: "string",
            description: "Incident ID to analyze"
          },
          analysisDepth: {
            type: "string",
            enum: ["basic", "detailed", "comprehensive"],
            default: "detailed",
            description: "Depth of contextual analysis to perform"
          },
          includeRelatedAlerts: {
            type: "boolean",
            default: true,
            description: "Include related alert data in analysis"
          },
          includeTimeline: {
            type: "boolean",
            default: true,
            description: "Include timeline events in analysis"
          }
        },
        required: ["incidentId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "draft_response_plan",
      description: "Generate comprehensive incident response plan with structured approach and stakeholder considerations",
      category: "Content Generation",
      parameters: {
        type: "object",
        properties: {
          incidentContext: {
            type: "object",
            description: "Incident context for response plan generation",
            required: ["incidentData"]
          },
          responseApproach: {
            type: "string",
            enum: ["structured", "agile", "emergency", "standard"],
            default: "structured",
            description: "Response methodology approach"
          },
          includeStakeholders: {
            type: "boolean",
            default: true,
            description: "Include stakeholder communication plan"
          },
          includeTimelines: {
            type: "boolean",
            default: true,
            description: "Include detailed response timelines"
          }
        },
        required: ["incidentContext"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "draft_impact_assessment",
      description: "Generate detailed impact assessment covering technical, business, and operational impacts",
      category: "Content Generation",
      parameters: {
        type: "object",
        properties: {
          incidentContext: {
            type: "object",
            description: "Incident context for impact assessment",
            required: ["incidentData"]
          },
          assessmentScope: {
            type: "string",
            enum: ["technical", "business", "comprehensive", "regulatory"],
            default: "comprehensive",
            description: "Scope of impact assessment"
          },
          includeFinancialImpact: {
            type: "boolean",
            default: true,
            description: "Include financial impact estimation"
          },
          includeRegulatoryImpact: {
            type: "boolean",
            default: true,
            description: "Include regulatory and compliance impact"
          }
        },
        required: ["incidentContext"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "draft_investigation_plan",
      description: "Generate comprehensive investigation plan with forensic procedures and evidence collection strategy",
      category: "Content Generation",
      parameters: {
        type: "object",
        properties: {
          incidentContext: {
            type: "object",
            description: "Incident context for investigation planning",
            required: ["incidentData"]
          },
          investigationDepth: {
            type: "string",
            enum: ["basic", "standard", "forensic", "advanced"],
            default: "standard",
            description: "Depth of investigation required"
          },
          includeForensics: {
            type: "boolean",
            default: true,
            description: "Include digital forensics procedures"
          },
          includeTimeline: {
            type: "boolean",
            default: true,
            description: "Include investigation timeline and milestones"
          }
        },
        required: ["incidentContext"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "draft_containment_strategy",
      description: "Generate detailed containment strategy with immediate, short-term, and long-term measures",
      category: "Content Generation",
      parameters: {
        type: "object",
        properties: {
          incidentContext: {
            type: "object",
            description: "Incident context for containment strategy",
            required: ["incidentData"]
          },
          containmentApproach: {
            type: "string",
            enum: ["aggressive", "cautious", "surgical", "comprehensive"],
            default: "comprehensive",
            description: "Containment strategy approach"
          },
          includeRecovery: {
            type: "boolean",
            default: true,
            description: "Include recovery procedures and validation"
          },
          balanceOperations: {
            type: "boolean",
            default: true,
            description: "Balance containment with operational continuity"
          }
        },
        required: ["incidentContext"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "draft_estimated_timeline",
      description: "Generate realistic timeline estimates for incident resolution phases with milestone tracking",
      category: "Content Generation", 
      parameters: {
        type: "object",
        properties: {
          incidentContext: {
            type: "object",
            description: "Incident context for timeline estimation",
            required: ["incidentData"]
          },
          timelineScope: {
            type: "string",
            enum: ["immediate", "short_term", "full_lifecycle"],
            default: "full_lifecycle",
            description: "Scope of timeline to generate"
          },
          includePhases: {
            type: "array",
            items: {
              type: "string",
              enum: ["containment", "investigation", "eradication", "recovery", "lessons_learned"]
            },
            default: ["containment", "investigation", "eradication", "recovery"],
            description: "Incident response phases to include in timeline"
          },
          includeMilestones: {
            type: "boolean",
            default: true,
            description: "Include key milestone tracking points"
          },
          includeResourceRequirements: {
            type: "boolean",
            default: true,
            description: "Include resource allocation timeline"
          }
        },
        required: ["incidentContext"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_incident_form_from_alert",
      description: "Generate comprehensive incident form data from a security alert, including title, description, impact assessment, timeline, and action items",
      category: "Form Generation",
      parameters: {
        type: "object",
        properties: {
          alertContext: {
            type: "object",
            description: "Complete alert context including alert data, AI analysis, and asset information",
            required: ["alertData"]
          },
          generateComprehensiveData: {
            type: "boolean",
            default: true,
            description: "Generate comprehensive incident data with all sections"
          },
          includeTimeline: {
            type: "boolean", 
            default: true,
            description: "Include incident timeline and key events"
          },
          includeMitreMapping: {
            type: "boolean",
            default: true,
            description: "Include MITRE ATT&CK technique mapping"
          },
          includeActionItems: {
            type: "boolean",
            default: true,
            description: "Include recommended action items and response steps"
          }
        },
        required: ["alertContext"]
      }
    }
  }
];

/**
 * AI-Powered Incident Draft Tools Executor
 * Executes incident content generation tools using actual AI calls
 */
class IncidentDraftExecutor {
  constructor() {
    this.aiService = aiGenerationService;
  }

  /**
   * Analyze incident context using AI to provide comprehensive insights
   */
  async analyzeIncidentContext(params) {
    try {
      const {
        incidentId,
        analysisDepth = 'detailed',
        includeRelatedAlerts = true,
        includeTimeline = true,
        organizationId,
        userId
      } = params;

      console.log(`🔍 AI analyzing incident context for: ${incidentId} (${analysisDepth})`);

      // Get incident data from database
      const incident = await this.getIncidentById(incidentId);
      if (!incident) {
        throw new Error(`Incident ${incidentId} not found`);
      }

      // Get related data if requested
      const relatedAlerts = includeRelatedAlerts ? await this.getRelatedAlerts(incidentId) : [];
      const timelineEvents = includeTimeline ? await this.getTimelineEvents(incidentId) : [];

      const prompt = `As a cybersecurity incident response expert, analyze the following incident data and provide comprehensive insights for incident documentation and response planning.

INCIDENT DATA:
ID: ${incident.id}
Title: ${incident.title}
Description: ${incident.description}
Severity: ${incident.severity}/5
Status: ${incident.status}
Category: ${incident.category}
Assigned To: ${incident.assignedToName || 'Unassigned'}
Created: ${incident.createdAt}
Age: ${Math.round((Date.now() - new Date(incident.createdAt).getTime()) / (1000 * 60 * 60))} hours

${relatedAlerts.length > 0 ? `
RELATED ALERTS (${relatedAlerts.length}):
${relatedAlerts.map(alert => `- ${alert.title} (Severity: ${alert.severity}/5, Source: ${alert.sourceSystem})`).join('\n')}
` : ''}

${timelineEvents.length > 0 ? `
TIMELINE EVENTS (${timelineEvents.length}):
${timelineEvents.map(event => `- ${event.timestamp}: ${event.description}`).join('\n')}
` : ''}

ANALYSIS DEPTH: ${analysisDepth}

INSTRUCTIONS:
- Perform ${analysisDepth} analysis of the incident context
- Assess threat actor sophistication and attack methods
- Evaluate potential business and technical impacts  
- Identify key stakeholders and communication needs
- Assess investigation and containment complexity
- Provide strategic insights for response planning
- Consider regulatory and compliance implications

Return ONLY a JSON response in this exact format:
{
  "context": {
    "incidentData": {
      "id": "${incident.id}",
      "title": "${incident.title}",
      "severity": ${incident.severity},
      "category": "${incident.category}",
      "ageHours": ${Math.round((Date.now() - new Date(incident.createdAt).getTime()) / (1000 * 60 * 60))},
      "status": "${incident.status}"
    },
    "relatedAlerts": ${relatedAlerts.length},
    "timelineEvents": ${timelineEvents.length}
  },
  "analysisInsights": {
    "threatAssessment": {
      "sophisticationLevel": "low|medium|high|advanced",
      "attackMethods": ["list of identified attack methods"],
      "threatActorProfile": "assessment of threat actor characteristics"
    },
    "impactAnalysis": {
      "technicalImpact": "assessment of technical systems impact",
      "businessImpact": "assessment of business operations impact", 
      "dataImpact": "assessment of data exposure/compromise"
    },
    "responseComplexity": {
      "investigationComplexity": "low|medium|high|critical",
      "containmentComplexity": "low|medium|high|critical",
      "recoveryComplexity": "low|medium|high|critical"
    },
    "stakeholderAnalysis": {
      "primaryStakeholders": ["key stakeholders to notify"],
      "communicationUrgency": "low|medium|high|critical",
      "escalationNeeds": ["escalation requirements"]
    },
    "complianceConsiderations": {
      "regulatoryReporting": true|false,
      "complianceFrameworks": ["applicable frameworks"],
      "reportingTimelines": ["compliance deadlines if any"]
    }
  },
  "recommendedActions": ["key recommendations for incident response"],
  "analysisDepth": "${analysisDepth}",
  "generatedAt": "${new Date().toISOString()}"
}`;

      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'incident_context_analysis',
        contextId: incidentId,
        maxTokens: 2500,
        temperature: 0.3
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - (params.startTime || Date.now());
      
      console.log(`🔍 AI context analysis response length:`, aiResponse?.length || 0);

      // Parse AI response
      let analysis;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI context analysis response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI context analysis JSON:', parseError);
        throw new Error(`AI context analysis failed: ${parseError.message}`);
      }

      return {
        success: true,
        context: analysis.context,
        analysisInsights: analysis.analysisInsights,
        recommendedActions: analysis.recommendedActions || [],
        analysisDepth: analysisDepth,
        processingTime,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error in AI incident context analysis:', error);
      throw error; // No fallback - fail is fail
    }
  }

  /**
   * Generate incident response plan using AI
   */
  async draftResponsePlan(params) {
    try {
      const {
        incidentContext,
        responseApproach = 'structured',
        includeStakeholders = true,
        includeTimelines = true,
        organizationId,
        userId
      } = params;

      console.log('📋 AI drafting incident response plan...');

      const { incidentData, analysisInsights = {} } = incidentContext;
      
      const prompt = `As a cybersecurity incident response expert, create a comprehensive incident response plan for the following incident using best practices and industry standards.

INCIDENT INFORMATION:
Title: ${incidentData.title}
Severity: ${incidentData.severity}/5
Category: ${incidentData.category}
Status: ${incidentData.status}
Age: ${incidentData.ageHours} hours

ANALYSIS INSIGHTS:
${JSON.stringify(analysisInsights, null, 2)}

RESPONSE REQUIREMENTS:
- Approach: ${responseApproach}
- Include Stakeholders: ${includeStakeholders ? 'Yes' : 'No'}
- Include Timelines: ${includeTimelines ? 'Yes' : 'No'}

INSTRUCTIONS:
- Create a structured, professional incident response plan
- Follow NIST incident response framework phases
- Include specific, actionable steps and procedures
- ${includeStakeholders ? 'Include detailed stakeholder communication plan' : 'Focus on technical response only'}
- ${includeTimelines ? 'Include realistic timelines and milestones' : 'Focus on actions without specific timing'}
- Consider the incident severity level ${incidentData.severity}
- Use professional incident response terminology

Return ONLY a JSON response in this exact format:
{
  "responsePlan": {
    "executiveSummary": "brief overview of the incident and response approach",
    "immediateActions": [
      {
        "action": "specific action to take",
        "priority": "high|medium|low",
        "timeframe": "immediate|short-term|ongoing",
        "responsible": "role/team responsible",
        "description": "detailed description of the action"
      }
    ],
    "investigationSteps": [
      {
        "step": "investigation step",
        "methodology": "how to perform this step",
        "expectedOutcome": "what this step should achieve",
        "tools": ["tools/techniques needed"]
      }
    ],
    "containmentMeasures": [
      {
        "measure": "containment action",
        "scope": "systems/areas affected",
        "impact": "operational impact of this measure",
        "validation": "how to verify effectiveness"
      }
    ],
    ${includeStakeholders ? `"stakeholderCommunication": {
      "internalStakeholders": ["list of internal stakeholders"],
      "externalStakeholders": ["list of external stakeholders"],
      "communicationPlan": ["communication steps and timing"],
      "escalationCriteria": ["when to escalate to executive level"]
    },` : ''}
    ${includeTimelines ? `"timeline": {
      "phase1_containment": "timeframe for containment phase",
      "phase2_investigation": "timeframe for investigation phase", 
      "phase3_eradication": "timeframe for eradication phase",
      "phase4_recovery": "timeframe for recovery phase",
      "keyMilestones": ["important milestones and deadlines"]
    },` : ''}
    "resourceRequirements": {
      "personnel": ["required team members and roles"],
      "tools": ["necessary tools and technologies"],
      "budget": "estimated budget considerations if any"
    },
    "successCriteria": ["criteria that define successful incident resolution"]
  },
  "metadata": {
    "approach": "${responseApproach}",
    "includesStakeholders": ${includeStakeholders},
    "includesTimelines": ${includeTimelines},
    "generatedSections": ["sections included in the plan"]
  }
}`;

      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'incident_response_plan',
        contextId: incidentData.id,
        maxTokens: 3000,
        temperature: 0.3
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - (params.startTime || Date.now());
      
      console.log(`📋 AI response plan generation response length:`, aiResponse?.length || 0);

      // Parse AI response
      let plan;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          plan = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response plan response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response plan JSON:', parseError);
        throw new Error(`AI response plan generation failed: ${parseError.message}`);
      }

      return {
        success: true,
        content: plan.responsePlan,
        contentType: 'response_plan',
        metadata: plan.metadata,
        processingTime
      };

    } catch (error) {
      console.error('❌ Error in AI response plan generation:', error);
      throw error; // No fallback - fail is fail
    }
  }

  /**
   * Generate impact assessment using AI
   */
  async draftImpactAssessment(params) {
    try {
      const {
        incidentContext,
        assessmentScope = 'comprehensive',
        includeFinancialImpact = true,
        includeRegulatoryImpact = true,
        organizationId,
        userId
      } = params;

      console.log('💥 AI drafting impact assessment...');

      const { incidentData, analysisInsights = {} } = incidentContext;

      const prompt = `As a cybersecurity business impact analyst, create a comprehensive impact assessment for the following security incident, analyzing technical, business, and operational impacts.

INCIDENT INFORMATION:
Title: ${incidentData.title}
Severity: ${incidentData.severity}/5
Category: ${incidentData.category}
Status: ${incidentData.status}
Age: ${incidentData.ageHours} hours

ANALYSIS INSIGHTS:
${JSON.stringify(analysisInsights, null, 2)}

ASSESSMENT REQUIREMENTS:
- Scope: ${assessmentScope}
- Include Financial Impact: ${includeFinancialImpact ? 'Yes' : 'No'}
- Include Regulatory Impact: ${includeRegulatoryImpact ? 'Yes' : 'No'}

INSTRUCTIONS:
- Provide detailed impact analysis across all relevant dimensions
- Quantify impacts where possible with realistic estimates
- Consider both immediate and long-term impacts
- ${includeFinancialImpact ? 'Include financial impact estimation with cost categories' : 'Focus on non-financial impacts'}
- ${includeRegulatoryImpact ? 'Include regulatory compliance and reporting requirements' : 'Focus on operational impacts'}
- Assess data exposure and privacy implications
- Consider reputational and customer impact

Return ONLY a JSON response in this exact format:
{
  "impactAssessment": {
    "executiveSummary": "high-level summary of overall impact",
    "technicalImpact": {
      "affectedSystems": ["list of impacted systems"],
      "serviceDisruption": "description of service impacts",
      "dataImpact": "assessment of data exposure/compromise",
      "systemAvailability": "availability impact assessment",
      "performanceImpact": "performance degradation assessment"
    },
    "businessImpact": {
      "operationalImpact": "how business operations are affected",
      "customerImpact": "impact on customers and services",
      "productivityImpact": "impact on employee/business productivity",
      "reputationalImpact": "potential damage to reputation",
      "competitiveImpact": "impact on competitive position"
    },
    ${includeFinancialImpact ? `"financialImpact": {
      "immediateCosts": {
        "incidentResponseCosts": "estimated immediate response costs",
        "businessDisruptionCosts": "cost of service/business disruption",
        "emergencyMeasuresCosts": "cost of emergency containment measures"
      },
      "projectedCosts": {
        "remediationCosts": "estimated costs for full remediation",
        "legalCosts": "potential legal and compliance costs",
        "customerRetentionCosts": "costs related to customer retention"
      },
      "totalEstimatedImpact": "overall estimated financial impact range"
    },` : ''}
    ${includeRegulatoryImpact ? `"regulatoryImpact": {
      "complianceViolations": ["potential compliance violations"],
      "reportingRequirements": ["mandatory reporting obligations"],
      "regulatoryTimelines": ["key regulatory deadlines"],
      "potentialPenalties": "assessment of potential fines/penalties",
      "auditImplications": "impact on regulatory audits"
    },` : ''}
    "riskFactors": [
      {
        "risk": "identified risk factor",
        "likelihood": "low|medium|high",
        "impact": "low|medium|high|critical",
        "mitigation": "recommended risk mitigation"
      }
    ],
    "recoveryAssessment": {
      "recoveryTimeEstimate": "estimated time to full recovery",
      "recoveryComplexity": "low|medium|high|critical",
      "criticalDependencies": ["critical factors for recovery"]
    }
  },
  "impactSummary": {
    "overallSeverity": "low|medium|high|critical",
    "primaryImpacts": ["top 3-5 most significant impacts"],
    "urgentActions": ["most urgent actions needed to minimize impact"]
  }
}`;

      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'impact_assessment',
        contextId: incidentData.id,
        maxTokens: 3000,
        temperature: 0.3
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - (params.startTime || Date.now());
      
      console.log(`💥 AI impact assessment response length:`, aiResponse?.length || 0);

      // Parse AI response
      let assessment;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          assessment = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI impact assessment response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI impact assessment JSON:', parseError);
        throw new Error(`AI impact assessment failed: ${parseError.message}`);
      }

      // Format the structured data into readable text
      const formattedContent = ContentFormatter.formatImpactAssessment(assessment.impactAssessment);

      return {
        success: true,
        content: formattedContent,
        summary: assessment.impactSummary,
        contentType: 'impact_assessment',
        metadata: {
          scope: assessmentScope,
          includesFinancial: includeFinancialImpact,
          includesRegulatory: includeRegulatoryImpact,
          originalData: assessment.impactAssessment  // Keep original structured data
        },
        processingTime
      };

    } catch (error) {
      console.error('❌ Error in AI impact assessment generation:', error);
      throw error; // No fallback - fail is fail
    }
  }

  /**
   * Generate investigation plan using AI
   */
  async draftInvestigationPlan(params) {
    try {
      const {
        incidentContext,
        investigationDepth = 'standard',
        includeForensics = true,
        includeTimeline = true,
        organizationId,
        userId
      } = params;

      console.log('🔬 AI drafting investigation plan...');

      const { incidentData, analysisInsights = {} } = incidentContext;

      const prompt = `As a cybersecurity digital forensics and incident investigation expert, create a comprehensive investigation plan for the following security incident using industry best practices and forensic methodologies.

INCIDENT INFORMATION:
Title: ${incidentData.title}
Severity: ${incidentData.severity}/5
Category: ${incidentData.category}
Status: ${incidentData.status}
Age: ${incidentData.ageHours} hours

ANALYSIS INSIGHTS:
${JSON.stringify(analysisInsights, null, 2)}

INVESTIGATION REQUIREMENTS:
- Depth: ${investigationDepth}
- Include Forensics: ${includeForensics ? 'Yes - include digital forensics procedures' : 'No - standard investigation only'}
- Include Timeline: ${includeTimeline ? 'Yes - include investigation timeline' : 'No - focus on procedures only'}

INSTRUCTIONS:
- Create a structured investigation plan following forensic best practices
- Include evidence collection, preservation, and analysis procedures
- Specify investigation objectives, scope, and methodology
- ${includeForensics ? 'Include detailed digital forensics procedures and techniques' : 'Focus on standard investigation methods'}
- ${includeTimeline ? 'Include realistic investigation timeline with milestones' : 'Focus on investigation steps without timing'}
- Consider legal and regulatory requirements for evidence handling
- Include tools, techniques, and expertise requirements

Return ONLY a JSON response in this exact format:
{
  "investigationPlan": {
    "investigationObjectives": {
      "primaryObjectives": ["main goals of the investigation"],
      "scopeDefinition": "clear definition of investigation scope",
      "successCriteria": ["criteria for successful investigation completion"]
    },
    "evidenceManagement": {
      "evidenceTypes": ["types of evidence to collect"],
      "collectionProcedures": [
        {
          "evidenceType": "type of evidence",
          "collectionMethod": "how to collect it",
          "preservationRequirements": "how to preserve it",
          "chainOfCustody": "custody requirements"
        }
      ],
      "storageRequirements": "evidence storage and security requirements",
      "legalConsiderations": "legal requirements for evidence handling"
    },
    ${includeForensics ? `"forensicAnalysis": {
      "diskForensics": {
        "procedures": ["disk imaging and analysis procedures"],
        "tools": ["required forensic tools"],
        "analysisSteps": ["step-by-step forensic analysis"]
      },
      "networkForensics": {
        "procedures": ["network traffic analysis procedures"],
        "dataCollection": ["network data to collect"],
        "analysisApproach": "approach to network forensic analysis"
      },
      "memoryForensics": {
        "procedures": ["memory dump and analysis procedures"],
        "tools": ["memory analysis tools"],
        "targetArtifacts": ["memory artifacts to analyze"]
      },
      "malwareAnalysis": {
        "staticAnalysis": ["static malware analysis procedures"],
        "dynamicAnalysis": ["dynamic malware analysis procedures"],
        "sandboxRequirements": "sandbox environment requirements"
      }
    },` : ''}
    "investigationMethodology": {
      "phase1_preparation": {
        "activities": ["preparation phase activities"],
        "deliverables": ["expected deliverables"],
        "resources": ["required resources and tools"]
      },
      "phase2_collection": {
        "activities": ["evidence collection activities"],
        "deliverables": ["collection phase deliverables"],
        "qualityAssurance": "quality assurance procedures"
      },
      "phase3_analysis": {
        "activities": ["analysis phase activities"],
        "techniques": ["analysis techniques and methods"],
        "deliverables": ["analysis deliverables"]
      },
      "phase4_reporting": {
        "activities": ["reporting phase activities"],
        "reportStructure": "investigation report structure",
        "audienceConsiderations": "considerations for different audiences"
      }
    },
    ${includeTimeline ? `"investigationTimeline": {
      "phase1_duration": "estimated duration for preparation phase",
      "phase2_duration": "estimated duration for collection phase",
      "phase3_duration": "estimated duration for analysis phase",
      "phase4_duration": "estimated duration for reporting phase",
      "totalEstimatedDuration": "total investigation duration estimate",
      "keyMilestones": [
        {
          "milestone": "milestone description",
          "targetDate": "relative timeline (e.g., Day 3)",
          "deliverable": "expected deliverable"
        }
      ]
    },` : ''}
    "resourceRequirements": {
      "personnel": [
        {
          "role": "required role/expertise",
          "responsibilities": "key responsibilities",
          "timeCommitment": "estimated time commitment"
        }
      ],
      "tools": ["required investigation and forensic tools"],
      "infrastructure": ["infrastructure requirements"],
      "externalExpertise": ["potential external expert requirements"]
    },
    "riskMitigation": [
      {
        "risk": "investigation risk",
        "mitigation": "how to mitigate this risk",
        "contingency": "backup plan if risk materializes"
      }
    ]
  },
  "investigationSummary": {
    "depth": "${investigationDepth}",
    "estimatedDuration": "overall time estimate",
    "complexityAssessment": "low|medium|high|critical",
    "criticalSuccessFactors": ["factors critical for investigation success"]
  }
}`;

      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'investigation_plan',
        contextId: incidentData.id,
        maxTokens: 3500,
        temperature: 0.3
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - (params.startTime || Date.now());
      
      console.log(`🔬 AI investigation plan response length:`, aiResponse?.length || 0);

      // Parse AI response
      let plan;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          plan = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI investigation plan response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI investigation plan JSON:', parseError);
        throw new Error(`AI investigation plan generation failed: ${parseError.message}`);
      }

      // Format the structured data into readable text
      const formattedContent = ContentFormatter.formatInvestigationPlan(plan.investigationPlan);

      return {
        success: true,
        content: formattedContent,
        summary: plan.investigationSummary,
        contentType: 'investigation_plan',
        metadata: {
          depth: investigationDepth,
          includesForensics: includeForensics,
          includesTimeline: includeTimeline,
          originalData: plan.investigationPlan  // Keep original structured data
        },
        processingTime
      };

    } catch (error) {
      console.error('❌ Error in AI investigation plan generation:', error);
      throw error; // No fallback - fail is fail
    }
  }

  /**
   * Generate containment strategy using AI
   */
  async draftContainmentStrategy(params) {
    try {
      const {
        incidentContext,
        containmentApproach = 'comprehensive',
        includeRecovery = true,
        balanceOperations = true,
        organizationId,
        userId
      } = params;

      console.log('🛡️ AI drafting containment strategy...');

      const { incidentData, analysisInsights = {} } = incidentContext;

      const prompt = `As a cybersecurity incident response and business continuity expert, create a comprehensive containment strategy for the following security incident that balances security containment with operational continuity.

INCIDENT INFORMATION:
Title: ${incidentData.title}
Severity: ${incidentData.severity}/5
Category: ${incidentData.category}
Status: ${incidentData.status}
Age: ${incidentData.ageHours} hours

ANALYSIS INSIGHTS:
${JSON.stringify(analysisInsights, null, 2)}

CONTAINMENT REQUIREMENTS:
- Approach: ${containmentApproach}
- Include Recovery: ${includeRecovery ? 'Yes - include recovery procedures' : 'No - focus on containment only'}
- Balance Operations: ${balanceOperations ? 'Yes - minimize operational disruption' : 'No - security-first approach'}

INSTRUCTIONS:
- Create a multi-phase containment strategy with immediate, short-term, and long-term measures
- Include specific containment actions with technical details
- ${balanceOperations ? 'Balance containment effectiveness with operational continuity' : 'Prioritize security containment over operational concerns'}
- ${includeRecovery ? 'Include detailed recovery and validation procedures' : 'Focus on containment measures only'}
- Consider scalability and rollback procedures
- Include monitoring and validation steps for each measure

Return ONLY a JSON response in this exact format:
{
  "containmentStrategy": {
    "strategicApproach": "overview of the containment approach and philosophy",
    "immediateContainment": {
      "criticalActions": [
        {
          "action": "immediate containment action",
          "priority": "critical|high|medium",
          "procedure": "detailed procedure steps",
          "expectedOutcome": "what this action should achieve",
          "risksAndMitigation": "risks and how to mitigate them",
          "validationSteps": "how to verify action effectiveness"
        }
      ],
      "timeframe": "expected timeframe for immediate actions",
      "successCriteria": ["criteria indicating successful immediate containment"]
    },
    "shortTermMeasures": {
      "isolationProcedures": [
        {
          "target": "what to isolate (systems/networks/accounts)",
          "method": "isolation technique/method",
          "procedure": "step-by-step isolation procedure",
          "operationalImpact": "impact on business operations",
          "monitoring": "how to monitor isolated systems"
        }
      ],
      "accessControls": [
        {
          "control": "access control measure",
          "implementation": "how to implement this control",
          "scope": "systems/users/processes affected",
          "rollbackProcedure": "how to reverse if needed"
        }
      ],
      "monitoringEnhancements": [
        {
          "enhancement": "monitoring improvement",
          "implementation": "how to implement",
          "alertCriteria": "what should trigger alerts",
          "responseActions": "actions to take on alerts"
        }
      ]
    },
    "longTermSolutions": {
      "systemHardening": [
        {
          "system": "system/service to harden",
          "hardeningMeasures": ["specific hardening steps"],
          "implementation": "implementation approach",
          "testing": "how to test hardening measures"
        }
      ],
      "policyUpdates": [
        {
          "policy": "policy requiring update",
          "changes": "required policy changes",
          "implementation": "how to implement policy changes",
          "compliance": "compliance verification approach"
        }
      ],
      "architecturalChanges": [
        {
          "change": "architectural modification",
          "rationale": "why this change is needed",
          "implementation": "implementation plan",
          "timeline": "implementation timeline"
        }
      ]
    },
    ${includeRecovery ? `"recoveryProcedures": {
      "systemRecovery": {
        "phases": [
          {
            "phase": "recovery phase",
            "activities": ["recovery activities"],
            "validation": "validation procedures",
            "rollbackCriteria": "when to rollback"
          }
        ],
        "prioritization": "system recovery priority order",
        "dependencyMap": "system dependency considerations"
      },
      "dataRecovery": {
        "procedures": ["data recovery procedures"],
        "validation": "data integrity validation",
        "backupUtilization": "backup recovery approach"
      },
      "serviceRestoration": {
        "procedures": ["service restoration steps"],
        "testing": "service testing requirements",
        "performanceValidation": "performance validation criteria"
      }
    },` : ''}
    "monitoringAndValidation": {
      "containmentValidation": [
        {
          "measure": "containment measure to validate",
          "validationMethod": "how to validate effectiveness",
          "frequency": "validation frequency",
          "failureCriteria": "criteria indicating containment failure"
        }
      ],
      "ongoingMonitoring": {
        "keyIndicators": ["key metrics to monitor"],
        "alerting": "alerting strategy and thresholds",
        "reportingSchedule": "monitoring reporting schedule"
      },
      "adjustmentTriggers": ["conditions that would trigger strategy adjustments"]
    },
    ${balanceOperations ? `"operationalContinuity": {
      "businessImpactMinimization": ["measures to minimize business impact"],
      "alternativeProcedures": ["alternative business procedures during containment"],
      "communicationPlan": ["operational communication requirements"],
      "contingencyPlans": ["contingency plans for extended containment"]
    },` : ''}
    "rollbackProcedures": {
      "rollbackTriggers": ["conditions requiring rollback"],
      "rollbackSteps": ["step-by-step rollback procedures"],
      "rollbackValidation": "how to validate successful rollback",
      "escalationCriteria": "when to escalate rollback decisions"
    }
  },
  "containmentSummary": {
    "approach": "${containmentApproach}",
    "expectedEffectiveness": "low|medium|high|critical",
    "operationalImpact": "minimal|moderate|significant|severe",
    "implementationComplexity": "low|medium|high|critical",
    "keySuccessFactors": ["factors critical for containment success"]
  }
}`;

      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'containment_strategy',
        contextId: incidentData.id,
        maxTokens: 4000,
        temperature: 0.3
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - (params.startTime || Date.now());
      
      console.log(`🛡️ AI containment strategy response length:`, aiResponse?.length || 0);

      // Parse AI response
      let strategy;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          strategy = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI containment strategy response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI containment strategy JSON:', parseError);
        throw new Error(`AI containment strategy generation failed: ${parseError.message}`);
      }

      // Format the structured data into readable text
      const formattedContent = ContentFormatter.formatContainmentStrategy(strategy.containmentStrategy);

      return {
        success: true,
        content: formattedContent,
        summary: strategy.containmentSummary,
        contentType: 'containment_strategy',
        metadata: {
          approach: containmentApproach,
          includesRecovery: includeRecovery,
          balancesOperations: balanceOperations,
          originalData: strategy.containmentStrategy  // Keep original structured data
        },
        processingTime
      };

    } catch (error) {
      console.error('❌ Error in AI containment strategy generation:', error);
      throw error; // No fallback - fail is fail
    }
  }

  /**
   * Generate comprehensive incident form data from alert
   */
  async generateIncidentFormFromAlert(params) {
    try {
      const {
        alertContext,
        generateComprehensiveData = true,
        includeTimeline = true,
        includeMitreMapping = true,
        includeActionItems = true,
        organizationId,
        userId
      } = params;

      console.log('📝 AI generating incident form from alert...');

      // The alertContext is flattened by incidentFormGenerationService._prepareAlertContext()
      const aiAnalysis = alertContext.aiAnalysis;
      const asset = alertContext.asset;

      const prompt = `You are a JSON generator. You must respond with ONLY valid JSON. Do not include any explanations, text, or commentary. 

TASK: Generate an incident form JSON based on this security alert.

ALERT DATA:
Title: ${alertContext.title}
Description: ${alertContext.description}
Severity: ${alertContext.severity}/5
Source: ${alertContext.sourceSystem}
Time: ${alertContext.eventTime}
Asset: ${alertContext.assetName || 'Unknown'}
${aiAnalysis ? `Analysis: ${aiAnalysis.summary}` : ''}
${asset ? `Asset Type: ${asset.assetType}, IP: ${asset.ipAddress || 'Unknown'}` : ''}

MANDATORY JSON STRUCTURE (return EXACTLY this format with real data):

{
  "incidentForm": {
    "title": "Generate title based on alert",
    "description": "Generate description based on alert and analysis",
    "priority": "critical",
    "severity": 4,
    "category": "malware",
    "affectedSystems": ["${alertContext.assetName || 'Unknown'}"],
    "impactAssessment": "Describe technical and business impact",
    "recommendedActions": ["List immediate actions needed"],
    "stakeholders": ["Security team", "IT team"],
    "estimatedTimeline": "Provide incident timeline",
    "investigationPlan": "Describe investigation steps",
    "containmentStrategy": "Describe containment approach"
  }
}

RESPOND WITH ONLY THE JSON ABOVE - NO OTHER TEXT`;

      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'incident_form_generation',
        contextId: alertContext.id,
        maxTokens: 4000,
        temperature: 0.3
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - (params.startTime || Date.now());
      
      console.log(`📝 AI incident form generation response length:`, aiResponse?.length || 0);

      // Parse AI response with robust JSON extraction
      let formData;
      try {
        console.log(`🔍 AI incident form response preview:`, aiResponse?.substring(0, 500));
        console.log(`🔍 AI incident form response suffix:`, aiResponse?.substring(-200));
        
        formData = this._extractAndParseJSON(aiResponse);
        
      } catch (parseError) {
        console.error('Failed to parse AI incident form JSON:', parseError);
        console.error('AI Response type:', typeof aiResponse);
        console.error('AI Response length:', aiResponse?.length);
        console.error('❌ Full AI response for debugging:', aiResponse);
        throw new Error(`AI incident form generation failed: ${parseError.message}`);
      }

      console.log('🔍 Parsed formData keys:', Object.keys(formData || {}));
      console.log('🔍 formData.incidentForm exists:', !!formData.incidentForm);
      console.log('🔍 formData structure preview:', JSON.stringify(formData, null, 2).substring(0, 1000));
      
      if (!formData.incidentForm) {
        console.error('❌ formData.incidentForm is missing from parsed AI response');
        console.error('🔍 Full formData:', JSON.stringify(formData, null, 2));
        throw new Error('AI response does not contain the expected incidentForm structure');
      }

      return {
        success: true,
        content: formData.incidentForm,
        metadata: {
          sourceAlert: alertContext.id,
          generationApproach: 'simplified AI-based form generation',
          confidence: 85
        },
        contentType: 'incident_form',
        confidence: 85,
        sections: ['incidentForm'],
        processingTime,
        aiProvider: aiResult.aiProvider,
        aiModel: aiResult.aiModel,
        inputTokens: aiResult.inputTokens || 0,
        outputTokens: aiResult.outputTokens || 0
      };

    } catch (error) {
      console.error('❌ Error in AI incident form generation:', error);
      throw error; // No fallback - fail is fail
    }
  }

  /**
   * Generate estimated timeline using AI
   */
  async draftEstimatedTimeline(params) {
    try {
      const {
        incidentContext,
        timelineScope = 'full_lifecycle',
        includePhases = ['containment', 'investigation', 'eradication', 'recovery'],
        includeMilestones = true,
        includeResourceRequirements = true,
        organizationId,
        userId
      } = params;

      console.log('⏱️ AI drafting estimated timeline...');

      const { incidentData, analysisInsights = {} } = incidentContext;

      const prompt = `As a cybersecurity project management and incident response expert, create a realistic timeline estimate for resolving the following security incident, considering complexity, resource requirements, and business constraints.

INCIDENT INFORMATION:
Title: ${incidentData.title}
Severity: ${incidentData.severity}/5
Category: ${incidentData.category}
Status: ${incidentData.status}
Age: ${incidentData.ageHours} hours

ANALYSIS INSIGHTS:
${JSON.stringify(analysisInsights, null, 2)}

TIMELINE REQUIREMENTS:
- Scope: ${timelineScope}
- Include Phases: ${includePhases.join(', ')}
- Include Milestones: ${includeMilestones ? 'Yes - include key milestones' : 'No - phases only'}
- Include Resources: ${includeResourceRequirements ? 'Yes - include resource allocation timeline' : 'No - timeline only'}

INSTRUCTIONS:
- Create realistic timeline estimates based on incident complexity and severity
- Consider dependencies between phases and activities
- Include buffer time for unexpected complications
- ${includeMilestones ? 'Include key milestones and decision points' : 'Focus on phase durations only'}
- ${includeResourceRequirements ? 'Include resource allocation and availability considerations' : 'Focus on timeline without resource details'}
- Consider business hours vs 24/7 response requirements
- Account for regulatory reporting deadlines if applicable

Return ONLY a JSON response in this exact format:
{
  "estimatedTimeline": {
    "overallEstimate": {
      "totalDuration": "overall incident resolution timeframe",
      "confidenceLevel": "low|medium|high",
      "criticalPath": ["activities on the critical path"],
      "assumptions": ["key assumptions affecting timeline"]
    },
    ${includePhases.includes('containment') ? `"containmentPhase": {
      "duration": "estimated containment duration",
      "activities": [
        {
          "activity": "containment activity",
          "estimatedTime": "time estimate for this activity",
          "dependencies": ["prerequisite activities"],
          "riskFactors": ["factors that could extend timeline"]
        }
      ],
      "milestones": ["key containment milestones"],
      "successCriteria": ["criteria for phase completion"]
    },` : ''}
    ${includePhases.includes('investigation') ? `"investigationPhase": {
      "duration": "estimated investigation duration",
      "activities": [
        {
          "activity": "investigation activity",
          "estimatedTime": "time estimate for this activity", 
          "dependencies": ["prerequisite activities"],
          "complexity": "low|medium|high|critical"
        }
      ],
      "milestones": ["key investigation milestones"],
      "deliverables": ["expected investigation deliverables"]
    },` : ''}
    ${includePhases.includes('eradication') ? `"eradicationPhase": {
      "duration": "estimated eradication duration",
      "activities": [
        {
          "activity": "eradication activity",
          "estimatedTime": "time estimate for this activity",
          "dependencies": ["prerequisite activities"],
          "validationTime": "time needed for validation"
        }
      ],
      "milestones": ["key eradication milestones"],
      "riskMitigation": ["timeline risk mitigation measures"]
    },` : ''}
    ${includePhases.includes('recovery') ? `"recoveryPhase": {
      "duration": "estimated recovery duration",
      "activities": [
        {
          "activity": "recovery activity",
          "estimatedTime": "time estimate for this activity",
          "dependencies": ["prerequisite activities"],
          "testing": "testing and validation time"
        }
      ],
      "milestones": ["key recovery milestones"],
      "businessResumption": "business operations resumption timeline"
    },` : ''}
    ${includePhases.includes('lessons_learned') ? `"lessonsLearnedPhase": {
      "duration": "estimated lessons learned phase duration",
      "activities": ["post-incident review activities"],
      "deliverables": ["lessons learned deliverables"],
      "participantRequirements": "participant time commitments"
    },` : ''}
    ${includeMilestones ? `"keyMilestones": [
      {
        "milestone": "milestone description",
        "targetDate": "relative timeline (e.g., Day 2, Hour 6)",
        "dependencies": ["prerequisite milestones"],
        "decisionPoint": "key decision to be made",
        "stakeholders": ["stakeholders involved in milestone"]
      }
    ],` : ''}
    ${includeResourceRequirements ? `"resourceAllocation": {
      "coreTeam": [
        {
          "role": "team role",
          "timeCommitment": "percentage or hours per phase",
          "availability": "availability constraints",
          "expertise": "required expertise level"
        }
      ],
      "externalResources": [
        {
          "resource": "external resource type",
          "timeframe": "when resource is needed",
          "procurement": "time to procure resource",
          "cost": "cost considerations"
        }
      ],
      "peakResourcePeriods": ["periods of highest resource demand"],
      "resourceRisks": ["risks related to resource availability"]
    },` : ''}
    "timelineRisks": [
      {
        "risk": "timeline risk factor",
        "probability": "low|medium|high",
        "impact": "days/hours of potential delay",
        "mitigation": "how to mitigate this risk",
        "contingency": "contingency plan for this risk"
      }
    ],
    "accelerationOptions": [
      {
        "option": "timeline acceleration option",
        "timeReduction": "potential time savings",
        "additionalResources": "additional resources required",
        "risks": "risks of acceleration"
      }
    ]
  },
  "timelineSummary": {
    "scope": "${timelineScope}",
    "totalEstimate": "overall time estimate with confidence range",
    "criticalFactors": ["factors most critical to timeline success"],
    "recommendedApproach": "recommended timeline management approach"
  }
}`;

      const aiResult = await this.aiService.generateTestResponse({
        prompt,
        organizationId,
        userId,
        contextType: 'timeline_estimation',
        contextId: incidentData.id,
        maxTokens: 3500,
        temperature: 0.3
      });

      const aiResponse = aiResult.response || aiResult.content;
      const processingTime = Date.now() - (params.startTime || Date.now());
      
      console.log(`⏱️ AI timeline estimation response length:`, aiResponse?.length || 0);

      // Parse AI response
      let timeline;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          timeline = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI timeline estimation response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI timeline estimation JSON:', parseError);
        throw new Error(`AI timeline estimation failed: ${parseError.message}`);
      }

      // Format the structured data into readable text
      const formattedContent = ContentFormatter.formatEstimatedTimeline(timeline.estimatedTimeline);

      return {
        success: true,
        content: formattedContent,
        summary: timeline.timelineSummary,
        contentType: 'estimated_timeline',
        metadata: {
          scope: timelineScope,
          phases: includePhases,
          includesMilestones: includeMilestones,
          includesResources: includeResourceRequirements,
          originalData: timeline.estimatedTimeline  // Keep original structured data
        },
        processingTime
      };

    } catch (error) {
      console.error('❌ Error in AI timeline estimation:', error);
      throw error; // No fallback - fail is fail
    }
  }

  // Helper methods for database access
  async getIncidentById(incidentId) {
    try {
      const { models } = require('../../database/models');
      const incident = await models.Incident.findByPk(incidentId, {
        include: [
          {
            model: models.User,
            as: 'assignedUser',
            attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
            required: false
          }
        ]
      });
      
      if (!incident) {
        console.error(`Incident ${incidentId} not found in database`);
        return null;
      }
      
      if (incident && incident.assignedUser) {
        incident.assignedToName = `${incident.assignedUser.firstName} ${incident.assignedUser.lastName}`;
      }
      
      return incident;
    } catch (error) {
      console.error('Error fetching incident:', error);
      console.error('SQL Error details:', error.sql);
      return null;
    }
  }

  async getRelatedAlerts(incidentId) {
    try {
      const { models } = require('../../database/models');
      
      // First get the incident to access alertIds array
      const incident = await models.Incident.findByPk(incidentId);
      if (!incident || !incident.alertIds || incident.alertIds.length === 0) {
        return [];
      }
      
      // Get alerts using the alertIds array
      const { Op } = require('sequelize');
      const alerts = await models.Alert.findAll({
        where: { 
          id: { [Op.in]: incident.alertIds }
        },
        attributes: ['id', 'title', 'severity', 'sourceSystem', 'eventTime', 'status'],
        limit: 10,
        order: [['eventTime', 'DESC']]
      });
      return alerts || [];
    } catch (error) {
      console.error('Error fetching related alerts:', error);
      return [];
    }
  }

  async getTimelineEvents(incidentId) {
    try {
      const { models } = require('../../database/models');
      const events = await models.TimelineEvent.findAll({
        where: { incidentId },
        attributes: ['id', 'timestamp', 'type', 'title', 'description', 'userId'],
        limit: 20,
        order: [['timestamp', 'DESC']]
      });
      return events || [];
    } catch (error) {
      console.error('Error fetching timeline events:', error);
      return [];
    }
  }

  /**
   * Extract and parse JSON from AI response with multiple fallback methods
   * Handles markdown code blocks, explanatory text, and formatting issues
   * @private
   */
  _extractAndParseJSON(aiResponse) {
    if (!aiResponse || typeof aiResponse !== 'string') {
      throw new Error('Invalid AI response: not a string');
    }

    let jsonString = null;
    
    // Method 1: Extract from markdown code blocks
    const markdownMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
    if (markdownMatch) {
      console.log('🔧 Found JSON in markdown code blocks');
      jsonString = markdownMatch[1];
    }
    
    // Method 2: Find the largest complete JSON object that contains incidentForm
    if (!jsonString) {
      const jsonMatches = aiResponse.match(/\{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*\}/g);
      if (jsonMatches && jsonMatches.length > 0) {
        // Filter for JSON that contains "incidentForm" and sort by length
        const incidentFormMatches = jsonMatches.filter(json => json.includes('incidentForm'));
        if (incidentFormMatches.length > 0) {
          jsonString = incidentFormMatches.sort((a, b) => b.length - a.length)[0];
          console.log('🔧 Found JSON using largest incidentForm-containing object method');
        } else {
          // Fallback to largest JSON if no incidentForm found
          jsonString = jsonMatches.sort((a, b) => b.length - a.length)[0];
          console.log('🔧 Found JSON using largest object method (no incidentForm filter)');
        }
      }
    }

    // Method 3: Extract everything between first { and last }
    if (!jsonString) {
      const firstBrace = aiResponse.indexOf('{');
      const lastBrace = aiResponse.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonString = aiResponse.substring(firstBrace, lastBrace + 1);
        console.log('🔧 Found JSON using first-to-last brace method');
      }
    }

    if (!jsonString) {
      console.error('❌ No JSON structure found in AI response');
      throw new Error('No JSON found in AI incident form generation response');
    }

    // Clean and normalize the JSON string
    jsonString = this._cleanJSONString(jsonString);
    
    // Attempt to parse with error recovery
    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.warn('⚠️ Initial JSON parse failed, attempting recovery...');
      
      // Try to fix common JSON issues
      const recoveredJSON = this._recoverJSON(jsonString);
      try {
        return JSON.parse(recoveredJSON);
      } catch (recoveryError) {
        console.error('❌ JSON recovery also failed');
        throw new Error(`JSON parsing failed: ${parseError.message}. Recovery attempt: ${recoveryError.message}`);
      }
    }
  }

  /**
   * Clean JSON string by removing common formatting issues
   * @private
   */
  _cleanJSONString(jsonString) {
    return jsonString
      // Remove comments (// and /* */)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      // Remove trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Remove control characters that break JSON
      .replace(/[\u0000-\u001f]/g, '')
      // Trim whitespace
      .trim();
  }

  /**
   * Attempt to recover malformed JSON
   * @private
   */
  _recoverJSON(jsonString) {
    try {
      return jsonString
        // Fix common escape issues
        .replace(/\\n/g, '\\n')
        .replace(/\\r/g, '\\r')
        .replace(/\\t/g, '\\t')
        // Fix unquoted keys
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
        // Fix single quotes
        .replace(/'/g, '"')
        // Remove trailing commas more aggressively
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix multiple consecutive commas
        .replace(/,+/g, ',');
    } catch (error) {
      console.error('Error in JSON recovery:', error);
      return jsonString; // Return original if recovery fails
    }
  }
}

module.exports = {
  INCIDENT_DRAFT_TOOLS,
  IncidentDraftExecutor
};