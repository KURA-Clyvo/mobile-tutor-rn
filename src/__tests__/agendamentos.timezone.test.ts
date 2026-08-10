// TASK-74b (FIX_7, rodada de fix 1 + 2) — prova de mordida do bug de fuso horário.
//
// `dtAgendamento` é `LocalDateTime` no Java — relógio de parede, SEM fuso.
// `agenda/novo.tsx::dtPreferida` monta um `Date` com o horário LOCAL que o tutor
// escolheu (via `setHours`) e serializa com `.toISOString()` — que converte para
// UTC. Antes da rodada 1, `agendamentos.service.ts` mandava esse `Z`-string
// direto como `dtAgendamento`. O Jackson do Java desserializa um `Z`-string de
// forma leniente e DESCARTA o offset em silêncio
// (`LocalDateTime.ofInstant(Instant.parse(...), ZoneOffset.UTC)`) — sem 400, sem
// crash: o servidor grava a hora UTC como se fosse a hora local. Em UTC-3
// (Brasil), um tutor que escolhe 10:30 fazia o servidor gravar 13:30. Achado pela
// revisão da rodada 1 (commit `5bb05d7`), com `TZ=America/Sao_Paulo` confirmado.
//
// SOBRE COMO O FUSO É FIXADO NESTE ARQUIVO — leia antes de mexer aqui:
//
// Tentativa que NÃO funciona (testada e descartada na rodada 1): mutar
// `process.env.TZ` em tempo de execução dentro do próprio arquivo de teste
// (`beforeAll`/dentro do `it`). Verificado empiricamente com um teste de
// diagnóstico: o V8 de um worker do Jest (preset `jest-expo`) resolve e cacheia o
// fuso do processo na primeira chamada a `Date`/`Intl`, disparada pelo bootstrap
// do jest-expo antes do corpo deste arquivo rodar, e ignora qualquer mutação
// posterior de `process.env.TZ` feita de DENTRO do próprio processo do worker.
//
// Solução que FUNCIONA e é a usada aqui (rodada 2): `jest.global-setup.js`, que
// roda no processo PRINCIPAL do Jest ANTES de qualquer worker subir. Mutar
// `process.env.TZ` ali é herdado pelos workers no momento em que sobem — o fuso
// fica fixado em `America/Sao_Paulo` mesmo que o processo que invocou `npx jest`
// tenha outro `TZ` no ambiente (verificado: `TZ=UTC npx jest ...` passa igual,
// porque o `globalSetup` VENCE). Isso é o que torna a suíte determinística num
// runner de CI que rode em UTC por padrão (ubuntu-latest, o caso deste repo).
//
// SOBRE O ORÁCULO — por que os valores esperados abaixo são LITERAIS, não
// calculados a partir de `Date`: com o fuso agora garantidamente fixo (por
// `globalSetup`, não por sorte da máquina), o oráculo mais honesto é um literal
// cru, independente de qualquer getter local. Uma versão anterior deste arquivo
// calculava o "esperado" chamando os mesmos getters locais
// (`getFullYear`/`getHours`/...) que `paraLocalDateTimeJava` usa — o que
// funcionava para pegar a classe de bug da rodada 1 (mandar o `Z`-string cru sem
// nenhuma reconstrução), mas comparava a implementação com uma cópia quase
// idêntica da própria lógica dela, não com um valor independente. Literais fixos
// não têm esse problema: `dtPreferida` (o instante em UTC) e `dtAgendamento`
// esperado (o mesmo instante em relógio de parede local) são escritos à mão,
// verificados por aritmética simples (UTC-3, Brasil não tem horário de verão
// desde 2019 — sem ambiguidade sazonal) e batidos independentemente do código de
// produção.
import { solicitarAgendamento } from '../services/agendamentos.service';
import { apiClient } from '../services/api/client';

jest.mock('../services/api/client', () => ({
  apiClient: { post: jest.fn() },
}));

describe('agendamentos.service — fuso horário de dtAgendamento (TASK-74b)', () => {
  beforeEach(() => {
    (apiClient.post as jest.Mock).mockReset();
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: { id: 42, sgStatus: 'SOLICITADO', dtSolicitacao: new Date().toISOString() },
    });
  });

  it('precondição: o fuso do processo está fixado em America/Sao_Paulo (jest.global-setup.js) — se isto falhar, os testes abaixo não têm mordida', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Sao_Paulo');
  });

  it('o horário que sai no corpo do POST é o mesmo que o tutor escolheu na tela, dígito a dígito (não a hora UTC) — oráculo literal', async () => {
    // Simula agenda/novo.tsx::dtPreferida (linhas 39-45): tutor escolhe
    // 2026-08-11, slot 10:30, no fuso America/Sao_Paulo (UTC-3).
    // 10:30 -03:00 == 13:30 UTC — conferido à mão, sem chamar nenhum getter.
    const dtPreferida = '2026-08-11T13:30:00.000Z';

    await solicitarAgendamento({
      idPet: 1, sgTipoConsulta: 'ROTINA', dsMotivo: 'Check-up anual', dtPreferida,
    });
    const body = (apiClient.post as jest.Mock).mock.calls[0]![1];

    expect(body.dtAgendamento).toBe('2026-08-11T10:30:00'); // hora ESCOLHIDA pelo tutor, literal cru
    expect(body.dtAgendamento.endsWith('Z')).toBe(false);
    expect(body.dtAgendamento).not.toMatch(/[+-]\d{2}:\d{2}$/); // sem offset explícito também
  });

  it('meia-noite local (fronteira de virada de dia em UTC) preserva a data/hora locais, não as de UTC — oráculo literal', async () => {
    // Tutor escolhe 2026-08-11, 00:30 local. Em UTC-3 isso é 03:30 UTC do MESMO
    // dia civil (não atravessa a virada) — conferido à mão.
    const dtPreferida = '2026-08-11T03:30:00.000Z';

    await solicitarAgendamento({ idPet: 1, sgTipoConsulta: 'ROTINA', dsMotivo: 'x', dtPreferida });
    const body = (apiClient.post as jest.Mock).mock.calls[0]![1];
    expect(body.dtAgendamento).toBe('2026-08-11T00:30:00');
  });

  it('virada de dia: 21:30 local do dia 10 é 00:30 UTC do dia 11 — o dia civil correto é o LOCAL, não o de UTC', async () => {
    // Caso de borda oposto ao anterior: aqui a conversão pra UTC ATRAVESSA a
    // virada de dia (21:30 do dia 10 em UTC-3 vira 00:30 UTC do dia 11). Se o
    // service usasse getters de UTC em vez de locais para reconstruir a data (um
    // jeito diferente de reintroduzir o mesmo bug), a data civil sairia errada
    // aqui mesmo que a hora batesse.
    const dtPreferida = '2026-08-11T00:30:00.000Z'; // 2026-08-10T21:30:00 local (UTC-3)

    await solicitarAgendamento({ idPet: 1, sgTipoConsulta: 'ROTINA', dsMotivo: 'x', dtPreferida });
    const body = (apiClient.post as jest.Mock).mock.calls[0]![1];
    expect(body.dtAgendamento).toBe('2026-08-10T21:30:00');
  });
});
