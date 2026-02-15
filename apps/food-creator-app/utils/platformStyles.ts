import { Platform, ViewStyle } from 'react-native';

/**
 * Shadow configuration for consistent shadow appearance across iOS and Android
 */
export interface ShadowConfig {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

/**
 * Creates platform-appropriate shadow styles
 * iOS uses shadowColor/shadowOffset/shadowOpacity/shadowRadius
 * Android uses elevation (which automatically creates a shadow)
 */
export function createShadowStyle(config: ShadowConfig): ViewStyle {
  if (Platform.OS === 'android') {
    return {
      elevation: config.elevation ?? 4,
    };
  }

  return {
    shadowColor: config.shadowColor ?? '#000',
    shadowOffset: config.shadowOffset ?? { width: 0, height: 2 },
    shadowOpacity: config.shadowOpacity ?? 0.1,
    shadowRadius: config.shadowRadius ?? 4,
  };
}

/**
 * Common shadow presets for consistent styling
 */
export const shadowPresets = {
  none: (): ViewStyle => createShadowStyle({ elevation: 0 }),
  
  sm: (): ViewStyle => createShadowStyle({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  }),
  
  md: (): ViewStyle => createShadowStyle({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  }),
  
  lg: (): ViewStyle => createShadowStyle({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  }),
  
  xl: (): ViewStyle => createShadowStyle({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  }),
  
  xxl: (): ViewStyle => createShadowStyle({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  }),
  
  // Special presets for glow effects
  glow: (color: string = '#FF3B30', intensity: number = 0.5): ViewStyle => createShadowStyle({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 20,
    elevation: 15,
  }),
  
  halo: (color: string = '#FFFFFF', radius: number = 120): ViewStyle => createShadowStyle({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: radius,
    elevation: Math.min(radius / 10, 20),
  }),
};

