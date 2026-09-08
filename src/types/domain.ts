// T-2: `nmClinica`, `statusGeral`, `alertasAtivos` e `chips` são opcionais porque o
// servidor real não os manda na lista (ver a nota em `PetTutorResponse`). A tela
// oculta a seção quando o dado falta — melhor que um "Tudo certo" que ninguém apurou.
export interface PetDomain {
  id: number; nome: string; especie: string; raca: string; nascimento: Date;
  sexo: 'M' | 'F'; porte: 'P' | 'M' | 'G' | 'GG'; nmClinica?: string;
  statusGeral?: 'OK' | 'ALERTA' | 'URGENTE'; alertasAtivos?: number;
  idadeAnos: number; nrConsultas?: number;
  chips?: { tone: 'sage' | 'amber' | 'clay' | 'ocean' | 'mute'; label: string }[];
  condicoes?: { label: string; tone: 'amber' | 'clay'; desde?: string; observacao?: string }[];
  dtProximoAgendamento?: Date; dtUltimaConsulta?: Date;
}
