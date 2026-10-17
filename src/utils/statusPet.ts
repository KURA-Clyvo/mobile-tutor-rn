// BR-TUT-T06: status do pet (lista e perfil) numa tabela só. clay = urgência, amber = atenção (BR-TUT-16).
export type StatusPet = 'OK' | 'ALERTA' | 'URGENTE';
export const STATUS_PET = {
  OK:      { tone: 'sage'  as const, label: 'Tudo certo' },
  ALERTA:  { tone: 'amber' as const, label: 'Atenção'    },
  URGENTE: { tone: 'clay'  as const, label: 'Urgente'    },
};
