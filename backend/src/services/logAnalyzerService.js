const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const TmpLogFileMeta = require('../database/models/TmpLogFileMeta');
const TmpLogFileLines = require('../database/models/TmpLogFileLines');

class LogAnalyzerService {
  constructor() {
    this.uploadDir = process.env.LOG_ANALYZER_UPLOAD_DIR || '/tmp/log-analyzer';
    this.maxFileSize = parseInt(process.env.LOG_ANALYZER_MAX_FILE_SIZE) || 50 * 1024 * 1024; // 50MB default
    this.allowedExtensions = ['.log', '.txt', '.out', '.err', '.trace'];
    
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Validate uploaded file
   */
  validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(this.maxFileSize / 1024 / 1024)}MB)`);
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(ext) && ext !== '') {
      errors.push(`File type not allowed. Allowed types: ${this.allowedExtensions.join(', ')}`);
    }

    // Check for empty file
    if (file.size === 0) {
      errors.push('File is empty');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Save uploaded file and create database record
   */
  async saveUploadedFile(file, userId, organizationId) {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}_${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    try {
      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Create database record
      const logFileMeta = await TmpLogFileMeta.create({
        filename,
        originalName: file.originalname,
        filePath,
        fileSize: file.size,
        status: 'uploading',
        organizationId,
        userId,
        uploadDate: new Date()
      });

      // Start processing asynchronously
      this.processFileAsync(logFileMeta.id);

      return logFileMeta;
    } catch (error) {
      // Clean up file if database creation fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  /**
   * Process file asynchronously - parse lines and store in database
   */
  async processFileAsync(logFileMetaId) {
    let logFileMeta;
    
    try {
      logFileMeta = await TmpLogFileMeta.findByPk(logFileMetaId);
      if (!logFileMeta) {
        throw new Error('Log file meta not found');
      }

      // Update status to processing
      await logFileMeta.update({ status: 'processing' });

      // Process file line by line
      const totalLines = await this.parseAndStoreLines(logFileMeta);

      // Update status to completed
      await logFileMeta.update({ 
        status: 'completed',
        totalLines
      });

    } catch (error) {
      console.error('Error processing log file:', error);
      
      if (logFileMeta) {
        await logFileMeta.update({ 
          status: 'error',
          errorMessage: error.message
        });
      }
    }
  }

  /**
   * Parse file and store lines in database
   */
  async parseAndStoreLines(logFileMeta) {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(logFileMeta.filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let lineNumber = 0;
      const batchSize = 1000;
      let batch = [];

      rl.on('line', (line) => {
        lineNumber++;
        
        batch.push({
          logFileMetaId: logFileMeta.id,
          lineNumber,
          content: line,
          parsedData: this.parseLogLine(line)
        });

        // Process batch when it reaches batchSize
        if (batch.length >= batchSize) {
          this.insertBatch(batch.slice());
          batch = [];
        }
      });

      rl.on('close', async () => {
        try {
          // Process remaining lines in batch
          if (batch.length > 0) {
            await this.insertBatch(batch);
          }
          resolve(lineNumber);
        } catch (error) {
          reject(error);
        }
      });

      rl.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Insert batch of lines into database
   */
  async insertBatch(batch) {
    try {
      await TmpLogFileLines.bulkCreate(batch, {
        ignoreDuplicates: true
      });
    } catch (error) {
      console.error('Error inserting batch:', error);
      throw error;
    }
  }

  /**
   * Basic log line parsing - can be extended for specific log formats
   */
  parseLogLine(line) {
    const parsed = {};

    // Try to extract timestamp (common formats)
    const timestampRegex = /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?)/;
    const timestampMatch = line.match(timestampRegex);
    if (timestampMatch) {
      parsed.timestamp = timestampMatch[1];
    }

    // Try to extract log level
    const levelRegex = /\b(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|TRACE)\b/i;
    const levelMatch = line.match(levelRegex);
    if (levelMatch) {
      parsed.level = levelMatch[1].toUpperCase();
    }

    // Try to extract IP addresses
    const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    const ipMatches = line.match(ipRegex);
    if (ipMatches) {
      parsed.ip_addresses = ipMatches;
    }

    // Store original line length
    parsed.line_length = line.length;

    return parsed;
  }

  /**
   * Get all log files for an organization
   */
  async getLogFiles(organizationId, options = {}) {
    const { page = 1, limit = 20, status, search } = options;
    const offset = (page - 1) * limit;

    const whereClause = { organizationId };
    
    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { originalName: { [Op.iLike]: `%${search}%` } },
        { filename: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await TmpLogFileMeta.findAndCountAll({
      where: whereClause,
      order: [['uploadDate', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: TmpLogFileLines,
          as: 'lines',
          attributes: [],
          required: false
        }
      ],
      attributes: {
        include: [
          [
            TmpLogFileMeta.sequelize.fn('COUNT', TmpLogFileMeta.sequelize.col('lines.id')),
            'currentLinesCount'
          ]
        ]
      },
      group: ['TmpLogFileMeta.id'],
      subQuery: false
    });

    return {
      files: rows,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: count.length,
        totalPages: Math.ceil(count.length / limit),
        hasNext: page < Math.ceil(count.length / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get file details with line count
   */
  async getFileDetails(fileId, organizationId) {
    const file = await TmpLogFileMeta.findOne({
      where: { id: fileId, organizationId },
      include: [
        {
          model: TmpLogFileLines,
          as: 'lines',
          attributes: [],
          required: false
        }
      ],
      attributes: {
        include: [
          [
            TmpLogFileMeta.sequelize.fn('COUNT', TmpLogFileMeta.sequelize.col('lines.id')),
            'currentLinesCount'
          ]
        ]
      },
      group: ['TmpLogFileMeta.id']
    });

    if (!file) {
      throw new Error('File not found');
    }

    return file;
  }

  /**
   * Get file lines with pagination
   */
  async getFileLines(fileId, organizationId, options = {}) {
    const { 
      page = 1, 
      limit = 100, 
      search,
      securityStatus,
      severity,
      analysisStatus,
      hasAlerts,
      logLevel,
      dateFrom,
      dateTo,
      ipAddress
    } = options;
    const offset = (page - 1) * limit;

    // Verify file belongs to organization
    const file = await TmpLogFileMeta.findOne({
      where: { id: fileId, organizationId }
    });

    if (!file) {
      throw new Error('File not found');
    }

    const whereClause = { logFileMetaId: fileId };
    
    // Content search
    if (search) {
      whereClause.content = { [Op.iLike]: `%${search}%` };
    }

    // Security status filtering
    if (securityStatus) {
      switch (securityStatus) {
        case 'not_analyzed':
          whereClause.securityAnalyzed = false;
          break;
        case 'analyzing':
          whereClause.securityAnalyzed = false;
          // Could add logic for jobs in progress if needed
          break;
        case 'safe':
          whereClause.securityAnalyzed = true;
          whereClause.hasSecurityIssue = false;
          break;
        case 'security_issue':
          whereClause.hasSecurityIssue = true;
          break;
        case 'alerts_created':
          whereClause.createdAlertId = { [Op.not]: null };
          break;
      }
    }

    // Severity filtering
    if (severity) {
      whereClause.securityIssueSeverity = severity;
    }

    // Analysis status filtering (mapped to security analyzed field)
    if (analysisStatus) {
      switch (analysisStatus) {
        case 'pending':
        case 'in_progress':
          whereClause.securityAnalyzed = false;
          break;
        case 'completed':
          whereClause.securityAnalyzed = true;
          break;
        case 'failed':
          whereClause.securityAnalyzed = false;
          // Could add specific error condition if tracked
          break;
      }
    }

    // Alert status filtering
    if (hasAlerts !== undefined) {
      if (hasAlerts) {
        whereClause.createdAlertId = { [Op.not]: null };
      } else {
        whereClause.createdAlertId = null;
      }
    }

    // Log level filtering (from parsed data)
    if (logLevel) {
      whereClause.parsedData = {
        [Op.contains]: { level: logLevel }
      };
    }

    // Date range filtering (from parsed data timestamp)
    if (dateFrom || dateTo) {
      const dateConditions = {};
      if (dateFrom) {
        dateConditions[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        dateConditions[Op.lte] = new Date(dateTo);
      }
      
      // This filters based on parsed timestamp in parsedData
      whereClause.parsedData = {
        ...whereClause.parsedData,
        timestamp: dateConditions
      };
    }

    // IP address filtering (from parsed data)
    if (ipAddress) {
      whereClause[Op.or] = [
        {
          parsedData: {
            [Op.contains]: { ip_addresses: [ipAddress] }
          }
        },
        {
          content: { [Op.iLike]: `%${ipAddress}%` }
        }
      ];
    }

    const { count, rows } = await TmpLogFileLines.findAndCountAll({
      where: whereClause,
      order: [['lineNumber', 'ASC']],
      limit,
      offset
    });

    return {
      lines: rows,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Empty all lines for a file (keep metadata)
   */
  async emptyFileLines(fileId, organizationId) {
    // Verify file belongs to organization
    const file = await TmpLogFileMeta.findOne({
      where: { id: fileId, organizationId }
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Delete all lines for this file
    const deletedCount = await TmpLogFileLines.destroy({
      where: { logFileMetaId: fileId }
    });

    return { deletedLinesCount: deletedCount };
  }

  /**
   * Create a new log line
   */
  async createLine(fileId, organizationId, lineData) {
    // Verify file belongs to organization
    const file = await TmpLogFileMeta.findOne({
      where: { id: fileId, organizationId }
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Get the highest line number for this file
    const lastLine = await TmpLogFileLines.findOne({
      where: { logFileMetaId: fileId },
      order: [['lineNumber', 'DESC']]
    });

    const lineNumber = lastLine ? lastLine.lineNumber + 1 : 1;

    // Create the new line
    const newLine = await TmpLogFileLines.create({
      logFileMetaId: fileId,
      lineNumber,
      content: lineData.content,
      parsedData: lineData.parsedData || this.parseLogLine(lineData.content)
    });

    return newLine;
  }

  /**
   * Update an existing log line
   */
  async updateLine(lineId, fileId, organizationId, updateData) {
    // Verify file belongs to organization
    const file = await TmpLogFileMeta.findOne({
      where: { id: fileId, organizationId }
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Find the line
    const line = await TmpLogFileLines.findOne({
      where: { 
        id: lineId,
        logFileMetaId: fileId
      }
    });

    if (!line) {
      throw new Error('Line not found');
    }

    // Only allow updating content and parsedData
    const allowedFields = ['content', 'parsedData'];
    const filteredData = {};
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        filteredData[key] = value;
      }
    }

    // If content is updated, re-parse it
    if (filteredData.content && !filteredData.parsedData) {
      filteredData.parsedData = this.parseLogLine(filteredData.content);
    }

    if (Object.keys(filteredData).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Update the line
    await line.update(filteredData);

    return line;
  }

  /**
   * Delete a log line
   */
  async deleteLine(lineId, fileId, organizationId) {
    // Verify file belongs to organization
    const file = await TmpLogFileMeta.findOne({
      where: { id: fileId, organizationId }
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Find and delete the line
    const line = await TmpLogFileLines.findOne({
      where: { 
        id: lineId,
        logFileMetaId: fileId
      }
    });

    if (!line) {
      throw new Error('Line not found');
    }

    await line.destroy();

    return { message: 'Line deleted successfully' };
  }

  /**
   * Update file metadata
   */
  async updateFile(fileId, organizationId, updateData) {
    // Verify file belongs to organization
    const file = await TmpLogFileMeta.findOne({
      where: { id: fileId, organizationId }
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Only allow updating certain fields for safety
    const allowedFields = ['originalName', 'status', 'errorMessage'];
    const filteredData = {};
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        filteredData[key] = value;
      }
    }

    if (Object.keys(filteredData).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Update the file
    await file.update(filteredData);

    return file;
  }

  /**
   * Delete file completely (metadata, lines, and physical file)
   */
  async deleteFile(fileId, organizationId) {
    // Verify file belongs to organization
    const file = await TmpLogFileMeta.findOne({
      where: { id: fileId, organizationId }
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Delete physical file
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    // Delete database records (lines will be deleted by CASCADE)
    await file.destroy();

    return { message: 'File deleted successfully' };
  }

  /**
   * Bulk cleanup operations
   */
  async bulkCleanup(organizationId, options = {}) {
    const { 
      action = 'empty_lines', // 'empty_lines' or 'delete_files'
      olderThanDays = 30,
      fileIds = null
    } = options;

    let whereClause = { organizationId };

    if (fileIds && fileIds.length > 0) {
      whereClause.id = { [Op.in]: fileIds };
    } else if (olderThanDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      whereClause.uploadDate = { [Op.lt]: cutoffDate };
    }

    const files = await TmpLogFileMeta.findAll({
      where: whereClause
    });

    let results = {
      processedFiles: 0,
      deletedLinesCount: 0,
      deletedFilesCount: 0,
      errors: []
    };

    for (const file of files) {
      try {
        if (action === 'empty_lines') {
          const result = await this.emptyFileLines(file.id, organizationId);
          results.deletedLinesCount += result.deletedLinesCount;
        } else if (action === 'delete_files') {
          await this.deleteFile(file.id, organizationId);
          results.deletedFilesCount++;
        }
        results.processedFiles++;
      } catch (error) {
        results.errors.push({
          fileId: file.id,
          filename: file.originalName,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(organizationId) {
    // Get basic file statistics
    const statsResult = await TmpLogFileMeta.sequelize.query(
      `SELECT 
        COUNT(*) as "totalFiles", 
        COALESCE(SUM(file_size), 0) as "totalFileSize", 
        COALESCE(SUM(total_lines), 0) as "totalLines",
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as "completedFiles",
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as "processingFiles",
        COUNT(CASE WHEN status = 'uploading' THEN 1 END) as "uploadingFiles",
        COUNT(CASE WHEN status = 'error' THEN 1 END) as "errorFiles"
      FROM tmp_log_file_meta 
      WHERE organization_id = ?`,
      {
        replacements: [organizationId],
        type: TmpLogFileMeta.sequelize.QueryTypes.SELECT
      }
    );
    const stats = statsResult[0] || { 
      totalFiles: 0, 
      totalFileSize: 0, 
      totalLines: 0,
      completedFiles: 0,
      processingFiles: 0,
      uploadingFiles: 0,
      errorFiles: 0
    };

    // Get processed line count using raw SQL
    const lineCountResult = await TmpLogFileMeta.sequelize.query(
      'SELECT COUNT(*) as count FROM tmp_log_file_lines l JOIN tmp_log_file_meta m ON l.log_file_meta_id = m.id WHERE m.organization_id = ?',
      {
        replacements: [organizationId],
        type: TmpLogFileMeta.sequelize.QueryTypes.SELECT
      }
    );
    const lineCount = parseInt(lineCountResult[0]?.count) || 0;

    // Get security analysis statistics
    const securityStatsResult = await TmpLogFileMeta.sequelize.query(
      `SELECT 
        COUNT(CASE WHEN security_analyzed = true THEN 1 END) as "analyzedLines",
        COUNT(CASE WHEN has_security_issue = true THEN 1 END) as "securityIssues",
        COUNT(CASE WHEN created_alert_id IS NOT NULL THEN 1 END) as "alertsCreated"
      FROM tmp_log_file_lines l 
      JOIN tmp_log_file_meta m ON l.log_file_meta_id = m.id 
      WHERE m.organization_id = ?`,
      {
        replacements: [organizationId],
        type: TmpLogFileMeta.sequelize.QueryTypes.SELECT
      }
    );
    const securityStats = securityStatsResult[0] || { 
      analyzedLines: 0, 
      securityIssues: 0, 
      alertsCreated: 0 
    };

    // Calculate processing metrics
    const totalFiles = parseInt(stats.totalFiles) || 0;
    const totalLines = parseInt(stats.totalLines) || 0;
    const currentLinesInDb = lineCount;
    const processingProgress = totalLines > 0 ? (currentLinesInDb / totalLines) * 100 : 0;
    const securityAnalysisProgress = currentLinesInDb > 0 ? (parseInt(securityStats.analyzedLines) / currentLinesInDb) * 100 : 0;

    return {
      // Basic file statistics
      totalFiles,
      totalFileSize: parseInt(stats.totalFileSize) || 0,
      totalLines,
      currentLinesInDb: lineCount,
      uploadDirectory: this.uploadDir,
      
      // Processing status statistics
      completedFiles: parseInt(stats.completedFiles) || 0,
      processingFiles: parseInt(stats.processingFiles) || 0,
      uploadingFiles: parseInt(stats.uploadingFiles) || 0,
      errorFiles: parseInt(stats.errorFiles) || 0,
      
      // Processing progress metrics
      processingProgress: Math.round(processingProgress * 100) / 100, // Round to 2 decimal places
      pendingLines: Math.max(0, totalLines - currentLinesInDb),
      
      // Security analysis statistics
      analyzedLines: parseInt(securityStats.analyzedLines) || 0,
      securityIssues: parseInt(securityStats.securityIssues) || 0,
      alertsCreated: parseInt(securityStats.alertsCreated) || 0,
      securityAnalysisProgress: Math.round(securityAnalysisProgress * 100) / 100,
      
      // Calculated metrics
      avgFileSize: totalFiles > 0 ? Math.round((parseInt(stats.totalFileSize) || 0) / totalFiles) : 0,
      avgLinesPerFile: totalFiles > 0 ? Math.round(totalLines / totalFiles) : 0,
      processingSuccessRate: totalFiles > 0 ? Math.round(((parseInt(stats.completedFiles) || 0) / totalFiles) * 100) : 0
    };
  }
}

module.exports = new LogAnalyzerService();