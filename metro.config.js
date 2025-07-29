const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

// Disable Reanimated strict mode warnings
process.env.REANIMATED_STRICT_MODE = 'false';

const path = require('path');
const config = getDefaultConfig(__dirname);

// Add support for @ alias
config.resolver = config.resolver || {};
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  '@': path.resolve(__dirname),
};

module.exports = withNativeWind(config, { input: './global.css' });
