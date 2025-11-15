# Stripe Test Cards

Use these test card numbers when testing payments in **Test Mode**. These cards work with any future expiry date, any 3-digit CVC, and any postal code.

## ✅ Successful Payments

### Standard Visa
- **Card Number**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **Postal Code**: Any valid postal code (e.g., `12345`)

### Visa (Debit)
- **Card Number**: `4000 0566 5566 5556`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **Postal Code**: Any valid postal code

### Mastercard
- **Card Number**: `5555 5555 5555 4444`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **Postal Code**: Any valid postal code

### American Express
- **Card Number**: `3782 822463 10005`
- **Expiry**: Any future date
- **CVC**: Any 4 digits (Amex uses 4-digit CVC)
- **Postal Code**: Any valid postal code

## ❌ Declined Cards

### Generic Decline
- **Card Number**: `4000 0000 0000 0002`
- **Message**: "Your card was declined."

### Insufficient Funds
- **Card Number**: `4000 0000 0000 9995`
- **Message**: "Your card has insufficient funds."

### Lost Card
- **Card Number**: `4000 0000 0000 9987`
- **Message**: "Your card was declined."

### Stolen Card
- **Card Number**: `4000 0000 0000 9979`
- **Message**: "Your card was declined."

### Expired Card
- **Card Number**: `4000 0000 0000 0069`
- **Message**: "Your card has expired."

### Incorrect CVC
- **Card Number**: `4000 0000 0000 0127`
- **Message**: "Your card's security code is incorrect."

### Processing Error
- **Card Number**: `4000 0000 0000 0119`
- **Message**: "An error occurred while processing your card. Try again in a little bit."

## 🔐 3D Secure Authentication

### 3D Secure Authentication Required (Success)
- **Card Number**: `4000 0027 6000 3184`
- **Flow**: Requires authentication, then succeeds
- **Use Case**: Test 3D Secure flow

### 3D Secure Authentication Required (Decline)
- **Card Number**: `4000 0000 0000 3055`
- **Flow**: Requires authentication, then declines
- **Use Case**: Test 3D Secure failure

### 3D Secure Authentication Required (Unavailable)
- **Card Number**: `4000 0025 0000 3155`
- **Flow**: 3D Secure unavailable, payment proceeds
- **Use Case**: Test fallback when 3D Secure is unavailable

## 💳 Card Brands

### Visa
- `4242 4242 4242 4242` (Standard)
- `4000 0566 5566 5556` (Debit)

### Mastercard
- `5555 5555 5555 4444`

### American Express
- `3782 822463 10005`

### Discover
- `6011 1111 1111 1117`

### Diners Club
- `3056 9309 0259 04`

### JCB
- `3530 1113 3330 0000`

### UnionPay
- `6200 0000 0000 0005`

## 🏦 UK-Specific Cards

### UK Visa Debit
- **Card Number**: `4000 0566 5566 5556`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **Postal Code**: Any UK postal code (e.g., `SW1A 1AA`)

## 📱 Mobile Payment Methods

### Apple Pay (Test Mode)
- Use any of the successful test cards above
- Apple Pay will use the card you have on file in your Apple Wallet
- In test mode, Stripe will process it as a test payment

### Google Pay (Test Mode)
- Use any of the successful test cards above
- Google Pay will use the card you have on file
- In test mode, Stripe will process it as a test payment

## 🔄 Recurring Payments / Setup Intents

For testing **Setup Intents** (like adding a card for future use):

### Successful Setup
- **Card Number**: `4242 4242 4242 4242`
- This will successfully create a payment method

### Setup with 3D Secure
- **Card Number**: `4000 0027 6000 3184`
- This will require 3D Secure authentication during setup

## 💰 Testing Different Amounts

Stripe also supports testing different scenarios based on the **amount**:

### Always Succeed
- Use `4242 4242 4242 4242` with any amount

### Always Decline
- Use `4000 0000 0000 0002` with any amount

### Require Authentication (3D Secure)
- Use `4000 0027 6000 3184` with any amount

## 🧪 Testing in Your App

### For AddCardSheet (Setup Intent)

1. **Successful Card Addition**:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - Postal Code: `12345` (if required)

2. **Card with 3D Secure**:
   - Card: `4000 0027 6000 3184`
   - Complete the 3D Secure authentication when prompted

3. **Declined Card**:
   - Card: `4000 0000 0000 0002`
   - Should show "Your card was declined" error

### For Payment/Checkout

1. **Successful Payment**:
   - Card: `4242 4242 4242 4242`
   - Any future expiry, CVC, postal code

2. **Insufficient Funds**:
   - Card: `4000 0000 0000 9995`
   - Should show insufficient funds error

3. **3D Secure Required**:
   - Card: `4000 0027 6000 3184`
   - Complete authentication to proceed

## ⚠️ Important Notes

1. **Test Mode Only**: These cards only work when your Stripe account is in **Test Mode**
2. **No Real Charges**: These cards will never result in real charges
3. **Any Expiry**: Use any future date (e.g., `12/34`, `01/25`)
4. **Any CVC**: Use any 3 digits (4 digits for Amex)
5. **Any Postal Code**: Use any valid postal code
6. **Switch to Live Mode**: When ready for production, switch to Live Mode and use real cards

## 🔍 Verifying Test Mode

To ensure you're in Test Mode:
1. Check Stripe Dashboard - toggle should show "Test mode"
2. Your API keys should start with:
   - `sk_test_...` (secret key)
   - `pk_test_...` (publishable key)

## 📚 Additional Resources

- [Stripe Test Cards Documentation](https://stripe.com/docs/testing)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [3D Secure Testing](https://stripe.com/docs/testing#three-ds-cards)

## Quick Reference Card

```
✅ Success:        4242 4242 4242 4242
❌ Decline:        4000 0000 0000 0002
💰 Insufficient:   4000 0000 0000 9995
🔐 3D Secure:      4000 0027 6000 3184
💳 Mastercard:     5555 5555 5555 4444
💳 Amex:           3782 822463 10005
```

