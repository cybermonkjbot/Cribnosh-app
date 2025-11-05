import { Id } from '@/convex/_generated/dataModel';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

interface JWTPayload {
  user_id: string;
  role?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * Extract userId from NextRequest authorization header
 * Returns undefined if no valid token is found
 */
export function extractUserIdFromRequest(request: NextRequest): Id<'users'> | undefined {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return undefined;
  }
  
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return payload.user_id as Id<'users'>;
  } catch {
    return undefined;
  }
}

