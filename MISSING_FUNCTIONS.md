# Missing Convex Functions

This document lists all Convex functions that are being called in the codebase but have not been implemented yet.

## Missing from `packages/convex/actions/users.ts`

### Support Functions (5)
- `customerGetSupportCases` - Get support cases (called in `apps/mobile/hooks/useSupport.ts:29`)
- `customerCreateSupportCase` - Create new support case (called in `apps/mobile/hooks/useSupport.ts:90`)
- `customerGetSupportChat` - Get support chat history (called in `apps/mobile/hooks/useSupport.ts:159`)
- `customerSendSupportMessage` - Send support message (called in `apps/mobile/hooks/useSupport.ts:213`)
- `customerGetQuickReplies` - Get quick reply options (called in `apps/mobile/hooks/useSupport.ts:265`)

### Dish/Meal Functions (6)
- `customerGetDishDetails` - Get dish with full details (called in `apps/mobile/hooks/useMeals.ts:21`)
- `customerGetDishFavoriteStatus` - Get favorite status (called in `apps/mobile/hooks/useMeals.ts:70`)
- `customerAddDishFavorite` - Add dish to favorites (called in `apps/mobile/hooks/useMeals.ts:119`)
- `customerRemoveDishFavorite` - Remove dish from favorites (called in `apps/mobile/hooks/useMeals.ts:175`)
- `customerToggleDishFavorite` - Toggle favorite status (called in `apps/mobile/hooks/useMeals.ts:231`)
- `customerGetSimilarMeals` - Get similar meals (called in `apps/mobile/hooks/useMeals.ts:385`)

### Kitchen/Chef Functions (4)
- `customerGetPopularChefDetails` - Get popular chef with reviews (called in `apps/mobile/hooks/useChefs.ts:140`)
- `customerGetKitchenFavoriteStatus` - Get kitchen favorite status (called in `apps/mobile/hooks/useChefs.ts:329`)
- `customerAddKitchenFavorite` - Add kitchen to favorites (called in `apps/mobile/hooks/useChefs.ts:371`)
- `customerRemoveKitchenFavorite` - Remove kitchen from favorites (called in `apps/mobile/hooks/useChefs.ts:412`)
- `customerSearchChefsByLocation` - Search chefs by location (called in `apps/mobile/hooks/useChefs.ts:280`)

### Search Functions (3)
- `customerSearch` - General search across dishes, chefs, kitchens (called in `apps/mobile/hooks/useSearch.ts:29`)
- `customerSearchChefs` - Chef-specific search (called in `apps/mobile/hooks/useSearch.ts:81`)
- `customerGetSearchSuggestions` - Get search autocomplete suggestions (called in `apps/mobile/hooks/useSearch.ts:135`)

### Group Orders Functions (9)
- `customerCreateGroupOrder` - Create new group order (called in `apps/mobile/hooks/useGroupOrders.ts:38`)
- `customerGetGroupOrder` - Get group order details (called in `apps/mobile/hooks/useGroupOrders.ts:105`)
- `customerJoinGroupOrder` - Join existing group order (called in `apps/mobile/hooks/useGroupOrders.ts:165`)
- `customerCloseGroupOrder` - Close group order (called in `apps/mobile/hooks/useGroupOrders.ts:224`)
- `customerStartSelectionPhase` - Start selection phase (called in `apps/mobile/hooks/useGroupOrders.ts:280`)
- `customerGetParticipantSelections` - Get all selections (called in `apps/mobile/hooks/useGroupOrders.ts:336`)
- `customerUpdateParticipantSelections` - Update own selections (called in `apps/mobile/hooks/useGroupOrders.ts:399`)
- `customerMarkSelectionsReady` - Mark selections as ready (called in `apps/mobile/hooks/useGroupOrders.ts:458`)
- `customerGetGroupOrderStatus` - Get status updates (called in `apps/mobile/hooks/useGroupOrders.ts:622`)
- `customerGetBudgetDetails` - Get budget information (called in `apps/mobile/hooks/useGroupOrders.ts:516`)
- `customerChipInToBudget` - Contribute to budget (called in `apps/mobile/hooks/useGroupOrders.ts:565`)

### Family Profile Functions (7)
- `customerGetFamilyProfile` - Get family profile (called in `apps/mobile/hooks/useFamilyProfile.ts:24`)
- `customerSetupFamilyProfile` - Create family profile (called in `apps/mobile/hooks/useFamilyProfile.ts:98`)
- `customerGetFamilyMembers` - Get all members (called in `apps/mobile/hooks/useFamilyProfile.ts:161`)
- `customerInviteFamilyMember` - Send invitation (called in `apps/mobile/hooks/useFamilyProfile.ts:223`)
- `customerAcceptFamilyInvite` - Accept invitation (called in `apps/mobile/hooks/useFamilyProfile.ts:283`)
- `customerGetFamilyOrders` - Get family order history (called in `apps/mobile/hooks/useFamilyProfile.ts:342`)
- `customerGetFamilySpending` - Get spending analytics (called in `apps/mobile/hooks/useFamilyProfile.ts:393`)

### Connections Functions (2)
- `customerGetConnections` - Get all connections (called in `apps/mobile/hooks/useConnections.ts:25`)
- `customerCreateConnection` - Create new connection (called in `apps/mobile/hooks/useConnections.ts:77`)

### Preferences Functions (4)
- `customerGetDietaryPreferences` - Get dietary preferences (called in `apps/mobile/hooks/usePreferences.ts:24`)
- `customerUpdateDietaryPreferences` - Update dietary preferences (called in `apps/mobile/hooks/usePreferences.ts:79`)
- `customerGetAllergies` - Get allergies (called in `apps/mobile/hooks/usePreferences.ts:141`)
- `customerUpdateAllergies` - Update allergies (called in `apps/mobile/hooks/usePreferences.ts:188`)
- `customerGetDataSharingPreferences` - Get data sharing settings (called in `apps/mobile/hooks/usePreferences.ts:242`)
- `customerUpdateDataSharingPreferences` - Update data sharing settings (called in `apps/mobile/hooks/usePreferences.ts:299`)

### Treats Functions (4)
- `customerGetTreats` - Get user treats (called in `apps/mobile/hooks/useOffersAndTreats.ts:75`)
- `customerGetTreatDetails` - Get treat by ID (called in `apps/mobile/hooks/useOffers.ts:122`)
- `customerGetTreatByToken` - Get treat by token (called in `apps/mobile/hooks/useOffersAndTreats.ts:187`)
- `customerCreateTreat` - Create treat (called in `apps/mobile/hooks/useOffersAndTreats.ts:126`)

### Cart Functions (1)
- `customerRemoveFromCart` - Remove item from cart (called in `apps/mobile/hooks/useCart.ts:179`)

## Summary

**Total Missing Functions: 50**

- Support: 5 functions
- Dish/Meal: 6 functions
- Kitchen/Chef: 5 functions
- Search: 3 functions
- Group Orders: 11 functions
- Family Profile: 7 functions
- Connections: 2 functions
- Preferences: 6 functions
- Treats: 4 functions
- Cart: 1 function

## Notes

- All functions in `chefs.ts`, `orders.ts`, and `payments.ts` appear to be implemented
- The error message specifically mentions `customerGetSupportCases` which is in the Support Functions section above
- These functions are being called from various mobile app hooks, so they need to be implemented to restore full functionality

