import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '', // 如果没有特定端口，可以留空
        pathname: '/s/files/**', // 允许的路径模式
      },
    ],
  },
};
module.exports = {
  reactStrictMode: true,
  eslint: {
      ignoreDuringBuilds: true,
  },
}
export default nextConfig;
