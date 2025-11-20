// CribNosh Email Performance Monitoring System
// Real-time monitoring, alerting, and performance optimization
import { logger } from '@/lib/utils/logger';

export interface EmailMetrics {
  templateId: string;
  timestamp: Date;
  renderTime: number;
  htmlSize: number;
  imageCount: number;
  linkCount: number;
  errorRate: number;
  successRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface EmailPerformanceAlert {
  id: string;
  type: 'performance' | 'error' | 'capacity' | 'quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  threshold: number;
  currentValue: number;
  templateId?: string;
  createdAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'resolved' | 'acknowledged';
}

export interface EmailQualityScore {
  templateId: string;
  overallScore: number;
  performanceScore: number;
  accessibilityScore: number;
  compatibilityScore: number;
  designScore: number;
  contentScore: number;
  lastUpdated: Date;
  recommendations: string[];
}

export interface EmailCapacityMetrics {
  currentLoad: number;
  maxCapacity: number;
  queueSize: number;
  processingTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  lastUpdated: Date;
}

export interface EmailMonitoringConfig {
  performanceThresholds: {
    maxRenderTime: number; // milliseconds
    maxHtmlSize: number; // bytes
    maxImageCount: number;
    minSuccessRate: number; // percentage
  };
  alertThresholds: {
    errorRate: number; // percentage
    renderTime: number; // milliseconds
    queueSize: number;
    memoryUsage: number; // percentage
  };
  monitoringInterval: number; // milliseconds
  retentionPeriod: number; // days
}

// Email Performance Monitor
export class EmailPerformanceMonitor {
  private metrics: EmailMetrics[] = [];
  private alerts: EmailPerformanceAlert[] = [];
  private qualityScores: Map<string, EmailQualityScore> = new Map();
  private config: EmailMonitoringConfig;
  private monitoringInterval: ReturnType<typeof setTimeout> | null = null;

  constructor(config: EmailMonitoringConfig) {
    this.config = config;
    this.startMonitoring();
  }

