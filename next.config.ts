// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // @ts-expect-error -- allowedDevOrigins is undocumented in types for now
    allowedDevOrigins: [
      'https://3000-firebase-studio-1753125714398.cluster-l6vkdperq5ebaqo3qy4ksvoqom.cloudworkstations.dev',
      'http://localhost:3000',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
