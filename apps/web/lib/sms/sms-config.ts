import { SMS_PROVIDERS, DEFAULT_SMS_PROVIDER, type SMSConfig } from './sms-providers';

// SMS Configuration for CribNosh (UK-focused)
export const SMS_CONFIG = {
  // Default provider (The SMS Works - best UK SMS provider)
  defaultProvider: DEFAULT_SMS_PROVIDER,
  
  // Available providers with their pricing
  providers: SMS_PROVIDERS,
  
  // Default sender ID for CribNosh
  defaultSenderId: 'CribNosh',
  
  // OTP message templates
  messages: {
    otp: (code: string, expiryMinutes: number = 5) => 
      `Your CribNosh verification code is: ${code}. Valid for ${expiryMinutes} minutes. Do not share this code with anyone.`,
    
    welcome: (name: string) => 
      `Welcome to CribNosh, ${name}! Your account has been verified successfully. Start exploring delicious meals from local food creators.`,
    
    orderConfirmation: (orderId: string) => 
      `Your CribNosh order #${orderId} has been confirmed! Track your order in the app.`,
    
    deliveryUpdate: (orderId: string, status: string) => 
      `Your CribNosh order #${orderId} status: ${status}. Track your order in the app.`
  },
  
  // Rate limiting settings
  rateLimit: {
    maxOTPsPerPhone: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 50 : 4, // Set to 4 for production as requested
    maxOTPsPerEmail: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 30 : 4, // Set to 4 for production as requested
    cooldownMinutes: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 0 : 1, // No cooldown for development/testing
  },
  
  // Retry settings
  retry: {
    maxAttempts: 3,
    delayMs: 1000, // 1 second delay between retries
  }
};

// Environment-based SMS configuration
export function getSMSConfig(): SMSConfig {
  const providerName = process.env.SMS_PROVIDER || DEFAULT_SMS_PROVIDER;
  const provider = SMS_PROVIDERS[providerName];
  
  if (!provider) {
    throw new Error(`Invalid SMS provider: ${providerName}`);
  }

  return {
    provider,
    apiKey: process.env.SMS_API_KEY,
    username: process.env.SMS_USERNAME,
    password: process.env.SMS_PASSWORD,
    token: process.env.SMS_TOKEN,
    senderId: process.env.SMS_SENDER_ID || SMS_CONFIG.defaultSenderId,
  };
}

// Get pricing information for all providers
export function getProviderPricing() {
  return Object.entries(SMS_PROVIDERS).map(([key, provider]) => ({
    id: key,
    name: provider.name,
    pricePerSMS: provider.pricing.perSMS,
    currency: provider.pricing.currency,
    isDefault: key === DEFAULT_SMS_PROVIDER
  }));
}

// Validate SMS configuration
export function validateSMSConfig(config: SMSConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.provider) {
    errors.push('SMS provider is required');
  }
  
  if (!config.senderId) {
    errors.push('Sender ID is required');
  }
  
  // Validate authentication based on provider type
  switch (config.provider?.authType) {
    case 'api_key':
      if (!config.apiKey) {
        errors.push('API key is required for this provider');
      }
      break;
    case 'username_password':
      if (!config.username || !config.password) {
        errors.push('Username and password are required for this provider');
      }
      break;
    case 'token':
      if (!config.token) {
        errors.push('Token is required for this provider');
      }
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
