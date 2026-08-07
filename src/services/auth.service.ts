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
interface RegisterInviteApiResponse {
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
