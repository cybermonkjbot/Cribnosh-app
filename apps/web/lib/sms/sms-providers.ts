// SMS Provider configuration for UK SMS services
import { logger } from '@/lib/utils/logger';
export interface SMSProvider {
  name: string;
  baseUrl: string;
  sendEndpoint: string;
  verifyEndpoint?: string;
  authType: 'api_key' | 'username_password' | 'token';
  authHeader: string;
  pricing: {
    perSMS: number; // in GBP pence
    currency: 'GBP';
  };
}

export interface SMSConfig {
  provider: SMSProvider;
  apiKey?: string;
  username?: string;
  password?: string;
  token?: string;
  senderId?: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  cost?: number;
  error?: string;
}

export interface OTPMessage {
  phone: string;
  code: string;
  expiryMinutes?: number;
  message?: string;
}

// UK SMS Provider - The SMS Works (Best UK-focused provider)
export const SMS_PROVIDERS: Record<string, SMSProvider> = {
  // The SMS Works - Cheapest UK SMS provider
  the_sms_works: {
    name: 'The SMS Works',
    baseUrl: 'https://api.thesmsworks.co.uk',
    sendEndpoint: '/api/send',
    authType: 'api_key',
    authHeader: 'Authorization',
    pricing: {
      perSMS: 2.37, // 2.37p + VAT per SMS (only charged for delivered messages)
      currency: 'GBP'
    }
  }
};

// Default provider (The SMS Works - best UK SMS provider)
export const DEFAULT_SMS_PROVIDER = 'the_sms_works';

// SMS Service Class
export class SMSService {
  private config: SMSConfig;

  constructor(config: SMSConfig) {
    this.config = config;
  }

  async sendOTP(message: OTPMessage): Promise<SMSResponse> {
    try {
      const { phone, code, expiryMinutes = 5, message: customMessage } = message;
      
      // Format phone number for UK use
      const formattedPhone = this.formatUKPhone(phone);
      
      // Create OTP message
      const otpMessage = customMessage || 
        `Your CribNosh verification code is: ${code}. Valid for ${expiryMinutes} minutes. Do not share this code with anyone.`;

      // Send SMS via The SMS Works (UK provider)
      if (this.config.provider.name === 'The SMS Works') {
        return await this.sendViaTheSMSWorks(formattedPhone, otpMessage);
      } else {
        throw new Error(`Unsupported SMS provider: ${this.config.provider.name}`);
      }
    } catch (error) {
      logger.error('SMS sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS'
      };
    }
  }

  private formatUKPhone(phone: string): string {
    // Remove all non-digits and plus sign
    let cleaned = phone.replace(/[^\d]/g, '');
    
    // Handle UK phone number formats
    if (cleaned.startsWith('0')) {
      // UK number starting with 0 (e.g., 07123456789)
      cleaned = '44' + cleaned.substring(1);
    } else if (cleaned.startsWith('44')) {
      // Already has UK country code
      // Do nothing
    } else if (cleaned.length === 10) {
      // Assume UK number without country code
      cleaned = '44' + cleaned;
    } else if (cleaned.length < 10) {
      // Too short, assume UK number
      cleaned = '44' + cleaned;
    }
    
    return '+' + cleaned;
  }

  private async sendViaTheSMSWorks(phone: string, message: string): Promise<SMSResponse> {
    const response = await fetch(`${this.config.provider.baseUrl}${this.config.provider.sendEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [this.config.provider.authHeader]: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        sender: this.config.senderId || 'CribNosh'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.status === 'success') {
      return {
        success: true,
        messageId: data.message_id || data.id,
        cost: this.config.provider.pricing.perSMS
      };
    }

    return {
      success: false,
      error: data.message || 'Failed to send SMS'
    };
  }

  // Get provider pricing information
  getPricing(): { perSMS: number; currency: string } {
    return this.config.provider.pricing;
  }

  // Get provider name
  getProviderName(): string {
    return this.config.provider.name;
  }
}

// Factory function to create SMS service
export function createSMSService(
  providerName: string = DEFAULT_SMS_PROVIDER,
  credentials: {
    apiKey?: string;
    username?: string;
    password?: string;
    token?: string;
    senderId?: string;
  } = {}
): SMSService {
  const provider = SMS_PROVIDERS[providerName];
  if (!provider) {
    throw new Error(`Unknown SMS provider: ${providerName}`);
  }

  const config: SMSConfig = {
    provider,
    ...credentials
  };

  return new SMSService(config);
}