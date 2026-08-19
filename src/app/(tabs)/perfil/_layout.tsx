import { Stack } from 'expo-router';

// TASK-F11: `perfil/consentimentos` também é empilhável. Medido antes do fix:
// deep link frio em `/--/perfil/consentimentos` + VOLTAR NÃO fechava o app —
// caía na aba Pets (`firstRoute` do TabRouter), porque a aba corrente não era a
// primeira. Sintoma diferente do de `pets/`, mesma causa (pilha com uma só
// entrada), mesma correção.
export const unstable_settings = { anchor: 'index' };

export default function PerfilLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
