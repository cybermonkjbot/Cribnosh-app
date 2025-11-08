/**
 * @swagger
 * components:
 *   schemas:
 *     AlertRule:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the alert rule
 *         name:
 *           type: string
 *           description: Name of the alert rule
 *         metric:
 *           type: string
 *           description: Metric name to monitor
 *         condition:
 *           type: string
 *           enum: [gt, lt, eq, gte, lte]
 *           description: Condition operator
 *         threshold:
 *           type: number
 *           description: Threshold value
 *         severity:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           description: Alert severity level
 *         enabled:
 *           type: boolean
 *           description: Whether the rule is enabled
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Rule creation timestamp
 *     Alert:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the alert
 *         ruleId:
 *           type: string
 *           description: Associated alert rule ID
 *         metric:
 *           type: string
 *           description: Metric name
 *         value:
 *           type: number
 *           description: Current metric value
 *         threshold:
 *           type: number
 *           description: Threshold that was exceeded
 *         severity:
 *           type: string
 *           description: Alert severity
 *         status:
 *           type: string
 *           enum: [active, resolved, acknowledged]
 *           description: Alert status
 *         triggeredAt:
 *           type: string
 *           format: date-time
 *           description: When the alert was triggered
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the alert was resolved
 *     AlertActionRequest:
 *       type: object
 *       required:
 *         - action
 *       properties:
 *         action:
 *           type: string
 *           enum: [add_rule, update_rule, delete_rule, resolve_alert, test_rule]
 *           description: Action to perform
 *         data:
 *           type: object
 *           description: Action-specific data
 */

import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { monitoringService, AlertRule } from '@/lib/monitoring/monitor';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/monitoring/alerts:
 *   get:
 *     summary: Get monitoring alerts
 *     description: Retrieve active alerts or alert rules for system monitoring
 *     tags: [Monitoring]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [active, rules]
 *           default: active
 *         description: Type of data to retrieve (active alerts or alert rules)
 *     responses:
 *       200:
 *         description: Alerts or rules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "success"
 *                     data:
 *                       oneOf:
 *                         - type: array
 *                           items:
 *                             $ref: '#/components/schemas/Alert'
 *                         - type: array
 *                           items:
 *                             $ref: '#/components/schemas/AlertRule'
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Manage monitoring alerts
 *     description: Perform various actions on monitoring alerts and rules
 *     tags: [Monitoring]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertActionRequest'
 *     responses:
 *       200:
 *         description: Action completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "success"
 *                     message:
 *                       type: string
 *                       example: "Alert rule added successfully"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Invalid action or missing parameters
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update alert rule
 *     description: Update an existing alert rule
 *     tags: [Monitoring]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ruleId
 *               - updates
 *             properties:
 *               ruleId:
 *                 type: string
 *                 description: ID of the rule to update
 *               updates:
 *                 type: object
 *                 description: Updates to apply to the rule
 *     responses:
 *       200:
 *         description: Alert rule updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "success"
 *                     message:
 *                       type: string
 *                       example: "Alert rule updated successfully"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete alert rule or resolve alert
 *     description: Delete an alert rule or resolve an active alert
 *     tags: [Monitoring]
 *     parameters:
 *       - in: query
 *         name: ruleId
 *         schema:
 *           type: string
 *         description: ID of the alert rule to delete
 *       - in: query
 *         name: alertId
 *         schema:
 *           type: string
 *         description: ID of the alert to resolve
 *     responses:
 *       200:
 *         description: Action completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "success"
 *                     message:
 *                       type: string
 *                       example: "Alert rule deleted successfully"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Missing ruleId or alertId parameter
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'active' or 'rules'

    if (type === 'rules') {
      // Get alert rules
      const rules = await monitoringService.getAlertRules();
      
      return ResponseFactory.success({
        status: 'success',
        data: rules,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Get active alerts
      const alerts = await monitoringService.getActiveAlerts();
      
      return ResponseFactory.success({
        status: 'success',
        data: alerts,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Failed to get alerts:', error);
    
    return ResponseFactory.internalError('Failed to get alerts');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'add_rule':
        // Add new alert rule
        await monitoringService.addAlertRule(data as AlertRule);
        return ResponseFactory.success({
          status: 'success',
          message: 'Alert rule added successfully',
        });

      case 'update_rule':
        // Update existing alert rule
        const { ruleId, updates } = data;
        await monitoringService.updateAlertRule(ruleId, updates);
        return ResponseFactory.success({
          status: 'success',
          message: 'Alert rule updated successfully',
        });

      case 'delete_rule':
        // Delete alert rule
        await monitoringService.deleteAlertRule(data.ruleId);
        return ResponseFactory.success({
          status: 'success',
          message: 'Alert rule deleted successfully',
        });

      case 'resolve_alert':
        // Resolve an alert
        await monitoringService.resolveAlert(data.alertId);
        return ResponseFactory.success({
          status: 'success',
          message: 'Alert resolved successfully',
        });

      case 'test_rule':
        // Test an alert rule with sample data
        const testRule = data as AlertRule;
        const testMetric = {
          name: testRule.metric,
          value: testRule.threshold + (testRule.condition === 'gt' ? 1 : -1),
          tags: { test: 'true' },
        };
        
        await monitoringService.recordMetric(testMetric);
        return ResponseFactory.success({
          status: 'success',
          message: 'Alert rule tested successfully',
        });

      default:
        return ResponseFactory.error('Invalid action', 'INVALID_ACTION', 400);
    }
  } catch (error) {
    logger.error('Failed to manage alerts:', error);
    
    return ResponseFactory.internalError('Failed to manage alerts');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleId, updates } = body;

    await monitoringService.updateAlertRule(ruleId, updates);
    
    return ResponseFactory.success({
      status: 'success',
      message: 'Alert rule updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update alert rule:', error);
    
    return ResponseFactory.internalError('Failed to update alert rule');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const ruleId = url.searchParams.get('ruleId');
    const alertId = url.searchParams.get('alertId');

    if (ruleId) {
      // Delete alert rule
      await monitoringService.deleteAlertRule(ruleId);
      return ResponseFactory.success({
        status: 'success',
        message: 'Alert rule deleted successfully',
      });
    } else if (alertId) {
      // Resolve alert
      await monitoringService.resolveAlert(alertId);
      return ResponseFactory.success({
        status: 'success',
        message: 'Alert resolved successfully',
      });
    } else {
      return ResponseFactory.error('Missing ruleId or alertId parameter', 'MISSING_PARAMETER', 400);
    }
  } catch (error) {
    logger.error('Failed to delete/resolve:', error);
    
    return ResponseFactory.internalError('Failed to delete/resolve');
  }
} 