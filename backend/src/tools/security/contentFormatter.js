/**
 * Content Formatter Utility for AI-Generated Objects
 * Converts structured AI responses into human-readable text for display
 */

class ContentFormatter {
  /**
   * Format impact assessment object into readable text
   */
  static formatImpactAssessment(impactData) {
    if (!impactData || typeof impactData !== 'object') {
      return typeof impactData === 'string' ? impactData : 'No impact assessment available.';
    }

    // If it's already a formatted string, return it
    if (typeof impactData === 'string' && impactData.includes('**')) {
      return impactData;
    }

    let formattedText = '';

    // Executive Summary
    if (impactData.executiveSummary) {
      formattedText += `**Executive Summary**\n${impactData.executiveSummary}\n\n`;
    }

    // Technical Impact
    if (impactData.technicalImpact) {
      formattedText += `**Technical Impact**\n`;
      const tech = impactData.technicalImpact;
      
      if (tech.affectedSystems && tech.affectedSystems.length > 0) {
        formattedText += `• Affected Systems: ${tech.affectedSystems.join(', ')}\n`;
      }
      if (tech.serviceDisruption) {
        formattedText += `• Service Disruption: ${tech.serviceDisruption}\n`;
      }
      if (tech.dataImpact) {
        formattedText += `• Data Impact: ${tech.dataImpact}\n`;
      }
      if (tech.systemAvailability) {
        formattedText += `• System Availability: ${tech.systemAvailability}\n`;
      }
      if (tech.performanceImpact) {
        formattedText += `• Performance Impact: ${tech.performanceImpact}\n`;
      }
      formattedText += '\n';
    }

    // Business Impact
    if (impactData.businessImpact) {
      formattedText += `**Business Impact**\n`;
      const business = impactData.businessImpact;
      
      if (business.operationalImpact) {
        formattedText += `• Operational Impact: ${business.operationalImpact}\n`;
      }
      if (business.customerImpact) {
        formattedText += `• Customer Impact: ${business.customerImpact}\n`;
      }
      if (business.productivityImpact) {
        formattedText += `• Productivity Impact: ${business.productivityImpact}\n`;
      }
      if (business.reputationalImpact) {
        formattedText += `• Reputational Impact: ${business.reputationalImpact}\n`;
      }
      if (business.competitiveImpact) {
        formattedText += `• Competitive Impact: ${business.competitiveImpact}\n`;
      }
      formattedText += '\n';
    }

    // Financial Impact
    if (impactData.financialImpact) {
      formattedText += `**Financial Impact**\n`;
      const financial = impactData.financialImpact;
      
      if (financial.immediateCosts) {
        formattedText += `Immediate Costs:\n`;
        Object.entries(financial.immediateCosts).forEach(([key, value]) => {
          if (value) {
            formattedText += `  • ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}\n`;
          }
        });
      }
      
      if (financial.projectedCosts) {
        formattedText += `Projected Costs:\n`;
        Object.entries(financial.projectedCosts).forEach(([key, value]) => {
          if (value) {
            formattedText += `  • ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}\n`;
          }
        });
      }
      
      if (financial.totalEstimatedImpact) {
        formattedText += `• Total Estimated Impact: ${financial.totalEstimatedImpact}\n`;
      }
      formattedText += '\n';
    }

    // Regulatory Impact
    if (impactData.regulatoryImpact) {
      formattedText += `**Regulatory Impact**\n`;
      const regulatory = impactData.regulatoryImpact;
      
      if (regulatory.complianceViolations && regulatory.complianceViolations.length > 0) {
        formattedText += `• Compliance Violations: ${regulatory.complianceViolations.join(', ')}\n`;
      }
      if (regulatory.reportingRequirements && regulatory.reportingRequirements.length > 0) {
        formattedText += `• Reporting Requirements: ${regulatory.reportingRequirements.join(', ')}\n`;
      }
      if (regulatory.potentialPenalties) {
        formattedText += `• Potential Penalties: ${regulatory.potentialPenalties}\n`;
      }
      formattedText += '\n';
    }

    // Recovery Assessment
    if (impactData.recoveryAssessment) {
      formattedText += `**Recovery Assessment**\n`;
      const recovery = impactData.recoveryAssessment;
      
      if (recovery.recoveryTimeEstimate) {
        formattedText += `• Recovery Time Estimate: ${recovery.recoveryTimeEstimate}\n`;
      }
      if (recovery.recoveryComplexity) {
        formattedText += `• Recovery Complexity: ${recovery.recoveryComplexity}\n`;
      }
      if (recovery.criticalDependencies && recovery.criticalDependencies.length > 0) {
        formattedText += `• Critical Dependencies: ${recovery.criticalDependencies.join(', ')}\n`;
      }
    }

    return formattedText.trim() || 'Impact assessment completed - detailed data available in structured format.';
  }

