# Testing the Friends System

## Summary

The friends system has been enhanced to include all relationship types:
1. ✅ Family members
2. ✅ People the user referred
3. ✅ **People who referred the user** (NEW - reverse referrals)
4. ✅ Group order participants
5. ✅ Treat relationships (both directions)

## Changes Made

### 1. Schema Update (`packages/convex/schema.ts`)
- Added index `by_referred_user` on `referredUserId` field in the `referrals` table
- This enables efficient reverse lookup of who referred a user

### 2. Query Enhancement (`packages/convex/queries/userConnections.ts`)
- Added reverse referral lookup section (lines 124-145)
- Queries referrals where `referredUserId = user_id` and status is 'completed'
- Adds connections with `connection_type: 'referral'` and `source: 'referral_reverse'`

## Testing Instructions

### Using Convex CLI

1. **Get a user ID:**
   ```bash
   npx convex run queries/users:getAllUsers '{}' | head -20
   ```
   Or use the Convex dashboard to find a user ID.

2. **Test the enhanced query:**
   ```bash
   npx convex run queries/testFriendsQuery:testGetAllUserConnections '{"user_id": "<actual_user_id>"}'
   ```

3. **Or test directly:**
   ```bash
   npx convex run queries/userConnections:getAllUserConnections '{"user_id": "<actual_user_id>"}'
   ```

### Expected Results

The query should return connections with:
- `connection_type`: One of: 'family', 'referral', 'treat', 'group_order', 'colleague_manual', 'colleague_inferred', 'friend'
- `source`: One of: 'family_profile', 'referral', 'referral_reverse', 'treat', 'group_order', 'manual_connection', 'company_match'
- `metadata`: Additional information about the connection

### Verification Checklist

- [ ] Family members appear with `source: 'family_profile'`
- [ ] People user referred appear with `source: 'referral'`
- [ ] **People who referred user appear with `source: 'referral_reverse'`** (NEW)
- [ ] Group order participants appear with `source: 'group_order'`
- [ ] Treat relationships appear with `source: 'treat'` and `metadata.direction: 'given'` or `'received'`
- [ ] No duplicate entries (deduplication working)
- [ ] All connection types are included in the final result

## Test Files Created

- `packages/convex/queries/testFriendsQuery.ts` - Enhanced test query with detailed breakdown
- `packages/convex/queries/testListUsers.ts` - Helper to list users for testing

## Frontend Integration

All frontend components are already using the updated query through:
- `apps/mobile/hooks/useConnections.ts` - Uses `customerGetConnections` action
- `apps/mobile/app/shared-ordering/choose-friends.tsx` - Direct usage
- `apps/mobile/components/ui/ChooseFriend.tsx` - Direct usage
- `apps/mobile/components/ui/GroupOrderScreen/Page.tsx` - Direct usage
- `apps/mobile/app/(tabs)/orders/group/index.tsx` - Uses `useConnections` hook

No frontend changes needed - the enhanced query automatically provides all connection types.

