// Cribnosh Brand Colors - Matching web app brand color
const primaryBrand = '#ff3b30'; // rgb(255, 59, 48) - Main brand color (Cribnosh red)
const primaryBrandDark = '#ed1d12'; // Darker shade for hover states (matching web app primary-600)
const primaryBrandLight = '#ff5e54'; // Lighter shade for highlights (matching web app)

const tintColorLight = primaryBrand;
const tintColorDark = primaryBrand;

export const Colors = {
  light: {
    text: '#1F2937', // Dark gray for better readability
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#6B7280',
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorLight,
    // Cribnosh specific colors
    primary: primaryBrand,
    primaryDark: primaryBrandDark,
    primaryLight: primaryBrandLight,
    secondary: '#F3F4F6', // Light gray for backgrounds
    accent: '#10B981', // Green for success states
    warning: '#F59E0B', // Amber for warnings
    error: '#EF4444', // Red for errors
    surface: '#F9FAFB', // Very light gray for cards/surfaces
    border: '#E5E7EB', // Light gray for borders
    success: '#10B981', // Green for success states
    // Glass morphism colors
    glassBackground: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.3)',
    glassShadow: 'rgba(0, 0, 0, 0.1)',
    // Shimmer colors
    shimmer: 'rgba(255, 59, 48, 0.1)', // Cribnosh red tint
  },
  dark: {
    text: '#F9FAFB',
    background: '#111827',
    tint: tintColorDark,
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorDark,
    // Cribnosh specific colors
    primary: primaryBrand,
    primaryDark: primaryBrandDark,
    primaryLight: primaryBrandLight,
    secondary: '#374151', // Dark gray for backgrounds
    accent: '#10B981', // Green for success states
    warning: '#F59E0B', // Amber for warnings
    error: '#EF4444', // Red for errors
    surface: '#1F2937', // Dark gray for cards/surfaces
    // Glass morphism colors
    glassBackground: 'rgba(31, 41, 55, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassShadow: 'rgba(0, 0, 0, 0.3)',
    // Shimmer colors
    shimmer: 'rgba(255, 59, 48, 0.15)', // Cribnosh red tint
  },
};