#!/bin/bash

echo "=== Stripe Configuration Verification ==="
echo ""

# Check Convex secret key
echo "1. Checking Convex Secret Key..."
CONVEX_KEY=$(cd packages/convex && npx convex env list 2>/dev/null | grep "STRIPE_SECRET_KEY=" | cut -d'=' -f2- | tr -d ' ')
if [ -z "$CONVEX_KEY" ]; then
    echo "   ❌ STRIPE_SECRET_KEY not found in Convex"
else
    echo "   ✅ STRIPE_SECRET_KEY found: ${CONVEX_KEY:0:20}..."
    # Extract account ID (first part after sk_test_)
    SECRET_ACCOUNT=$(echo "$CONVEX_KEY" | sed 's/sk_test_//' | cut -c1-50)
    echo "   Account ID (first 50 chars): $SECRET_ACCOUNT"
fi

echo ""

# Check Mobile publishable key
echo "2. Checking Mobile Publishable Key..."
if [ -f "apps/mobile/.env" ]; then
    MOBILE_KEY=$(grep "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=" apps/mobile/.env | cut -d'=' -f2- | tr -d ' ' | tr -d '"')
    if [ -z "$MOBILE_KEY" ]; then
        echo "   ❌ EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY not found in apps/mobile/.env"
    else
        echo "   ✅ EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY found: ${MOBILE_KEY:0:20}..."
        # Extract account ID (first part after pk_test_)
        PUBLISHABLE_ACCOUNT=$(echo "$MOBILE_KEY" | sed 's/pk_test_//' | cut -c1-50)
        echo "   Account ID (first 50 chars): $PUBLISHABLE_ACCOUNT"
    fi
else
    echo "   ❌ apps/mobile/.env file not found"
fi

echo ""

# Compare account IDs
if [ ! -z "$CONVEX_KEY" ] && [ ! -z "$MOBILE_KEY" ]; then
    echo "3. Comparing Keys..."
    if [ "$SECRET_ACCOUNT" = "$PUBLISHABLE_ACCOUNT" ]; then
        echo "   ✅ Keys appear to be from the same account"
    else
        echo "   ⚠️  WARNING: Keys appear to be from DIFFERENT accounts!"
        echo "   This will cause authentication errors."
        echo "   Please ensure both keys are from the same Stripe account."
    fi
fi

echo ""
echo "=== Verification Complete ==="
