const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TmpLogFileLines = sequelize.define('TmpLogFileLines', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  logFileMetaId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'log_file_meta_id',
    comment: 'Foreign key to tmp_log_file_meta table'
  },
  lineNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'line_number',
    comment: 'Line number in the original file (1-based)'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Raw content of the log line'
  },
  parsedData: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    field: 'parsed_data',
    comment: 'Parsed/structured data extracted from the log line'
  },
  securityAnalyzed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'security_analyzed',
    comment: 'Flag indicating if line has been analyzed for security issues'
  },
  hasSecurityIssue: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'has_security_issue',
    comment: 'Flag indicating if security issue was detected'
  },
  securityIssueDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'security_issue_description',
    comment: 'Description of the security issue identified by AI'
  },
  securityIssueSeverity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: true,
    field: 'security_issue_severity',
    comment: 'Severity level of the identified security issue'
  },
  securityIssueType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'security_issue_type',
    comment: 'Type/category of the security issue (e.g., brute_force, malware, etc.)'
  },
  aiAnalysisTimestamp: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ai_analysis_timestamp',
    comment: 'Timestamp when AI security analysis was performed'
  },
  aiAnalysisMetadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    field: 'ai_analysis_metadata',
    comment: 'Additional AI analysis data including recommendations and confidence scores'
  },
  createdAlertId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_alert_id',
    comment: 'Reference to security alert created for this log line'
  }
}, {
  tableName: 'tmp_log_file_lines',
  indexes: [
    {
      fields: ['log_file_meta_id']
    },
    {
      fields: ['log_file_meta_id', 'line_number']
    },
    {
      fields: ['line_number']
    },
    {
      unique: true,
      fields: ['log_file_meta_id', 'line_number'],
      name: 'tmp_log_file_lines_unique_line_per_file'
    },
    {
      fields: ['security_analyzed']
    },
    {
      fields: ['has_security_issue']
    },
    {
      fields: ['security_issue_severity']
    },
    {
      fields: ['log_file_meta_id', 'security_analyzed']
    },
    {
      fields: ['log_file_meta_id', 'has_security_issue']
    },
    {
      fields: ['ai_analysis_timestamp']
    }
  ]
});

// Define associations
TmpLogFileLines.associate = function(models) {
  // A log file line belongs to a log file meta
  TmpLogFileLines.belongsTo(models.TmpLogFileMeta, {
    foreignKey: 'logFileMetaId',
    as: 'logFileMeta',
    onDelete: 'CASCADE'
  });

  // A log file line may have an associated security alert
  TmpLogFileLines.belongsTo(models.Alert, {
    foreignKey: 'createdAlertId',
    as: 'securityAlert',
    onDelete: 'SET NULL'
  });
};

module.exports = TmpLogFileLines;