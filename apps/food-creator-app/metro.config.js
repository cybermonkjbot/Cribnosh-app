const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

// Get project root (food-creator-app directory)
const projectRoot = __dirname;

// Get workspace root (monorepo root)
const workspaceRoot = path.resolve(projectRoot, '../..');

// Get default config
const config = getDefaultConfig(projectRoot);

// Detect EAS build environment
let buildRootNodeModules = null;
let searchPath = projectRoot;
const maxDepth = 10;
let depth = 0;

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

// Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// Node modules paths
const nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

if (buildRootNodeModules && fs.existsSync(buildRootNodeModules)) {
  const normalizedBuildRoot = path.resolve(buildRootNodeModules);
  const normalizedWorkspaceRoot = path.resolve(workspaceRoot, 'node_modules');
  if (normalizedBuildRoot !== normalizedWorkspaceRoot) {
    nodeModulesPaths.push(buildRootNodeModules);
  }
}

config.resolver.nodeModulesPaths = nodeModulesPaths;

// React resolution
const appNodeModules = path.resolve(projectRoot, 'node_modules');
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules');
const isEASBuild = !!buildRootNodeModules && buildRootNodeModules !== workspaceNodeModules;

if (!isEASBuild) {
  const appReactPath = path.join(appNodeModules, 'react');
  const appReactDomPath = path.join(appNodeModules, 'react-dom');

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

let reactPath = path.join(appNodeModules, 'react');
let reactDomPath = path.join(appNodeModules, 'react-dom');

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

const extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
};

if (fs.existsSync(reactPath)) {
  extraNodeModules['react'] = reactPath;
  extraNodeModules['react/jsx-runtime'] = reactPath;
  extraNodeModules['react/jsx-dev-runtime'] = reactPath;
}
if (fs.existsSync(reactDomPath)) {
  extraNodeModules['react-dom'] = reactDomPath;
}

config.resolver.extraNodeModules = extraNodeModules;

if (extraNodeModules['react']) {
  const originalResolveRequest = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'react' && extraNodeModules['react']) {
      const reactIndexPath = path.join(extraNodeModules['react'], 'index.js');
      if (fs.existsSync(reactIndexPath)) {
        return { filePath: reactIndexPath, type: 'sourceFile' };
      }
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
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

// Add support for @ alias
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  '@': path.resolve(projectRoot),
  '@/convex': path.join(workspaceRoot, 'packages', 'convex', 'convex'),
};

// Enable package.json exports field support
config.resolver.unstable_enablePackageExports = true;

module.exports = config;

