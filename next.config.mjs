/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  experimental: {
    runtime: 'automatic',
  },
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;
