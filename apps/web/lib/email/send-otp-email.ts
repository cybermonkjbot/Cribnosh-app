import { api } from '@/convex/_generated/api';
import { logger } from '@/lib/utils/logger';
import { ConvexHttpClient } from 'convex/browser';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || '';
const httpClient = new ConvexHttpClient(CONVEX_URL);

export function generateOTPCode(length: number = 6): string {
  const digits = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return result;
}

export async function sendOTPEmail({
  email,
  otpCode,
  recipientName = 'Valued Customer',
  expiryMinutes = 5,
}: {
  email: string;
  otpCode: string;
  recipientName?: string;
  expiryMinutes?: number;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Send via Convex action which uses the template system
    await httpClient.action(api.actions.resend.sendTemplateEmail, {
      emailType: 'otp_verification',
      to: email,
      variables: {
        otpCode,
        recipientName,
        expiryMinutes: expiryMinutes.toString(),
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error('Failed to send OTP email via Convex:', {
      error,
      email,
      otpCode,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
