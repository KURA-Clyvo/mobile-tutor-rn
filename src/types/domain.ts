export interface TutorDomain { id: number; nome: string; email: string; telefone: string; }
export interface PetDomain {
  id: number; nome: string; especie: string; raca: string; nascimento: Date;
  sexo: 'M' | 'F'; porte: 'P' | 'M' | 'G' | 'GG'; nmClinica: string;
  statusGeral: 'OK' | 'ALERTA' | 'URGENTE'; alertasAtivos: number;
  idadeAnos: number;
  chips: Array<{ tone: 'sage' | 'amber' | 'clay' | 'ocean' | 'mute'; label: string }>;
}
