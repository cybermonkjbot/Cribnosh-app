# Convex Backend Environment Variables

## Required Environment Variables

These environment variables must be set in your Convex deployment for the backend to function properly.

### Currently Used Variables

Based on the codebase analysis, these variables are **actively being used**:

#### 1. **`RESEND_API_KEY`** (Required for email functionality)
   - **Status**: ✅ Documented in `convex.json`
   - **Used in**: 
     - `actions/resend.ts` - Email sending
     - `mutations/payroll.ts` - Payroll email notifications
     - `crons/dripScheduler.ts` - Scheduled email campaigns
     - `emailAutomation.ts` - Email automation system
   - **Description**: Resend API key for sending transactional emails
   - **Where to get**: https://resend.com/api-keys
   - **Example**: `re_AbCdEfGh123456789`

#### 2. **`AGORA_APP_ID`** (Required for live streaming)
   - **Status**: ✅ Documented in `convex.json`
   - **Used in**: 
     - `actions/agora.ts` - Agora token generation
     - `actions/liveSessions.ts` - Live session management
   - **Description**: Agora App ID for live streaming functionality
   - **Where to get**: https://console.agora.io/
   - **Example**: `1234567890abcdef1234567890abcdef`

#### 3. **`AGORA_APP_CERTIFICATE`** (Required for live streaming)
   - **Status**: ✅ Documented in `convex.json`
   - **Used in**: 
     - `actions/agora.ts` - Agora token generation
   - **Description**: Agora App Certificate for secure token generation
   - **Where to get**: https://console.agora.io/ (same place as App ID)
   - **Example**: `abcdef1234567890abcdef1234567890`

#### 4. **`OPENAI_API_KEY`** (Required for AI chat and embeddings)
   - **Status**: ❌ **MISSING** from `convex.json` - Add this
   - **Used in**: 
     - `mutations/aiChat.ts` - AI chat functionality (via Convex AI Agents)
     - `actions/generateEmbeddings.ts` - Vector embeddings for semantic meal search
   - **Description**: OpenAI API key for AI-powered chat features and vector embeddings
   - **Where to get**: https://platform.openai.com/api-keys
   - **Example**: `sk-proj-...`
   - **Note**: Throws error if not set: "OPENAI_API_KEY environment variable is not set"
   - **Features**:
     - Powers Convex AI Agents for conversational AI chat
     - Generates embeddings for semantic meal search (text-embedding-3-small model)
     - Enables intelligent meal recommendations based on user queries

#### 5. **`OPENWEATHERMAP_API_KEY`** (Optional - for weather features)
   - **Status**: ❌ **MISSING** from `convex.json`
   - **Used in**: 
     - `actions/weather.ts` - Weather data for location-based features
   - **Description**: OpenWeatherMap API key for weather data
   - **Where to get**: https://openweathermap.org/api
   - **Example**: `1234567890abcdef1234567890abcdef`
   - **Note**: Returns default weather if not configured (graceful degradation)

