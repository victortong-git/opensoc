const { models, sequelize } = require('../database/models');
const { Op } = require('sequelize');
const aiGenerationService = require('./aiGenerationService');
const aiAgentLogService = require('./aiAgentLogService');

/**
 * AI Log Event Security Analyst Service
 * Analyzes log lines in batches for security threats and creates alerts
 */

// AI Log Event Security Analyst configuration
const SECURITY_ANALYST_AGENT = {
  name: 'AI Log Event Security Analyst',
  bio: 'I specialize in analyzing log entries for security threats and anomalies. I can detect various attack patterns, unauthorized access attempts, malware activity, and other security incidents in log data.',
  specialties: ['Log Analysis', 'Threat Detection', 'Security Pattern Recognition', 'Anomaly Detection', 'Alert Generation'],
  profileImageUrl: '/images/agents/security-analyst-avatar.png',
  taskTypes: ['analyze log security', 'detect threats', 'generate security alerts']
};

/**
 * Security analysis prompt template for AI batch processing
 */
const SECURITY_ANALYSIS_PROMPT = `You are an expert cybersecurity analyst specializing in log analysis. Analyze the following batch of log entries for security threats and anomalies. Consider patterns across multiple entries and analyze each entry individually.

Look for these types of security issues:
- Authentication failures and brute force attacks
- Suspicious network activity and port scans
- Malware indicators and suspicious processes
- Privilege escalation attempts
- Data exfiltration patterns
- SQL injection attempts
- Cross-site scripting (XSS) attacks
- Command injection attempts
- Anomalous user behavior
- Failed access attempts
- Suspicious file operations
- Network intrusion attempts
- DDoS attack patterns
- Unauthorized system modifications

Log entries to analyze (up to 10 entries):
{logEntries}

Analyze each log entry and look for patterns across entries. Respond with ONLY a valid JSON object in this exact format:
{
  "batchAnalysis": {
    "overallThreatLevel": "none" | "low" | "medium" | "high" | "critical",
    "patterns": ["description of any patterns found across multiple entries"],
    "summary": "brief summary of the batch analysis"
  },
  "individualResults": [
    {
      "logLineId": "the ID of the log line",
      "hasSecurityIssue": boolean,
      "severity": "low" | "medium" | "high" | "critical",
      "issueType": "string describing the type of security issue",
      "description": "detailed explanation of the security issue and why it's concerning",
      "recommendedActions": ["action1", "action2"],
      "confidence": number (0-100),
      "indicators": ["specific indicators that suggest this is a security issue"]
    }
  ]
}

For entries with no security issues, set hasSecurityIssue to false and omit other fields except logLineId and confidence.`;

/**
 * Analyze log lines for security issues in batches
 */
const analyzeLogSecurity = async (fileId, organizationId, userId, batchSize = 50) => {
  const startTime = Date.now();
  let analysisResults = {
    totalAnalyzed: 0,
    securityIssuesFound: 0,
    alertsCreated: 0,
    errors: [],
    batchStats: []
  };

  try {
    // Log the start of analysis activity
    const activityLogStart = await aiAgentLogService.logAgentActivity({
      agentName: SECURITY_ANALYST_AGENT.name,
      taskName: 'analyze log security',
      description: `Starting security analysis for file ${fileId}, batch size: ${batchSize}`,
      success: false, // Will update this later
      userId,
      organizationId,
      metadata: {
        fileId,
        batchSize,
        phase: 'initialization'
      }
    });

    // Get unanalyzed log lines for this file
    const unanalyzedLines = await models.TmpLogFileLines.findAll({
      where: {
        logFileMetaId: fileId,
        securityAnalyzed: false
      },
      limit: batchSize,
      order: [['lineNumber', 'ASC']],
      include: [{
        model: models.TmpLogFileMeta,
        as: 'logFileMeta',
        where: { organizationId }
      }]
    });

    if (unanalyzedLines.length === 0) {
      await activityLogStart.update({
        success: true,
        description: `No unanalyzed log lines found for file ${fileId}`,
        executionTimeMs: Date.now() - startTime
      });
      return analysisResults;
    }

    // Process lines in smaller sub-batches to avoid overwhelming the AI
    const subBatchSize = 10;
    for (let i = 0; i < unanalyzedLines.length; i += subBatchSize) {
      const subBatch = unanalyzedLines.slice(i, i + subBatchSize);
      const subBatchResults = await processLogLinesBatch(subBatch, userId, organizationId);
      
      analysisResults.totalAnalyzed += subBatchResults.analyzed;
      analysisResults.securityIssuesFound += subBatchResults.issuesFound;
      analysisResults.alertsCreated += subBatchResults.alertsCreated;
      analysisResults.errors.push(...subBatchResults.errors);
      analysisResults.batchStats.push(subBatchResults);
    }

    // Update the activity log with final results
    await activityLogStart.update({
      success: analysisResults.errors.length === 0,
      description: `Completed security analysis: ${analysisResults.totalAnalyzed} lines analyzed, ${analysisResults.securityIssuesFound} security issues found, ${analysisResults.alertsCreated} alerts created`,
      executionTimeMs: Date.now() - startTime,
      metadata: {
        fileId,
        batchSize,
        results: analysisResults,
        phase: 'completed'
      }
    });

    return analysisResults;

  } catch (error) {
    console.error('Error in analyzeLogSecurity:', error);
    
    // Log the error
    await aiAgentLogService.logAgentActivity({
      agentName: SECURITY_ANALYST_AGENT.name,
      taskName: 'analyze log security',
      description: `Failed to analyze log security for file ${fileId}`,
      success: false,
      errorMessage: error.message,
      userId,
      organizationId,
      executionTimeMs: Date.now() - startTime,
      metadata: {
        fileId,
        batchSize,
        error: error.message,
        phase: 'error'
      }
    });

    throw error;
  }
};

