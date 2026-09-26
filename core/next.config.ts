import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // core/ sits inside the main app, whose lockfile would otherwise be picked as the root
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
