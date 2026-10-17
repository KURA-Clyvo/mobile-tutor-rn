import React, { useState, useRef } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@theme/index';
import { KButton }    from '@components/primitives/KButton';
import { KPetPortrait, racaToPalette } from '@components/primitives/KPetPortrait';
import { KIcon }      from '@components/primitives/KIcon';
import { useDialog }  from '@components/primitives/KDialog';
import { useToast }   from '@components/feedback/Toast';
import { QueryState } from '@components/feedback/QueryState';
import { usePets }    from '../../../hooks/usePets';
import { useSolicitarAgendamento } from '../../../hooks/useAgendamentos';
import { useVoltar } from '../../../hooks/useVoltar';
import { diasOferecidos, instanteDoPeriodo, periodoOferecido, PERIODOS, type Periodo } from '../../../utils/horariosPedido';
import type { SolicitarAgendamentoRequest } from '../../../types/api';
import { touchTarget } from '@theme/tokens';

type Motivo = 'VACINA' | 'ROTINA' | 'RETORNO' | 'TELEORIENTACAO';

// BR-TUT-T07 (canvas TutorAgendar v13): o motivo é o tipo de atendimento; não há campo de texto livre.
const MOTIVOS: { key: Motivo; rotulo: string }[] = [
  { key: 'VACINA',         rotulo: 'Vacina' },
  { key: 'ROTINA',         rotulo: 'Consulta de rotina' },
  { key: 'RETORNO',        rotulo: 'Retorno' },
  { key: 'TELEORIENTACAO', rotulo: 'Teleorientação' },
];
const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

type Pet = NonNullable<ReturnType<typeof usePets>['data']>[number];

