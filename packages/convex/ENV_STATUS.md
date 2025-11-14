# Convex Environment Variables Status

## Currently Set ✅

Based on `convex env list`:
- ✅ `RESEND_API_KEY` = `re_EQsb5GpW_HkaiK9VCCYjwAYH2Jd8xP5VN`

## Missing Variables ❌

### Critical (App features will fail without these):

1. **`AGORA_APP_ID`** - Required for live streaming
   - Used in: `actions/agora.ts`, `actions/liveSessions.ts`
   - Get from: https://console.agora.io/
   - **Action Required**: Set this to enable live streaming features

2. **`AGORA_APP_CERTIFICATE`** - Required for live streaming
   - Used in: `actions/agora.ts`
   - Get from: https://console.agora.io/
   - **Action Required**: Set this to enable live streaming features

3. **`OPENAI_API_KEY`** - Required for AI chat
   - Used in: `mutations/aiChat.ts`
   - Get from: https://platform.openai.com/api-keys
   - **Action Required**: Set this or AI chat will throw errors
   - **Error if missing**: "OPENAI_API_KEY environment variable is not set"

4. **`SMS_API_KEY`** - Required for SMS/OTP functionality
   - Used in: `mutations/otp.ts`
   - Get from: Your SMS provider (e.g., The SMS Works)
   - **Action Required**: Set this to enable phone authentication via OTP

### Optional (Features degrade gracefully):

5. **`OPENWEATHERMAP_API_KEY`** - Optional for weather features
   - Used in: `actions/weather.ts`
   - Get from: https://openweathermap.org/api
   - **Note**: Returns default weather if not set (graceful degradation)

6. **`SMS_USERNAME`** - Optional for SMS service
   - Used in: `mutations/otp.ts`
   - **Note**: Only needed if your SMS provider requires username authentication

7. **`SMS_PASSWORD`** - Optional for SMS service
   - Used in: `mutations/otp.ts`
   - **Note**: Only needed if your SMS provider requires password authentication

8. **`SMS_TOKEN`** - Optional for SMS service
   - Used in: `mutations/otp.ts`
   - **Note**: Alternative to username/password for SMS authentication

9. **`SMS_SENDER_ID`** - Optional for SMS service
   - Used in: `mutations/otp.ts`
   - **Default**: `'CribNosh'` (if not set)
   - **Note**: Customize the sender ID for SMS messages

10. **`RESEND_FROM_EMAIL`** - Optional for email automation
    - Used in: `emailAutomation.ts`
    - **Default**: `"CribNosh <onboarding@cribnosh.com>"` (if not set)
    - **Note**: Customize the default "from" email address

## How to Set Missing Variables

### Option 1: Via Convex CLI (Recommended)
```bash
cd packages/convex

# Critical variables
npx convex env set AGORA_APP_ID "your_agora_app_id"
npx convex env set AGORA_APP_CERTIFICATE "your_agora_certificate"
npx convex env set OPENAI_API_KEY "sk-..."
npx convex env set SMS_API_KEY "your_sms_api_key"

# Optional variables
npx convex env set OPENWEATHERMAP_API_KEY "your_weather_key"
npx convex env set SMS_SENDER_ID "CribNosh"
npx convex env set RESEND_FROM_EMAIL "CribNosh <noreply@cribnosh.com>"
```

### Option 2: Via Convex Dashboard
1. Go to https://dashboard.convex.dev
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Click **Add Variable** for each missing variable
5. Enter the variable name and value
6. Save

## Priority Order for Setting

**Set these first (critical):**
1. `AGORA_APP_ID` & `AGORA_APP_CERTIFICATE` - If using live streaming
2. `OPENAI_API_KEY` - If using AI chat features
3. `SMS_API_KEY` - If using phone/OTP authentication

**Set these next (optional but recommended):**
4. `OPENWEATHERMAP_API_KEY` - For weather-based features
5. `SMS_SENDER_ID` - Customize SMS sender name
6. `RESEND_FROM_EMAIL` - Customize email from address

**Set these only if needed:**
7. `SMS_USERNAME`, `SMS_PASSWORD`, `SMS_TOKEN` - Only if your SMS provider requires them

## Verification

After setting variables, verify they're set:
```bash
cd packages/convex
npx convex env list
```

Then restart your Convex dev server:
```bash
npx convex dev
```

