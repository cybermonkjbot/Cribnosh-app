# Google Sign-In Troubleshooting Guide

This guide addresses common Google Sign-In issues in the CribNosh app, including network errors, configuration problems, and user cancellations.

## 🚨 Common Google Sign-In Errors

### 1. **Network-Related Errors**
- **Symptoms**: Errors mentioning "network", "connection", "timeout", or "offline"
- **Causes**: Unstable internet connection, VPN interference, firewall blocking
- **Solutions**:
  - Check internet connection stability
  - Try switching between WiFi and cellular data
  - Disable VPN temporarily
  - Test on different networks
  - Check firewall settings

### 2. **Configuration Errors**
- **Symptoms**: "Invalid client", "Unauthorized client", or configuration-related messages
- **Causes**: Incorrect OAuth client IDs, missing API enablement, wrong redirect URIs
- **Solutions**:
  - Verify OAuth client IDs in `config/oauth.ts`
  - Check Google Cloud Console settings
  - Ensure Google+ and Sign-In APIs are enabled
  - Verify redirect URIs match exactly

### 3. **User Cancellation Errors**
- **Symptoms**: "User canceled", "Cancelled", or similar messages
- **Causes**: User intentionally cancelled the sign-in process
- **Solutions**: 
  - **No action needed** - This is normal user behavior
  - Handled silently by the app for better UX
  - User can simply try again when ready

