export interface TutorDomain { id: number; nome: string; email: string; telefone: string; }
export interface PetDomain {
  id: number; nome: string; especie: string; raca: string; nascimento: Date;
  sexo: 'M' | 'F'; porte: 'P' | 'M' | 'G' | 'GG'; nmClinica: string;
  statusGeral: 'OK' | 'ALERTA' | 'URGENTE'; alertasAtivos: number;
  idadeAnos: number; nrConsultas?: number;
  chips: { tone: 'sage' | 'amber' | 'clay' | 'ocean' | 'mute'; label: string }[];
  condicoes?: { label: string; tone: 'amber' | 'clay'; desde?: string; observacao?: string }[];
  dtProximoAgendamento?: Date; dtUltimaConsulta?: Date;
  /**
   * FT-09 (KURA_BACKLOG_FOTO_PET): URL assinada da variante THUMB (256px) —
   * regra A5 do backlog, a lista de pets nunca carrega a variante 1080.
   * `null`/`undefined` sem foto (ilustração de sempre no `KPetPortrait`).
   */
  fotoThumbUrl?: string | null;
}