  // Start monitoring
  startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
      this.updateQualityScores();
    }, this.config.monitoringInterval);
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Record metrics
  recordMetrics(metrics: EmailMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only recent metrics (based on retention period)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffDate);
  }

  // Collect system metrics
  private collectMetrics(): void {
    // This would collect system-level metrics
    // Implementation depends on your monitoring infrastructure
    const systemMetrics = {
      memoryUsage: process.memoryUsage?.()?.heapUsed || 0,
      cpuUsage: process.cpuUsage?.()?.user || 0,
    };

    // Record system metrics
    this.recordMetrics({
      templateId: 'system',
      timestamp: new Date(),
      renderTime: 0,
      htmlSize: 0,
      imageCount: 0,
      linkCount: 0,
      errorRate: 0,
      successRate: 100,
      memoryUsage: systemMetrics.memoryUsage,
      cpuUsage: systemMetrics.cpuUsage,
    });
  }

  // Check for alerts
  private checkAlerts(): void {
    const recentMetrics = this.getRecentMetrics(5); // Last 5 minutes
    if (recentMetrics.length === 0) return;

    // Check performance thresholds
    this.checkPerformanceAlerts(recentMetrics);
    
    // Check error rate
    this.checkErrorRateAlerts(recentMetrics);
    
    // Check capacity
    this.checkCapacityAlerts();
  }

  // Check performance alerts
  private checkPerformanceAlerts(metrics: EmailMetrics[]): void {
    const avgRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;
    const avgHtmlSize = metrics.reduce((sum, m) => sum + m.htmlSize, 0) / metrics.length;
    const avgImageCount = metrics.reduce((sum, m) => sum + m.imageCount, 0) / metrics.length;

    // Render time alert
    if (avgRenderTime > this.config.alertThresholds.renderTime) {
      this.createAlert({
        type: 'performance',
        severity: 'high',
        title: 'High Render Time',
        description: `Average render time is ${avgRenderTime.toFixed(2)}ms, exceeding threshold of ${this.config.alertThresholds.renderTime}ms`,
        threshold: this.config.alertThresholds.renderTime,
        currentValue: avgRenderTime,
      });
    }

    // HTML size alert
    if (avgHtmlSize > this.config.performanceThresholds.maxHtmlSize) {
      this.createAlert({
        type: 'performance',
        severity: 'medium',
        title: 'Large HTML Size',
        description: `Average HTML size is ${(avgHtmlSize / 1024).toFixed(2)}KB, exceeding threshold of ${(this.config.performanceThresholds.maxHtmlSize / 1024).toFixed(2)}KB`,
        threshold: this.config.performanceThresholds.maxHtmlSize,
        currentValue: avgHtmlSize,
      });
    }

    // Image count alert
    if (avgImageCount > this.config.performanceThresholds.maxImageCount) {
      this.createAlert({
        type: 'performance',
        severity: 'low',
        title: 'High Image Count',
        description: `Average image count is ${avgImageCount.toFixed(1)}, exceeding threshold of ${this.config.performanceThresholds.maxImageCount}`,
        threshold: this.config.performanceThresholds.maxImageCount,
        currentValue: avgImageCount,
      });
    }
  }

  // Check error rate alerts
  private checkErrorRateAlerts(metrics: EmailMetrics[]): void {
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;
    const avgSuccessRate = metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length;

    if (avgErrorRate > this.config.alertThresholds.errorRate) {
      this.createAlert({
        type: 'error',
        severity: 'critical',
        title: 'High Error Rate',
        description: `Error rate is ${avgErrorRate.toFixed(2)}%, exceeding threshold of ${this.config.alertThresholds.errorRate}%`,
        threshold: this.config.alertThresholds.errorRate,
        currentValue: avgErrorRate,
      });
    }

    if (avgSuccessRate < this.config.performanceThresholds.minSuccessRate) {
      this.createAlert({
        type: 'error',
        severity: 'high',
        title: 'Low Success Rate',
        description: `Success rate is ${avgSuccessRate.toFixed(2)}%, below threshold of ${this.config.performanceThresholds.minSuccessRate}%`,
        threshold: this.config.performanceThresholds.minSuccessRate,
        currentValue: avgSuccessRate,
      });
    }
  }

  // Check capacity alerts
  private checkCapacityAlerts(): void {
    const capacityMetrics = this.getCapacityMetrics();
    
    if (capacityMetrics.queueSize > this.config.alertThresholds.queueSize) {
      this.createAlert({
        type: 'capacity',
        severity: 'high',
        title: 'High Queue Size',
        description: `Queue size is ${capacityMetrics.queueSize}, exceeding threshold of ${this.config.alertThresholds.queueSize}`,
        threshold: this.config.alertThresholds.queueSize,
        currentValue: capacityMetrics.queueSize,
      });
    }

    if (capacityMetrics.memoryUsage > this.config.alertThresholds.memoryUsage) {
      this.createAlert({
        type: 'capacity',
        severity: 'critical',
        title: 'High Memory Usage',
        description: `Memory usage is ${capacityMetrics.memoryUsage.toFixed(2)}%, exceeding threshold of ${this.config.alertThresholds.memoryUsage}%`,
        threshold: this.config.alertThresholds.memoryUsage,
        currentValue: capacityMetrics.memoryUsage,
      });
    }
  }

  // Create alert
  private createAlert(alertData: Omit<EmailPerformanceAlert, 'id' | 'createdAt' | 'status'>): void {
    const alert: EmailPerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...alertData,
      createdAt: new Date(),
      status: 'active',
    };

    // Check if similar alert already exists
    const existingAlert = this.alerts.find(a => 
      a.type === alert.type && 
      a.templateId === alert.templateId && 
      a.status === 'active'
    );

    if (!existingAlert) {
      this.alerts.push(alert);
      this.notifyAlert(alert);
    }
  }

  // Notify alert
  private notifyAlert(alert: EmailPerformanceAlert): void {
    // Implement alert notification (email, Slack, etc.)
    logger.log(`🚨 Email Performance Alert: ${alert.title} - ${alert.description}`);
  }

  // Update quality scores
  private updateQualityScores(): void {
    const templateIds = [...new Set(this.metrics.map(m => m.templateId))];
    
    for (const templateId of templateIds) {
      const templateMetrics = this.metrics.filter(m => m.templateId === templateId);
      if (templateMetrics.length === 0) continue;

      const qualityScore = this.calculateQualityScore(templateId, templateMetrics);
      this.qualityScores.set(templateId, qualityScore);
    }
  }

  // Calculate quality score
  private calculateQualityScore(templateId: string, metrics: EmailMetrics[]): EmailQualityScore {
    const recentMetrics = metrics.slice(-10); // Last 10 metrics
    
    // Performance score (0-100)
    const avgRenderTime = recentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / recentMetrics.length;
    const performanceScore = Math.max(0, 100 - (avgRenderTime / this.config.performanceThresholds.maxRenderTime) * 100);
    
    // Accessibility score (placeholder - would need actual accessibility testing)
    const accessibilityScore = 85; // Placeholder
    
    // Compatibility score (placeholder - would need email client testing)
    const compatibilityScore = 90; // Placeholder
    
    // Design score (placeholder - would need design analysis)
    const designScore = 88; // Placeholder
    
    // Content score (placeholder - would need content analysis)
    const contentScore = 92; // Placeholder
    
    const overallScore = (performanceScore + accessibilityScore + compatibilityScore + designScore + contentScore) / 5;
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (performanceScore < 80) {
      recommendations.push('Optimize template rendering performance');
    }
    if (accessibilityScore < 80) {
      recommendations.push('Improve accessibility features');
    }
    if (compatibilityScore < 80) {
      recommendations.push('Test across more email clients');
    }
    if (designScore < 80) {
      recommendations.push('Review design consistency');
    }
    if (contentScore < 80) {
      recommendations.push('Improve content quality');
    }
    
    return {
      templateId,
      overallScore,
      performanceScore,
      accessibilityScore,
      compatibilityScore,
      designScore,
      contentScore,
      lastUpdated: new Date(),
      recommendations,
    };
  }

  // Get recent metrics
  private getRecentMetrics(minutes: number): EmailMetrics[] {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);
    return this.metrics.filter(m => m.timestamp > cutoffTime);
  }

  // Get capacity metrics
  private getCapacityMetrics(): EmailCapacityMetrics {
    // This would integrate with your queue system
    return {
      currentLoad: 0.7, // Placeholder
      maxCapacity: 1.0,
      queueSize: 150, // Placeholder
      processingTime: 250, // Placeholder
      throughput: 100, // Placeholder
      errorRate: 0.02, // Placeholder
      memoryUsage: 65, // Placeholder
      lastUpdated: new Date(),
    };
  }

  // Get performance report
  getPerformanceReport(templateId?: string): {
    metrics: EmailMetrics[];
    alerts: EmailPerformanceAlert[];
    qualityScores: EmailQualityScore[];
    capacityMetrics: EmailCapacityMetrics;
  } {
    const filteredMetrics = templateId 
      ? this.metrics.filter(m => m.templateId === templateId)
      : this.metrics;
    
    const qualityScores = templateId
      ? [this.qualityScores.get(templateId)].filter(Boolean) as EmailQualityScore[]
      : Array.from(this.qualityScores.values());
    
    return {
      metrics: filteredMetrics,
      alerts: this.alerts,
      qualityScores,
      capacityMetrics: this.getCapacityMetrics(),
    };
  }

  // Get active alerts
  getActiveAlerts(): EmailPerformanceAlert[] {
    return this.alerts.filter(a => a.status === 'active');
  }

  // Acknowledge alert
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
    }
  }

  // Resolve alert
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
    }
  }

  // Get quality score
  getQualityScore(templateId: string): EmailQualityScore | undefined {
    return this.qualityScores.get(templateId);
  }

  // Get all quality scores
  getAllQualityScores(): EmailQualityScore[] {
    return Array.from(this.qualityScores.values());
  }

  // Clear old data
  clearOldData(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod);
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffDate);
    this.alerts = this.alerts.filter(a => a.createdAt > cutoffDate);
  }
}