  /**
   * Format investigation plan object into readable text
   */
  static formatInvestigationPlan(planData) {
    if (!planData || typeof planData !== 'object') {
      return typeof planData === 'string' ? planData : 'No investigation plan available.';
    }

    let formattedText = '';

    // Investigation Objectives
    if (planData.investigationObjectives) {
      formattedText += `**Investigation Objectives**\n`;
      const objectives = planData.investigationObjectives;
      
      if (objectives.primaryObjectives && objectives.primaryObjectives.length > 0) {
        formattedText += `Primary Objectives:\n`;
        objectives.primaryObjectives.forEach(obj => {
          formattedText += `• ${obj}\n`;
        });
      }
      
      if (objectives.scopeDefinition) {
        formattedText += `\nScope: ${objectives.scopeDefinition}\n`;
      }
      
      if (objectives.successCriteria && objectives.successCriteria.length > 0) {
        formattedText += `\nSuccess Criteria:\n`;
        objectives.successCriteria.forEach(criteria => {
          formattedText += `• ${criteria}\n`;
        });
      }
      formattedText += '\n';
    }

    // Evidence Management
    if (planData.evidenceManagement) {
      formattedText += `**Evidence Management**\n`;
      const evidence = planData.evidenceManagement;
      
      if (evidence.evidenceTypes && evidence.evidenceTypes.length > 0) {
        formattedText += `Evidence Types: ${evidence.evidenceTypes.join(', ')}\n`;
      }
      
      if (evidence.storageRequirements) {
        formattedText += `Storage Requirements: ${evidence.storageRequirements}\n`;
      }
      
      if (evidence.legalConsiderations) {
        formattedText += `Legal Considerations: ${evidence.legalConsiderations}\n`;
      }
      formattedText += '\n';
    }

    // Investigation Timeline
    if (planData.investigationTimeline) {
      formattedText += `**Investigation Timeline**\n`;
      const timeline = planData.investigationTimeline;
      
      if (timeline.totalEstimatedDuration) {
        formattedText += `Total Duration: ${timeline.totalEstimatedDuration}\n`;
      }
      
      // Phase durations
      ['phase1_duration', 'phase2_duration', 'phase3_duration', 'phase4_duration'].forEach((phase, index) => {
        if (timeline[phase]) {
          const phaseName = ['Preparation', 'Collection', 'Analysis', 'Reporting'][index];
          formattedText += `• ${phaseName} Phase: ${timeline[phase]}\n`;
        }
      });
      
      if (timeline.keyMilestones && timeline.keyMilestones.length > 0) {
        formattedText += `\nKey Milestones:\n`;
        timeline.keyMilestones.forEach(milestone => {
          formattedText += `• ${milestone.milestone} (${milestone.targetDate})\n`;
        });
      }
      formattedText += '\n';
    }

    // Resource Requirements
    if (planData.resourceRequirements) {
      formattedText += `**Resource Requirements**\n`;
      const resources = planData.resourceRequirements;
      
      if (resources.personnel && resources.personnel.length > 0) {
        formattedText += `Personnel:\n`;
        resources.personnel.forEach(person => {
          formattedText += `• ${person.role}: ${person.responsibilities}\n`;
        });
      }
      
      if (resources.tools && resources.tools.length > 0) {
        formattedText += `Tools: ${resources.tools.join(', ')}\n`;
      }
    }

    return formattedText.trim() || 'Investigation plan completed - detailed methodology available in structured format.';
  }

