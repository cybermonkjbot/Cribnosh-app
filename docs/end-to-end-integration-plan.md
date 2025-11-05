# End-to-End Integration Plan for Settings Screens

## Overview
Complete end-to-end integration plan for Personal Info, Login & Security, and Privacy screens with full backend support.

## Current Status

### ✅ Completed (Frontend)
- Personal Info Screen (`apps/mobile/app/personal-info.tsx`)
- Login & Security Screen (`apps/mobile/app/login-security.tsx`)
- Privacy Screen (`apps/mobile/app/privacy.tsx`)
- Navigation handlers updated in `UserAccountDetailsScreen`

### ✅ Existing Backend Endpoints
- `GET /customer/profile/me` - Get profile
- `PUT /customer/profile/me` - Update profile
- `GET /customer/data-sharing-preferences` - Get data sharing settings
- `PUT /customer/data-sharing-preferences` - Update data sharing settings

### ❌ Missing Backend Endpoints
- `PUT /customer/account/password` - Change password
- `GET /customer/account/sessions` - Get active sessions
- `DELETE /customer/account/sessions/:session_id` - Revoke session
- `POST /customer/account/two-factor/setup` - Setup 2FA
- `DELETE /customer/account/two-factor` - Disable 2FA

## Implementation Plan

### Phase 1: Password Change Endpoint

#### 1.1 Create Backend API Route
**File**: `apps/web/app/api/customer/account/password/route.ts`

**Implementation**:
- Verify JWT token and customer role
- Validate request body: `current_password`, `new_password`
- Verify current password matches stored hash
- Hash new password using scrypt (same as login)
- Update user password via Convex mutation
- Return success response

**Request Format**:
```typescript
{
  current_password: string;
  new_password: string;
}
```

**Response Format**:
```typescript
{
  success: boolean;
  message: string;
}
```

**Error Handling**:
- 400: Validation errors (missing fields, password too short, etc.)
- 401: Invalid current password
- 401: Invalid or expired token
- 403: Not a customer
- 500: Internal server error

#### 1.2 Create Convex Mutation (if needed)
**File**: `packages/convex/mutations/users.ts`

**Check**: Verify `updateUser` mutation accepts password field (already exists)
- The mutation already accepts `password: v.optional(v.string())` which is already hashed

#### 1.3 Add Mobile API Integration
**File**: `apps/mobile/store/customerApi.ts`

**Add**:
- `ChangePasswordRequest` type
- `ChangePasswordResponse` type
- `changePassword` mutation endpoint
- Export `useChangePasswordMutation` hook

**File**: `apps/mobile/types/customer.ts`

**Add**:
```typescript
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}
```

#### 1.4 Update Mobile Screen
**File**: `apps/mobile/app/login-security.tsx`

**Update**:
- Replace placeholder password change logic with actual API call
- Use `useChangePasswordMutation` hook
- Remove TODO comments

### Phase 2: Session Management Endpoints

#### 2.1 Create Convex Queries/Mutations
**File**: `packages/convex/queries/sessions.ts` (already exists)

**Update**: Add query for customer sessions:
```typescript
export const getCustomerSessions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.gt(q.field('expiresAt'), Date.now()))
      .collect();
    
    return sessions.map(session => ({
      session_id: session._id,
      sessionToken: session.sessionToken.substring(0, 8) + '...', // Truncate for security
      device: session.userAgent || 'Unknown',
      location: session.ipAddress || 'Unknown',
      created_at: new Date(session.createdAt).toISOString(),
      expires_at: new Date(session.expiresAt).toISOString(),
      is_current: false, // TODO: Determine current session from JWT
    }));
  },
});
```

**File**: `packages/convex/mutations/sessions.ts` (extend existing)

**Add**:
```typescript
export const revokeCustomerSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    userId: v.id("users"), // Verify ownership
  },
  handler: async (ctx, args) => {
    // Verify session belongs to user
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== args.userId) {
      throw new Error('Session not found or access denied');
    }
    await ctx.db.delete(args.sessionId);
    return { success: true };
  },
});
```

#### 2.2 Create Backend API Routes

**File**: `apps/web/app/api/customer/account/sessions/route.ts`

**GET Handler**:
- Verify JWT token and customer role
- Query Convex for user sessions
- Format response with device info, location, timestamps
- Return active sessions only

**Response Format**:
```typescript
{
  success: boolean;
  data: {
    sessions: Array<{
      session_id: string;
      device: string;
      location: string;
      created_at: string;
      expires_at: string;
      is_current: boolean;
    }>;
  };
}
```

