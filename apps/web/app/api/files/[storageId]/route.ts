import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { getConvexClient } from '@/lib/conxed-client';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/files/[storageId]
 * 
 * Serves files from Convex storage by redirecting to the Convex storage URL.
 * This allows images and other files uploaded to Convex to be served through
 * the application's API.
 * 
 * Cached by Cloudflare for 1 year since storage IDs are immutable.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storageId: string }> }
): Promise<NextResponse> {
  try {
    // Await params in Next.js 15+
    const { storageId } = await params;

    if (!storageId) {
      return new NextResponse('Storage ID is required', { status: 400 });
    }

    const convex = getConvexClient();

    // Validate storage ID format (Convex storage IDs start with 'kg' or 'j')
    if (!storageId.match(/^(kg|j)[a-z0-9]+$/)) {
      logger.warn(`Invalid storage ID format: ${storageId}`);
      return new NextResponse('Invalid storage ID format', { status: 400 });
    }

    // Get the file URL from Convex storage using the getVideoUrl query
    // (it works for any storage ID, not just videos)
    const fileUrl = await convex.query(api.queries.videoPosts.getVideoUrl, {
      storageId: storageId as Id<'_storage'>
    });

    if (!fileUrl) {
      logger.warn(`File not found for storage ID: ${storageId}`);
      return new NextResponse('File not found', { status: 404 });
    }

    // Redirect to the Convex storage URL with Cloudflare caching headers
    // Cache for 1 year since storage IDs are immutable
    const response = NextResponse.redirect(fileUrl);
    
    // Set Cloudflare cache headers
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('CDN-Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('Cloudflare-CDN-Cache-Control', 'public, max-age=31536000, immutable');
    
    return response;
  } catch (error) {
    logger.error('Error serving file:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

