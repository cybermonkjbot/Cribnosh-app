# Two-Factor Authentication Verification Plan

## Overview
Add 2FA verification step after sign-in for users who have 2FA enabled. This requires modifying the login flow to check for 2FA status and redirecting users to a verification screen before completing authentication.

## Current State
- ✅ 2FA setup/disable endpoints exist
- ✅ 2FA secret and backup codes stored in database
- ✅ QR code generation working
- ❌ Login endpoints don't check for 2FA
- ❌ No 2FA verification endpoint
- ❌ No 2FA verification screen
- ❌ TOTP verification not implemented

## Implementation Plan

### Phase 1: Backend - 2FA Verification Infrastructure

#### 1.1 Implement TOTP Verification in Convex
**File:** `packages/convex/mutations/users.ts`
- Complete `verifyTwoFactorCode` mutation
- Use `otplib` to verify TOTP codes
- Verify backup codes as fallback
- Return success/failure

**Code Changes:**
```typescript
export const verifyTwoFactorCode = mutation({
  args: {
    userId: v.id("users"),
    code: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx: MutationCtx, args) => {
    const { userId, code } = args;
    const user = await ctx.db.get(userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }
    
    // Try TOTP verification first
    const { authenticator } = require('otplib');
    const isValidTOTP = authenticator.check(code, user.twoFactorSecret);
    
    if (isValidTOTP) {
      return true;
    }
    
    // Try backup codes as fallback
    if (user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
      const { scryptSync, timingSafeEqual } = require('crypto');
      for (const hashedCode of user.twoFactorBackupCodes) {
        const [salt, storedHash] = hashedCode.split(':');
        const hashToVerify = scryptSync(code, salt, 64);
        const storedHashBuffer = Buffer.from(storedHash, 'hex');
        if (timingSafeEqual(hashToVerify, storedHashBuffer)) {
          // Remove used backup code
          const updatedCodes = user.twoFactorBackupCodes.filter(c => c !== hashedCode);
          await ctx.db.patch(userId, {
            twoFactorBackupCodes: updatedCodes,
          });
          return true;
        }
      }
    }
    
    return false;
  },
});
```

#### 1.2 Create Temporary Verification Session System
**File:** `packages/convex/schema.ts`
- Add `verificationSessions` table:
  ```typescript
  verificationSessions: defineTable({
    userId: v.id("users"),
    sessionToken: v.string(), // Temporary token for verification
    expiresAt: v.number(), // Expiry timestamp
    createdAt: v.number(),
    used: v.boolean(), // Prevents reuse
  })
    .index("by_token", ["sessionToken"])
    .index("by_user", ["userId"]),
  ```

**Files:** `packages/convex/mutations/verificationSessions.ts`
- Create mutations:
  - `createVerificationSession` - Create temporary session
  - `verifyAndCompleteSession` - Verify 2FA code and mark session as used
  - `getVerificationSession` - Get session by token

#### 1.3 Modify Login Endpoints to Check 2FA
**File:** `apps/web/app/api/auth/login/route.ts`
- After password verification, check if user has 2FA enabled
- If 2FA enabled:
  - Create temporary verification session
  - Return response with `requires2FA: true` and `verificationToken`
  - Do NOT return full JWT token
- If 2FA disabled:
  - Return full JWT token as before

**Response Format:**
```typescript
// 2FA Required
{
  success: true,
  requires2FA: true,
  verificationToken: "temp_session_token",
  message: "2FA verification required"
}

// No 2FA
{
  success: true,
  token: "jwt_token",
  user: { ... }
}
```

**File:** `apps/web/app/api/auth/phone-signin/route.ts`
- Same modifications as email login
- Check 2FA after OTP verification
- Return verification token if 2FA enabled

#### 1.4 Create 2FA Verification Endpoint
**File:** `apps/web/app/api/auth/verify-2fa/route.ts`
- POST endpoint to verify 2FA code
- Accepts: `verificationToken`, `code`
- Validates verification session (not expired, not used)
- Verifies 2FA code using Convex mutation
- If valid:
  - Mark session as used
  - Return full JWT token
- If invalid:
  - Return error
  - Keep session active for retry (with rate limiting)

**Request:**
```typescript
{
  verificationToken: string,
  code: string // 6-digit TOTP code or backup code
}
```

**Response:**
```typescript
{
  success: true,
  token: "jwt_token",
  user: { ... }
}
```

#### 1.5 Add Rate Limiting for 2FA Attempts
**File:** `apps/web/app/api/auth/verify-2fa/route.ts`
- Track failed attempts per verification session
- Lock session after 5 failed attempts (15 minutes)
- Prevent brute force attacks

