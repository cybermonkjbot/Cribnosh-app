const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

// Get project root (mobile app directory)
const projectRoot = __dirname;

// Get workspace root (monorepo root)
const workspaceRoot = path.resolve(projectRoot, '../..');

// Get default config
const config = getDefaultConfig(projectRoot);

// Mobile app's node_modules path
const mobileNodeModules = path.resolve(projectRoot, 'node_modules');

// React-related packages that must resolve from mobile app's node_modules
const reactPackages = [
  'react',
  'react-dom',
  'react-native',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'expo',
  'expo-router',
  'expo-keep-awake',
];

// Add support for @ alias
config.resolver = config.resolver || {};
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  "@": path.resolve(projectRoot),
};

// Force React and react-dom to resolve from mobile app's node_modules only
// This is critical to prevent multiple React instances, even when other packages
// like expo-keep-awake or react-native are in root node_modules
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  // Always force React and react-dom from mobile app's node_modules (they exist there)
  'react': path.join(mobileNodeModules, 'react'),
  'react-dom': path.join(mobileNodeModules, 'react-dom'),
  'react/jsx-runtime': path.join(mobileNodeModules, 'react/jsx-runtime'),
  'react/jsx-dev-runtime': path.join(mobileNodeModules, 'react/jsx-dev-runtime'),
  // Only add other packages if they exist in mobile app's node_modules
  ...reactPackages.slice(5).reduce((acc, pkg) => {
    const pkgPath = path.join(mobileNodeModules, pkg);
    if (fs.existsSync(pkgPath)) {
      acc[pkg] = pkgPath;
    }
    return acc;
  }, {}),
};

// Block resolution from parent node_modules for React and react-dom
// This ensures only the mobile app's React instance is used (19.1.0)
// Note: We don't block react-native from root since it may not exist in mobile app's node_modules
const workspaceNodeModules = path.join(workspaceRoot, 'node_modules').replace(/\\/g, '/');
config.resolver.blockList = [
  ...(config.resolver.blockList || []),
  // Block React and react-dom from workspace root node_modules (prevents version mismatch)
  new RegExp(`${workspaceNodeModules.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/react/.*`),
  new RegExp(`${workspaceNodeModules.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/react-dom/.*`),
];

// Ensure node_modules resolution can find packages in both locations
// but prioritize mobile app's node_modules (for React packages)
const workspaceNodeModulesPath = path.join(workspaceRoot, 'node_modules');
config.resolver.nodeModulesPaths = [
  mobileNodeModules,
  workspaceNodeModulesPath,
];

// Watch folders - only watch the mobile app and workspace root
config.watchFolders = [projectRoot, workspaceRoot];

// Ensure Metro only processes files within the mobile app directory
config.projectRoot = projectRoot;

module.exports = config;
