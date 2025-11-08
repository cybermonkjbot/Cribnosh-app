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


// Notion Configuration
const NOTION_TOKEN = validatedEnv.NOTION_TOKEN || '';
const NOTION_DATABASE_ID = validatedEnv.NOTION_DATABASE_ID || '';

// Mattermost Configuration
const MATTERMOST_WEBHOOK_URL = validatedEnv.MATTERMOST_WEBHOOK_URL || '';
const MATTERMOST_BOT_TOKEN = validatedEnv.MATTERMOST_BOT_TOKEN || '';
const MATTERMOST_SERVER_URL = validatedEnv.MATTERMOST_SERVER_URL || '';
const MATTERMOST_CHANNEL_ID = validatedEnv.MATTERMOST_CHANNEL_ID || '';
const MATTERMOST_TEAM_ID = validatedEnv.MATTERMOST_TEAM_ID || '';

// Staff Portal Configuration
const STAFF_PORTAL_ENABLED = validatedEnv.STAFF_PORTAL_ENABLED === 'true' ? 'true' : 'false';
const STAFF_ACCESS_TOKEN = validatedEnv.STAFF_ACCESS_TOKEN || '';
const NEXT_PUBLIC_MATTERMOST_URL = validatedEnv.NEXT_PUBLIC_MATTERMOST_URL || '';

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
  
  
  // Notion Configuration
  NOTION_TOKEN,
  NOTION_DATABASE_ID,
  
  // Mattermost Configuration
  MATTERMOST_WEBHOOK_URL,
  MATTERMOST_BOT_TOKEN,
  MATTERMOST_SERVER_URL,
  MATTERMOST_CHANNEL_ID,
  MATTERMOST_TEAM_ID,
  
  // Staff Portal Configuration
  STAFF_PORTAL_ENABLED,
  STAFF_ACCESS_TOKEN,
  NEXT_PUBLIC_MATTERMOST_URL,
  
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
};

export const env = fullEnv;
export { fullEnv };
