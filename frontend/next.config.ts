import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['may-store.lvh.me', 'localhost:3000'],
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
