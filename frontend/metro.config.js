// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure project root is the frontend directory
config.projectRoot = __dirname;
config.watchFolders = [__dirname];

// Prevent Metro from looking in parent node_modules
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
  blockList: [
    // Block only the parent's node_modules, not nested ones within our frontend/node_modules
    new RegExp(path.resolve(__dirname, '..', 'node_modules').replace(/\\/g, '/') + '/(?!family-planner-frontend)'),
  ],
};

module.exports = config;
