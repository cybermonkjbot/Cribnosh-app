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

// Workspace root node_modules path
const workspaceNodeModulesPath = path.join(workspaceRoot, 'node_modules');

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
  "@/convex": path.join(workspaceRoot, 'packages', 'convex', 'convex'),
};
// Enable package.json exports field support (required for react/jsx-runtime subpath exports)
config.resolver.unstable_enablePackageExports = true;

// Check if we're in a monorepo by seeing if workspace root node_modules exists
const isMonorepo = fs.existsSync(workspaceNodeModulesPath) && fs.existsSync(path.join(workspaceRoot, 'package.json'));

// ALWAYS ensure React resolves from mobile app's node_modules (critical for EAS builds)
// This ensures React is found even if monorepo detection fails or in EAS build environment
// Use path.resolve to ensure absolute paths work in EAS build environment
const reactPath = path.resolve(mobileNodeModules, 'react');
const reactDomPath = path.resolve(mobileNodeModules, 'react-dom');

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  // Always resolve React from mobile app's node_modules (even if fs check fails in EAS)
  // Metro will handle the resolution, and this ensures the path is correct
  'react': reactPath,
  // Explicitly resolve react/jsx-runtime and react/jsx-dev-runtime subpath exports
  // These point to the React package itself, and Metro will resolve the subpath exports
  // from React's package.json exports field
  'react/jsx-runtime': reactPath,
  'react/jsx-dev-runtime': reactPath,
  'react-dom': reactDomPath,
  // Add other React-related packages if they exist in mobile app's node_modules
  ...reactPackages.slice(5).reduce((acc, pkg) => {
    // Skip react/jsx-runtime and react/jsx-dev-runtime as they're handled above
    if (pkg === 'react/jsx-runtime' || pkg === 'react/jsx-dev-runtime') {
      return acc;
    }
    const pkgPath = path.join(mobileNodeModules, pkg);
    if (fs.existsSync(pkgPath)) {
      acc[pkg] = pkgPath;
    }
    return acc;
  }, {}),
  // Resolve @stripe packages from workspace root if not in mobile app's node_modules
  ...(fs.existsSync(path.join(mobileNodeModules, '@stripe', 'stripe-react-native'))
    ? { '@stripe/stripe-react-native': path.join(mobileNodeModules, '@stripe', 'stripe-react-native') }
    : isMonorepo && fs.existsSync(path.join(workspaceNodeModulesPath, '@stripe', 'stripe-react-native'))
    ? { '@stripe/stripe-react-native': path.join(workspaceNodeModulesPath, '@stripe', 'stripe-react-native') }
    : {}),
};

// Block resolution from parent node_modules for React and react-dom
// This ensures only the mobile app's React instance is used (19.1.0)
// Only apply blockList in monorepo setup (local dev)
if (isMonorepo) {
  const workspaceNodeModules = path.join(workspaceRoot, 'node_modules').replace(/\\/g, '/');
  if (fs.existsSync(workspaceNodeModules)) {
    config.resolver.blockList = [
      ...(config.resolver.blockList || []),
      // Block React and react-dom from workspace root node_modules (prevents version mismatch)
      new RegExp(`${workspaceNodeModules.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/react/.*`),
      new RegExp(`${workspaceNodeModules.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/react-dom/.*`),
    ];
  }
}

// Ensure node_modules resolution can find packages in both locations
// ALWAYS prioritize mobile app's node_modules first (critical for EAS builds)
// This ensures React and other dependencies are found from the mobile app's node_modules
config.resolver.nodeModulesPaths = [
  mobileNodeModules,
  ...(isMonorepo && fs.existsSync(workspaceNodeModulesPath) ? [workspaceNodeModulesPath] : []),
];

// Add watchFolders to include the packages directory for monorepo support
// This allows Metro to watch and resolve files from the convex package
config.watchFolders = [
  projectRoot,
  workspaceRoot,
  path.join(workspaceRoot, 'packages', 'convex'),
];

// Ensure Metro only processes files within the mobile app directory
config.projectRoot = projectRoot;

// Ensure React can be resolved from multiple locations (critical for EAS builds)
// Metro's default resolver will handle subpath exports (react/jsx-runtime) correctly
// as long as React is found in one of the node_modules paths

module.exports = config;
