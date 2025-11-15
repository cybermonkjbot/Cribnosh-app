# Remaining RTK Query Dependencies

This document lists all remaining files that depend on RTK Query and need to be migrated to direct Convex connections.

## Mobile App (`apps/mobile`)

### Files Using RTK Query Hooks

#### 1. **`apps/mobile/app/food-safety.tsx`**
   - **RTK Query Hook**: `useUpdateCrossContaminationSettingMutation`
   - **Line**: 3, 24
   - **Status**: Needs migration to Convex action

#### 2. **`apps/mobile/hooks/useRegionAvailability.ts`**
   - **RTK Query Hooks**: 
     - `useGetRegionalAvailabilityConfigQuery` (line 10, 38)
     - `useCheckRegionAvailabilityMutation` (line 9, 42)
   - **Status**: Needs migration to Convex queries/actions

#### 3. **`apps/mobile/app/privacy.tsx`**
   - **RTK Query Hooks**:
     - `useGetDataSharingPreferencesQuery` (line 2, 53)
     - `useUpdateDataSharingPreferencesMutation` (line 3, 57)
   - **Status**: Needs migration to Convex queries/mutations

#### 4. **`apps/mobile/components/ui/NoshHeavenPostModal.tsx`**
   - **RTK Query Hooks**:
     - `useCreateVideoPostMutation` (line 9, 56)
     - `useGetConvexVideoUploadUrlMutation` (line 9, 57)
   - **Status**: Needs migration to Convex mutations

#### 5. **`apps/mobile/components/ui/KitchenMainScreen/KitchenBottomSheetHeader.tsx`**
   - **RTK Query Hooks**:
     - `useGetKitchenFavoriteStatusQuery` (line 5, 34)
     - `useAddKitchenFavoriteMutation` (line 5, 39)
     - `useRemoveKitchenFavoriteMutation` (line 5, 40)
   - **Status**: Needs migration to Convex queries/mutations

#### 6. **`apps/mobile/app/foodcreator/[foodcreatorId]/kitchen/[kitchenId]/video/[videoId].tsx`**
   - **RTK Query Hook**: `useGetVideoByIdQuery` (line 1, 23)
   - **Status**: Needs migration to Convex query

#### 7. **`apps/mobile/app/delete-account-survey.tsx`**
   - **RTK Query Hook**: `useSubmitDeleteAccountFeedbackMutation` (line 6, 39)
   - **Status**: Needs migration to Convex mutation

### Store Files (RTK Query API Definitions)

#### 8. **`apps/mobile/store/customerApi.ts`**
   - **Status**: Large RTK Query API file with many endpoints
   - **Action**: This entire file should eventually be deprecated once all hooks are migrated
   - **Note**: Contains hundreds of exported hooks that may or may not be in use

#### 9. **`apps/mobile/store/authApi.ts`**
   - **Status**: RTK Query API for authentication
   - **Action**: Should be deprecated once auth is fully migrated to Convex
   - **Note**: Currently commented out in `useAuth.ts`, but file still exists

#### 10. **`apps/mobile/store/index.ts`**
   - **Status**: Redux store configuration that includes RTK Query APIs
   - **Action**: Should be removed once all RTK Query dependencies are gone

## Driver App (`apps/driver-app`)

### Files Using RTK Query Hooks

The driver app has extensive RTK Query usage. All files importing from `driverApi` need migration:

#### 11. **`apps/driver-app/store/driverApi.ts`**
   - **Status**: Complete RTK Query API for driver app
   - **Action**: Needs full migration to Convex
   - **Exported Hooks**: 40+ hooks including:
     - Authentication: `useSendDriverOTPMutation`, `usePhoneLoginMutation`, `useEmailLoginMutation`
     - Profile: `useGetDriverProfileQuery`, `useUpdateDriverProfileMutation`
     - Orders: `useGetDriverOrdersQuery`, `useAcceptOrderMutation`, `useDeclineOrderMutation`
     - Earnings: `useGetDriverEarningsQuery`, `useRequestPayoutMutation`
     - Documents: `useGetDriverDocumentsQuery`, `useUploadDriverDocumentMutation`
     - And many more...

#### Files Using `driverApi`:
- `apps/driver-app/app/active-order.tsx`
- `apps/driver-app/app/advanced-earnings.tsx`
- `apps/driver-app/app/bank-details.tsx`
- `apps/driver-app/app/community-guidelines.tsx`
- `apps/driver-app/app/dashboard.tsx`
- `apps/driver-app/app/documents.tsx`
- `apps/driver-app/app/earnings.tsx`
- `apps/driver-app/app/email-auth.tsx`
- `apps/driver-app/app/help.tsx`
- `apps/driver-app/app/order-details.tsx`
- `apps/driver-app/app/orders.tsx`
- `apps/driver-app/app/otp-auth.tsx`
- `apps/driver-app/app/performance-analytics.tsx`
- `apps/driver-app/app/phone-auth.tsx`
- `apps/driver-app/app/privacy-policy.tsx`
- `apps/driver-app/app/profile/edit.tsx`
- `apps/driver-app/app/privacy.tsx`
- `apps/driver-app/app/refund-policy.tsx`
- `apps/driver-app/app/register.tsx`
- `apps/driver-app/app/terms-of-service.tsx`
- `apps/driver-app/app/vehicle.tsx`
- `apps/driver-app/app/withdrawals.tsx`
- `apps/driver-app/components/DocumentUpload.tsx`
- `apps/driver-app/contexts/EnhancedDriverAuthContext.tsx`

#### 12. **`apps/driver-app/store/store.ts`**
   - **Status**: Redux store configuration
   - **Action**: Should be removed once driver app is migrated

#### 13. **`apps/driver-app/app/_layout.tsx`**
   - **Status**: Uses Redux Provider
   - **Action**: Should be updated to use Convex provider

## Migration Priority

### High Priority (Core Mobile App Features)
1. **`useRegionAvailability.ts`** - Used for region checking (critical for ordering)
2. **`food-safety.tsx`** - User safety settings
3. **`privacy.tsx`** - Privacy preferences
4. **Kitchen favorites** - Core user interaction feature

### Medium Priority (Content Features)
5. **Video features** - `NoshHeavenPostModal.tsx`, `video/[videoId].tsx`
6. **Delete account survey** - Account management

### Lower Priority (Driver App)
7. **Entire driver app** - Separate app, can be migrated independently

## Notes

- Many RTK Query hooks in `customerApi.ts` may already be unused - consider auditing before migration
- The `authApi.ts` is already partially deprecated (commented out in `useAuth.ts`)
- Driver app migration can be done separately as it's a separate application
- Some hooks may have corresponding Convex actions/queries already created - verify before creating new ones

## Next Steps

1. Audit `customerApi.ts` to identify which hooks are actually still in use
2. Create Convex actions/queries for the remaining mobile app dependencies
3. Migrate mobile app files one by one
4. Plan driver app migration separately
5. Remove RTK Query dependencies from `package.json` once migration is complete

