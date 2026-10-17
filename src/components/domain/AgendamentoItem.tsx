import React from 'react';
import { View, Text, Linking, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { KPetPortrait, racaToPalette } from '@components/primitives/KPetPortrait';
import { KChip } from '@components/primitives/KChip';
import { KButton } from '@components/primitives/KButton';
import type { AgendamentoTutorResponse } from '../../types/api';
import { formatDateBR, formatTimeBR } from '../../utils/date';
import { PERIODOS } from '../../utils/horariosPedido';
import { touchTarget } from '@theme/tokens';

const STATUS_CHIP: Record<AgendamentoTutorResponse['sgStatus'], { tone: 'amber' | 'sage' | 'clay' | 'mute'; label: string }> = {
  SOLICITADO: { tone: 'amber', label: 'Aguardando' },
  // O Java grava o pedido do tutor como AGENDADO (Agendamento.criar, d1522ee:109) e só a clínica leva a CONFIRMADO (:137):
  // AGENDADO ainda NÃO é confirmado.
  AGENDADO:   { tone: 'amber', label: 'Aguardando' },
  CONFIRMADO: { tone: 'sage',  label: 'Confirmado' },
  CANCELADO:  { tone: 'clay',  label: 'Cancelado'  },
  CONCLUIDO:  { tone: 'mute',  label: 'Concluído'  },
};

const TIPO_LABEL: Record<AgendamentoTutorResponse['sgTipoConsulta'], string> = {
  RETORNO:        'Retorno',
  VACINA:         'Vacina',
  ROTINA:         'Rotina',
  URGENCIA:       'Urgência',
  TELEORIENTACAO: 'Teleorientação',
};

interface AgendamentoItemProps {
  item:         AgendamentoTutorResponse;
  onCancel?:    () => void;
}

// Pedido não confirmado: o servidor guarda só a âncora do período (09:00/14:00); a hora é da clínica marcar.
// Âncora conhecida => "Tarde · preferência"; outra hora (a clínica já mexeu) => a hora mesmo.
function quando(item: AgendamentoTutorResponse): string {
  const naoConfirmado = item.sgStatus === 'SOLICITADO' || item.sgStatus === 'AGENDADO';
  const d = new Date(item.dtInicio);
  const p = naoConfirmado && d.getMinutes() === 0 ? PERIODOS.find((x) => x.hora === d.getHours()) : undefined;
  return p ? `${p.rotulo} · preferência` : formatTimeBR(item.dtInicio);
}

export function AgendamentoItem({ item, onCancel }: AgendamentoItemProps) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const chip      = STATUS_CHIP[item.sgStatus];
  const canCancel = item.sgStatus === 'SOLICITADO' || item.sgStatus === 'AGENDADO';
  const podeEntrarNaTeleconsulta =
    item.sgTipoConsulta === 'TELEORIENTACAO' &&
    item.sgStatus !== 'CANCELADO' &&
    !!item.dsSalaUrl;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl }]}>
      <View style={styles.row}>
        <KPetPortrait palette={racaToPalette(item.pet.nmRaca)} size={44} />
        <View style={styles.info}>
          <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.md }}>{item.pet.nmPet}</Text>
          <Text style={{ fontFamily: fonts.body, color: colors.textMuteInk, fontSize: fontSize.xs }}>
            {formatDateBR(item.dtInicio)} · {quando(item)}
          </Text>
          <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.xs }}>
            {TIPO_LABEL[item.sgTipoConsulta]} · {item.nmClinica}
          </Text>
          {item.dsMensagemClinica && (
            <Text numberOfLines={1} style={{ fontFamily: fonts.body, color: colors.primary, fontSize: fontSize.xs }}>
              {item.dsMensagemClinica}
            </Text>
          )}
          {podeEntrarNaTeleconsulta && (
            <KButton
              variant="primary"
              size="sm"
              style={styles.teleBtn}
              onPress={() => Linking.openURL(item.dsSalaUrl!)}
              accessibilityLabel="Entrar na teleorientação"
            >
              Entrar na teleorientação
            </KButton>
          )}
        </View>
        <KChip tone={chip.tone}>{chip.label}</KChip>
      </View>
      {canCancel && onCancel && (
        // Fora da linha do cartão (que tem o chip à direita): sobra largura para o rótulo caber numa linha.
        <KButton
          variant="danger"
          size="sm"
          style={styles.cancelBtn}
          onPress={onCancel}
          accessibilityLabel={`Cancelar agendamento de ${item.pet.nmPet} em ${formatDateBR(item.dtInicio)}`}
        >
          Cancelar agendamento
        </KButton>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: touchTarget.min, minWidth: touchTarget.min, padding: 14, borderWidth: 1, marginBottom: 10 },
  row:  { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  cancelBtn: { alignSelf: 'flex-start', marginTop: 10, marginLeft: 58 }, // 58 = retrato 44 + gap 14: alinha com o texto
  info: { flex: 1, gap: 2 },
  teleBtn: { alignSelf: 'flex-start', marginTop: 6 },
});
