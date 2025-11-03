# Next Steps - Backend Integration

## ✅ Completed
- All frontend screens now have API integration hooks
- Phone call functionality implemented
- Error handling and loading states added
- Toast notifications for user feedback
- Improved mock data fallback logic
- Route params properly extracted

## 🔨 Backend Endpoints to Implement

### Priority 1: Core Account Management
1. **PUT /customer/profile/me** - Update customer profile
2. **DELETE /customer/account** - Delete customer account
3. **POST /customer/account/delete-feedback** - Submit deletion feedback
4. **GET /customer/download-account-data** - Download account data (returns download URL or triggers email)

### Priority 2: Payment & Settings
5. **GET /customer/payment-methods** - Get payment methods
6. **POST /customer/payment-methods** - Add payment method (requires payment processor token)
7. **PUT /customer/payment-methods/{id}/set-default** - Set default payment method
8. **GET /customer/balance** - Get Cribnosh balance
9. **GET /customer/balance/transactions** - Get balance transaction history
10. **POST /customer/family-profile/setup** - Setup family profile

### Priority 3: Food Safety & Preferences
11. **GET /customer/allergies** - Get customer allergies
12. **PUT /customer/allergies** - Update allergies
13. **GET /customer/dietary-preferences** - Get dietary preferences
14. **PUT /customer/dietary-preferences** - Update dietary preferences
15. **PUT /customer/food-safety/cross-contamination** - Update cross-contamination setting

### Priority 4: Data Sharing
16. **GET /customer/data-sharing-preferences** - Get data sharing preferences
17. **PUT /customer/data-sharing-preferences** - Update data sharing preferences

### Priority 5: Support
18. **GET /customer/support-cases** - Get support cases
19. **POST /customer/support-cases** - Create support case

## 🧪 Testing Checklist

### Frontend Testing
- [ ] Test API calls with mock backend or staging environment
- [ ] Verify error handling for network failures
- [ ] Test loading states on slow connections
- [ ] Verify toast notifications display correctly
- [ ] Test phone call functionality on physical devices
- [ ] Verify route params extraction works correctly
- [ ] Test empty state handling when APIs return no data

### Integration Testing
- [ ] Test payment settings flow end-to-end
- [ ] Test food safety preferences save/load
- [ ] Test account deletion flow
- [ ] Test data download request flow
- [ ] Test support case creation
- [ ] Test data sharing preferences toggle

## 🔌 Third-Party Integrations Needed

### Payment Processor (Stripe/PayPal/etc.)
1. Install payment processor SDK (e.g., `@stripe/stripe-react-native`)
2. Integrate card tokenization
3. Update `app/payment-settings.tsx` to use payment processor SDK
4. Remove TODO comment when complete

**File to update:** `app/payment-settings.tsx` (line 116)

## 📝 Additional Improvements

### Error Handling
- [ ] Add retry logic for failed API calls
- [ ] Implement offline mode support
- [ ] Add request timeouts

### Performance
- [ ] Add request caching where appropriate
- [ ] Implement optimistic updates for mutations
- [ ] Add pagination for large data sets

### UX Enhancements
- [ ] Add skeleton loaders for better perceived performance
- [ ] Implement pull-to-refresh for lists
- [ ] Add confirmation dialogs for destructive actions

## 📋 Backend API Requirements

All endpoints should follow this pattern:

### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Response Format
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "message": "Success message"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": { /* optional additional details */ }
  }
}
```

## 🚀 Deployment Considerations

### Environment Variables
- [ ] Verify API base URL is correct for production
- [ ] Ensure token storage is secure (Expo SecureStore is already in use)

### API Documentation
- [ ] Verify all endpoints are documented at **https://cribnosh.com/api/docs**
- [ ] Compare existing endpoints with frontend expectations in `store/customerApi.ts`
- [ ] Update API docs if endpoint signatures differ from frontend expectations
- [ ] Reference: https://cribnosh.com/api/docs for endpoint specifications

### Testing in Production
- [ ] Test with production API endpoints
- [ ] Monitor error rates and API response times
- [ ] Verify authentication flow works correctly

## 📚 Files Modified

### Core API Integration
- `store/customerApi.ts` - All API endpoint definitions
- `types/customer.ts` - Type definitions for API requests/responses

### Screen Updates
- `app/payment-settings.tsx` - Payment methods, balance, transactions
- `app/food-safety.tsx` - Allergies, dietary preferences, cross-contamination
- `app/help-support.tsx` - Support cases
- `app/manage-data-sharing.tsx` - Data sharing preferences
- `app/download-account-data.tsx` - Account data download
- `app/order-details.tsx` - Kitchen call functionality
- `app/order-status-tracking.tsx` - Delivery person call functionality
- `app/(tabs)/orders/cart/on-the-way.tsx` - Delivery person call
- `app/custom-order-details.tsx` - Improved mock data handling
- `app/shared-ordering/setup.tsx` - Custom order creation
- `app/shared-ordering/meal-options.tsx` - Custom order updates

## 🎯 Priority Order

1. **Immediate:** Implement Priority 1 endpoints (account management)
2. **Short-term:** Implement Priority 2 & 3 endpoints (payment & food safety)
3. **Medium-term:** Implement Priority 4 & 5 endpoints (data sharing & support)
4. **Long-term:** Payment processor SDK integration and performance optimizations

---

**Note:** All frontend code is ready and waiting for backend endpoints. The integration will work as soon as the backend endpoints are implemented and match the expected request/response formats defined in `types/customer.ts`.

