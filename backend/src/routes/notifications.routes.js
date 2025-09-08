const express = require('express');
const router = express.Router();
const NotificationsController = require('../controllers/notifications.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Apply authentication to all notification routes
router.use(authMiddleware);

// GET /api/notifications - Get user's notifications with filtering and pagination
router.get('/',
  NotificationsController.getNotifications
);

// GET /api/notifications/stats - Get notification statistics
router.get('/stats',
  NotificationsController.getStats
);

// GET /api/notifications/preferences - Get user's notification preferences
router.get('/preferences',
  NotificationsController.getPreferences
);

// POST /api/notifications/preferences - Update user's notification preferences
router.post('/preferences',
  NotificationsController.updatePreferences
);

// POST /api/notifications - Create a new notification (admin/system use)
router.post('/',
  NotificationsController.createNotification
);

// PATCH /api/notifications/mark-all-read - Mark all notifications as read
router.patch('/mark-all-read',
  NotificationsController.markAllAsRead
);

// GET /api/notifications/:id - Get specific notification
router.get('/:id',
  NotificationsController.getNotificationById
);

// PATCH /api/notifications/:id - Update notification
router.patch('/:id',
  NotificationsController.updateNotification
);

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read',
  NotificationsController.markAsRead
);

// PATCH /api/notifications/:id/archive - Archive notification (soft delete)
router.patch('/:id/archive',
  NotificationsController.archiveNotification
);

// DELETE /api/notifications/:id - Delete notification permanently
router.delete('/:id',
  NotificationsController.deleteNotification
);

module.exports = router;