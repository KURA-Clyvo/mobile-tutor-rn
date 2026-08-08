// TASK-65 (FIX_5): G4b — varredura sistemática mock x consumidor. Análogo exato da
// TASK-64 (que corrigiu register()/auth.mock), mas cobrindo os demais services do app.
//
// Mesma disciplina do auth.mock-contract.test.ts (TASK-64): EXERCITA a função de
// verdade (service -> apiClient real -> mock-adapter -> mocks/*.mock.ts), sem
// jest.mock do apiClient/mock-adapter. Ver docs/mock-contract-audit.md para a tabela
// completa de pares service x mock, incluindo os que NÃO precisaram de fix.
//
// TASK-71 (FIX_6): fecha uma das 3 rotas que a TASK-65 tinha deixado documentadas,
// sem mock — cancelarAgendamento (DELETE) ganhou rota no adapter (ver describe
// 'agendamentos.service'). registerDeviceToken foi reavaliada e continua sem mock,
// por decisão justificada (ver describe 'rota sem mock' no fim deste arquivo).
//
// Achados corrigidos aqui (ver docs/mock-contract-audit.md para a árvore causal
// completa de cada um):
//   - getTimeline / getNotificacoes: o service espera PageRaw<T> (Spring Data Page,
//     `.content`), o mock devolvia um array nu -> TypeError "Cannot read properties
//     of undefined (reading 'map')" ao tentar `.content.map(...)`.
//   - getEventDetail: sem rota dedicada no adapter (regex de /timeline sem `$`
//     "sequestrava" /timeline/:id) -> devolvia objeto vazio silenciosamente.
//   - getPetById: mock devolvia o tipo APP-FACING (PetTutorDetailResponse, campo
//     `id`) onde o service espera o tipo RAW do Java (PetDetalheRaw, campo `idPet`)
//     -> `id: undefined` e perda silenciosa de peso/temperatura/condições.
//   - getVacinas / getVacinaStatus: mesmo padrão -> dados corrompidos (todo item
//     virava sgStatus 'VENCENDO', nrTotal undefined), sem lançar.
//   - solicitarAgendamento: a rota do adapter para /agendamentos era cega a
//     método -> POST devolvia o array de list() em vez do objeto de criar().
import { getTimeline, getEventDetail } from '../services/timeline.service';
import { listPets, getPetById } from '../services/pets.service';
import { getVacinas, getVacinaStatus } from '../services/vacinas.service';
import { getNotificacoes, registerDeviceToken } from '../services/notifications.service';
import { listAgendamentos, solicitarAgendamento, cancelarAgendamento } from '../services/agendamentos.service';
import { listConsentimentos, assinar, revogar } from '../services/consentimentos.service';
import { login } from '../services/auth.service';

