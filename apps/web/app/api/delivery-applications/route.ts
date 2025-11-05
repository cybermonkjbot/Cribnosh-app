/**
 * @swagger
 * components:
 *   schemas:
 *     DeliveryApplication:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the delivery application
 *         name:
 *           type: string
 *           description: Full name of the applicant
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the applicant
 *         vehicle:
 *           type: string
 *           description: Vehicle information
 *         vehicleType:
 *           type: string
 *           description: Type of vehicle (car, motorcycle, bicycle, etc.)
 *         experience:
 *           type: string
 *           description: Previous delivery experience
 *         status:
 *           type: string
 *           description: Application status
 *         createdAt:
 *           type: number
 *           description: Timestamp when application was created
 *         updatedAt:
 *           type: number
 *           description: Timestamp when application was last updated
 *     DeliveryApplicationList:
 *       type: object
 *       properties:
 *         delivery_applications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DeliveryApplication'
 *         total:
 *           type: number
 *           description: Total number of applications
 *         limit:
 *           type: number
 *           description: Number of applications per page
 *         offset:
 *           type: number
 *           description: Number of applications skipped
 *     DeliveryApplicationRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - vehicle
 *       properties:
 *         name:
 *           type: string
 *           description: Full name of the applicant
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the applicant
 *         vehicle:
 *           type: string
 *           description: Vehicle information
 *         experience:
 *           type: string
 *           description: Previous delivery experience
 *     DeliveryApplicationUpdate:
 *       type: object
 *       required:
 *         - application_id
 *         - status
 *       properties:
 *         application_id:
 *           type: string
 *           description: ID of the application to update
 *         status:
 *           type: string
 *           description: New status for the application
 *     DeliveryApplicationDelete:
 *       type: object
 *       required:
 *         - application_id
 *       properties:
 *         application_id:
 *           type: string
 *           description: ID of the application to delete
 *     BulkDeleteRequest:
 *       type: object
 *       required:
 *         - application_ids
 *       properties:
 *         application_ids:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of application IDs to delete
 */

import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling, apiErrorHandler } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * @swagger
 * /api/delivery-applications:
 *   get:
 *     summary: Get all delivery applications
 *     description: Retrieve a paginated list of all delivery applications (admin only)
 *     tags: [Delivery Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of applications to return per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of applications to skip
 *     responses:
 *       200:
 *         description: Successfully retrieved delivery applications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryApplicationList'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
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
    // Fetch all delivery applications (assuming a 'drivers' table)
    const allApplications = await convex.query(api.queries.drivers.getAll, {});
    // Consistent ordering (createdAt DESC)
    allApplications.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    const paginated = allApplications.slice(offset, offset + limit);
    return ResponseFactory.success({ delivery_applications: paginated, total: allApplications.length, limit, offset });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch delivery applications.' );
  }
}

/**
 * @swagger
 * /api/delivery-applications:
 *   post:
 *     summary: Submit a delivery application
 *     description: Submit a new delivery driver application
 *     tags: [Delivery Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryApplicationRequest'
 *     responses:
 *       200:
 *         description: Application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 applicationId:
 *                   type: string
 *                   description: ID of the created application
 *       422:
 *         description: Validation error - Missing required fields or invalid email
 *       500:
 *         description: Internal server error
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { name, email, vehicle, experience } = await request.json();
    if (!name || !email || !vehicle) {
      return ResponseFactory.error('Name, email, and vehicle are required.', 'CUSTOM_ERROR', 422);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ResponseFactory.error('Invalid email format.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    const applicationId = await convex.mutation(api.mutations.drivers.createDriver, {
      name,
      email,
      vehicle,
      vehicleType: 'car', // Default to car, could be made configurable
      experience: experience || '',
      createdAt: Date.now(),
    });
    return ResponseFactory.success({ success: true, applicationId });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to submit delivery application.' );
  }
}

/**
 * @swagger
 * /api/delivery-applications:
 *   patch:
 *     summary: Update delivery application status
 *     description: Update the status of a delivery application (admin only)
 *     tags: [Delivery Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryApplicationUpdate'
 *     responses:
 *       200:
 *         description: Application status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       422:
 *         description: Validation error - Missing required fields
 *       500:
 *         description: Internal server error
 */
async function handlePATCH(request: NextRequest): Promise<NextResponse> {
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
      return ResponseFactory.forbidden('Forbidden: Only admins can update delivery applications.');
    }
    const { application_id, status } = await request.json();
    if (!application_id || !status) {
      return ResponseFactory.error('application_id and status are required.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    // Update the driver application status
    await convex.mutation(api.mutations.drivers.updateDriver, {
      id: application_id as Id<'drivers'>,
      status,
      updatedAt: Date.now(),
    });
    return ResponseFactory.success({ success: true });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to update application.' );
  }
}

/**
 * @swagger
 * /api/delivery-applications:
 *   delete:
 *     summary: Delete a delivery application
 *     description: Delete a specific delivery application (admin only)
 *     tags: [Delivery Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryApplicationDelete'
 *     responses:
 *       200:
 *         description: Application deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       422:
 *         description: Validation error - Missing application_id
 *       500:
 *         description: Internal server error
 */
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
      return ResponseFactory.forbidden('Forbidden: Only admins can delete delivery applications.');
    }
    const { application_id } = await request.json();
    if (!application_id) {
      return ResponseFactory.error('application_id is required.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    // Delete the driver application
    try {
      await convex.mutation(api.mutations.drivers.deleteDriver, { id: application_id as Id<'drivers'> });
    } catch (error) {
      console.error('Error deleting driver application:', error);
      return ResponseFactory.error('Failed to delete driver application', 'CUSTOM_ERROR', 500);
    }
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'delete_delivery_application',
      details: { application_id },
      adminId: payload.user_id,
      // Timestamp is added automatically by the mutation
    });
    return ResponseFactory.success({ success: true });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to delete application.' );
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
      return ResponseFactory.forbidden('Forbidden: Only admins can bulk delete delivery applications.');
    }
    const { application_ids } = await request.json();
    if (!Array.isArray(application_ids) || application_ids.length === 0) {
      return ResponseFactory.error('application_ids array is required.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    for (const applicationId of application_ids) {
      await convex.mutation(api.mutations.drivers.deleteDriver, { id: applicationId as Id<'drivers'> });
    }
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'bulk_delete_delivery_applications',
      details: { application_ids },
      adminId: payload.user_id,
      // Timestamp is added automatically by the mutation
    });
    return ResponseFactory.success({ success: true, deleted: application_ids.length });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to bulk delete delivery applications.' );
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
      return ResponseFactory.forbidden('Forbidden: Only admins can export delivery applications.');
    }
    const convex = getConvexClient();
    const allApplications = await convex.query(api.queries.drivers.getAll, {});
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'export_delivery_applications',
      details: {},
      adminId: payload.user_id,
      // Timestamp is added automatically by the mutation
    });
    return ResponseFactory.jsonDownload(allApplications, 'delivery-applications-export.json');
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to export delivery applications.' );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const PATCH = withAPIMiddleware(withErrorHandling(handlePATCH));
export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));
export const BULK_DELETE = withAPIMiddleware(withErrorHandling(handleBulkDelete));
export const EXPORT = withAPIMiddleware(withErrorHandling(handleExport)); 