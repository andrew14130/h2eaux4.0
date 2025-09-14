module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        web: {
          useBuiltIns: 'entry',
          modules: 'commonjs'
        }
      }]
    ],
    plugins: [
      // Plugin pour résoudre l'erreur import.meta
      ['@babel/plugin-proposal-object-rest-spread'],
    ],
  };
};