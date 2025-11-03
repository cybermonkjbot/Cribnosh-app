import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'nosh-heaven-videos';
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

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
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `videos/${userId}/${timestamp}_${sanitizedFileName}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Metadata: {
      userId,
      uploadedAt: timestamp.toString(),
    },
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const publicUrl = CLOUDFRONT_DOMAIN 
    ? `https://${CLOUDFRONT_DOMAIN}/${key}`
    : `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

  return {
    uploadUrl,
    key,
    publicUrl,
  };
}

// Generate presigned URL for thumbnail upload
export async function generateThumbnailUploadUrl(
  userId: string,
  videoId: string,
  fileName: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `thumbnails/${userId}/${videoId}_${timestamp}_${sanitizedFileName}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Metadata: {
      userId,
      videoId,
      uploadedAt: timestamp.toString(),
    },
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const publicUrl = CLOUDFRONT_DOMAIN 
    ? `https://${CLOUDFRONT_DOMAIN}/${key}`
    : `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

  return {
    uploadUrl,
    key,
    publicUrl,
  };
}

// Generate presigned URL for video access (for private videos)
export async function generateVideoAccessUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

// Delete video from S3
export async function deleteVideoFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

// Delete thumbnail from S3
export async function deleteThumbnailFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

// Get public URL for a file
export function getPublicUrl(key: string): string {
  return CLOUDFRONT_DOMAIN 
    ? `https://${CLOUDFRONT_DOMAIN}/${key}`
    : `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
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

export { s3Client, BUCKET_NAME };
