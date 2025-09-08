/**
 * Conversational Intelligence Service
 * Handles multi-step workflows, context tracking, and interactive clarification
 * Makes AI chat intelligent by remembering context and asking for missing information
 */

import { models } from '../database/models';
import { Op } from 'sequelize';

/**
 * Workflow States for Multi-Step Processes
 */
export const WORKFLOW_STATES = {
  INITIATED: 'initiated',
  GATHERING_INFO: 'gathering_info', 
  CONFIRMATION: 'confirmation',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

/**
 * Workflow Types for Different Interactive Processes
 */
export const WORKFLOW_TYPES = {
  INCIDENT_REPORT: 'incident_report_generation',
  MALWARE_ANALYSIS: 'malware_analysis',
  THREAT_INVESTIGATION: 'threat_investigation',
  SECURITY_ASSESSMENT: 'security_assessment'
} as const;

interface WorkflowData {
  id: string;
  type: string;
  state: string;
  startedAt: Date;
  currentStep: number;
  totalSteps: number;
  data: any;
  requiredInfo: Record<string, any>;
  gatheredInfo: Record<string, any>;
  pendingQuestions: any[];
}

interface InteractiveIntent {
  requiresInteraction: boolean;
  workflowType?: string;
  confidence?: number;
}

interface WorkflowStep {
  name: string;
  description: string;
}

interface RequiredInfoItem {
  required: boolean;
  prompt: string;
  type: string;
  options?: string[];
  searchable?: boolean;
  default?: string;
}

interface MissingInfoItem {
  key: string;
  prompt: string;
  type: string;
  options?: string[];
  searchable?: boolean;
}

interface Question {
  key: string;
  prompt: string;
  type: string;
  options?: string[] | undefined;
  searchResults?: any[];
  formattedPrompt?: string;
}

interface IncidentInfo {
  id: number;
  incidentId: string;
  title: string;
  severity: string;
  status: string;
  category: string;
  date: string;
}

export class ConversationalIntelligenceService {
  private activeWorkflows: Map<string, WorkflowData>;
  private contextMemory: Map<string, any>;

  constructor() {
    this.activeWorkflows = new Map();
    this.contextMemory = new Map();
  }

  /**
   * Detect if user query requires interactive workflow
   */
  detectInteractiveIntent(query: string, conversationId: string): InteractiveIntent {
    const patterns: Record<string, RegExp[]> = {
      [WORKFLOW_TYPES.INCIDENT_REPORT]: [
        /\b(generate|create|build|write)\s+(incident\s+)?report\b/i,
        /\b(incident|security)\s+(report|documentation|summary)\b/i,
        /\breport\s+(for|about|on)\s+(incident|attack|breach)\b/i
      ],
      [WORKFLOW_TYPES.MALWARE_ANALYSIS]: [
        /\b(analyze|investigate|examine)\s+(malware|virus|trojan|ransomware)\b/i,
        /\b(malware|ransomware|trojan)\s+(analysis|investigation|incident)\b/i,
        /\b(similar|related)\s+(malware|attack)\s+(incidents?|patterns?)\b/i
      ],
      [WORKFLOW_TYPES.THREAT_INVESTIGATION]: [
        /\b(investigate|analyze|examine)\s+(threat|attack|breach)\b/i,
        /\b(threat|security)\s+(analysis|investigation|assessment)\b/i,
        /\bfind\s+(similar|related)\s+(threats?|incidents?|attacks?)\b/i
      ]
    };

    for (const [workflowType, regexes] of Object.entries(patterns)) {
      if (regexes.some(regex => regex.test(query))) {
        return {
          requiresInteraction: true,
          workflowType,
          confidence: 0.8
        };
      }
    }

    return { requiresInteraction: false };
  }

  /**
   * Initialize new interactive workflow
   */
  async initializeWorkflow(conversationId: string, workflowType: string, initialData: any = {}): Promise<WorkflowData> {
    const workflow: WorkflowData = {
      id: `workflow_${Date.now()}`,
      type: workflowType,
      state: WORKFLOW_STATES.INITIATED,
      startedAt: new Date(),
      currentStep: 0,
      totalSteps: this.getWorkflowSteps(workflowType).length,
      data: initialData,
      requiredInfo: this.getRequiredInfo(workflowType),
      gatheredInfo: {},
      pendingQuestions: []
    };

    this.activeWorkflows.set(conversationId, workflow);
    return workflow;
  }

  /**
   * Get required information for workflow type
   */
  getRequiredInfo(workflowType: string): Record<string, RequiredInfoItem> {
    const requirements: Record<string, Record<string, RequiredInfoItem>> = {
      [WORKFLOW_TYPES.INCIDENT_REPORT]: {
        incidentId: {
          required: true,
          prompt: "Which incident would you like me to create a report for?",
          type: "selection",
          searchable: true
        },
        reportType: {
          required: true,
          prompt: "What type of report do you need?",
          type: "selection",
          options: ["executive", "technical", "forensic", "compliance"]
        },
        businessImpact: {
          required: false,
          prompt: "What was the business impact of this incident?",
          type: "text"
        },
        remediationSteps: {
          required: false,
          prompt: "What remediation steps were taken?",
          type: "text"
        },
        lessonsLearned: {
          required: false,
          prompt: "What lessons were learned and preventive measures implemented?",
          type: "text"
        }
      },
      [WORKFLOW_TYPES.MALWARE_ANALYSIS]: {
        timeRange: {
          required: false,
          prompt: "What time range should I analyze?",
          type: "selection",
          options: ["24h", "7d", "30d", "90d"],
          default: "30d"
        },
        malwareType: {
          required: false,
          prompt: "What type of malware are you interested in?",
          type: "selection",
          options: ["all", "ransomware", "trojan", "virus", "rootkit", "spyware"]
        },
        analysisType: {
          required: true,
          prompt: "What kind of analysis would you like?",
          type: "selection",
          options: ["pattern_analysis", "ioc_correlation", "impact_assessment", "trend_analysis"]
        }
      }
    };

    return requirements[workflowType] || {};
  }

  /**
   * Get workflow steps for different types
   */
  getWorkflowSteps(workflowType: string): WorkflowStep[] {
    const steps: Record<string, WorkflowStep[]> = {
      [WORKFLOW_TYPES.INCIDENT_REPORT]: [
        { name: 'identify_incident', description: 'Identify target incident' },
        { name: 'gather_requirements', description: 'Gather report requirements' },
        { name: 'collect_data', description: 'Collect incident data' },
        { name: 'generate_report', description: 'Generate comprehensive report' }
      ],
      [WORKFLOW_TYPES.MALWARE_ANALYSIS]: [
        { name: 'define_scope', description: 'Define analysis scope' },
        { name: 'search_incidents', description: 'Search related incidents' },
        { name: 'analyze_patterns', description: 'Analyze attack patterns' },
        { name: 'generate_insights', description: 'Generate insights and recommendations' }
      ]
    };

    return steps[workflowType] || [];
  }

  /**
   * Analyze missing information for current workflow
   */
  analyzeMissingInfo(conversationId: string): MissingInfoItem[] | null {
    const workflow = this.activeWorkflows.get(conversationId);
    if (!workflow) return null;

    const required = workflow.requiredInfo;
    const gathered = workflow.gatheredInfo;
    const missing: MissingInfoItem[] = [];

    for (const [key, info] of Object.entries(required)) {
      if (info.required && !gathered[key]) {
        missing.push({
          key,
          prompt: info.prompt,
          type: info.type,
          options: info.options,
          searchable: info.searchable
        });
      }
    }

    return missing;
  }

  /**
   * Generate contextual questions for missing information
   */
  async generateQuestions(conversationId: string, organizationId: string): Promise<Question[]> {
    const workflow = this.activeWorkflows.get(conversationId);
    if (!workflow) return [];

    const missing = this.analyzeMissingInfo(conversationId);
    if (!missing) return [];

    const questions: Question[] = [];

    for (const item of missing) {
      let question: Question = {
        key: item.key,
        prompt: item.prompt,
        type: item.type,
        options: item.options
      };

      // If searchable, add search results
      if (item.searchable && item.key === 'incidentId') {
        const incidents = await this.searchRecentIncidents(organizationId);
        question.searchResults = incidents;
        question.formattedPrompt = this.formatIncidentSelectionPrompt(incidents);
      }

      questions.push(question);
    }

    return questions;
  }

  /**
   * Search for recent incidents for selection
   */
  async searchRecentIncidents(organizationId: string, limit: number = 10): Promise<IncidentInfo[]> {
    try {
      const { Incident } = models as any;
      const incidents = await Incident.findAll({
        where: {
          organizationId,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        order: [['createdAt', 'DESC']],
        limit,
        attributes: ['id', 'incidentId', 'title', 'severity', 'status', 'category', 'createdAt']
      });

      return incidents.map((inc: any) => ({
        id: inc.id,
        incidentId: inc.incidentId,
        title: inc.title,
        severity: inc.severity,
        status: inc.status,
        category: inc.category,
        date: inc.createdAt.toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error('Error searching incidents:', error);
      return [];
    }
  }

  /**
   * Format incident selection prompt
   */
  formatIncidentSelectionPrompt(incidents: IncidentInfo[]): string {
    if (incidents.length === 0) {
      return "I couldn't find any recent incidents. Please provide an incident ID or create a new incident first.";
    }

    let prompt = "I found several recent incidents. Which one would you like me to create a report for?\n\n";
    
    incidents.forEach((inc, index) => {
      const severityIcon = this.getSeverityIcon(inc.severity);
      prompt += `${index + 1}. **${inc.incidentId}** ${severityIcon} ${inc.title}\n`;
      prompt += `   📅 ${inc.date} | 📊 ${inc.status} | 🏷️ ${inc.category}\n\n`;
    });

    prompt += "Please tell me the incident number (1, 2, 3...) or incident ID you'd like to use.";
    return prompt;
  }

  /**
   * Get severity icon for display
   */
  getSeverityIcon(severity: string): string {
    const icons: Record<string, string> = {
      critical: '🚨',
      high: '⚠️',
      medium: '📋',
      low: '📝'
    };
    return icons[severity] || '📋';
  }

  /**
   * Process user response and update workflow
   */
  async processUserResponse(conversationId: string, userInput: string, organizationId: string): Promise<any> {
    const workflow = this.activeWorkflows.get(conversationId);
    if (!workflow) return null;

    const missing = this.analyzeMissingInfo(conversationId);
    if (!missing || missing.length === 0) {
      return { readyToExecute: true, workflow };
    }

    // Process the first missing item
    const currentItem = missing[0];
    if (!currentItem) return null;
    
    const processedValue = await this.processInputValue(currentItem, userInput, organizationId);
    
    if (processedValue) {
      workflow.gatheredInfo[currentItem.key] = processedValue;
      workflow.state = WORKFLOW_STATES.GATHERING_INFO;
      
      // Check if we have all required info
      const stillMissing = this.analyzeMissingInfo(conversationId);
      if (!stillMissing || stillMissing.length === 0) {
        workflow.state = WORKFLOW_STATES.CONFIRMATION;
        return { readyToExecute: true, workflow };
      }
    }

    return { continueGathering: true, workflow, processedValue };
  }

  /**
   * Process specific input value based on type
   */
  async processInputValue(item: MissingInfoItem, userInput: string, organizationId: string): Promise<any> {
    switch (item.type) {
      case 'selection':
        if (item.key === 'incidentId') {
          return await this.processIncidentSelection(userInput, organizationId);
        }
        return this.processSelectionInput(userInput, item.options);
      
      case 'text':
        return userInput.trim();
        
      default:
        return userInput.trim();
    }
  }

  /**
   * Process incident selection from user input
   */
  async processIncidentSelection(userInput: string, organizationId: string): Promise<any> {
    // Check if input is a number (incident list selection)
    const listSelection = parseInt(userInput);
    if (!isNaN(listSelection)) {
      const incidents = await this.searchRecentIncidents(organizationId);
      if (listSelection >= 1 && listSelection <= incidents.length) {
        return incidents[listSelection - 1];
      }
    }

    // Check if input is an incident ID
    const incidentIdMatch = userInput.match(/\b([A-Z]{2,4}-\d{3,6})\b/i);
    if (incidentIdMatch && incidentIdMatch[1]) {
      const { Incident } = models as any;
      const incident = await Incident.findOne({
        where: { 
          incidentId: incidentIdMatch[1].toUpperCase(),
          organizationId 
        }
      });
      
      if (incident) {
        return {
          id: incident.id,
          incidentId: incident.incidentId,
          title: incident.title,
          severity: incident.severity,
          status: incident.status,
          category: incident.category
        };
      }
    }

    return null; // Invalid selection
  }

  /**
   * Process selection input against options
   */
  processSelectionInput(userInput: string, options?: string[]): string | null {
    if (!options) return userInput;
    
    const lowerInput = userInput.toLowerCase();
    const match = options.find(option => 
      option.toLowerCase() === lowerInput || 
      option.toLowerCase().includes(lowerInput)
    );
    
    return match || null;
  }

  /**
   * Generate workflow summary for confirmation
   */
  generateWorkflowSummary(workflow: WorkflowData): string {
    const steps = this.getWorkflowSteps(workflow.type);
    let summary = `**${workflow.type.replace(/_/g, ' ').toUpperCase()} WORKFLOW**\n\n`;
    
    summary += "📋 **Gathered Information:**\n";
    for (const [key, value] of Object.entries(workflow.gatheredInfo)) {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      if (typeof value === 'object' && value && 'incidentId' in value) {
        summary += `• ${label}: ${value.incidentId} - ${value.title}\n`;
      } else {
        summary += `• ${label}: ${value}\n`;
      }
    }

    summary += `\n🚀 **Next Steps:**\n`;
    steps.forEach((step, index) => {
      const icon = index < workflow.currentStep ? '✅' : index === workflow.currentStep ? '🔄' : '⏳';
      summary += `${icon} ${step.description}\n`;
    });

    summary += `\n**Proceed with this workflow?** (yes/no)`;
    
    return summary;
  }

  /**
   * Clear workflow for conversation
   */
  clearWorkflow(conversationId: string): void {
    this.activeWorkflows.delete(conversationId);
    this.contextMemory.delete(conversationId);
  }

  /**
   * Get active workflow for conversation
   */
  getWorkflow(conversationId: string): WorkflowData | undefined {
    return this.activeWorkflows.get(conversationId);
  }
}

// Export singleton instance
export const conversationalIntelligenceService = new ConversationalIntelligenceService();
export default conversationalIntelligenceService;