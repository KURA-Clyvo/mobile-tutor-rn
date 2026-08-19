import { isRunningInExpoGo } from 'expo';

// TASK-F04 — silencia os DOIS avisos de push do `expo-notifications` em Expo Go.
//
// POR QUE UM MÓDULO DE EFEITO COLATERAL (sufixo `.fx`, a mesma convenção da Expo):
// os dois avisos são emitidos durante a AVALIAÇÃO DO MÓDULO `expo-notifications`,
// não em chamada. Medido em runtime pelo call stack do LogBox (a prova está em
// `task-F04-report.md` §1) e confirmado na fonte instalada:
//
//   index.ts  →  getExpoPushTokenAsync.ts:5  →  DevicePushTokenAutoRegistration.fx.ts
//   e ali, em ESCOPO DE MÓDULO (linhas 83-86), um `addPushTokenListener(...)`
//   que chama `warnOfExpoGoPushUsage()` → `console.error` no Android.
//
// Consequência prática: não existe "pular a chamada de getExpoPushTokenAsync" que
// resolva. Quem importa `expo-notifications` já pagou os dois avisos.
//
// 🔴 POR ISSO A ORDEM DO IMPORT EM `_layout.tsx` É LOAD-BEARING: este módulo tem
// que ser avaliado ANTES de `services/notifications.service`, que é quem puxa
// `expo-notifications`. Se alguém reordenar os imports (ou um formatador o fizer),
// o filtro passa a ser instalado tarde demais e os avisos voltam — em silêncio.
//
// POR QUE FILTRAR NO `console` E NÃO NO LogBox: o LogBox é alimentado PELO
// `console.error` (stack medido: console.level → reactConsoleErrorHandler →
// addConsoleLog). Filtrar no console mata o toast vermelho E a linha no terminal
// de uma vez; `LogBox.ignoreLogs` esconderia só o toast e deixaria o terminal sujo.
//
// O QUE ISTO NÃO FAZ: não faz push remoto funcionar em Expo Go — isso é impossível
// desde o SDK 53, por decisão da Expo. Isto some com o RUÍDO, não com a limitação.
// Notificação local e os listeners de toque continuam funcionando normalmente.

const PADROES_SILENCIADOS = [
  'expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go',
  '`expo-notifications` functionality is not fully supported in Expo Go',
];

/** Verdadeiro só para os 2 avisos de push do Expo Go — qualquer outra coisa passa. */
export function ehAvisoDePushDoExpoGo(args: unknown[]): boolean {
  const primeiro = args[0];
  if (typeof primeiro !== 'string') return false;
  return PADROES_SILENCIADOS.some(padrao => primeiro.includes(padrao));
}

type MetodoConsole = (...args: unknown[]) => void;
export type ConsoleFiltravel = { error: MetodoConsole; warn: MetodoConsole; log: MetodoConsole };

/**
 * Envolve `error` e `warn` do console recebido, descartando apenas os 2 avisos de
 * push do Expo Go e imprimindo uma única linha própria no lugar. Exportada (em vez
 * de embutida) para ser exercitável por teste com um console falso.
 */
export function aplicarFiltroDeAvisosPush(alvo: ConsoleFiltravel): void {
  const errorOriginal = alvo.error.bind(alvo);
  const warnOriginal = alvo.warn.bind(alvo);

  alvo.error = (...args: unknown[]) => {
    if (ehAvisoDePushDoExpoGo(args)) return;
    errorOriginal(...args);
  };
  alvo.warn = (...args: unknown[]) => {
    if (ehAvisoDePushDoExpoGo(args)) return;
    warnOriginal(...args);
  };

  // A "linha própria deliberada" que o critério B0.3 do G4c admite no lugar do
  // aviso original. `log` de propósito: `warn`/`error` gerariam outro toast.
  alvo.log(
    '[KURA] Expo Go: push remoto indisponível (limitação do SDK 53+). ' +
      'Notificação local e navegação por toque seguem funcionando. Avisos do expo-notifications silenciados — ver TASK-F04.',
  );
}

if (__DEV__ && isRunningInExpoGo()) {
  aplicarFiltroDeAvisosPush(console);
}
