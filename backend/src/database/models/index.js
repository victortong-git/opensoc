const sequelize = require('./config/database');

// Import all models
const User = require('./User');
const Organization = require('./Organization');
const Asset = require('./Asset');
const Alert = require('./Alert');
const Incident = require('./Incident');
const TimelineEvent = require('./TimelineEvent');
const AlertTimelineEvent = require('./AlertTimelineEvent');
const SecurityEvent = require('./SecurityEvent');
const Notification = require('./Notification');
const NotificationPreference = require('./NotificationPreference');
const AIAgent = require('./AIAgent');
const Playbook = require('./Playbook');
const IOC = require('./IOC');
const SystemSettings = require('./SystemSettings');
const AlertRule = require('./AlertRule');
const ChatConversation = require('./ChatConversation');
const ChatMessage = require('./ChatMessage');
const AIGenerationLog = require('./AIGenerationLog');
const AIProvider = require('./AIProvider');
const ThreatActor = require('./ThreatActor');
const ThreatCampaign = require('./ThreatCampaign');
const ApiKey = require('./ApiKey');
const AIAgentLog = require('./AIAgentLog');
const AIAgentInteraction = require('./AIAgentInteraction');
const AILLMLog = require('./AILLMLog');
const AIAnalysisJob = require('./AIAnalysisJob');
const TmpLogFileMeta = require('./TmpLogFileMeta');
const TmpLogFileLines = require('./TmpLogFileLines');
const ThreatHuntingEvent = require('./ThreatHuntingEvent');
const ThreatHuntTTP = require('./ThreatHuntTTP');
const ThreatHuntReport = require('./ThreatHuntReport');
const MitreTactic = require('./MitreTactic');
const MitreTechnique = require('./MitreTechnique');
const MitreProcedure = require('./MitreProcedure');
const AIToolCallingLog = require('./AIToolCallingLog');
const AlertMitreAnalysis = require('./AlertMitreAnalysis');
const ThreatHuntMitreEnhancement = require('./ThreatHuntMitreEnhancement');
const AlertOrchestrationResult = require('./alertOrchestrationResult');

