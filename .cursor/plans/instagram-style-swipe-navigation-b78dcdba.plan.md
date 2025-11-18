<!-- b78dcdba-6813-45d5-85a4-0466e5169e02 57b87e88-4494-4b50-add8-c87f82e40d86 -->
# Instagram-Style Swipe Navigation Implementation

## Overview

Create a reusable `SwipeablePages` component that enables full-screen page swiping similar to Instagram, with support for nested horizontal ScrollViews that pause the page swipe gesture when active.

## Architecture

### 1. Create Reusable SwipeablePages Component

**File**: `apps/mobile/components/ui/SwipeablePages.tsx`

- Use `react-native-gesture-handler`'s `Gesture.Pan()` for horizontal swipe detection
- Use `react-native-reanimated` for smooth animations and shared values
- Implement gesture state management to pause/resume page swipes when nested horizontal ScrollViews are active
- Support configurable pages array with render functions
- Handle edge cases (first/last page, velocity-based snapping)

### 2. Gesture Coordination Strategy

- Use `simultaneousHandlers` and `waitFor` to coordinate between page swipe and nested horizontal ScrollViews
- Track active horizontal scroll state via refs/callbacks from child components
- Pause page swipe gesture when any horizontal ScrollView is being dragged
- Resume page swipe when horizontal drag ends

### 3. Integration Points

**Modify Tab Layout** (`apps/mobile/app/(tabs)/_layout.tsx`):

- Wrap tab screens with SwipeablePages component
- Include Camera screen as first page (or based on user preference)
- Maintain tab bar visibility and functionality

**Update MainScreen** (`apps/mobile/components/ui/MainScreen.tsx`):

- Wrap horizontal ScrollViews (CuisinesSection, FeaturedKitchensSection, etc.) with gesture-aware components
- Register horizontal scroll state with parent SwipeablePages

**Update OrdersScreen** (`apps/mobile/app/(tabs)/orders/index.tsx`):

- Check for horizontal ScrollViews and wrap if needed
- Integrate with SwipeablePages gesture system

**Update ProfileScreen** (`apps/mobile/app/(tabs)/profile.tsx`):

- Check for horizontal ScrollViews and wrap if needed
- Integrate with SwipeablePages gesture system

### 4. Implementation Details

**SwipeablePages Component Features**:

- Horizontal pan gesture with velocity detection
- Snap to nearest page based on swipe distance and velocity
- Animated page transitions using `useAnimatedStyle`
- Support for 4 pages: [Camera, Home, Orders, Profile]
- Page index synchronization with tab navigation
- Callback for page changes to update tab state

**Nested ScrollView Support**:

- Create `GestureAwareScrollView` wrapper component
- Detect horizontal scroll start/end events
- Communicate scroll state to parent SwipeablePages
- Use `simultaneousHandlers` to allow both gestures when appropriate

**Performance Optimizations**:

- Use `runOnJS` sparingly for state updates
- Memoize page render functions
- Optimize re-renders with `useAnimatedReaction`

## Files to Create/Modify

1. **Create**: `apps/mobile/components/ui/SwipeablePages.tsx` - Main swipeable container
2. **Create**: `apps/mobile/components/ui/GestureAwareScrollView.tsx` - Wrapper for horizontal ScrollViews
3. **Modify**: `apps/mobile/app/(tabs)/_layout.tsx` - Integrate SwipeablePages
4. **Modify**: `apps/mobile/components/ui/MainScreen.tsx` - Wrap horizontal lists
5. **Modify**: `apps/mobile/app/(tabs)/orders/index.tsx` - Check for horizontal lists
6. **Modify**: `apps/mobile/app/(tabs)/profile.tsx` - Check for horizontal lists

## Technical Considerations

- Use `Gesture.Pan().enabled()` to conditionally enable/disable based on horizontal scroll state
- Implement minimum swipe distance threshold (e.g., 50px) before triggering page change
- Use spring animations for natural feel
- Handle edge cases: rapid swipes, simultaneous gestures, screen rotation
- Ensure tab bar remains functional and visible
- Sync page index with Expo Router tab navigation state

### To-dos

- [ ] Create SwipeablePages.tsx component with horizontal pan gesture, page snapping, and animation logic
- [ ] Create GestureAwareScrollView.tsx wrapper for horizontal ScrollViews that communicates scroll state to parent
- [ ] Modify (tabs)/_layout.tsx to wrap screens with SwipeablePages and include Camera screen
- [ ] Update MainScreen.tsx to wrap horizontal ScrollViews with GestureAwareScrollView
- [ ] Check OrdersScreen for horizontal ScrollViews and wrap if needed
- [ ] Check ProfileScreen for horizontal ScrollViews and wrap if needed
- [ ] Test that horizontal list scrolling pauses page swipes and resumes correctly