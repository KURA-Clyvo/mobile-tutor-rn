import { resolveMock } from '../services/api/mock-adapter';
import type { InternalAxiosRequestConfig } from 'axios';
const cfg = (url: string): InternalAxiosRequestConfig => ({ url, method: 'get', headers: {} as any });

describe('mock-adapter (tutor)', () => {
  // T-2: as duas listas passaram a devolver o envelope `Page<T>` do Spring, como o
  // BFF real (`TutorBffController:63`, `AgendamentoBffController:50`) — não mais
  // array nu. Quem desembrulha é `desembrulharPagina`, no service.
  it('resolves /tutor/pets', async () => {
    const r = await resolveMock(cfg('/api/v1/tutor/pets'));
    const page = r.data as { content: unknown[]; totalElements: number };
    expect(Array.isArray(page.content)).toBe(true);
    expect(page.content.length).toBe(3); // Bóbi, Luna, Thor
    expect(page.totalElements).toBe(3);
    // Shape CRU do Java: `idPet`, não `id` — o mock simula a fronteira HTTP.
    expect((page.content[0] as { idPet?: number }).idPet).toBe(1);
  });
  it('resolves /tutor/pets/:id', async () => {
    const r = await resolveMock(cfg('/api/v1/tutor/pets/1'));
    expect((r.data as any).nmPet).toBe('Bóbi');
  });
  it('resolves /tutor/agendamentos', async () => {
    const r = await resolveMock(cfg('/api/v1/tutor/agendamentos'));
    const page = r.data as { content: { idAgendamento?: number; status?: string }[] };
    expect(Array.isArray(page.content)).toBe(true);
    expect(page.content.length).toBeGreaterThan(0);
    expect(typeof page.content[0]!.idAgendamento).toBe('number');
    // Vocabulário do JAVA, não o do app — a tradução é do mapper.
    expect(page.content.map(a => a.status)).toEqual(expect.arrayContaining(['INTENCAO', 'REALIZADO']));
  });
  it('throws for unknown route', async () => {
    await expect(resolveMock(cfg('/api/v1/unknown'))).rejects.toThrow('No mock for');
  });
});
