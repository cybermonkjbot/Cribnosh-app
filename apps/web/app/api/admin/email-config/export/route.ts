/**
 * @swagger
 * /api/admin/email-config/export:
 *   get:
 *     summary: Export email configurations
 *     description: Export email templates and automation configurations in JSON or YAML format
 *     tags: [Admin - Email Configuration]
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration category to export (e.g., templates, automations)
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, yaml]
 *           default: json
 *         description: Export format
 *     responses:
 *       200:
 *         description: Configuration exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           text/yaml:
 *             schema:
 *               type: string
 *       400:
 *         description: Validation error - Missing category or invalid format
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */

import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { emailAdminConfigManager } from '@/lib/email/admin-config';

// GET /api/admin/email-config/export - Export email configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const format = searchParams.get('format') || 'json';

    if (!category) {
      return ResponseFactory.validationError('Category is required');
    }

    const configData = await emailAdminConfigManager.exportConfig(category);

    if (format === 'json') {
      return ResponseFactory.fileDownload(
        configData,
        `email-${category}-config.json`,
        'application/json'
      );
    } else if (format === 'yaml') {
      // Convert JSON to YAML (you'd need a YAML library for this)
      return ResponseFactory.fileDownload(
        configData,
        `email-${category}-config.yaml`,
        'text/yaml'
      );
    } else {
      return ResponseFactory.validationError('Invalid format. Supported formats: json, yaml');
    }
  } catch (error) {
    console.error('Error exporting email configurations:', error);
    return ResponseFactory.error('Failed to export email configurations', 'CUSTOM_ERROR', 500);
  }
}
