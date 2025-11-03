# API Endpoints Comparison

## Frontend Needs vs API Documentation

This document compares the endpoints needed by the frontend (`store/customerApi.ts`) with what exists in the API documentation (`https://cribnosh.com/swagger.json`).

---

## ✅ Endpoints That Exist in API Documentation

### Customer Profile
- ✅ `GET /customer/profile/me` - Get customer profile
- ✅ `PUT /customer/profile/me` - Update customer profile (needs verification)

### Cuisines
- ✅ `GET /customer/cuisines` - Get cuisines
- ✅ `GET /customer/cuisines/top` - Get top cuisines (not used in frontend)

### Chefs
- ✅ `GET /customer/chefs/popular` - Get popular chefs

### Cart
- ✅ `GET /customer/cart` - Get cart
- ✅ `POST /customer/cart/items` - Add to cart
- ✅ `DELETE /customer/cart/items/{cart_item_id}` - Remove from cart (not used in frontend)

### Orders
- ✅ `GET /customer/orders` - Get orders
- ✅ `GET /customer/orders/{order_id}` - Get order details
- ✅ `GET /customer/orders/{order_id}/status` - Get order status

### Search
- ✅ `GET /customer/search` - Search
- ✅ `POST /customer/search` - Search with emotions (needs verification)
- ✅ `GET /customer/search/chefs` - Search chefs
- ✅ `GET /customer/search/suggestions` - Get search suggestions
- ✅ `GET /customer/search/trending` - Get trending search

### Checkout
- ✅ `POST /customer/checkout` - Create checkout

### Custom Orders
- ✅ `POST /custom_orders` - Create custom order (needs verification)
- ✅ `GET /custom_orders` - Get custom orders
- ✅ `GET /custom_orders/{custom_order_id}` - Get custom order details
- ✅ `PUT /custom_orders/{custom_order_id}` - Update custom order ✅ VERIFIED
- ✅ `DELETE /custom_orders/{custom_order_id}` - Delete custom order ✅ VERIFIED

### Live Streaming
- ✅ `GET /live-streaming/customer` - Get live streams

---

## ❌ Endpoints Missing from API Documentation

### Account Management
- ❌ `DELETE /customer/account` - Delete account
- ❌ `POST /customer/account/delete-feedback` - Submit delete account feedback
- ❌ `POST /customer/account/download-data` - Download account data

### Payment Methods
- ❌ `GET /customer/payment-methods` - Get payment methods
  - ⚠️ Found `/payments/cards` (GET) - may be same functionality
- ❌ `POST /customer/payment-methods` - Add payment method
  - ⚠️ Found `/payments/add-card` (POST) - may be same functionality
- ❌ `PUT /customer/payment-methods/{id}/default` - Set default payment method
  - ⚠️ Found `/payments/cards/{card_id}` (methods need verification)

### Balance
- ❌ `GET /customer/balance` - Get Cribnosh balance
- ❌ `GET /customer/balance/transactions` - Get balance transactions

### Family Profile
- ❌ `POST /customer/family-profile` - Setup family profile

### Food Safety
- ❌ `GET /customer/allergies` - Get allergies
- ❌ `PUT /customer/allergies` - Update allergies
- ❌ `GET /customer/dietary-preferences` - Get dietary preferences
- ❌ `PUT /customer/dietary-preferences` - Update dietary preferences
- ❌ `PUT /customer/food-safety/cross-contamination` - Update cross-contamination setting

### Data Sharing
- ❌ `GET /customer/data-sharing-preferences` - Get data sharing preferences
- ❌ `PUT /customer/data-sharing-preferences` - Update data sharing preferences

### Support
- ❌ `GET /customer/support-cases` - Get support cases
- ❌ `POST /customer/support-cases` - Create support case

### Orders (Additional)
- ❌ `POST /customer/orders/{order_id}/cancel` - Cancel order
  - ⚠️ Found `/orders/cancel` (POST) but not customer-specific path
- ❌ `POST /customer/orders/{order_id}/rate` - Rate order
  - ⚠️ Found `/orders/review` (POST) but not customer-specific path

---

## 📝 Notes

1. **Order Operations**: The frontend uses `POST /customer/orders/{order_id}/cancel` and `POST /customer/orders/{order_id}/rate`, but these need to be verified in the API docs. They may exist but weren't found in the initial scan.

2. **Custom Orders**: The endpoints for custom orders exist, but the UPDATE and DELETE methods need verification.

3. **Profile Update**: `PUT /customer/profile/me` is defined in the frontend and likely exists, but needs verification.

4. **Search with Emotions**: The frontend has `searchWithEmotions` using `POST /customer/search`, but this needs verification in the API docs.

---

## 🔍 Next Steps

1. Verify HTTP methods for endpoints that exist but method is unclear
2. Check if missing endpoints exist under different paths
3. Create implementation plan for missing endpoints
4. Update frontend code to use verified endpoints

