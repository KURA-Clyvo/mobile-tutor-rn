import { Stack } from 'expo-router';

// TASK-F11: mesma âncora do `pets/_layout.tsx` — `agenda/novo` é empilhável e,
// num deep link frio, nasceria como única entrada da pilha.
export const unstable_settings = { anchor: 'index' };

export default function AgendaLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
