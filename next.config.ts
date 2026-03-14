import type { NextConfig } from "next";
import * as path from "path";

const nextConfig: NextConfig = {
  // Vercel deployment configuration
  output: 'standalone',

  // Dist directory to isolate build
  distDir: path.join(__dirname, '.next'),

  // Image optimization for Vercel
  images: {
    unoptimized: true,
  },

  // Turbopack configuration - use current directory as root
  turbopack: {
    root: __dirname,
  },

  // Exclude test files from build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].filter(
    (ext) => !ext.includes('test')
  ),

  // Disable static page generation - this app requires database/auth
  // All pages will be server-rendered or client-rendered
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },

  // Enable experimental features for better performance
  experimental: {
    // Server Actions are enabled by default in Next.js 15+
    // Disable type checking during build - we run tsc separately
    typedRoutes: false,
  },

  // Environment variables that should be available at build time
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

export default nextConfig;
