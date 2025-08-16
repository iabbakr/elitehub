// next.config.ts
import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  experimental: {
    ...(isDev && {
      // only applied in development
      // @ts-expect-error -- allowedDevOrigins is undocumented in types
      allowedDevOrigins: [
        'https://3000-firebase-studio-1753125714398.cluster-l6vkdperq5ebaqo3qy4ksvoqom.cloudworkstations.dev',
        'http://localhost:3000',
      ],
    }),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
