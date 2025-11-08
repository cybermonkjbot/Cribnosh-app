import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { LiveSession } from '@/convex/types/livestream';
import { withSensitiveRateLimit } from '@/lib/api/sensitive-middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

// Define the interface to match the mutation's expected arguments
interface StartLiveSessionRequest {
  title: string;
  description: string;
  mealId: string; // Will be cast to Id<"meals">
  location?: {
    coordinates: [number, number];
    address?: string;
  };
  tags?: string[];
}

/**
 * @swagger
 * /functions/startLiveSession:
 *   post:
 *     summary: Start Live Session
 *     description: Start a new live cooking session for a specific meal
 *     tags: [Live Streaming]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - mealId
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the live session
 *                 example: "Cooking Authentic Italian Pasta"
 *               description:
 *                 type: string
 *                 description: Description of what will be cooked
 *                 example: "Join me as I prepare traditional Italian pasta from scratch"
 *               mealId:
 *                 type: string
 *                 description: ID of the meal being prepared
 *                 example: "j1234567890abcdef"
 *               location:
 *                 type: object
 *                 nullable: true
 *                 description: Location information for the session
 *                 properties:
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     minItems: 2
 *                     maxItems: 2
 *                     description: "[longitude, latitude] coordinates"
 *                     example: [-0.1276, 51.5074]
 *                   address:
 *                     type: string
 *                     nullable: true
 *                     description: Human-readable address
 *                     example: "123 Baker Street, London"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 nullable: true
 *                 description: Tags for categorizing the session
 *                 example: ["italian", "pasta", "cooking", "live"]
 *     responses:
 *       200:
 *         description: Live session started successfully
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
 *                     sessionId:
 *                       type: string
 *                       description: Unique session ID
 *                       example: "j1234567890abcdef"
 *                     title:
 *                       type: string
 *                       example: "Cooking Authentic Italian Pasta"
 *                     description:
 *                       type: string
 *                       example: "Join me as I prepare traditional Italian pasta from scratch"
 *                     mealId:
 *                       type: string
 *                       example: "j1234567890abcdef"
 *                     channelName:
 *                       type: string
 *                       description: Streaming channel name
 *                       example: "live-1640995200000"
 *                     chefId:
 *                       type: string
 *                       description: Chef ID who started the session
 *                       example: "j1234567890abcdef"
 *                     status:
 *                       type: string
 *                       enum: [starting, live, ended]
 *                       description: Current session status
 *                       example: "starting"
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["italian", "pasta", "cooking", "live"]
 *                     createdAt:
 *                       type: number
 *                       description: Session creation timestamp
 *                       example: 1640995200000
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing required fields
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
 *     security: []
 */
async function handlePOST(req: NextRequest) {
  try {
    const client = getConvexClient();
    const body: StartLiveSessionRequest = await req.json();

    const { title, description, mealId, location, tags } = body;

    if (!title || !description || !mealId) {
      return ResponseFactory.validationError('Missing required fields');
    }

    // Get the current user's location (simplified - in a real app, get this from the user's device or profile)
    const defaultLocation = {
      coordinates: [0, 0] as [number, number], // [longitude, latitude]
      address: 'Unknown location'
    };

    // Use type assertion to ensure the arguments match the expected structure
    const result = await client.mutation(api.mutations.liveSessions.createLiveSession, {
      title,
      description,
      mealId: mealId as Id<"meals">,
      channelName: `live-${Date.now()}`, // Generate a unique channel name
      chefId: 'temp-chef-id' as Id<"chefs">, // This should come from the authenticated user
      tags: tags || [],
    });

    return ResponseFactory.success(result);
  } catch (error) {
    console.error('Error starting live session:', error);
    return ResponseFactory.error('Internal Server Error', 'CUSTOM_ERROR', 500);
  }
}

export const POST = withSensitiveRateLimit(handlePOST);