/**
 * Process a batch of log lines for security analysis (sends all lines in one AI request)
 */
const processLogLinesBatch = async (logLines, userId, organizationId) => {
  const startTime = Date.now();
  let batchResults = {
    analyzed: 0,
    issuesFound: 0,
    alertsCreated: 0,
    errors: []
  };

  if (logLines.length === 0) {
    return batchResults;
  }

  try {
    // Prepare log entries for batch analysis
    const logEntries = logLines.map(line => ({
      id: line.id,
      lineNumber: line.lineNumber,
      content: line.content,
      parsedData: line.parsedData || {}
    }));

    // Create the batch prompt
    const logEntriesText = logEntries.map(entry => 
      `Log Line ID: ${entry.id}\nLine Number: ${entry.lineNumber}\nContent: ${entry.content}\nParsed Data: ${JSON.stringify(entry.parsedData, null, 2)}\n---`
    ).join('\n');

    const prompt = SECURITY_ANALYSIS_PROMPT.replace('{logEntries}', logEntriesText);

    // Get AI analysis for the entire batch
    const aiResult = await aiGenerationService.generateTestResponse({
      prompt,
      organizationId,
      model: null, // Use the configured model from AI provider
      maxTokens: 3000, // Increased for batch analysis
      temperature: 0.1 // Low temperature for consistent analysis
    });
    const aiResponse = aiResult.response || aiResult.content;

    // Parse the AI response
    let batchAnalysisResult;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        batchAnalysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      throw new Error(`Failed to parse AI response: ${parseError.message}. Response: ${aiResponse}`);
    }

    // Validate the batch analysis result
    if (!batchAnalysisResult.individualResults || !Array.isArray(batchAnalysisResult.individualResults)) {
      throw new Error('Invalid AI response: individualResults must be an array');
    }

    // Process individual results and update database
    for (const logLine of logLines) {
      try {
        const individualResult = batchAnalysisResult.individualResults.find(r => r.logLineId === logLine.id);
        
        if (!individualResult) {
          batchResults.errors.push({
            logLineId: logLine.id,
            lineNumber: logLine.lineNumber,
            error: 'No analysis result found for this log line'
          });
          continue;
        }

        // Prepare update data
        const updateData = {
          securityAnalyzed: true,
          aiAnalysisTimestamp: new Date(),
          hasSecurityIssue: individualResult.hasSecurityIssue || false,
          aiAnalysisMetadata: {
            aiResponse: individualResult,
            batchAnalysis: batchAnalysisResult.batchAnalysis,
            tokenUsage: aiResult.tokenUsage || {},
            executionTimeMs: Date.now() - startTime,
            analysisVersion: '2.0' // Updated version for batch analysis
          }
        };

        let alertId = null;
        
        // If security issue detected, update additional fields and potentially create alert
        if (individualResult.hasSecurityIssue) {
          updateData.securityIssueDescription = individualResult.description || 'Security issue detected';
          updateData.securityIssueSeverity = individualResult.severity || 'medium';
          updateData.securityIssueType = individualResult.issueType || 'unknown';

          // Create alert for medium/high/critical severity issues
          if (['medium', 'high', 'critical'].includes(individualResult.severity)) {
            alertId = await createSecurityAlert(logLine, individualResult, organizationId, batchAnalysisResult.batchAnalysis);
            updateData.createdAlertId = alertId;
          }

          batchResults.issuesFound++;
          if (alertId) {
            batchResults.alertsCreated++;
          }
        }

        // Update the log line with analysis results
        await logLine.update(updateData);
        batchResults.analyzed++;

        // Log the individual analysis activity
        await aiAgentLogService.logAgentActivity({
          agentName: SECURITY_ANALYST_AGENT.name,
          taskName: 'detect threats',
          description: individualResult.hasSecurityIssue 
            ? `Security issue detected in log line #${logLine.lineNumber}: ${individualResult.issueType} (${individualResult.severity})`
            : `Log line #${logLine.lineNumber} analyzed - no security issues detected`,
          success: true,
          userId,
          organizationId,
          inputTokens: (aiResult.tokenUsage?.promptTokens || 0) / logLines.length, // Distribute tokens across lines
          outputTokens: (aiResult.tokenUsage?.completionTokens || 0) / logLines.length,
          totalTokens: (aiResult.tokenUsage?.totalTokens || 0) / logLines.length,
          executionTimeMs: (Date.now() - startTime) / logLines.length, // Distribute time across lines
          metadata: {
            logLineId: logLine.id,
            lineNumber: logLine.lineNumber,
            hasSecurityIssue: individualResult.hasSecurityIssue,
            severity: individualResult.severity,
            issueType: individualResult.issueType,
            alertCreated: !!alertId,
            alertId,
            batchId: `batch_${startTime}`,
            batchSize: logLines.length
          }
        });

      } catch (error) {
        console.error(`Error processing analysis result for log line ${logLine.id}:`, error);
        
        // Mark as analyzed even if failed to avoid reprocessing
        await logLine.update({
          securityAnalyzed: true,
          aiAnalysisTimestamp: new Date(),
          hasSecurityIssue: false,
          aiAnalysisMetadata: {
            error: error.message,
            executionTimeMs: Date.now() - startTime,
            analysisVersion: '2.0'
          }
        });
        
        batchResults.errors.push({
          logLineId: logLine.id,
          lineNumber: logLine.lineNumber,
          error: error.message
        });
      }
    }

  } catch (error) {
    console.error('Error in batch analysis:', error);
    
    // Mark all lines as analyzed (failed) to avoid reprocessing
    for (const logLine of logLines) {
      try {
        await logLine.update({
          securityAnalyzed: true,
          aiAnalysisTimestamp: new Date(),
          hasSecurityIssue: false,
          aiAnalysisMetadata: {
            error: `Batch analysis failed: ${error.message}`,
            executionTimeMs: Date.now() - startTime,
            analysisVersion: '2.0'
          }
        });
      } catch (updateError) {
        console.error(`Failed to update log line ${logLine.id} after batch error:`, updateError);
      }
      
      batchResults.errors.push({
        logLineId: logLine.id,
        lineNumber: logLine.lineNumber,
        error: `Batch analysis failed: ${error.message}`
      });
    }
  }

  return batchResults;
};

