// Email Configuration
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

// Payment Processing (Stripe)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Live Streaming (Agora)
const AGORA_APP_ID = process.env.AGORA_APP_ID || '';
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '';

// Document Storage (S3)
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const AWS_REGION = process.env.AWS_REGION || 'eu-west-2';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || '';


// Notion Configuration
const NOTION_TOKEN = process.env.NOTION_TOKEN || '';
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '';

// Mattermost Configuration
const MATTERMOST_WEBHOOK_URL = process.env.MATTERMOST_WEBHOOK_URL || '';
const MATTERMOST_BOT_TOKEN = process.env.MATTERMOST_BOT_TOKEN || '';
const MATTERMOST_SERVER_URL = process.env.MATTERMOST_SERVER_URL || '';
const MATTERMOST_CHANNEL_ID = process.env.MATTERMOST_CHANNEL_ID || '';
const MATTERMOST_TEAM_ID = process.env.MATTERMOST_TEAM_ID || '';

// Staff Portal Configuration
const STAFF_PORTAL_ENABLED = process.env.STAFF_PORTAL_ENABLED === 'true' ? 'true' : 'false';
const STAFF_ACCESS_TOKEN = process.env.STAFF_ACCESS_TOKEN || '';
const NEXT_PUBLIC_MATTERMOST_URL = process.env.NEXT_PUBLIC_MATTERMOST_URL || '';

// Cloudflare Configuration
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

// Application Configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const DISABLE_DARK_MODE = process.env.DISABLE_DARK_MODE === 'true' ? 'true' : 'false';
const DISABLE_TRY_IT = process.env.DISABLE_TRY_IT === 'true' ? 'true' : 'false';

// Rate Limiting
const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) : 900000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) : 800;


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
