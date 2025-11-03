import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';

/**
 * @swagger
 * /api/customer/kitchens/{kitchenId}:
 *   get:
 *     summary: Get kitchen details by ID
 *     description: Get kitchen details including chef name and kitchen name for a specific kitchen
 *     tags: [Customer, Kitchens]
 *     security:
 *       - Bearer: []
 *     parameters:
 *       - in: path
 *         name: kitchenId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the kitchen
 *     responses:
 *       200:
 *         description: Kitchen details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Kitchen not found
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { kitchenId: string } }
): Promise<NextResponse> {
  try {
    const { kitchenId } = params;
    
    if (!kitchenId) {
      return ResponseFactory.validationError('Kitchen ID is required');
    }

    const convex = getConvexClient();
    
    // Get kitchen details (including chef name)
    const kitchenDetails = await convex.query(
      (api as any).queries.kitchens.getKitchenDetails,
      { kitchenId }
    );

    if (!kitchenDetails) {
      return ResponseFactory.notFound('Kitchen not found');
    }

    return ResponseFactory.success(kitchenDetails, 'Kitchen details retrieved successfully');

  } catch (error: any) {
    console.error('Get kitchen details error:', error);
    return ResponseFactory.internalError(
      error.message || 'Failed to retrieve kitchen details'
    );
  }
}

// Wrapper function to extract params from URL
export const GET = withAPIMiddleware(withErrorHandling(handleGET));