// Function removed - now using batch processing in processLogLinesBatch

/**
 * Create a security alert for detected issues with batch analysis context
 */
const createSecurityAlert = async (logLine, analysisResult, organizationId, batchAnalysis = null) => {
  try {
    let description = `${analysisResult.description}\n\nDetected in log line #${logLine.lineNumber}: ${logLine.content}`;
    
    // Add batch analysis context if available
    if (batchAnalysis) {
      description += `\n\n** Batch Analysis Context **\n`;
      description += `Overall Threat Level: ${batchAnalysis.overallThreatLevel || 'unknown'}\n`;
      if (batchAnalysis.summary) {
        description += `Batch Summary: ${batchAnalysis.summary}\n`;
      }
      if (batchAnalysis.patterns && batchAnalysis.patterns.length > 0) {
        description += `Patterns Detected: ${batchAnalysis.patterns.join(', ')}\n`;
      }
    }

    const alert = await models.Alert.create({
      title: `Security Issue Detected: ${analysisResult.issueType}`,
      description,
      severity: getSeverityNumber(analysisResult.severity),
      status: 'new',
      sourceSystem: 'AI Log Security Analyst (Batch)',
      eventTime: new Date(),
      organizationId,
      securityEventType: mapIssueTypeToEventType(analysisResult.issueType),
      eventTags: analysisResult.indicators || [],
      rawData: {
        logLineId: logLine.id,
        logLineNumber: logLine.lineNumber,
        logContent: logLine.content,
        parsedData: logLine.parsedData,
        aiAnalysis: analysisResult,
        batchAnalysis: batchAnalysis,
        sourceFile: logLine.logFileMetaId,
        analysisMethod: 'batch_ai_analysis'
      },
      enrichmentData: {
        recommendedActions: analysisResult.recommendedActions || [],
        confidence: analysisResult.confidence || 0,
        detectionMethod: 'AI Batch Log Analysis',
        analysisTimestamp: new Date(),
        batchOverallThreatLevel: batchAnalysis?.overallThreatLevel,
        batchPatterns: batchAnalysis?.patterns || []
      }
    });

    return alert.id;
  } catch (error) {
    console.error('Failed to create security alert:', error);
    return null;
  }
};

/**
 * Convert severity string to number for Alert model
 */