// Define associations
const defineAssociations = () => {
  // Organization associations
  Organization.hasMany(User, { foreignKey: 'organizationId', as: 'users' });
  Organization.hasMany(Asset, { foreignKey: 'organizationId', as: 'assets' });
  Organization.hasMany(Alert, { foreignKey: 'organizationId', as: 'alerts' });
  Organization.hasMany(Incident, { foreignKey: 'organizationId', as: 'incidents' });
  Organization.hasMany(SecurityEvent, { foreignKey: 'organizationId', as: 'securityEvents' });
  Organization.hasMany(Notification, { foreignKey: 'organizationId', as: 'notifications' });
  Organization.hasMany(NotificationPreference, { foreignKey: 'organizationId', as: 'notificationPreferences' });
  Organization.hasMany(AIAgent, { foreignKey: 'organizationId', as: 'aiAgents' });
  Organization.hasMany(Playbook, { foreignKey: 'organizationId', as: 'playbooks' });
  Organization.hasMany(IOC, { foreignKey: 'organizationId', as: 'iocs' });
  Organization.hasMany(SystemSettings, { foreignKey: 'organizationId', as: 'systemSettings' });
  Organization.hasMany(AlertRule, { foreignKey: 'organizationId', as: 'alertRules' });
  Organization.hasMany(ChatConversation, { foreignKey: 'organizationId', as: 'chatConversations' });
  Organization.hasMany(AIGenerationLog, { foreignKey: 'organizationId', as: 'aiGenerationLogs' });
  Organization.hasMany(AIProvider, { foreignKey: 'organizationId', as: 'aiProviders' });
  Organization.hasMany(ThreatActor, { foreignKey: 'organizationId', as: 'threatActors' });
  Organization.hasMany(ThreatCampaign, { foreignKey: 'organizationId', as: 'threatCampaigns' });
  Organization.hasMany(ApiKey, { foreignKey: 'organizationId', as: 'apiKeys' });
  Organization.hasMany(AIAgentLog, { foreignKey: 'organizationId', as: 'aiAgentLogs' });
  Organization.hasMany(AILLMLog, { foreignKey: 'organizationId', as: 'aiLlmLogs' });
  Organization.hasMany(ThreatHuntingEvent, { foreignKey: 'organizationId', as: 'threatHuntingEvents' });
  Organization.hasMany(MitreTactic, { foreignKey: 'organizationId', as: 'mitreTactics' });
  Organization.hasMany(MitreTechnique, { foreignKey: 'organizationId', as: 'mitreTechniques' });
  Organization.hasMany(MitreProcedure, { foreignKey: 'organizationId', as: 'mitreProcedures' });

  // User associations
  User.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  User.hasMany(Incident, { foreignKey: 'assignedTo', as: 'assignedIncidents' });
  User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
  User.hasMany(NotificationPreference, { foreignKey: 'userId', as: 'notificationPreferences' });
  User.hasMany(Playbook, { foreignKey: 'createdBy', as: 'createdPlaybooks' });
  User.hasMany(TimelineEvent, { foreignKey: 'userId', as: 'timelineEvents' });
  User.hasMany(AlertRule, { foreignKey: 'createdBy', as: 'createdAlertRules' });
  User.hasMany(ChatConversation, { foreignKey: 'userId', as: 'chatConversations' });
  User.hasMany(AIGenerationLog, { foreignKey: 'userId', as: 'aiGenerationLogs' });
  User.hasMany(ApiKey, { foreignKey: 'createdBy', as: 'createdApiKeys' });
  User.hasMany(AIAgentLog, { foreignKey: 'userId', as: 'aiAgentLogs' });
  User.hasMany(ThreatHuntingEvent, { foreignKey: 'hunterId', as: 'huntingEvents' });
  // User.hasMany(AIAgentInteraction, { foreignKey: 'userId', as: 'aiAgentInteractions' });

  // Asset associations
  Asset.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Asset.hasMany(Alert, { foreignKey: 'assetId', as: 'alerts' });
  Asset.hasMany(SecurityEvent, { foreignKey: 'assetId', as: 'securityEvents' });

  // Alert associations
  Alert.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Alert.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
  Alert.belongsTo(User, { foreignKey: 'reviewerUserId', as: 'reviewer' });
  Alert.hasMany(AlertTimelineEvent, { foreignKey: 'alertId', as: 'timeline' });
  Alert.hasMany(AIAgentLog, { foreignKey: 'alertId', as: 'aiAgentLogs' });
  Alert.hasMany(AlertMitreAnalysis, { foreignKey: 'alert_id', as: 'mitreAnalysisRecords' });
  // Alert.hasOne(AlertOrchestrationResult, { foreignKey: 'alertId', as: 'orchestrationResult' }); // Temporarily disabled

  // Incident associations
  Incident.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Incident.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
  Incident.hasMany(TimelineEvent, { foreignKey: 'incidentId', as: 'timeline' });
  Incident.hasMany(AIAgentLog, { foreignKey: 'incidentId', as: 'aiAgentLogs' });

  // Timeline Event associations
  TimelineEvent.belongsTo(Incident, { foreignKey: 'incidentId', as: 'incident' });
  TimelineEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Alert Timeline Event associations
  AlertTimelineEvent.belongsTo(Alert, { foreignKey: 'alertId', as: 'alert' });
  AlertTimelineEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Alert Orchestration Result associations - temporarily disabled
  // AlertOrchestrationResult.belongsTo(Alert, { foreignKey: 'alertId', as: 'alert' });
  // AlertOrchestrationResult.belongsTo(User, { foreignKey: 'createdBy', as: 'user' });
  // AlertOrchestrationResult.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

  // Security Event associations
  SecurityEvent.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  SecurityEvent.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });

  // Notification associations
  Notification.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // AI Agent associations
  AIAgent.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

  // Playbook associations
  Playbook.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  Playbook.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

  // IOC associations
  IOC.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

  // SystemSettings associations
  SystemSettings.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  SystemSettings.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

  // AlertRule associations
  AlertRule.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  AlertRule.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

  // ChatConversation associations
  ChatConversation.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  ChatConversation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  ChatConversation.hasMany(ChatMessage, { foreignKey: 'conversationId', as: 'messages' });

  // ChatMessage associations
  ChatMessage.belongsTo(ChatConversation, { foreignKey: 'conversationId', as: 'conversation' });

  // AIGenerationLog associations
  AIGenerationLog.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  AIGenerationLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // AIProvider associations
  AIProvider.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

  // NotificationPreference associations
  NotificationPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  NotificationPreference.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

  // ThreatActor associations
  ThreatActor.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  ThreatActor.hasMany(ThreatCampaign, { foreignKey: 'threatActorId', as: 'threatCampaigns' });

  // ThreatCampaign associations
  ThreatCampaign.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  ThreatCampaign.belongsTo(ThreatActor, { foreignKey: 'threatActorId', as: 'threatActor' });

  // ApiKey associations
  ApiKey.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  ApiKey.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

  // AIAgentLog associations (defined in model file but included here for completeness)
  if (AIAgentLog.associate) {
    AIAgentLog.associate({ User, Organization, Alert, Incident, AIAgentInteraction });
  }

  // AIAgentInteraction associations (defined in model file but included here for completeness)
  if (AIAgentInteraction.associate) {
    AIAgentInteraction.associate({ AIAgentLog, User, AIAgentInteraction });
  }

  // AILLMLog associations
  if (AILLMLog.associate) {
    AILLMLog.associate({ User, Organization, AIProvider });
  }

  // AIAnalysisJob associations
  if (AIAnalysisJob.associate) {
    AIAnalysisJob.associate({ User, Organization, TmpLogFileMeta });
  }

  // TmpLogFileMeta associations
  TmpLogFileMeta.hasMany(TmpLogFileLines, {
    foreignKey: 'logFileMetaId',
    as: 'lines',
    onDelete: 'CASCADE'
  });
  TmpLogFileMeta.belongsTo(Organization, {
    foreignKey: 'organizationId',
    as: 'organization'
  });
  TmpLogFileMeta.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // TmpLogFileLines associations
  TmpLogFileLines.belongsTo(TmpLogFileMeta, {
    foreignKey: 'logFileMetaId',
    as: 'logFileMeta',
    onDelete: 'CASCADE'
  });

  // Organization associations for Log Analyzer
  Organization.hasMany(TmpLogFileMeta, { foreignKey: 'organizationId', as: 'tmpLogFileMetas' });

  // User associations for Log Analyzer
  User.hasMany(TmpLogFileMeta, { foreignKey: 'userId', as: 'tmpLogFileMetas' });

  // ThreatHuntingEvent associations
  ThreatHuntingEvent.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  ThreatHuntingEvent.belongsTo(User, { foreignKey: 'hunterId', as: 'hunter' });
  ThreatHuntingEvent.hasMany(ThreatHuntTTP, { foreignKey: 'threatHuntId', as: 'ttps' });
  ThreatHuntingEvent.hasMany(ThreatHuntReport, { foreignKey: 'threatHuntId', as: 'reports' });
  ThreatHuntingEvent.hasOne(ThreatHuntMitreEnhancement, { foreignKey: 'threatHuntId', as: 'mitreEnhancement' });

  // ThreatHuntTTP associations
  ThreatHuntTTP.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  ThreatHuntTTP.belongsTo(ThreatHuntingEvent, { foreignKey: 'threatHuntId', as: 'threatHunt' });

  // ThreatHuntReport associations
  ThreatHuntReport.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  ThreatHuntReport.belongsTo(ThreatHuntingEvent, { foreignKey: 'threatHuntId', as: 'threatHunt' });
  ThreatHuntReport.belongsTo(User, { foreignKey: 'generatedBy', as: 'generatedByUser' });
  ThreatHuntReport.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewedByUser' });
  ThreatHuntReport.belongsTo(User, { foreignKey: 'approvedBy', as: 'approvedByUser' });

  // MitreTactic associations
  MitreTactic.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  MitreTactic.hasMany(MitreTechnique, { foreignKey: 'tacticId', as: 'techniques' });

  // MitreTechnique associations
  MitreTechnique.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  MitreTechnique.belongsTo(MitreTactic, { foreignKey: 'tacticId', as: 'tactic' });
  MitreTechnique.belongsTo(MitreTechnique, { foreignKey: 'parentTechniqueId', as: 'parentTechnique' });
  MitreTechnique.hasMany(MitreTechnique, { foreignKey: 'parentTechniqueId', as: 'subTechniques' });
  MitreTechnique.hasMany(MitreProcedure, { foreignKey: 'techniqueId', as: 'procedures' });

  // MitreProcedure associations
  MitreProcedure.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  MitreProcedure.belongsTo(MitreTechnique, { foreignKey: 'techniqueId', as: 'technique' });
  MitreProcedure.belongsTo(ThreatActor, { foreignKey: 'threatActorId', as: 'threatActor' });

  // ThreatHuntMitreEnhancement associations
  ThreatHuntMitreEnhancement.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
  ThreatHuntMitreEnhancement.belongsTo(ThreatHuntingEvent, { foreignKey: 'threatHuntId', as: 'threatHunt' });
  ThreatHuntMitreEnhancement.belongsTo(User, { foreignKey: 'validatedBy', as: 'validator' });
};

