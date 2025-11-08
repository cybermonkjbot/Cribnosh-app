import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

const EMOTIONS_ENGINE_URL = process.env.EMOTIONS_ENGINE_URL || 'http://localhost:3000/api/emotions-engine';

/**
 * @swagger
 * /reviews/sentiment-score:
 *   post:
 *     summary: Analyze Review Sentiment Score
 *     description: Analyze the sentiment and emotional tone of review text using AI-powered sentiment analysis. This endpoint provides sentiment scores, mood detection, and emotional insights for review content moderation and analytics.
 *     tags: [Reviews, Sentiment Analysis, AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *                 description: Review text to analyze
 *                 example: "The food was absolutely amazing! The chef really knows how to cook. Best meal I've had in months!"
 *               language:
 *                 type: string
 *                 nullable: true
 *                 description: Language of the text (auto-detected if not provided)
 *                 example: "en"
 *               context:
 *                 type: object
 *                 nullable: true
 *                 description: Additional context for analysis
 *                 properties:
 *                   reviewType:
 *                     type: string
 *                     enum: [food, service, delivery, overall]
 *                     example: "food"
 *                   rating:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 5
 *                     example: 5
 *                   orderId:
 *                     type: string
 *                     nullable: true
 *                     example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Sentiment analysis completed successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     sentiment:
 *                       type: string
 *                       enum: [positive, negative, neutral, mixed]
 *                       description: Overall sentiment classification
 *                       example: "positive"
 *                     score:
 *                       type: number
 *                       minimum: -1
 *                       maximum: 1
 *                       description: Sentiment score (-1 to 1, where 1 is most positive)
 *                       example: 0.85
 *                     mood:
 *                       type: string
 *                       nullable: true
 *                       description: Detected mood/emotion
 *                       example: "excited"
 *                     summary:
 *                       type: string
 *                       nullable: true
 *                       description: AI-generated summary of the sentiment
 *                       example: "Highly positive review expressing satisfaction and excitement"
 *                     confidence:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 1
 *                       nullable: true
 *                       description: Confidence score for the analysis
 *                       example: 0.92
 *                     emotions:
 *                       type: array
 *                       nullable: true
 *                       description: Detected emotions in the text
 *                       items:
 *                         type: object
 *                         properties:
 *                           emotion:
 *                             type: string
 *                             example: "joy"
 *                           intensity:
 *                             type: number
 *                             minimum: 0
 *                             maximum: 1
 *                             example: 0.8
 *                     keywords:
 *                       type: array
 *                       nullable: true
 *                       description: Key emotional keywords found
 *                       items:
 *                         type: string
 *                         example: "amazing"
 *                     language:
 *                       type: string
 *                       nullable: true
 *                       description: Detected language
 *                       example: "en"
 *                     processingTime:
 *                       type: number
 *                       nullable: true
 *                       description: Analysis processing time in milliseconds
 *                       example: 150
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing or invalid text
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error - sentiment analysis failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { text } = await request.json();
    if (!text) {
      return ResponseFactory.validationError('Text is required.');
    }
    const res = await fetch(EMOTIONS_ENGINE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, intent: 'sentiment' }),
    });
    const data = await res.json();
    return ResponseFactory.success({
      success: true,
      sentiment: data.sentiment || 'neutral',
      score: data.score ?? 0,
      mood: data.mood || '',
      summary: data.summary || '',
    });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Sentiment analysis failed.' );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 