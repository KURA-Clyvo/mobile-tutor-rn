import Constants from 'expo-constants';

// S4-MOB-02: lê o que o app.config.js injetou no build. Sem commit (config não resolvida) => null,
// e a tela diz "não identificado" em vez de inventar um valor.
export interface VersaoApp {
  versao: string;
  commit: string | null;
  commitCurto: string | null;
  alteracoesLocais: boolean;
}

type Extra = { build?: { commit?: string | null; alteracoesLocais?: boolean } } | undefined;

export function lerVersaoApp(
  extra: Extra = Constants.expoConfig?.extra as Extra,
  versao: string | undefined = Constants.expoConfig?.version,
): VersaoApp {
  const commit = extra?.build?.commit ?? null;
  return {
    versao: versao ?? '—',
    commit,
    commitCurto: commit ? commit.slice(0, 7) : null,
    alteracoesLocais: extra?.build?.alteracoesLocais === true,
  };
}

// Para quem avalia saber contra o que este build fala. Acesso literal a `process.env.EXPO_PUBLIC_*`:
// o babel do Expo só embute a variável no bundle quando ela aparece escrita assim.
export function lerAmbienteApp(
  apiUrl: string | undefined = process.env.EXPO_PUBLIC_API_BASE_URL,
  usaMocks: string | undefined = process.env.EXPO_PUBLIC_USE_MOCKS,
): { apiUrl: string; modoDemo: boolean } {
  return { apiUrl: apiUrl || 'não configurada', modoDemo: usaMocks === 'true' };
}
