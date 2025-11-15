# Comprehensive Migration Plan: All Remaining Functionality to Direct Convex Communication

## Overview
This document outlines the complete migration plan for all remaining Next.js API endpoints to direct Convex actions for the mobile app. The plan is organized by priority, complexity, and business criticality.

## Migration Status

### ✅ Completed Migrations
1. **Authentication** - Email, Phone, Apple Sign-In, 2FA, Logout
2. **Profile Management** - Get, Update, Image Upload, Phone/Email OTP
3. **Account Management** - Change Password, Sessions, 2FA Setup/Disable
4. **Cart Management** - Get, Add, Update, Remove
5. **Phase 1: Critical Business Operations (All)** - Order Management, Payment Management
6. **Phase 4: Additional Features (All)** - Cuisines, Offers, Family Profile, Support, Analytics, Preferences
7. **Phase 3: Social & Engagement Features (All)** - Group Orders, Connections, Notifications
8. **Phase 2.1: Chef/Kitchen Browsing** - Nearby chefs, chef details, popular chefs, featured kitchens, search
9. **Phase 2.2: Dish/Meal Browsing** - Dish details, favorites, recommended meals, random meals, similar meals, kitchen meals
10. **Phase 2.3: Search Functionality** - General search, chef search, trending searches, search suggestions

---

## Phase 1: Critical Business Operations (High Priority)

### ✅ 1.1 Order Management
**Priority**: 🔴 Critical  
**Complexity**: Medium  
**Estimated Effort**: 2-3 days  
**Status**: ✅ Complete

**Endpoints to Migrate**:
- `GET /customer/orders` - Get customer orders (with pagination, filters)
- `GET /customer/orders/{order_id}` - Get specific order details
- `GET /customer/orders/{order_id}/status` - Get order status tracking
- `POST /customer/orders` - Create new order
- `POST /customer/orders/from-cart` - Create order from cart
- `POST /customer/orders/{order_id}/cancel` - Cancel order
- `POST /customer/orders/{order_id}/rate` - Rate order
- `GET /customer/orders/recent-dishes` - Get recent dishes for reordering
- `GET /customer/orders/usual-dinner-items` - Get usual dinner items

**Convex Actions Needed**:
- `customerGetOrders` - With pagination, status filters, order type filters
- `customerGetOrder` - Get single order with full details
- `customerGetOrderStatus` - Get order status tracking
- `customerCreateOrder` - Create order from items
- `customerCreateOrderFromCart` - Create order from cart
- `customerCancelOrder` - Cancel order with validation
- `customerRateOrder` - Rate and review order
- `customerGetRecentDishes` - Get recently ordered dishes
- `customerGetUsualDinnerItems` - Get frequently ordered items

**Dependencies**: Cart Management (✅ Complete)

---

### ✅ 1.2 Payment Management
**Priority**: 🔴 Critical  
**Complexity**: High (External API Integration)  
**Estimated Effort**: 3-4 days  
**Status**: ✅ Complete

**Endpoints to Migrate**:
- `GET /customer/payment-methods` - Get saved payment methods
- `POST /customer/payment-methods` - Add payment method
- `PUT /customer/payment-methods/{id}/default` - Set default payment method
- `POST /customer/checkout` - Create payment intent/checkout
- `GET /customer/balance` - Get Cribnosh balance
- `GET /customer/balance/transactions` - Get balance transactions
- `POST /customer/balance/top-up` - Top up balance

**Convex Actions Needed**:
- `customerGetPaymentMethods` - Get all payment methods
- `customerAddPaymentMethod` - Add new payment method (Stripe integration)
- `customerSetDefaultPaymentMethod` - Set default payment method
- `customerCreateCheckout` - Create payment intent (Stripe integration)
- `customerGetBalance` - Get wallet balance
- `customerGetBalanceTransactions` - Get transaction history
- `customerTopUpBalance` - Top up wallet balance

**Dependencies**: Stripe API integration, Payment processing logic

**Special Considerations**:
- Stripe API calls must be made server-side (Convex actions)
- Payment method tokens must be handled securely
- PCI compliance considerations

---

## Phase 2: Core Shopping Experience (High Priority)

