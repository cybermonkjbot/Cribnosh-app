import { ResponseFactory } from '@/lib/api';
import { NextRequest } from 'next/server';
// import { withErrorHandling } from '@/lib/errors'; // Unused for now
import { aggregateContext } from '@/lib/emotions-engine/core/contextAggregation';
import { runInference } from '@/lib/emotions-engine/core/inferenceEngine';
// import { EmotionsEngineRequest } from '@/lib/emotions-engine/types'; // Unused for now
import { withRetry } from '@/lib/api/retry';
import { getUserFromRequest } from '@/lib/auth/session';
import { api, getConvexClient } from '@/lib/conxed-client';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /emotions-engine:
 *   post:
 *     summary: Emotions Engine Processing
 *     description: Process user emotions and context to provide personalized meal recommendations
 *     tags: [AI, Recommendations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 nullable: true
 *                 description: User ID for personalized recommendations
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
 *               emotions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 nullable: true
 *                 description: Current emotional state
 *                 example: ["happy", "excited", "hungry"]
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
 *                   cuisinePreferences:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["italian", "mexican", "indian"]
 *                   spiceLevel:
 *                     type: string
 *                     enum: [mild, medium, hot, extra-hot]
 *                     example: "medium"
 *               context:
 *                 type: object
 *                 nullable: true
 *                 description: Additional context for recommendations
 *                 properties:
 *                   timeOfDay:
 *                     type: string
 *                     example: "dinner"
 *                   occasion:
 *                     type: string
 *                     example: "date_night"
 *                   budget:
 *                     type: string
 *                     enum: [low, medium, high, premium]
 *                     example: "medium"
 *                   cookingTime:
 *                     type: number
 *                     description: Available cooking time in minutes
 *                     example: 30
 *               searchQuery:
 *                 type: string
 *                 nullable: true
 *                 description: Text search query
 *                 example: "spicy pasta"
 *     responses:
 *       200:
 *         description: Emotions processed successfully
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
 *                   description: Empty object on success (processing is asynchronous)
 *                   example: {}
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
 *     x-ai-features:
 *       description: |
 *         This endpoint powers CribNosh's AI-driven recommendation system:
 *         
 *         **Context Aggregation:**
 *         - Merges frontend user input with backend user data
 *         - Fetches nearby chef specialties based on location
 *         - Considers user's historical preferences and behavior
 *         
 *         **Emotional Analysis:**
 *         - Processes user's current emotional state
 *         - Maps emotions to appropriate meal types and cuisines
 *         - Considers time of day and occasion context
 *         
 *         **Personalization:**
 *         - Takes into account dietary restrictions and allergies
 *         - Considers budget and cooking time constraints
 *         - Learns from user's past orders and ratings
 *         
 *         **Location Intelligence:**
 *         - Finds nearby chefs within 10km radius
 *         - Considers local cuisine availability
 *         - Factors in delivery time and logistics
 *         
 *         **AI Processing:**
 *         - Runs inference using aggregated context
 *         - Generates personalized meal recommendations
 *         - Updates user preference models
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Extract user/session info from cookies
    const user = await getUserFromRequest(req);
    const userId = user?._id || body.userId || undefined;
    // Get emotions engine context - this consolidates nearby chefs, user data, and preferences
    const convex = getConvexClient();
    const emotionsContext = await convex.action(api.actions.emotionsEngine.getEmotionsEngineContext, {
      userId: userId as any,
      location: body.location ? {
        latitude: body.location.latitude,
        longitude: body.location.longitude,
        address: body.location.address,
      } : undefined,
    });
    
    // Aggregate context (merge frontend and backend data)
    const nearbyCuisines = emotionsContext.nearbyCuisines || [];
    const context = await aggregateContext(body, userId, nearbyCuisines);
    // Run inference
    const result = await runInference({ ...context, ...body });
    return ResponseFactory.success(result.data);
  } catch (err: unknown) {
    logger.error('Emotions engine error:', err);
    return ResponseFactory.internalError(
      err instanceof Error ? err.message : 'Emotions engine processing failed'
    );
  }
}

export const runtime = 'nodejs'; // Switched from 'edge' to 'nodejs' to allow Node.js modules 