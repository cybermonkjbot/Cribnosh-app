import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /customer/regional-availability/check:
 *   post:
 *     summary: Check Region Availability
 *     description: Check if a location is in a supported region for ordering
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                   country:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *     responses:
 *       200:
 *         description: Check completed successfully
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
 *                     isSupported:
 *                       type: boolean
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { city, country, address } = body;
    
    const convex = getConvexClient();
    
    const isSupported = await convex.query((api as any).queries.admin.checkRegionAvailability, {
      city,
      country,
      address,
    });
    
    return ResponseFactory.success({
      isSupported,
    });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to check region availability');
  }
}

