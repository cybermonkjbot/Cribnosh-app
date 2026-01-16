/**
 * Environment Variable Validation Schema
 * 
 * Validates all environment variables at application startup.
 * Logs warnings for missing or invalid variables but does not throw errors.
 * This allows the app to start even with missing configuration.
 */

import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

/**
 * Environment variable validation schema
 * 
 * All variables are optional to allow the app to start in any environment.
 * Validation warnings are logged but do not prevent startup.
 */
const getEnvSchema = () => {
  return z.object({
    // Core Application Configuration
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    NEXT_PUBLIC_CONVEX_URL: z.string().url('NEXT_PUBLIC_CONVEX_URL must be a valid URL').optional(),
    NEXT_PUBLIC_BASE_URL: z.string().url('NEXT_PUBLIC_BASE_URL must be a valid URL').optional(),
    JWT_SECRET: z.string().optional().or(z.literal('')),

    // Session Transfer Secret - Optional (falls back to JWT_SECRET, NEXTAUTH_SECRET, or AUTH_SECRET)
    SESSION_TRANSFER_SECRET: z.string().optional(),
    NEXTAUTH_SECRET: z.string().optional(),
    AUTH_SECRET: z.string().optional(),

    // Payment Processing (Stripe) - Optional (warnings logged if invalid)
    STRIPE_SECRET_KEY: z.string().refine(
      (val) => !val || val === '' || val.startsWith('sk_'),
      'STRIPE_SECRET_KEY must start with "sk_"'
    ).optional(),
    STRIPE_PUBLISHABLE_KEY: z.string().refine(
      (val) => !val || val === '' || val.startsWith('pk_'),
      'STRIPE_PUBLISHABLE_KEY must start with "pk_"'
    ).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().refine(
      (val) => !val || val === '' || val.startsWith('whsec_'),
      'STRIPE_WEBHOOK_SECRET must start with "whsec_"'
    ).optional(),

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





    // Staff Portal Configuration - Optional
    STAFF_PORTAL_ENABLED: z.string().optional(),
    STAFF_ACCESS_TOKEN: z.string().optional(),


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

  });
};

const envSchema = getEnvSchema();

/**
 * Validates environment variables and returns typed environment object
 * 
 * Logs warnings for missing or invalid variables but never throws errors.
 * This allows the app to start in any environment, even with missing configuration.
 */
export function validateEnv(): z.infer<ReturnType<typeof getEnvSchema>> {
  // Get all environment variables
  const rawEnv = process.env;
  const isProduction = rawEnv.NODE_ENV === 'production';
  const envLabel = isProduction ? '[PROD]' : '[DEV]';

  // Get schema appropriate for environment
  const schema = getEnvSchema();

  try {
    // Parse and validate with schema appropriate for environment
    const validatedEnv = schema.parse(rawEnv);

    // Check for critical variables and warn if missing (but don't fail)
    const missingVars: string[] = [];
    const invalidVars: string[] = [];

    if (!validatedEnv.NEXT_PUBLIC_CONVEX_URL) {
      missingVars.push('NEXT_PUBLIC_CONVEX_URL');
    }

    if (!validatedEnv.JWT_SECRET) {
      missingVars.push('JWT_SECRET');
    } else if (validatedEnv.JWT_SECRET.length > 0 && validatedEnv.JWT_SECRET.length < 32) {
      invalidVars.push('JWT_SECRET (must be at least 32 characters)');
    }

    if (!validatedEnv.STRIPE_SECRET_KEY) {
      missingVars.push('STRIPE_SECRET_KEY');
    }

    if (!validatedEnv.STRIPE_PUBLISHABLE_KEY) {
      missingVars.push('STRIPE_PUBLISHABLE_KEY');
    }

    if (!validatedEnv.STRIPE_WEBHOOK_SECRET) {
      missingVars.push('STRIPE_WEBHOOK_SECRET');
    }

    if (missingVars.length > 0 || invalidVars.length > 0) {
      const warnings: string[] = [];
      if (missingVars.length > 0) {
        warnings.push(`Missing variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}`);
      }
      if (invalidVars.length > 0) {
        warnings.push(`Invalid variables:\n${invalidVars.map(v => `  - ${v}`).join('\n')}`);
      }

      logger.warn(`${envLabel} Environment variable validation warnings:\n${warnings.join('\n\n')}\n\nThe app will continue to start, but some features may not work correctly.`);
    }

    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Always warn about validation errors, never throw
      const errorMessages = error.issues.map((err: z.ZodIssue) => {
        const path = err.path.join('.');
        return `  - ${path}: ${err.message}`;
      });

      logger.warn(`${envLabel} Environment variable validation warnings:\n${errorMessages.join('\n')}\n\nThe app will continue to start, but some features may not work correctly.`);

      // Return raw env with defaults for missing values, ignoring validation errors
      // Create a safe object that matches the schema type but allows invalid values
      // Use passthrough to allow any values
      const lenientSchema = schema.partial().passthrough();
      try {
        return lenientSchema.parse(rawEnv) as z.infer<ReturnType<typeof getEnvSchema>>;
      } catch {
        // If even passthrough fails, return raw env with type assertion
        return {
          ...rawEnv,
          NODE_ENV: (rawEnv.NODE_ENV || 'development') as 'development' | 'production' | 'test',
          LOG_LEVEL: (rawEnv.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
          AWS_REGION: rawEnv.AWS_REGION || 'eu-west-2',
        } as z.infer<ReturnType<typeof getEnvSchema>>;
      }
    }

    // For non-Zod errors, log and continue
    logger.warn(`${envLabel} Unexpected error during environment validation: ${error instanceof Error ? error.message : String(error)}`);

    // Return raw env with type assertion as fallback
    return {
      ...rawEnv,
      NODE_ENV: (rawEnv.NODE_ENV || 'development') as 'development' | 'production' | 'test',
      LOG_LEVEL: (rawEnv.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
      AWS_REGION: rawEnv.AWS_REGION || 'eu-west-2',
    } as z.infer<ReturnType<typeof getEnvSchema>>;
  }
}

/**
 * Get validated environment variables
 * This should be called at application startup
 * 
 * Note: This will use defaults for missing optional variables and log warnings
 * for missing or invalid variables, but will never throw errors.
 */
export const validatedEnv = validateEnv();

/**
 * Type-safe environment variables
 * Use this instead of process.env directly
 */
export type ValidatedEnv = z.infer<ReturnType<typeof getEnvSchema>>;

