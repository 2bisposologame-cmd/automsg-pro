import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@napi-rs/canvas': false,
    };
    return config;
  },
};

export default nextConfig;
