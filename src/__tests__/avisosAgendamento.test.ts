// S4-MOB-03: notificação local por evento real — a clínica muda o status de um agendamento e o app do
// tutor avisa, uma vez só, sem avisar o que o próprio tutor fez e sem despejar avisos no primeiro login.
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { detectarMudancas, snapshotDe } from '../utils/mudancasAgendamento';
import { useAvisosAgendamento } from '../hooks/useAvisosAgendamento';
import { useCancelarAgendamento } from '../hooks/useAgendamentos';
import { useAuthStore } from '../store/authStore';
import { listAgendamentos, cancelarAgendamento } from '../services/agendamentos.service';
import { exibirNotificacaoLocal, requestPermission } from '../services/notifications.service';
import type { AgendamentoTutorResponse } from '../types/api';

jest.mock('../services/agendamentos.service', () => ({
  listAgendamentos: jest.fn(),
  solicitarAgendamento: jest.fn(),
  cancelarAgendamento: jest.fn(),
}));
jest.mock('../services/notifications.service', () => ({
  exibirNotificacaoLocal: jest.fn(() => Promise.resolve()),
  getPermissionStatus: jest.fn(() => Promise.resolve(false)),
  requestPermission: jest.fn(() => Promise.resolve(true)),
}));

const ag = (id: number, sgStatus: AgendamentoTutorResponse['sgStatus']): AgendamentoTutorResponse => ({
  id, sgStatus, dtInicio: '2026-11-05T14:30:00', nrDuracaoMinutos: 30, sgTipoConsulta: 'ROTINA',
  pet: { id: 9, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'SRD' }, nmClinica: 'Clínica KURA', dsMotivo: '',
});

describe('detectarMudancas (regra pura)', () => {
  it('primeira leitura do aparelho não avisa nada', () => {
    expect(detectarMudancas(null, [ag(1, 'CONFIRMADO')])).toEqual([]);
  });

  it('avisa a mudança de status feita pela clínica, com pet, data e clínica', () => {
    const [aviso, ...resto] = detectarMudancas({ '1': 'SOLICITADO' }, [ag(1, 'CONFIRMADO')]);
    expect(resto).toHaveLength(0);
    expect(aviso).toMatchObject({ idAgendamento: 1, titulo: 'Consulta confirmada' });
    expect(aviso!.corpo).toContain('Bóbi');
    expect(aviso!.corpo).toContain('Clínica KURA');
  });

  it('status igual, agendamento novo ou volta para SOLICITADO não avisam', () => {
    expect(detectarMudancas({ '1': 'CONFIRMADO' }, [ag(1, 'CONFIRMADO'), ag(2, 'SOLICITADO')])).toEqual([]);
    expect(detectarMudancas({ '1': 'AGENDADO' }, [ag(1, 'SOLICITADO')])).toEqual([]);
  });

  it('cada transição relevante tem o seu título', () => {
    const titulos = (['AGENDADO', 'CANCELADO', 'CONCLUIDO'] as const)
      .map(s => detectarMudancas({ '1': 'SOLICITADO' }, [ag(1, s)])[0]?.titulo);
    expect(titulos).toEqual(['Horário marcado pela clínica', 'Consulta cancelada pela clínica', 'Atendimento concluído']);
  });

  it('snapshotDe indexa por id', () => {
    expect(snapshotDe([ag(1, 'AGENDADO'), ag(2, 'CANCELADO')])).toEqual({ '1': 'AGENDADO', '2': 'CANCELADO' });
  });
});

describe('useAvisosAgendamento (integração com a consulta e o armazenamento)', () => {
  const memoria: Record<string, string> = {};
  let qc: QueryClient;
  const wrapper = ({ children }: any) => React.createElement(QueryClientProvider, { client: qc }, children);
  const exibir = exibirNotificacaoLocal as jest.Mock;

  beforeEach(() => {
    for (const k of Object.keys(memoria)) delete memoria[k];
    (AsyncStorage.getItem as jest.Mock).mockImplementation((k: string) => Promise.resolve(memoria[k] ?? null));
    (AsyncStorage.setItem as jest.Mock).mockImplementation((k: string, v: string) => { memoria[k] = v; return Promise.resolve(); });
    exibir.mockClear();
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useAuthStore.setState({ token: 'jwt', expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      tutor: { id: 7, nmTutor: 'Ana', dsEmail: 'a@b.com', dsTelefone: '', dtCadastro: '' } });
  });

  // gcTime do QueryClient (5 min) seguraria o processo do Jest aberto depois da suíte.
  afterEach(() => qc.clear());

  async function recarregar() {
    await act(async () => { await qc.refetchQueries({ queryKey: ['agendamentos'] }); });
  }

  it('a clínica confirma => 1 notificação que leva à agenda; a mesma resposta de novo não repete', async () => {
    (listAgendamentos as jest.Mock).mockResolvedValue([ag(1, 'AGENDADO')]);
    renderHook(() => useAvisosAgendamento(), { wrapper });
    await waitFor(() => expect(memoria.KURA_TUTOR_AGEND_VISTOS_7).toBe('{"1":"AGENDADO"}'));
    expect(exibir).not.toHaveBeenCalled();
    expect(requestPermission).toHaveBeenCalled();

    (listAgendamentos as jest.Mock).mockResolvedValue([ag(1, 'CONFIRMADO')]);
    await recarregar();
    await waitFor(() => expect(exibir).toHaveBeenCalledTimes(1));
    expect(exibir).toHaveBeenCalledWith('Consulta confirmada', expect.any(String), { dsTipo: 'AGENDAMENTO_STATUS', idAgendamento: 1 });

    await recarregar();
    await waitFor(() => expect(memoria.KURA_TUTOR_AGEND_VISTOS_7).toBe('{"1":"CONFIRMADO"}'));
    expect(exibir).toHaveBeenCalledTimes(1);
  });

  it('cancelamento feito pelo próprio tutor não vira aviso', async () => {
    (listAgendamentos as jest.Mock).mockResolvedValue([ag(1, 'AGENDADO')]);
    (cancelarAgendamento as jest.Mock).mockResolvedValue(undefined);
    const { result } = renderHook(() => { useAvisosAgendamento(); return useCancelarAgendamento(); }, { wrapper });
    await waitFor(() => expect(memoria.KURA_TUTOR_AGEND_VISTOS_7).toBe('{"1":"AGENDADO"}'));

    (listAgendamentos as jest.Mock).mockResolvedValue([ag(1, 'CANCELADO')]);
    await act(async () => { await result.current.mutateAsync(1); });
    await waitFor(() => expect(memoria.KURA_TUTOR_AGEND_VISTOS_7).toBe('{"1":"CANCELADO"}'));
    expect(exibir).not.toHaveBeenCalled();
  });

  it('sem sessão não consulta a API', async () => {
    useAuthStore.setState({ token: null, tutor: null });
    (listAgendamentos as jest.Mock).mockClear();
    renderHook(() => useAvisosAgendamento(), { wrapper });
    await act(async () => { await Promise.resolve(); });
    expect(listAgendamentos).not.toHaveBeenCalled();
  });
});
