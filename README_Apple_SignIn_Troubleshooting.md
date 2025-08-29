# Apple Sign-In Troubleshooting Guide

This guide addresses common Apple Sign-In issues in the CribNosh app, including the "authorization attempt failed for an unknown reason" error.

## 🚨 Common Error: "Authorization attempt failed for an unknown reason"

**IMPORTANT UPDATE**: This error is now handled gracefully as a user cancellation. The app will no longer show error messages for this scenario.

### What This Error Usually Means
- **User Cancellation**: The user tapped "Cancel" or backed out of the sign-in process
- **Intentional Action**: Not a genuine error that requires user intervention
- **Common Behavior**: This happens frequently and is completely normal

### How It's Now Handled
- **Silent Handling**: No error alerts are shown to the user
- **Graceful Fallback**: User can simply try again when ready
- **Better UX**: Prevents unnecessary error messages for intentional cancellations

## 🔧 Implementation Solutions

### Enhanced Error Handling
The app now intelligently distinguishes between user cancellations and actual errors:

```typescript
import { handleAppleSignInError } from '../utils/appleSignInErrorHandler';

try {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  
  if (credential.identityToken) {
    onAppleSignIn?.(credential.identityToken);
  }
} catch (error) {
  // This will now handle user cancellations silently
  handleAppleSignInError(
    error,
    () => handleAppleSignIn(), // Retry function
    () => handleGoogleSignIn() // Fallback to Google
  );
}
```

### Smart Error Detection
The error handler now:
- **Detects User Cancellations**: Identifies when users intentionally cancel
- **Silent Handling**: No error messages for cancellations
- **Error Messages**: Still shows helpful messages for genuine errors
- **Retry Options**: Provides retry and fallback for actual problems

## 📱 Platform-Specific Issues

### iOS Simulator
- **Issue**: Apple Sign-In may not work in iOS Simulator
- **Solution**: Test on real iOS devices
- **Workaround**: Use Google Sign-In for development

### iOS Device Requirements
- **Minimum**: iOS 13.0+
- **Recommended**: iOS 14.0+
- **Capability**: Must have Apple ID signed in

### Web Platform
- **Issue**: Apple Sign-In not supported on web
- **Solution**: Automatically fallback to Google Sign-In
- **Note**: Only iOS and macOS support Apple Sign-In

## 🛠️ Debugging Steps

### 1. Enable Detailed Logging
```typescript
// In your Apple Sign-In handler
try {
  console.log('Starting Apple Sign-In...');
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  console.log('Apple Sign-In successful:', credential);
} catch (error) {
  console.error('Apple Sign-In error details:', {
    code: error.code,
    message: error.message,
    stack: error.stack,
    fullError: error
  });
}
```

### 2. Check Device State
```typescript
// Check if user is signed into Apple ID
const isAvailable = await AppleAuthentication.isAvailableAsync();
console.log('Apple Sign-In available:', isAvailable);

// Check credential state if you have a user ID
if (userId) {
  const credentialState = await AppleAuthentication.getCredentialStateAsync(userId);
  console.log('Credential state:', credentialState);
}
```

### 3. Verify Configuration
- Check `app.json` has `expo-apple-authentication` plugin
- Verify bundle identifier matches Apple Developer account
- Ensure "Sign In with Apple" capability is enabled
- Check that OAuth configuration is correct

## 🔄 Retry Strategies

### Immediate Retry
```typescript
const handleAppleSignInWithRetry = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Apple Sign-In attempt ${attempt}/${maxRetries}`);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      return credential;
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) throw error;
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
```

### Delayed Retry with User Choice
```typescript
const handleAppleSignInError = (error: any) => {
  const processedError = AppleSignInErrorHandler.handleError(error);
  
  // Only show error messages for actual errors, not user cancellations
  if (!processedError.isUserCancellation) {
    Alert.alert(
      'Sign-In Failed',
      processedError.message,
      [
        { text: 'Try Again', onPress: () => handleAppleSignIn() },
        { text: 'Use Google Instead', onPress: () => handleGoogleSignIn() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }
};
```

## 📋 Checklist for Developers

### Before Testing
- [ ] `expo-apple-authentication` plugin added to `app.json`
- [ ] Bundle identifier matches Apple Developer account
- [ ] "Sign In with Apple" capability enabled
- [ ] Testing on real iOS device (not simulator)
- [ ] User signed into Apple ID on device

### During Testing
- [ ] Check console logs for detailed error information
- [ ] Verify network connectivity
- [ ] Test multiple sign-in attempts
- [ ] Test error scenarios (cancel, network failure)
- [ ] Verify fallback to Google Sign-In works
- [ ] **NEW**: Verify user cancellations are handled silently

### After Implementation
- [ ] Error handling covers all common scenarios
- [ ] User cancellations are handled gracefully (no error messages)
- [ ] Actual errors still show helpful messages
- [ ] Retry mechanisms work properly
- [ ] Fallback options are available
- [ ] Loading states provide visual feedback

## 🆘 Getting Help

### Check These Resources First
1. [Expo Apple Authentication Documentation](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
2. [Apple Developer Documentation](https://developer.apple.com/sign-in-with-apple/)
3. [Apple Developer Forums](https://developer.apple.com/forums/)

### Common Questions
- **Q**: Why does Apple Sign-In fail in simulator?
- **A**: Apple Sign-In requires a real device with Apple ID signed in

- **Q**: How do I enable "Sign In with Apple" capability?
- **A**: Go to Apple Developer → Certificates, Identifiers & Profiles → App IDs → Select your app → Check "Sign In with Apple"

- **Q**: What should I do if users keep getting the "authorization failed" error?
- **A**: This is now handled automatically as a user cancellation - no action needed

- **Q**: Why don't I see error messages for Apple Sign-In failures anymore?
- **A**: The app now intelligently detects user cancellations and handles them silently for better UX

## 🔮 Future Improvements

### Planned Enhancements
- [ ] Automatic retry with exponential backoff
- [ ] Network quality detection
- [ ] User preference for retry attempts
- [ ] Analytics for error tracking
- [ ] A/B testing for different error handling approaches

### Monitoring
- Track error frequency and types
- Monitor user success rates
- Identify patterns in failures
- Measure impact of retry mechanisms
- **NEW**: Track user cancellation rates vs. actual errors

---

**Remember**: Apple Sign-In "authorization failed" errors are now handled gracefully as user cancellations. This provides a much better user experience by not showing unnecessary error messages for intentional actions.
