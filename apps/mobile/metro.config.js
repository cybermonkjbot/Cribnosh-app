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
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Add support for @ alias (if you're using it)
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  '@': path.resolve(projectRoot),
  '@/convex': path.join(workspaceRoot, 'packages', 'convex', 'convex'),
};

module.exports = config;
