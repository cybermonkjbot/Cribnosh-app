import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /staff-list:
 *   get:
 *     summary: Get Staff List
 *     description: Retrieve a list of all staff members in the system
 *     tags: [Staff, User Management]
 *     responses:
 *       200:
 *         description: Staff list retrieved successfully
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
 *                     staff:
 *                       type: array
 *                       description: Array of staff members
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Staff member ID
 *                             example: "j1234567890abcdef"
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: "staff@cribnosh.com"
 *                           name:
 *                             type: string
 *                             example: "John Smith"
 *                           role:
 *                             type: string
 *                             example: "staff"
 *                           roles:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["staff"]
 *                           status:
 *                             type: string
 *                             enum: [active, inactive, suspended]
 *                             example: "active"
 *                           department:
 *                             type: string
 *                             nullable: true
 *                             description: Staff department
 *                             example: "Customer Support"
 *                           position:
 *                             type: string
 *                             nullable: true
 *                             description: Staff position
 *                             example: "Support Agent"
 *                           permissions:
 *                             type: array
 *                             nullable: true
 *                             description: Staff permissions
 *                             items:
 *                               type: string
 *                             example: ["view_orders", "manage_customers"]
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             description: Account creation date
 *                             example: "2024-01-15T10:30:00Z"
 *                           lastActive:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: Last active timestamp
 *                             example: "2024-01-15T10:30:00Z"
 *                           avatar:
 *                             type: string
 *                             nullable: true
 *                             description: Profile avatar URL
 *                             example: "https://example.com/avatar.jpg"
 *                     totalCount:
 *                       type: number
 *                       description: Total number of staff members
 *                       example: 25
 *                     activeCount:
 *                       type: number
 *                       description: Number of active staff members
 *                       example: 22
 *                     inactiveCount:
 *                       type: number
 *                       description: Number of inactive staff members
 *                       example: 3
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */
export async function GET() {
  try {
    const convex = getConvexClient();
    // Fetch all users with role 'staff'
    const users = await convex.query(api.queries.users.getAllStaff, {});
    return ResponseFactory.success({});
  } catch (error) {
    return ResponseFactory.success({});
  }
} 