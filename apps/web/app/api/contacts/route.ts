import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';
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
 *       - bearerAuth: []
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
 *       - bearerAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (payload.role !== 'admin') {
      return ResponseFactory.forbidden('Forbidden: Only admins can access this endpoint.');
    }
    const convex = getConvexClient();
    // Pagination
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '') || DEFAULT_LIMIT;
    const offset = parseInt(searchParams.get('offset') || '') || 0;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    // Fetch all contact form submissions (contacts table)
    const allContacts = await convex.query(api.queries.contacts.getAll, {});
    // Consistent ordering (createdAt DESC)
    allContacts.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    const paginated = allContacts.slice(offset, offset + limit);
    return ResponseFactory.success({ contacts: paginated, total: allContacts.length, limit, offset });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch contacts.' );
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
    // Insert contact (generic insert)
    const contactId = await convex.mutation(api.mutations.contacts.create, {
      name,
      email,
      subject: subject || '',
      message,
      createdAt: Date.now(),
    });
    return ResponseFactory.success({ success: true, contactId });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to submit contact form.' );
  }
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (payload.role !== 'admin') {
      return ResponseFactory.forbidden('Forbidden: Only admins can delete contacts.');
    }
    const { contact_id } = await request.json();
    if (!contact_id) {
      return ResponseFactory.error('contact_id is required.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    await convex.mutation(api.mutations.contacts.deleteContact, { contactId: contact_id });
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'delete_contact',
      details: { contact_id },
      adminId: payload.user_id,
    });
    return ResponseFactory.success({ success: true });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to delete contact.' );
  }
}

async function handleBulkDelete(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (payload.role !== 'admin') {
      return ResponseFactory.forbidden('Forbidden: Only admins can bulk delete contacts.');
    }
    const { contact_ids } = await request.json();
    if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
      return ResponseFactory.error('contact_ids array is required.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    for (const contactId of contact_ids) {
      await convex.mutation(api.mutations.contacts.deleteContact, { contactId });
    }
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'bulk_delete_contacts',
      details: { contact_ids },
      adminId: payload.user_id,
    });
    return ResponseFactory.success({ success: true, deleted: contact_ids.length });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to bulk delete contacts.' );
  }
}

async function handleExport(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (payload.role !== 'admin') {
      return ResponseFactory.forbidden('Forbidden: Only admins can export contacts.');
    }
    const convex = getConvexClient();
    const allContacts = await convex.query(api.queries.contacts.getAll, {});
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'export_contacts',
      details: {},
      adminId: payload.user_id,
    });
    return ResponseFactory.jsonDownload(allContacts, 'contacts-export.json');
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to export contacts.' );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));
export const BULK_DELETE = withAPIMiddleware(withErrorHandling(handleBulkDelete));
export const EXPORT = withAPIMiddleware(withErrorHandling(handleExport)); 