import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

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
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/convex': resolve(__dirname, '../../packages/convex/convex'),
      };
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
