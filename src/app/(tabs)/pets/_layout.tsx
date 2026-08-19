import { Stack } from 'expo-router';

// TASK-F11: ancora o Stack na lista de pets. Sem isto, um deep link/push frio
// direto em `pets/[id]` nasce com UMA única entrada na pilha — o VOLTAR físico
// do Android não tem para onde desempilhar, bubbla ao TabRouter (cujo
// `firstRoute` já é a própria aba `pets`) e o Android encerra a Activity: o app
// FECHA. Com a âncora, o expo-router insere `index` abaixo da rota profunda.
// Verificado na fonte instalada (expo-router 6.0.23,
// `build/getRoutesCore.js:625` e `:679`): `unstable_settings.anchor` é lido com
// precedência e `initialRouteName` permanece como alias aceito.
export const unstable_settings = { anchor: 'index' };

export default function PetsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
