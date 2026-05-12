const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch only this app and shared node_modules
config.watchFolders = [
  path.resolve(projectRoot),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Alias native-only packages to no-op shims for web
const workletsWebShim = path.resolve(projectRoot, 'shims/react-native-worklets.js');
const mapsWebShim = path.resolve(projectRoot, 'shims/react-native-maps.js');

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'react-native-worklets') {
      return { type: 'sourceFile', filePath: workletsWebShim };
    }
    if (moduleName === 'react-native-maps') {
      return { type: 'sourceFile', filePath: mapsWebShim };
    }
    if (moduleName === 'react') {
      return { type: 'sourceFile', filePath: path.resolve(projectRoot, 'node_modules/react/index.js') };
    }
    if (moduleName.startsWith('react/')) {
      return { type: 'sourceFile', filePath: path.resolve(projectRoot, 'node_modules/react', moduleName.slice(6) + '.js') };
    }
    if (moduleName === 'react-dom') {
      return { type: 'sourceFile', filePath: path.resolve(projectRoot, 'node_modules/react-dom/index.js') };
    }
    if (moduleName.startsWith('react-dom/')) {
      return { type: 'sourceFile', filePath: path.resolve(projectRoot, 'node_modules/react-dom', moduleName.slice(10) + '.js') };
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