  /**
   * Format containment strategy object into readable text
   */
  static formatContainmentStrategy(strategyData) {
    if (!strategyData || typeof strategyData !== 'object') {
      return typeof strategyData === 'string' ? strategyData : 'No containment strategy available.';
    }

    let formattedText = '';

    // Immediate Actions
    if (strategyData.immediateActions) {
      formattedText += `**Immediate Actions**\n`;
      if (Array.isArray(strategyData.immediateActions)) {
        strategyData.immediateActions.forEach(action => {
          formattedText += `• ${action}\n`;
        });
      } else if (typeof strategyData.immediateActions === 'string') {
        formattedText += `${strategyData.immediateActions}\n`;
      }
      formattedText += '\n';
    }

    // Containment Steps
    if (strategyData.containmentSteps) {
      formattedText += `**Containment Steps**\n`;
      if (Array.isArray(strategyData.containmentSteps)) {
        strategyData.containmentSteps.forEach((step, index) => {
          formattedText += `${index + 1}. ${step}\n`;
        });
      } else if (typeof strategyData.containmentSteps === 'string') {
        formattedText += `${strategyData.containmentSteps}\n`;
      }
      formattedText += '\n';
    }

    // Recovery Actions
    if (strategyData.recoveryActions) {
      formattedText += `**Recovery Actions**\n`;
      if (Array.isArray(strategyData.recoveryActions)) {
        strategyData.recoveryActions.forEach(action => {
          formattedText += `• ${action}\n`;
        });
      } else if (typeof strategyData.recoveryActions === 'string') {
        formattedText += `${strategyData.recoveryActions}\n`;
      }
      formattedText += '\n';
    }

    // Prevention Measures
    if (strategyData.preventionMeasures) {
      formattedText += `**Prevention Measures**\n`;
      if (Array.isArray(strategyData.preventionMeasures)) {
        strategyData.preventionMeasures.forEach(measure => {
          formattedText += `• ${measure}\n`;
        });
      } else if (typeof strategyData.preventionMeasures === 'string') {
        formattedText += `${strategyData.preventionMeasures}\n`;
      }
    }

    return formattedText.trim() || 'Containment strategy completed - detailed procedures available in structured format.';
  }

  /**
   * Format estimated timeline object into readable text
   */
  static formatEstimatedTimeline(timelineData) {
    if (!timelineData || typeof timelineData !== 'object') {
      return typeof timelineData === 'string' ? timelineData : 'No timeline estimate available.';
    }

    let formattedText = '';

    // Overall Timeline
    if (timelineData.overallTimeline) {
      formattedText += `**Overall Timeline**\n`;
      if (timelineData.overallTimeline.totalDuration) {
        formattedText += `Total Duration: ${timelineData.overallTimeline.totalDuration}\n`;
      }
      if (timelineData.overallTimeline.complexity) {
        formattedText += `Complexity: ${timelineData.overallTimeline.complexity}\n`;
      }
      formattedText += '\n';
    }

    // Phase Breakdown
    if (timelineData.phases) {
      formattedText += `**Phase Breakdown**\n`;
      if (Array.isArray(timelineData.phases)) {
        timelineData.phases.forEach(phase => {
          formattedText += `• ${phase.name}: ${phase.duration} - ${phase.description}\n`;
        });
      } else {
        Object.entries(timelineData.phases).forEach(([phaseName, phaseInfo]) => {
          if (typeof phaseInfo === 'object' && phaseInfo.duration) {
            formattedText += `• ${phaseName}: ${phaseInfo.duration}\n`;
          } else if (typeof phaseInfo === 'string') {
            formattedText += `• ${phaseName}: ${phaseInfo}\n`;
          }
        });
      }
      formattedText += '\n';
    }

    // Milestones
    if (timelineData.keyMilestones) {
      formattedText += `**Key Milestones**\n`;
      if (Array.isArray(timelineData.keyMilestones)) {
        timelineData.keyMilestones.forEach(milestone => {
          formattedText += `• ${milestone.milestone || milestone.name}: ${milestone.timeframe || milestone.targetDate}\n`;
        });
      }
      formattedText += '\n';
    }

    // Critical Path
    if (timelineData.criticalPath) {
      formattedText += `**Critical Path**\n`;
      if (Array.isArray(timelineData.criticalPath)) {
        timelineData.criticalPath.forEach(item => {
          formattedText += `• ${item}\n`;
        });
      } else if (typeof timelineData.criticalPath === 'string') {
        formattedText += `${timelineData.criticalPath}\n`;
      }
    }

    return formattedText.trim() || 'Timeline estimation completed - detailed scheduling available in structured format.';
  }

  /**
   * Generic formatter for unknown object structures
   */
  static formatGenericObject(data) {
    if (!data || typeof data !== 'object') {
      return typeof data === 'string' ? data : 'No data available.';
    }

    let formattedText = '';
    
    const formatValue = (value) => {
      if (Array.isArray(value)) {
        return value.join(', ');
      } else if (typeof value === 'object' && value !== null) {
        return Object.entries(value)
          .map(([k, v]) => `${k}: ${formatValue(v)}`)
          .join('; ');
      } else {
        return String(value);
      }
    };

    Object.entries(data).forEach(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      formattedText += `**${formattedKey}**\n${formatValue(value)}\n\n`;
    });

    return formattedText.trim() || 'Data available in structured format.';
  }
}

module.exports = ContentFormatter;