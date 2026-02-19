/**
 * Environment Configuration
 * 
 * Uses validated environment variables from env-validation.ts
 * This ensures all required variables are present and valid at startup.
 */

import { validatedEnv } from './env-validation';

// Email Configuration
const SMTP_HOST = validatedEnv.SMTP_HOST || '';
const SMTP_PORT = validatedEnv.SMTP_PORT ? parseInt(validatedEnv.SMTP_PORT, 10) : undefined;
const SMTP_SECURE = validatedEnv.SMTP_SECURE === 'true';
const SMTP_USER = validatedEnv.SMTP_USER || '';
const SMTP_PASS = validatedEnv.SMTP_PASS || '';
const RESEND_API_KEY = validatedEnv.RESEND_API_KEY || '';

// Payment Processing (Stripe)
const STRIPE_SECRET_KEY = validatedEnv.STRIPE_SECRET_KEY || '';
const STRIPE_PUBLISHABLE_KEY = validatedEnv.STRIPE_PUBLISHABLE_KEY || '';
const STRIPE_WEBHOOK_SECRET = validatedEnv.STRIPE_WEBHOOK_SECRET || '';

// Live Streaming (Agora)
const AGORA_APP_ID = validatedEnv.AGORA_APP_ID || '';
const AGORA_APP_CERTIFICATE = validatedEnv.AGORA_APP_CERTIFICATE || '';

// Document Storage (S3)
const AWS_ACCESS_KEY_ID = validatedEnv.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = validatedEnv.AWS_SECRET_ACCESS_KEY || '';
const AWS_REGION = validatedEnv.AWS_REGION || 'eu-west-2';
const S3_BUCKET_NAME = validatedEnv.S3_BUCKET_NAME || '';






// Staff Portal Configuration
const STAFF_PORTAL_ENABLED = validatedEnv.STAFF_PORTAL_ENABLED === 'true' ? 'true' : 'false';
const STAFF_ACCESS_TOKEN = validatedEnv.STAFF_ACCESS_TOKEN || '';

// Azure Configuration
const CLOUD_PROVIDER = validatedEnv.CLOUD_PROVIDER || 'aws';
const AZURE_STORAGE_CONNECTION_STRING = validatedEnv.AZURE_STORAGE_CONNECTION_STRING || '';
const AZURE_STORAGE_CONTAINER_NAME = validatedEnv.AZURE_STORAGE_CONTAINER_NAME || '';
const AZURE_OPENAI_API_KEY = validatedEnv.AZURE_OPENAI_API_KEY || '';
const AZURE_OPENAI_ENDPOINT = validatedEnv.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_DEPLOYMENT_NAME = validatedEnv.AZURE_OPENAI_DEPLOYMENT_NAME || '';
const AZURE_OPENAI_API_VERSION = validatedEnv.AZURE_OPENAI_API_VERSION || '';


// Cloudflare Configuration
const CLOUDFLARE_ZONE_ID = validatedEnv.CLOUDFLARE_ZONE_ID || '';
const CLOUDFLARE_API_TOKEN = validatedEnv.CLOUDFLARE_API_TOKEN || '';

// Application Configuration
const NODE_ENV = validatedEnv.NODE_ENV || 'development';
const LOG_LEVEL = validatedEnv.LOG_LEVEL || 'info';
const DISABLE_DARK_MODE = validatedEnv.DISABLE_DARK_MODE === 'true' ? 'true' : 'false';
const DISABLE_TRY_IT = validatedEnv.DISABLE_TRY_IT === 'true' ? 'true' : 'false';

// Rate Limiting
const RATE_LIMIT_WINDOW_MS = validatedEnv.RATE_LIMIT_WINDOW_MS ? parseInt(validatedEnv.RATE_LIMIT_WINDOW_MS, 10) : 900000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = validatedEnv.RATE_LIMIT_MAX_REQUESTS ? parseInt(validatedEnv.RATE_LIMIT_MAX_REQUESTS, 10) : 800;


// Export full environment for backward compatibility
const fullEnv = {
  // Email Configuration
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  RESEND_API_KEY,

  // Payment Processing (Stripe)
  STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET,

  // Live Streaming (Agora)
  AGORA_APP_ID,
  AGORA_APP_CERTIFICATE,

  // Document Storage (S3)
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  S3_BUCKET_NAME,






  // Staff Portal Configuration
  STAFF_PORTAL_ENABLED,
  STAFF_ACCESS_TOKEN,


  // Cloudflare Configuration
  CLOUDFLARE_ZONE_ID,
  CLOUDFLARE_API_TOKEN,

  // Application Configuration
  NODE_ENV,
  LOG_LEVEL,
  DISABLE_DARK_MODE,
  DISABLE_TRY_IT,

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,

  // Azure Configuration
  CLOUD_PROVIDER,
  AZURE_STORAGE_CONNECTION_STRING,
  AZURE_STORAGE_CONTAINER_NAME,
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_DEPLOYMENT_NAME,
  AZURE_OPENAI_API_VERSION,
};

export const env = fullEnv;
export { fullEnv };
