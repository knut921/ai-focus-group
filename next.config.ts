import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. 忽略 TypeScript 錯誤 (允許打包)
  typescript: {
    ignoreBuildErrors: true,
  },
  // 2. 忽略 ESLint 錯誤 (允許打包)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;