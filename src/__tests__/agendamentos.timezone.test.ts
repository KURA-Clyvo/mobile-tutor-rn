// TASK-74b (FIX_7, rodada de fix 1) — prova de mordida do bug de fuso horário.
//
// `dtAgendamento` é `LocalDateTime` no Java — relógio de parede, SEM fuso.
// `agenda/novo.tsx::dtPreferida` monta um `Date` com o horário LOCAL que o tutor
// escolheu (via `setHours`) e serializa com `.toISOString()` — que converte para
// UTC. Antes desta rodada, `agendamentos.service.ts` mandava esse `Z`-string
// direto como `dtAgendamento`. O Jackson do Java desserializa um `Z`-string de
// forma leniente e DESCARTA o offset em silêncio
// (`LocalDateTime.ofInstant(Instant.parse(...), ZoneOffset.UTC)`) — sem 400, sem
// crash: o servidor grava a hora UTC como se fosse a hora local. Em UTC-3
// (Brasil), um tutor que escolhe 10:30 fazia o servidor gravar 13:30. Achado pela
// revisão da rodada 1 (commit `5bb05d7`), com `TZ=America/Sao_Paulo` confirmado.
//
// SOBRE COMO O FUSO É FIXADO NESTE ARQUIVO — leia antes de mexer aqui:
// mutar `process.env.TZ` em tempo de execução (`beforeAll`/dentro do `it`) NÃO
// funciona neste ambiente de Jest — verificado empiricamente (rodada de fix 1):
// o V8 deste worker resolve e cacheia o fuso na primeira chamada a `Date`/`Intl`
// do processo (disparada pelo bootstrap do jest-expo antes deste arquivo rodar) e
// ignora qualquer mudança posterior a `process.env.TZ`. A ÚNICA forma confiável de
// fixar o fuso é a variável de ambiente do PROCESSO que invoca o Jest, antes dele
// iniciar:
//
//   TZ=America/Sao_Paulo npx jest src/__tests__/agendamentos.timezone.test.ts
//
// Por isso este arquivo NÃO tenta mutar `process.env.TZ` — em vez de fixar um
// nome de fuso hardcoded (que só teria mordida real se alguém lembrasse de
// invocar o Jest com a env var certa), ele: (1) calcula o valor esperado a partir
// dos getters LOCAIS do MESMO `Date` usado para montar `dtPreferida` — um oráculo
// independente da função testada, não uma tautologia — e (2) tem um teste de
// guarda que FALHA ALTO se o processo estiver rodando em UTC (offset 0), caso em
// que a conversão nunca aconteceria e o teste não provaria nada. Nesta máquina o
// fuso padrão do SO já é America/Sao_Paulo (confirmado com
// `Intl.DateTimeFormat().resolvedOptions().timeZone`), então `npm test` sem
// nenhuma variável extra já exercita o bug de verdade, sem depender de sorte.
//
// ⚠️ Achado lateral, não corrigido nesta task (fora do escopo — é config de CI,
// não deste arquivo): `.github/workflows/ci.yml` não fixa `TZ`. Se este arquivo
// rodar num runner cujo padrão seja UTC (ubuntu-latest costuma ser), o teste de
// guarda abaixo falha alto e aponta pra esta nota — não é regressão de código.
// Reportado ao maestro, não corrigido (mudar workflow de CI está fora do que foi
// pedido nesta rodada).
import { solicitarAgendamento } from '../services/agendamentos.service';
import { apiClient } from '../services/api/client';

jest.mock('../services/api/client', () => ({
  apiClient: { post: jest.fn() },
}));

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// Oráculo independente: monta a string LocalDateTime esperada a partir dos
// getters LOCAIS do Date (os mesmos que a tela usaria pra exibir a hora pro
// tutor), SEM chamar `paraLocalDateTimeJava` — se o SUT tivesse um bug de
// conversão, este cálculo não o reproduziria por coincidência.
function horaEscolhidaPeloTutor(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
         `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

describe('agendamentos.service — fuso horário de dtAgendamento (TASK-74b, rodada de fix 1)', () => {
  beforeEach(() => {
    (apiClient.post as jest.Mock).mockReset();
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: { id: 42, sgStatus: 'SOLICITADO', dtSolicitacao: new Date().toISOString() },
    });
  });

  it('precondição: este processo roda num fuso não-UTC (senão os testes abaixo não provam nada — rode com TZ=America/Sao_Paulo ou equivalente)', () => {
    const offsetMin = new Date(2026, 8, 1, 10, 30).getTimezoneOffset();
    expect(offsetMin).not.toBe(0);
  });

  it('o horário que sai no corpo do POST é o mesmo que o tutor escolheu na tela, dígito a dígito (não a hora UTC)', async () => {
    // Reproduz EXATAMENTE a montagem de agenda/novo.tsx::dtPreferida (linhas
    // 39-45): Date local + setHours(h, m) + toISOString(). Tutor escolhe
    // 2026-09-01, slot 10:30.
    const dia = new Date(2026, 8, 1); // mês 0-indexado: 8 = setembro
    dia.setHours(10, 30, 0, 0);
    const esperado = horaEscolhidaPeloTutor(dia); // "2026-09-01T10:30:00", no fuso local
    const dtPreferida = dia.toISOString();         // convertido pra UTC — dígitos diferentes

    // Confirma que a conversão pra UTC de fato mudou os dígitos (senão a asserção
    // final teria mordida zero mesmo com o bug antigo do commit 5bb05d7).
    expect(dtPreferida.startsWith(esperado)).toBe(false);

    await solicitarAgendamento({ idPet: 1, sgTipoConsulta: 'ROTINA', dsMotivo: 'Check-up anual', dtPreferida });
    const body = (apiClient.post as jest.Mock).mock.calls[0]![1];

    expect(body.dtAgendamento).toBe(esperado); // hora ESCOLHIDA pelo tutor, não a hora UTC
    expect(body.dtAgendamento.endsWith('Z')).toBe(false);
    expect(body.dtAgendamento).not.toMatch(/[+-]\d{2}:\d{2}$/); // sem offset explícito também
  });

  it('meia-noite local (fronteira de virada de dia em UTC) preserva a data/hora locais, não as de UTC', async () => {
    // Horário perto da virada de dia costuma ser onde bugs de fuso aparecem
    // primeiro (a data em UTC pode até divergir da data local, dependendo do
    // offset). Tutor escolhe 2026-09-01, 00:30.
    const dia = new Date(2026, 8, 1);
    dia.setHours(0, 30, 0, 0);
    const esperado = horaEscolhidaPeloTutor(dia);
    const dtPreferida = dia.toISOString();
    expect(dtPreferida.startsWith(esperado)).toBe(false);

    await solicitarAgendamento({ idPet: 1, sgTipoConsulta: 'ROTINA', dsMotivo: 'x', dtPreferida });
    const body = (apiClient.post as jest.Mock).mock.calls[0]![1];
    expect(body.dtAgendamento).toBe(esperado);
  });
});
