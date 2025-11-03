import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /customer/cuisines/categories:
 *   get:
 *     summary: Get Cuisine Categories with Kitchen Counts
 *     description: Get all cuisine categories with the number of kitchens/chefs offering each cuisine. Returns cuisines sorted by popularity (kitchen count).
 *     tags: [Customer, Cuisines]
 *     responses:
 *       200:
 *         description: Cuisine categories retrieved successfully
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
 *                     categories:
 *                       type: array
 *                       description: Array of cuisine categories with kitchen counts
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Cuisine ID or name
 *                             example: "italian"
 *                           name:
 *                             type: string
 *                             description: Cuisine name
 *                             example: "Italian"
 *                           kitchen_count:
 *                             type: integer
 *                             description: Number of kitchens/chefs offering this cuisine
 *                             example: 24
 *                           image_url:
 *                             type: string
 *                             nullable: true
 *                             description: Cuisine image URL
 *                             example: "https://example.com/italian.jpg"
 *                           is_active:
 *                             type: boolean
 *                             description: Whether cuisine is active
 *                             example: true
 *       500:
 *         description: Internal server error
 *     security: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const convex = getConvexClient();
    
    // Get all meals to extract cuisines
    const meals = await convex.query(api.queries.meals.getAll);
    
    // Get all chefs to count kitchens per cuisine
    const chefs = await convex.query(api.queries.chefs.getAll);
    
    // Map to track cuisine -> kitchen count
    // A kitchen counts if it has at least one meal in that cuisine
    const cuisineKitchenMap = new Map<string, Set<string>>();
    
    // Process meals to build cuisine -> chef mapping
    for (const meal of meals) {
      if (!meal.cuisine || !Array.isArray(meal.cuisine) || !meal.chefId) continue;
      
      for (const cuisine of meal.cuisine) {
        if (!cuisine) continue;
        
        const cuisineKey = cuisine.toLowerCase();
        if (!cuisineKitchenMap.has(cuisineKey)) {
          cuisineKitchenMap.set(cuisineKey, new Set());
        }
        
        // Add chef to this cuisine's kitchen set
        cuisineKitchenMap.get(cuisineKey)!.add(meal.chefId);
      }
    }
    
    // Also check chef specialties for additional cuisine coverage
    for (const chef of chefs) {
      if (!chef.specialties || !Array.isArray(chef.specialties)) continue;
      
      for (const specialty of chef.specialties) {
        if (!specialty) continue;
        
        const cuisineKey = specialty.toLowerCase();
        if (!cuisineKitchenMap.has(cuisineKey)) {
          cuisineKitchenMap.set(cuisineKey, new Set());
        }
        
        // Add chef to this cuisine's kitchen set
        cuisineKitchenMap.get(cuisineKey)!.add(chef._id);
      }
    }
    
    // Convert to array format with counts
    const categories = Array.from(cuisineKitchenMap.entries())
      .map(([cuisineKey, kitchenSet]) => {
        // Get original cuisine name (capitalize first letter)
        const cuisineName = cuisineKey
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        return {
          id: cuisineKey,
          name: cuisineName,
          kitchen_count: kitchenSet.size,
          image_url: null, // Can be enhanced later with actual cuisine images
          is_active: true,
        };
      })
      .sort((a, b) => b.kitchen_count - a.kitchen_count); // Sort by kitchen count descending
    
    return ResponseFactory.success({
      categories,
      total: categories.length,
    });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch cuisine categories.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

