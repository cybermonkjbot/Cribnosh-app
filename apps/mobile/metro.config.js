const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

// Get project root (mobile app directory)
const projectRoot = __dirname;

// Get workspace root (monorepo root)
const workspaceRoot = path.resolve(projectRoot, '../..');

// Get default config
const config = getDefaultConfig(projectRoot);

// Detect EAS build environment - in EAS builds, dependencies are installed at the build root
// We need to find the actual build root by looking for node_modules/expo (which should exist in EAS builds)
// Start from project root and walk up to find where node_modules/expo exists
let buildRootNodeModules = null;
let searchPath = projectRoot;
const maxDepth = 10; // Prevent infinite loops
let depth = 0;

// Walk up the directory tree to find the build root (where node_modules/expo exists)
while (searchPath !== '/' && searchPath.length > 0 && depth < maxDepth) {
  const testNodeModules = path.join(searchPath, 'node_modules');
  const testExpoPath = path.join(testNodeModules, 'expo');
  
  // If we find node_modules/expo, this is likely the build root
  if (fs.existsSync(testExpoPath)) {
    buildRootNodeModules = testNodeModules;
    break;
  }
  
  const parentPath = path.dirname(searchPath);
  // Stop if we've reached the filesystem root or if parent is same as current (shouldn't happen)
  if (parentPath === searchPath) {
    break;
  }
  searchPath = parentPath;
  depth++;
}

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
// Priority: app's node_modules first, then workspace root, then build root (for EAS builds)
const nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Add build root node_modules for EAS builds (where dependencies are actually installed)
// Only add if it's different from workspace root to avoid duplicates
if (buildRootNodeModules && fs.existsSync(buildRootNodeModules)) {
  const normalizedBuildRoot = path.resolve(buildRootNodeModules);
  const normalizedWorkspaceRoot = path.resolve(workspaceRoot, 'node_modules');
  // Only add if it's different from workspace root (in EAS builds, build root is usually different)
  if (normalizedBuildRoot !== normalizedWorkspaceRoot) {
    nodeModulesPaths.push(buildRootNodeModules);
  }
}

config.resolver.nodeModulesPaths = nodeModulesPaths;

// 3. Force React to resolve from app's node_modules only (in local dev)
// In EAS builds, React will resolve from build root which is fine
// Block React and react-dom from workspace root to prevent conflicts in local dev
// Note: We don't block from build root since that's where dependencies are in EAS builds
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules');
const isEASBuild = !!buildRootNodeModules && buildRootNodeModules !== workspaceNodeModules;

// Only block React from workspace root in local dev (not in EAS builds)
if (!isEASBuild) {
  const blockListPatterns = [
    new RegExp(`${workspaceNodeModules.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/react/.*`),
    new RegExp(`${workspaceNodeModules.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/react-dom/.*`),
  ];

  config.resolver.blockList = [
    ...(config.resolver.blockList || []),
    ...blockListPatterns,
  ];
}

// Add support for @ alias
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  '@': path.resolve(projectRoot),
  '@/convex': path.join(workspaceRoot, 'packages', 'convex', 'convex'),
};

// Enable package.json exports field support (required for react/jsx-runtime)
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
