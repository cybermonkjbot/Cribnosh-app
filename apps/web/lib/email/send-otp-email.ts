import { EmailService } from './email.service';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_EQsb5GpW_HkaiK9VCCYjwAYH2Jd8xP5VN';

const emailService = new EmailService({
  resend: {
    apiKey: RESEND_API_KEY!,
  },
});

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
  recipientName,
  expiryMinutes = 5,
}: {
  email: string;
  otpCode: string;
  recipientName?: string;
  expiryMinutes?: number;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Generate HTML content using the template renderer
    const templateRenderer = emailService.getTemplateRenderer();
    const htmlContent = await templateRenderer.renderOTPVerificationEmail({
      otpCode,
      recipientName,
      expiryMinutes,
    });

    const payload = {
      to: email,
      from: 'verify@emails.cribnosh.com',
      subject: `Verify your email - ${otpCode}`,
      text: `Your CribNosh verification code is: ${otpCode}\n\nThis code will expire in ${expiryMinutes} minutes.\n\nIf you didn't request this verification code, please ignore this email.`,
      html: htmlContent,
    };

    const result = await emailService.send(payload);
    
    return {
      success: true,
      messageId: result,
    };
  } catch (error) {
    console.error('Failed to send OTP email:', {
      error,
      email,
      otpCode,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    // Extract more detailed error information
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
      // Check for Resend-specific errors
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        errorMessage = 'Email service configuration error. Please contact support.';
      } else if (error.message.includes('domain') || error.message.includes('from')) {
        errorMessage = 'Email domain not verified. Please contact support.';
      } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
        errorMessage = 'Email sending rate limit exceeded. Please try again later.';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}
