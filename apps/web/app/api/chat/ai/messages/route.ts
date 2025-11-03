import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withRetry } from '@/lib/api/retry';
import { getUserFromRequest } from '@/lib/auth/session';
import { api, getConvexClient } from '@/lib/conxed-client';
import { aggregateContext } from '@/lib/emotions-engine/core/contextAggregation';
import { runInference } from '@/lib/emotions-engine/core/inferenceEngine';
import { DishRecommendation } from '@/lib/emotions-engine/types';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest } from 'next/server';

/**
 * @swagger
 * /chat/ai/messages:
 *   post:
 *     summary: Send AI Chat Message
 *     description: Send a message to the AI chat and receive personalized meal recommendations with dish data
 *     tags: [Chat, AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's message to AI
 *                 example: "Just finished a workout — what should I eat to recover right?"
 *               conversation_id:
 *                 type: string
 *                 nullable: true
 *                 description: Optional conversation ID for maintaining context
 *                 example: "j1234567890abcdef"
 *               location:
 *                 type: object
 *                 nullable: true
 *                 description: User's current location
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 51.5074
 *                   longitude:
 *                     type: number
 *                     example: -0.1278
 *                   address:
 *                     type: string
 *                     nullable: true
 *                     example: "London, UK"
 *               preferences:
 *                 type: object
 *                 nullable: true
 *                 description: User dietary preferences and restrictions
 *                 properties:
 *                   dietaryRestrictions:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["vegetarian", "gluten-free"]
 *                   allergies:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["nuts", "dairy"]
 *     responses:
 *       200:
 *         description: AI response with recommendations
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
 *                     message:
 *                       type: string
 *                       description: AI's text response
 *                       example: "I've found a few meals that match your vibe today"
 *                     recommendations:
 *                       type: array
 *                       description: Array of dish recommendations
 *                       items:
 *                         type: object
 *                         properties:
 *                           dish_id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *                           image_url:
 *                             type: string
 *                           description:
 *                             type: string
 *                           chef_name:
 *                             type: string
 *                           badge:
 *                             type: string
 *                           rating:
 *                             type: number
 *                     conversation_id:
 *                       type: string
 *                       description: Conversation ID for context
 *                     message_id:
 *                       type: string
 *                       description: Message ID
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
async function handlePOST(request: NextRequest): Promise<Response> {
  try {
    // Get user from request (optional for AI chat - can work without auth)
    const user = await getUserFromRequest(request);
    const userId = user?._id;

    const body = await request.json();
    const { message, conversation_id, location, preferences } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return ResponseFactory.validationError('Message is required');
    }

    // Prepare context for emotions engine
    const emotionsContext = {
      user_input: message.trim(),
      mood_score: 5, // Default neutral mood
      location: location?.address || location?.latitude && location?.longitude 
        ? `${location.latitude},${location.longitude}` 
        : 'unknown',
      timeOfDay: getTimeOfDay(),
      active_screen: 'ai_chat',
      device_type: 'mobile',
      user_tier: 'standard',
      preferences,
    };

    // Fetch nearby cuisines if location is available
    let nearbyCuisines: string[] = [];
    if (location && location.latitude && location.longitude) {
      const convex = getConvexClient();
      const nearbyChefsResult = await withRetry(async () => {
        return await convex.query(api.queries.chefs.findNearbyChefs, {
          latitude: location.latitude,
          longitude: location.longitude,
          maxDistanceKm: 10,
        });
      });

      const nearbyChefs = nearbyChefsResult.success ? nearbyChefsResult.data : [];
      const cuisineSet = new Set<string>();
      if (Array.isArray(nearbyChefs)) {
        for (const chef of nearbyChefs) {
          if (Array.isArray(chef.specialties)) {
            chef.specialties.forEach((c: string) => cuisineSet.add(c));
          }
        }
      }
      nearbyCuisines = Array.from(cuisineSet);
    }

    // Aggregate context
    const context = await aggregateContext(emotionsContext, userId, nearbyCuisines);

    // Run inference with full context
    const result = await runInference({
      ...context,
      ...emotionsContext,
      userId,
      intent: 'recommendation',
    });

    // Extract dishes and message from result
    const dishes: DishRecommendation[] = result.data.dishes || [];
    const aiMessage = result.data.message || result.data.answer || 'I found some great options for you!';

    // Generate conversation and message IDs
    const conversationId = conversation_id || generateId();
    const messageId = generateId();

    return ResponseFactory.success({
      message: aiMessage,
      recommendations: dishes,
      conversation_id: conversationId,
      message_id: messageId,
    });
  } catch (err: unknown) {
    console.error('AI chat error:', err);
    return ResponseFactory.internalError(
      err instanceof Error ? err.message : 'Failed to process AI chat message'
    );
  }
}

/**
 * Get time of day string (morning, afternoon, evening, night)
 */
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Generate a simple ID for conversation/message
 */
function generateId(): string {
  return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

