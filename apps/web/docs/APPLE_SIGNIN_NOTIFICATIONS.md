# Apple Sign in Server-to-Server Notifications

This document explains how to set up and use Apple's server-to-server notification endpoint for Sign in with Apple in your CribNosh app.

## Overview

Apple sends server-to-server notifications when users:
- Change their email forwarding preferences
- Withdraw consent for your app
- Delete their Apple account

## Endpoint Details

**URL:** `https://cribnosh.co.uk/api/apple/signin-notifications`
**Method:** `POST`
**Content-Type:** `application/json`
**Authentication:** JWT Bearer token (sent by Apple)

## Implementation

### 1. HTTP Endpoint

The endpoint is implemented in `convex/http.ts` and handles:
- JWT signature verification
- Payload parsing
- Notification type routing
- Error handling

### 2. Notification Handler

The main handler is in `convex/internal/appleNotifications.ts` and processes:

#### Notification Types

| Type | Description | Action Taken |
|------|-------------|--------------|
| `email-disabled` | User disabled email forwarding | Updates `emailForwardingEnabled: false` |
| `email-enabled` | User enabled email forwarding | Updates `emailForwardingEnabled: true` |
| `consent-withdrawn` | User withdrew app consent | Marks user as inactive, removes Apple OAuth |
| `account-deleted` | User deleted Apple account | Removes Apple OAuth connection |

### 3. Database Schema Updates

Added to the `users` table:
```typescript
// Apple Sign in notification fields
emailForwardingEnabled: v.optional(v.boolean()),
lastEmailForwardingChange: v.optional(v.number()),
consentWithdrawnAt: v.optional(v.number()),
accountDeletedAt: v.optional(v.number()),
```

## Apple Configuration

### 1. Apple Developer Console

1. Go to [Apple Developer Console](https://developer.apple.com)
2. Navigate to your app's Sign in with Apple configuration
3. Add the notification endpoint URL: `https://cribnosh.co.uk/api/apple/signin-notifications`

### 2. Required Settings

- **Endpoint URL:** `https://cribnosh.co.uk/api/apple/signin-notifications`
- **TLS Version:** 1.2 or higher (automatically handled by Convex)
- **Response Timeout:** Apple expects responses within 10 seconds

## Security Considerations

### JWT Verification

The current implementation includes basic JWT verification. For production, you should:

1. **Fetch Apple's Public Keys**
   ```typescript
   // Fetch from https://appleid.apple.com/auth/keys
   const appleKeys = await fetch('https://appleid.apple.com/auth/keys');
   ```

2. **Verify JWT Signature**
   ```typescript
   // Decode JWT header to get key ID
   // Verify signature using appropriate public key
   // Check token expiration and issuer
   ```

3. **Validate Payload**
   - Ensure `sub` (Apple user ID) is present
   - Verify `aud` (audience) matches your app
   - Check `iss` (issuer) is from Apple

### Rate Limiting

Consider implementing rate limiting to prevent abuse:
- Apple may send multiple notifications for the same event
- Implement idempotency checks
- Log all notification attempts

## Testing

### 1. Test Payload Structure

```json
{
  "type": "email-disabled",
  "sub": "001234.567890abcdef.1234",
  "aud": "com.cribnosh.app",
  "iss": "https://appleid.apple.com",
  "iat": 1640995200,
  "exp": 1640998800
}
```

### 2. Manual Testing

You can test the endpoint using curl:
```bash
curl -X POST https://cribnosh.co.uk/api/apple/signin-notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"type":"email-disabled","sub":"test_user_id"}'
```

## Monitoring

### 1. Logging

All notification events are logged with:
- User ID
- Notification type
- Timestamp
- Processing result

### 2. Error Handling

The endpoint returns appropriate HTTP status codes:
- `200`: Success
- `401`: Invalid JWT signature
- `400`: Invalid payload
- `500`: Server error

### 3. Analytics

Consider tracking:
- Notification frequency by type
- User engagement after notifications
- Error rates and types

## Production Checklist

- [ ] Implement proper JWT signature verification
- [ ] Add rate limiting
- [ ] Set up monitoring and alerting
- [ ] Test with Apple's sandbox environment
- [ ] Document incident response procedures
- [ ] Review privacy implications of data handling

## Troubleshooting

### Common Issues

1. **JWT Verification Fails**
   - Check Apple's public keys are accessible
   - Verify token format and expiration
   - Ensure proper signature validation

2. **User Not Found**
   - Verify Apple user ID mapping
   - Check OAuth provider data integrity
   - Review user lookup logic

3. **Database Updates Fail**
   - Check schema compatibility
   - Verify user permissions
   - Review transaction handling

### Debug Mode

Enable debug logging by setting environment variables:
```bash
CONVEX_LOG_LEVEL=debug
```

## Related Files

- `convex/http.ts` - HTTP endpoint definition
- `convex/internal/appleNotifications.ts` - Notification handling logic
- `convex/schema.ts` - Database schema updates
- `convex/_generated/api.d.ts` - Generated API types

## Next Steps

1. **Implement Production JWT Verification**
   - Add proper Apple public key fetching
   - Implement signature verification
   - Add comprehensive payload validation

2. **Add Monitoring**
   - Set up alerts for failed notifications
   - Track notification metrics
   - Monitor user impact

3. **User Communication**
   - Send notifications about account changes
   - Provide clear messaging about data handling
   - Offer support for account issues
