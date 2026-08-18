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
// ⚠️ Nota para a F06 (migração de Alert.alert para componente próprio):
// a função `voltar` devolvida por este hook é SEGURA de chamar de dentro
// de um callback assíncrono — onPress de um botão de Alert, callback de
// um toast, o que for — mesmo tempo depois do render que criou o
// componente. router.canGoBack()/back()/replace() são lidos e despachados
// no MOMENTO em que voltar() é invocada, nunca capturados em variável de
// estado do corpo do componente no momento do toque. Ao migrar as duas
// chamadas dentro de Alert.alert (pets/novo.tsx:71, agenda/novo.tsx:65)
// para o componente novo, basta trocar o onPress por `() => voltar()` —
// NÃO é preciso (nem deve) reescrever a lógica de fallback.
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
