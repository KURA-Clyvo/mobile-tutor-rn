import type { PageRaw, NotificacaoRaw } from '../types/api';

// TASK-65 (FIX_5): list() devolvia NotificacaoTutorResponse[] (app-facing) direto,
// mas getNotificacoes() espera PageRaw<NotificacaoRaw> (Spring Data Page) e
// desembrulha com `r.data.content.map(mapNotificacaoDto)` — `r.data.content` batia
// undefined e o `.map` lançava TypeError. Mesma classe do B0.1 (register/auth.mock).
export async function list(): Promise<PageRaw<NotificacaoRaw>> {
  const content: NotificacaoRaw[] = [
    { idNotificacao: 1, dsTitulo: 'Retorno do Bóbi', dsMensagem: 'Bóbi tem retorno marcado em 2 dias. Não esqueça!', dtCriacao: new Date(Date.now() - 3600_000).toISOString(), flLida: false },
    { idNotificacao: 2, dsTitulo: 'Vacina vencendo', dsMensagem: 'A Gripe Canina do Bóbi vence em 20 dias. Agende já!', dtCriacao: new Date(Date.now() - 7200_000).toISOString(), flLida: false },
    { idNotificacao: 3, dsTitulo: 'Agendamento confirmado', dsMensagem: 'Check-up da Luna confirmado para daqui 7 dias.', dtCriacao: new Date(Date.now() - 86400_000).toISOString(), flLida: true },
  ];
  return { content, totalElements: content.length, totalPages: 1, number: 0, size: content.length };
}
