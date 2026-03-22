const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          '@react-native-async-storage/async-storage',
        ],
      },
    },
    argv
  );

  // Exclude native-only modules from web bundle
  config.resolve.alias = {
    ...config.resolve.alias,
    'expo-camera': path.resolve(__dirname, 'src/utils/stubs/camera.web.ts'),
    'expo-barcode-scanner': path.resolve(__dirname, 'src/utils/stubs/barcode.web.ts'),
    'expo-local-authentication': path.resolve(__dirname, 'src/utils/stubs/auth.web.ts'),
    'expo-notifications': path.resolve(__dirname, 'src/utils/stubs/notifications.web.ts'),
    'expo-background-fetch': path.resolve(__dirname, 'src/utils/stubs/background.web.ts'),
    'expo-task-manager': path.resolve(__dirname, 'src/utils/stubs/tasks.web.ts'),
    'react-native-image-crop-picker': path.resolve(__dirname, 'src/utils/stubs/imagePicker.web.ts'),
  };

  // Enable performance hints
  config.performance = {
    hints: 'warning',
    maxAssetSize: 2000000, // 2MB
    maxEntrypointSize: 2000000, // 2MB
  };

  // Optimize chunks for better code splitting
  if (config.mode === 'production') {
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          common: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
      usedExports: true,
      sideEffects: true,
    };
  }

  return config;
};