// Email Performance Dashboard
export class EmailPerformanceDashboard {
  private monitor: EmailPerformanceMonitor;

  constructor(monitor: EmailPerformanceMonitor) {
    this.monitor = monitor;
  }

  // Get dashboard data
  getDashboardData(): {
    overview: {
      totalEmails: number;
      successRate: number;
      averageRenderTime: number;
      activeAlerts: number;
    };
    performance: {
      renderTime: number[];
      htmlSize: number[];
      errorRate: number[];
      timestamps: string[];
    };
    quality: {
      overallScore: number;
      performanceScore: number;
      accessibilityScore: number;
      compatibilityScore: number;
      designScore: number;
      contentScore: number;
    };
    alerts: EmailPerformanceAlert[];
    recommendations: string[];
  } {
    const report = this.monitor.getPerformanceReport();
    const recentMetrics = report.metrics.slice(-24); // Last 24 data points
    
    const overview = {
      totalEmails: report.metrics.length,
      successRate: report.metrics.length > 0 
        ? report.metrics.reduce((sum, m) => sum + m.successRate, 0) / report.metrics.length
        : 0,
      averageRenderTime: report.metrics.length > 0
        ? report.metrics.reduce((sum, m) => sum + m.renderTime, 0) / report.metrics.length
        : 0,
      activeAlerts: report.alerts.filter(a => a.status === 'active').length,
    };

    const performance = {
      renderTime: recentMetrics.map(m => m.renderTime),
      htmlSize: recentMetrics.map(m => m.htmlSize),
      errorRate: recentMetrics.map(m => m.errorRate),
      timestamps: recentMetrics.map(m => m.timestamp.toISOString()),
    };

    const quality = report.qualityScores.length > 0
      ? {
          overallScore: report.qualityScores.reduce((sum, q) => sum + q.overallScore, 0) / report.qualityScores.length,
          performanceScore: report.qualityScores.reduce((sum, q) => sum + q.performanceScore, 0) / report.qualityScores.length,
          accessibilityScore: report.qualityScores.reduce((sum, q) => sum + q.accessibilityScore, 0) / report.qualityScores.length,
          compatibilityScore: report.qualityScores.reduce((sum, q) => sum + q.compatibilityScore, 0) / report.qualityScores.length,
          designScore: report.qualityScores.reduce((sum, q) => sum + q.designScore, 0) / report.qualityScores.length,
          contentScore: report.qualityScores.reduce((sum, q) => sum + q.contentScore, 0) / report.qualityScores.length,
        }
      : {
          overallScore: 0,
          performanceScore: 0,
          accessibilityScore: 0,
          compatibilityScore: 0,
          designScore: 0,
          contentScore: 0,
        };

    const recommendations = report.qualityScores.flatMap(q => q.recommendations);

    return {
      overview,
      performance,
      quality,
      alerts: report.alerts,
      recommendations: [...new Set(recommendations)], // Remove duplicates
    };
  }

