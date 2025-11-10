import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { emailAdminConfigManager } from '@/lib/email/admin-config';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /admin/email-config:
 *   get:
 *     summary: Get Email Configuration (Admin)
 *     description: Retrieve email configuration settings for templates, automations, branding, delivery, analytics, and compliance. Supports filtering by category and specific configuration ID.
 *     tags: [Admin, System Operations, Email]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [templates, automations, branding, delivery, analytics, compliance]
 *         description: Email configuration category to retrieve
 *         example: "templates"
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Specific configuration ID (requires category parameter)
 *         example: "welcome-email-template"
 *     responses:
 *       200:
 *         description: Email configuration retrieved successfully
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
 *                     config:
 *                       type: object
 *                       description: Single configuration object (when id parameter provided)
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Configuration ID
 *                           example: "welcome-email-template"
 *                         name:
 *                           type: string
 *                           description: Configuration name
 *                           example: "Welcome Email Template"
 *                         content:
 *                           type: object
 *                           description: Configuration content and settings
 *                           example: {"subject": "Welcome to CribNosh!", "body": "Thank you for joining..."}
 *                         category:
 *                           type: string
 *                           description: Configuration category
 *                           example: "templates"
 *                         isActive:
 *                           type: boolean
 *                           description: Whether configuration is active
 *                           example: true
 *                         lastModified:
 *                           type: string
 *                           format: date-time
 *                           description: Last modification timestamp
 *                           example: "2024-01-15T10:30:00Z"
 *                     configs:
 *                       type: array
 *                       description: Array of configuration objects (when category parameter provided or all configs)
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Configuration ID
 *                             example: "welcome-email-template"
 *                           name:
 *                             type: string
 *                             description: Configuration name
 *                             example: "Welcome Email Template"
 *                           content:
 *                             type: object
 *                             description: Configuration content and settings
 *                           category:
 *                             type: string
 *                             description: Configuration category
 *                             example: "templates"
 *                           isActive:
 *                             type: boolean
 *                             description: Whether configuration is active
 *                             example: true
 *                           lastModified:
 *                             type: string
 *                             format: date-time
 *                             description: Last modification timestamp
 *                             example: "2024-01-15T10:30:00Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - invalid category or missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Configuration not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 *   post:
 *     summary: Create Email Configuration (Admin)
 *     description: Create or update email configuration settings. This endpoint allows administrators to manage email templates, automations, branding, delivery settings, analytics, and compliance configurations.
 *     tags: [Admin, System Operations, Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - configId
 *               - config
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [templates, automations, branding, delivery, analytics, compliance]
 *                 description: Email configuration category
 *                 example: "templates"
 *               configId:
 *                 type: string
 *                 description: Unique identifier for the configuration
 *                 example: "welcome-email-template"
 *               config:
 *                 type: object
 *                 description: Configuration content and settings
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Configuration display name
 *                     example: "Welcome Email Template"
 *                   content:
 *                     type: object
 *                     description: Configuration-specific content
 *                     example: {"subject": "Welcome to CribNosh!", "body": "Thank you for joining..."}
 *                   isActive:
 *                     type: boolean
 *                     description: Whether configuration is active
 *                     example: true
 *                   metadata:
 *                     type: object
 *                     additionalProperties: true
 *                     description: Additional configuration metadata
 *                     example: {"version": "1.0", "author": "admin"}
 *     responses:
 *       200:
 *         description: Email configuration created/updated successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Configuration updated successfully"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing required fields or invalid category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 *   put:
 *     summary: Update Email Configuration (Admin)
 *     description: Update email configuration with validation. This endpoint performs validation checks before updating configurations and returns warnings for potential issues.
 *     tags: [Admin, System Operations, Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - configId
 *               - config
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [templates, automations, branding, delivery, analytics, compliance]
 *                 description: Email configuration category
 *                 example: "templates"
 *               configId:
 *                 type: string
 *                 description: Unique identifier for the configuration
 *                 example: "welcome-email-template"
 *               config:
 *                 type: object
 *                 description: Updated configuration content and settings
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Configuration display name
 *                     example: "Welcome Email Template"
 *                   content:
 *                     type: object
 *                     description: Configuration-specific content
 *                     example: {"subject": "Welcome to CribNosh!", "body": "Thank you for joining..."}
 *                   isActive:
 *                     type: boolean
 *                     description: Whether configuration is active
 *                     example: true
 *                   metadata:
 *                     type: object
 *                     additionalProperties: true
 *                     description: Additional configuration metadata
 *                     example: {"version": "1.1", "author": "admin"}
 *     responses:
 *       200:
 *         description: Email configuration updated successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Configuration updated successfully"
 *                     warnings:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Validation warnings (if any)
 *                       example: ["Template contains placeholder that may not be replaced"]
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing required fields, invalid category, or validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 *   delete:
 *     summary: Delete Email Configuration (Admin)
 *     description: Delete email configuration. Note that branding, delivery, analytics, and compliance configurations cannot be deleted and can only be updated.
 *     tags: [Admin, System Operations, Email]
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [templates, automations, branding, delivery, analytics, compliance]
 *         description: Email configuration category
 *         example: "templates"
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration ID to delete
 *         example: "welcome-email-template"
 *     responses:
 *       200:
 *         description: Email configuration deleted successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Configuration deleted successfully"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing required parameters or configuration type cannot be deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */

// GET /api/admin/email-config - Get all email configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const configId = searchParams.get('id');

    if (configId && category) {
      // Get specific configuration
      let config;
      switch (category) {
        case 'templates':
          config = await emailAdminConfigManager.getTemplateConfig(configId);
          break;
        case 'automations':
          config = await emailAdminConfigManager.getAutomationConfig(configId);
          break;
        case 'branding':
          config = await emailAdminConfigManager.getBrandingConfig(configId);
          break;
        case 'delivery':
          config = await emailAdminConfigManager.getDeliveryConfig(configId);
          break;
        case 'analytics':
          config = await emailAdminConfigManager.getAnalyticsConfig(configId);
          break;
        case 'compliance':
          config = await emailAdminConfigManager.getComplianceConfig(configId);
          break;
        default:
          return ResponseFactory.validationError('Invalid category');
      }

      if (!config) {
        return ResponseFactory.notFound('Configuration not found');
      }

      return ResponseFactory.success({ config });
    } else if (category) {
      // Get all configurations for a category
      let configs;
      switch (category) {
        case 'templates':
          configs = await emailAdminConfigManager.getAllTemplateConfigs();
          break;
        case 'automations':
          configs = await emailAdminConfigManager.getAllAutomationConfigs();
          break;
        case 'branding':
          configs = await emailAdminConfigManager.getAllBrandingConfigs();
          break;
        case 'delivery':
          configs = await emailAdminConfigManager.getAllDeliveryConfigs();
          break;
        case 'analytics':
          configs = await emailAdminConfigManager.getAllAnalyticsConfigs();
          break;
        case 'compliance':
          configs = await emailAdminConfigManager.getAllComplianceConfigs();
          break;
        default:
          return ResponseFactory.validationError('Invalid category');
      }

      return ResponseFactory.success({ configs });
    } else {
      // Get all configurations
      const allConfigs = await emailAdminConfigManager.getAllConfigs();
      return ResponseFactory.success({ configs: allConfigs });
    }
  } catch (error) {
    logger.error('Error fetching email configurations:', error);
    return ResponseFactory.error('Failed to fetch email configurations', 'CUSTOM_ERROR', 500);
  }
}

