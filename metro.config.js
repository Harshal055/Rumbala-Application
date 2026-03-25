const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /node_modules[\\/]expo-modules-autolinking[\\/]android[\\/]expo-gradle-plugin[\\/]expo-autolinking-settings-plugin[\\/]build[\\/]classes[\\/]kotlin[\\/]main[\\/]expo[\\/]modules[\\/].*/,
];

module.exports = config;