const getSeverityNumber = (severityString) => {
  const severityMap = {
    'low': 2,
    'medium': 3,
    'high': 4,
    'critical': 5
  };
  return severityMap[severityString] || 3;
};

/**
 * Map issue type to security event type enum
 */
const mapIssueTypeToEventType = (issueType) => {
  const typeMap = {
    'brute_force': 'brute_force_attack',
    'authentication_failure': 'authentication_failure',
    'malware': 'malware_detection',
    'privilege_escalation': 'privilege_escalation',
    'data_exfiltration': 'data_exfiltration',
    'sql_injection': 'sql_injection',
    'xss': 'xss_attack',
    'network_intrusion': 'network_intrusion',
    'port_scan': 'port_scan',
    'ddos': 'ddos_attack',
    'suspicious_process': 'suspicious_process',
    'unauthorized_access': 'unauthorized_access'
  };
  
  return typeMap[issueType.toLowerCase()] || 'suspicious_activity';
};

/**
 * Get security analysis statistics for a file
 */
const getSecurityAnalysisStats = async (fileId, organizationId) => {
  try {
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as "totalLines",
        SUM(CASE WHEN security_analyzed = true THEN 1 ELSE 0 END) as "analyzedLines",
        SUM(CASE WHEN has_security_issue = true THEN 1 ELSE 0 END) as "securityIssues",
        SUM(CASE WHEN created_alert_id IS NOT NULL THEN 1 ELSE 0 END) as "alertsCreated"
      FROM tmp_log_file_lines l
      INNER JOIN tmp_log_file_meta m ON l.log_file_meta_id = m.id
      WHERE l.log_file_meta_id = :fileId AND m.organization_id = :organizationId
    `, {
      replacements: { fileId, organizationId },
      type: sequelize.QueryTypes.SELECT
    });

    const statsResult = stats || {};

    const severityStats = await sequelize.query(`
      SELECT 
        security_issue_severity as "securityIssueSeverity",
        COUNT(*) as "count"
      FROM tmp_log_file_lines l
      INNER JOIN tmp_log_file_meta m ON l.log_file_meta_id = m.id
      WHERE l.log_file_meta_id = :fileId 
        AND m.organization_id = :organizationId 
        AND l.has_security_issue = true
        AND l.security_issue_severity IS NOT NULL
      GROUP BY l.security_issue_severity
    `, {
      replacements: { fileId, organizationId },
      type: sequelize.QueryTypes.SELECT
    });

    const totalLines = parseInt(statsResult?.totalLines || 0);
    const analyzedLines = parseInt(statsResult?.analyzedLines || 0);
    const securityIssues = parseInt(statsResult?.securityIssues || 0);
    const alertsCreated = parseInt(statsResult?.alertsCreated || 0);
    
    // Build severity breakdown with proper default values
    const severityBreakdown = severityStats.reduce((acc, item) => {
      acc[item.securityIssueSeverity] = parseInt(item.count);
      return acc;
    }, {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    });
    
    // Ensure we have all severity levels represented
    if (!severityBreakdown.low) severityBreakdown.low = 0;
    if (!severityBreakdown.medium) severityBreakdown.medium = 0;
    if (!severityBreakdown.high) severityBreakdown.high = 0;
    if (!severityBreakdown.critical) severityBreakdown.critical = 0;

    return {
      totalLines,
      analyzedLines,
      securityIssues,
      alertsCreated,
      severityBreakdown,
      analysisProgress: totalLines > 0 
        ? Math.round((analyzedLines / totalLines) * 100 * 100) / 100 // Round to 2 decimal places
        : 0
    };
  } catch (error) {
    console.error('Error getting security analysis stats:', error);
    throw error;
  }
};

/**
 * Get security issues for a specific file with pagination
 */
const getSecurityIssues = async (fileId, organizationId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    severity = null,
    issueType = null
  } = options;

  const offset = (page - 1) * limit;
  const where = {
    logFileMetaId: fileId,
    hasSecurityIssue: true
  };

  if (severity) {
    where.securityIssueSeverity = severity;
  }

  if (issueType) {
    where.securityIssueType = issueType;
  }

  try {
    const { count, rows } = await models.TmpLogFileLines.findAndCountAll({
      where,
      include: [
        {
          model: models.TmpLogFileMeta,
          as: 'logFileMeta',
          where: { organizationId }
        },
        {
          model: models.Alert,
          as: 'securityAlert',
          required: false
        }
      ],
      order: [['lineNumber', 'ASC']],
      limit,
      offset
    });

    return {
      issues: rows,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Error getting security issues:', error);
    throw error;
  }
};

module.exports = {
  analyzeLogSecurity,
  getSecurityAnalysisStats,
  getSecurityIssues,
  processLogLinesBatch,
  SECURITY_ANALYST_AGENT
};