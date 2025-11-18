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

// Define app's node_modules path early for use in React resolution
const appNodeModules = path.resolve(projectRoot, 'node_modules');

// 3. Force React to resolve from app's node_modules only (in local dev)
// In EAS builds, React will resolve from build root which is fine
// Block React and react-dom from workspace root to prevent conflicts in local dev
// Note: We don't block from build root since that's where dependencies are in EAS builds
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules');
const isEASBuild = !!buildRootNodeModules && buildRootNodeModules !== workspaceNodeModules;

// Only block React from workspace root in local dev (not in EAS builds)
// But only block if React exists in app's node_modules to avoid blocking when React isn't available
if (!isEASBuild) {
  const appReactPath = path.join(appNodeModules, 'react');
  const appReactDomPath = path.join(appNodeModules, 'react-dom');
  
  // Only block workspace React if app's React exists
  // This prevents blocking when React isn't available, which would cause null resolution
  if (fs.existsSync(appReactPath) || fs.existsSync(appReactDomPath)) {
    const blockListPatterns = [
      new RegExp(`${workspaceNodeModules.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/react/.*`),
      new RegExp(`${workspaceNodeModules.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/react-dom/.*`),
    ];

    config.resolver.blockList = [
      ...(config.resolver.blockList || []),
      ...blockListPatterns,
    ];
  }
}

// Add support for @ alias and explicitly resolve React
let reactPath = path.join(appNodeModules, 'react');
let reactDomPath = path.join(appNodeModules, 'react-dom');

// For EAS builds, React might be in build root instead of app's node_modules
if (!fs.existsSync(reactPath) && buildRootNodeModules) {
  const buildReactPath = path.join(buildRootNodeModules, 'react');
  if (fs.existsSync(buildReactPath)) {
    reactPath = buildReactPath;
  }
}
if (!fs.existsSync(reactDomPath) && buildRootNodeModules) {
  const buildReactDomPath = path.join(buildRootNodeModules, 'react-dom');
  if (fs.existsSync(buildReactDomPath)) {
    reactDomPath = buildReactDomPath;
  }
}

// Use extraNodeModules to force React resolution (more reliable than alias)
// This ensures ALL React imports resolve to the same instance
// Critical for preventing "Invalid hook call" errors from multiple React instances
const extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
};

// Explicitly resolve React from app's node_modules (local dev) or build root (EAS)
// Use directory paths (Metro expects directories for extraNodeModules)
if (fs.existsSync(reactPath)) {
  extraNodeModules['react'] = reactPath;
  // Also resolve React subpath exports to the same instance
  extraNodeModules['react/jsx-runtime'] = reactPath;
  extraNodeModules['react/jsx-dev-runtime'] = reactPath;
}
if (fs.existsSync(reactDomPath)) {
  extraNodeModules['react-dom'] = reactDomPath;
}

config.resolver.extraNodeModules = extraNodeModules;

// Add a custom resolver to force React resolution
// Works in both local dev and EAS builds by using the resolved path from extraNodeModules
// This ensures a single React instance is used everywhere
if (extraNodeModules['react']) {
  const originalResolveRequest = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Force React to use our explicitly resolved path BEFORE any other resolution
    // Works for both local dev (app's node_modules) and EAS builds (build root)
    if (moduleName === 'react' && extraNodeModules['react']) {
      const reactIndexPath = path.join(extraNodeModules['react'], 'index.js');
      if (fs.existsSync(reactIndexPath)) {
        return { filePath: reactIndexPath, type: 'sourceFile' };
      }
      // Fallback: let Metro resolve it normally but from our path
      return originalResolveRequest 
        ? originalResolveRequest({ ...context, originModulePath: extraNodeModules['react'] }, './index', platform)
        : context.resolveRequest({ ...context, originModulePath: extraNodeModules['react'] }, './index', platform);
    }
    if (moduleName === 'react-dom' && extraNodeModules['react-dom']) {
      const reactDomIndexPath = path.join(extraNodeModules['react-dom'], 'index.js');
      if (fs.existsSync(reactDomIndexPath)) {
        return { filePath: reactDomIndexPath, type: 'sourceFile' };
      }
      return originalResolveRequest 
        ? originalResolveRequest({ ...context, originModulePath: extraNodeModules['react-dom'] }, './index', platform)
        : context.resolveRequest({ ...context, originModulePath: extraNodeModules['react-dom'] }, './index', platform);
    }
    // Use default resolver for everything else
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

// Add support for @ alias (separate from React resolution)
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  '@': path.resolve(projectRoot),
  '@/convex': path.join(workspaceRoot, 'packages', 'convex', 'convex'),
};

// Enable package.json exports field support (required for react/jsx-runtime)
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
