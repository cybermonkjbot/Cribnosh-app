import { withSentryConfig } from '@sentry/nextjs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration
  typescript: {
    // Only ignore TypeScript errors in development
    // In production, all TypeScript errors must be fixed
    ignoreBuildErrors: false,
  },

  // Server-side initialization
  serverExternalPackages: ['winston'],

  // Image optimization
  images: {
    // Enable image optimization
    // Configure image domains if using external images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.convex.cloud',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: '**.convex.cloud',
        pathname: '/storage/**',
      },
    ],
  },

  // Transpile packages for better compatibility
  transpilePackages: ['convex'],

  /*
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
  */

  // Output configuration
  output: 'standalone',

  // Enable source maps in production for error tracking (Sentry can use them)
  productionBrowserSourceMaps: true,

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

// Wrap Next.js config with Sentry
export default withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: '/monitoring',

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
