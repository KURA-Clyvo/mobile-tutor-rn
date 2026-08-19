// src/hooks/useVoltar.ts
//
// TASK-F02: nenhuma das chamadas de router.back() do app verificava
// router.canGoBack() antes de voltar. Uma tela alcançada SEM histórico —
// deep link de convite (_layout.tsx empurra /register), toque em
// notificação push (notifications.service.ts) — nasce sem nada pra
// desempilhar, e back() não tem para onde ir. Ver CLAUDE.md / brief da
// F02 para o levantamento completo.
//
// Este hook é a rede de segurança única: com histórico, comportamento
// IDÊNTICO a router.back() (nenhuma navegação existente muda). Sem
// histórico, cai no destino de fallback hierárquico que cada chamador
// declara explicitamente — nunca "a primeira aba" genérica (o
// backBehavior: 'firstRoute' do TabRouter já cobre esse caso quando o
// back() chega a bubblar até o navegador de abas; o caso que este hook
// cobre é o de tela sem histórico nenhum, onde nem chega a bubblar).
//
// ⚠️ A função `voltar` devolvida por este hook é SEGURA de chamar de dentro
// de um callback assíncrono — resultado de um diálogo, callback de um toast,
// o que for — mesmo tempo depois do render que criou o componente.
// router.canGoBack()/back()/replace() são lidos e despachados no MOMENTO em
// que voltar() é invocada, nunca capturados em variável de estado do corpo do
// componente.
//
// TASK-F06 (FEITA): as duas chamadas que ficavam dentro de callback de
// Alert.alert nativo — `pets/novo.tsx::handleSubmit` e
// `agenda/novo.tsx::handleSubmit` — migraram para o KDialog. A lógica de
// fallback NÃO foi reescrita, só o container: hoje elas são
// `const acao = await mostrar({...}); if (acao === 'OK') voltar();`.
// A comparação com 'OK' é deliberada (decisão I1 da F06): `alerta()` resolve
// também quando o diálogo é DISPENSADO sem escolha, e usar `alerta()` faria
// voltar() rodar no back-button do Android — coisa que o Alert nativo não
// fazia. Quem mexer aqui no futuro: continue não reescrevendo o fallback.
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

/**
 * Devolve uma função `voltar()` que substitui `router.back()` com uma rede
 * de segurança: se houver histórico de navegação, comporta-se exatamente
 * como `router.back()`; se não houver (tela alcançada por deep link ou
 * notificação push, sem stack para desempilhar), navega para
 * `destinoFallback` via `router.replace()`.
 *
 * ⚠️ O `router.back()` puro, sem esta rede, NÃO trava/congela o app quando
 * não há histórico — medido na fonte do expo-router (rodada de fix 1 da
 * TASK-F02): é no-op silencioso em produção, `console.error` em dev, só
 * lança sob `NODE_ENV=test`. O problema que este hook corrige é mais sutil
 * que um crash: o toque simplesmente não faz nada, sem feedback nenhum
 * pro usuário sobre por quê — daí "rede de segurança", não "correção de
 * crash".
 *
 * @param destinoFallback rota hierarquicamente correta para esta tela — ex.:
 *   a aba pai (`/(tabs)/pets`) ou a tela de entrada (`/login`). Cada
 *   chamador declara o seu; este hook não infere.
 */
export function useVoltar(destinoFallback: Href) {
  const router = useRouter();

  return function voltar() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(destinoFallback);
    }
  };
}
