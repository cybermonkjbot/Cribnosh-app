# SMS Integration Guide for CribNosh (UK-focused)

## Overview
This guide explains how to integrate SMS services for OTP (One-Time Password) services in CribNosh. The system is now simplified to use only **The SMS Works**, the best UK-focused SMS provider.

## Supported Provider

### The SMS Works (UK-focused SMS Provider)

#### Provider Details
- **Price**: 2.37p + VAT per SMS (only charged for delivered messages)
- **Auth Type**: API Key
- **Website**: [The SMS Works](https://thesmsworks.co.uk)
- **Coverage**: UK-focused with excellent delivery rates
- **Features**: 
  - Only charges for delivered messages (saves ~8.9% on undelivered texts)
  - Price match guarantee
  - No contracts or hidden fees
  - 100% direct UK connections (white routes)

#### Setup Instructions

1. **Sign up for The SMS Works**:
   - Visit [thesmsworks.co.uk](https://thesmsworks.co.uk)
   - Create an account
   - Get your API key from the dashboard

2. **Configure Environment Variables**:
   ```bash
   # Add to your .env.local file
   SMS_PROVIDER=the_sms_works
   SMS_API_KEY=your_sms_works_api_key_here
   SMS_SENDER_ID=CribNosh
   ```

3. **Test the Integration**:
   - Use the OTP creation endpoint
   - Verify SMS delivery to UK numbers

## Implementation Details

### SMS Service Configuration

The SMS service is configured in `lib/sms/sms-providers.ts`:

```typescript
export const SMS_PROVIDERS: Record<string, SMSProvider> = {
  the_sms_works: {
    name: 'The SMS Works',
    baseUrl: 'https://api.thesmsworks.co.uk',
    sendEndpoint: '/api/send',
    authType: 'api_key',
    authHeader: 'Authorization',
    pricing: {
      perSMS: 2.37, // 2.37p + VAT per SMS
      currency: 'GBP'
    }
  }
};
```

### Phone Number Formatting

The system automatically formats UK phone numbers:
- `07123456789` → `+447123456789`
- `447123456789` → `+447123456789`
- `7123456789` → `+447123456789`

### Usage Example

```typescript
import { createSMSService } from '@/lib/sms/sms-providers';

const smsService = createSMSService('the_sms_works', {
  apiKey: process.env.SMS_API_KEY,
  senderId: 'CribNosh'
});

const result = await smsService.sendOTP({
  phone: '+447123456789',
  code: '123456',
  expiryMinutes: 5
});
```

## Cost Analysis

### The SMS Works Pricing
- **Per SMS**: 2.37p + VAT (approximately 2.84p total)
- **Volume Discounts**: Available for higher volumes
- **Delivery Only**: Only charged for successfully delivered messages
- **No Setup Fees**: Pay-as-you-go pricing

### Cost Comparison (per 1000 SMS)
- **The SMS Works**: £28.40 (including VAT)
- **Previous providers**: £30-50+ (estimated)

## Migration from Previous Providers

If you were using other SMS providers, the migration is automatic:

1. **Update Environment Variables**:
   ```bash
   SMS_PROVIDER=the_sms_works
   SMS_API_KEY=your_new_api_key
   ```

2. **Remove Old Credentials**:
   - Remove `SMS_USERNAME`
   - Remove `SMS_PASSWORD`
   - Remove `SMS_TOKEN`

3. **Test the New Provider**:
   - Send test OTPs to verify functionality
   - Check delivery rates and costs

## Troubleshooting

### Common Issues

1. **Invalid API Key**:
   - Verify your API key is correct
   - Check if the key has proper permissions

2. **Phone Number Format**:
   - Ensure UK numbers start with +44
   - Remove any spaces or special characters

3. **Delivery Issues**:
   - Check The SMS Works dashboard for delivery status
   - Verify sender ID is approved

### Support

- **The SMS Works Support**: [support@thesmsworks.co.uk](mailto:support@thesmsworks.co.uk)
- **CribNosh Support**: Contact your development team

## Security Considerations

- Store API keys securely in environment variables
- Never commit API keys to version control
- Use HTTPS for all API communications
- Monitor SMS usage for unusual patterns

## Rate Limiting

The system includes built-in rate limiting:
- **Max OTPs per phone**: 5 per hour
- **Max OTPs per email**: 3 per hour
- **Cooldown period**: 1 minute between requests

## Future Considerations

- Monitor The SMS Works pricing for any changes
- Consider volume discounts for high usage
- Evaluate other UK providers if needed
- Implement SMS analytics and monitoring