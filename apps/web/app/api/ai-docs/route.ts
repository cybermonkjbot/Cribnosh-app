/**
 * @swagger
 * components:
 *   schemas:
 *     AIDocumentation:
 *       type: object
 *       properties:
 *         "@context":
 *           type: string
 *           example: "https://ai.documentation/v1"
 *         version:
 *           type: string
 *           example: "1.0"
 *         service:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "CribNosh"
 *             description:
 *               type: string
 *               example: "The app for foodies connecting local chefs with food enthusiasts"
 *             baseUrl:
 *               type: string
 *               example: "https://cribnosh.com"
 *         authentication:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: "Bearer"
 *             location:
 *               type: string
 *               example: "header"
 *             name:
 *               type: string
 *               example: "Authorization"
 *         endpoints:
 *           type: array
 *           description: Available API endpoints
 *         dataModels:
 *           type: object
 *           description: Data model definitions
 *         aiCapabilities:
 *           type: object
 *           description: AI capabilities and features
 *         semanticAnnotations:
 *           type: object
 *           description: Semantic annotations for AI understanding
 */

import { NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cribnosh.com';

/**
 * @swagger
 * /api/ai-docs:
 *   get:
 *     summary: Get AI documentation
 *     description: Retrieve AI-specific documentation for the CribNosh API including semantic annotations and AI capabilities
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: AI documentation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AIDocumentation'
 *                 message:
 *                   type: string
 *                   example: "AI documentation retrieved successfully"
 *                 cache:
 *                   type: object
 *                   properties:
 *                     cached:
 *                       type: boolean
 *                       example: false
 *                     ttl:
 *                       type: number
 *                       example: 3600
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T11:30:00.000Z"
 *       500:
 *         description: Internal server error
 *     security: []
 */
export async function GET() {
  const aiDocumentation = {
    "@context": "https://ai.documentation/v1",
    "version": "1.0",
    "service": {
      "name": "CribNosh",
      "description": "The app for foodies connecting local chefs with food enthusiasts",
      "baseUrl": baseUrl,
    },
    "authentication": {
      "type": "Bearer",
      "location": "header",
      "name": "Authorization"
    },
    "endpoints": [
      {
        "path": "/api/search",
        "method": "GET",
        "description": "Search for meals and chefs",
        "parameters": {
          "q": {
            "type": "string",
            "description": "Search query for cuisine or chef name",
            "required": true
          },
          "diet": {
            "type": "string",
            "description": "Dietary restrictions filter",
            "required": false
          },
          "location": {
            "type": "string",
            "description": "Location for searching nearby chefs",
            "required": false
          }
        }
      },
      {
        "path": "/api/booking",
        "method": "POST",
        "description": "Book a chef",
        "parameters": {
          "chef_id": {
            "type": "string",
            "description": "ID of the chef to book",
            "required": true
          },
          "date": {
            "type": "string",
            "format": "date-time",
            "description": "Requested booking date and time",
            "required": true
          }
        }
      }
    ],
    "dataModels": {
      "Chef": {
        "properties": {
          "id": "string",
          "name": "string",
          "cuisine": "string[]",
          "location": "GeoPoint",
          "rating": "number"
        }
      },
      "Meal": {
        "properties": {
          "id": "string",
          "name": "string",
          "description": "string",
          "price": "number",
          "dietary_info": "string[]",
          "ingredients": "string[]"
        }
      }
    },
    "aiCapabilities": {
      "natural_language": {
        "supported": true,
        "features": [
          "intent_recognition",
          "entity_extraction",
          "sentiment_analysis"
        ]
      },
      "contextual_understanding": {
        "supported": true,
        "features": [
          "user_preferences",
          "dietary_restrictions",
          "location_awareness"
        ]
      }
    },
    "semanticAnnotations": {
      "mealTypes": [
        "breakfast",
        "lunch",
        "dinner",
        "snack"
      ],
      "cuisineTypes": [
        "Italian",
        "Indian",
        "Mexican",
        "Chinese",
        "Japanese",
        "Thai",
        "Mediterranean"
      ],
      "dietaryRestrictions": [
        "vegetarian",
        "vegan",
        "gluten-free",
        "dairy-free",
        "halal",
        "kosher"
      ]
    }
  };

  return ResponseFactory.success(aiDocumentation, 'AI documentation retrieved successfully', 200, {
    cache: {
      cached: false,
      ttl: 3600,
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    }
  });
} 