import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/proxy';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

const EMOTIONS_ENGINE_URL = process.env.EMOTIONS_ENGINE_URL || 'http://localhost:3000/api/emotions-engine';

/**
 * @swagger
 * /customer/search:
 *   post:
 *     summary: Search with Emotions Engine
 *     description: Search for chefs, dishes, or cuisines using the emotions engine for personalized results with dietary filters
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query
 *                 example: "Italian pasta"
 *               searchQuery:
 *                 type: string
 *                 description: Alternative field name for search query
 *                 example: "Italian pasta"
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 40.7128
 *                   longitude:
 *                     type: number
 *                     example: -74.0060
 *                   address:
 *                     type: string
 *                     nullable: true
 *                     example: "New York, NY"
 *               preferences:
 *                 type: object
 *                 description: User preferences for personalized search
 *                 properties:
 *                   dietaryRestrictions:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Dietary restrictions (vegan, gluten-free, vegetarian, etc.)
 *                     example: ["vegan", "gluten-free"]
 *                   allergies:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Food allergies
 *                     example: ["nuts", "dairy"]
 *                   cuisinePreferences:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Preferred cuisines
 *                     example: ["italian", "mexican"]
 *                   spiceLevel:
 *                     type: string
 *                     enum: [mild, medium, hot, spicy, extra-hot]
 *                     description: Spice level preference
 *                     example: "spicy"
 *               filters:
 *                 type: object
 *                 description: Search filters
 *                 properties:
 *                   dietary_restrictions:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Dietary restrictions filter
 *                     example: ["vegan"]
 *                   spice_level:
 *                     type: string
 *                     enum: [mild, medium, hot, spicy, extra-hot]
 *                     description: Spice level filter
 *                     example: "spicy"
 *                   category:
 *                     type: string
 *                     description: Category filter (e.g., "takeaway", "dine-in", "delivery")
 *                     example: "takeaway"
 *                   tag:
 *                     type: string
 *                     description: Tag filter (e.g., "too-fresh", "sustainability", "eco-friendly")
 *                     example: "too-fresh"
 *     responses:
 *       200:
 *         description: Search completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Normalize query field
    const searchQuery = body.searchQuery || body.query || body.q;
    
    // Merge filters into preferences if provided
    const preferences = body.preferences || {};
    if (body.filters) {
      if (body.filters.dietary_restrictions) {
        preferences.dietaryRestrictions = body.filters.dietary_restrictions;
      }
      if (body.filters.spice_level) {
        preferences.spiceLevel = body.filters.spice_level;
      }
      if (body.filters.cuisine) {
        preferences.cuisinePreferences = Array.isArray(body.filters.cuisine)
          ? body.filters.cuisine
          : [body.filters.cuisine];
      }
    }

    const requestBody = {
      ...body,
      searchQuery,
      preferences: Object.keys(preferences).length > 0 ? preferences : undefined,
      // Pass category and tag filters directly to emotions engine
      category: body.filters?.category || body.category,
      tag: body.filters?.tag || body.tag,
    };

    const res = await fetch(EMOTIONS_ENGINE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    const data = await res.json();
    return ResponseFactory.success(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Search failed.';
    return ResponseFactory.internalError(errorMessage);
  }
}

/**
 * @swagger
 * /customer/search:
 *   get:
 *     summary: Search with Query Parameters
 *     description: Search for chefs, dishes, or cuisines using query parameters with dietary filters
 *     tags: [Customer]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *         example: "Italian pasta"
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location for search
 *         example: "New York"
 *       - in: query
 *         name: cuisine
 *         schema:
 *           type: string
 *         description: Cuisine filter
 *         example: "Italian"
 *       - in: query
 *         name: price_range
 *         schema:
 *           type: string
 *         description: Price range filter
 *         example: "10-20"
 *       - in: query
 *         name: dietary
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Dietary restrictions filter (vegan, gluten-free, vegetarian, etc.)
 *         example: ["vegan", "gluten-free"]
 *       - in: query
 *         name: spice_level
 *         schema:
 *           type: string
 *           enum: [mild, medium, hot, spicy, extra-hot]
 *         description: Spice level preference
 *         example: "spicy"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category filter (e.g., "takeaway", "dine-in", "delivery")
 *         example: "takeaway"
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Tag filter (e.g., "too-fresh", "sustainability", "eco-friendly")
 *         example: "too-fresh"
 *     responses:
 *       200:
 *         description: Search completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Build request body for emotions engine
    const body: Record<string, unknown> = {
      searchQuery: searchParams.get('q') || searchParams.get('query') || undefined,
    };

    // Parse location if provided (can be string or lat,lng format)
    const locationParam = searchParams.get('location');
    if (locationParam) {
      // Try to parse as lat,lng format
      const latLngMatch = locationParam.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
      if (latLngMatch) {
        body.location = {
          latitude: parseFloat(latLngMatch[1]),
          longitude: parseFloat(latLngMatch[2]),
        };
      } else {
        body.location = { address: locationParam };
      }
    }

    // Build preferences object incrementally
    const preferences: Record<string, unknown> = {};

    // Parse dietary restrictions
    const dietaryParam = searchParams.get('dietary');
    if (dietaryParam) {
      const dietaryRestrictions = Array.isArray(dietaryParam) 
        ? dietaryParam 
        : dietaryParam.split(',').map((d: string) => d.trim()).filter(Boolean);
      if (dietaryRestrictions.length > 0) {
        preferences.dietaryRestrictions = dietaryRestrictions;
      }
    }

    // Parse spice level
    const spiceLevel = searchParams.get('spice_level');
    if (spiceLevel) {
      preferences.spiceLevel = spiceLevel.toLowerCase();
    }

    // Parse cuisine filter
    const cuisine = searchParams.get('cuisine');
    if (cuisine) {
      preferences.cuisinePreferences = [cuisine];
      // Also pass cuisine directly for direct search
      body.cuisine = cuisine;
    }

    // Add preferences to body if any exist
    if (Object.keys(preferences).length > 0) {
      body.preferences = preferences;
    }

    // Parse price range if provided
    const priceRange = searchParams.get('price_range');
    if (priceRange) {
      body.price_range = priceRange;
    }

    // Parse category filter if provided
    const category = searchParams.get('category');
    if (category) {
      body.category = category;
    }

    // Parse tag filter if provided
    const tag = searchParams.get('tag');
    if (tag) {
      body.tag = tag;
    }

    const res = await fetch(EMOTIONS_ENGINE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return ResponseFactory.success(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Search failed.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 