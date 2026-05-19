import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from './api/client';
import type { QueryClient } from '@tanstack/react-query';
import type { Router } from 'expo-router';

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
    // Pending — mock succeeds silently (pendency #6 in PLAN-B.md)
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
