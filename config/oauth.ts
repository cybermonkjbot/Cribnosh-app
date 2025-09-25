// OAuth Configuration for CribNosh
// Replace the placeholder values with your actual OAuth client IDs

export const oauthConfig = {
  google: {
    expoClientId: "<your-expo-client-id>.apps.googleusercontent.com",
    iosClientId: "<your-ios-client-id>.apps.googleusercontent.com",
    androidClientId: "<your-android-client-id>.apps.googleusercontent.com",
    webClientId: "<your-web-client-id>.apps.googleusercontent.com",
    // For development, you can use a test client ID
    // Make sure to replace with your actual client IDs from Google Console
  },
  apple: {
    // Apple Sign-In doesn't require client IDs in the same way
    // The configuration is handled through your Apple Developer account
    // and the expo-apple-authentication package
  },
};

// Instructions for setting up OAuth:
//
// 1. Google OAuth Setup:
//    - Go to https://console.developers.google.com/
//    - Create a new project or select existing one
//    - Enable Google+ API and Google Sign-In API
//    - Create OAuth 2.0 credentials
//    - Add authorized redirect URIs for your platforms
//    - Copy the client IDs to the config above
//
// 2. Apple Sign-In Setup:
//    - Go to https://developer.apple.com/
//    - Enable Sign In with Apple capability
//    - Configure your app's bundle identifier
//    - No additional client IDs needed for expo-apple-authentication
//
// 3. Update the SignInScreen.tsx to import this config:
//    import { oauthConfig } from '../config/oauth';
//    Then use: expoClientId: oauthConfig.google.expoClientId, etc.
