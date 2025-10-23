# Session Expired Testing

This document explains how to test the session expired functionality in the CribNosh app.

## Test Buttons

When the app is in debug mode (`CONFIG.DEBUG_MODE = true`) and a user is authenticated, two test buttons will appear on the main screen:

### 1. "Test Session Expired" Button (Red)

- **Purpose**: Immediately triggers the session expired modal
- **How it works**:
  - Clears all authentication data
  - Shows the session expired modal
  - Simulates an immediate session expiration
- **Use case**: Quick testing of the modal UI and flow

### 2. "Set 5s Expiring Token" Button (Orange)

- **Purpose**: Sets a test token that expires in 5 seconds
- **How it works**:
  - Creates a test JWT token with 5-second expiration
  - Stores it in SecureStore
  - The periodic token checker (every 30 seconds) will detect expiration
  - Shows the session expired modal automatically
- **Use case**: Testing the automatic token expiration detection

## Testing Scenarios

### Scenario 1: Immediate Session Expired

1. Ensure you're logged in and debug mode is enabled
2. Tap the red "Test Session Expired" button
3. The session expired modal should appear immediately
4. Tap "Sign In Again" to return to the sign-in screen

### Scenario 2: Automatic Token Expiration

1. Ensure you're logged in and debug mode is enabled
2. Tap the orange "Set 5s Expiring Token" button
3. Wait 5 seconds (or up to 30 seconds for the next check)
4. The session expired modal should appear automatically
5. Tap "Sign In Again" to return to the sign-in screen

### Scenario 3: API Request with Expired Token

1. Set an expiring token using the orange button
2. Wait for it to expire
3. Try to make an API request (e.g., refresh the app)
4. The token should be cleared and session expired modal should appear

## Debug Mode Configuration

The test buttons only appear when `CONFIG.DEBUG_MODE` is set to `true`. This is typically controlled in your app's configuration file.

## Console Logging

Both test functions log their actions to the console:

- "Testing session expired modal" - when immediate test is triggered
- "Setting test expiring token (5 seconds)" - when expiring token is set
- "Test token set! Wait 5 seconds for automatic expiration detection." - confirmation message

## Cleanup

After testing, you can:

1. Sign in again normally
2. The test tokens will be replaced with real authentication tokens
3. No manual cleanup is required

## Production Safety

These test buttons are automatically hidden in production builds when `CONFIG.DEBUG_MODE` is `false`, ensuring they don't appear for end users.