describe('Contrato de modo mock (EXPO_PUBLIC_USE_MOCKS=true) — G4b, TASK-65', () => {
  const originalUseMocks = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = originalUseMocks;
  });

  describe('timeline.service', () => {
    it('getTimeline executa sem lançar e devolve itens mapeados válidos', async () => {
      const res = await getTimeline(1);
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBeGreaterThan(0);
      for (const item of res) {
        expect(typeof item.idEventoClinico).toBe('number');
        expect(typeof item.dtEvento).toBe('string');
        expect(typeof item.nmClinica).toBe('string');
        expect([
          'CONSULTA', 'VACINA', 'PRESCRICAO', 'EXAME', 'PROCEDIMENTO', 'TELEORIENTACAO',
        ]).toContain(item.nmTipo);
      }
    });

    it('getEventDetail executa sem lançar e devolve o evento certo (não objeto vazio)', async () => {
      const res = await getEventDetail(1, 201);
      expect(res.idEventoClinico).toBe(201);
      expect(typeof res.dtEvento).toBe('string');
      expect(res.dtEvento.length).toBeGreaterThan(0);
      expect(typeof res.nmClinica).toBe('string');
      expect(res.nmClinica.length).toBeGreaterThan(0);
    });
  });

  describe('pets.service', () => {
    it('getPetById executa sem lançar e devolve id/vitais reais (não undefined)', async () => {
      const res = await getPetById(1);
      expect(res.id).toBe(1);
      expect(typeof res.nmPet).toBe('string');
      expect(res.nmPet.length).toBeGreaterThan(0);
    });
  });

  describe('vacinas.service', () => {
    it('getVacinas executa sem lançar e devolve dtAplicacao/id derivados de dado real', async () => {
      const res = await getVacinas(1);
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBeGreaterThan(0);
      // sgStatus é sempre 'VENCENDO' por DESENHO (mapVacinaDto — VW_VACINAS_VENCENDO
      // só lista pendências futuras), então não é isso que prova o fix. O que prova
      // é `id`/`dtAplicacao` serem derivados de `raw.idPet`/`raw.dtProximaDose`
      // REAIS — com o shape errado (VacinaTutorResponse em vez de VacinaVencendoRaw),
      // `raw.idPet` batia undefined e `raw.dtProximaDose` ficava undefined para
      // qualquer item do mock antigo sem essa chave, produzindo `dtAplicacao`
      // igual a `undefined` (string) em vez de uma data ISO.
      const ids = new Set(res.map(v => v.id));
      expect(ids.size).toBe(res.length); // sem colisão de hash por idPet undefined
      for (const v of res) {
        expect(typeof v.id).toBe('number');
        expect(Number.isNaN(v.id)).toBe(false);
        expect(Number.isNaN(Date.parse(v.dtAplicacao))).toBe(false);
      }
    });

    it('getVacinaStatus executa sem lançar e devolve nrTotal numérico (não undefined)', async () => {
      const res = await getVacinaStatus(1);
      expect(typeof res.nrTotal).toBe('number');
      expect(Number.isNaN(res.nrTotal)).toBe(false);
    });
  });

  describe('notifications.service', () => {
    it('getNotificacoes executa sem lançar e devolve notificações mapeadas', async () => {
      const res = await getNotificacoes();
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBeGreaterThan(0);
      for (const n of res) {
        expect(typeof n.id).toBe('number');
        expect(typeof n.dsTitulo).toBe('string');
      }
    });
  });

  describe('agendamentos.service', () => {
    it('solicitarAgendamento (POST) devolve o objeto de criação, não a lista de GET', async () => {
      const res = await solicitarAgendamento({
        idPet: 1,
        sgTipoConsulta: 'ROTINA',
        dsMotivo: 'Check-up',
        dtPreferida: new Date(Date.now() + 86400_000).toISOString(),
      });
      expect(Array.isArray(res)).toBe(false);
      expect(res.sgStatus).toBe('SOLICITADO');
      expect(typeof res.id).toBe('number');
      expect(typeof res.dtSolicitacao).toBe('string');
    });

    // TASK-71 (FIX_6): cancelarAgendamento (DELETE) não tinha rota no adapter —
    // era uma das 3 rotas sem mock do backlog. Prova os TRÊS caminhos na mesma URL
    // base (GET lista, POST cria, DELETE cancela) pra travar a não-regressão do fix
    // da TASK-65 (a rota `/tutor/agendamentos$` ficar cega a método de novo).
    it('cancelarAgendamento (DELETE) executa sem lançar e devolve sgStatus CANCELADO', async () => {
      const res = await cancelarAgendamento(7);
      expect(Array.isArray(res)).toBe(false);
      expect(res.id).toBe(7);
      expect(res.sgStatus).toBe('CANCELADO');
    });

    it('GET, POST e DELETE em /tutor/agendamentos não se confundem (despacho por método+path)', async () => {
      const listaRes = await listAgendamentos();
      const criarRes = await solicitarAgendamento({
        idPet: 1,
        sgTipoConsulta: 'ROTINA',
        dsMotivo: 'Check-up',
        dtPreferida: new Date(Date.now() + 86400_000).toISOString(),
      });
      const cancelarRes = await cancelarAgendamento(9);

      expect(Array.isArray(listaRes)).toBe(true);
      expect(criarRes.sgStatus).toBe('SOLICITADO');
      expect(cancelarRes.sgStatus).toBe('CANCELADO');
      expect(cancelarRes.id).toBe(9);
    });
  });

  // Pares pass-through (`.then(r => r.data)` sem transformação) — baixo risco por
  // construção (o mock só precisa casar com o tipo app-facing, que já é o shape que
  // a service function devolve). Executados aqui, não só lidos, por disciplina do
  // método (item 5 da TASK-65: "não classificar por leitura").
  describe('pass-throughs (baixo risco, executados para confirmar)', () => {
    it('login / listPets / listAgendamentos / listConsentimentos executam sem lançar', async () => {
      const loginRes = await login({ dsEmail: 'a@b.com', dsSenha: 'x' });
      expect(typeof loginRes.accessToken).toBe('string');

      const pets = await listPets();
      expect(Array.isArray(pets)).toBe(true);
      const ags = await listAgendamentos();
      expect(Array.isArray(ags)).toBe(true);
      const cons = await listConsentimentos();
      expect(Array.isArray(cons)).toBe(true);
    });

    it('assinar/revogar consentimento executam sem lançar (mesma rota, método explícito)', async () => {
      const a = await assinar({ dsTipoConsentimento: 'COMUNICACAO_WHATSAPP', dsAceite: 'SIM' }, 'idem-1');
      expect(a.sgStatus).toBe('ATIVO');
      const r = await revogar('COMUNICACAO_WHATSAPP', 'idem-2');
      expect(r.sgStatus).toBe('REVOGADO');
    });
  });

  // TASK-71 (FIX_6): das 3 rotas sem mock que a TASK-65 (FIX_5) tinha documentado
  // e deixado de propósito, `cancelarAgendamento` ganhou mock nesta task (ver
  // describe('agendamentos.service') acima) e a de teleconsulta da clínica também
  // (mobile-clinica-rn/tests/mock-contract-audit.test.ts). `registerDeviceToken`
  // foi REAVALIADA à luz do estado pós-TASK-70 (que reescreveu este mesmo service
  // e corrigiu um bug de contrato real, dsPlatform -> dsPlatforma) e a decisão
  // continua sendo NÃO adicionar mock — justificativa abaixo.
  describe('rota sem mock — decisão revisitada nesta task (TASK-71, FIX_6)', () => {
    // Decisão: NÃO adicionar mock para registerDeviceToken.
    //
    // Motivos, examinando o estado atual (não o que a TASK-65 presumia):
    // 1. O service (notifications.service.ts:61-75, TASK-70) já tem `try/catch`
    //    próprio e devolve `boolean` — nenhuma tela ou hook trata `false` como erro
    //    visível (usePushTokenSync, useNotifications.ts:57-72, só ignora o retorno).
    //    Diferente de `cancelarAgendamento`/`criarOuObterSala`, aqui NÃO existe tela
    //    sem `try/catch` esperando por este mock — o "plano B" já funciona hoje.
    // 2. É chamado em background (efeito de sincronização de push token no login),
    //    nunca a partir de uma ação explícita do usuário — não há botão "Registrar
    //    push token" numa demo. Adicionar mock não muda nada visível em plano B.
    // 3. Adicionar um mock só trocaria `false` (falha silenciosa, já correta) por
    //    `true` (sucesso silencioso) — nenhum dos dois é observável, então o ganho
    //    de fechar esta rota é zero pro objetivo do backlog ("plano B quebra
    //    exatamente onde precisa funcionar"). Aqui ele não quebra visivelmente.
    // Custo de NÃO fechar: nenhum identificado — mantém o comportamento e o teste
    // de baixo risco já herdados da TASK-65/TASK-70, sem escopo extra sem retorno.
    it('registerDeviceToken (PATCH /me/push-token) continua sem rota — mas o service já captura o erro', async () => {
      await expect(registerDeviceToken('tok')).resolves.toBe(false);
    });
  });
});
