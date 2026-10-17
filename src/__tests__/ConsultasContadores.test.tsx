// BR-TUT-T06 — aba Consultas: contador de tipo e chip saem do MESMO campo (`sgTipoAtendimento`). O servidor real não o manda.
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { ConsultasTab } from '../components/domain/ConsultasTab';

let mockTimeline: any;
jest.mock('../hooks/usePetTimeline', () => ({ usePetTimeline: () => mockTimeline, usePetTimelineEvent: () => ({}) }));

const rq = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: jest.fn(), fetchStatus: 'idle', dataUpdatedAt: 1 });
const ev = (id: number, tipo?: 'pres' | 'tele') =>
  ({ idEventoClinico: id, nmTipo: 'CONSULTA', dtEvento: '2026-09-01T10:00:00Z', nmClinica: 'KURA', sgTipoAtendimento: tipo });
const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('Consultas — contadores', () => {
  it('sem tipo no dado (servidor real): nenhum "Presencial 0" nem chip "Presencial" inventado', () => {
    mockTimeline = rq([ev(1), ev(2), ev(3), ev(4), ev(5)]);
    const r = render(<ConsultasTab petId={1} />, { wrapper: W });
    expect(r.getByText('5 · VISITAS')).toBeTruthy();
    expect(r.queryByText(/^Presencial/)).toBeNull();
    expect(r.queryByText(/^Telemedicina/)).toBeNull();
    expect(r.queryByText(/^Todas/)).toBeNull();
  });

  it('com tipo: Presencial + Telemedicina = Todas = chips desenhados', () => {
    mockTimeline = rq([ev(1, 'pres'), ev(2, 'pres'), ev(3, 'tele'), ev(4, 'pres'), ev(5, 'pres')]);
    const r = render(<ConsultasTab petId={1} />, { wrapper: W });
    expect(r.getByText('Todas 5')).toBeTruthy();
    expect(r.getByText('Presencial 4')).toBeTruthy();
    expect(r.getByText('Telemedicina 1')).toBeTruthy();
    expect(r.getAllByText('Presencial')).toHaveLength(4);
    expect(r.getAllByText('Telemedicina')).toHaveLength(1);
  });
});
