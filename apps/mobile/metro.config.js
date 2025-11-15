const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get project root (mobile app directory)
const projectRoot = __dirname;

// Get workspace root (monorepo root)
const workspaceRoot = path.resolve(projectRoot, '../..');

// Get default config
const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
// This is Expo's recommended minimal configuration for monorepos
// Priority: app's node_modules first, then workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force React to resolve from app's node_modules only
// This prevents multiple React instances in monorepo setups
// Note: react-native can resolve from workspace root if not in app's node_modules
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules');

// Block React and react-dom from workspace root to prevent conflicts
// This ensures Metro never resolves React from workspace root node_modules
// We don't block react-native since it may need to resolve from workspace root
// The nodeModulesPaths ordering ensures app's node_modules is checked first
const blockListPatterns = [
  new RegExp(`${workspaceNodeModules.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/react/.*`),
  new RegExp(`${workspaceNodeModules.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/react-dom/.*`),
];

config.resolver.blockList = [
  ...(config.resolver.blockList || []),
  ...blockListPatterns,
];

// Add support for @ alias
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  '@': path.resolve(projectRoot),
  '@/convex': path.join(workspaceRoot, 'packages', 'convex', 'convex'),
};

// Enable package.json exports field support (required for react/jsx-runtime)
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
