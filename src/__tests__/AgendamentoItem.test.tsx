import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking, StyleSheet } from 'react-native';
import { ThemeProvider } from '../theme/index';
import { lightColors } from '../theme/tokens';
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

describe('AgendamentoItem — teleorientação', () => {
  it('mostra botão "Entrar na teleorientação" quando tipo é TELEORIENTACAO e dsSalaUrl existe', () => {
    const item = { ...BASE, dsSalaUrl: 'https://kura.daily.co/room-1' };
    const { getByText } = render(<AgendamentoItem item={item} />, { wrapper: W });
    expect(getByText('Entrar na teleorientação')).toBeTruthy();
  });

  it('não mostra o botão quando dsSalaUrl ainda é null (sala não criada)', () => {
    const item = { ...BASE, dsSalaUrl: null };
    const { queryByText } = render(<AgendamentoItem item={item} />, { wrapper: W });
    expect(queryByText('Entrar na teleorientação')).toBeNull();
  });

  it('não mostra o botão para tipos que não são TELEORIENTACAO', () => {
    const item = { ...BASE, sgTipoConsulta: 'ROTINA' as const, dsSalaUrl: 'https://kura.daily.co/room-1' };
    const { queryByText } = render(<AgendamentoItem item={item} />, { wrapper: W });
    expect(queryByText('Entrar na teleorientação')).toBeNull();
  });

  it('não mostra o botão quando o agendamento está cancelado', () => {
    const item = { ...BASE, sgStatus: 'CANCELADO' as const, dsSalaUrl: 'https://kura.daily.co/room-1' };
    const { queryByText } = render(<AgendamentoItem item={item} />, { wrapper: W });
    expect(queryByText('Entrar na teleorientação')).toBeNull();
  });

  it('pressionar o botão abre a URL da sala', () => {
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    const item = { ...BASE, dsSalaUrl: 'https://kura.daily.co/room-1' };
    const { getByText } = render(<AgendamentoItem item={item} />, { wrapper: W });
    fireEvent.press(getByText('Entrar na teleorientação'));
    expect(openURLSpy).toHaveBeenCalledWith('https://kura.daily.co/room-1');
  });
});

// BR-TUT-T07 fix wave (I-5): pedido não confirmado mostra o PERÍODO, nunca a hora âncora como horário marcado.
describe('AgendamentoItem — quando (BR-TUT-T07 I-5)', () => {
  const em = (h: number, min = 0) => new Date(2026, 9, 20, h, min, 0).toISOString();
  const render1 = (over: Partial<AgendamentoTutorResponse>) =>
    render(<AgendamentoItem item={{ ...BASE, sgTipoConsulta: 'ROTINA', dsSalaUrl: null, ...over }} />, { wrapper: W });

  it('Aguardando (SOLICITADO) com âncora 14:00 => "Tarde · preferência", sem "14:00"', () => {
    const r = render1({ sgStatus: 'SOLICITADO', dtInicio: em(14) });
    expect(r.getByText(/Tarde · preferência/)).toBeTruthy();
    expect(r.queryByText(/14:00/)).toBeNull();
  });
  it('Aguardando com âncora 09:00 => "Manhã · preferência"', () => {
    const r = render1({ sgStatus: 'SOLICITADO', dtInicio: em(9) });
    expect(r.getByText(/Manhã · preferência/)).toBeTruthy();
  });
  it('AGENDADO (o status que o Java grava no pedido do tutor) também é Aguardando, não Confirmado', () => {
    const r = render1({ sgStatus: 'AGENDADO', dtInicio: em(14) });
    expect(r.getByText('Aguardando')).toBeTruthy();
    expect(r.queryByText('Confirmado')).toBeNull();
    expect(r.getByText(/Tarde · preferência/)).toBeTruthy();
  });
  it('CONFIRMADO continua com a hora marcada', () => {
    const r = render1({ sgStatus: 'CONFIRMADO', dtInicio: em(14) });
    expect(r.getByText(/14:00/)).toBeTruthy();
    expect(r.queryByText(/preferência/)).toBeNull();
    expect(r.getByText('Confirmado')).toBeTruthy();
  });
  it('não confirmado com hora que NÃO é âncora (10:30) mostra a hora', () => {
    const r = render1({ sgStatus: 'SOLICITADO', dtInicio: em(10, 30) });
    expect(r.getByText(/10:30/)).toBeTruthy();
    expect(r.queryByText(/preferência/)).toBeNull();
  });
  it('não confirmado na hora da âncora mas com minutos (14:30, a clínica mexeu) mostra a hora, não "Tarde · preferência"', () => {
    const r = render1({ sgStatus: 'AGENDADO', dtInicio: em(14, 30) });
    expect(r.getByText(/14:30/)).toBeTruthy();
    expect(r.queryByText(/preferência/)).toBeNull();
  });
  it('tipo Vacina aparece como "Vacina"', () => {
    const r = render1({ sgTipoConsulta: 'VACINA', sgStatus: 'SOLICITADO', dtInicio: em(9) });
    expect(r.getByText(/^Vacina · KURA/)).toBeTruthy();
  });
});

