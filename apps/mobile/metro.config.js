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

// Detect EAS build environment - in EAS builds, dependencies are installed at the build root
// We need to find the actual build root by looking for node_modules/expo (which should exist in EAS builds)
// Also check for common EAS build paths like /Users/expo/workingdir/build
let buildRootNodeModules = null;

// First, check if we're in an EAS build by looking at the project root path
// EAS builds typically have paths like /Users/expo/workingdir/build/apps/mobile
const isEASBuild = projectRoot.includes('/Users/expo/workingdir/build') || 
                   projectRoot.includes('workingdir/build');

if (isEASBuild) {
  // In EAS builds, the build root is typically 2-3 levels up from the app directory
  // e.g., /Users/expo/workingdir/build/apps/mobile -> /Users/expo/workingdir/build
  let searchPath = projectRoot;
  const maxDepth = 5;
  let depth = 0;
  
  while (searchPath !== '/' && searchPath.length > 0 && depth < maxDepth) {
    const testNodeModules = path.join(searchPath, 'node_modules');
    const testExpoPath = path.join(testNodeModules, 'expo');
    const testReactPath = path.join(testNodeModules, 'react');
    
    // If we find both node_modules/expo and node_modules/react, this is the build root
    if (fs.existsSync(testExpoPath) && fs.existsSync(testReactPath)) {
      buildRootNodeModules = testNodeModules;
      break;
    }
    
    const parentPath = path.dirname(searchPath);
    if (parentPath === searchPath) {
      break;
    }
    searchPath = parentPath;
    depth++;
  }
} else {
  // For local development, try to find build root by walking up from project root
  let searchPath = projectRoot;
  const maxDepth = 15;
  let depth = 0;
  
  // Also check current working directory as a starting point
  const cwd = process.cwd();
  if (cwd.includes('workingdir') || cwd.includes('/Users/expo/')) {
    searchPath = cwd;
    depth = 0;
  }
  
  while (searchPath !== '/' && searchPath.length > 0 && depth < maxDepth) {
    const testNodeModules = path.join(searchPath, 'node_modules');
    const testExpoPath = path.join(testNodeModules, 'expo');
    
    if (fs.existsSync(testExpoPath)) {
      buildRootNodeModules = testNodeModules;
      break;
    }
    
    const parentPath = path.dirname(searchPath);
    if (parentPath === searchPath) {
      break;
    }
    searchPath = parentPath;
    depth++;
  }
}

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

// Find React in available node_modules locations
// Check mobile app's node_modules first, then build root (for EAS builds), then workspace root
let reactPath = null;
let reactDomPath = null;

// Try mobile app's node_modules first
const mobileReactPath = path.resolve(mobileNodeModules, 'react');
const mobileReactDomPath = path.resolve(mobileNodeModules, 'react-dom');

if (fs.existsSync(mobileReactPath)) {
  reactPath = mobileReactPath;
}
if (fs.existsSync(mobileReactDomPath)) {
  reactDomPath = mobileReactDomPath;
}

// If not found, try build root (EAS builds) - this is CRITICAL for EAS builds
if (!reactPath && buildRootNodeModules) {
  const buildRootReactPath = path.join(buildRootNodeModules, 'react');
  if (fs.existsSync(buildRootReactPath)) {
    reactPath = buildRootReactPath;
  }
}
if (!reactDomPath && buildRootNodeModules) {
  const buildRootReactDomPath = path.join(buildRootNodeModules, 'react-dom');
  if (fs.existsSync(buildRootReactDomPath)) {
    reactDomPath = buildRootReactDomPath;
  }
}

// In EAS builds, if we still haven't found React, try the fallback path construction
if (!reactPath && isEASBuild && projectRoot.includes('/apps/')) {
  const potentialBuildRoot = projectRoot.split('/apps/')[0];
  const potentialReactPath = path.join(potentialBuildRoot, 'node_modules', 'react');
  if (fs.existsSync(potentialReactPath)) {
    reactPath = potentialReactPath;
  }
}
if (!reactDomPath && isEASBuild && projectRoot.includes('/apps/')) {
  const potentialBuildRoot = projectRoot.split('/apps/')[0];
  const potentialReactDomPath = path.join(potentialBuildRoot, 'node_modules', 'react-dom');
  if (fs.existsSync(potentialReactDomPath)) {
    reactDomPath = potentialReactDomPath;
  }
}

