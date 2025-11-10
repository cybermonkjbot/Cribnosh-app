// Cribnosh Brand Colors
const primaryBrand = '#9C1314'; // rgb(156, 19, 20) - Main brand color (Cribnosh orange-red)
const primaryBrandDark = '#7A0F10'; // Darker shade for hover states
const primaryBrandLight = '#B81A1C'; // Lighter shade for highlights

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
  },
};