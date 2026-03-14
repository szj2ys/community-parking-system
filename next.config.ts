import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel deployment configuration
  output: 'standalone',

  // Image optimization for Vercel
  images: {
    unoptimized: true,
  },

  // Enable experimental features for better performance
  experimental: {
    // Server Actions are enabled by default in Next.js 15+
  },

  // Environment variables that should be available at build time
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

export default nextConfig;