### Phase 2: Frontend - Mobile App Integration

#### 2.1 Create 2FA Verification Screen
**File:** `apps/mobile/app/verify-2fa.tsx`
- New screen for 2FA code input
- Input field for 6-digit code
- Option to use backup code
- Error handling
- Loading states
- Navigation after successful verification

**Features:**
- 6-digit code input (auto-focus, auto-submit on 6 digits)
- "Use backup code" toggle
- Resend/change code options
- Error messages
- Loading indicator
- Success redirect

#### 2.2 Add 2FA Verification API Endpoint
**File:** `apps/mobile/store/authApi.ts`
- Add `verify2FA` mutation
- Accepts: `verificationToken`, `code`
- Returns: full JWT token and user data

**File:** `apps/mobile/types/auth.ts`
- Add types:
  - `Verify2FARequest`
  - `Verify2FAResponse`
  - `LoginResponse` (update to include `requires2FA`)

#### 2.3 Update Login Flow to Handle 2FA
**File:** `apps/mobile/store/authApi.ts`
- Update `emailLogin` mutation response type
- Handle `requires2FA: true` response
- Store `verificationToken` temporarily

**Files:**
- `apps/mobile/components/SignInScreen.tsx`
- `apps/mobile/components/ui/PhoneSignInModal.tsx`
- `apps/mobile/hooks/useAuth.ts`

**Flow:**
1. User submits credentials
2. If `requires2FA: true`:
   - Store `verificationToken`
   - Navigate to `/verify-2fa` screen
   - Pass `verificationToken` as param
3. User enters 2FA code
4. Call `verify2FA` endpoint
5. On success:
   - Store JWT token
   - Update auth state
   - Navigate to home/app

#### 2.4 Update Auth Context
**File:** `apps/mobile/contexts/AuthContext.tsx`
- Handle 2FA verification flow
- Store verification token temporarily
- Complete login after 2FA verification

### Phase 3: OAuth/Social Sign-In Integration

#### 3.1 Check 2FA for OAuth Users
**Files:**
- `apps/web/app/api/auth/google/route.ts`
- `apps/web/app/api/auth/apple/route.ts`

**Flow:**
- After OAuth verification, check if user has 2FA enabled
- If yes, create verification session and return token
- Mobile app handles same as email/phone login

### Phase 4: Security Enhancements

#### 4.1 Session Expiry
- Verification sessions expire after 10 minutes
- Clear expired sessions periodically
- Show error if session expired

#### 4.2 Audit Logging
- Log 2FA verification attempts
- Track successful/failed verifications
- Monitor for suspicious activity

#### 4.3 Backup Code Usage
- Track which backup codes are used
- Remove used backup codes
- Warn user when running low on backup codes

### Phase 5: Testing & Validation

#### 5.1 Unit Tests
- TOTP verification logic
- Backup code verification
- Session management

#### 5.2 Integration Tests
- Login flow with 2FA
- Login flow without 2FA
- Failed 2FA attempts
- Expired sessions
- Rate limiting

#### 5.3 Manual Testing
- Test on real devices
- Test with authenticator apps (Google Authenticator, Authy)
- Test backup code flow
- Test error scenarios

## Implementation Order

1. **Backend Infrastructure** (Phase 1)
   - Implement TOTP verification
   - Create verification session system
   - Modify login endpoints
   - Create verification endpoint

2. **Frontend Mobile** (Phase 2)
   - Create verification screen
   - Update login flow
   - Integrate with auth context

3. **OAuth Integration** (Phase 3)
   - Add 2FA check to OAuth flows

4. **Security & Polish** (Phase 4)
   - Rate limiting
   - Session expiry
   - Audit logging

5. **Testing** (Phase 5)
   - Comprehensive testing

## Dependencies

### Backend
- `otplib` - Already installed
- New `verificationSessions` table in Convex

### Mobile
- New screen component
- Updated auth flow
- Navigation updates

## Success Criteria

- ✅ Users with 2FA enabled are prompted after password/OTP verification
- ✅ 2FA code verification works with TOTP codes
- ✅ Backup codes can be used as fallback
- ✅ Failed attempts are rate limited
- ✅ Sessions expire after 10 minutes
- ✅ Users without 2FA login normally
- ✅ OAuth flows support 2FA
- ✅ Mobile app handles all flows smoothly
- ✅ Error messages are clear and helpful

## Notes

- Verification sessions should be short-lived (10 minutes max)
- Backup codes should be removed after use
- Rate limiting prevents brute force attacks
- All 2FA verification attempts should be logged
- Consider adding "Remember this device" option (future enhancement)

