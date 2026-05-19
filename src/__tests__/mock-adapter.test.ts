import { resolveMock } from '../services/api/mock-adapter';
import type { InternalAxiosRequestConfig } from 'axios';
const cfg = (url: string): InternalAxiosRequestConfig => ({ url, method: 'get', headers: {} as any });

describe('mock-adapter (tutor)', () => {
  it('resolves /tutor/pets', async () => {
    const r = await resolveMock(cfg('/api/v1/tutor/pets'));
    expect(Array.isArray(r.data)).toBe(true);
    expect((r.data as any[]).length).toBe(3); // Bóbi, Luna, Thor
  });
  it('resolves /tutor/pets/:id', async () => {
    const r = await resolveMock(cfg('/api/v1/tutor/pets/1'));
    expect((r.data as any).nmPet).toBe('Bóbi');
  });
  it('resolves /tutor/agendamentos', async () => {
    const r = await resolveMock(cfg('/api/v1/tutor/agendamentos'));
    expect(Array.isArray(r.data)).toBe(true);
  });
  it('throws for unknown route', async () => {
    await expect(resolveMock(cfg('/api/v1/unknown'))).rejects.toThrow('No mock for');
  });
});
