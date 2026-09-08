// T-6 — os horários tomados passaram a ser derivados dos agendamentos reais.
//
// O que existia antes: `INDISPONIVEIS = new Set(['10:00','11:30','14:00','16:30'])`
// escrito dentro de `(tabs)/agenda/novo.tsx`. O tutor via 4 horários como ocupados
// sem que nada tivesse sido consultado — e um horário que ele MESMO acabara de
// marcar continuava aparecendo livre.
import { renderHook } from '@testing-library/react-native';
// `jest.mock` e icado acima dos imports pelo babel-jest, entao `useAgendamentos`
// ja chega aqui como dublê mesmo importado no topo.
import { useAgendamentos } from '../hooks/useAgendamentos';
import { useHorariosOcupados, horarioJaPassou } from '../hooks/useHorariosOcupados';
import { GRADE_HORARIOS_PADRAO } from '../constants/agenda';

jest.mock('../hooks/useAgendamentos', () => ({ useAgendamentos: jest.fn() }));
const useAgendamentosMock = useAgendamentos as unknown as jest.Mock;

/** Data local com hora cravada — nunca `Date` de string ISO com Z, que muda de dia por fuso. */
function em(ano: number, mes: number, dia: number, hora: number, minuto: number): Date {
  return new Date(ano, mes - 1, dia, hora, minuto, 0, 0);
}

const DIA = em(2026, 9, 20, 0, 0);

function agendamento(dt: Date, sgStatus = 'CONFIRMADO') {
  return { id: 1, dtInicio: dt.toISOString(), sgStatus };
}

describe('useHorariosOcupados', () => {
  beforeEach(() => useAgendamentosMock.mockReset());

  it('marca como ocupado o horário de um agendamento do mesmo dia', () => {
    useAgendamentosMock.mockReturnValue({ data: [agendamento(em(2026, 9, 20, 15, 0))], isLoading: false });
    const { result } = renderHook(() => useHorariosOcupados(DIA));
    expect(result.current.ocupados.has('15:00')).toBe(true);
    // Antitautologia: o Set não pode estar marcando tudo.
    expect(result.current.ocupados.has('15:30')).toBe(false);
  });

  it('ignora agendamento de outro dia', () => {
    useAgendamentosMock.mockReturnValue({ data: [agendamento(em(2026, 9, 21, 15, 0))], isLoading: false });
    const { result } = renderHook(() => useHorariosOcupados(DIA));
    expect(result.current.ocupados.size).toBe(0);
  });

  it('cancelado devolve o horário para a grade', () => {
    useAgendamentosMock.mockReturnValue({
      data: [agendamento(em(2026, 9, 20, 15, 0), 'CANCELADO')],
      isLoading: false,
    });
    const { result } = renderHook(() => useHorariosOcupados(DIA));
    expect(result.current.ocupados.has('15:00')).toBe(false);
  });

  it('sem dia selecionado, nada é ocupado', () => {
    useAgendamentosMock.mockReturnValue({ data: [agendamento(em(2026, 9, 20, 15, 0))], isLoading: false });
    const { result } = renderHook(() => useHorariosOcupados(undefined));
    expect(result.current.ocupados.size).toBe(0);
  });

  // A mordida do bug original: com os 4 horários fixos, marcar 15:00 não mudava
  // NADA na grade — o Set era constante do módulo. Aqui ele muda com o dado.
  it('um agendamento novo muda a grade, sem nada mais mudar', () => {
    useAgendamentosMock.mockReturnValue({ data: [], isLoading: false });
    const { result, rerender } = renderHook(() => useHorariosOcupados(DIA));
    expect(result.current.ocupados.has('15:00')).toBe(false);

    useAgendamentosMock.mockReturnValue({ data: [agendamento(em(2026, 9, 20, 15, 0))], isLoading: false });
    rerender({});
    expect(result.current.ocupados.has('15:00')).toBe(true);
  });
});

describe('horarioJaPassou', () => {
  const agora = em(2026, 9, 20, 14, 15);

  it('horário de hoje que já passou é recusado — o Java valida @Future e devolveria 400', () => {
    expect(horarioJaPassou(DIA, '13:00', agora)).toBe(true);
    expect(horarioJaPassou(DIA, '14:00', agora)).toBe(true);
  });

  it('horário de hoje ainda por vir continua ofertável', () => {
    expect(horarioJaPassou(DIA, '14:30', agora)).toBe(false);
    expect(horarioJaPassou(DIA, '17:30', agora)).toBe(false);
  });

  it('em outro dia nenhum horário conta como passado', () => {
    const amanha = em(2026, 9, 21, 0, 0);
    for (const hora of GRADE_HORARIOS_PADRAO) {
      expect(horarioJaPassou(amanha, hora, agora)).toBe(false);
    }
  });
});

describe('GRADE_HORARIOS_PADRAO', () => {
  it('continua sendo configuração de horário comercial, não disponibilidade', () => {
    expect(GRADE_HORARIOS_PADRAO).toHaveLength(16);
    expect(GRADE_HORARIOS_PADRAO.every(h => /^\d{2}:\d{2}$/.test(h))).toBe(true);
    // Sentinela do formato: o hook compara string com string, então um item fora
    // do padrão `HH:mm` nunca casaria com o horário derivado do agendamento.
    expect(GRADE_HORARIOS_PADRAO).toContain('09:00');
    expect(GRADE_HORARIOS_PADRAO).not.toContain('9:00');
  });
});
