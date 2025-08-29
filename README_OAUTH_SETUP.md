# OAuth Authentication Setup for CribNosh

This guide explains how to set up Google and Apple Sign-In authentication for your CribNosh app using Expo and Convex.

## 🚀 What We've Built

- **SignInScreen**: Updated with proper OAuth flows
- **OnboardingFlow**: Complete user preference collection after sign-in
- **OAuth Configuration**: Centralized configuration for all OAuth providers

## 📱 OAuth Providers

### 1. Google Sign-In
- Uses `expo-auth-session/providers/google`
- Returns `accessToken` that can be used as `idToken` for Convex
- Supports iOS, Android, and Web platforms

### 2. Apple Sign-In
- Uses `expo-apple-authentication`
- Returns `identityToken` (JWT) for Convex verification
- iOS and macOS only

## ⚙️ Setup Instructions

### Step 1: Install Dependencies
```bash
bun add expo-auth-session expo-apple-authentication
```

### Step 2: Configure Google OAuth

1. **Go to Google Cloud Console**
   - Visit: https://console.developers.google.com/
   - Create a new project or select existing one

2. **Enable APIs**
   - Enable "Google+ API"
   - Enable "Google Sign-In API"

3. **Create OAuth 2.0 Credentials**
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Create separate client IDs for each platform

4. **Configure Redirect URIs**
   - **Expo/Web**: `https://auth.expo.io/@your-username/your-app-slug`
   - **iOS**: `com.yourcompany.yourapp://`
   - **Android**: `com.yourcompany.yourapp://`

5. **Update Configuration**
   ```typescript
   // config/oauth.ts
   export const oauthConfig = {
     google: {
       webClientId: "your-web-client-id.apps.googleusercontent.com",
       iosClientId: "your-ios-client-id.apps.googleusercontent.com",
       androidClientId: "your-android-client-id.apps.googleusercontent.com",
     }
   };
   ```

### Step 3: Configure Apple Sign-In

1. **Apple Developer Account**
   - Go to: https://developer.apple.com/
   - Sign in with your Apple Developer account

2. **Enable Sign In with Apple**
   - Go to "Certificates, Identifiers & Profiles"
   - Select your App ID
   - Check "Sign In with Apple" capability
   - Save changes

3. **No Additional Configuration Needed**
   - `expo-apple-authentication` handles the rest automatically

### Step 4: Update Your App Configuration

1. **app.json/app.config.js**
   ```json
   {
     "expo": {
       "scheme": "your-app-scheme",
       "ios": {
         "bundleIdentifier": "com.yourcompany.yourapp"
       },
       "android": {
         "package": "com.yourcompany.yourapp"
       }
     }
   }
   ```

## 🔐 How It Works

### Authentication Flow
1. User taps Google/Apple Sign-In button
2. Expo handles OAuth flow with provider
3. Provider returns authentication token
4. Token is passed to your callback handlers
5. You send token to Convex for verification
6. User proceeds to onboarding or main app

### Code Example
```typescript
// In your main app component
const handleGoogleSignIn = (idToken: string) => {
  // Send to Convex
  await api.auth.signInWithProvider({ 
    provider: "google", 
    idToken: idToken 
  });
  
  // Navigate to onboarding
  setCurrentScreen('onboarding');
};

const handleAppleSignIn = (idToken: string) => {
  // Send to Convex
  await api.auth.signInWithProvider({ 
    provider: "apple", 
    idToken: idToken 
  });
  
  // Navigate to onboarding
  setCurrentScreen('onboarding');
};
```

## 🧪 Testing

### Development
- Use the `OnboardingDemo` component for testing
- Check console logs for authentication data
- Verify token flow from sign-in to onboarding

### Production
- Test on real devices (especially iOS for Apple Sign-In)
- Verify redirect URIs work correctly
- Test both success and error scenarios

## 🚨 Common Issues

### Google Sign-In
- **"Invalid client"**: Check client IDs match your OAuth credentials
- **"Redirect URI mismatch"**: Verify redirect URIs in Google Console
- **"API not enabled"**: Ensure Google+ and Sign-In APIs are enabled
- **"Authorization failed"**: Now handled gracefully with comprehensive error handling
- **Network errors**: Automatically detected and provide retry options
- **Configuration errors**: Suggest fallback to Apple Sign-In

### Apple Sign-In
- **"Capability not enabled"**: Check Sign In with Apple is enabled in App ID
- **"Bundle ID mismatch"**: Verify bundle identifier matches Apple Developer account
- **iOS Simulator issues**: Apple Sign-In may not work in simulator
- **"Authorization attempt failed"**: See [Apple Sign-In Troubleshooting Guide](./README_Apple_SignIn_Troubleshooting.md) for comprehensive solutions

## 🔄 Next Steps

1. **Replace placeholder client IDs** in `config/oauth.ts`
2. **Test authentication flow** on real devices
3. **Integrate with Convex** when you have the API ready
4. **Add error handling** for failed authentication attempts
5. **Implement token refresh** for long-lived sessions

## 📚 Resources

- [Expo Auth Session Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)

## 🆘 Support

If you encounter issues:
1. Check console logs for error messages
2. Verify OAuth configuration matches provider settings
3. Test on real devices (not just simulator)
4. Ensure all required APIs and capabilities are enabled
