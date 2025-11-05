/**
 * Utility to manage email images in Convex storage
 * Ensures all images used in emails are stored in Convex
 */

import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export interface EmailImageAsset {
  originalUrl: string;
  storageId: Id<'_storage'>;
  contentType: string;
  purpose: string;
  alt?: string;
}

/**
 * Upload an image from an external URL to Convex storage
 */
export async function uploadImageToConvex(
  imageUrl: string,
  purpose: string,
  alt?: string
): Promise<string> {
  const convex = getConvexClient();

  // Check if we already have this image in Convex
  const existing = await convex.query(
    api.queries.emailAssets.getByUrl,
    { url: imageUrl }
  ).catch(() => null);

  if (existing) {
    // Touch the asset to update lastUsed
    await convex.mutation(
      api.mutations.emailAssets.touchEmailAsset,
      { assetId: existing._id }
    ).catch(() => {});
    
    // Get the public URL
    const url = await convex.query(
      api.queries.emailAssets.getEmailAssetUrl,
      { assetId: existing._id }
    ).catch(() => null);
    
    return url || imageUrl; // Fallback to original if no URL generated
  }

  try {
    // Fetch the image from the external URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: contentType });

    // Generate upload URL
    const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);

    // Upload to Convex storage
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
      },
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload to Convex storage: ${uploadResponse.statusText}`);
    }

    const { storageId } = await uploadResponse.json();
    if (!storageId) {
      throw new Error('No storageId in upload response');
    }

    // Get dimensions if possible (for metadata)
    const metadata: { width?: number; height?: number; size: number } = {
      size: blob.size,
    };

    try {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      await new Promise<void>((resolve) => {
        img.onload = () => {
          metadata.width = img.width;
          metadata.height = img.height;
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(); // Don't fail if can't get dimensions
        };
        img.src = url;
      });
    } catch {
      // Ignore dimension extraction errors
    }

    // Store metadata in Convex
    await convex.mutation(
      api.mutations.emailAssets.uploadEmailAsset,
      {
        url: imageUrl,
        storageId: storageId as Id<'_storage'>,
        contentType,
        purpose,
        alt,
        metadata,
      }
    ).catch((err) => {
      console.error('Failed to store email asset metadata:', err);
    });

    // Get the public URL - use storageId directly since we just uploaded it
    return `/api/files/${storageId}`;
  } catch (error) {
    console.error(`Failed to upload image ${imageUrl} to Convex:`, error);
    // Return original URL if upload fails
    return imageUrl;
  }
}

/**
 * Replace all external image URLs in HTML with Convex storage URLs
 */
export async function migrateEmailImagesToConvex(
  html: string,
  purpose: string = 'email-template'
): Promise<string> {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const matches = Array.from(html.matchAll(imgRegex));

  let modifiedHtml = html;

  for (const match of matches) {
    const imageUrl = match[1];

    // Skip if already a Convex URL or data URI
    if (
      imageUrl.startsWith('data:') ||
      imageUrl.startsWith('/api/files/') ||
      imageUrl.startsWith('/api/storage/') ||
      imageUrl.includes('track') ||
      imageUrl.includes('tracking')
    ) {
      continue;
    }

    try {
      const convexUrl = await uploadImageToConvex(imageUrl, purpose);
      modifiedHtml = modifiedHtml.replace(imageUrl, convexUrl);
    } catch (error) {
      console.error(`Failed to migrate image ${imageUrl}:`, error);
      // Keep original URL if migration fails
    }
  }

  return modifiedHtml;
}

/**
 * Get Convex URL for an image by its original URL
 */
export async function getConvexImageUrl(
  originalUrl: string
): Promise<string | null> {
  const convex = getConvexClient();

  const asset = await convex.query(
    api.queries.emailAssets.getByUrl,
    { url: originalUrl }
  ).catch(() => null);

  if (!asset) {
    return null;
  }

  const url = await convex.query(
    api.queries.emailAssets.getEmailAssetUrl,
    { assetId: asset._id }
  ).catch(() => null);

  return url;
}

