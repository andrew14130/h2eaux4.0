const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Configuration simplifiée pour web
config.maxWorkers = 2;

// Support pour les modules ES6 en mode web
config.resolver.sourceExts = [...config.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx'];

module.exports = config;
