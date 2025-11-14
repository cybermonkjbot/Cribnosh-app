# Apple Keys Checklist

## Confirmed Information ✅

- **Team ID**: `9H45CVD35P`
- **Bundle ID**: `com.cribnosh.co.uk`
- **App ID Prefix**: `9H45CVD35P`

## What You Need to Set Up

### 1. Create Apple Service ID (for Sign-In)
   - Go to: https://developer.apple.com/account/resources/identifiers/list
   - Click **+** to create new identifier
   - Select **Services IDs**
   - Register a new Service ID (e.g., `com.cribnosh.co.uk.signin`)
   - Configure Sign In with Apple:
     - Primary App ID: `com.cribnosh.co.uk`
     - Domains: `cribnosh.com`, `cribnosh.co.uk`
     - Return URLs: `https://cribnosh.com/api/auth/apple/callback`
   - **This Service ID becomes your `APPLE_CLIENT_ID`**

### 2. Create Apple Auth Key (for JWT signing) - IMPORTANT: Different from APNs Key!
   - Go to: https://developer.apple.com/account/resources/authkeys/list
   - Click **+** to create new key
   - Name it (e.g., "Cribnosh Sign-In Key")
   - **IMPORTANT**: Enable **Sign In with Apple** (NOT "Apple Push Notifications service")
   - Click **Continue** then **Register**
   - **Download the .p8 file** (you can only download once!)
   - Note the **Key ID** (this is your `APPLE_KEY_ID`)
   - **Note**: APNs keys (for push notifications) cannot be downloaded. You need an Auth Key specifically for Sign In with Apple.

### 3. Environment Variables to Set

Add these to `apps/web/.env.local`:

```bash
# Apple Sign-In Configuration
APPLE_CLIENT_ID=com.cribnosh.co.uk  # Or your Service ID from step 1
APPLE_TEAM_ID=9H45CVD35P
APPLE_KEY_ID=ABC123DEF4  # From step 2
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
[Full content of your .p8 file]
-----END PRIVATE KEY-----"
NEXT_PUBLIC_APPLE_CLIENT_ID=com.cribnosh.co.uk  # Same as APPLE_CLIENT_ID
```

## Current Status

- ✅ Team ID: `9H45CVD35P` (confirmed)
- ✅ Bundle ID: `com.cribnosh.co.uk` (confirmed)
- ❌ Service ID: Need to create (for `APPLE_CLIENT_ID`)
- ❌ Key ID: Need to create (for `APPLE_KEY_ID`)
- ❌ Private Key: Need to download .p8 file (for `APPLE_PRIVATE_KEY`)

## Important Notes

1. **Service ID vs App ID**: 
   - App ID (`com.cribnosh.co.uk`) is for the app itself
   - Service ID is for Sign In with Apple web service
   - They can be the same, but Service ID is recommended

2. **Private Key**:
   - Download the .p8 file immediately after creating the key
   - You can only download it once
   - Include the full content with headers in `APPLE_PRIVATE_KEY`

3. **Return URLs**:
   - Must match exactly: `https://cribnosh.com/api/auth/apple/callback`
   - Also add: `https://cribnosh.co.uk/api/auth/apple/callback` if using both domains

