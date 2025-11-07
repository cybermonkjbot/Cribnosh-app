import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Server-side initialization
  serverExternalPackages: ['winston'],
  
  // Image optimization
  images: {
    unoptimized: true,
  },
  
  // Transpile packages for better compatibility
  transpilePackages: ['convex'],
  
  // Turbopack configuration for faster development
  turbopack: {
    // Configure Turbopack for better performance
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              icon: true,
            },
          },
        ],
        as: '*.js',
      },
    },
  },
  
  // Experimental features - ensure Turbopack can resolve paths correctly
  experimental: {
    // Turbopack should automatically read tsconfig.json paths
    // This ensures proper path resolution for monorepo structure
  },
  
  // Output configuration
  output: 'standalone',
  
  // Disable source maps in production for better performance
  productionBrowserSourceMaps: false,
  
  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Webpack configuration - minimal and clean
  webpack: (config, { dev, isServer }) => {
    // Ensure proper module resolution for path aliases
    // This is needed for Docker builds where path resolution differs
    if (config.resolve) {
      // Try to resolve Convex path - check symlink first, then monorepo, then Docker build context
      const convexPathSymlink = resolve(__dirname, './convex');
      const convexPathMonorepo = resolve(__dirname, '../../packages/convex/convex');
      const convexPathDocker = resolve(__dirname, './packages/convex/convex');
      
      // In Docker builds, files are copied to apps/web/packages/convex/convex/_generated/
      // Check which path exists using fs.existsSync
      let convexPath = convexPathSymlink;
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Check symlink first (for local development)
        const symlinkGeneratedPath = path.join(convexPathSymlink, '_generated');
        const dockerGeneratedPath = path.join(convexPathDocker, '_generated');
        const monorepoGeneratedPath = path.join(convexPathMonorepo, '_generated');
        
        if (fs.existsSync(symlinkGeneratedPath)) {
          convexPath = convexPathSymlink;
          console.log('Using symlink path for Convex:', convexPath);
        } else if (fs.existsSync(dockerGeneratedPath)) {
          convexPath = convexPathDocker;
          console.log('Using Docker build context path for Convex:', convexPath);
        } else if (fs.existsSync(monorepoGeneratedPath)) {
          convexPath = convexPathMonorepo;
          console.log('Using monorepo path for Convex:', convexPath);
        } else {
          // Default to symlink path if neither exists
          console.log('Defaulting to symlink path for Convex:', convexPath);
        }
      } catch (e) {
        // If fs check fails, default to symlink path
        console.log('Error checking Convex paths, defaulting to symlink:', e.message);
        convexPath = convexPathSymlink;
      }
      
      // Only add the alias if it doesn't already exist (preserves local behavior)
      if (!config.resolve.alias?.['@/convex']) {
        config.resolve.alias = {
          ...config.resolve.alias,
          '@/convex': convexPath,
        };
      }
      
      // Also add module resolution fallback to help webpack find the files
      if (!config.resolve.modules) {
        config.resolve.modules = ['node_modules'];
      }
      // Add all possible paths to module resolution as fallback
      if (Array.isArray(config.resolve.modules)) {
        if (!config.resolve.modules.includes(convexPathSymlink)) {
          config.resolve.modules.push(convexPathSymlink);
        }
        if (!config.resolve.modules.includes(convexPathMonorepo)) {
          config.resolve.modules.push(convexPathMonorepo);
        }
        if (!config.resolve.modules.includes(convexPathDocker)) {
          config.resolve.modules.push(convexPathDocker);
        }
      }
    }
    
    // Only add essential webpack modifications
    if (dev && !isServer) {
      // Ensure proper module resolution
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false,
          path: false,
          os: false,
        },
      };
    }
    
    return config;
  },
}

export default nextConfig
