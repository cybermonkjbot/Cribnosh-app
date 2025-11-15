# EAS Updates Implementation Guide

## ✅ What's Been Set Up

- ✅ `expo-updates` package installed
- ✅ Update configuration in `app.json`
- ✅ Update channels configured in `eas.json`
- ✅ Automatic update checking in `app/_layout.tsx`
- ✅ NPM scripts for publishing updates

## 🚀 Next Steps

### 1. Rebuild Your App with EAS Build

**Important**: EAS Updates only work in production builds created with EAS Build. You need to rebuild your app to enable updates.

```bash
# For iOS
eas build --profile production --platform ios

# For Android
eas build --profile production --platform android

# Or both at once
eas build --profile production --platform all
```

**Why?** The native code needs to be compiled with the update configuration. Development builds and Expo Go don't support updates.

### 2. Test the Update Flow

After rebuilding and installing the new build:

1. Make a small change to your app (e.g., change some text or styling)
2. Publish an update:
   ```bash
   npm run update:production
   # or
   eas update --branch production --message "Test update"
   ```
3. Close and reopen the app - it should automatically download and apply the update

### 3. Publishing Updates

#### Quick Commands

```bash
# Development channel
npm run update:development

# Preview channel
npm run update:preview

# Production channel
npm run update:production
```

#### Custom Messages

```bash
eas update --branch production --message "Fixed bug in checkout flow"
```

#### Targeting Specific Platforms

```bash
# iOS only
eas update --branch production --platform ios

# Android only
eas update --branch production --platform android
```

### 4. Update Channels Explained

- **development**: For internal testing builds
- **preview**: For beta/staging builds
- **production**: For App Store/Play Store builds

Each channel receives updates independently. Make sure your build profile matches your update channel.

### 5. Runtime Version

Your app uses `runtimeVersion: "1.0.0"` (manual version), which means:
- Updates are tied to this specific runtime version
- **Important**: When you increment the app version (e.g., 1.0.0 → 1.0.1), you must:
  1. Update the `runtimeVersion` in `app.json` to match (e.g., `"1.0.1"`)
  2. Create a new build with the new runtime version
- Updates can only be applied to apps with the same runtime version
- Keep `runtimeVersion` in sync with your app version for easier management

### 6. What Can Be Updated?

✅ **Can be updated via EAS Updates:**
- JavaScript/TypeScript code
- React components
- Assets (images, fonts, etc.)
- Configuration files (if bundled)

❌ **Cannot be updated (requires new build):**
- Native code changes
- New native dependencies
- Changes to `app.json` that affect native config
- Changes to `expo` SDK version

### 7. Best Practices

1. **Test updates in preview first** before pushing to production
2. **Use descriptive update messages** to track what changed
3. **Monitor update status** in the EAS dashboard
4. **Increment app version** when making native changes
5. **Keep updates small** - large updates may take longer to download

### 8. Monitoring Updates

View update status in the EAS dashboard:
- https://expo.dev/accounts/[your-account]/projects/[your-project]/updates

You can see:
- Update history
- Rollout status
- Error rates
- User adoption

### 9. Rollback Updates

If an update causes issues, you can rollback:

```bash
eas update:rollback --branch production
```

Or use the EAS dashboard to rollback to a previous update.

### 10. Environment Variables

If you use environment variables in your app, make sure they're set in EAS Secrets:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "https://api.example.com"
```

Environment variables are baked into updates, so changes require a new update.

## 🔍 Troubleshooting

### Updates not applying?

1. **Check if updates are enabled**: `Updates.isEnabled` should be `true` in production builds
2. **Verify runtime version**: Updates only work for the same runtime version
3. **Check update channel**: Make sure your build and update use the same channel
4. **Check network**: Updates require internet connection
5. **Check EAS dashboard**: Verify the update was successfully published

### Update check not running?

- Updates only check in production builds (not in `__DEV__` mode)
- The check happens on app launch
- Check console logs for any errors

## 📚 Additional Resources

- [EAS Updates Documentation](https://docs.expo.dev/eas-updates/introduction/)
- [Runtime Versions](https://docs.expo.dev/eas-updates/runtime-versions/)
- [Update Channels](https://docs.expo.dev/eas-updates/update-channels/)

