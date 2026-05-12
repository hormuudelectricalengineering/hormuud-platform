const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

config.projectRoot = projectRoot;

config.watchFolders = [
  path.resolve(projectRoot),
  path.resolve(projectRoot, '..', '..', 'node_modules'),
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(projectRoot, '..', '..', 'node_modules'),
];

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