import { useMutation } from '@tanstack/react-query';
import { login, register, isVersaoTermoDesatualizadaError } from '../services/auth.service';
import { queryClient } from '../services/queryClient';
import { useAuthStore } from '../store/authStore';

/**
 * T-4 — acesso a dados de autenticação, fora da camada de UI.
 *
 * `login.tsx` e `register.tsx` chamavam `login()`/`register()` do service direto, com
 * `useState(loading)` e `try/catch` na tela. Não era HTTP cru (a regra dura já estava
 * respeitada), mas era a UI falando com a camada de dados sem hook no meio — o mesmo
 * critério de separação de responsabilidades que a T-3 fechou para o TanStack Query.
 *
 * `useMutation` dá `isPending` e `error` de graça, então o `loading` manual das duas
 * telas sai junto — menos estado à mão, e o estado de carregamento que a rubrica
 * pontua passa a vir da mesma fonte do resto do app.
 *
 * O que fica NA TELA de propósito: `setSession` (o store não é camada de dados) e a
 * navegação. O que vem para cá: a chamada de rede e a tradução de erro em mensagem —
 * essa segunda porque o mapeamento depende de `isVersaoTermoDesatualizadaError`, do
 * service, e mantê-lo na tela reintroduziria o import que esta task remove.
 */
// `mutationFn: req => login(req)`, e não `mutationFn: login`: o TanStack v5 chama o
// `mutationFn` com DOIS argumentos (variáveis + um contexto interno `{client, meta,
// mutationKey}`), e a forma sem lambda repassaria esse contexto como 2º argumento do
// service. Hoje `login`/`register` ignoram argumento extra, mas o dia em que um deles
// ganhar um 2º parâmetro (headers, AbortSignal) ele nasceria preenchido com lixo do
// react-query. A lambda trava a aridade em 1.
export function useLogin() {
  return useMutation({ mutationFn: (req: Parameters<typeof login>[0]) => login(req), retry: 0 });
}

export function useRegistrar() {
  return useMutation({ mutationFn: (req: Parameters<typeof register>[0]) => register(req), retry: 0 });
}

/** Erro do login em texto para o tutor. 401 é credencial errada; o resto é rede. */
export function mensagemDeErroDeLogin(err: unknown): string {
  return (err as { status?: number })?.status === 401
    ? 'E-mail ou senha incorretos'
    : 'Erro de conexão. Verifique sua internet.';
}

/**
 * Erro do cadastro em texto para o tutor. A mensagem de versão de termo desatualizada
 * (TASK-61) é acionável e não pode cair no genérico: só se resolve atualizando o app,
 * e sem ela o tutor tenta de novo para sempre.
 */
export function mensagemDeErroDeRegistro(err: unknown): string {
  const status = (err as { status?: number })?.status;
  if (status === 401) return 'Convite expirado ou já utilizado.';
  if (status === 409) return 'E-mail já cadastrado. Faça login.';
  if (isVersaoTermoDesatualizadaError(err)) {
    return 'Uma nova versão do aplicativo é necessária para concluir o cadastro. Atualize o app na loja e tente novamente.';
  }
  return 'Erro ao criar conta. Tente novamente.';
}

/**
 * Logout: limpa a cache do react-query ANTES de derrubar a sessão, para que nenhum
 * dado do tutor anterior sobreviva à troca de conta. A navegação continua na tela —
 * quem decide para onde ir depois é a UI, e o `router` não pertence aqui.
 *
 * Existe também para tirar o `queryClient` de dentro de `perfil/index.tsx`: com ele
 * lá, a tela importava da camada de serviços para fazer trabalho de dados.
 */
export function useLogout() {
  const clearSession = useAuthStore(s => s.clearSession);
  return () => {
    queryClient.clear();
    clearSession();
  };
}
