import { BUCKET_NAME, CLOUDFRONT_DOMAIN, storage } from './storage';

// Video upload configuration
export const VIDEO_UPLOAD_CONFIG = {
  maxFileSize: 500 * 1024 * 1024, // 500MB
  allowedMimeTypes: [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/3gpp',
  ],
  allowedExtensions: ['.mp4', '.mov', '.avi', '.webm', '.3gp'],
  thumbnailFormats: ['jpg', 'jpeg', 'png', 'webp'],
};

// Generate presigned URL for video upload
export async function generateVideoUploadUrl(
  userId: string,
  fileName: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  return storage.generateUploadUrl(userId, fileName, contentType, 'videos', expiresIn);
}

// Generate presigned URL for thumbnail upload
export async function generateThumbnailUploadUrl(
  userId: string,
  videoId: string,
  fileName: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  return storage.generateUploadUrl(userId, fileName, contentType, 'thumbnails', expiresIn, { videoId });
}

// Generate presigned URL for video access (for private videos)
export async function generateVideoAccessUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  return storage.generateAccessUrl(key, expiresIn);
}

// Delete video from S3
export async function deleteVideoFromS3(key: string): Promise<void> {
  await storage.deleteFile(key);
}

// Delete thumbnail from S3
export async function deleteThumbnailFromS3(key: string): Promise<void> {
  await storage.deleteFile(key);
}

// Get public URL for a file
export function getPublicUrl(key: string): string {
  return storage.getPublicUrl(key);
}

// Extract key from S3 URL
export function extractKeyFromUrl(url: string): string | null {
  if (CLOUDFRONT_DOMAIN && url.includes(CLOUDFRONT_DOMAIN)) {
    return url.replace(`https://${CLOUDFRONT_DOMAIN}/`, '');
  }

  if (url.includes(BUCKET_NAME)) {
    const match = url.match(new RegExp(`${BUCKET_NAME}\\.s3[^/]*/(.+)`));
    return match ? match[1] : null;
  }

  return null;
}

// Validate video file
export function validateVideoFile(file: {
  name: string;
  size: number;
  type: string;
}): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > VIDEO_UPLOAD_CONFIG.maxFileSize) {
    return {
      isValid: false,
      error: `File size must be less than ${VIDEO_UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB`,
    };
  }

  // Check MIME type
  if (!VIDEO_UPLOAD_CONFIG.allowedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not supported. Allowed types: ${VIDEO_UPLOAD_CONFIG.allowedMimeTypes.join(', ')}`,
    };
  }

  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!VIDEO_UPLOAD_CONFIG.allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `File extension ${extension} is not supported. Allowed extensions: ${VIDEO_UPLOAD_CONFIG.allowedExtensions.join(', ')}`,
    };
  }

  return { isValid: true };
}

// Validate thumbnail file
export function validateThumbnailFile(file: {
  name: string;
  size: number;
  type: string;
}): { isValid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Thumbnail file size must be less than 10MB',
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Thumbnail type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `Thumbnail extension ${extension} is not supported. Allowed extensions: ${allowedExtensions.join(', ')}`,
    };
  }

  return { isValid: true };
}

export { BUCKET_NAME };

