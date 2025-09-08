const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatConversation = sequelize.define('ChatConversation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'organization_id'
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    lastActivity: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'last_activity'
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        ragEnabled: true,
        dataSources: ['alerts', 'incidents', 'assets', 'iocs', 'playbooks'],
        model: 'default',
        enabledTools: [
          // Security Alert Tools
          'get_latest_critical_alerts',
          'analyze_alert_trends', 
          'get_alerts_by_asset',
          'search_alerts_by_indicators',
          
          // Incident Tools
          'get_active_incidents',
          'get_incident_details',
          'suggest_incident_response_steps',
          'analyze_incident_patterns',
          'generate_incident_summary_report',
          
          // Reporting Tools
          'generate_security_dashboard_summary',
          'generate_threat_intelligence_report',
          'generate_compliance_report',
          'generate_asset_security_report',
          'generate_executive_summary',
          
          // RAG Tools
          'smart_context_search',
          'find_related_security_data',
          'semantic_playbook_search',
          'contextual_threat_analysis',
          'intelligent_knowledge_extraction',
          
          // Threat Intelligence Tools
          'analyze_threat_indicators',
          'search_threat_intelligence',
          'generate_threat_profile',
          'assess_ioc_quality',
          'detect_threat_campaigns',
          
          // MITRE Attack Tools (existing)
          'search_mitre_techniques',
          'analyze_attack_patterns',
          'get_technique_details',
          'find_related_techniques',
          'generate_threat_hunt_hypotheses',
          'create_detection_rules',
          'assess_coverage',
          'search_threat_groups'
        ]
      }
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_archived'
    },
    messageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'message_count'
    }
  }, {
    tableName: 'chat_conversations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeUpdate: (conversation) => {
        conversation.lastActivity = new Date();
      }
    }
  });


  // Instance methods
  ChatConversation.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    return {
      id: values.id,
      userId: values.userId,
      organizationId: values.organizationId,
      title: values.title,
      createdAt: values.created_at,
      updatedAt: values.updated_at,
      lastActivity: values.lastActivity,
      settings: values.settings,
      isArchived: values.isArchived,
      messageCount: values.messageCount,
      messages: values.messages // Include if loaded
    };
  };

  // Static methods
  ChatConversation.findByUserAndOrg = async function(userId, organizationId, options = {}) {
    const defaultOptions = {
      where: { 
        userId, 
        organizationId,
        isArchived: false 
      },
      order: [['lastActivity', 'DESC']],
      limit: 20
    };
    
    return this.findAll({ ...defaultOptions, ...options });
  };

  ChatConversation.findWithMessages = async function(conversationId, userId, organizationId) {
    return this.findOne({
      where: { 
        id: conversationId, 
        userId, 
        organizationId 
      },
      include: [{
        model: sequelize.models.ChatMessage,
        as: 'messages',
        order: [['timestamp', 'ASC']],
        limit: 100 // Limit to recent messages
      }]
    });
  };

  ChatConversation.createWithFirstMessage = async function(data, transaction) {
    const { userId, organizationId, title, settings, firstMessage } = data;
    
    // Create conversation
    const conversation = await this.create({
      userId,
      organizationId,
      title,
      settings,
      messageCount: firstMessage ? 1 : 0
    }, { transaction });

    // Create first message if provided
    if (firstMessage) {
      await sequelize.models.ChatMessage.create({
        conversationId: conversation.id,
        role: firstMessage.role,
        content: firstMessage.content,
        timestamp: firstMessage.timestamp || new Date(),
        ragEnabled: firstMessage.ragEnabled || false,
        ragContext: firstMessage.ragContext
      }, { transaction });
    }

    return conversation;
  };

module.exports = ChatConversation;