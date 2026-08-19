// TASK-F04: 🔴 ESTE IMPORT TEM QUE SER O PRIMEIRO DO ARQUIVO, antes do
// `expo-notifications` logo abaixo. Os 2 avisos de push do Expo Go são emitidos
// na AVALIAÇÃO daquele módulo, e imports são avaliados na ordem em que aparecem —
// então o filtro só os alcança se for instalado antes. Não reordene.
//
// Medido: a primeira tentativa pôs este import no topo de `_layout.tsx` e PERDEU
// a corrida (a linha própria saiu 21 ms DEPOIS dos dois avisos, logcat em
// `g4c/f04-logcat-coldstart-DEPOIS.txt`) — o expo-router avalia outros módulos
// antes do layout raiz. Aqui, no único arquivo do app que importa
// `expo-notifications`, a ordem é garantida por construção, não por sorte.
import '../utils/silenciarAvisosPushExpoGo.fx';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from './api/client';
import type { QueryClient } from '@tanstack/react-query';
import type { Router } from 'expo-router';
import type { PageRaw, NotificacaoRaw, MarcarLidaResponse, RegisterPushTokenRequest } from '../types/api';
import { mapNotificacaoDto } from '../utils/mappers';

// ─── In-app notification history ─────────────────────────────────────────────

// TASK-31: GET agora é real (era ausente, sem NotificacaoController). NOTIFICACAO
// é .NET owned — leitura via Page, mapeada para o shape esperado pela tela.
export const getNotificacoes = () =>
  apiClient.get<PageRaw<NotificacaoRaw>>('/api/v1/tutor/notificacoes')
    .then(r => r.data.content.map(mapNotificacaoDto));

// TASK-31: decisão travada — sem PATCH marcar-lida no backend (NOTIFICACAO é
// .NET owned; Java nunca escreve nela). "Lida" vira estado local, só na sessão
// do app (o hook já faz update otimista da cache do react-query) — nenhuma
// chamada de rede é feita aqui de propósito.
export const marcarLida = async (id: number): Promise<MarcarLidaResponse> =>
  Promise.resolve({ id, flLida: true });

export const marcarTodasLidas = async (): Promise<{ count: number }> =>
  Promise.resolve({ count: 0 });

// ─── Push notifications ───────────────────────────────────────────────────────

export async function requestPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// TASK-70: consulta o status atual SEM disparar o prompt do SO — usada para a
// tela de perfil refletir a permissão real quando abre, em vez de um
// `value={false}` fixo que mentia independente do que o tutor já tinha concedido.
export async function getPermissionStatus(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function getDeviceToken(): Promise<string | null> {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

// TASK-70: o endpoint `PATCH /api/v1/tutor/me/push-token` EXISTE (Java,
// TutorBffController:154) e responde 204 — o `catch` antigo alegava o
// contrário ("endpoint not yet available") e por isso nunca foi corrigido.
// Devolve `boolean` (sucesso/falha) em vez de `void`: push é acessório e uma
// falha de registro não pode quebrar a tela, mas engolir em silêncio total
// foi exatamente o que escondeu por meses que esta função nunca era chamada
// em produção. O chamador decide o que fazer com `false` (hoje: nada de
// visível ao tutor, só log — ver justificativa completa no relatório da task).
// LGPD: o valor do token nunca é logado, aqui nem no console de erro abaixo —
// só status/code normalizados (nenhum dos dois carrega o token).
export async function registerDeviceToken(token: string): Promise<boolean> {
  try {
    // TASK-70: tipado contra RegisterPushTokenRequest (types/api.ts) — o DTO Java
    // (PushTokenRequest.java:19) declara `dsPlatforma` (PT-BR), não `dsPlatform`;
    // o nome antigo nunca teria passado da validação @NotBlank do campo real
    // (400, não 204). Divergência de contrato real, achada e corrigida nesta
    // task; a anotação de tipo aqui trava a regressão em tempo de compilação.
    const body: RegisterPushTokenRequest = { dsPushToken: token, dsPlatforma: Platform.OS as 'ios' | 'android' };
    await apiClient.patch('/api/v1/tutor/me/push-token', body);
    return true;
  } catch (err: any) {
    console.error('[Push] falha ao registrar push token — status:', err?.status, 'code:', err?.code);
    return false;
  }
}

export function setupHandlers(qc: QueryClient, router: Router): () => void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: true }),
  });

  const fgSub = Notifications.addNotificationReceivedListener(notification => {
    const tipo = notification.request.content.data?.dsTipo as string;
    const idPet = notification.request.content.data?.idPet as number | undefined;
    if (tipo === 'VACINA_VENCENDO' && idPet) qc.invalidateQueries({ queryKey: ['pets', idPet, 'vacinas'] });
    if (tipo?.startsWith('AGENDAMENTO')) qc.invalidateQueries({ queryKey: ['agendamentos'] });
    if (tipo === 'RETORNO_PENDENTE') qc.invalidateQueries({ queryKey: ['pets'] });
  });

  const tapSub = Notifications.addNotificationResponseReceivedListener(response => {
    const idPet = response.notification.request.content.data?.idPet;
    const idAgendamento = response.notification.request.content.data?.idAgendamento;
    if (idPet) router.push(`/(tabs)/pets/${idPet}` as any);
    else if (idAgendamento) router.push('/(tabs)/agenda' as any);
    else router.push('/(tabs)/pets' as any);
  });

  return () => { fgSub.remove(); tapSub.remove(); };
}
