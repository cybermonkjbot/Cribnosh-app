const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const path = require("path");
const config = getDefaultConfig(__dirname);

// Add support for @ alias
config.resolver = config.resolver || {};
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  "@": path.resolve(__dirname),
};

// Add resetCache configuration - essential for worklets plugin
config.resetCache = true;

module.exports = withNativeWind(config, { input: "./global.css" });
