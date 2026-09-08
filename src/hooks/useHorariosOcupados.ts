import { useMemo } from 'react';
import { useAgendamentos } from './useAgendamentos';

/** `HH:mm` no relógio local — o mesmo formato das entradas de `GRADE_HORARIOS_PADRAO`. */
function paraHoraLocal(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** `YYYY-MM-DD` local (não UTC): é a chave de "mesmo dia" que o tutor enxerga. */
function chaveDoDia(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * T-6 — quais horários da grade já estão tomados no dia escolhido.
 *
 * Substitui o `INDISPONIVEIS` literal que morava em `agenda/novo.tsx`: agora o
 * "ocupado" é **derivado** dos agendamentos que o `GET /v1/tutor/agendamentos` já
 * devolve, então marcar um horário faz ele sumir da grade na hora — a mesma
 * `queryKey ['agendamentos']` que as mutações invalidam, sem reiniciar o app.
 *
 * 🔴 **Limite declarado:** o app só enxerga os agendamentos DESTE tutor. Isto não é
 * a agenda da clínica — um horário livre aqui pode estar ocupado por outro tutor, e
 * a clínica é quem confirma (o agendamento nasce como solicitação). Não existe
 * endpoint de disponibilidade hoje, e inventar um "livre" que o servidor não
 * sustenta seria pior que o `INDISPONIVEIS` fixo que esta task removeu.
 *
 * Agendamento cancelado não ocupa nada — o horário volta para a grade.
 */
export function useHorariosOcupados(dia: Date | undefined) {
  const { data = [], isLoading } = useAgendamentos();
  const chave = dia ? chaveDoDia(dia) : null;

  const ocupados = useMemo(() => {
    if (!chave) return new Set<string>();
    return new Set(
      data
        .filter(a => a.sgStatus !== 'CANCELADO')
        .map(a => new Date(a.dtInicio))
        .filter(d => chaveDoDia(d) === chave)
        .map(paraHoraLocal),
    );
    // `chave` no lugar de `dia`: a tela monta um `Date` novo a cada render, e
    // depender do objeto recalcularia o Set sempre, sem nunca mudar de resultado.
  }, [data, chave]);

  return { ocupados, isLoading };
}

/**
 * Horário que já passou não pode ser oferecido: o Java valida `dtAgendamento` com
 * `@Future` (`AgendamentoRequest`), então um slot no passado é 400 garantido — o
 * tutor levaria um erro genérico por uma escolha que a tela deixou ele fazer.
 * Só se aplica ao dia de hoje; para os outros dias da grade, nada é passado.
 */
export function horarioJaPassou(dia: Date | undefined, hora: string, agora: Date = new Date()): boolean {
  if (!dia || chaveDoDia(dia) !== chaveDoDia(agora)) return false;
  const [h, m] = hora.split(':').map(Number);
  const quando = new Date(dia);
  quando.setHours(h!, m!, 0, 0);
  return quando.getTime() <= agora.getTime();
}
