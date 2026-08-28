// `utils/date.ts` era o unico modulo de logica pura do projeto abaixo de 60% de
// cobertura (53.8% stmts): `addDays` e `formatDateShortBR` nao tinham nenhum caminho
// exercitado. Sao 6 funcoes usadas por 12 arquivos.
//
// O fuso e America/Sao_Paulo, fixado em `jest.global-setup.js` antes de os workers
// subirem — sem isso as asserções de conversao UTC->local abaixo mudariam de maquina
// para maquina (e o CI roda em UTC).
import { greetingPT, formatDateBR, formatDateShortBR, formatTimeBR, addDays, isFuture } from '../utils/date';

// 2026-03-09T14:35Z = 11:35 em Sao Paulo (UTC-3). A diferenca de data/hora entre os dois
// e o que torna estes casos significativos: um bug de fuso mudaria o resultado.
const ISO = '2026-03-09T14:35:00.000Z';

describe('formatação (pt-BR, America/Sao_Paulo)', () => {
  it('formatDateBR devolve dia, mes abreviado e ano', () => {
    expect(formatDateBR(ISO)).toBe('09 de mar. de 2026');
  });

  it('formatDateShortBR omite o ano e tira o ponto da abreviação do mês', () => {
    expect(formatDateShortBR(ISO)).toBe('09 de mar');
  });

  it('formatDateShortBR aceita Date, não só string ISO', () => {
    expect(formatDateShortBR(new Date(ISO))).toBe('09 de mar');
  });

  it('formatTimeBR converte de UTC para o horário local', () => {
    expect(formatTimeBR(ISO)).toBe('11:35'); // 14:35Z - 3h
  });
});

describe('addDays', () => {
  it('soma dias sem mutar a data recebida', () => {
    const base = new Date('2026-03-09T12:00:00.000Z');
    const depois = addDays(base, 5);

    expect(depois.getDate()).toBe(14);
    expect(base.getDate()).toBe(9); // a original nao pode ter mudado
  });

  it('atravessa a virada de mês', () => {
    expect(addDays(new Date('2026-03-30T12:00:00.000Z'), 3).getMonth()).toBe(3); // abril
  });

  it('aceita n negativo', () => {
    expect(addDays(new Date('2026-03-09T12:00:00.000Z'), -10).getMonth()).toBe(1); // fevereiro
  });
});

describe('isFuture', () => {
  it('é verdadeiro para data adiante e falso para data passada', () => {
    expect(isFuture(new Date(Date.now() + 60_000).toISOString())).toBe(true);
    expect(isFuture(new Date(Date.now() - 60_000).toISOString())).toBe(false);
  });
});

describe('greetingPT', () => {
  // A saudação depende da hora do RELÓGIO, então os 3 ramos só são alcançáveis com o
  // tempo controlado — sem fake timers o teste passaria a testar a hora da máquina.
  afterEach(() => jest.useRealTimers());

  it.each([
    ['08:00', 'Bom dia'],
    ['13:00', 'Boa tarde'],
    ['21:00', 'Boa noite'],
  ])('às %s devolve "%s"', (hora, esperado) => {
    jest.useFakeTimers().setSystemTime(new Date(`2026-03-09T${hora}:00-03:00`));
    expect(greetingPT()).toBe(esperado);
  });
});