export default function NovoAgendamentoScreen() {
  const { colors, fonts, fontSize } = useTheme();
  const insets  = useSafeAreaInsets();
  // TASK-F02: destino de fallback quando esta tela é alcançada sem histórico (ex.: deep link direto).
  const voltar  = useVoltar('/(tabs)/agenda');
  const petsQuery = usePets();

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.headerRow, { paddingTop: insets.top + 12, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => voltar()} style={[styles.circle, { backgroundColor: colors.surface, borderColor: colors.border }]} hitSlop={8} accessibilityRole="button" accessibilityLabel="Fechar">
          <KIcon name="close" size={18} color={colors.text} />
        </Pressable>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.md }}>Pedir horário</Text>
        <View style={{ width: touchTarget.min }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <QueryState
          query={petsQuery}
          empty={
            <Text style={{ fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.md, textAlign: 'center', paddingVertical: 32 }}>
              Você ainda não tem pet cadastrado. A clínica faz o cadastro; depois dele você pede o horário por aqui.
            </Text>
          }
        >
          {(pets) => <Formulario pets={pets} voltar={voltar} />}
        </QueryState>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Formulario({ pets, voltar }: { pets: Pet[]; voltar: () => void }) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const { alerta } = useDialog();
  const toast = useToast();
  const { idPet: idPetParam, tipo: tipoParam } = useLocalSearchParams<{ idPet?: string; tipo?: string }>();
  const { mutateAsync: solicitar, isPending } = useSolicitarAgendamento();

  const [escolhido, setEscolhido] = useState<number | null>(null);
  const [motivo, setMotivo] = useState<Motivo | null>(MOTIVOS.some((m) => m.key === tipoParam) ? (tipoParam as Motivo) : null);
  const [diaKey, setDiaKey] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState<Periodo | null>(null);
  const [expirou, setExpirou] = useState(false);

  // O pet marcado é: o que o tutor tocou; senão o do perfil (params.idPet); senão o único pet. Com 2+ pets e sem params
  // nada vem marcado — o tutor escolhe, em vez de o app mandar o pedido do pet errado em silêncio.
  const doParam = idPetParam ? pets.find((p) => p.id === parseInt(idPetParam, 10)) : undefined;
  const selectedPet = pets.find((p) => p.id === escolhido) ?? doParam ?? (pets.length === 1 ? pets[0] : undefined);

  const dias = diasOferecidos(new Date());
  const dia = dias.find((d) => d.data.getTime() === diaKey);
  const periodoEf = dia && periodo && dia.periodos.includes(periodo) ? periodo : null;
  const motivoSel = MOTIVOS.find((m) => m.key === motivo);

  // BR-TUT-T05 (m3): trava síncrona — `isPending` só vale depois do re-render, e dois toques seguidos chamam o serviço 2×.
  const emVoo = useRef(false);

  const handleSubmit = async () => {
    if (emVoo.current) return;
    if (!selectedPet || !motivoSel || !dia || !periodoEf) {
      const faltas = [!selectedPet && 'o pet', !motivoSel && 'o motivo', !dia && 'o dia', !periodoEf && 'o período'].filter(Boolean);
      await alerta('Atenção', faltas.map((f) => `Escolha ${f}.`).join(' '));
      return;
    }
    // A tela pode ter ficado aberta: reconfere com o relógio de AGORA (BR-TUT-T07 I-4). Período que passou: desmarca, avisa, não envia.
    if (!periodoOferecido(dia.data, periodoEf, new Date())) {
      setPeriodo(null);
      setExpirou(true);
      return;
    }
    const preferencia = `${DIAS_SEMANA[dia.data.getDay()]} ${dia.data.getDate()}, ${PERIODOS.find((p) => p.key === periodoEf)!.rotulo.toLowerCase()}`;
    const req: SolicitarAgendamentoRequest = {
      idPet:          selectedPet.id,
      sgTipoConsulta: motivoSel.key,
      dsMotivo:       `${motivoSel.rotulo}. Preferência: ${preferencia}.`,
      dtPreferida:    instanteDoPeriodo(dia.data, periodoEf).toISOString(),
    };
    emVoo.current = true;
    try {
      await solicitar(req);
      // BR-TUT-T05: toast com o verbo só depois da resposta; TASK-F02: voltar() lê canGoBack() no momento da chamada.
      toast.show({ tipo: 'sucesso', texto: 'Horário solicitado' });
      voltar();
    } catch {
      toast.show({ tipo: 'erro', texto: 'Não foi possível solicitar o horário. Tente novamente.' });
    } finally {
      emVoo.current = false;
    }
  };

  const rotuloSecao = [styles.sectionLabel, { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: fontSize.md }];
  // Opção de rádio: alvo >= 44, rótulo visível, estado `checked` anunciado.
  const radio = (key: string | number, rotulo: string, marcado: boolean, onPress: () => void, filhos: React.ReactNode, estilo?: object) => (
    <Pressable
      key={key}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: marcado }}
      accessibilityLabel={rotulo}
      style={[styles.opcao, estilo, {
        backgroundColor: marcado ? colors.primarySoft : colors.surface,
        borderColor:     marcado ? colors.primary : colors.borderControl,
        borderWidth:     marcado ? 2 : 1.5,
        borderRadius: radius.md,
      }]}
    >
      {filhos}
    </Pressable>
  );
  const texto = (marcado: boolean) => ({ fontFamily: fonts.bodyMedium, fontSize: fontSize.sm, color: marcado ? colors.primary : colors.text });

  return (
    <>
      <Text style={rotuloSecao}>Para quem é o horário?</Text>
      <View accessibilityRole={'radiogroup' as any} accessibilityLabel="Para quem é o horário?" style={styles.coluna}>
        {pets.map((p) => {
          const marcado = selectedPet?.id === p.id;
          return radio(p.id, `${p.nome}, ${p.raca}, ${p.idadeAnos} anos`, marcado, () => setEscolhido(p.id), (
            <>
              {/* Sem `nome` no retrato: o texto ao lado já diz o nome (evita leitura dupla no leitor de tela). */}
              <KPetPortrait palette={racaToPalette(p.raca)} size={40} fotoUrl={p.fotoThumbUrl} />
              <View style={{ flex: 1 }}>
                <Text style={texto(marcado)}>{p.nome}</Text>
                <Text style={{ fontFamily: fonts.body, color: marcado ? colors.textSoft : colors.textMuteInk, fontSize: fontSize.xs }}>{p.raca} · {p.idadeAnos}a</Text>
              </View>
            </>
          ), styles.linha);
        })}
      </View>

      <Text style={rotuloSecao}>Motivo</Text>
      <View accessibilityRole={'radiogroup' as any} accessibilityLabel="Motivo" style={styles.coluna}>
        {MOTIVOS.map((m) => radio(m.key, m.rotulo, motivo === m.key, () => setMotivo(m.key), (
          <Text style={texto(motivo === m.key)}>{m.rotulo}</Text>
        )))}
      </View>
      <Text style={[styles.nota, { fontFamily: fonts.body, color: colors.textSoft, fontSize: fontSize.sm, textAlign: 'left' }]}>
        Se for urgente, não espere pelo pedido: procure a clínica ou um pronto-atendimento veterinário agora.
      </Text>

      <Text style={rotuloSecao}>Quando fica bom para você</Text>
      <View accessibilityRole={'radiogroup' as any} accessibilityLabel="Quando fica bom para você" style={styles.dias}>
        {dias.map((d) => {
          const rotulo = `${DIAS_SEMANA[d.data.getDay()]} ${d.data.getDate()}`;
          const marcado = dia?.data.getTime() === d.data.getTime();
          return radio(d.data.getTime(), rotulo, marcado, () => { setDiaKey(d.data.getTime()); setExpirou(false); }, (
            <Text style={texto(marcado)}>{rotulo}</Text>
          ), styles.dia);
        })}
      </View>
      {dia && (
        <View accessibilityRole={'radiogroup' as any} accessibilityLabel="Período" style={styles.dias}>
          {PERIODOS.filter((p) => dia.periodos.includes(p.key)).map((p) =>
            radio(p.key, p.rotulo, periodoEf === p.key, () => { setPeriodo(p.key); setExpirou(false); }, (
              <Text style={texto(periodoEf === p.key)}>{p.rotulo}</Text>
            ), styles.dia))}
        </View>
      )}

      {expirou && (
        <Text accessibilityRole="alert" style={[styles.nota, { fontFamily: fonts.body, color: colors.clayInk, fontSize: fontSize.sm, textAlign: 'left' }]}>
          Esse período já passou. Escolha outro para pedir o horário.
        </Text>
      )}
      <KButton variant="primary" block loading={isPending} onPress={handleSubmit} style={{ marginTop: 20 }}>
        {selectedPet ? `Pedir horário para ${selectedPet.nome}` : 'Pedir horário'}
      </KButton>
      <Text style={[styles.nota, { fontFamily: fonts.body, color: colors.textMuteInk, fontSize: fontSize.xs }]}>
        O pedido aparece em Agenda como Aguardando até a clínica confirmar.
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  circle:      { width: touchTarget.min, height: touchTarget.min, borderRadius: touchTarget.min / 2, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:      { padding: 20, paddingBottom: 40 },
  sectionLabel:{ marginTop: 20, marginBottom: 10 },
  coluna:      { gap: 8 },
  dias:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  opcao:       { minHeight: touchTarget.min, minWidth: touchTarget.min, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  linha:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dia:         { alignItems: 'center' },
  nota:        { textAlign: 'center', marginTop: 12, lineHeight: 18 },
});
