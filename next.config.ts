import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  typedRoutes: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb"
    }
  }
};

export default nextConfig;
