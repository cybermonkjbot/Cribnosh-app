# EAS Build Fixes for Bun Monorepo

## Issues Identified and Fixed

### 1. ✅ Bun Version Not Specified in EAS Configuration

**Problem**: EAS Build needs to know which Bun version to use. Without explicit specification, it might default to a different package manager or use an incompatible Bun version.

**Solution**: Added `"bun": "1.2.20"` to all build profiles in both:
- `apps/mobile/eas.json`
- `apps/driver-app/eas.json`

This ensures EAS Build uses the correct Bun version (matching your local version) for all build profiles (development, preview, production).

### 2. ✅ Lockfile Detection

**Status**: Your project uses `bun.lock` (text format) files which are present in:
- Root: `/bun.lock`
- Mobile app: `/apps/mobile/bun.lock`
- Driver app: `/apps/driver-app/bun.lock`

**Note**: EAS Build detects Bun by looking for lockfiles. With the Bun version explicitly specified in `eas.json`, EAS will use Bun even if it doesn't find `bun.lockb` (binary format).

### 3. ✅ Monorepo Configuration

**Status**: Your monorepo is properly configured:
- Workspaces defined in root `package.json`
- Metro config properly handles monorepo structure
- `.easignore` files exclude unnecessary directories
- `bunfig.toml` configured with `hoist = false` for isolated dependencies

### 4. ⚠️ Trusted Dependencies (If Needed)

**Status**: Currently, no packages requiring `trustedDependencies` were identified. However, if you encounter build failures related to postinstall scripts, you may need to add packages to `trustedDependencies` in your `package.json` files.

**Example** (if needed):
```json
{
  "trustedDependencies": ["@sentry/cli", "package-name"]
}
```

## Changes Made

### `apps/mobile/eas.json`
- Added `"bun": "1.2.20"` to `development` profile
- Added `"bun": "1.2.20"` to `preview` profile
- Added `"bun": "1.2.20"` to `production` profile

### `apps/driver-app/eas.json`
- Added `"bun": "1.2.20"` to `development` profile
- Added `"bun": "1.2.20"` to `preview` profile
- Added `"bun": "1.2.20"` to `production` profile

### `apps/mobile/metro.config.js`
- **Fixed React resolution for EAS builds**: Added detection for EAS build environment where dependencies are installed at the build root (`/Users/expo/workingdir/build/node_modules`) instead of the app directory
- **Improved build root detection**: Automatically detects the build root by walking up the directory tree to find where `node_modules/expo` exists
- **Enhanced node_modules resolution**: Metro now checks multiple locations for React:
  1. Mobile app's `node_modules` (first priority)
  2. Workspace root's `node_modules` (for local monorepo)
  3. Build root's `node_modules` (for EAS builds)
- **Fallback resolution**: If React is not found in the app's `node_modules`, the config automatically falls back to the build root's `node_modules` where EAS installs dependencies

## Next Steps

1. **Test the Build**: Try running an EAS build to verify the fixes:
   ```bash
   cd apps/mobile
   eas build --profile development --platform android
   ```

2. **Verify Lockfiles**: Ensure `bun.lock` files are committed to git:
   ```bash
   git status | grep bun.lock
   ```

3. **If Build Still Fails**: Check the build logs for specific errors. Common additional issues:
   - Missing environment variables
   - Native dependency compilation errors
   - Metro bundler configuration issues

## Additional Resources

- [Expo: Using Bun](https://docs.expo.dev/guides/using-bun/)
- [Expo: Monorepos](https://docs.expo.dev/guides/monorepos/)
- [EAS Build Troubleshooting](https://docs.expo.dev/build-reference/troubleshooting/)

## Verification Checklist

- [x] Bun version specified in all build profiles
- [x] Lockfiles present in project
- [x] Monorepo structure properly configured
- [x] Metro config updated to handle EAS build paths
- [ ] Test EAS build (to be done)
- [ ] Verify no other package manager lockfiles exist (package-lock.json, yarn.lock)

## React Resolution Fix

The main issue was that in EAS builds, dependencies are installed at the build root (`/Users/expo/workingdir/build/node_modules`) rather than in the app's directory. The Metro config now:

1. **Automatically detects the EAS build environment** by finding where `node_modules/expo` exists
2. **Falls back to build root's node_modules** if React isn't found in the app's node_modules
3. **Adds build root to node_modules resolution paths** so Metro can find all dependencies

This should resolve the "Unable to resolve module react" error you were experiencing.