// Initialize associations
defineAssociations();

// Database connection and sync function
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync models in development
    if (process.env.NODE_ENV === 'development') {
      // First, ensure new tables are created
      await sequelize.sync({ alter: true, force: false });
      console.log('✅ Database models synchronized.');
    }
    
    return sequelize;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  initializeDatabase,
  models: {
    User,
    Organization,
    Asset,
    Alert,
    Incident,
    TimelineEvent,
    AlertTimelineEvent,
    SecurityEvent,
    Notification,
    NotificationPreference,
    AIAgent,
    Playbook,
    IOC,
    SystemSettings,
    AlertRule,
    ChatConversation,
    ChatMessage,
    AIGenerationLog,
    AIProvider,
    ThreatActor,
    ThreatCampaign,
    ApiKey,
    AIAgentLog,
    AIAgentInteraction,
    AILLMLog,
    AIAnalysisJob,
    TmpLogFileMeta,
    TmpLogFileLines,
    ThreatHuntingEvent,
    ThreatHuntTTP,
    ThreatHuntReport,
    MitreTactic,
    MitreTechnique,
    MitreProcedure,
    AIToolCallingLog,
    AlertMitreAnalysis,
    ThreatHuntMitreEnhancement,
    AlertOrchestrationResult,
  },
};