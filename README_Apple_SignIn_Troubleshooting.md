# Apple Sign-In Troubleshooting Guide

This guide addresses common Apple Sign-In issues in the CribNosh app, including the "authorization attempt failed for an unknown reason" error.

## 🚨 Common Error: "Authorization attempt failed for an unknown reason"

This error typically occurs due to several possible causes:

### 1. **Network Connectivity Issues**
- **Symptoms**: Error appears randomly, especially on unstable connections
- **Solutions**:
  - Check internet connection stability
  - Try switching between WiFi and cellular data
  - Ensure no VPN interference
  - Test on different networks

### 2. **Apple Service Problems**
- **Symptoms**: Error affects multiple users simultaneously
- **Solutions**:
  - Check [Apple System Status](https://www.apple.com/support/systemstatus/)
  - Wait and retry later
  - Check Apple Developer Forums for known issues

### 3. **Device Configuration Issues**
- **Symptoms**: Error persists on specific devices
- **Solutions**:
  - Restart the device
  - Sign out and back into Apple ID in Settings
  - Check if device has latest iOS version
  - Verify Apple ID is properly configured

### 4. **App Configuration Issues**
- **Symptoms**: Error occurs consistently in your app
- **Solutions**:
  - Verify `expo-apple-authentication` plugin is in `app.json`
  - Check bundle identifier matches Apple Developer account
  - Ensure "Sign In with Apple" capability is enabled

## 🔧 Implementation Solutions

### Enhanced Error Handling
The app now includes comprehensive error handling:

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
  handleAppleSignInError(
    error,
    () => handleAppleSignIn(), // Retry function
    () => handleGoogleSignIn() // Fallback to Google
  );
}
```

### Availability Checks
Always check if Apple Sign-In is available:

```typescript
const isAvailable = await AppleAuthentication.isAvailableAsync();
if (!isAvailable) {
  // Provide fallback option
  handleGoogleSignIn();
}
```

### User Feedback
The app now provides:
- Clear error messages
- Retry options
- Fallback to Google Sign-In
- Loading states
- Visual feedback for disabled states

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
  
  if (processedError.userAction === 'retry') {
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

### After Implementation
- [ ] Error handling covers all common scenarios
- [ ] User receives clear feedback
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
- **A**: Implement retry logic, provide fallback options, and check network connectivity

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

---

**Remember**: Apple Sign-In errors are often transient and related to network or service issues. Providing clear feedback and retry options significantly improves user experience.
