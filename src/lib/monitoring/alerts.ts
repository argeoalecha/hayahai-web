interface AlertConfig {
  webhook: string;
  threshold: number;
  timeWindow: number; // minutes
  enabled: boolean;
}

interface AlertMessage {
  text: string;
  blocks: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    elements?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

export class AlertManager {
  private errorCounts = new Map<string, number[]>();
  private lastAlertTime = new Map<string, number>();
  private cooldownPeriod = 30 * 60 * 1000; // 30 minutes cooldown

  private configs: Record<string, AlertConfig> = {
    'database-errors': {
      webhook: process.env.SLACK_WEBHOOK_DB || '',
      threshold: 5,
      timeWindow: 5,
      enabled: !!process.env.SLACK_WEBHOOK_DB,
    },
    'api-errors': {
      webhook: process.env.SLACK_WEBHOOK_API || '',
      threshold: 10,
      timeWindow: 10,
      enabled: !!process.env.SLACK_WEBHOOK_API,
    },
    'auth-errors': {
      webhook: process.env.SLACK_WEBHOOK_AUTH || '',
      threshold: 3,
      timeWindow: 5,
      enabled: !!process.env.SLACK_WEBHOOK_AUTH,
    },
    'performance-errors': {
      webhook: process.env.SLACK_WEBHOOK_PERF || '',
      threshold: 5,
      timeWindow: 10,
      enabled: !!process.env.SLACK_WEBHOOK_PERF,
    },
    'security-errors': {
      webhook: process.env.SLACK_WEBHOOK_SEC || '',
      threshold: 1, // Immediate alert for security issues
      timeWindow: 1,
      enabled: !!process.env.SLACK_WEBHOOK_SEC,
    },
  };

  recordError(type: string, error: Error, metadata?: Record<string, any>) {
    const now = Date.now();
    const config = this.configs[type];

    if (!config || !config.enabled) {
      console.warn(`Alert config not found or disabled for type: ${type}`);
      return;
    }

    // Check cooldown period
    const lastAlert = this.lastAlertTime.get(type);
    if (lastAlert && now - lastAlert < this.cooldownPeriod) {
      return; // Still in cooldown period
    }

    // Track error occurrences
    if (!this.errorCounts.has(type)) {
      this.errorCounts.set(type, []);
    }

    const errors = this.errorCounts.get(type)!;
    errors.push(now);

    // Clean old errors outside time window
    const cutoff = now - (config.timeWindow * 60 * 1000);
    const recentErrors = errors.filter(time => time > cutoff);
    this.errorCounts.set(type, recentErrors);

    // Check if threshold exceeded
    if (recentErrors.length >= config.threshold) {
      this.sendAlert(type, error, recentErrors.length, metadata);
      // Reset counter and set last alert time
      this.errorCounts.set(type, []);
      this.lastAlertTime.set(type, now);
    }
  }

  private async sendAlert(
    type: string,
    error: Error,
    count: number,
    metadata?: Record<string, any>
  ) {
    try {
      const config = this.configs[type];
      const severity = this.getSeverity(type, count);
      const emoji = this.getSeverityEmoji(severity);

      const message: AlertMessage = {
        text: `${emoji} High error rate detected: ${type}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${emoji} ALERT: ${type.toUpperCase()}*\n*Severity:* ${severity}\n*Count:* ${count} errors in ${config.timeWindow} minutes\n*Latest Error:* \`${error.message}\``
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Stack Trace:*\n\`\`\`${error.stack?.slice(0, 500) || 'No stack trace available'}\`\`\``
            }
          }
        ]
      };

