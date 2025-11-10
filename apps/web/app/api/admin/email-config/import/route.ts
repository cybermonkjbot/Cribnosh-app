/**
 * @swagger
 * /api/admin/email-config/import:
 *   post:
 *     summary: Import email configurations
 *     description: Import email templates or automation configurations from a JSON file
 *     tags: [Admin - Email Configuration]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - category
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: JSON configuration file to import
 *               category:
 *                 type: string
 *                 enum: [templates, automations]
 *                 description: Configuration category
 *               overwrite:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to overwrite existing configurations
 *     responses:
 *       200:
 *         description: Configurations imported successfully
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
 *                       example: "Successfully imported 5 configurations"
 *                     imported:
 *                       type: number
 *                       description: Number of configurations imported
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - Missing file/category or invalid JSON
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */

import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { emailAdminConfigManager } from '@/lib/email/admin-config';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

// POST /api/admin/email-config/import - Import email configurations
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const overwrite = formData.get('overwrite') === 'true';

    if (!file || !category) {
      return ResponseFactory.validationError('File and category are required');
    }

    const fileContent = await file.text();
    let configData;

    try {
      configData = JSON.parse(fileContent);
    } catch (parseError) {
      return ResponseFactory.validationError('Invalid JSON file format');
    }

    // Validate the imported data
    if (!Array.isArray(configData)) {
      return ResponseFactory.validationError('Configuration file must contain an array of configurations');
    }

    // Import configurations
    await emailAdminConfigManager.importConfig(category, fileContent);

    return ResponseFactory.success({
      success: true,
      message: `Successfully imported ${configData.length} configurations`,
      imported: configData.length,
    });
  } catch (error) {
    logger.error('Error importing email configurations:', error);
    return ResponseFactory.error('Failed to import email configurations', 'CUSTOM_ERROR', 500);
  }
}
