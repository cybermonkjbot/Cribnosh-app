import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { NextResponse } from 'next/server';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

// Endpoint: /v1/chef/location/location
// Group: chef

/**
 * @swagger
 * /chef/location/location:
 *   get:
 *     summary: Get All Chef Locations
 *     description: Retrieve location information for all chefs
 *     tags: [Chef, Location]
 *     responses:
 *       200:
 *         description: Chef locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   description: Array of chef locations
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Chef ID
 *                         example: "j1234567890abcdef"
 *                       userId:
 *                         type: string
 *                         description: User ID
 *                         example: "j1234567890abcdef"
 *                       location:
 *                         type: object
 *                         description: Chef location information
 *                         properties:
 *                           coordinates:
 *                             type: array
 *                             items:
 *                               type: number
 *                             description: "Array of [longitude, latitude] coordinates"
 *                             example: [-0.1278, 51.5074]
 *                           city:
 *                             type: string
 *                             description: City name
 *                             example: "London"
 *                           address:
 *                             type: string
 *                             description: Full address
 *                             example: "123 Baker Street, London"
 *                           postcode:
 *                             type: string
 *                             description: Postal code
 *                             example: "NW1 6XE"
 *                           country:
 *                             type: string
 *                             description: Country
 *                             example: "UK"
 *                       specialties:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: Chef specialties
 *                         example: ["italian", "pasta", "seafood"]
 *                       status:
 *                         type: string
 *                         enum: [active, inactive, pending]
 *                         description: Chef status
 *                         example: "active"
 *                       isAvailable:
 *                         type: boolean
 *                         description: Whether chef is currently available
 *                         example: true
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
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  const convex = getConvexClient();
  const sessionToken = getSessionTokenFromRequest(request);
  const locations = await convex.query(api.queries.chefs.getAllChefLocations, {
    sessionToken: sessionToken || undefined
  });
  return ResponseFactory.success(locations);
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 