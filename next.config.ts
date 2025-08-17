// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // @ts-expect-error -- allowedDevOrigins is undocumented in types for now
    allowedDevOrigins: [
      'https://www.elitehubng.com'
    ],
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
    {
      protocol: 'https',
      hostname: '*.googleusercontent.com', // if using Firebase Storage
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'firebasestorage.googleapis.com', // Firebase Storage
      pathname: '/**',
    },
  ],
},
};

export default nextConfig;