// POST /api/admin/email-config - Create or update email configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, configId, config } = body;

    if (!category || !configId || !config) {
      return ResponseFactory.validationError('Category, configId, and config are required');
    }

    switch (category) {
      case 'templates':
        await emailAdminConfigManager.updateTemplateConfig(configId, config);
        break;
      case 'automations':
        await emailAdminConfigManager.updateAutomationConfig(configId, config);
        break;
      case 'branding':
        await emailAdminConfigManager.updateBrandingConfig(configId, config);
        break;
      case 'delivery':
        await emailAdminConfigManager.updateDeliveryConfig(configId, config);
        break;
      case 'analytics':
        await emailAdminConfigManager.updateAnalyticsConfig(configId, config);
        break;
      case 'compliance':
        await emailAdminConfigManager.updateComplianceConfig(configId, config);
        break;
      default:
        return ResponseFactory.validationError('Invalid category');
    }

    return ResponseFactory.success({ success: true, message: 'Configuration updated successfully' });
  } catch (error) {
    logger.error('Error updating email configuration:', error);
    return ResponseFactory.error('Failed to update email configuration', 'CUSTOM_ERROR', 500);
  }
}

// PUT /api/admin/email-config - Update email configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, configId, config } = body;

    if (!category || !configId || !config) {
      return ResponseFactory.validationError('Category, configId, and config are required');
    }

    // Validate configuration
    let validation;
    switch (category) {
      case 'templates':
        validation = await emailAdminConfigManager.validateTemplateConfig(config);
        break;
      case 'automations':
        validation = await emailAdminConfigManager.validateAutomationConfig(config);
        break;
      default:
        validation = { valid: true, errors: [], warnings: [] };
    }

    if (!validation.valid) {
      return ResponseFactory.validationError('Configuration validation failed');
    }

    // Update configuration
    switch (category) {
      case 'templates':
        await emailAdminConfigManager.updateTemplateConfig(configId, config);
        break;
      case 'automations':
        await emailAdminConfigManager.updateAutomationConfig(configId, config);
        break;
      case 'branding':
        await emailAdminConfigManager.updateBrandingConfig(configId, config);
        break;
      case 'delivery':
        await emailAdminConfigManager.updateDeliveryConfig(configId, config);
        break;
      case 'analytics':
        await emailAdminConfigManager.updateAnalyticsConfig(configId, config);
        break;
      case 'compliance':
        await emailAdminConfigManager.updateComplianceConfig(configId, config);
        break;
      default:
        return ResponseFactory.validationError('Invalid category');
    }

    return ResponseFactory.success({ 
      success: true, 
      message: 'Configuration updated successfully',
      warnings: validation.warnings
    });
  } catch (error) {
    logger.error('Error updating email configuration:', error);
    return ResponseFactory.error('Failed to update email configuration', 'CUSTOM_ERROR', 500);
  }
}

