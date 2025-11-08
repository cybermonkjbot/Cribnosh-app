import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { Id } from '@/convex/_generated/dataModel';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

/**
 * @swagger
 * /customer/support-chat/agent:
 *   get:
 *     summary: Get assigned support agent info
 *     description: Get information about the agent assigned to the active support chat
 *     tags: [Customer, Support]
 *     responses:
 *       200:
 *         description: Agent info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     isOnline:
 *                       type: boolean
 *                     activeCases:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No agent assigned
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClientFromRequest(request);

    // Get active support chat
    const activeChat = await convex.query(api.queries.supportCases.getActiveSupportChat, {
      userId,
    });

    if (!activeChat || !activeChat.supportCase || !activeChat.supportCase.assigned_agent_id) {
      return ResponseFactory.success({
        agent: null,
        message: 'No agent assigned yet. We will assign an agent shortly.',
      });
    }

    // Get agent info
    const agentInfo = await convex.query(api.queries.supportAgents.getAgentInfo, {
      agentId: activeChat.supportCase.assigned_agent_id,
    });

    if (!agentInfo) {
      return ResponseFactory.success({
        agent: null,
        message: 'Agent information not available.',
      });
    }

    return ResponseFactory.success({
      agent: {
        id: agentInfo._id,
        name: agentInfo.name,
        avatar: agentInfo.avatar,
        isOnline: agentInfo.isOnline,
        activeCases: agentInfo.activeCases,
      },
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to get agent info.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

