# Apple Key Types - Important Distinction

## Two Different Types of Keys

### 1. **APNs Key** (Apple Push Notifications) ❌ NOT for Sign In
   - **Purpose**: Push notifications to iOS/macOS apps
   - **Can be downloaded?**: **NO** - Cannot be downloaded
   - **What you see**: Key ID like `X2K77ZV44A`
   - **Enabled Services**: "Apple Push Notifications service (APNs)"
   - **Status**: This is what you're currently viewing
   - **Cannot be used for**: Sign In with Apple authentication

### 2. **Auth Key** (for Sign In with Apple) ✅ What you need
   - **Purpose**: JWT signing for Sign In with Apple
   - **Can be downloaded?**: **YES** - Downloads as .p8 file
   - **What you'll see**: Key ID (different from APNs key)
   - **Enabled Services**: "Sign In with Apple"
   - **Status**: Need to create this separately
   - **Used for**: Generating client secrets for Apple Sign-In

## How to Create the Correct Key

1. Go to: https://developer.apple.com/account/resources/authkeys/list
2. Click **+** (Create a new key)
3. **Name**: "Cribnosh Sign-In Auth Key" (or similar)
4. **Enable**: ✅ **Sign In with Apple** (NOT APNs)
5. Click **Continue** → **Register**
6. **Download the .p8 file immediately** (one-time download)
7. Note the **Key ID** shown on the page

## Current Key You Have

- **Key ID**: `X2K77ZV44A`
- **Type**: APNs Key (Push Notifications)
- **Purpose**: Push notifications only
- **Can download?**: No
- **Use for Sign In?**: No ❌

## What You Need

- **Type**: Auth Key
- **Purpose**: Sign In with Apple
- **Can download?**: Yes (as .p8 file)
- **Use for Sign In?**: Yes ✅

## Summary

The key you're viewing (`X2K77ZV44A`) is for **push notifications**, not Sign In with Apple. You need to create a **separate Auth Key** with "Sign In with Apple" enabled to get a downloadable .p8 file for authentication.

