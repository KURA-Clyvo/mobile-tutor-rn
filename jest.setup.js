// `testTimeout: 20000` (package.json) em vez do default de 5000 ms do Jest.
//
// Medido, nao chutado: com o cache de transform frio, um `render(<Text>oi</Text>)`
// trivial dentro da arvore de providers deste app leva 7184 ms — sozinho, sem tocar
// em nenhuma tela. E o custo de inicializacao unica do primeiro render React Native
// de cada worker (reconciler, registro de componentes nativos, mocks de safe-area).
// Ele e debitado de QUEM RENDERIZAR PRIMEIRO no arquivo, entao a vitima e arbitraria:
// no PerfilScreen.test.tsx o teste 1 levava 2752 ms rodando sozinho e estourava os
// 5000 ms sob a suite completa, enquanto os outros 6 do mesmo arquivo levavam 17-90 ms.
//
// Nao e "flake ocasional": o `.github/workflows/ci.yml` cacheia so o npm, entao o
// cache de transform do Jest e frio em TODA execucao de CI — a condicao exata da
// medida acima. O CI vinha passando por variancia de tempo, nao por folga.
//
// Os 20 s dao ~2.8x sobre o pior caso medido. Isso NAO mascara teste lento: o custo
// e de inicializacao, pago uma vez por worker, e nao aparece nos testes seguintes.

jest.mock('react-native-safe-area-context', () => {
  const mod = require('react-native-safe-area-context/jest/mock');
  return mod.default ?? mod;
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:      jest.fn(() => Promise.resolve(null)),
  setItem:      jest.fn(() => Promise.resolve()),
  removeItem:   jest.fn(() => Promise.resolve()),
  multiSet:     jest.fn(() => Promise.resolve()),
  multiGet:     jest.fn(() => Promise.resolve([])),
  multiRemove:  jest.fn(() => Promise.resolve()),
  clear:        jest.fn(() => Promise.resolve()),
  getAllKeys:    jest.fn(() => Promise.resolve([])),
  mergeItem:    jest.fn(() => Promise.resolve()),
  flushGetRequests: jest.fn(),
}));
