module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./src'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@services': './src/services',
          '@hooks': './src/hooks',
          '@theme': './src/theme',
          '@types': './src/types',
          '@mocks': './src/mocks',
        },
      }],
      'react-native-reanimated/plugin', // MUST BE LAST
    ],
  };
};
