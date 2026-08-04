import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from './api/client';
import type { QueryClient } from '@tanstack/react-query';
import type { Router } from 'expo-router';
import type { PageRaw, NotificacaoRaw, MarcarLidaResponse } from '../types/api';
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

export async function getDeviceToken(): Promise<string | null> {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

export async function registerDeviceToken(token: string): Promise<void> {
  try {
    await apiClient.patch('/api/v1/tutor/me/push-token', {
      dsPushToken: token,
      dsPlatform: Platform.OS as 'ios' | 'android',
    });
  } catch {
    console.warn('[Push] push-token endpoint not yet available — mocked silently');
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