### ✅ 2.1 Chef/Kitchen Browsing
**Priority**: 🟠 High  
**Complexity**: Medium  
**Estimated Effort**: 2-3 days  
**Status**: ✅ Complete

**Endpoints to Migrate**:
- `GET /customer/chefs/nearby` - Get nearby chefs
- `GET /customer/chefs/{chef_id}` - Get chef details
- `GET /customer/chefs/popular` - Get popular chefs
- `GET /customer/chefs/popular/{chef_id}` - Get popular chef with reviews
- `GET /customer/chefs/featured` - Get featured kitchens
- `POST /customer/chefs/search` - Search chefs with query
- `POST /customer/chefs/search-by-location` - Search chefs by location
- `POST /customer/kitchens/{kitchenId}/favorite` - Favorite/unfavorite kitchen

**Convex Actions Needed**:
- `customerGetNearbyChefs` - Get chefs by location/radius
- `customerGetChefDetails` - Get chef with full details
- `customerGetPopularChefs` - Get popular chefs list
- `customerGetPopularChefDetails` - Get popular chef with reviews
- `customerGetFeaturedKitchens` - Get featured kitchens
- `customerSearchChefs` - Search chefs by query
- `customerSearchChefsByLocation` - Search by location
- `customerToggleKitchenFavorite` - Favorite/unfavorite kitchen

**Dependencies**: Location services, Search indexing

---

### ✅ 2.2 Dish/Meal Browsing
**Priority**: 🟠 High  
**Complexity**: Medium  
**Estimated Effort**: 2-3 days  
**Status**: ✅ Complete

**Endpoints to Migrate**:
- `GET /customer/dishes/{dish_id}` - Get dish details
- `POST /customer/dishes/{dish_id}/favorite` - Favorite/unfavorite dish
- `GET /customer/meals/recommended` - Get recommended meals
- `GET /customer/meals/random` - Get random meals
- `GET /customer/meals/similar/{meal_id}` - Get similar meals
- `GET /customer/kitchens/{kitchenId}/meals` - Get kitchen meals
- `GET /customer/kitchens/{kitchenId}/meals/popular` - Get popular meals
- `POST /customer/kitchens/{kitchenId}/meals/search` - Search meals in kitchen

**Convex Actions Needed**:
- `customerGetDishDetails` - Get dish with full details
- `customerToggleDishFavorite` - Favorite/unfavorite dish
- `customerGetRecommendedMeals` - Get personalized recommendations
- `customerGetRandomMeals` - Get random meal suggestions
- `customerGetSimilarMeals` - Get similar meals
- `customerGetKitchenMeals` - Get meals from kitchen
- `customerGetPopularKitchenMeals` - Get popular meals from kitchen
- `customerSearchKitchenMeals` - Search meals in kitchen

**Dependencies**: Recommendation algorithms, Search functionality

---

### ✅ 2.3 Search Functionality
**Priority**: 🟠 High  
**Complexity**: Medium  
**Estimated Effort**: 2 days  
**Status**: ✅ Complete

**Endpoints to Migrate**:
- `POST /customer/search` - General search (dishes, chefs, etc.)
- `POST /customer/search/chefs` - Search chefs
- `GET /customer/search/trending` - Get trending searches
- `GET /customer/search/suggestions` - Get search suggestions

**Convex Actions Needed**:
- `customerSearch` - General search across dishes, chefs, kitchens
- `customerSearchChefs` - Chef-specific search
- `customerGetTrendingSearches` - Get trending search terms
- `customerGetSearchSuggestions` - Get search autocomplete suggestions

**Dependencies**: Search indexing, Analytics for trending

---

## Phase 3: Social & Engagement Features (Medium Priority)

### ✅ 3.1 Group Orders
**Priority**: 🟡 Medium  
**Complexity**: High  
**Estimated Effort**: 4-5 days  
**Status**: ✅ Complete

**Endpoints to Migrate**:
- `POST /customer/group-orders` - Create group order
- `GET /customer/group-orders/{group_order_id}` - Get group order
- `POST /customer/group-orders/{group_order_id}/join` - Join group order
- `POST /customer/group-orders/{group_order_id}/close` - Close group order
- `POST /customer/group-orders/{group_order_id}/start-selection` - Start selection phase
- `GET /customer/group-orders/{group_order_id}/selections` - Get participant selections
- `POST /customer/group-orders/{group_order_id}/selections` - Update selections
- `POST /customer/group-orders/{group_order_id}/ready` - Mark selections ready
- `GET /customer/group-orders/{group_order_id}/budget` - Get budget details
- `POST /customer/group-orders/{group_order_id}/budget/chip-in` - Chip in to budget
- `GET /customer/group-orders/{group_order_id}/status` - Get group order status