      // Add metadata if provided
      if (metadata) {
        message.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Additional Context:*\n\`\`\`${JSON.stringify(metadata, null, 2).slice(0, 300)}\`\`\``
          }
        });
      }

      // Add environment and timestamp
      message.blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Environment: ${process.env.NODE_ENV} | Time: ${new Date().toISOString()} | Server: ${process.env.VERCEL_REGION || 'unknown'}`
          }
        ]
      });

      // Add action buttons for critical errors
      if (severity === 'CRITICAL') {
        message.blocks.push({
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Logs'
              },
              url: `https://vercel.com/${process.env.VERCEL_ORG_ID}/${process.env.VERCEL_PROJECT_ID}/functions`
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Health Check'
              },
              url: `${process.env.NEXTAUTH_URL}/api/health`
            }
          ]
        });
      }

      await this.sendToSlack(config.webhook, message);

      // Also send to email for critical errors
      if (severity === 'CRITICAL' && process.env.CRITICAL_ALERT_EMAIL) {
        await this.sendEmailAlert(type, error, count, metadata);
      }

    } catch (alertError) {
      console.error('Failed to send alert:', alertError);

      // Fallback: log to console with structured format
      console.error('ALERT FALLBACK:', {
        type,
        error: {
          message: error.message,
          stack: error.stack,
        },
        count,
        timestamp: new Date().toISOString(),
        metadata,
      });
    }
  }

  private async sendToSlack(webhook: string, message: AlertMessage) {
    if (!webhook) {
      throw new Error('Slack webhook URL not configured');
    }

    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
    }
  }

  private async sendEmailAlert(
    type: string,
    error: Error,
    count: number,
    metadata?: Record<string, any>
  ) {
    // Email implementation would go here
    // This could use SendGrid, AWS SES, or other email service
    console.log('Email alert would be sent for critical error:', {
      type,
      error: error.message,
      count,
      metadata,
    });
  }

  private getSeverity(type: string, count: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const config = this.configs[type];

    if (type === 'security-errors') return 'CRITICAL';
    if (count >= config.threshold * 3) return 'CRITICAL';
    if (count >= config.threshold * 2) return 'HIGH';
    if (count >= config.threshold * 1.5) return 'MEDIUM';
    return 'LOW';
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return '🚨';
      case 'HIGH': return '⚠️';
      case 'MEDIUM': return '🟡';
      case 'LOW': return '🔵';
      default: return '❓';
    }
  }

  // Method to test alerting system
  async testAlert(type: string) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Test alerts can only be sent in development environment');
    }

    const testError = new Error(`Test alert for ${type} - ${new Date().toISOString()}`);
    await this.sendAlert(type, testError, 1, { test: true, timestamp: Date.now() });
  }

  // Get current error counts for monitoring
  getErrorCounts(): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const [type, timestamps] of this.errorCounts.entries()) {
      const config = this.configs[type];
      if (config) {
        const cutoff = Date.now() - (config.timeWindow * 60 * 1000);
        counts[type] = timestamps.filter(time => time > cutoff).length;
      }
    }

    return counts;
  }

  // Reset all error counts (for testing or manual reset)
  resetCounts() {
    this.errorCounts.clear();
    this.lastAlertTime.clear();
  }

  // Update configuration at runtime
  updateConfig(type: string, config: Partial<AlertConfig>) {
    if (this.configs[type]) {
      this.configs[type] = { ...this.configs[type], ...config };
    }
  }
}

// Singleton instance
export const alertManager = new AlertManager();

// Helper functions for common error types
export function reportDatabaseError(error: Error, operation?: string) {
  alertManager.recordError('database-errors', error, { operation });
}

export function reportAPIError(error: Error, endpoint?: string, method?: string) {
  alertManager.recordError('api-errors', error, { endpoint, method });
}

export function reportAuthError(error: Error, userId?: string) {
  alertManager.recordError('auth-errors', error, { userId });
}

export function reportPerformanceError(error: Error, metric?: string, value?: number) {
  alertManager.recordError('performance-errors', error, { metric, value });
}

export function reportSecurityError(error: Error, threat?: string, ip?: string) {
  alertManager.recordError('security-errors', error, { threat, ip, severity: 'critical' });
}