**File**: `apps/web/app/api/customer/account/sessions/[session_id]/route.ts`

**DELETE Handler**:
- Verify JWT token and customer role
- Verify session belongs to user
- Delete session via Convex mutation
- Return success response

#### 2.3 Add Mobile API Integration
**File**: `apps/mobile/store/customerApi.ts`

**Add**:
- `GetSessionsResponse` type
- `getSessions` query endpoint
- `revokeSession` mutation endpoint
- Export `useGetSessionsQuery` and `useRevokeSessionMutation` hooks

**File**: `apps/mobile/types/customer.ts`

**Add**:
```typescript
export interface CustomerSession {
  session_id: string;
  device: string;
  location: string;
  created_at: string;
  expires_at: string;
  is_current: boolean;
}

export interface GetSessionsResponse {
  success: boolean;
  data: {
    sessions: CustomerSession[];
  };
}
```

#### 2.4 Update Mobile Screen
**File**: `apps/mobile/app/login-security.tsx`

**Update**:
- Replace placeholder sessions list with actual API call
- Use `useGetSessionsQuery` hook
- Use `useRevokeSessionMutation` hook
- Display real session data (device, location, timestamps)
- Remove placeholder text

### Phase 3: Two-Factor Authentication

#### 3.1 Update Database Schema
**File**: `packages/convex/schema.ts`

**Add fields to users table**:
```typescript
twoFactorEnabled: v.optional(v.boolean()),
twoFactorSecret: v.optional(v.string()), // Encrypted secret
twoFactorBackupCodes: v.optional(v.array(v.string())), // Hashed backup codes
```

**Note**: Consider if 2FA should be in a separate table for better security

#### 3.2 Create Convex Mutations
**File**: `packages/convex/mutations/users.ts`

**Add**:
```typescript
export const setupTwoFactor = mutation({
  args: {
    userId: v.id("users"),
    secret: v.string(), // Already encrypted
    backupCodes: v.array(v.string()), // Already hashed
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      twoFactorEnabled: true,
      twoFactorSecret: args.secret,
      twoFactorBackupCodes: args.backupCodes,
      lastModified: Date.now(),
    });
    return { success: true };
  },
});

export const disableTwoFactor = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      twoFactorBackupCodes: undefined,
      lastModified: Date.now(),
    });
    return { success: true };
  },
});
```

#### 3.3 Create Backend API Routes

**File**: `apps/web/app/api/customer/account/two-factor/setup/route.ts`

**POST Handler**:
- Verify JWT token and customer role
- Generate 2FA secret (use library like `speakeasy` or `otplib`)
- Generate backup codes (8-10 codes)
- Hash backup codes before storing
- Store encrypted secret and hashed backup codes
- Return secret and unhashed backup codes to user (one-time display)
- Important: Backup codes should only be shown once

**Request Format**: None (generates secret server-side)

**Response Format**:
```typescript
{
  success: boolean;
  data: {
    secret: string; // For QR code generation
    backupCodes: string[]; // One-time display
  };
  message: string;
}
```

**File**: `apps/web/app/api/customer/account/two-factor/route.ts`

**DELETE Handler**:
- Verify JWT token and customer role
- Verify current password (optional but recommended)
- Disable 2FA via Convex mutation
- Clear secret and backup codes
- Return success response

**Request Format** (optional):
```typescript
{
  password?: string; // Optional password verification
}
```

#### 3.4 Add Mobile API Integration
**File**: `apps/mobile/store/customerApi.ts`

**Add**:
- `SetupTwoFactorResponse` type
- `setupTwoFactor` mutation endpoint
- `disableTwoFactor` mutation endpoint
- Export `useSetupTwoFactorMutation` and `useDisableTwoFactorMutation` hooks

**File**: `apps/mobile/types/customer.ts`

**Add**:
```typescript
export interface SetupTwoFactorResponse {
  success: boolean;
  data: {
    secret: string;
    backupCodes: string[];
  };
  message: string;
}
```

#### 3.5 Update Mobile Screen
**File**: `apps/mobile/app/login-security.tsx`

**Update**:
- Replace placeholder 2FA toggle with actual API calls
- Use `useSetupTwoFactorMutation` and `useDisableTwoFactorMutation` hooks
- Add QR code generation for 2FA setup (use library like `react-native-qrcode-svg`)
- Display backup codes modal when 2FA is enabled
- Add password verification for disabling 2FA (optional but recommended)

