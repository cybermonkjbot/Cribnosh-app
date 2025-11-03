# Dynamic Swagger Documentation Generator

This module provides automatic Swagger/OpenAPI documentation generation for the CribNosh API without requiring a massive static configuration file.

## How It Works

The dynamic generator automatically scans all API route files in the `app/api` directory and generates OpenAPI 3.0 specifications based on JSDoc annotations in your route handlers.

## Features

- ✅ **Automatic Route Discovery**: Scans all TypeScript files in `app/api/**/*.ts`
- ✅ **JSDoc-based Documentation**: Uses standard JSDoc comments with `@swagger` tags
- ✅ **No Static Config**: Eliminates the need for large static configuration files
- ✅ **Fallback Support**: Falls back to basic spec if generation fails
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Error Handling**: Graceful error handling with detailed logging

## Usage

### 1. Basic Setup

The generator is already configured and ready to use. Simply import and use it:

```typescript
import { swaggerGenerator } from '@/lib/swagger/dynamic-generator';

// Generate the complete OpenAPI spec
const spec = await swaggerGenerator.generateSpec();
```

### 2. Documenting API Endpoints

Add JSDoc comments with `@swagger` tags to your route handlers:

```typescript
/**
 * @swagger
 * /api/endpoint:
 *   get:
 *     summary: Get endpoint data
 *     description: Retrieve data from the endpoint
 *     tags: [Category]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - bearerAuth: []
 */
export async function GET(request: NextRequest) {
  // Your implementation
}
```

### 3. Available Schemas

The generator includes common schemas that you can reference:

- `#/components/schemas/Error` - Standard error response
- `#/components/schemas/Success` - Standard success response

### 4. Security Schemes

Two authentication methods are supported:

- `bearerAuth` - JWT Bearer token authentication
- `cookieAuth` - Cookie-based authentication

## Configuration

The generator uses the following default configuration:

```typescript
const cribNoshSwaggerConfig = {
  title: 'CribNosh API',
  version: '1.0.0',
  description: 'API documentation for CribNosh - Personalized meal platform...',
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://cribnosh.com/api' 
    : 'http://localhost:3000/api',
  contact: {
    name: 'CribNosh Support',
    email: 'support@cribnosh.com',
  },
  license: {
    name: 'Cribnosh Private Collab Licence',
  },
};
```

## File Discovery

The generator automatically finds API route files by:

1. Scanning `app/api/**/*.ts` for TypeScript files
2. Filtering out test files (`*.test.ts`, `*.spec.ts`)
3. Including files that are:
   - Named `route.ts`
   - Named `index.ts`
   - Located in subdirectories

## Examples

### Simple GET Endpoint

```typescript
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 *     security: []
 */
export async function GET() {
  return ResponseFactory.success({ status: 'healthy' });
}
```

### POST Endpoint with Request Body

```typescript
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 */
export async function POST(request: NextRequest) {
  // Implementation
}
```

### Endpoint with Query Parameters

```typescript
/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search resources
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results
 *     responses:
 *       200:
 *         description: Search results
 */
export async function GET(request: NextRequest) {
  // Implementation
}
```

## Benefits

1. **Maintainability**: Documentation lives next to the code
2. **Accuracy**: Documentation is always up-to-date with the code
3. **Scalability**: No need to maintain large static config files
4. **Developer Experience**: Easy to add documentation as you develop
5. **Type Safety**: Full TypeScript support with proper types

## Migration from Static Config

If you're migrating from a static configuration:

1. Remove the large static config file
2. Add JSDoc annotations to your route handlers
3. Update your docs route to use the dynamic generator
4. Test the generated documentation

The dynamic generator will automatically discover and document all your API endpoints based on the JSDoc annotations.

## Troubleshooting

### No Endpoints Found

If no endpoints are being discovered:

1. Ensure your route files are in `app/api/**/*.ts`
2. Check that files are named `route.ts` or `index.ts`
3. Verify JSDoc annotations use `@swagger` tags

### Generation Errors

If generation fails:

1. Check the console for detailed error messages
2. The generator will fall back to a basic spec
3. Verify JSDoc syntax is correct

### Missing Documentation

If endpoints aren't documented:

1. Add JSDoc comments with `@swagger` tags
2. Ensure the comment is directly above the function
3. Check that the OpenAPI syntax is valid
