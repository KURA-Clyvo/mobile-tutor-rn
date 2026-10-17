export function greetingPT(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** `YYYY-MM-DD` é data de calendário LOCAL (o `Date` nativo a leria como UTC e recuaria um dia em São Paulo); o resto vai como está. */
export function parseData(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s);
}

export function formatDateBR(iso: string): string {
  return parseData(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateShortBR(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

export function formatTimeBR(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const doisDig = (n: number) => String(n).padStart(2, '0');

/**
 * "Hoje · 06:23", "Ontem · 08:23", "12 out · 14:32" (com ano se não for o corrente). BR-TUT-T10.
 * FUSO: `dtCriacao` do Java é LocalDateTime SEM fuso — `new Date()` o lê como relógio de parede do aparelho
 * (= São Paulo para o tutor); com `Z`/offset vale o instante. "Hoje/Ontem" compara o dia de calendário local.
 */
export function formatQuandoBR(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hora = `${doisDig(d.getHours())}:${doisDig(d.getMinutes())}`;
  const dia = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dias = Math.round((dia(now) - dia(d)) / 86_400_000);
  if (dias === 0) return `Hoje · ${hora}`;
  if (dias === 1) return `Ontem · ${hora}`;
  const data = `${d.getDate()} ${MES_CURTO[d.getMonth()]}${d.getFullYear() === now.getFullYear() ? '' : ` ${d.getFullYear()}`}`;
  return `${data} · ${hora}`;
}

export function addDays(base: Date, n: number): Date {
  const d = new Date(base); d.setDate(d.getDate() + n); return d;
}

export function isFuture(iso: string): boolean {
  return new Date(iso).getTime() > Date.now();
}

// ÂNCORA (regra 11): cópia de mobile-clinica-rn `src/utils/date.ts`, linhas 167-183 (comentário + função), commit 773ae66,
// conferida em 2026-10-15:
//   git -C mobile-clinica-rn show 773ae66:src/utils/date.ts | sed -n '167,183p'
// Sem divergência de lógica (comentário encurtado). Usada pela faixa "dados salvos" de `QueryState` (BR-TUT-T03).
// Tempo relativo ("há 5min", "há 2h", "há 3d"). Nunca lança para instante futuro (relógio de servidor à frente do
// dispositivo) — devolve "agora" em vez de "há -1min". Aceita `Date | string`: o cache persistido (JSON) devolve
// `Date` como string ISO na reidratação (`date.getTime is not a function` derrubava a tela na clínica).
export function formatRelativeTime(date: Date | string, now: Date = new Date()): string {
  const instante = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - instante.getTime();
  if (Number.isNaN(diffMs)) return '';
  if (diffMs < 60_000) return 'agora';
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `há ${diffHoras}h`;
  const diffDias = Math.floor(diffHoras / 24);
  return `há ${diffDias}d`;
}
