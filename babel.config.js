module.exports = function(api) {
  api.cache(true);
  return {
    // Web: o zustand (middleware) usa `import.meta.env`, e o bundle web do Expo é um
    // script clássico — sem esta flag o app hospedado morre no carregamento com
    // "Cannot use 'import.meta' outside a module" (tela branca). Mesmo ajuste do
    // mobile-clinica-rn (babel.config.js de lá).
    presets: [['babel-preset-expo', { web: { unstable_transformImportMeta: true } }]],
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
