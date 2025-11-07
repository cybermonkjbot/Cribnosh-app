import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { Id } from '@/convex/_generated/dataModel';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /customer/treats/{treat_token}:
 *   get:
 *     summary: Get treat by token
 *     description: Get treat details by share token
 *     tags: [Customer]
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { treat_token: string } }
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can access treats.');
    }
    
    const { treat_token } = params;
    if (!treat_token) {
      return ResponseFactory.validationError('treat_token is required.');
    }
    
    const convex = getConvexClient();
    const treat = await convex.mutation(api.mutations.treats.getTreatByToken, {
      treat_token,
    });
    
    if (!treat) {
      return ResponseFactory.notFound('Treat not found.');
    }
    
    return ResponseFactory.success(treat, 'Treat retrieved successfully');
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch treat.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

