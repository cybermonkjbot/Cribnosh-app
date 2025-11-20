# Google OAuth Setup Guide for CribNosh

This guide will walk you through setting up Google OAuth authentication for your CribNosh mobile app.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Your app's bundle identifier: `com.cribnosh.co.uk`
- Your app's package name (Android): `com.cribnosh.co.uk`

## Step 1: Create or Select a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Either:
   - **Select an existing project** (if you have one)
   - **Create a new project**:
     - Click "New Project"
     - Enter project name: "CribNosh" (or your preferred name)
     - Click "Create"
     - Wait for the project to be created

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for and enable the following APIs:
   - **Google+ API** (if available)
   - **Google Sign-In API**
   - **Identity Toolkit API** (recommended)

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace account)
3. Fill in the required information:
   - **App name**: CribNosh
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Click **Save and Continue**
5. On the **Scopes** page, click **Add or Remove Scopes**
   - Add: `openid`, `profile`, `email`
   - Click **Update**, then **Save and Continue**
6. On the **Test users** page (if in testing mode):
   - Add test user emails if needed
   - Click **Save and Continue**
7. Review and **Back to Dashboard**

## Step 4: Create OAuth 2.0 Client IDs

You need to create separate OAuth 2.0 client IDs for each platform:

### 4a. Web Client ID (for Expo/Web)

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Select **Web application** as the application type
4. Name it: "CribNosh Web Client"
5. Add **Authorized redirect URIs**:
   - `https://auth.expo.io/@cribnoshtest/cribnosh-user-app`
   - `https://auth.expo.io/@your-expo-username/your-expo-slug` (if different)
   - Your web app URL if applicable (e.g., `https://cribnosh.com/auth/callback`)
6. Click **Create**
7. **Copy the Client ID** - this is your `webClientId`

### 4b. iOS Client ID

1. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
2. Select **iOS** as the application type
3. Name it: "CribNosh iOS Client"
4. Enter **Bundle ID**: `com.cribnosh.co.uk`
5. Click **Create**
6. **Copy the Client ID** - this is your `iosClientId`

### 4c. Android Client ID

1. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
2. Select **Android** as the application type
3. Name it: "CribNosh Android Client"
4. Enter **Package name**: `com.cribnosh.co.uk`
5. For **SHA-1 certificate fingerprint**:
   - You'll need to get your app's SHA-1 fingerprint
   - For development, run:
     ```bash
     # For debug keystore (default)
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
     
     # For release keystore (if you have one)
     keytool -list -v -keystore path/to/your/release.keystore -alias your-key-alias
     ```
   - Copy the SHA-1 fingerprint (looks like: `AA:BB:CC:DD:...`)
   - Paste it into the SHA-1 field
6. Click **Create**
7. **Copy the Client ID** - this is your `androidClientId`

### 4d. Expo Client ID (Optional but Recommended)

For Expo Go or development builds, you may also want to create an additional web client:

1. Create another **Web application** OAuth client
2. Name it: "CribNosh Expo Client"
3. Add **Authorized redirect URIs**:
   - `exp://localhost:8081`
   - `exp://127.0.0.1:8081`
   - Your Expo redirect URIs
4. Click **Create**
5. **Copy the Client ID** - this is your `expoClientId`

## Step 5: Update Your OAuth Configuration

1. Open `apps/mobile/config/oauth.ts`
2. Replace the placeholder values with your actual client IDs:

```typescript
export const oauthConfig = {
  google: {
    expoClientId: "YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com",
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
    webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
  },
  apple: {
    // Apple Sign-In configuration (separate setup)
  },
};
```

**Important**: 
- Replace `YOUR_EXPO_CLIENT_ID`, `YOUR_IOS_CLIENT_ID`, etc. with the actual Client IDs you copied
- Keep the `.apps.googleusercontent.com` suffix
- Do NOT include any spaces or quotes around the values

## Step 6: Verify Configuration

1. Restart your development server
2. Try signing in with Google in your app
3. Check the console for any errors

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure your redirect URIs in Google Console match exactly what your app is using
- For Expo, check your `app.json` scheme and ensure redirect URIs include it

### Error: "invalid_client"
- Verify your client IDs are correct
- Make sure you're using the right client ID for each platform (iOS vs Android vs Web)

### Error: "access_denied"
- Check your OAuth consent screen configuration
- Ensure test users are added if your app is in testing mode
- Verify the scopes are correctly configured

### Android: "DEVELOPER_ERROR"
- Verify your SHA-1 fingerprint is correct
- Make sure the package name matches exactly: `com.cribnosh.co.uk`
- Re-download the `google-services.json` if you're using Firebase

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Expo Google Authentication](https://docs.expo.dev/guides/authentication/#google)
- [Google Cloud Console](https://console.cloud.google.com/)

## Security Notes

- **Never commit your OAuth client IDs to public repositories** if they contain sensitive information
- Consider using environment variables for production
- Keep your OAuth credentials secure
- Regularly rotate credentials if compromised

