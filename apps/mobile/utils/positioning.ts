import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Gets the top position accounting for status bar and safe area
 * Use this for fixed positioned elements that should appear below the status bar
 */
export function useTopPosition(offset: number = 0): number {
  const insets = useSafeAreaInsets();
  
  if (Platform.OS === 'android') {
    // On Android, StatusBar.currentHeight provides the status bar height
    // Add safe area top inset for notched devices
    const statusBarHeight = StatusBar.currentHeight || 0;
    const safeTop = insets?.top ?? 0;
    return Math.max(statusBarHeight, safeTop) + offset;
  }
  
  // iOS uses safe area insets directly
  const safeTop = insets?.top ?? 44; // Default to 44 (status bar height) if not available
  return safeTop + offset;
}

/**
 * Gets the bottom position accounting for safe area and system UI
 * Use this for fixed positioned elements at the bottom
 */
export function useBottomPosition(offset: number = 0): number {
  const insets = useSafeAreaInsets();
  const safeBottom = insets?.bottom ?? 0;
  return safeBottom + offset;
}

/**
 * Calculates the position for toast notifications
 * Accounts for status bar and safe area on both platforms
 */
export function useToastPosition(): number {
  const insets = useSafeAreaInsets();
  
  if (Platform.OS === 'android') {
    const statusBarHeight = StatusBar.currentHeight || 0;
    const safeTop = insets?.top ?? 0;
    // Account for status bar and add small padding
    return Math.max(statusBarHeight, safeTop) + 8;
  }
  
  // iOS: safe area top + small padding
  const safeTop = insets?.top ?? 44; // Default to 44 if not available
  return safeTop + 8;
}

/**
 * Hook that returns safe positioning values
 */
export function useSafePositioning() {
  const insets = useSafeAreaInsets();
  const topPosition = useTopPosition();
  const bottomPosition = useBottomPosition();
  const toastPosition = useToastPosition();
  
  return {
    insets: insets || { top: 0, bottom: 0, left: 0, right: 0 },
    top: topPosition,
    bottom: bottomPosition,
    toast: toastPosition,
    statusBarHeight: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 44,
  };
}

