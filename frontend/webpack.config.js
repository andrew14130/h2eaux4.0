const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Ajouter une configuration pour supporter les modules React Native dans le web
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web',
    '@react-native-async-storage/async-storage': '@react-native-async-storage/async-storage/lib/commonjs/index.web.js'
  };

  return config;
};