import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source (main: ./src/index.ts).
  transpilePackages: ["@preventos/auth", "@preventos/outcomes", "@preventos/domain", "@preventos/shared"],
  webpack: (config) => {
    // Workspace TS source uses NodeNext-style ".js" import specifiers.
    config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"] };
    return config;
  },
};

export default nextConfig;
