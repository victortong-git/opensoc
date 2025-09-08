import { websocketService, WebSocketEventType } from './websocketService';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
}

interface AIAnalysisNotification {
  fileId: string;
  fileName: string;
  totalLines: number;
  analysisResults: {
    totalAnalyzed: number;
    securityIssuesFound: number;
    alertsCreated: number;
    errors: any[];
  };
}

class NotificationService {
  private permissionGranted = false;
  private subscriptions: Map<string, () => void> = new Map();
  private recentNotifications = new Map<string, number>(); // tag -> timestamp
  private readonly DUPLICATE_THRESHOLD_MS = 5000; // 5 second deduplication window

  constructor() {
    this.initializeBrowserNotifications();
    this.setupWebSocketListeners();
  }

  private async initializeBrowserNotifications(): Promise<void> {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        this.permissionGranted = true;
      } else if (Notification.permission !== 'denied') {
        try {
          const permission = await Notification.requestPermission();
          this.permissionGranted = permission === 'granted';
        } catch (error) {
          console.error('Failed to request notification permission:', error);
        }
      }
    }
  }

  private setupWebSocketListeners(): void {
    // Listen for AI analysis completion events
    websocketService.subscribe('ai_analysis_completed', (data: AIAnalysisNotification) => {
      this.showAIAnalysisCompletedNotification(data);
    });

    // Listen for security issue detection
    websocketService.subscribe('security_issue_found', (data: any) => {
      this.showSecurityIssueNotification(data);
    });

    // Listen for alert creation
    websocketService.subscribe('alert_created', (data: any) => {
      this.showAlertCreatedNotification(data);
    });
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  showNotification(options: NotificationOptions): void {
    // Check for duplicate notifications using tag
    const notificationKey = options.tag || `${options.title}-${options.body}`;
    const now = Date.now();
    const lastNotification = this.recentNotifications.get(notificationKey);
    
    if (lastNotification && (now - lastNotification) < this.DUPLICATE_THRESHOLD_MS) {
      console.debug(`🔕 Suppressing duplicate notification: ${notificationKey}`);
      return;
    }
    
    // Update the timestamp for this notification
    this.recentNotifications.set(notificationKey, now);
    
    // Clean up old entries periodically
    if (this.recentNotifications.size > 50) {
      const cutoff = now - this.DUPLICATE_THRESHOLD_MS * 2;
      for (const [key, timestamp] of this.recentNotifications.entries()) {
        if (timestamp < cutoff) {
          this.recentNotifications.delete(key);
        }
      }
    }

    // Show toast notification
    this.showToastNotification(options);

    // Show browser notification if permission granted
    if (this.permissionGranted) {
      this.showBrowserNotification(options);
    }
  }

  private showToastNotification(options: NotificationOptions): void {
    // Create and show toast notification element
    const toast = document.createElement('div');
    toast.className = `
      fixed top-4 right-4 z-50 max-w-sm bg-white dark:bg-soc-dark-900 
      border border-gray-200 dark:border-soc-dark-700 rounded-lg shadow-lg 
      p-4 transform translate-x-full transition-transform duration-300 ease-in-out
    `;

    toast.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white">
            ${options.title}
          </h4>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            ${options.body}
          </p>
        </div>
        <button class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 5000);
  }

  private showBrowserNotification(options: NotificationOptions): void {
    if (!this.permissionGranted) return;

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge,
        tag: options.tag,
        requireInteraction: options.requireInteraction || false
      });

      // Auto-close after 8 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 8000);
      }

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }

  private showAIAnalysisCompletedNotification(data: AIAnalysisNotification): void {
    const hasIssues = data.analysisResults.securityIssuesFound > 0;
    const hasErrors = data.analysisResults.errors.length > 0;

    let title: string;
    let body: string;

    if (hasErrors) {
      title = 'AI Analysis Completed with Errors';
      body = `Analysis of "${data.fileName}" completed with ${data.analysisResults.errors.length} errors. ${data.analysisResults.securityIssuesFound} security issues found.`;
    } else if (hasIssues) {
      title = 'Security Issues Detected!';
      body = `AI analysis found ${data.analysisResults.securityIssuesFound} security issues in "${data.fileName}". ${data.analysisResults.alertsCreated} alerts created.`;
    } else {
      title = 'AI Analysis Completed';
      body = `Security analysis of "${data.fileName}" completed successfully. No security issues found.`;
    }

    this.showNotification({
      title,
      body,
      tag: `ai_analysis_${data.fileId}`,
      requireInteraction: hasIssues || hasErrors
    });
  }

  private showSecurityIssueNotification(data: any): void {
    const severity = data.severity || 'medium';
    const severityEmoji = {
      low: '🔵',
      medium: '🟡', 
      high: '🟠',
      critical: '🔴'
    }[severity] || '⚠️';

    this.showNotification({
      title: `${severityEmoji} Security Issue Detected`,
      body: `${severity.toUpperCase()} severity: ${data.issueType} detected in line ${data.lineNumber}`,
      tag: `security_issue_${data.fileId}_${data.lineNumber}`,
      requireInteraction: ['high', 'critical'].includes(severity)
    });
  }

  private showAlertCreatedNotification(data: any): void {
    this.showNotification({
      title: '🚨 Security Alert Created',
      body: `Alert "${data.title}" created for detected security issue`,
      tag: `alert_${data.alertId}`,
      requireInteraction: true
    });
  }

  subscribeToFileAnalysis(fileId: string, fileName: string): () => void {
    const subscriptionKey = `file_analysis_${fileId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      return this.subscriptions.get(subscriptionKey)!;
    }

    // Subscribe to AI analysis progress for this specific file
    const progressSub = websocketService.subscribe('ai_analysis_progress', (data: any) => {
      // Show progress notifications for significant milestones
      if (data.progress % 25 === 0) { // Every 25%
        this.showNotification({
          title: 'AI Analysis Progress',
          body: `Analysis of "${fileName}" is ${data.progress}% complete`,
          tag: `progress_${fileId}`
        });
      }
    }, fileId);

    const cleanup = () => {
      websocketService.unsubscribe(progressSub);
      this.subscriptions.delete(subscriptionKey);
    };

    this.subscriptions.set(subscriptionKey, cleanup);
    return cleanup;
  }

  showAIJobStartedNotification(fileId: string, fileName: string): void {
    this.showNotification({
      title: '🤖 AI Analysis Started',
      body: `Security analysis of "${fileName}" has begun. You'll be notified when complete.`,
      tag: `ai_started_${fileId}`
    });
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }

  getPermissionStatus(): NotificationPermission | 'not-supported' {
    if (!('Notification' in window)) {
      return 'not-supported';
    }
    return Notification.permission;
  }
}

// Export singleton instance
export const toastNotificationService = new NotificationService();
export default toastNotificationService;