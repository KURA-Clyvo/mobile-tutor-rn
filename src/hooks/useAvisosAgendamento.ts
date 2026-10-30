import { useEffect, useRef } from 'react';
import { useAgendamentos } from './useAgendamentos';
import { useAuthStore } from '../store/authStore';
import { detectarMudancas, snapshotDe } from '../utils/mudancasAgendamento';
import { lerStatusVistos, gravarStatusVistos } from '../services/avisosAgendamento.service';
import { exibirNotificacaoLocal, getPermissionStatus, requestPermission } from '../services/notifications.service';

// S4-MOB-03: notificação local por EVENTO REAL. Com sessão aberta, consulta os agendamentos a cada 20 s;
// quando a clínica muda o status de um deles (confirma, marca, cancela, conclui), o aparelho avisa.
// O toque é tratado em setupHandlers (idAgendamento => aba Agenda).
// ponytail: polling só com o app aberto; aviso com o app fechado exigiria push enviado pelo backend.
export const INTERVALO_AVISOS_MS = 20_000;

export function useAvisosAgendamento() {
  const token = useAuthStore(s => s.token);
  const idTutor = useAuthStore(s => s.tutor?.id);
  const logado = Boolean(token && idTutor);
  const { data } = useAgendamentos({ enabled: logado, refetchInterval: logado ? INTERVALO_AVISOS_MS : undefined });
  // Fila: duas respostas seguidas não podem ler o mesmo snapshot antigo e avisar em dobro.
  const fila = useRef<Promise<void>>(Promise.resolve());

  // Android 13+ só exibe notificação com permissão concedida; pede uma vez por login.
  useEffect(() => {
    if (!logado) return;
    void getPermissionStatus().then(ok => (ok ? undefined : requestPermission())).catch(() => undefined);
  }, [logado]);

  useEffect(() => {
    if (!data || !idTutor) return;
    fila.current = fila.current.then(async () => {
      const anterior = await lerStatusVistos(idTutor);
      const avisos = detectarMudancas(anterior, data);
      // Grava ANTES de exibir: se a exibição falhar, o mesmo aviso não se repete a cada 20 s.
      await gravarStatusVistos(idTutor, { ...anterior, ...snapshotDe(data) });
      for (const a of avisos) {
        await exibirNotificacaoLocal(a.titulo, a.corpo, { dsTipo: 'AGENDAMENTO_STATUS', idAgendamento: a.idAgendamento });
      }
    }).catch(err => console.error('[Avisos] falha ao processar agendamentos:', err?.message));
  }, [data, idTutor]);
}
