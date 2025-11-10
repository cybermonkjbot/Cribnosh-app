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
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /customer/support-chat:
 *   get:
 *     summary: Get or create active support chat
 *     description: Get or create an active support chat for the customer. Auto-creates support case if needed and assigns an available agent.
 *     tags: [Customer, Support]
 *     responses:
 *       200:
 *         description: Support chat retrieved or created successfully
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
 *                     chatId:
 *                       type: string
 *                       description: Chat ID
 *                       example: "j1234567890abcdef"
 *                     supportCaseId:
 *                       type: string
 *                       description: Support case ID
 *                       example: "j1234567890abcdef"
 *                     agent:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         avatar:
 *                           type: string
 *                         isOnline:
 *                           type: boolean
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClientFromRequest(request);

    // Check if specific case ID is requested
    const { searchParams } = new URL(request.url);
    const caseIdParam = searchParams.get('caseId');

    let activeChat = null;

    // If caseId is provided, get that specific case's chat
    if (caseIdParam) {
      try {
        const caseId = caseIdParam as Id<'supportCases'>;
        const supportCase = await convex.query(api.queries.supportCases.getChatByCaseId, {
          caseId,
        });
        
        if (supportCase) {
          // Verify the case belongs to the user
          const userCases = await convex.query(api.queries.supportCases.getByUserId, { userId });
          const userCase = userCases.find((c: any) => c._id === caseIdParam);
          
          if (userCase && userCase.chat_id) {
            const chat = await convex.query(api.queries.chats.getConversationById, {
              chatId: userCase.chat_id,
            });
            
            if (chat) {
              activeChat = {
                chat,
                supportCase: userCase,
              };
            }
          }
        }
      } catch (error) {
        // If case not found or invalid, fall through to get active chat
        logger.error('Error loading case chat:', error);
      }
    }

    // If no specific case or case not found, try to get existing active support chat
    if (!activeChat) {
      activeChat = await convex.query(api.queries.supportCases.getActiveSupportChat, {
        userId,
      });
    }

    if (activeChat && activeChat.chat && activeChat.supportCase) {
      // Get messages for the chat
      const messagesResult = await convex.query(api.queries.chats.listMessagesForChat, {
        chatId: activeChat.chat._id,
        limit: 50,
        offset: 0,
      });

      // Get agent info
      let agent = null;
      if (activeChat.supportCase.assigned_agent_id) {
        const agentData = await convex.query(api.queries.supportAgents.getAgentInfo, {
          agentId: activeChat.supportCase.assigned_agent_id,
        });
        agent = agentData ? {
          id: agentData._id,
          name: agentData.name,
          avatar: agentData.avatar,
          isOnline: agentData.isOnline,
        } : null;
      }

      return ResponseFactory.success({
        chatId: activeChat.chat._id,
        supportCaseId: activeChat.supportCase._id,
        agent,
        messages: messagesResult.messages.reverse(), // Reverse to show oldest first
      });
    }

    // No active chat, create new support case and chat
    // First, create a support case
    const now = Date.now();
    const supportReference = `SUP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    const caseId = await convex.mutation(api.mutations.supportCases.create, {
      userId,
      subject: 'Live Chat Support',
      message: 'Customer initiated live chat support',
      category: 'other',
      priority: 'medium',
      attachments: [],
    });

    // Create support chat with AI agent (no human agent assigned initially)
    // Create chat without a human agent - AI will handle responses initially
    const chatResult = await convex.mutation(api.mutations.chats.createConversation, {
      participants: [userId], // Only the customer initially
      metadata: {
        support_case_id: caseId,
        is_support_chat: true,
        is_ai_assigned: true, // Mark as AI-assigned
        agent_id: null, // No human agent initially
      },
    });

    const chatId = chatResult.chatId;
    
    // Link chat to support case (without assigning a human agent)
    await convex.mutation(api.mutations.supportCases.linkChat, {
      caseId,
      chatId,
    });

    // Get messages (should include the welcome message)
    const messagesResult = await convex.query(api.queries.chats.listMessagesForChat, {
      chatId,
      limit: 50,
      offset: 0,
    });

    return ResponseFactory.success({
      chatId,
      supportCaseId: caseId,
      agent: {
        id: 'ai',
        name: 'CribNosh AI',
        avatar: null,
        isOnline: true,
      },
      messages: messagesResult.messages.reverse(),
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to get or create support chat.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

