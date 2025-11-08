/**
 * Environment Variable Validation Schema
 * 
 * Validates all environment variables at application startup.
 * Fails fast with clear error messages if required variables are missing or invalid.
 */

import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

/**
 * Environment variable validation schema
 * 
 * Required variables are marked as non-empty strings.
 * Optional variables can be empty strings or have defaults.
 */
const envSchema = z.object({
  // Core Application Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_CONVEX_URL: z.string().url('NEXT_PUBLIC_CONVEX_URL must be a valid URL'),
  NEXT_PUBLIC_BASE_URL: z.string().url('NEXT_PUBLIC_BASE_URL must be a valid URL').optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  
  // Payment Processing (Stripe) - Required in production
  STRIPE_SECRET_KEY: z.string().refine(
    (val) => val === '' || val.startsWith('sk_'),
    'STRIPE_SECRET_KEY must start with "sk_"'
  ),
  STRIPE_PUBLISHABLE_KEY: z.string().refine(
    (val) => val === '' || val.startsWith('pk_'),
    'STRIPE_PUBLISHABLE_KEY must start with "pk_"'
  ),
  STRIPE_WEBHOOK_SECRET: z.string().refine(
    (val) => val === '' || val.startsWith('whsec_'),
    'STRIPE_WEBHOOK_SECRET must start with "whsec_"'
  ),
  
  // Live Streaming (Agora) - Optional
  AGORA_APP_ID: z.string().optional(),
  AGORA_APP_CERTIFICATE: z.string().optional(),
  
  // Document Storage (S3) - Optional
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('eu-west-2'),
  S3_BUCKET_NAME: z.string().optional(),
  
  // Email Configuration - Optional (can use Resend or SMTP)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  
  // Notion Configuration - Optional
  NOTION_TOKEN: z.string().optional(),
  NOTION_DATABASE_ID: z.string().optional(),
  
  // Mattermost Configuration - Optional
  MATTERMOST_WEBHOOK_URL: z.string().url().optional().or(z.literal('')),
  MATTERMOST_BOT_TOKEN: z.string().optional(),
  MATTERMOST_SERVER_URL: z.string().url().optional().or(z.literal('')),
  MATTERMOST_CHANNEL_ID: z.string().optional(),
  MATTERMOST_TEAM_ID: z.string().optional(),
  
  // Staff Portal Configuration - Optional
  STAFF_PORTAL_ENABLED: z.string().optional(),
  STAFF_ACCESS_TOKEN: z.string().optional(),
  NEXT_PUBLIC_MATTERMOST_URL: z.string().url().optional().or(z.literal('')),
  
  // Cloudflare Configuration - Optional
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  
  // Application Configuration
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DISABLE_DARK_MODE: z.string().optional(),
  DISABLE_TRY_IT: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().optional(),
  RATE_LIMIT_MAX_REQUESTS: z.string().optional(),
  
  // API Timeout Configuration
  EXTERNAL_API_TIMEOUT: z.string().optional(),
  HEALTH_CHECK_TIMEOUT: z.string().optional(),
  
  // Apple Maps API - Optional
  APPLE_MAPS_API_KEY: z.string().optional(),
  
  // SMS Services - Optional
  SMS_PROVIDER: z.string().optional(),
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().optional(),
  
  // External Services - Optional
  HULY_API_URL: z.string().url().optional().or(z.literal('')),
  NEXT_PUBLIC_HULY_URL: z.string().url().optional().or(z.literal('')),
  
  // AI Services - Optional
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  HF_TOKEN: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),
  
  // Redis Configuration - Optional
  REDIS_URL: z.string().url().optional().or(z.literal('')),
  DRAGONFLY_URL: z.string().url().optional().or(z.literal('')),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().optional(),
  
  // MinIO Configuration - Optional
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_BUCKET: z.string().optional(),
  MINIO_PORT: z.string().optional(),
  MINIO_USE_SSL: z.string().optional(),
  
  // Other Optional Variables
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  SLACK_CHANGELOG_WEBHOOK: z.string().url().optional().or(z.literal('')),
  NEXT_PUBLIC_USE_CUSTOM_POINTER: z.string().optional(),
  
  // Test URLs - Optional (development only)
  TEST_ONBOARDING_URL: z.string().url().optional().or(z.literal('')),
  TEST_MATTERMOST_SETUP_URL: z.string().url().optional().or(z.literal('')),
  TEST_MATTERMOST_COMPLETE_URL: z.string().url().optional().or(z.literal('')),
});

/**
 * Validates environment variables and returns typed environment object
 * 
 * @throws {Error} If validation fails with detailed error messages
 */
export function validateEnv(): z.infer<typeof envSchema> {
  // Get all environment variables
  const rawEnv = process.env;
  const isProduction = rawEnv.NODE_ENV === 'production';
  
  try {
    // Parse and validate
    const validatedEnv = envSchema.parse(rawEnv);
    
    // In production, check for critical required variables
    if (isProduction) {
      const criticalErrors: string[] = [];
      
      if (!validatedEnv.NEXT_PUBLIC_CONVEX_URL) {
        criticalErrors.push('NEXT_PUBLIC_CONVEX_URL is required in production');
      }
      
      if (!validatedEnv.JWT_SECRET || validatedEnv.JWT_SECRET.length < 32) {
        criticalErrors.push('JWT_SECRET must be at least 32 characters in production');
      }
      
      if (criticalErrors.length > 0) {
        const errorMessage = `Critical environment variables missing in production:\n${criticalErrors.map(e => `  - ${e}`).join('\n')}\n\nPlease check your environment variables.`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
    }
    
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors for better readability
      const errorMessages = error.issues.map((err: z.ZodIssue) => {
        const path = err.path.join('.');
        return `  - ${path}: ${err.message}`;
      });
      
      const errorMessage = `Environment variable validation failed:\n${errorMessages.join('\n')}\n\nPlease check your .env.local file and ensure all required variables are set correctly.`;
      
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    throw error;
  }
}

/**
 * Get validated environment variables
 * This should be called at application startup
 * 
 * Note: In development, this will use defaults for missing optional variables.
 * In production, critical variables must be set.
 */
export const validatedEnv = validateEnv();

/**
 * Type-safe environment variables
 * Use this instead of process.env directly
 */
export type ValidatedEnv = z.infer<typeof envSchema>;