  // Generate performance report
  generatePerformanceReport(): string {
    const dashboard = this.getDashboardData();
    
    let report = `# CribNosh Email Performance Report\n\n`;
    report += `## Overview\n`;
    report += `- Total Emails: ${dashboard.overview.totalEmails}\n`;
    report += `- Success Rate: ${dashboard.overview.successRate.toFixed(2)}%\n`;
    report += `- Average Render Time: ${dashboard.overview.averageRenderTime.toFixed(2)}ms\n`;
    report += `- Active Alerts: ${dashboard.overview.activeAlerts}\n\n`;
    
    report += `## Quality Scores\n`;
    report += `- Overall: ${dashboard.quality.overallScore.toFixed(1)}/100\n`;
    report += `- Performance: ${dashboard.quality.performanceScore.toFixed(1)}/100\n`;
    report += `- Accessibility: ${dashboard.quality.accessibilityScore.toFixed(1)}/100\n`;
    report += `- Compatibility: ${dashboard.quality.compatibilityScore.toFixed(1)}/100\n`;
    report += `- Design: ${dashboard.quality.designScore.toFixed(1)}/100\n`;
    report += `- Content: ${dashboard.quality.contentScore.toFixed(1)}/100\n\n`;
    
    if (dashboard.alerts.length > 0) {
      report += `## Active Alerts\n`;
      dashboard.alerts.forEach(alert => {
        report += `- **${alert.title}** (${alert.severity.toUpperCase()}): ${alert.description}\n`;
      });
      report += `\n`;
    }
    
    if (dashboard.recommendations.length > 0) {
      report += `## Recommendations\n`;
      dashboard.recommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });
    }
    
    return report;
  }
}

// Default configuration
export const defaultMonitoringConfig: EmailMonitoringConfig = {
  performanceThresholds: {
    maxRenderTime: 1000, // 1 second
    maxHtmlSize: 100000, // 100KB
    maxImageCount: 10,
    minSuccessRate: 95, // 95%
  },
  alertThresholds: {
    errorRate: 5, // 5%
    renderTime: 2000, // 2 seconds
    queueSize: 1000,
    memoryUsage: 80, // 80%
  },
  monitoringInterval: 60000, // 1 minute
  retentionPeriod: 30, // 30 days
};

// Singleton instance
export const emailPerformanceMonitor = new EmailPerformanceMonitor(defaultMonitoringConfig);
export const emailPerformanceDashboard = new EmailPerformanceDashboard(emailPerformanceMonitor);

export default EmailPerformanceMonitor;
