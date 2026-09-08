// T-1 / MB-03 — guarda de autenticacao no roteador.
//
// O QUE ESTE ARQUIVO PROVA, e por que ele existe:
//
// Antes deste fix, `src/app/_layout.tsx` montava `<Stack />` sem declarar rota
// nenhuma, e `src/app/(tabs)/_layout.tsx` era so `<Tabs>` com 4 `<Tabs.Screen>`,
// sem uma unica leitura de sessao. O unico redirecionamento do app vivia em
// `src/app/index.tsx`, que e a ROTA DE ENTRADA — ou seja, so protegia quem
// entrasse por ela. Um deep link direto para `/(tabs)/pets` entrava sem sessao.
//
// A rubrica da Sprint 3 cobra isso em dois lugares ao mesmo tempo: o criterio
// "o usuario nao autenticado nao deve conseguir acessar telas internas por
// navegacao direta ou atalhos" (4 pts) e a penalidade VIII, "telas protegidas
// acessiveis sem autenticacao" (-20).
//
// COMO A MORDIDA E FEITA AQUI: o `expo-router` e substituido por um duble que
// reproduz o contrato real do `Stack.Protected` — `guard: boolean`, e os filhos
// so entram na arvore quando ele e verdadeiro (ver
// `node_modules/expo-router/build/views/Protected.d.ts`). O teste entao afirma
// QUAIS rotas o layout declara em cada estado de sessao. Medido contra o
// `_layout.tsx` anterior: 4 dos 5 casos falhavam, e o unico que passava era a
// sentinela — o `<Stack />` vazio nao declarava rota alguma, nem publica.
//
// ⚠️ ISTO E PROTECAO DE CLIENTE, NAO DE SERVIDOR. Quem protege o dado e o JWT
// exigido pelo backend. O que a rubrica pede — e o que este teste cobre — e
// "controle de acesso integrado ao sistema de navegacao". Nao escrever no
// README que isto e seguranca.
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Stack } from 'expo-router';

import RootLayout from '../app/_layout';
import { useAuthStore } from '../store/authStore';

// Os dubles sao DECLARACOES DE FUNCAO, nao `const`: o factory do `jest.mock` e
// icado acima dos imports e roda quando `../app/_layout` puxa o `expo-router`,
// antes de qualquer `const` deste arquivo ser inicializado. Declaracao de funcao
// e icada junto e ja existe nesse instante; `const` estaria na zona morta.
// (As propriedades `.Screen`/`.Protected` sao anexadas depois, no corpo do
// modulo, e isso e seguro porque o layout so as LE em tempo de render.)
function DubleScreen({ name }: { name: string }) {
  return <Text>{`rota:${name}`}</Text>;
}

function DubleProtected({ guard, children }: { guard: boolean; children?: React.ReactNode }) {
  return guard ? <>{children}</> : null;
}

function mockStack({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function mockRedirect({ href }: { href: string }) {
  return <Text>{`redirect:${href}`}</Text>;
}

// Mutacao, nao reatribuicao: o factory captura a MESMA funcao icada, e le estas
// propriedades so em tempo de render — quando o corpo do modulo ja rodou.
Object.assign(mockStack, { Screen: DubleScreen, Protected: DubleProtected });

jest.mock('expo-router', () => ({
  Stack: mockStack,
  Redirect: mockRedirect,
  SplashScreen: { preventAutoHideAsync: jest.fn(() => Promise.resolve()), hideAsync: jest.fn() },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false }),
}));

// As fontes nunca carregam sob jsdom, e sem isso o layout devolve o splash e
// nenhuma rota e declarada — o teste passaria por engano, medindo a tela errada.
jest.mock('@expo-google-fonts/cormorant',      () => ({ useFonts: () => [true], Cormorant_500Medium: 'f' }));
jest.mock('@expo-google-fonts/lexend',         () => ({ useFonts: () => [true], Lexend_400Regular: 'f', Lexend_500Medium: 'f' }));
jest.mock('@expo-google-fonts/jetbrains-mono', () => ({ useFonts: () => [true], JetBrainsMono_400Regular: 'f' }));
jest.mock('expo-font', () => ({ useFonts: () => [true], isLoaded: () => true, loadAsync: jest.fn() }));

