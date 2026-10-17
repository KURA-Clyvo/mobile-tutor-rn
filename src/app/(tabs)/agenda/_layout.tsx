import { Stack } from 'expo-router';

// TASK-F11: mesma âncora do `pets/_layout.tsx`. BR-TUT-G4 C-1: o formulário `agenda/novo` saiu desta pilha
// (mora em `src/app/agenda/novo.tsx`, na raiz) para não ficar preso na aba Agenda quando aberto de outra aba.
export const unstable_settings = { anchor: 'index' };

export default function AgendaLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
