import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 部署时正确追踪 workspace root
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