**Convex Actions Needed**:
- `customerCreateGroupOrder` - Create new group order
- `customerGetGroupOrder` - Get group order details
- `customerJoinGroupOrder` - Join existing group order
- `customerCloseGroupOrder` - Close group order
- `customerStartSelectionPhase` - Start selection phase
- `customerGetParticipantSelections` - Get all selections
- `customerUpdateParticipantSelections` - Update own selections
- `customerMarkSelectionsReady` - Mark selections as ready
- `customerGetBudgetDetails` - Get budget information
- `customerChipInToBudget` - Contribute to budget
- `customerGetGroupOrderStatus` - Get status updates

**Dependencies**: Real-time updates (Convex subscriptions), Complex state management

---

### ✅ 3.2 Connections
**Priority**: 🟡 Medium  
**Complexity**: Low-Medium  
**Estimated Effort**: 1-2 days  
**Status**: ✅ Complete

**Endpoints to Migrate**:
- `GET /customer/connections` - Get user connections
- `POST /customer/connections` - Create connection
- `DELETE /customer/connections/{connection_id}` - Remove connection
- `GET /customer/social/colleagues` - Get colleagues

**Convex Actions Needed**:
- `customerGetConnections` - Get all connections
- `customerCreateConnection` - Create new connection
- `customerRemoveConnection` - Remove connection
- `customerGetColleagues` - Get colleague connections

---

### ✅ 3.3 Notifications
**Priority**: 🟡 Medium  
**Complexity**: Medium  
**Estimated Effort**: 2-3 days  
**Status**: ✅ Complete

**Endpoints to Migrate**:
- `GET /customer/notifications` - Get notifications
- `GET /customer/notifications/stats` - Get notification stats
- `POST /customer/notifications/{id}/read` - Mark notification as read
- `POST /customer/notifications/read-all` - Mark all as read

**Convex Actions Needed**:
- `customerGetNotifications` - Get notifications with pagination
- `customerGetNotificationStats` - Get unread count, etc.
- `customerMarkNotificationRead` - Mark single notification read
- `customerMarkAllNotificationsRead` - Mark all as read

**Dependencies**: Real-time notifications (Convex subscriptions recommended)

---

## Phase 4: Additional Features (Lower Priority)

### ✅ 4.1 Cuisines & Categories
**Priority**: 🟢 Low  
**Complexity**: Low  
**Estimated Effort**: 1 day  
**Status**: ✅ Complete

**Endpoints to Migrate**:
- `GET /customer/cuisines` - Get all cuisines
- `GET /customer/cuisines/top` - Get top cuisines
- `GET /customer/cuisines/categories` - Get cuisine categories

**Convex Actions Needed**:
- `customerGetCuisines` - Get all cuisines
- `customerGetTopCuisines` - Get popular cuisines
- `customerGetCuisineCategories` - Get categories

---

### ✅ 4.2 Offers & Treats
**Priority**: 🟢 Low  
**Complexity**: Low-Medium  
**Estimated Effort**: 1-2 days  
**Status**: ✅ Complete

**Endpoints to Migrate**:
- `GET /customer/offers/active` - Get active offers
- `GET /customer/treats` - Get treats
- `GET /customer/treats/{treat_token}` - Get treat details

**Convex Actions Needed**:
- `customerGetActiveOffers` - Get available offers
- `customerGetTreats` - Get user treats
- `customerGetTreatDetails` - Get treat by token

---

### ✅ 4.3 Family Profile
**Priority**: 🟢 Low  
**Complexity**: Medium  
**Estimated Effort**: 2-3 days  
**Status**: ✅ Complete

**Endpoints to Migrate**:
- `GET /customer/family-profile` - Get family profile
- `POST /customer/family-profile` - Setup family profile
- `GET /customer/family-profile/members` - Get family members
- `POST /customer/family-profile/invite` - Invite member
- `POST /customer/family-profile/accept` - Accept invitation
- `GET /customer/family-profile/orders` - Get family orders
- `GET /customer/family-profile/spending` - Get spending summary

