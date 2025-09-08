const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TmpLogFileMeta = sequelize.define('TmpLogFileMeta', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Generated unique filename for storage'
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'original_name',
    comment: 'Original filename uploaded by user'
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'file_path',
    comment: 'Full path to the stored file'
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'file_size',
    comment: 'File size in bytes'
  },
  totalLines: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'total_lines',
    comment: 'Total number of lines in the file'
  },
  uploadDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'upload_date',
    comment: 'Date and time when file was uploaded'
  },
  status: {
    type: DataTypes.ENUM('uploading', 'processing', 'completed', 'error'),
    allowNull: false,
    defaultValue: 'uploading',
    comment: 'Current processing status of the file'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message',
    comment: 'Error message if processing failed'
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'organization_id',
    comment: 'Organization that owns this file'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    comment: 'User who uploaded this file'
  }
}, {
  tableName: 'tmp_log_file_meta',
  indexes: [
    {
      fields: ['organization_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['upload_date']
    },
    {
      fields: ['organization_id', 'upload_date']
    }
  ]
});

// Define associations
TmpLogFileMeta.associate = function(models) {
  // A log file meta can have many log file lines
  TmpLogFileMeta.hasMany(models.TmpLogFileLines, {
    foreignKey: 'logFileMetaId',
    as: 'lines',
    onDelete: 'CASCADE'
  });

  // A log file meta belongs to an organization
  if (models.Organization) {
    TmpLogFileMeta.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });
  }

  // A log file meta belongs to a user
  if (models.User) {
    TmpLogFileMeta.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }
};

module.exports = TmpLogFileMeta;