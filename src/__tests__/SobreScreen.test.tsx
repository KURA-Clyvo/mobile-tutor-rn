// S4-MOB-02: a tela "Sobre o App" exibe o commit que o build injetou (rubrica Sprint 4, Publicação),
// avisa quando o build tem alteração não commitada e quando roda em modo demonstração.
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import SobreScreen from '../app/(tabs)/perfil/sobre';
import { lerVersaoApp, lerAmbienteApp } from '../constants/versaoApp';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { resolverCommit } = require('../../app.config.js');

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false }) }));

const mockVersao = jest.fn();
const mockAmbiente = jest.fn();
jest.mock('../constants/versaoApp', () => ({
  ...jest.requireActual('../constants/versaoApp'),
  lerVersaoApp: () => mockVersao(),
  lerAmbienteApp: () => mockAmbiente(),
}));

const HASH = '0123456789abcdef0123456789abcdef01234567';
const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('SobreScreen (S4-MOB-02)', () => {
  beforeEach(() => {
    mockAmbiente.mockReturnValue({ apiUrl: 'https://api.exemplo', modoDemo: false });
  });

  it('mostra o commit curto e o completo, a versão e o símbolo KURA', () => {
    mockVersao.mockReturnValue({ versao: '1.0.0', commit: HASH, commitCurto: '0123456', alteracoesLocais: false });
    const { getByTestId, getByText, getByRole, queryByText } = render(<SobreScreen />, { wrapper: W });
    expect(getByTestId('sobre-commit').props.children).toBe('0123456');
    expect(getByText(HASH)).toBeTruthy();
    expect(getByText('KURA Tutor · versão 1.0.0')).toBeTruthy();
    expect(getByRole('image', { name: 'KURA' })).toBeTruthy();
    expect(queryByText(/alterações não commitadas/)).toBeNull();
    expect(getByText('Dados reais da clínica')).toBeTruthy();
  });

  it('avisa build sujo e modo demonstração; sem commit diz "não identificado"', () => {
    mockVersao.mockReturnValue({ versao: '1.0.0', commit: null, commitCurto: null, alteracoesLocais: true });
    mockAmbiente.mockReturnValue({ apiUrl: 'https://api.exemplo', modoDemo: true });
    const { getByTestId, getByText } = render(<SobreScreen />, { wrapper: W });
    expect(getByTestId('sobre-commit').props.children).toBe('não identificado');
    expect(getByText(/alterações não commitadas/)).toBeTruthy();
    expect(getByText('Modo demonstração: dados simulados')).toBeTruthy();
  });
});

describe('lerVersaoApp / lerAmbienteApp', () => {
  const real = jest.requireActual('../constants/versaoApp') as { lerVersaoApp: typeof lerVersaoApp; lerAmbienteApp: typeof lerAmbienteApp };

  it('encurta o hash para 7 e preserva o flag de alterações locais', () => {
    expect(real.lerVersaoApp({ build: { commit: HASH, alteracoesLocais: true } }, '2.0.0'))
      .toEqual({ versao: '2.0.0', commit: HASH, commitCurto: '0123456', alteracoesLocais: true });
  });

  it('sem build injetado devolve null, nunca um hash inventado', () => {
    expect(real.lerVersaoApp(undefined, undefined)).toEqual({ versao: '—', commit: null, commitCurto: null, alteracoesLocais: false });
  });

  it('modo demo só quando USE_MOCKS é exatamente "true"', () => {
    expect(real.lerAmbienteApp('https://x', 'true')).toEqual({ apiUrl: 'https://x', modoDemo: true });
    expect(real.lerAmbienteApp(undefined, 'false')).toEqual({ apiUrl: 'não configurada', modoDemo: false });
  });
});

describe('app.config.js resolverCommit', () => {
  it('no EAS usa o commit que o EAS buildou, sem chamar git', () => {
    const git = jest.fn();
    expect(resolverCommit({ EAS_BUILD_GIT_COMMIT_HASH: HASH }, git)).toEqual({ commit: HASH, alteracoesLocais: false });
    expect(git).not.toHaveBeenCalled();
  });

  it('local lê o HEAD e marca working tree suja', () => {
    const git = (args: string) => (args === 'rev-parse HEAD' ? HASH : ' M src/x.ts');
    expect(resolverCommit({}, git)).toEqual({ commit: HASH, alteracoesLocais: true });
  });

  it('sem git disponível devolve null em vez de quebrar a config', () => {
    const git = () => { throw new Error('git ausente'); };
    expect(resolverCommit({}, git)).toEqual({ commit: null, alteracoesLocais: false });
  });
});
