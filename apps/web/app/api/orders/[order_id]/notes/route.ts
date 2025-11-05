import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

interface AddNoteRequest {
  note: string;
  noteType: 'chef_note' | 'customer_note' | 'internal_note';
  metadata?: Record<string, string>;
}

/**
 * @swagger
 * /orders/{order_id}/notes:
 *   post:
 *     summary: Add Order Note
 *     description: Add a note to an order (chef notes, customer notes, or internal notes)
 *     tags: [Orders, Order Management, Notes]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: "ORD-12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - note
 *               - noteType
 *             properties:
 *               note:
 *                 type: string
 *                 description: Note content
 *                 example: "Customer requested extra spicy sauce"
 *               noteType:
 *                 type: string
 *                 enum: [chef_note, customer_note, internal_note]
 *                 description: Type of note
 *                 example: "chef_note"
 *               metadata:
 *                 type: object
 *                 description: Additional note metadata
 *                 example: {"priority": "normal", "visibility": "chef_only"}
 *     responses:
 *       200:
 *         description: Note added successfully
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
 *                     noteId:
 *                       type: string
 *                       description: Generated note ID
 *                       example: "NOTE-12345"
 *                     orderId:
 *                       type: string
 *                       example: "ORD-12345"
 *                     note:
 *                       type: string
 *                       example: "Customer requested extra spicy sauce"
 *                     noteType:
 *                       type: string
 *                       example: "chef_note"
 *                     authorId:
 *                       type: string
 *                       description: ID of the note author
 *                       example: "j1234567890abcdef"
 *                     authorRole:
 *                       type: string
 *                       description: Role of the note author
 *                       example: "chef"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: When the note was added
 *                       example: "2024-01-15T10:00:00.000Z"
 *                     metadata:
 *                       type: object
 *                       example: {"priority": "normal"}
 *                 message:
 *                   type: string
 *                   example: "Note added successfully"
 *       400:
 *         description: Validation error - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions to add notes for this order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
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
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
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

    // Extract order_id from URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/orders\/([^\/]+)\/notes/);
    const order_id = match ? match[1] : undefined;

    if (!order_id) {
      return ResponseFactory.validationError('Missing order_id parameter.');
    }

    const body: AddNoteRequest = await request.json();
    const { note, noteType, metadata } = body;

    if (!note || !noteType) {
      return ResponseFactory.validationError('Missing required fields: note and noteType.');
    }

    // Validate note type permissions
    if (noteType === 'internal_note' && !['admin', 'staff'].includes(payload.role)) {
      return ResponseFactory.forbidden('Forbidden: Only admin and staff can add internal notes.');
    }

    const convex = getConvexClient();

    // Get order details first to verify permissions
    const order = await convex.query(api.queries.orders.getOrderById, { orderId: order_id as any });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Verify user has permission to add notes to this specific order
    if (payload.role === 'customer' && order.customer_id !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only add notes to your own orders.');
    }
    if (payload.role === 'chef' && order.chef_id !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only add notes to your own orders.');
    }

    // Check if order can have notes added (not completed or cancelled)
    if (['completed', 'cancelled'].includes(order.order_status)) {
      return ResponseFactory.validationError('Notes cannot be added. Current status: ${order.order_status}.');
    }

    // Add note to order
    const updatedOrder = await convex.mutation(api.mutations.orders.addOrderNote, {
      orderId: order._id,
      addedBy: payload.user_id,
      note,
      noteType,
      metadata: {
        addedByRole: payload.role,
        ...metadata
      }
    });

    console.log(`Note added to order ${order_id} by ${payload.user_id} (${payload.role})`);

    return ResponseFactory.success({
      success: true,
      orderId: order_id,
      note: {
        id: Date.now().toString(), // Temporary ID for response
        note,
        noteType,
        addedBy: payload.user_id,
        addedByRole: payload.role,
        addedAt: new Date().toISOString(),
        metadata: metadata || {}
      },
      message: 'Note added successfully.'
    });

  } catch (error: any) {
    console.error('Add order note error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to add note to order.' 
    );
  }
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
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

    // Extract order_id from URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/orders\/([^\/]+)\/notes/);
    const order_id = match ? match[1] : undefined;

    if (!order_id) {
      return ResponseFactory.validationError('Missing order_id parameter.');
    }

    const convex = getConvexClient();

    // Get order details first to verify permissions
    const order = await convex.query(api.queries.orders.getOrderById, { orderId: order_id as any });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Verify user has permission to view this specific order
    if (payload.role === 'customer' && order.customer_id !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only view your own orders.');
    }
    if (payload.role === 'chef' && order.chef_id !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only view your own orders.');
    }

    // Get order notes
    const notes = await convex.query(api.queries.orders.getOrderNotes, { orderId: order_id as any });

    // Filter notes based on user role
    let filteredNotes = notes;
    if (payload.role === 'customer') {
      // Customers can only see customer notes and chef notes
      filteredNotes = notes.filter((note: any) => note.noteType !== 'internal_note');
    } else if (payload.role === 'chef') {
      // Chefs can only see chef notes and customer notes
      filteredNotes = notes.filter((note: any) => note.noteType !== 'internal_note');
    }
    // Admin and staff can see all notes

    // Format notes
    const formattedNotes = filteredNotes.map((note: any) => ({
      id: note._id,
      note: note.note,
      noteType: note.noteType,
      addedBy: note.added_by,
      addedAt: new Date(note.added_at).toISOString(),
      metadata: note.metadata || {}
    }));

    return ResponseFactory.success({
      success: true,
      orderId: order_id,
      notes: formattedNotes,
      totalNotes: formattedNotes.length
    });

  } catch (error: any) {
    console.error('Get order notes error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to get order notes.' 
    );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 