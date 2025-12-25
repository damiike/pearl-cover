import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker deployments
  output: 'standalone',

  // Turbopack is now stable and enabled by default in Next.js 16.1
  // for 'next dev' - provides 10-14x faster compile times with file system caching

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Optional: Enable experimental bundle analyzer
  // Uncomment the following to analyze bundle sizes
  // experimental: {
  //   bundleAnalyzer: {
  //     enabled: process.env.ANALYZE === 'true',
  //   },
  // },
};

export default nextConfig;
