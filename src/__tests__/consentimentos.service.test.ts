// TASK-73 (FIX_7) — prova de mordida do contrato real de consentimento LGPD.
//
// Contrato Java (ConsentimentoRequest/ConsentimentoResponse,
// backend-tutor-java/.../consentimento/api/dto — ver task-73-brief.md):
//   POST exige {tipo: TipoConsentimento (enum de 5 valores: TELEORIENTACAO,
//   LEMBRETES, DADOS_ANONIMOS, COMPARTILHAR_SEGURADORA, MARKETING),
//   versaoTermo: string @NotBlank, aceito: 'S'|'N' @Pattern("[SN]")}.
//   GET/POST devolvem {idConsentimento, tipo, versaoTermo, aceito: boolean,
//   ativo: boolean, dtAceite, dtRevogacao}.
//
// O código anterior a esta task mandava {dsTipoConsentimento, dsAceite:'SIM'|'NAO'}
// (nenhum dos dois nomes existe no Java) e lia sgStatus/dtConsentimento da resposta
// (idem) — por isso todo aceite/revogação batia 400 e a listagem nunca casava
// "ativo" com nada. Este teste falha contra o código antigo e passa depois do fix.
import { assinar, revogar, listConsentimentos } from '../services/consentimentos.service';
import { apiClient } from '../services/api/client';

jest.mock('../services/api/client', () => ({
  apiClient: { post: jest.fn(), get: jest.fn() },
}));

const TIPOS_REAIS = ['TELEORIENTACAO', 'LEMBRETES', 'DADOS_ANONIMOS', 'COMPARTILHAR_SEGURADORA', 'MARKETING'];

describe('consentimentos.service — contrato real do Java (TASK-73)', () => {
  beforeEach(() => {
    (apiClient.post as jest.Mock).mockReset();
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        idConsentimento: 10, tipo: 'LEMBRETES', versaoTermo: 'v1.0',
        aceito: true, ativo: true, dtAceite: new Date().toISOString(), dtRevogacao: null,
      },
    });
    (apiClient.get as jest.Mock).mockReset();
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: [
        {
          idConsentimento: 10, tipo: 'LEMBRETES', versaoTermo: 'v1.0',
          aceito: true, ativo: true, dtAceite: new Date().toISOString(), dtRevogacao: null,
        },
      ],
    });
  });

  it('assinar() manda tipo do enum real, versaoTermo não-vazio e aceito "S" (não dsTipoConsentimento/dsAceite:"SIM")', async () => {
    await assinar('LEMBRETES', 'idem-1');
    const body = (apiClient.post as jest.Mock).mock.calls[0][1];
    expect(TIPOS_REAIS).toContain(body.tipo);
    expect(typeof body.versaoTermo).toBe('string');
    expect(body.versaoTermo.length).toBeGreaterThan(0);
    expect(body.aceito).toBe('S');
    expect(body.dsTipoConsentimento).toBeUndefined();
    expect(body.dsAceite).toBeUndefined();
  });

  it('revogar() manda o mesmo shape com aceito "N" (não "NAO")', async () => {
    await revogar('LEMBRETES', 'idem-2');
    const body = (apiClient.post as jest.Mock).mock.calls[0][1];
    expect(TIPOS_REAIS).toContain(body.tipo);
    expect(body.aceito).toBe('N');
  });

  it('listConsentimentos() casa ativo/tipo reais da resposta (não sgStatus/dsTipoConsentimento)', async () => {
    const res = await listConsentimentos();
    expect(res[0]!.tipo).toBe('LEMBRETES');
    expect(res[0]!.ativo).toBe(true);
    expect((res[0] as any).sgStatus).toBeUndefined();
    expect((res[0] as any).dsTipoConsentimento).toBeUndefined();
  });
});
