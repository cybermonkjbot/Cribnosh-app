import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Define the interface for location update request
interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  city?: string;
  address?: string;
  radius?: number; // Delivery radius in km
}

/**
 * @swagger
 * /functions/updateLiveSessionLocation:
 *   put:
 *     summary: Update Live Session Location
 *     description: Update the location of an existing live session
 *     tags: [Live Streaming]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the live session to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 description: Latitude coordinate
 *                 example: 51.5074
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: Longitude coordinate
 *                 example: -0.1276
 *               city:
 *                 type: string
 *                 description: City name
 *                 example: "London"
 *               address:
 *                 type: string
 *                 description: Human-readable address
 *                 example: "123 Baker Street, London"
 *               radius:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 100
 *                 description: Delivery radius in kilometers
 *                 example: 10
 *     responses:
 *       200:
 *         description: Location updated successfully
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
 *                       example: "j1234567890abcdef"
 *                     location:
 *                       type: object
 *                       properties:
 *                         city:
 *                           type: string
 *                           example: "London"
 *                         coordinates:
 *                           type: array
 *                           items:
 *                             type: number
 *                           example: [-0.1276, 51.5074]
 *                         address:
 *                           type: string
 *                           example: "123 Baker Street, London"
 *                         radius:
 *                           type: number
 *                           example: 10
 *                 message:
 *                   type: string
 *                   example: "Session location updated successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Live session not found
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
async function handlePUT(req: NextRequest) {
  try {
    const client = getConvexClient();
    
    // Extract sessionId from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const sessionId = pathParts[pathParts.length - 2]; // Get sessionId from the path
    
    if (!sessionId) {
      return ResponseFactory.validationError('Session ID is required');
    }

    const body: UpdateLocationRequest = await req.json();
    const { latitude, longitude, city, address, radius } = body;

    // Validate required fields
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return ResponseFactory.validationError('Latitude and longitude must be numbers');
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return ResponseFactory.validationError('Latitude must be between -90 and 90');
    }
    
    if (longitude < -180 || longitude > 180) {
      return ResponseFactory.validationError('Longitude must be between -180 and 180');
    }

    // Validate radius if provided
    if (radius !== undefined && (radius < 1 || radius > 100)) {
      return ResponseFactory.validationError('Radius must be between 1 and 100 kilometers');
    }

    // Prepare location data in the format expected by the schema
    const locationData = {
      city: city || "Unknown City",
      coordinates: [longitude, latitude] as [number, number], // [longitude, latitude] format
      address: address || undefined,
      radius: radius || 10, // Default 10km delivery radius
    };

    // Update the session location using the Convex mutation
    const result = await client.mutation(api.mutations.liveSessions.updateSessionLocation, {
      sessionId: sessionId as Id<"liveSessions">,
      location: locationData,
    });

    if (!result.success) {
      return ResponseFactory.error(result.message, 'VALIDATION_ERROR', 400);
    }

    return ResponseFactory.success({
      sessionId,
      location: locationData,
    }, 'Session location updated successfully');

  } catch (error) {
    console.error('Error updating live session location:', error);
    return ResponseFactory.error('Internal Server Error', 'CUSTOM_ERROR', 500);
  }
}

export const PUT = withErrorHandling(handlePUT);
