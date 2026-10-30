import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Snapshot, Status } from '../utils/mudancasAgendamento';

// S4-MOB-03: último status visto de cada agendamento, por tutor. Persistido para não repetir o aviso
// quando o app reabre, nem avisar o tutor A de mudanças vistas pelo tutor B no mesmo aparelho.
const chave = (idTutor: number) => `KURA_TUTOR_AGEND_VISTOS_${idTutor}`;

export async function lerStatusVistos(idTutor: number): Promise<Snapshot | null> {
  const raw = await AsyncStorage.getItem(chave(idTutor));
  if (!raw) return null;
  try { return JSON.parse(raw) as Snapshot; } catch { return null; }
}

export async function gravarStatusVistos(idTutor: number, snapshot: Snapshot): Promise<void> {
  await AsyncStorage.setItem(chave(idTutor), JSON.stringify(snapshot));
}

// Mudança feita pelo PRÓPRIO tutor (ex.: cancelar): grava antes do refetch, para não virar aviso.
export async function marcarStatusVisto(idTutor: number, idAgendamento: number, status: Status): Promise<void> {
  const atual = (await lerStatusVistos(idTutor)) ?? {};
  await gravarStatusVistos(idTutor, { ...atual, [String(idAgendamento)]: status });
}
