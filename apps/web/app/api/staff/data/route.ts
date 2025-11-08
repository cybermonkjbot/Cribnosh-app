import { api } from '@/convex/_generated/api';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withStaffAuth } from '@/lib/api/staff-middleware';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

/**
 * @swagger
 * /staff/data:
 *   get:
 *     summary: Get Staff Data
 *     description: Retrieve staff member's personal and employment data
 *     tags: [Staff, Profile]
 *     responses:
 *       200:
 *         description: Staff data retrieved successfully
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
 *                     id:
 *                       type: string
 *                       description: Staff user ID
 *                       example: "j1234567890abcdef"
 *                     name:
 *                       type: string
 *                       description: Staff member's full name
 *                       example: "John Smith"
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: Staff email address
 *                       example: "john.smith@cribnosh.com"
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Staff roles and permissions
 *                       example: ["staff", "customer_support"]
 *                     position:
 *                       type: string
 *                       nullable: true
 *                       description: Job position/title
 *                       example: "Customer Support Manager"
 *                     department:
 *                       type: string
 *                       nullable: true
 *                       description: Department assignment
 *                       example: "Customer Support"
 *                     avatar:
 *                       type: string
 *                       nullable: true
 *                       description: Profile avatar URL
 *                       example: "https://example.com/avatar.jpg"
 *                     status:
 *                       type: string
 *                       enum: [active, inactive, suspended, terminated]
 *                       description: Employment status
 *                       example: "active"
 *                     onboarding:
 *                       type: object
 *                       nullable: true
 *                       description: Onboarding completion status
 *                       properties:
 *                         completed:
 *                           type: boolean
 *                           example: true
 *                         stepsCompleted:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["profile_setup", "training_completed"]
 *                     mattermostActive:
 *                       type: boolean
 *                       description: Whether staff is active on Mattermost
 *                       example: true
 *                     mattermostProfile:
 *                       type: object
 *                       nullable: true
 *                       description: Mattermost profile information
 *                       properties:
 *                         username:
 *                           type: string
 *                           example: "john.smith"
 *                         displayName:
 *                           type: string
 *                           example: "John Smith"
 *                     mattermostUserId:
 *                       type: string
 *                       nullable: true
 *                       description: Mattermost user ID
 *                       example: "mattermost_user_123"
 *                     startDate:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *                       description: Employment start date
 *                       example: "2024-01-15"
 *                     employmentType:
 *                       type: string
 *                       enum: [full_time, part_time, contract, intern]
 *                       nullable: true
 *                       description: Type of employment
 *                       example: "full_time"
 *                     salary:
 *                       type: object
 *                       nullable: true
 *                       description: Salary information
 *                       properties:
 *                         amount:
 *                           type: number
 *                           example: 50000
 *                         currency:
 *                           type: string
 *                           example: "USD"
 *                         frequency:
 *                           type: string
 *                           example: "annual"
 *                     address:
 *                       type: object
 *                       nullable: true
 *                       description: Staff address
 *                       properties:
 *                         street:
 *                           type: string
 *                           example: "123 Main St"
 *                         city:
 *                           type: string
 *                           example: "London"
 *                         postcode:
 *                           type: string
 *                           example: "SW1A 1AA"
 *                         country:
 *                           type: string
 *                           example: "UK"
 *                 message:
 *                   type: string
 *                   example: "Staff data retrieved successfully"
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Staff user not found
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
async function handleGET(request: NextRequest, user: any) {
  const convex = getConvexClientFromRequest(request);
  
  // Fetch user document by userId
  const staff = await convex.query(api.queries.users.getById, { userId: user._id });
  if (!staff) {
    return ResponseFactory.notFound('Staff user not found');
  }

  // Fetch staff assignment (department, position) from staffAssignments table
  const assignment = await convex.query(api.queries.staff.getStaffAssignmentByUser, { userId: user._id });
  
  // Return only relevant staff fields
  const {
    _id, name, email, roles, avatar, status, onboarding, mattermostActive, mattermostProfile, mattermostUserId, startDate, employmentType, salary, address
  } = staff;

  const staffData = {
    id: _id,
    name,
    email,
    roles,
    position: assignment?.position || staff.position || null,
    department: assignment?.department || staff.department || null,
    avatar,
    status,
    onboarding,
    mattermostActive,
    mattermostProfile,
    mattermostUserId,
    startDate,
    employmentType,
    salary,
    address
  };

  return ResponseFactory.success(staffData, 'Staff data retrieved successfully');
}

export const GET = withErrorHandling(withStaffAuth(handleGET)); 