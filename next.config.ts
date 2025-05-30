import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  allowedDevOrigins: ["*"], // Add your dev origin here
  reactStrictMode: false,
};

export default nextConfig;