// DELETE /api/admin/email-config - Delete email configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const configId = searchParams.get('id');

    if (!category || !configId) {
      return ResponseFactory.validationError('Category and configId are required');
    }

    switch (category) {
      case 'templates':
        await emailAdminConfigManager.deleteTemplateConfig(configId);
        break;
      case 'automations':
        await emailAdminConfigManager.deleteAutomationConfig(configId);
        break;
      case 'branding':
        // Branding configs cannot be deleted, only updated
        return ResponseFactory.validationError('Branding configurations cannot be deleted');
      case 'delivery':
        // Delivery configs cannot be deleted, only updated
        return ResponseFactory.validationError('Delivery configurations cannot be deleted');
      case 'analytics':
        // Analytics configs cannot be deleted, only updated
        return ResponseFactory.validationError('Analytics configurations cannot be deleted');
      case 'compliance':
        // Compliance configs cannot be deleted, only updated
        return ResponseFactory.validationError('Compliance configurations cannot be deleted');
      default:
        return ResponseFactory.validationError('Invalid category');
    }

    return ResponseFactory.success({ success: true, message: 'Configuration deleted successfully' });
  } catch (error) {
    logger.error('Error deleting email configuration:', error);
    return ResponseFactory.error('Failed to delete email configuration', 'CUSTOM_ERROR', 500);
  }
}
