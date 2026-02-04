#!/usr/bin/env node
/**
 * Setup script to create convex directory for path resolution
 * This script creates a symlink or copies the convex directory
 * to ensure @/convex imports work in all build environments
 */

const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const webRoot = path.resolve(projectRoot, '..');
const convexSymlink = path.join(webRoot, 'convex');
const convexMonorepo = path.resolve(webRoot, '../../packages/convex');
const convexDocker = path.join(webRoot, 'packages/convex');

// Check which source path exists
let sourcePath = null;

// Docker environment usually has files at packages/convex
// Local monorepo environment has files at ../../packages/convex
if (fs.existsSync(convexDocker)) {
  sourcePath = convexDocker;
  console.log('Found Convex at Docker path:', convexDocker);
} else if (fs.existsSync(convexMonorepo)) {
  sourcePath = convexMonorepo;
  console.log('Found Convex at monorepo path:', convexMonorepo);
} else {
  console.warn('Warning: Convex source directory not found at expected locations');
  console.warn('  Monorepo path:', convexMonorepo);
  console.warn('  Docker path:', convexDocker);

  // If we don't have a source but we have a convex directory already, keep it
  if (fs.existsSync(convexSymlink)) {
    const generatedPath = path.join(convexSymlink, '_generated');
    if (fs.existsSync(generatedPath)) {
      console.log('Existing convex directory with _generated found, keeping it as fallback');
      process.exit(0);
    }
  }
  process.exit(0); // Don't fail, just warn
}

if (!sourcePath) {
  process.exit(0);
}

// Check if convex already exists and is valid (points to the right source)
if (fs.existsSync(convexSymlink)) {
  try {
    const stats = fs.lstatSync(convexSymlink);
    if (stats.isSymbolicLink()) {
      const linkTarget = fs.readlinkSync(convexSymlink);
      const resolvedTarget = path.resolve(webRoot, linkTarget);
      const resolvedSource = path.resolve(sourcePath);

      // If symlink already points to the correct source, skip
      if (resolvedTarget === resolvedSource) {
        console.log('Convex symlink already exists and points to correct source, skipping');
        process.exit(0);
      }
      fs.unlinkSync(convexSymlink);
      console.log('Removed existing symlink:', convexSymlink);
    } else if (stats.isDirectory()) {
      // Check if directory has _generated folder (valid)
      const generatedPath = path.join(convexSymlink, '_generated');
      const sourceGenerated = path.join(sourcePath, '_generated');

      if (fs.existsSync(generatedPath) && fs.existsSync(sourceGenerated)) {
        // Compare modification times
        const destTime = fs.statSync(generatedPath).mtime;
        const sourceTime = fs.statSync(sourceGenerated).mtime;

        // If destination is up to date, skip
        if (destTime >= sourceTime) {
          console.log('Convex directory already exists and is up to date, skipping');
          process.exit(0);
        }
      }

      // If we are in Docker and sourcePath is same as where we might have copied from, avoid loop
      if (path.resolve(convexSymlink) === path.resolve(sourcePath)) {
        console.log('Collision between symlink target and source path, skipping');
        process.exit(0);
      }

      fs.rmSync(convexSymlink, { recursive: true, force: true });
      console.log('Removed existing directory:', convexSymlink);
    }
  } catch (error) {
    console.warn('Error checking/removing existing convex:', error.message);
  }
}

// Try to create symlink first (works on Unix systems)
try {
  fs.symlinkSync(sourcePath, convexSymlink, 'dir');
  console.log('Created symlink:', convexSymlink, '->', sourcePath);
} catch (error) {
  // If symlink fails (e.g., on Windows or in CI), copy the directory
  console.log('Symlink failed, copying directory instead:', error.message);
  try {
    fs.mkdirSync(convexSymlink, { recursive: true });

    // Copy all files recursively
    function copyRecursive(src, dest) {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
          copyRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    copyRecursive(sourcePath, convexSymlink);
    console.log('Copied Convex directory to:', convexSymlink);
  } catch (copyError) {
    console.error('Error copying Convex directory:', copyError.message);
    process.exit(1);
  }
}

console.log('Convex setup complete!');

