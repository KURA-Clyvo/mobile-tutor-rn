// Flat config (eslint.config.js), substituindo o .eslintrc.js legado.
//
// Por que agora: o ESLint 8.57 esta em EOL desde out/2024, e o formato eslintrc deixou
// de ser o default no ESLint 9. `eslint-config-expo@10` ja publicava o entrypoint flat
// (`eslint-config-expo/flat`) -- o projeto estava no caminho legado por inercia, nao
// por falta de suporte.
//
// `ignores` num objeto SOZINHO e o equivalente flat do `ignorePatterns` global do
// eslintrc; misturado com outras chaves, valeria so para aquele bloco.
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  { ignores: ['dist/*', 'node_modules/*', '.expo/*', '.jest-cache/*', 'coverage/*'] },
  ...expoConfig,
  {
    settings: {
      // Mantido do .eslintrc.js: e o que faz o eslint-plugin-import resolver os aliases
      // `@/`, `@components/` etc. pelos `paths` do tsconfig em vez de reclamar deles.
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
  },
];
