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
      // Reanimated 4: o plugin real mora em react-native-worklets. O antigo
      // 'react-native-reanimated/plugin' e um shim de 3 linhas que so faz
      // require('react-native-worklets/plugin'). TEM QUE SER O ULTIMO.
      'react-native-worklets/plugin',
    ],
  };
};
