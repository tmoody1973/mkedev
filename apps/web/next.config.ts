import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ['pmtiles'],
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
