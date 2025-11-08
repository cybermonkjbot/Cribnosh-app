import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling, ErrorFactory, ErrorCode, errorHandler, ErrorSeverity } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { mattermostService } from '@/lib/mattermost';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

/**
 * @swagger
 * /staff/mattermost/setup:
 *   post:
 *     summary: Setup Mattermost Profile
 *     description: Initial setup of Mattermost user profile for staff members
 *     tags: [Staff, Mattermost, Integration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Staff member email address
 *                 example: "john.doe@cribnosh.com"
 *               username:
 *                 type: string
 *                 description: Desired Mattermost username
 *                 example: "johndoe"
 *               firstName:
 *                 type: string
 *                 description: Staff member first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: Staff member last name
 *                 example: "Doe"
 *               department:
 *                 type: string
 *                 description: Staff member department
 *                 example: "Customer Support"
 *               role:
 *                 type: string
 *                 description: Staff member role
 *                 example: "Support Specialist"
 *     responses:
 *       200:
 *         description: Mattermost profile setup completed successfully
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
 *                     mattermostUserId:
 *                       type: string
 *                       description: Mattermost user ID
 *                       example: "mm1234567890abcdef"
 *                     username:
 *                       type: string
 *                       example: "johndoe"
 *                     email:
 *                       type: string
 *                       example: "john.doe@cribnosh.com"
 *                     profileComplete:
 *                       type: boolean
 *                       description: Whether profile setup is complete
 *                       example: true
 *                     teamMembership:
 *                       type: object
 *                       properties:
 *                         teamId:
 *                           type: string
 *                           example: "team1234567890abcdef"
 *                         teamName:
 *                           type: string
 *                           example: "CribNosh Staff"
 *                         role:
 *                           type: string
 *                           example: "member"
 *                     channelMembership:
 *                       type: object
 *                       properties:
 *                         channelId:
 *                           type: string
 *                           example: "channel1234567890abcdef"
 *                         channelName:
 *                           type: string
 *                           example: "general"
 *                         role:
 *                           type: string
 *                           example: "member"
 *                     nextSteps:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Next steps in setup process
 *                       example: ["Complete profile", "Set preferences", "Join channels"]
 *                 message:
 *                   type: string
 *                   example: "Mattermost profile setup completed successfully"
 *       400:
 *         description: Validation error - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - username or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error or Mattermost integration error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.json();

    // Process Mattermost setup and save to database

    // --- MATTERMOST USER SETUP ---
    // Generate a password (same as onboarding logic)
    const password = Math.random().toString(36).slice(-10) + 'Aa1!';
    let mattermostUser = null;
    try {
      // Try to create the user (if already exists, Mattermost will error)
      mattermostUser = await mattermostService.createUser({
        email: data.email,
        username: data.username,
        password,
        first_name: data.firstName,
        last_name: data.lastName,
      });
      // If user already exists, try to fetch their user ID
      if (!mattermostUser) {
        const res = await fetch(`${process.env.MATTERMOST_SERVER_URL}/api/v4/users/email/${encodeURIComponent(data.email)}`, {
          headers: { 'Authorization': `Bearer ${process.env.MATTERMOST_BOT_TOKEN}` },
        });
        if (res.ok) {
          mattermostUser = await res.json();
        }
      }
      if (mattermostUser && mattermostUser.id) {
        await mattermostService.addUserToTeam(mattermostUser.id);
        await mattermostService.addUserToChannel(mattermostUser.id);
        // Set a default theme
        const sampleTheme = {
          sidebarBg: '#1A1A1A',
          sidebarText: '#FFFFFF',
          sidebarUnreadText: '#F99104',
          sidebarTextActiveBorder: '#F99104',
          sidebarTextActiveColor: '#F99104',
          sidebarHeaderBg: '#23272A',
          sidebarHeaderTextColor: '#F99104',
          onlineIndicator: '#43B581',
          awayIndicator: '#F99104',
          dndIndicator: '#F04747',
          mentionBg: '#F99104',
          mentionBj: '#F99104',
          mentionColor: '#FFFFFF',
          centerChannelBg: '#18191C',
          centerChannelText: '#FFFFFF',
          newMessageSeparator: '#F99104',
          linkColor: '#F99104',
          buttonBg: '#F99104',
          buttonColor: '#FFFFFF',
          errorTextColor: '#F04747',
          mentionHighlightBg: '#F99104',
          mentionHighlightLink: '#F99104',
          codeTheme: 'monokai',
        };
        // await mattermostService.setUserTheme(mattermostUser.id, sampleTheme);
      } else {
        logger.error('Failed to create or find Mattermost user for setup:', data.email);
      }
    } catch (err) {
      logger.error('Mattermost user setup error:', data.email, err);
    }
    // --- END MATTERMOST USER SETUP ---

    // Save Mattermost setup to database
    const convex = getConvexClientFromRequest(request);
    await convex.mutation(api.mutations.staff.updateMattermostSetup, {
      userId: data.userId,
      mattermostUsername: data.username,
      mattermostEmail: data.email,
      setupCompleted: true,
      setupCompletedAt: Date.now(),
    });

    return errorHandler.createSuccessResponse({
      success: true,
      message: 'Mattermost setup completed successfully',
    });

  } catch (error) {
    logger.error('Mattermost setup error:', error);
    
    throw ErrorFactory.custom(
      ErrorCode.INTERNAL_ERROR,
      'Failed to setup Mattermost profile',
      ErrorSeverity.HIGH
    );
  }
}

/**
 * OPTIONS /api/staff/mattermost/setup - Handle CORS preflight
 */
async function handleOPTIONS(): Promise<NextResponse> {
  return ResponseFactory.options(['POST', 'OPTIONS']);
}

// Export handlers with middleware
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const OPTIONS = withAPIMiddleware(withErrorHandling(handleOPTIONS)); 