import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: Get Contact Form Submissions (Admin)
 *     description: Retrieve contact form submissions with pagination for administrative review
 *     tags: [Admin, Contacts]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of contacts to return
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of contacts to skip
 *         example: 0
 *     responses:
 *       200:
 *         description: Contact submissions retrieved successfully
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
 *                     contacts:
 *                       type: array
 *                       description: Array of contact form submissions
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Contact ID
 *                             example: "j1234567890abcdef"
 *                           name:
 *                             type: string
 *                             description: Contact name
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             format: email
 *                             description: Contact email
 *                             example: "john@example.com"
 *                           subject:
 *                             type: string
 *                             description: Contact subject
 *                             example: "Question about service"
 *                           message:
 *                             type: string
 *                             description: Contact message
 *                             example: "I have a question about your service..."
 *                           createdAt:
 *                             type: number
 *                             description: Creation timestamp
 *                             example: 1640995200000
 *                           status:
 *                             type: string
 *                             enum: [new, read, replied, closed]
 *                             description: Contact status
 *                             example: "new"
 *                     total:
 *                       type: number
 *                       description: Total number of contacts
 *                       example: 150
 *                     limit:
 *                       type: number
 *                       description: Number of contacts per page
 *                       example: 20
 *                     offset:
 *                       type: number
 *                       description: Number of contacts skipped
 *                       example: 0
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only admins can access contacts
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
 *     security:
 *       - cookieAuth: []
 *   post:
 *     summary: Submit Contact Form
 *     description: Submit a contact form with name, email, subject, and message
 *     tags: [Contacts, Forms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 description: Contact name
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *                 example: "john@example.com"
 *               subject:
 *                 type: string
 *                 nullable: true
 *                 description: Contact subject
 *                 example: "Question about service"
 *               message:
 *                 type: string
 *                 description: Contact message
 *                 example: "I have a question about your service..."
 *     responses:
 *       200:
 *         description: Contact form submitted successfully
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
 *                     contactId:
 *                       type: string
 *                       description: Created contact ID
 *                       example: "j1234567890abcdef"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       422:
 *         description: Validation error - missing required fields or invalid email
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
 *     summary: Delete Contact (Admin)
 *     description: Delete a specific contact form submission
 *     tags: [Admin, Contacts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contact_id
 *             properties:
 *               contact_id:
 *                 type: string
 *                 description: Contact ID to delete
 *                 example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Contact deleted successfully
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
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only admins can delete contacts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Validation error - missing contact_id
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
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);
    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    // Pagination
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '') || DEFAULT_LIMIT;
    const offset = parseInt(searchParams.get('offset') || '') || 0;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    // Use paginated query instead of fetch-all-then-slice
    const paginated = await convex.query(api.queries.contacts.getAll, {
      limit,
      offset
    });
    // Get total count for pagination info (query already handles sorting)
    const allContacts = await convex.query(api.queries.contacts.getAll, {});
    return ResponseFactory.success({ contacts: paginated, total: allContacts.length, limit, offset });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { name, email, subject, message } = await request.json();
    if (!name || !email || !message) {
      return ResponseFactory.error('Name, email, and message are required.', 'CUSTOM_ERROR', 422);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ResponseFactory.error('Invalid email format.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    // Insert contact (generic insert)
    const contactId = await convex.mutation(api.mutations.contacts.create, {
      name,
      email,
      subject: subject || '',
      message,
      createdAt: Date.now(),
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success({ success: true, contactId });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);
    const { contact_id } = await request.json();
    if (!contact_id) {
      return ResponseFactory.error('contact_id is required.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    await convex.mutation(api.mutations.contacts.deleteContact, {
      contactId: contact_id,
      sessionToken: sessionToken || undefined
    });
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'delete_contact',
      details: { contact_id },
      adminId: userId,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

async function handleBulkDelete(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);
    const { contact_ids } = await request.json();
    if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
      return ResponseFactory.error('contact_ids array is required.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    for (const contactId of contact_ids) {
      await convex.mutation(api.mutations.contacts.deleteContact, {
        contactId,
        sessionToken: sessionToken || undefined
      });
    }
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'bulk_delete_contacts',
      details: { contact_ids },
      adminId: userId,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success({ success: true, deleted: contact_ids.length });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

async function handleExport(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);
    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    const allContacts = await convex.query(api.queries.contacts.getAll, {
      sessionToken: sessionToken || undefined
    });
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'export_contacts',
      details: {},
      adminId: userId,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.jsonDownload(allContacts, 'contacts-export.json');
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));
export const BULK_DELETE = withAPIMiddleware(withErrorHandling(handleBulkDelete));
export const EXPORT = withAPIMiddleware(withErrorHandling(handleExport)); 