jest.mock('expo-linking', () => ({
  getInitialURL: () => Promise.resolve(null),
  addEventListener: () => ({ remove: jest.fn() }),
  createURL: (p: string) => `kuratutor://${p}`,
}));

// Efeitos de boot que nao tem relacao com a guarda, e que puxariam rede.
jest.mock('../services/notifications.service', () => ({ setupHandlers: () => () => {} }));
jest.mock('../hooks/useNotifications', () => ({ usePushTokenSync: () => {} }));

const TUTOR = { id: 1, nmTutor: 'Gui', dsEmail: 'g@k.com', dsTelefone: '11999', dtCadastro: '' };
const DAQUI_A_UMA_HORA = () => new Date(Date.now() + 3_600_000).toISOString();
const UM_SEGUNDO_ATRAS = () => new Date(Date.now() - 1000).toISOString();

/** O `<Stack>` so monta depois que a hidratacao do store termina (`_layout.tsx`). */
function marcarStoreComoHidratado() {
  jest.spyOn(useAuthStore.persist, 'hasHydrated').mockReturnValue(true);
  jest
    .spyOn(useAuthStore.persist, 'onFinishHydration')
    .mockImplementation((cb) => {
      cb(useAuthStore.getState());
      return () => {};
    });
}

describe('T-1 — guarda de autenticacao no roteador', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ token: null, expiresAt: null, tutor: null, themeOverride: null });
    marcarStoreComoHidratado();
  });

  it('sem sessao, as rotas internas NAO sao declaradas — nem por deep link', () => {
    const { queryByText } = render(<RootLayout />);

    expect(queryByText('rota:(tabs)')).toBeNull();
    expect(queryByText('rota:notificacoes')).toBeNull();

    // E as publicas continuam alcancaveis: sem isto, "protegido" viraria
    // "inalcancavel", e o login deixaria de existir.
    expect(queryByText('rota:login')).not.toBeNull();
    expect(queryByText('rota:register')).not.toBeNull();
  });

  it('com sessao valida, as rotas internas sao declaradas', () => {
    useAuthStore.getState().setSession('tok', DAQUI_A_UMA_HORA(), TUTOR);

    const { queryByText } = render(<RootLayout />);

    expect(queryByText('rota:(tabs)')).not.toBeNull();
    expect(queryByText('rota:notificacoes')).not.toBeNull();
  });

  it('sessao expirada conta como ausente', () => {
    useAuthStore.getState().setSession('tok', UM_SEGUNDO_ATRAS(), TUTOR);

    const { queryByText } = render(<RootLayout />);

    expect(queryByText('rota:(tabs)')).toBeNull();
    expect(queryByText('rota:login')).not.toBeNull();
  });

  // `register` e alcancado por DEEP LINK DE CONVITE, com o tutor ainda sem
  // sessao. Se ele cair no grupo protegido, o onboarding inteiro quebra — e
  // quebraria em silencio, porque nenhum outro teste percorre esse caminho.
  it('register fica no grupo publico, porque o convite chega sem sessao', () => {
    const { queryByText } = render(<RootLayout />);
    expect(queryByText('rota:register')).not.toBeNull();
  });

  // Sentinela: prova que o duble do `Protected` de fato esconde os filhos.
  // Sem ela, um `Protected` que renderizasse tudo faria as assercoes de
  // "NAO declarada" passarem por engano — o detector precisa enxergar o 1
  // antes de eu confiar no 0 que ele reporta.
  it('[sentinela] o duble de Stack.Protected respeita o guard', () => {
    const { queryByText } = render(
      <>
        <Stack.Protected guard={false}><Text>escondido</Text></Stack.Protected>
        <Stack.Protected guard><Text>visivel</Text></Stack.Protected>
      </>,
    );
    expect(queryByText('escondido')).toBeNull();
    expect(queryByText('visivel')).not.toBeNull();
  });
});
