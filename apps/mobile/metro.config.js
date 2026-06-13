/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Workspace packages (@preventos/*) use NodeNext-style relative imports with
// explicit .js extensions that point at .ts sources. Metro resolves the literal
// specifier first; on failure we retry without the extension so sourceExts
// (.ts/.tsx) can match.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  try {
    return resolve(context, moduleName, platform);
  } catch (error) {
    if (/^\.\.?\//.test(moduleName) && moduleName.endsWith(".js")) {
      return resolve(context, moduleName.slice(0, -3), platform);
    }
    throw error;
  }
};

module.exports = config;