### Phase 4: Profile Picture Upload

#### 4.1 Create Image Upload Endpoint
**File**: `apps/web/app/api/customer/profile/picture/route.ts`

**POST Handler**:
- Verify JWT token and customer role
- Accept base64 image or multipart form data
- Validate image (size, format)
- Upload to storage (S3, Cloudinary, or similar)
- Update user avatar URL via Convex
- Return image URL

**Alternative**: Use existing `PUT /customer/profile/me` with `picture` field (already supported)

#### 4.2 Update Mobile Screen
**File**: `apps/mobile/app/personal-info.tsx`

**Update**:
- Convert image URI to base64 or upload to storage service
- If using existing endpoint, ensure proper image format conversion

### Phase 5: Address Management Integration

#### 5.1 Verify Existing Endpoints
- Check if `PUT /customer/profile/me` properly handles address updates
- Verify address structure matches expected format

#### 5.2 Update Mobile Screen
**File**: `apps/mobile/app/personal-info.tsx`

**Update**:
- Ensure address updates work with existing endpoint
- Test address selection and saving flow

### Phase 6: Testing & Validation

#### 6.1 Unit Tests
- Test password change endpoint with valid/invalid passwords
- Test session management (get, revoke)
- Test 2FA setup and disable flows
- Test error handling for all endpoints

#### 6.2 Integration Tests
- Test complete password change flow (mobile → API → database)
- Test session management flow
- Test 2FA setup and disable flow
- Test profile update with all fields

#### 6.3 Security Testing
- Verify password hashing (scrypt with salt)
- Verify JWT token validation
- Verify session ownership checks
- Verify 2FA secret encryption
- Test rate limiting on sensitive endpoints

## Implementation Order

1. **Password Change** (Highest Priority)
   - Most critical security feature
   - Users need to change passwords
   - Simple implementation

2. **Session Management** (High Priority)
   - Important for security
   - Users should see active sessions
   - Moderate complexity

3. **Profile Picture Upload** (Medium Priority)
   - Already partially supported via existing endpoint
   - May need image processing/upload service

4. **Two-Factor Authentication** (Lower Priority)
   - More complex implementation
   - Requires QR code generation
   - Requires backup code management
   - Can be added later if needed

## Dependencies

### Backend Dependencies
- `scrypt` (Node.js crypto) - Already used for password hashing
- `jsonwebtoken` - Already used for JWT
- `speakeasy` or `otplib` - For 2FA secret generation (if implementing 2FA)
- `qrcode` - For QR code generation (if implementing 2FA)

### Mobile Dependencies
- `react-native-qrcode-svg` - For 2FA QR code display (if implementing 2FA)
- Image processing libraries - For profile picture handling

## Database Schema Updates

### Users Table
- Add `twoFactorEnabled: boolean` (optional)
- Add `twoFactorSecret: string` (optional, encrypted)
- Add `twoFactorBackupCodes: string[]` (optional, hashed)

### Sessions Table
- Already exists with proper structure
- Ensure indexes are optimized for user queries

## Security Considerations

1. **Password Change**:
   - Always verify current password
   - Use timing-safe comparison
   - Enforce minimum password length
   - Hash new password before storing

2. **Session Management**:
   - Never expose full session tokens
   - Verify session ownership before deletion
   - Filter expired sessions
   - Log session revocations

3. **Two-Factor Authentication**:
   - Encrypt 2FA secrets at rest
   - Hash backup codes
   - Show backup codes only once
   - Require password verification to disable

4. **Rate Limiting**:
   - Implement rate limiting on password change endpoint
   - Implement rate limiting on 2FA setup
   - Prevent brute force attacks

## API Documentation

All endpoints should include:
- Swagger/OpenAPI documentation
- Request/response examples
- Error response formats
- Authentication requirements

## Migration Notes

- No database migrations needed for password change (uses existing structure)
- Sessions table already exists
- 2FA requires schema update (backward compatible with optional fields)

## Rollout Plan

1. **Phase 1**: Password change (Week 1)
2. **Phase 2**: Session management (Week 2)
3. **Phase 3**: Profile picture upload improvements (Week 2-3)
4. **Phase 4**: Two-factor authentication (Week 3-4)

## Success Criteria

- All endpoints return proper status codes
- All error cases handled gracefully
- Mobile screens display real data from API
- Security best practices implemented
- All tests passing
- Documentation complete

