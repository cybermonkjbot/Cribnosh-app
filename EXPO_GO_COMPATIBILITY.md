# Expo Go Compatibility Guide

## ✅ Changes Applied

### 1. Disabled New Architecture

- **File:** `app.json`
- **Change:** Set `newArchEnabled: false`
- **Why:** New Architecture requires native builds, not supported in Expo Go

### 2. Disabled Reanimated Babel Plugin

- **File:** `babel.config.js`
- **Change:** Commented out `react-native-reanimated/plugin`
- **Why:** Plugin requires native build to work properly

### 3. Created Reanimated Wrapper

- **File:** `utils/reanimatedWrapper.ts`
- **Purpose:** Provides fallbacks when `react-native-reanimated` is not available
- **Features:**
  - Detects if reanimated is available
  - Provides fallback implementations for all hooks
  - No-op functions for Expo Go compatibility

### 4. Updated Critical Files

- ✅ `components/ui/MainScreen.tsx` - Updated to use wrapper
- ✅ `components/ui/LiveContent.tsx` - Updated to use wrapper
- ✅ `components/ui/BottomSearchDrawer.tsx` - Updated to use wrapper

## ⚠️ Remaining Files to Update

The following files still import directly from `react-native-reanimated` and need to be updated:

1. `app/(tabs)/orders/index.tsx`
2. `app/custom-order-management.tsx`
3. `app/(tabs)/profile.tsx`
4. `components/ui/ScrollBreakpointTester.tsx`
5. `components/ui/PremiumTabs.tsx`
6. `components/ui/OrderCard.tsx`
7. `components/ui/GradientBackground.tsx`
8. `components/ui/TiltCard.tsx`
9. `components/ui/OnTheStoveBottomSheetSkeleton.tsx`
10. `components/ui/NoshMagicPortal.tsx`
11. `components/ui/NoshHeavenPlayer.tsx`
12. `components/ui/MultiStepLoader.tsx`
13. `components/ui/MealsLoggedCard.tsx`
14. `components/ui/MealVideoCardSkeleton.tsx`
15. `components/ui/MealVideoCard.tsx`
16. `components/ui/LiveChatDrawer.tsx`
17. `components/ui/GeneratingSuggestionsLoader.tsx`
18. `components/ui/GachaMealSpinner.tsx`
19. `components/ui/CuisineScoreCard.tsx`
20. `components/ui/CalorieCompareCard.tsx`
21. `components/ui/AnimatedMoodButton.tsx`
22. `components/ui/AIChatDrawer.tsx`
23. `components/SwipeButton.tsx`
24. `components/ParallaxScrollView.tsx`
25. `components/HelloWave.tsx`

## 🔧 How to Update Remaining Files

### Method 1: Manual Update (Recommended)

For each file, replace:

```typescript
import Animated, { ... } from "react-native-reanimated";
```

With:

```typescript
import Animated, { ... } from "@/utils/reanimatedWrapper";
```

### Method 2: Find & Replace (PowerShell)

Run this command from the project root:

```powershell
# Find all files
Get-ChildItem -Recurse -Include *.tsx,*.ts -Exclude node_modules |
  ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match "from ['\"]react-native-reanimated['\"]") {
      $newContent = $content -replace 'from "react-native-reanimated"', 'from "@/utils/reanimatedWrapper"'
      $newContent = $newContent -replace "from 'react-native-reanimated'", "from '@/utils/reanimatedWrapper'"
      Set-Content -Path $_.FullName -Value $newContent -NoNewline
      Write-Host "Updated: $($_.FullName)"
    }
  }
```

### Method 3: VS Code Find & Replace

1. Open Find & Replace (Ctrl+Shift+H)
2. Find: `from "react-native-reanimated"`
3. Replace: `from "@/utils/reanimatedWrapper"`
4. Files to include: `**/*.{ts,tsx}`
5. Files to exclude: `node_modules/**`
6. Replace All

## ✅ Testing

After updating all files:

1. Clear Metro cache:

   ```bash
   bun start --clear
   ```

2. Test in Expo Go:
   - Open Expo Go app
   - Scan QR code from `expo start`
   - Verify app loads without errors
   - Test animations (may be disabled/simplified)

## 📝 Notes

### What Works in Expo Go

- ✅ Basic app functionality
- ✅ Navigation
- ✅ API calls
- ✅ UI components (without reanimated)
- ✅ Most Expo modules

### What Doesn't Work in Expo Go

- ❌ Smooth animations (fallback to basic animations)
- ❌ Reanimated worklets
- ❌ Custom native modules

### Performance Impact

- Animations will be simpler/less smooth
- Some advanced animations may not work
- Basic animations will still function

## 🚀 Next Steps

1. Update all remaining files (25 files)
2. Test in Expo Go
3. Verify no errors
4. If animations are critical, consider building a development build instead

## 📚 Resources

- [Expo Go Limitations](https://docs.expo.dev/guides/development-builds/)
- [Development Builds](https://docs.expo.dev/development/introduction/)
- [Reanimated Without Native Build](https://docs.swmansion.com/react-native-reanimated/)