**Convex Actions Needed**:
- `customerGetFamilyProfile` - Get family profile
- `customerSetupFamilyProfile` - Create family profile
- `customerGetFamilyMembers` - Get all members
- `customerInviteFamilyMember` - Send invitation
- `customerAcceptFamilyInvite` - Accept invitation
- `customerGetFamilyOrders` - Get family order history
- `customerGetFamilySpending` - Get spending analytics

---

### ✅ 4.4 Support & Help
**Priority**: 🟢 Low  
**Complexity**: Medium  
**Estimated Effort**: 2-3 days  
**Status**: ✅ Complete

**Endpoints to Migrate**:
- `GET /customer/support-cases` - Get support cases
- `POST /customer/support-cases` - Create support case
- `GET /customer/support-chat` - Get chat messages
- `POST /customer/support-chat` - Send message
- `GET /customer/support-chat/quick-replies` - Get quick replies

**Convex Actions Needed**:
- `customerGetSupportCases` - Get support cases
- `customerCreateSupportCase` - Create new case
- `customerGetSupportChat` - Get chat history
- `customerSendSupportMessage` - Send message
- `customerGetQuickReplies` - Get quick reply options

**Dependencies**: Real-time chat (Convex subscriptions recommended)

---

### ✅ 4.5 Analytics & Stats
**Priority**: 🟢 Low  
**Complexity**: Low-Medium  
**Estimated Effort**: 1-2 days  
**Status**: ✅ Complete

**Endpoints to Migrate**:
- `GET /customer/stats/weekly-summary` - Get weekly summary
- `GET /customer/stats/monthly-overview` - Get monthly overview
- `GET /customer/analytics/user-behavior` - Get user behavior
- `GET /customer/nutrition/calories-progress` - Get nutrition progress
- `GET /customer/rewards/nosh-points` - Get rewards points

**Convex Actions Needed**:
- `customerGetWeeklySummary` - Get weekly stats
- `customerGetMonthlyOverview` - Get monthly stats
- `customerGetUserBehavior` - Get behavior analytics
- `customerGetNutritionProgress` - Get nutrition tracking
- `customerGetRewardsPoints` - Get points balance

---

### ✅ 4.6 Preferences & Settings
**Priority**: 🟢 Low  
**Complexity**: Low  
**Estimated Effort**: 1 day  
**Status**: ✅ Complete

**Endpoints to Migrate**:
- `GET /customer/dietary-preferences` - Get dietary preferences
- `GET /customer/allergies` - Get allergies
- `GET /customer/data-sharing-preferences` - Get data sharing settings
- `PUT /customer/data-sharing-preferences` - Update data sharing

**Convex Actions Needed**:
- `customerGetDietaryPreferences` - Get preferences
- `customerGetAllergies` - Get allergies
- `customerGetDataSharingPreferences` - Get settings
- `customerUpdateDataSharingPreferences` - Update settings

---

## Implementation Strategy

### General Pattern for Each Migration

1. **Create Convex Actions** (`packages/convex/actions/users.ts` or separate files)
   - Use session token authentication
   - Verify customer role
   - Call existing Convex queries/mutations
   - Transform data for mobile app format
   - Return consistent success/error format

2. **Create Custom Hooks** (`apps/mobile/hooks/`)
   - Encapsulate Convex action calls
   - Handle loading states
   - Show toast notifications
   - Format responses for UI

3. **Update UI Components**
   - Replace RTK Query hooks with custom hooks
   - Update data fetching logic
   - Maintain backward compatibility

4. **Testing**
   - Test all operations
   - Verify error handling
   - Check loading states
   - Validate data transformations

### Code Organization

**For Large Feature Sets** (e.g., Orders, Payments):
- Create separate action files: `packages/convex/actions/orders.ts`, `packages/convex/actions/payments.ts`
- Create separate hook files: `apps/mobile/hooks/useOrders.ts`, `apps/mobile/hooks/usePayments.ts`

**For Small Feature Sets**:
- Add to existing `packages/convex/actions/users.ts`
- Add to existing hooks or create small dedicated hooks

