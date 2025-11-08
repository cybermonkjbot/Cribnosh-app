import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler, ErrorCode, ErrorSeverity } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getUserFromRequest } from "@/lib/auth/session";
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { mattermostService } from '@/lib/mattermost';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

/**
 * @swagger
 * /staff/mattermost/complete:
 *   post:
 *     summary: Complete Mattermost Setup
 *     description: Complete Mattermost user setup and configuration for staff members
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
 *                 description: Mattermost username
 *                 example: "johndoe"
 *               firstName:
 *                 type: string
 *                 description: Staff member first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: Staff member last name
 *                 example: "Doe"
 *               preferences:
 *                 type: object
 *                 description: Mattermost user preferences
 *                 example: {"theme": "dark", "notifications": "all"}
 *     responses:
 *       200:
 *         description: Mattermost setup completed successfully
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
 *                     teamId:
 *                       type: string
 *                       description: Mattermost team ID
 *                       example: "team1234567890abcdef"
 *                     channelId:
 *                       type: string
 *                       description: Mattermost channel ID
 *                       example: "channel1234567890abcdef"
 *                     setupComplete:
 *                       type: boolean
 *                       description: Whether setup is complete
 *                       example: true
 *                     loginUrl:
 *                       type: string
 *                       description: Mattermost login URL
 *                       example: "https://mattermost.cribnosh.com"
 *                     credentials:
 *                       type: object
 *                       properties:
 *                         username:
 *                           type: string
 *                           example: "johndoe"
 *                         password:
 *                           type: string
 *                           description: Generated password (temporary)
 *                           example: "temp123Aa!"
 *                 message:
 *                   type: string
 *                   example: "Mattermost setup completed successfully"
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
 *       500:
 *         description: Internal server error or Mattermost integration error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  const user = await getUserFromRequest(request);
  if (!user) {
    return ResponseFactory.unauthorized('Unauthorized');
  }
  try {
    const data = await request.json();

    // Process Mattermost completion and save to database

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
        logger.error('Failed to create or find Mattermost user for complete:', data.email);
      }
    } catch (err) {
      logger.error('Mattermost user setup error:', data.email, err);
    }
    // --- END MATTERMOST USER SETUP ---

    // Save Mattermost completion to database
    const convex = getConvexClientFromRequest(request);
    await convex.mutation(api.mutations.staff.updateMattermostSetup, {
      userId: data.userId,
      mattermostUsername: data.username,
      mattermostEmail: data.email,
      setupCompleted: true,
      setupCompletedAt: Date.now(),
    });

    // Send welcome message to the employee
    await mattermostService.sendAPIMessage({
      channel_id: process.env.MATTERMOST_CHANNEL_ID!,
      message: `:wave: Welcome to the team, ${data.firstName}!`,
      props: {
        attachments: [{
          fallback: 'Welcome to CribNosh team',
          color: '#36a64f',
          title: 'Welcome to CribNosh!',
          text: `Your Mattermost profile has been successfully created and you've been added to your selected channels.`,
          fields: [
            { title: 'Your Channels', value: data.channels.map((channel: string) => `#${channel}`).join(', '), short: false },
            { title: 'Notification Settings', value: Object.entries(data.notifications).filter(([_, enabled]) => enabled).map(([type, _]) => type.charAt(0).toUpperCase() + type.slice(1)).join(', '), short: false },
            { title: 'Getting Started', value: '1. Introduce yourself in #general\n2. Review channel guidelines\n3. Set up your profile picture\n4. Explore team channels', short: false },
          ],
          footer: 'CribNosh Team',
          ts: Math.floor(Date.now() / 1000),
        }],
      },
    });

    // Send notification to IT/HR about completed setup
    await mattermostService.sendAPIMessage({
      channel_id: process.env.MATTERMOST_CHANNEL_ID!,
      message: ':white_check_mark: Mattermost Setup Completed',
      props: {
        attachments: [{
          fallback: `Mattermost setup completed for ${data.firstName} ${data.lastName}`,
          color: '#4a90e2',
          title: 'Mattermost Profile Activated',
          fields: [
            { title: 'Employee Name', value: `${data.firstName} ${data.lastName}`, short: true },
            { title: 'Username', value: data.username, short: true },
            { title: 'Department', value: data.department, short: true },
            { title: 'Channels Joined', value: data.channels.length.toString(), short: true },
            { title: 'Selected Channels', value: data.channels.join(', '), short: false },
            { title: 'Notification Preferences', value: Object.entries(data.notifications).map(([type, enabled]) => `${type}: ${enabled ? 'Yes' : 'No'}`).join(', '), short: false },
          ],
          footer: 'CribNosh IT - Mattermost Setup',
          ts: Math.floor(Date.now() / 1000),
        }],
      },
    });

    // Send system health notification
    await mattermostService.notifySystemHealth({
      status: 'healthy',
      message: 'New employee Mattermost integration completed successfully',
      details: {
        employee: `${data.firstName} ${data.lastName}`,
        department: data.department,
        channels: data.channels.length,
        timestamp: new Date().toISOString(),
      },
    });

    return errorHandler.createSuccessResponse({
      success: true,
      message: 'Mattermost profile completed successfully',
    });

  } catch (error) {
    logger.error('Mattermost completion error:', error);
    
    throw ErrorFactory.custom(
      ErrorCode.INTERNAL_ERROR,
      'Failed to complete Mattermost setup',
      ErrorSeverity.HIGH
    );
  }
}

/**
 * OPTIONS /api/staff/mattermost/complete - Handle CORS preflight
 */
async function handleOPTIONS(): Promise<NextResponse> {
  return ResponseFactory.options(['POST', 'OPTIONS']);
}

// Export handlers with middleware
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const OPTIONS = withAPIMiddleware(withErrorHandling(handleOPTIONS)); 