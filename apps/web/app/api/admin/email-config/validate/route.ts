/**
 * @swagger
 * /api/admin/email-config/validate:
 *   post:
 *     summary: Validate email configuration
 *     description: Validate email templates or automation configurations before saving
 *     tags: [Admin - Email Configuration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - config
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [templates, automations]
 *                 description: Configuration category to validate
 *               config:
 *                 type: object
 *                 description: Configuration object to validate
 *     responses:
 *       200:
 *         description: Validation completed successfully
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
 *                     valid:
 *                       type: boolean
 *                       description: Whether the configuration is valid
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Validation errors
 *                     warnings:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Validation warnings
 *                     score:
 *                       type: number
 *                       description: Validation score (0-100)
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - Missing required fields
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */

import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { emailAdminConfigManager } from '@/lib/email/admin-config';

// POST /api/admin/email-config/validate - Validate email configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, config } = body;

    if (!category || !config) {
      return ResponseFactory.validationError('Category and config are required');
    }

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

    return ResponseFactory.success({
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      score: validation.valid ? 100 : Math.max(0, 100 - (validation.errors.length * 20)),
    });
  } catch (error) {
    console.error('Error validating email configuration:', error);
    return ResponseFactory.error('Failed to validate email configuration', 'CUSTOM_ERROR', 500);
  }
}