---

## Priority Matrix

| Phase | Feature | Priority | Complexity | Effort | Dependencies | Status |
|-------|---------|----------|------------|--------|--------------|--------|
| 1.1 | Order Management | 🔴 Critical | Medium | 2-3 days | Cart ✅ | ✅ Complete |
| 1.2 | Payment Management | 🔴 Critical | High | 3-4 days | Stripe API | ✅ Complete |
| 2.1 | Chef/Kitchen Browsing | 🟠 High | Medium | 2-3 days | Location | ✅ Complete |
| 2.2 | Dish/Meal Browsing | 🟠 High | Medium | 2-3 days | Search | ✅ Complete |
| 2.3 | Search Functionality | 🟠 High | Medium | 2 days | Indexing | ✅ Complete |
| 3.1 | Group Orders | 🟡 Medium | High | 4-5 days | Real-time | ✅ Complete |
| 3.2 | Connections | 🟡 Medium | Low-Med | 1-2 days | - | ✅ Complete |
| 3.3 | Notifications | 🟡 Medium | Medium | 2-3 days | Real-time | ✅ Complete |
| 4.1 | Cuisines | 🟢 Low | Low | 1 day | - | ✅ Complete |
| 4.2 | Offers & Treats | 🟢 Low | Low-Med | 1-2 days | - | ✅ Complete |
| 4.3 | Family Profile | 🟢 Low | Medium | 2-3 days | - | ✅ Complete |
| 4.4 | Support | 🟢 Low | Medium | 2-3 days | Real-time | ✅ Complete |
| 4.5 | Analytics | 🟢 Low | Low-Med | 1-2 days | - | ✅ Complete |
| 4.6 | Preferences | 🟢 Low | Low | 1 day | - | ✅ Complete |

---

## Estimated Total Effort

- **Phase 1 (Critical)**: ~5-7 days ✅ Complete
- **Phase 2 (Core Shopping)**: ~6-8 days ✅ Complete
- **Phase 3 (Social)**: ~7-10 days ✅ Complete
- **Phase 4 (Additional)**: ~9-13 days ✅ Complete

**Total**: ~27-38 days of development work  
**Completed**: ~27-38 days (All Phases)  
**Remaining**: 0 days - **🎉 MIGRATION COMPLETE!**

---

## Recommendations

1. **Start with Phase 1** - Orders and Payments are critical for business operations
2. **Batch Similar Features** - Group related endpoints together (e.g., all chef endpoints)
3. **Use Real-time Where Beneficial** - Consider Convex subscriptions for notifications, group orders, support chat
4. **Maintain API Compatibility** - Keep response formats consistent for easier migration
5. **Test Thoroughly** - Each phase should be fully tested before moving to next
6. **Document Patterns** - Create reusable patterns for common operations

---

## 🎉 Migration Status: COMPLETE!

### ✅ All Phases Completed
- **Phase 1: Critical Business Operations** ✅ - Order Management, Payment Management
- **Phase 2: Core Shopping Experience** ✅ - Chef/Kitchen Browsing, Dish/Meal Browsing, Search
- **Phase 3: Social & Engagement Features** ✅ - Group Orders, Connections, Notifications
- **Phase 4: Additional Features** ✅ - Cuisines, Offers, Family Profile, Support, Analytics, Preferences

### Implementation Summary
All Next.js API endpoints have been successfully migrated to direct Convex actions for the mobile app:
- ✅ All Convex actions created and tested
- ✅ All mobile hooks implemented (`useOrders`, `usePayments`, `useChefs`, `useMeals`, `useSearch`, `useGroupOrders`, etc.)
- ✅ All mobile components updated to use new hooks
- ✅ Error handling and loading states implemented
- ✅ Real-time features working (Group Orders, Notifications)
- ✅ Stripe integration complete for payments
- ✅ All patterns established and documented

### Next Steps (Post-Migration)
1. **Testing & QA** - Comprehensive testing of all migrated features
2. **Performance Monitoring** - Monitor Convex action performance and optimize as needed
3. **Documentation** - Update API documentation to reflect Convex actions
4. **Deprecation** - Plan deprecation timeline for old Next.js API endpoints
5. **Monitoring** - Set up monitoring and alerting for Convex actions

