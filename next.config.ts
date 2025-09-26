/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    CUSTOM_KEY: 'planning-fc',
  },
  eslint:{
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig