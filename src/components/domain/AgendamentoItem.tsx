import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import { KPetPortrait, racaToPalette } from '@components/primitives/KPetPortrait';
import { KChip } from '@components/primitives/KChip';
import { KButton } from '@components/primitives/KButton';
import type { AgendamentoTutorResponse } from '../../types/api';
import { formatDateBR, formatTimeBR } from '../../utils/date';

const STATUS_CHIP: Record<AgendamentoTutorResponse['sgStatus'], { tone: 'amber' | 'sage' | 'clay' | 'mute'; label: string }> = {
  SOLICITADO: { tone: 'amber', label: 'Aguardando' },
  AGENDADO:   { tone: 'sage',  label: 'Confirmado' },
  CONFIRMADO: { tone: 'sage',  label: 'Confirmado' },
  CANCELADO:  { tone: 'clay',  label: 'Cancelado'  },
  CONCLUIDO:  { tone: 'mute',  label: 'Concluído'  },
};

const TIPO_LABEL: Record<AgendamentoTutorResponse['sgTipoConsulta'], string> = {
  RETORNO:        'Retorno',
  ROTINA:         'Rotina',
  URGENCIA:       'Urgência',
  TELEORIENTACAO: 'Teleorientação',
};

interface AgendamentoItemProps {
  item:         AgendamentoTutorResponse;
  onLongPress?: () => void;
  /** T-7a: só é passado para agendamento que ainda pode ser remarcado. */
  onRemarcar?:  () => void;
}

export function AgendamentoItem({ item, onLongPress, onRemarcar }: AgendamentoItemProps) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const chip      = STATUS_CHIP[item.sgStatus];
  const canCancel = item.sgStatus === 'SOLICITADO' || item.sgStatus === 'AGENDADO';
  // T-7a: remarcar exige `nrVersion` (optimistic lock do Java). Sem ele o PUT
  // devolveria 400, então o botão não aparece — melhor não oferecer que oferecer e
  // falhar. O mock e o servidor real mandam; um agendamento vindo de cache antiga
  // pode não ter.
  const podeRemarcar = !!onRemarcar && canCancel && item.nrVersion != null;
  const podeEntrarNaTeleconsulta =
    item.sgTipoConsulta === 'TELEORIENTACAO' &&
    item.sgStatus !== 'CANCELADO' &&
    !!item.dsSalaUrl;

  return (
    <Pressable
      onLongPress={canCancel ? onLongPress : undefined}
      delayLongPress={500}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl },
        pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityHint={canCancel ? 'Toque longo para cancelar' : undefined}
    >
      {/* T-2: espécie e raça chegam com a SJ3-10 do backend. Sem elas o retrato cai
          na paleta neutra em vez de o card sumir — identidade do pet é o nome, que
          sempre vem. */}
      <KPetPortrait palette={racaToPalette(item.pet.nmRaca ?? '')} size={44} especie={item.pet.nmEspecie} />
      <View style={styles.info}>
        <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.md }}>{item.pet.nmPet}</Text>
        <Text style={{ fontFamily: fonts.body, color: colors.textMute, fontSize: fontSize.xs }}>
          {formatDateBR(item.dtInicio)} · {formatTimeBR(item.dtInicio)}
        </Text>
        <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.xs }}>
          {TIPO_LABEL[item.sgTipoConsulta]}{item.nmClinica ? ` · ${item.nmClinica}` : ''}
        </Text>
        {item.dsMensagemClinica && (
          <Text numberOfLines={1} style={{ fontFamily: fonts.body, color: colors.primary, fontSize: fontSize.xs }}>
            {item.dsMensagemClinica}
          </Text>
        )}
        {podeRemarcar && (
          <KButton
            variant="secondary"
            size="sm"
            style={styles.teleBtn}
            onPress={onRemarcar}
            accessibilityLabel={`Remarcar agendamento de ${item.pet.nmPet}`}
          >
            Remarcar
          </KButton>
        )}
        {podeEntrarNaTeleconsulta && (
          <KButton
            variant="primary"
            size="sm"
            style={styles.teleBtn}
            onPress={() => Linking.openURL(item.dsSalaUrl!)}
            accessibilityLabel="Entrar na teleconsulta"
          >
            Entrar na teleconsulta
          </KButton>
        )}
      </View>
      <KChip tone={chip.tone}>{chip.label}</KChip>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, marginBottom: 10, gap: 14 },
  info: { flex: 1, gap: 2 },
  teleBtn: { alignSelf: 'flex-start', marginTop: 6 },
});