// BR-TUT-T10: cancelar visível. Botão "danger" só no pedido aguardando (SOLICITADO/AGENDADO); o toque longo saiu.
describe('AgendamentoItem — botão Cancelar agendamento (BR-TUT-T10)', () => {
  const comStatus = (sgStatus: AgendamentoTutorResponse['sgStatus'], onCancel = jest.fn()) =>
    ({ onCancel, ...render(<AgendamentoItem item={{ ...BASE, sgTipoConsulta: 'ROTINA', dsSalaUrl: null, sgStatus }} onCancel={onCancel} />, { wrapper: W }) });

  it.each(['SOLICITADO', 'AGENDADO'] as const)('%s: mostra o botão, com role e rótulo com pet e data; toque chama onCancel', (st) => {
    const { onCancel, getByRole, getByText } = comStatus(st);
    expect(getByText('Cancelar agendamento')).toBeTruthy();
    const btn = getByRole('button', { name: /^Cancelar agendamento de Bóbi em .*20\d\d/ });
    fireEvent.press(btn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it.each(['CONFIRMADO', 'CANCELADO', 'CONCLUIDO'] as const)('%s: NÃO mostra o botão', (st) => {
    const { queryByText, queryByLabelText } = comStatus(st);
    expect(queryByText('Cancelar agendamento')).toBeNull();
    expect(queryByLabelText(/Cancelar agendamento/)).toBeNull();
  });

  it('o cartão não é mais um "botão" vazio nem fala em toque longo', () => {
    const { queryByA11yHint, queryAllByRole } = comStatus('SOLICITADO');
    expect(queryByA11yHint(/longo/i)).toBeNull();
    expect(queryAllByRole('button')).toHaveLength(1);
  });

  it('o botão é destrutivo (variante danger: fundo = token danger, texto textOnPrimary)', () => {
    const { getByRole, getByText } = comStatus('SOLICITADO');
    expect(StyleSheet.flatten(getByRole('button').props.style).backgroundColor).toBe(lightColors.danger);
    expect(StyleSheet.flatten(getByText('Cancelar agendamento').props.style).color).toBe(lightColors.textOnPrimary);
  });

  it('o rótulo traz o pet e a data DO ITEM (outro pet, outra data), completo', () => {
    const item = { ...BASE, sgTipoConsulta: 'ROTINA' as const, dsSalaUrl: null, sgStatus: 'SOLICITADO' as const,
      pet: { id: 2, nmPet: 'Mel', nmEspecie: 'Gato', nmRaca: 'Siamês' }, dtInicio: new Date(2026, 10, 3, 9, 0).toISOString() };
    const { getByRole } = render(<AgendamentoItem item={item} onCancel={jest.fn()} />, { wrapper: W });
    expect(getByRole('button').props.accessibilityLabel).toBe('Cancelar agendamento de Mel em 03 de nov. de 2026');
  });

  it('alvo do botão Cancelar agendamento >= 44 (mira o botão pelo rótulo, não "algum botão")', () => {
    const { getByRole } = comStatus('SOLICITADO');
    const st = StyleSheet.flatten(getByRole('button', { name: /^Cancelar agendamento de / }).props.style);
    expect(st.minHeight).toBeGreaterThanOrEqual(44);
    expect(st.minWidth).toBeGreaterThanOrEqual(44);
  });
});
