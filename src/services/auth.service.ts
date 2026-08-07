import { apiClient } from './api/client';
import type { LoginRequest, LoginResponse, RegisterTutorRequest, RegisterTutorResponse } from '../types/api';

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/api/v1/auth/login', req);
  return res.data;
}

// TASK-55: shape real de POST /api/v1/auth/register-invite (Java `RegisterInviteRequest`/
// `TokenResponse`, ver backend-tutor-java/.../onboarding/api/dto). Diverge do contrato
// app-facing (`RegisterTutorRequest`/`RegisterTutorResponse`) em nomes de campo (token/senha
// vs inviteToken/dsSenha) e em formato de resposta (idTutor aninhado em `tutor`, `expiresIn`
// em segundos em vez de `expiresAt` ISO). Mapeado aqui para isolar o resto do app do contrato
// real do BFF — `RegisterTutorRequest`/`RegisterTutorResponse` continuam estáveis para quem
// consome `register()` (register.tsx, mocks).
//
// TASK-64 (FIX_5): exportada de propósito. `register()` lê `res.data.tutor.idTutor`/
// `res.data.expiresIn` — ou seja, o corpo que `apiClient.post` resolve TEM que ter este
// shape, venha ele do BFF Java real ou do mock-adapter (EXPO_PUBLIC_USE_MOCKS=true).
// `auth.mock.ts` importa este tipo e o implementa de propósito: o mock simula a fronteira
// HTTP deste service, então ele devolve o shape de ENTRADA de register() (o corpo cru que
// chegaria por HTTP), não o RegisterTutorResponse que register() PRODUZ depois de mapear.
// Ficou dessincronizado disso por 2 ciclos (TASK-55, TASK-61) porque nada executava o
// caminho app -> mock — só o caminho app -> Oracle real era validado. Se este shape mudar
// de novo, mudar `auth.mock.ts` junto (não há forma de o compilador pegar isso sozinho,
// já que o mock não importava o tipo antes).
export interface RegisterInviteApiResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  tutor: { idTutor: number; nmTutor: string };
}

// TASK-61: shape real de cada item de `aceites` — Java `AceiteRequest`
// (onboarding/api/dto/AceiteRequest.java): { tipo: TipoConsentimento, versaoTermo: string,
// aceito: boolean, textoTermo?: string }. `tipo` é o enum Java
// (consentimento/lgpd/TipoConsentimento.java) — os nomes abaixo têm que bater exatamente
// com os valores do enum (TELEORIENTACAO, LEMBRETES, DADOS_ANONIMOS,
// COMPARTILHAR_SEGURADORA, MARKETING), senão o Jackson rejeita o payload com 400.
// `versaoTermo` tem que bater com a versão vigente no servidor (TermoVigente.java —
// hoje 'v1.0' para todos os tipos) ou o registro falha com RegraDeNegocioException.
interface AceiteInviteApi {
  tipo: 'TELEORIENTACAO' | 'LEMBRETES' | 'DADOS_ANONIMOS' | 'COMPARTILHAR_SEGURADORA' | 'MARKETING';
  versaoTermo: string;
  aceito: boolean;
  textoTermo?: string;
}

const VERSAO_TERMO_ATUAL = 'v1.0'; // espelha TermoVigente.* (backend-tutor-java)

// TASK-61: constrói `aceites` a partir do que o usuário marcou no formulário — antes
// disso o app mandava `aceites: []` fixo, sem capturar consentimento real (gap LGPD
// sinalizado pelo revisor da TASK-55). Só entram no array os itens que o tutor de fato
// marcou (aceito=true); nada de mandar aceito=false para tipo nunca aceito (o Java trata
// isso como revogação, que exige consentimento ativo prévio — não faz sentido no
// registro).
function montarAceites(req: RegisterTutorRequest): AceiteInviteApi[] {
  const aceites: AceiteInviteApi[] = [];
  if (req.aceiteLembretes) {
    aceites.push({ tipo: 'LEMBRETES', versaoTermo: VERSAO_TERMO_ATUAL, aceito: true });
  }
  if (req.aceiteTeleorientacao) {
    aceites.push({ tipo: 'TELEORIENTACAO', versaoTermo: VERSAO_TERMO_ATUAL, aceito: true });
  }
  return aceites;
}

export async function register(req: RegisterTutorRequest): Promise<RegisterTutorResponse> {
  const res = await apiClient.post<RegisterInviteApiResponse>('/api/v1/auth/register-invite', {
    token: req.inviteToken,
    senha: req.dsSenha,
    aceites: montarAceites(req),
  });
  return {
    idTutor:     res.data.tutor.idTutor,
    accessToken: res.data.accessToken,
    expiresAt:   new Date(Date.now() + res.data.expiresIn * 1000).toISOString(),
  };
}

// TASK-61 (rodada de fix — achado Important da revisão): fixar VERSAO_TERMO_ATUAL no
// cliente acopla a versão do app à versão vigente no servidor (ValidadorConsentimento.
// validarVersaoTermo) — algo que não existia antes desta task, porque `aceites` sempre
// vinha vazio e esse validador nunca era chamado. Se o Java der bump em TermoVigente
// antes do app ser atualizado nas lojas, TODO registro por convite passa a falhar com
// 422 até a próxima versão do app. Não dá para resolver a causa raiz aqui (exigiria
// endpoint novo no Java para o app descobrir a versão vigente antes de montar o
// payload — fora de escopo deste repo) — a mitigação possível é reconhecer esse erro
// específico e mostrar uma mensagem acionável ("atualize o app") em vez do genérico
// "Erro ao criar conta".
//
// 422/REGRA_DE_NEGOCIO no Java também cobre OUTRA regra de negócio sem relação
// (RegraDeNegocioException é lançada também quando o tutor não recebeu o aviso de
// privacidade — OnboardingService.registrarPorInvite, passo 6) — mesmo status e
// mesmo `code`, então não dá pra distinguir só por eles. Por isso o match é pelo
// texto da mensagem real que ValidadorConsentimento.validarVersaoTermo produz
// ("Versão do termo desatualizada. Versão vigente: ..."), não só pelo status/code.
export function isVersaoTermoDesatualizadaError(err: unknown): boolean {
  const status  = (err as { status?: number })?.status;
  const message = (err as { message?: string })?.message ?? '';
  return status === 422 && /vers[ãa]o do termo desatualizada/i.test(message);
}
