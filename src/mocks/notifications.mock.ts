import type { PageRaw, NotificacaoRaw } from '../types/api';

// TASK-65 (FIX_5): list() devolvia NotificacaoTutorResponse[] (app-facing) direto,
// mas getNotificacoes() espera PageRaw<NotificacaoRaw> (Spring Data Page) e
// desembrulha com `r.data.content.map(mapNotificacaoDto)` — `r.data.content` batia
// undefined e o `.map` lançava TypeError. Mesma classe do B0.1 (register/auth.mock).
// BR-TUT-T10: o domínio real tem lembrete de vacina (dsTipo LEMBRETE_VACINA, que a Luna grava) e avisos genéricos
// (sem tipo — o Java de hoje não manda tipo). Nada de tipos que o servidor não produz.
export async function list(): Promise<PageRaw<NotificacaoRaw>> {
  const agora = Date.now();
  const content: NotificacaoRaw[] = [
    { idNotificacao: 1, dsTitulo: 'Vacina vencendo', dsMensagem: 'A Gripe Canina do Bóbi vence em 20 dias. Agende já!', dtCriacao: new Date(agora - 3600_000).toISOString(), flLida: false, dsTipo: 'LEMBRETE_VACINA', idPet: 1 },
    { idNotificacao: 2, dsTitulo: 'Aviso da clínica', dsMensagem: 'A clínica funciona em horário reduzido no feriado.', dtCriacao: new Date(agora - 7200_000).toISOString(), flLida: false },
    { idNotificacao: 3, dsTitulo: 'Agendamento confirmado', dsMensagem: 'Check-up da Luna confirmado para daqui 7 dias.', dtCriacao: new Date(agora - 86400_000).toISOString(), flLida: true },
  ];
  return { content, totalElements: content.length, totalPages: 1, number: 0, size: content.length };
}
