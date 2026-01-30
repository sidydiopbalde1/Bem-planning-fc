/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  env: {
    CUSTOM_KEY: 'planning-fc',
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ SEUL package à transpiler (UI)
  transpilePackages: ['lucide-react'],

  // ✅ Packages Node-only
  serverExternalPackages: [
    '@prisma/client',
    'bcryptjs',
    'jsonwebtoken',
  ],

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;
