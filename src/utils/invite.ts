import * as Linking from 'expo-linking';

export function parseInviteLink(url: string): { inviteToken: string; clinicaId: number } | null {
  try {
    const parsed = Linking.parse(url);
    const token = parsed.queryParams?.token;
    const clinicaId = parsed.queryParams?.clinicaId;
    if (typeof token !== 'string' || !token) return null;
    return { inviteToken: token, clinicaId: clinicaId ? parseInt(String(clinicaId), 10) : 0 };
  } catch {
    return null;
  }
}
