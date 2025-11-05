import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';

export function withAdminAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Get the authorization header
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Verify the token and get user info
      const convex = getConvexClient();
      const user = await convex.query(api.queries.users.getUserByToken, { token });
      
      if (!user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }

      // Check if user has admin role
      if (!user.roles || !user.roles.includes('admin')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }

      // Add user info to request context
      const reqWithUser = req as NextRequest & { user: typeof user };
      reqWithUser.user = user;

      return handler(reqWithUser);
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
  };
} 