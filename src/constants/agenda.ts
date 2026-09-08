/**
 * T-6 — grade de horários que a tela de agendamento oferece.
 *
 * ⚠️ Isto é **horário comercial da clínica**, não disponibilidade: dizer que existe
 * um encaixe às 09:00 é diferente de dizer que ele está livre. Quem responde "está
 * livre?" é `useHorariosOcupados`, que cruza esta grade com os agendamentos que a API
 * devolve.
 *
 * Fica em `constants/` porque é configuração de produto (mudou o expediente, muda
 * aqui), não dado do servidor. O que saiu da tela e **não** voltou foi o
 * `INDISPONIVEIS = new Set(['10:00','11:30','14:00','16:30'])`: aquilo eram horários
 * ocupados fixos no arquivo da tela, no fluxo principal do app — o tutor via como
 * "ocupado" um horário que nunca foi consultado em lugar nenhum.
 */
export const GRADE_HORARIOS_PADRAO = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
] as const;