#### 6. **`SMS_API_KEY`** (Required for SMS/OTP functionality)
   - **Status**: ❌ **MISSING** from `convex.json` - Add this
   - **Used in**: 
     - `mutations/otp.ts` - OTP sending via SMS
   - **Description**: SMS service API key (The SMS Works or similar)
   - **Where to get**: Depends on SMS provider (e.g., https://thesmsworks.co.uk/)
   - **Example**: `your_sms_api_key_here`

#### 7. **`SMS_USERNAME`** (Optional - for SMS service)
   - **Status**: ❌ **MISSING** from `convex.json`
   - **Used in**: 
     - `mutations/otp.ts` - SMS service authentication
   - **Description**: Username for SMS service (if required by provider)
   - **Example**: `your_sms_username`

#### 8. **`SMS_PASSWORD`** (Optional - for SMS service)
   - **Status**: ❌ **MISSING** from `convex.json`
   - **Used in**: 
     - `mutations/otp.ts` - SMS service authentication
   - **Description**: Password for SMS service (if required by provider)
   - **Example**: `your_sms_password`

#### 9. **`SMS_TOKEN`** (Optional - for SMS service)
   - **Status**: ❌ **MISSING** from `convex.json`
   - **Used in**: 
     - `mutations/otp.ts` - SMS service authentication
   - **Description**: Token for SMS service (alternative to username/password)
   - **Example**: `your_sms_token`

#### 10. **`SMS_SENDER_ID`** (Optional - for SMS service)
   - **Status**: ❌ **MISSING** from `convex.json`
   - **Used in**: 
     - `mutations/otp.ts` - SMS sender identification
   - **Description**: Sender ID for SMS messages
   - **Default**: `'CribNosh'` (if not set)
   - **Example**: `CribNosh`

#### 11. **`RESEND_FROM_EMAIL`** (Optional - for email automation)
   - **Status**: ❌ **MISSING** from `convex.json`
   - **Used in**: 
     - `emailAutomation.ts` - Default from email address
   - **Description**: Default "from" email address for automated emails
   - **Default**: `"CribNosh <onboarding@cribnosh.com>"` (if not set)
   - **Example**: `CribNosh <noreply@cribnosh.com>`

#### 12. **`APPLE_CLIENT_ID`** (Required for Apple Sign-In - mobile app)
   - **Status**: ❌ **MISSING** from `convex.json` - Add this
   - **Used in**: 
     - `actions/users.ts` - `customerAppleSignIn` action (for proper token verification)
   - **Description**: Apple OAuth client ID (Service ID) for Apple Sign-In
   - **Where to get**: Apple Developer Portal → Certificates, Identifiers & Profiles → Services IDs
   - **Example**: `com.cribnosh.service`
   - **Note**: Currently using simplified JWT decode. For production token verification, this is required.

#### 13. **`APPLE_TEAM_ID`** (Required for Apple Sign-In - mobile app)
   - **Status**: ❌ **MISSING** from `convex.json` - Add this
   - **Used in**: 
     - `actions/users.ts` - `customerAppleSignIn` action (for proper token verification)
   - **Description**: Apple Developer Team ID
   - **Where to get**: Apple Developer Portal → Membership
   - **Example**: `ABC123DEF4`
   - **Note**: Required for generating Apple client secret for token verification

#### 14. **`APPLE_KEY_ID`** (Required for Apple Sign-In - mobile app)
   - **Status**: ❌ **MISSING** from `convex.json` - Add this
   - **Used in**: 
     - `actions/users.ts` - `customerAppleSignIn` action (for proper token verification)
   - **Description**: Apple Key ID for signing JWT tokens
   - **Where to get**: Apple Developer Portal → Keys → Create a new key
   - **Example**: `78U8CYGFZY`
   - **Note**: Required for generating Apple client secret for token verification

#### 15. **`APPLE_PRIVATE_KEY`** (Required for Apple Sign-In - mobile app)
   - **Status**: ❌ **MISSING** from `convex.json` - Add this
   - **Used in**: 
     - `actions/users.ts` - `customerAppleSignIn` action (for proper token verification)
   - **Description**: Apple private key (.p8 file content) for signing JWT tokens
   - **Where to get**: Apple Developer Portal → Keys → Download the .p8 file
   - **Example**: `-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...\n-----END PRIVATE KEY-----`
   - **Note**: 
     - This is the content of the .p8 file (not the file path)
     - Keep this secure - never commit to version control
     - Required for generating Apple client secret for token verification

#### 16. **`STRIPE_SECRET_KEY`** (Required for Payment Processing)
   - **Status**: ❌ **MISSING** from `convex.json` - Add this
   - **Used in**: 
     - `actions/payments.ts` - `customerCreateCheckout` and `customerTopUpBalance` actions
     - Future payment processing in Convex actions
   - **Description**: Stripe secret API key for server-side payment processing
   - **Where to get**: Stripe Dashboard → Developers → API keys → Secret key
   - **Example**: `sk_test_...` (test) or `sk_live_...` (production)
   - **Note**: 
     - Required for creating payment intents, processing payments, and managing customers
     - Keep this secure - never commit to version control
     - Use test key for development, live key for production
     - Currently, payment actions return errors indicating Stripe integration is needed

#### 17. **`STRIPE_WEBHOOK_SECRET`** (Optional - for Stripe webhook verification)
   - **Status**: ❌ **MISSING** from `convex.json`
   - **Used in**: 
     - Future webhook handling in Convex actions (if needed)
   - **Description**: Stripe webhook signing secret for verifying webhook events
   - **Where to get**: Stripe Dashboard → Developers → Webhooks → Add endpoint → Signing secret
   - **Example**: `whsec_...`
   - **Note**: 
     - Only needed if handling Stripe webhooks directly in Convex
     - Currently webhooks are handled in Next.js API routes
     - Optional for now, but recommended if migrating webhook handling to Convex

#### 18. **`NEXT_PUBLIC_BASE_URL`** (Used for webhook/notification URLs)
   - **Status**: ⚠️ **Note**: This is a Next.js variable, but used in Convex
   - **Used in**: 
     - `mutations/users.ts` - Referral links
     - `mutations/staff.ts` - Staff notification webhooks
     - `mutations/groupOrders.ts` - Group order sharing links
   - **Description**: Base URL of the web application (for generating links)
   - **Default**: `"https://cribnosh.com"` or `"https://cribnosh.app"`
   - **Note**: This should be set in the web app's environment, not Convex directly

## Current `convex.json` Status

Your current `convex.json` only documents:
- ✅ `RESEND_API_KEY`
- ✅ `AGORA_APP_ID`
- ✅ `AGORA_APP_CERTIFICATE`

## Missing from `convex.json`

Add these to your `convex.json` production variables section:

```json
{
  "production": {
    "variables": {
      "RESEND_API_KEY": {
        "description": "Resend API key for sending emails"
      },
      "AGORA_APP_ID": {
        "description": "Agora App ID for live streaming"
      },
      "AGORA_APP_CERTIFICATE": {
        "description": "Agora App Certificate for live streaming"
      },
      "OPENAI_API_KEY": {
        "description": "OpenAI API key for AI chat features"
      },
      "OPENWEATHERMAP_API_KEY": {
        "description": "OpenWeatherMap API key for weather data (optional)"
      },
      "SMS_API_KEY": {
        "description": "SMS service API key for OTP functionality"
      },
      "SMS_USERNAME": {
        "description": "SMS service username (if required by provider)"
      },
      "SMS_PASSWORD": {
        "description": "SMS service password (if required by provider)"
      },
      "SMS_TOKEN": {
        "description": "SMS service token (alternative to username/password)"
      },
      "SMS_SENDER_ID": {
        "description": "SMS sender ID (defaults to 'CribNosh')"
      },
      "RESEND_FROM_EMAIL": {
        "description": "Default from email address for automated emails"
      },
      "APPLE_CLIENT_ID": {
        "description": "Apple OAuth client ID (Service ID) for Apple Sign-In"
      },
      "APPLE_TEAM_ID": {
        "description": "Apple Developer Team ID for Apple Sign-In"
      },
      "APPLE_KEY_ID": {
        "description": "Apple Key ID for signing JWT tokens"
      },
      "APPLE_PRIVATE_KEY": {
        "description": "Apple private key (.p8 file content) for signing JWT tokens"
      },
      "STRIPE_SECRET_KEY": {
        "description": "Stripe secret API key for payment processing"
      },
      "STRIPE_WEBHOOK_SECRET": {
        "description": "Stripe webhook signing secret for webhook verification (optional)"
      }
    }
  }
}
```

## How to Set Environment Variables in Convex

### For Development (Local)
Set variables in your local environment or `.env.local` file:
```bash
RESEND_API_KEY=re_...
AGORA_APP_ID=...
AGORA_APP_CERTIFICATE=...
OPENAI_API_KEY=sk-...
# etc.
```

### For Production
1. **Via Convex Dashboard**:
   - Go to https://dashboard.convex.dev
   - Select your project
   - Navigate to Settings → Environment Variables
   - Add each variable

2. **Via Convex CLI**:
   ```bash
   npx convex env set RESEND_API_KEY re_...
   npx convex env set AGORA_APP_ID ...
   # etc.
   ```

3. **Via `convex.json`** (for documentation only - actual values set in dashboard):
   - Update `convex.json` with variable descriptions (as shown above)
   - Set actual values in Convex Dashboard or via CLI

## Priority Order

1. **Critical (App won't work without these)**:
   - `RESEND_API_KEY` - Email functionality
   - `AGORA_APP_ID` & `AGORA_APP_CERTIFICATE` - Live streaming
   - `OPENAI_API_KEY` - AI chat (throws error if missing)
   - `SMS_API_KEY` - OTP/SMS functionality
   - `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` - Apple Sign-In (for mobile app)
   - `STRIPE_SECRET_KEY` - Payment processing (required for checkout and top-up features)

2. **Important (Features degrade gracefully)**:
   - `OPENWEATHERMAP_API_KEY` - Weather features (returns defaults if missing)
   - `SMS_USERNAME`, `SMS_PASSWORD`, `SMS_TOKEN` - SMS authentication
   - `SMS_SENDER_ID` - SMS sender (has default)

3. **Optional (Has defaults)**:
   - `RESEND_FROM_EMAIL` - Email from address (has default)
   - `NEXT_PUBLIC_BASE_URL` - Set in web app, not Convex

## Notes

1. **Convex environment variables** are different from Next.js `NEXT_PUBLIC_*` variables
2. **No `EXPO_PUBLIC_` prefix needed** - Convex variables are server-side only
3. **Restart required**: After setting variables, restart your Convex dev server
4. **Production vs Development**: Set variables separately for dev and prod deployments
5. **Never commit secrets**: Use Convex Dashboard or CLI, not version control

