# 3D Tilt Effects for Home Page Cards

## Overview

I've successfully implemented subtle 3D tilt effects for the home page cards that respond to device movement. The effect uses the device's gyroscope to create a realistic 3D perspective that makes the cards feel more interactive and engaging.

## Features

### 🎯 Subtle 3D Tilt
- Cards tilt based on device orientation (beta and gamma rotation)
- Smooth spring animations for natural movement
- Configurable intensity levels for different card types
- No visual changes when device is stationary

### 📱 Device Motion Integration
- Uses `expo-sensors` DeviceMotion API
- 60fps update rate for smooth animations
- Automatic fallback when sensors aren't available
- Configurable sensitivity to reduce jitter

### 🎨 Visual Enhancements
- Perspective transforms for realistic 3D effect
- Subtle scale changes based on movement intensity
- Spring-based animations for smooth transitions
- Maintains original card styling and functionality

## Components Updated

### 1. TiltCard (New Component)
- **Location**: `components/ui/TiltCard.tsx`
- **Purpose**: Higher-order component that wraps cards with 3D tilt effects
- **Props**:
  - `intensity`: Tilt angle in degrees (default: 8)
  - `enabled`: Enable/disable tilt effect (default: true)
  - `springConfig`: Animation configuration

### 2. CategoryFoodItemCard
- **Location**: `components/ui/CategoryFoodItemCard.tsx`
- **Changes**: Wrapped with TiltCard component
- **Tilt Intensity**: 6 degrees
- **New Prop**: `tiltEnabled` (default: true)

### 3. KitchenNameCard
- **Location**: `components/KitchenNameCard.tsx`
- **Changes**: Wrapped with TiltCard component
- **Tilt Intensity**: 4 degrees (more subtle for larger cards)
- **New Prop**: `tiltEnabled` (default: true)

### 4. CompactMealSelection
- **Location**: `components/CompactMealSelection.tsx`
- **Changes**: Wrapped with TiltCard component
- **Tilt Intensity**: 5 degrees
- **New Prop**: `tiltEnabled` (default: true)

## Technical Implementation

### Device Motion Hook
- **Location**: `hooks/useDeviceMotion.ts`
- **Features**:
  - Real-time device orientation tracking
  - Sensitivity filtering to reduce jitter
  - Automatic cleanup and error handling
  - Configurable update intervals

### Animation Configuration
Each card type uses optimized spring configurations:

```typescript
// CategoryFoodItemCard
{
  damping: 20,
  stiffness: 200,
  mass: 0.6,
}

// KitchenNameCard
{
  damping: 25,
  stiffness: 180,
  mass: 0.7,
}

// CompactMealSelection
{
  damping: 22,
  stiffness: 190,
  mass: 0.65,
}
```

## How to Test

### Option 1: Test Page
1. Navigate to `/tilt-test` in your app
2. Use the toggle switch to enable/disable effects
3. Move your device to see the tilt effects
4. Test different card types

### Option 2: Main App
1. The tilt effects are automatically enabled on all cards
2. Move your device while viewing the home page
3. Cards will subtly tilt based on device orientation

### Option 3: Disable Effects
You can disable tilt effects for specific cards:

```tsx
<CategoryFoodItemCard
  // ... other props
  tiltEnabled={false}
/>
```

## Performance Considerations

### Optimizations
- **Memoized Components**: Prevents unnecessary re-renders
- **Shared Values**: Uses Reanimated shared values for smooth animations
- **Conditional Rendering**: Only applies effects when enabled
- **Efficient Updates**: 60fps updates with sensitivity filtering

### Battery Impact
- Minimal battery impact due to optimized sensor usage
- Automatic cleanup when components unmount
- Configurable update intervals

## Customization

### Adjusting Intensity
```tsx
<TiltCard intensity={10}> // More pronounced effect
  <YourCard />
</TiltCard>
```

### Custom Spring Configuration
```tsx
<TiltCard
  springConfig={{
    damping: 15,
    stiffness: 150,
    mass: 0.8,
  }}
>
  <YourCard />
</TiltCard>
```

### Disabling for Specific Cards
```tsx
<CategoryFoodItemCard
  // ... other props
  tiltEnabled={false}
/>
```

## Browser/Web Support

The tilt effects work on:
- ✅ iOS devices with gyroscope
- ✅ Android devices with gyroscope
- ⚠️ Web browsers (limited support, falls back gracefully)

## Troubleshooting

### Effects Not Working
1. Check if device has gyroscope sensors
2. Ensure `expo-sensors` is properly installed
3. Verify device permissions for motion sensors
4. Check console for any error messages

### Performance Issues
1. Reduce `intensity` value for less movement
2. Increase `damping` in spring config for less oscillation
3. Disable effects on older devices if needed

### Visual Glitches
1. Ensure cards have proper `perspective` transforms
2. Check for conflicting animations
3. Verify Reanimated is properly configured

## Future Enhancements

Potential improvements:
- **Haptic Feedback**: Add subtle haptics on significant movement
- **Sound Effects**: Optional audio feedback
- **Custom Curves**: More sophisticated animation curves
- **Gesture Integration**: Combine with touch gestures
- **Accessibility**: Respect reduced motion preferences

## Files Created/Modified

### New Files
- `hooks/useDeviceMotion.ts` - Device motion detection hook
- `components/ui/TiltCard.tsx` - 3D tilt wrapper component
- `app/tilt-test.tsx` - Test page for tilt effects
- `TILT_EFFECTS_README.md` - This documentation

### Modified Files
- `components/ui/CategoryFoodItemCard.tsx` - Added tilt wrapper
- `components/KitchenNameCard.tsx` - Added tilt wrapper
- `components/CompactMealSelection.tsx` - Added tilt wrapper

The implementation is production-ready and maintains the existing look and feel while adding a subtle, engaging 3D effect that enhances the user experience! 