const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

// Add glb/gltf 3D model support
config.resolver.assetExts.push('glb', 'gltf');

module.exports = config;
