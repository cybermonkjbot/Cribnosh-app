import fs from 'fs';
import path, { dirname, resolve } from 'path';
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

  // Turbopack configuration (Next.js 16 requirement)
  turbopack: {
    resolveAlias: {
      '@/convex': resolve(__dirname, './convex'),
      '@/convex/_generated/api': resolve(__dirname, './convex/_generated/api'),
      '@/convex/_generated/dataModel': resolve(__dirname, './convex/_generated/dataModel'),
      '@/convex/_generated/server': resolve(__dirname, './convex/_generated/server'),
    },
  },

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

  // URL Rewrites
  async rewrites() {
    return [
      {
        source: '/blog',
        destination: '/by-us',
      },
      {
        source: '/blog/:slug*',
        destination: '/by-us/:slug*',
      },
    ];
  },

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
      const convexPathMonorepo = resolve(__dirname, '../../packages/convex');
      const convexPathDocker = resolve(__dirname, './packages/convex');

      // In Docker builds, files are copied to apps/web/packages/convex/convex/_generated/
      // or symlinked to /app/convex
      let convexPath = convexPathSymlink;

      const pathsToTry = [
        { path: convexPathSymlink, name: 'symlink' },
        { path: convexPathDocker, name: 'Docker' },
        { path: convexPathMonorepo, name: 'monorepo' }
      ];

      for (const tryPath of pathsToTry) {
        try {
          if (fs.existsSync(tryPath.path)) {
            // Check if directory has generated files (direct or nested)
            const hasGenerated = fs.existsSync(path.join(tryPath.path, '_generated')) ||
              fs.existsSync(path.join(tryPath.path, 'convex', '_generated'));

            if (hasGenerated) {
              convexPath = tryPath.path;
              console.log(`Using ${tryPath.name} path for Convex:`, convexPath);
              break;
            }
          }
        } catch (e) {
          console.log(`Error checking ${tryPath.name} path:`, e.message);
        }
      }

      // Log to stdout directly with exhaustive debug info
      process.stdout.write(`[DEBUG] Initial Convex path: ${convexPath}\n`);

      function findDirectories(dir, name, depth = 0) {
        if (depth > 3 || !fs.existsSync(dir)) return [];
        let results = [];
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              if (entry.name === name) results.push(fullPath);
              results = results.concat(findDirectories(fullPath, name, depth + 1));
            }
          }
        } catch (e) { }
        return results;
      }

      function findFile(dir, name, depth = 0) {
        if (depth > 3 || !fs.existsSync(dir)) return null;
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isFile() && (entry.name === name || entry.name === name + '.ts' || entry.name === name + '.js')) {
              return fullPath;
            }
            if (entry.isDirectory()) {
              const result = findFile(fullPath, name, depth + 1);
              if (result) return result;
            }
          }
        } catch (e) { }
        return null;
      }

      // Try to find the real core directories
      const allGenFolders = findDirectories(convexPath, '_generated');

      if (allGenFolders.length > 0) {
        // Sort by path depth to find the shallowest _generated folder (most likely the root)
        allGenFolders.sort((a, b) => a.split(path.sep).length - b.split(path.sep).length);

        process.stdout.write(`[DEBUG] Found _generated folders at: ${allGenFolders.join(', ')}\n`);

        // Use the shallowest one found
        const safeGenPath = allGenFolders[0];
        const realParent = path.dirname(safeGenPath);

        process.stdout.write(`[DEBUG] Using safeGenPath: ${safeGenPath}\n`);
        process.stdout.write(`[DEBUG] Setting @/convex root to: ${realParent}\n`);

        const robustAliases = {
          '@/convex': realParent,
          '@/convex/_generated': safeGenPath,
          '@/convex/_generated/api': path.join(safeGenPath, 'api'),
          '@/convex/_generated/dataModel': path.join(safeGenPath, 'dataModel'),
          '@/convex/_generated/server': path.join(safeGenPath, 'server'),
        };

        // Try to find emailTemplates specifically if it's missing from realParent
        const emailTemplateInRoot = path.join(realParent, 'emailTemplates');
        if (!fs.existsSync(emailTemplateInRoot + '.ts') && !fs.existsSync(emailTemplateInRoot + '.js')) {
          process.stdout.write(`[DEBUG] emailTemplates NOT found in ${realParent}, searching...\n`);
          const emailTemplatePath = findFile(convexPath, 'emailTemplates');
          if (emailTemplatePath) {
            process.stdout.write(`[DEBUG] Found emailTemplates at: ${emailTemplatePath}\n`);
            robustAliases['@/convex/emailTemplates'] = emailTemplatePath.replace(/\.(ts|js)$/, '');
          }
        } else {
          process.stdout.write(`[DEBUG] Found emailTemplates in root: ${emailTemplateInRoot}\n`);
        }

        // Apply aliases with precedence
        config.resolve.alias = Object.assign({}, config.resolve.alias, robustAliases);
      } else {
        process.stdout.write(`[DEBUG] CRITICAL: Could not find any _generated folder in ${convexPath}\n`);
      }

      // Fallback module resolution
      if (!config.resolve.modules) config.resolve.modules = ['node_modules'];
      if (Array.isArray(config.resolve.modules)) {
        [convexPathSymlink, convexPathMonorepo, convexPathDocker].forEach(p => {
          if (!config.resolve.modules.includes(p)) config.resolve.modules.push(p);
        });
      }
    }

    if (!isServer) {
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
};

export default nextConfig;
