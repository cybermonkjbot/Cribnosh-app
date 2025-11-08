/**
 * @swagger
 * components:
 *   schemas:
 *     SwaggerSpec:
 *       type: object
 *       properties:
 *         openapi:
 *           type: string
 *           example: "3.0.0"
 *         info:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *               example: "CribNosh API"
 *             version:
 *               type: string
 *               example: "1.0.0"
 *             description:
 *               type: string
 *               example: "API documentation for CribNosh platform"
 *         paths:
 *           type: object
 *           description: API endpoints
 *         components:
 *           type: object
 *           description: Reusable components and schemas
 */

import { NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import fs from 'fs';
import path from 'path';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get API documentation
 *     description: Retrieve the complete OpenAPI/Swagger specification for the CribNosh API
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Swagger specification retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SwaggerSpec'
 *         headers:
 *           Access-Control-Allow-Origin:
 *             schema:
 *               type: string
 *               example: "*"
 *           Access-Control-Allow-Methods:
 *             schema:
 *               type: string
 *               example: "GET, POST, PUT, DELETE, OPTIONS"
 *           Access-Control-Allow-Headers:
 *             schema:
 *               type: string
 *               example: "Content-Type, Authorization"
 *       500:
 *         description: Error generating Swagger specification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SwaggerSpec'
 *     security: []
 */
export async function GET() {
  try {
    // Try to read the static swagger.json file from public directory
    const swaggerPath = path.join(process.cwd(), 'public', 'swagger.json');
    
    if (fs.existsSync(swaggerPath)) {
      const swaggerSpec = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
      
      // Return raw OpenAPI spec for Swagger UI compatibility
      return new NextResponse(JSON.stringify(swaggerSpec), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    } else {
      // Fallback: Generate basic spec if static file doesn't exist
      logger.warn('Static swagger.json not found, generating basic spec');
      const basicSpec = {
        openapi: '3.0.0',
        info: {
          title: 'CribNosh API',
          version: '1.0.0',
          description: 'API documentation for CribNosh platform',
        },
        servers: [
          {
            url: process.env.NODE_ENV === 'production' 
              ? 'https://cribnosh.com/api' 
              : 'http://localhost:3000/api',
            description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
          },
        ],
        paths: {},
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'JWT token for API authentication. Include as "Bearer {token}" in Authorization header.',
            },
            cookieAuth: {
              type: 'apiKey',
              in: 'cookie',
              name: 'convex-auth-token',
              description: 'Session token stored in HTTP-only cookie for authentication.',
            },
          },
          schemas: {
            Error: {
              type: 'object',
              properties: {
                error: { type: 'string', description: 'Error message' },
                details: { type: 'object', description: 'Additional error details' },
                code: { type: 'string', description: 'Error code' },
              },
              required: ['error'],
            },
            Success: {
              type: 'object',
              properties: {
                success: { type: 'boolean', description: 'Success status' },
                data: { type: 'object', description: 'Response data' },
                message: { type: 'string', description: 'Success message' },
              },
              required: ['success'],
            },
          },
        },
        security: [
          { cookieAuth: [] },
        ],
      };
      
      return new NextResponse(JSON.stringify(basicSpec), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
  } catch (error) {
    logger.error('Error serving Swagger spec:', error);
    return ResponseFactory.error('Failed to load API documentation', 'SWAGGER_LOAD_ERROR', 500);
  }
}