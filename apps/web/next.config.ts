import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @preventos/api-client ships TypeScript source (main: ./src/index.ts) and
  // imports its transitive workspace deps; transpile them with the web app.
  transpilePackages: ["@preventos/api-client", "@preventos/domain", "@preventos/shared"],
  webpack: (config) => {
    // Workspace TS source uses NodeNext-style ".js" import specifiers.
    config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"] };
    return config;
  },
};

export default nextConfig;
