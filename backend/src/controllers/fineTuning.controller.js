const fineTuningService = require('../services/fineTuningService');
const { ErrorHandler } = require('../middleware/error.middleware');
const JSZip = require('jszip');

/**
 * Fine-Tuning Data Export Controller
 * Handles API endpoints for managing and exporting human-labeled data for AI model fine-tuning
 */
class FineTuningController {

  /**
   * Get fine-tuning dataset statistics
   * GET /api/ai-tools/fine-tuning/stats
   */
  async getStats(req, res, next) {
    try {
      const { organizationId } = req.user;
      const stats = await fineTuningService.getDatasetStats(organizationId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export fine-tuning dataset
   * POST /api/ai-tools/fine-tuning/export
   */
  async exportDataset(req, res, next) {
    try {
      const { organizationId, id: userId } = req.user;
      const exportOptions = req.body;

      // Validate export options
      const {
        startDate,
        endDate,
        minConfidence = 7,
        includeUnverified = false,
        format = 'jsonl',
        datasetSplit = { training: 70, validation: 20, test: 10 }
      } = exportOptions;

      if (!startDate || !endDate) {
        throw new ErrorHandler(400, 'Start date and end date are required');
      }

      if (new Date(startDate) >= new Date(endDate)) {
        throw new ErrorHandler(400, 'Start date must be before end date');
      }

      const exportData = await fineTuningService.exportTrainingData(organizationId, {
        startDate,
        endDate,
        minConfidence,
        includeUnverified,
        format,
        datasetSplit,
        exportedByUserId: userId
      });

      // Create ZIP file with 3 separate files
      const zip = new JSZip();
      const timestamp = new Date().toISOString().split('T')[0];
      
      // Add each split as a separate file in the ZIP
      const fileExtension = format === 'csv' ? 'csv' : 'jsonl';
      zip.file(`opensoc_training.${fileExtension}`, exportData.training);
      zip.file(`opensoc_validation.${fileExtension}`, exportData.validation);
      zip.file(`opensoc_test.${fileExtension}`, exportData.test);

      // Generate ZIP buffer
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      // Set ZIP response headers
      const filename = `fine-tuning-dataset-${timestamp}.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(zipBuffer);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get export history
   * GET /api/ai-tools/fine-tuning/exports
   */
  async getExportHistory(req, res, next) {
    try {
      const { organizationId } = req.user;
      const { page = 1, limit = 20 } = req.query;

      const history = await fineTuningService.getExportHistory(organizationId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit human feedback for an alert
   * POST /api/ai-tools/fine-tuning/feedback/:alertId
   */
  async submitFeedback(req, res, next) {
    try {
      const { alertId } = req.params;
      const { organizationId, id: userId } = req.user;
      const feedbackData = req.body;

      const result = await fineTuningService.submitFeedback(alertId, organizationId, userId, feedbackData);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear human feedback for an alert
   * DELETE /api/ai-tools/fine-tuning/feedback/:alertId
   */
  async clearFeedback(req, res, next) {
    try {
      const { alertId } = req.params;
      const { organizationId, id: userId } = req.user;
      
      const result = await fineTuningService.clearFeedback(alertId, organizationId, userId);
      
      res.json({
        success: true,
        data: result,
        message: 'Feedback cleared successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get feedback quality metrics
   * GET /api/ai-tools/fine-tuning/quality-metrics
   */
  async getQualityMetrics(req, res, next) {
    try {
      const { organizationId } = req.user;
      const { startDate, endDate } = req.query;

      const metrics = await fineTuningService.getQualityMetrics(organizationId, {
        startDate,
        endDate
      });
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FineTuningController();