### 4. **Server-Side Errors**
- **Symptoms**: "Server error", "Temporarily unavailable", or service-related messages
- **Causes**: Google service issues, temporary outages, rate limiting
- **Solutions**:
  - Wait a few minutes and try again
  - Check [Google Cloud Status](https://status.cloud.google.com/)
  - Verify you haven't exceeded API quotas

## 🔧 Implementation Solutions

### Enhanced Error Handling
The app now includes comprehensive Google Sign-In error handling:

```typescript
import { handleGoogleSignInError } from '../utils/googleSignInErrorHandler';

try {
  const response = await googlePromptAsync();
  // Handle successful response
} catch (error) {
  // This will now handle user cancellations silently
  handleGoogleSignInError(
    error,
    () => handleGoogleSignIn(), // Retry function
    () => handleAppleSignIn() // Fallback to Apple Sign-In
  );
}
```

### Smart Error Detection
The error handler automatically:
- **Detects User Cancellations**: Identifies when users intentionally cancel
- **Identifies Network Issues**: Recognizes connectivity problems
- **Spots Configuration Problems**: Catches setup and OAuth issues
- **Provides Appropriate Actions**: Suggests retry, fallback, or no action

### Cross-Provider Fallback
When Google Sign-In fails due to configuration issues:
- **Automatic Suggestion**: App suggests trying Apple Sign-In instead
- **Seamless Experience**: Users can easily switch between providers
- **Better Success Rate**: Increases overall authentication success

## 📱 Platform-Specific Issues

### Android
- **Google Play Services**: Ensure Google Play Services is up to date
- **Device Compatibility**: Check if device supports Google Sign-In
- **Account Setup**: Verify Google account is properly configured

### iOS
- **Safari Integration**: Google Sign-In works through Safari
- **Account Permissions**: Check Google account permissions in iOS Settings
- **Network Security**: Ensure network allows Google services

### Web
- **Browser Compatibility**: Works in all modern browsers
- **Cookie Settings**: Ensure cookies are enabled
- **Popup Blockers**: Disable popup blockers for Google domains

## 🛠️ Debugging Steps

### 1. Enable Detailed Logging
```typescript
// In your Google Sign-In handler
try {
  console.log('Starting Google Sign-In...');
  const response = await googlePromptAsync();
  console.log('Google Sign-In response:', response);
} catch (error) {
  console.error('Google Sign-In error details:', {
    code: error.code,
    message: error.message,
    stack: error.stack,
    fullError: error
  });
}
```

### 2. Check OAuth Configuration
```typescript
// Verify your OAuth configuration
console.log('OAuth Config:', {
  webClientId: oauthConfig.google.webClientId,
  iosClientId: oauthConfig.google.iosClientId,
  androidClientId: oauthConfig.google.androidClientId,
});
```

### 3. Test Network Connectivity
```typescript
// Simple network test
const testNetwork = async () => {
  try {
    const response = await fetch('https://www.google.com');
    console.log('Network test successful:', response.status);
  } catch (error) {
    console.error('Network test failed:', error);
  }
};
```

## 🔄 Retry Strategies

### Immediate Retry
```typescript
const handleGoogleSignInWithRetry = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Google Sign-In attempt ${attempt}/${maxRetries}`);
      const response = await googlePromptAsync();
      return response;
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) throw error;
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
```

### Smart Retry with Fallback
```typescript
const handleGoogleSignInError = (error: any) => {
  const processedError = GoogleSignInErrorHandler.handleError(error);
  
  if (processedError.isNetworkError) {
    // Network errors get retry option
    Alert.alert(
      'Network Error',
      processedError.message,
      [
        { text: 'Try Again', onPress: () => handleGoogleSignIn() },
        { text: 'Use Apple Sign-In', onPress: () => handleAppleSignIn() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  } else if (processedError.isConfigurationError) {
    // Configuration errors suggest fallback
    Alert.alert(
      'Configuration Error',
      processedError.message,
      [
        { text: 'Use Apple Sign-In Instead', onPress: () => handleAppleSignIn() },
        { text: 'OK', style: 'default' }
      ]
    );
  }
};
```

## 📋 Checklist for Developers

### Before Testing
- [ ] OAuth client IDs configured in `config/oauth.ts`
- [ ] Google Cloud Console APIs enabled
- [ ] Redirect URIs configured correctly
- [ ] Testing on real devices (not just simulator)
- [ ] Google account properly configured on device

### During Testing
- [ ] Check console logs for detailed error information
- [ ] Verify network connectivity
- [ ] Test multiple sign-in attempts
- [ ] Test error scenarios (cancel, network failure, config issues)
- [ ] Verify fallback to Apple Sign-In works
- [ ] **NEW**: Verify user cancellations are handled silently

### After Implementation
- [ ] Error handling covers all common scenarios
- [ ] User cancellations handled gracefully (no error messages)
- [ ] Network errors provide retry options
- [ ] Configuration errors suggest fallback
- [ ] Cross-provider fallback works smoothly
- [ ] Loading states provide visual feedback

## 🆘 Getting Help

### Check These Resources First
1. [Expo Auth Session Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
2. [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
3. [Google Cloud Console](https://console.cloud.google.com/)
4. [Google Cloud Status](https://status.cloud.google.com/)

### Common Questions
- **Q**: Why does Google Sign-In fail with "Invalid client"?
- **A**: Check that your OAuth client IDs match exactly with Google Cloud Console

- **Q**: How do I enable Google Sign-In APIs?
- **A**: Go to Google Cloud Console → APIs & Services → Library → Enable "Google+ API" and "Google Sign-In API"

- **Q**: What should I do if users keep getting network errors?
- **A**: Implement retry logic and suggest checking network connectivity

- **Q**: Why don't I see error messages for Google Sign-In failures anymore?
- **A**: The app now intelligently detects user cancellations and handles them silently for better UX

## 🔮 Future Improvements

### Planned Enhancements
- [ ] Automatic retry with exponential backoff
- [ ] Network quality detection
- [ ] User preference for retry attempts
- [ ] Analytics for error tracking
- [ ] A/B testing for different error handling approaches
- [ ] Offline mode detection

### Monitoring
- Track error frequency and types
- Monitor user success rates
- Identify patterns in failures
- Measure impact of retry mechanisms
- **NEW**: Track user cancellation rates vs. actual errors
- **NEW**: Monitor cross-provider fallback usage

---

**Remember**: Google Sign-In errors are now handled comprehensively with smart detection of user cancellations, network issues, and configuration problems. The app provides appropriate retry options and fallback suggestions while maintaining a clean user experience.
