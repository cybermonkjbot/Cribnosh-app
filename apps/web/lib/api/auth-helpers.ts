/**
 * Authentication Helpers
 * Reusable functions for JWT verification and authentication
 */

import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * Verify JWT token from request and return payload
 * @throws Error if token is invalid or missing
 */
export function verifyJWT(request: NextRequest): JWTPayload {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid or missing token');
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify JWT token and check if user has required role
 * @throws Error if token is invalid, missing, or user doesn't have required role
 */
export function verifyJWTWithRole(request: NextRequest, requiredRole: string): JWTPayload {
  const payload = verifyJWT(request);
  
  if (!payload.roles?.includes(requiredRole)) {
    throw new Error(`Forbidden: Only ${requiredRole}s can access this resource.`);
  }
  
  return payload;
}

/**
 * Get error message from unknown error
 */
export { getErrorMessage };

