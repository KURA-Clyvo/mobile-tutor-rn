import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { ThemeProvider } from '../theme/index';
import { AgendamentoItem } from '../components/domain/AgendamentoItem';
import type { AgendamentoTutorResponse } from '../types/api';

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

const BASE: AgendamentoTutorResponse = {
  id: 1,
  dtInicio: new Date(Date.now() + 86400_000).toISOString(),
  nrDuracaoMinutos: 30,
  sgStatus: 'CONFIRMADO',
  sgTipoConsulta: 'TELEORIENTACAO',
  pet: { id: 1, nmPet: 'Bóbi', nmEspecie: 'Cão', nmRaca: 'Labrador' },
  nmClinica: 'KURA',
  dsMotivo: 'Teleorientação',
};

describe('AgendamentoItem — teleconsulta', () => {
  it('mostra botão "Entrar na teleconsulta" quando tipo é TELEORIENTACAO e dsSalaUrl existe', () => {
    const item = { ...BASE, dsSalaUrl: 'https://kura.daily.co/room-1' };
    const { getByText } = render(<AgendamentoItem item={item} />, { wrapper: W });
    expect(getByText('Entrar na teleconsulta')).toBeTruthy();
  });

  it('não mostra o botão quando dsSalaUrl ainda é null (sala não criada)', () => {
    const item = { ...BASE, dsSalaUrl: null };
    const { queryByText } = render(<AgendamentoItem item={item} />, { wrapper: W });
    expect(queryByText('Entrar na teleconsulta')).toBeNull();
  });

  it('não mostra o botão para tipos que não são TELEORIENTACAO', () => {
    const item = { ...BASE, sgTipoConsulta: 'ROTINA' as const, dsSalaUrl: 'https://kura.daily.co/room-1' };
    const { queryByText } = render(<AgendamentoItem item={item} />, { wrapper: W });
    expect(queryByText('Entrar na teleconsulta')).toBeNull();
  });

  it('não mostra o botão quando o agendamento está cancelado', () => {
    const item = { ...BASE, sgStatus: 'CANCELADO' as const, dsSalaUrl: 'https://kura.daily.co/room-1' };
    const { queryByText } = render(<AgendamentoItem item={item} />, { wrapper: W });
    expect(queryByText('Entrar na teleconsulta')).toBeNull();
  });

  it('pressionar o botão abre a URL da sala', () => {
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    const item = { ...BASE, dsSalaUrl: 'https://kura.daily.co/room-1' };
    const { getByText } = render(<AgendamentoItem item={item} />, { wrapper: W });
    fireEvent.press(getByText('Entrar na teleconsulta'));
    expect(openURLSpy).toHaveBeenCalledWith('https://kura.daily.co/room-1');
  });
});