// If still not found, try workspace root (local monorepo)
if (!reactPath && isMonorepo && fs.existsSync(workspaceNodeModulesPath)) {
  const workspaceReactPath = path.join(workspaceNodeModulesPath, 'react');
  if (fs.existsSync(workspaceReactPath)) {
    reactPath = workspaceReactPath;
  }
}
if (!reactDomPath && isMonorepo && fs.existsSync(workspaceNodeModulesPath)) {
  const workspaceReactDomPath = path.join(workspaceNodeModulesPath, 'react-dom');
  if (fs.existsSync(workspaceReactDomPath)) {
    reactDomPath = workspaceReactDomPath;
  }
}

// Only add React to extraNodeModules if we actually found it
// Otherwise, rely on nodeModulesPaths for automatic resolution
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  ...(reactPath ? {
    'react': reactPath,
    // Explicitly resolve react/jsx-runtime and react/jsx-dev-runtime subpath exports
    // These point to the React package itself, and Metro will resolve the subpath exports
    // from React's package.json exports field
    'react/jsx-runtime': reactPath,
    'react/jsx-dev-runtime': reactPath,
  } : {}),
  ...(reactDomPath ? {
    'react-dom': reactDomPath,
  } : {}),
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
// In EAS builds, also include the build root's node_modules where dependencies are actually installed
const nodeModulesPaths = [mobileNodeModules];

// Add workspace root node_modules (for local monorepo)
if (isMonorepo && fs.existsSync(workspaceNodeModulesPath)) {
  nodeModulesPaths.push(workspaceNodeModulesPath);
}

// Add build root node_modules for EAS builds (where dependencies are actually installed)
// This is CRITICAL - in EAS builds, dependencies are at the build root, not in app directory
// We MUST include this for React and react/jsx-runtime to be found
if (buildRootNodeModules && fs.existsSync(buildRootNodeModules)) {
  const normalizedBuildRoot = path.resolve(buildRootNodeModules);
  const normalizedWorkspaceRoot = isMonorepo ? path.resolve(workspaceNodeModulesPath) : null;
  // Only add if it's different from workspace root to avoid duplicates
  // In EAS builds, build root is usually different from workspace root
  if (!normalizedWorkspaceRoot || normalizedBuildRoot !== normalizedWorkspaceRoot) {
    // Insert build root BEFORE workspace root so it's checked first (after mobile app's node_modules)
    // This ensures React from build root is found before any workspace root version
    if (isMonorepo && normalizedWorkspaceRoot) {
      const workspaceIndex = nodeModulesPaths.findIndex(p => path.resolve(p) === normalizedWorkspaceRoot);
      if (workspaceIndex >= 0) {
        nodeModulesPaths.splice(workspaceIndex, 0, buildRootNodeModules);
      } else {
        nodeModulesPaths.push(buildRootNodeModules);
      }
    } else {
      nodeModulesPaths.push(buildRootNodeModules);
    }
  }
} else if (isEASBuild) {
  // Fallback for EAS builds: if detection failed, try direct path construction
  // Based on typical EAS structure: /Users/expo/workingdir/build/apps/mobile
  // Build root should be: /Users/expo/workingdir/build
  if (projectRoot.includes('/apps/')) {
    const potentialBuildRoot = projectRoot.split('/apps/')[0];
    const potentialNodeModules = path.join(potentialBuildRoot, 'node_modules');
    const potentialExpo = path.join(potentialNodeModules, 'expo');
    const potentialReact = path.join(potentialNodeModules, 'react');
    if (fs.existsSync(potentialExpo) && fs.existsSync(potentialReact)) {
      const normalizedPotential = path.resolve(potentialNodeModules);
      if (!nodeModulesPaths.some(p => path.resolve(p) === normalizedPotential)) {
        // Insert after mobile app's node_modules but before workspace root
        nodeModulesPaths.splice(1, 0, potentialNodeModules);
      }
    }
  }
}

config.resolver.nodeModulesPaths = nodeModulesPaths;

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
