import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  findNodeHandle,
} from 'react-native';
import { useTheme } from '@theme/index';
import { KButton } from './KButton';

// TASK-F05: substituto do `Alert.alert` nativo com a identidade visual do app.
//
// Por que API IMPERATIVA e await-ável: as 21 chamadas de `Alert.alert` deste app
// vivem no MEIO de handlers (`handleSubmit`, `handlePickPhoto`). Exigir estado
// local em 8 telas para abrir um diálogo declarativo transformaria a migração da
// F06 em reescrita de handler, não em troca de container. Com `await` o corpo do
// handler continua linear e o `if (!x) { ...; return; }` sobrevive intacto.
//
// 🔴 O provider NÃO é montado nesta task: montar `KDialogProvider` na raiz toca
// `src/app/_layout.tsx`, que está fora do escopo (F05 entrega o componente, F06
// migra as telas). Ver task-F05-report.md.

export type KDialogActionStyle = 'default' | 'cancel' | 'destructive';

export interface KDialogAction {
  /** Texto visível do botão. */
  label: string;
  /**
   * Valor devolvido pela promise quando este botão é tocado.
   * Ausente → cai no próprio `label` (evita duplicar string em caso trivial).
   */
  value?: string;
  style?: KDialogActionStyle;
}

export interface KDialogOptions {
  titulo: string;
  mensagem?: string;
  /** Ausente → um único botão "OK". */
  acoes?: KDialogAction[];
  /** Toque fora fecha o diálogo. Falso por padrão: aviso não deve sumir por acidente. */
  dispensavelPorFora?: boolean;
}

interface Requisicao {
  id: number;
  opcoes: KDialogOptions;
  resolver: (valor: string | null) => void;
}

const ACOES_PADRAO: KDialogAction[] = [{ label: 'OK' }];

function valorDe(acao: KDialogAction): string {
  return acao.value ?? acao.label;
}

/**
 * Valor devolvido quando o diálogo fecha sem escolha explícita (botão de voltar
 * do Android, toque fora): o `value` da ação de cancelar, se existir, senão null.
 */
function valorDeDispensa(acoes: KDialogAction[]): string | null {
  const cancelar = acoes.find(a => a.style === 'cancel');
  return cancelar ? valorDe(cancelar) : null;
}

// ---------------------------------------------------------------------------
// Componente de apresentação — controlado, sem estado de fila.
// Exportado separado do provider para poder ser renderizado/testado sozinho.
// ---------------------------------------------------------------------------

export interface KDialogProps {
  visivel: boolean;
  opcoes: KDialogOptions | null;
  /** Recebe o `value` da ação tocada, ou null quando dispensado. */
  onFechar: (valor: string | null) => void;
}

export function KDialog({ visivel, opcoes, onFechar }: KDialogProps) {
  const theme = useTheme();
  const cardRef = useRef<View>(null);

  const acoes = opcoes?.acoes && opcoes.acoes.length > 0 ? opcoes.acoes : ACOES_PADRAO;
  const naoCancelaveis = acoes.filter(a => a.style !== 'cancel');

  useEffect(() => {
    if (!visivel) return;
    // Foco de leitor de tela no cartão assim que ele aparece. Em jsdom/test
    // renderer `findNodeHandle` costuma devolver null — daí a guarda; o efeito
    // real só é observável em dispositivo (declarado como NÃO verificado).
    try {
      const node = findNodeHandle(cardRef.current);
      if (node != null) AccessibilityInfo.setAccessibilityFocus(node);
    } catch {
      // Ambiente sem host component real (teste). Não é erro de produto.
    }
  }, [visivel]);

  if (!opcoes) return null;

  const dispensar = () => onFechar(valorDeDispensa(acoes));

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      // Android: botão físico de voltar precisa fechar o diálogo, senão ele
      // vira armadilha de navegação (mesma classe da TASK-F11).
      onRequestClose={dispensar}
      // A F07 deixou este ponto em aberto no Modal de perfil; aqui já nasce
      // declarado para o overlay cobrir a área da status bar no Android.
      statusBarTranslucent
      accessibilityViewIsModal
    >
      <Pressable
        style={[
          styles.overlay,
          { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.66)' : 'rgba(0,0,0,0.45)' },
        ]}
        onPress={opcoes.dispensavelPorFora ? dispensar : undefined}
        accessible={false}
        testID="kdialog-overlay"
      >
        <View
          ref={cardRef}
          testID="kdialog-card"
          accessible
          accessibilityViewIsModal
          accessibilityRole="alert"
          accessibilityLabel={opcoes.titulo}
          // O cartão intercepta o toque para o overlay não fechar quando o
          // usuário toca dentro do diálogo.
          onStartShouldSetResponder={() => true}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.xl,
              padding: theme.spacing[6],
              gap: theme.spacing[2],
            },
          ]}
        >
          <Text
            testID="kdialog-titulo"
            accessibilityRole="header"
            style={{
              fontFamily: theme.fonts.display,
              color: theme.colors.text,
              fontSize: theme.fontSize.lg,
              lineHeight: 26,
            }}
          >
            {opcoes.titulo}
          </Text>

          {opcoes.mensagem ? (
            <Text
              testID="kdialog-mensagem"
              style={{
                fontFamily: theme.fonts.body,
                color: theme.colors.textSoft,
                fontSize: theme.fontSize.sm,
                lineHeight: 20,
              }}
            >
              {opcoes.mensagem}
            </Text>
          ) : null}

          <View style={[styles.acoes, { marginTop: theme.spacing[4], gap: theme.spacing[2] }]}>
            {acoes.map((acao, i) => {
              const destrutiva = acao.style === 'destructive';
              const cancelar = acao.style === 'cancel';
              // Ênfase primária só quando existe UMA ação não-cancelável — num
              // action sheet de 3 opções, três botões cheios brigariam entre si.
              const variant = destrutiva
                ? 'danger'
                : cancelar
                  ? 'ghost'
                  : naoCancelaveis.length === 1
                    ? 'primary'
                    : 'secondary';
              return (
                <KButton
                  key={`${acao.label}-${i}`}
                  variant={variant}
                  block
                  onPress={() => onFechar(valorDe(acao))}
                  testID={`kdialog-acao-${valorDe(acao)}`}
                  accessibilityHint={destrutiva ? 'Ação destrutiva. Não pode ser desfeita.' : undefined}
                >
                  {acao.label}
                </KButton>
              );
            })}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Camada imperativa
// ---------------------------------------------------------------------------

export interface ConfirmarOptions {
  titulo: string;
  mensagem?: string;
  /** Texto do botão que confirma. Padrão: "Confirmar". */
  confirmar?: string;
  /** Texto do botão que cancela. Padrão: "Cancelar". */
  cancelar?: string;
  /** Pinta o botão de confirmação como destrutivo e o anuncia como tal. */
  destrutivo?: boolean;
}

export interface KDialogApi {
  /** Primitiva geral: devolve o `value` da ação tocada, ou null se dispensado. */
  mostrar: (opcoes: KDialogOptions) => Promise<string | null>;
  /** Aviso simples de um botão. Resolve DEPOIS de o diálogo desmontar. */
  alerta: (titulo: string, mensagem?: string, rotuloOk?: string) => Promise<void>;
  /** Confirmação de dois botões. `true` só quando a confirmação é tocada. */
  confirmar: (opcoes: ConfirmarOptions) => Promise<boolean>;
}

const KDialogContext = createContext<KDialogApi | null>(null);

export function KDialogProvider({ children }: { children?: React.ReactNode }) {
  const [fila, setFila] = useState<Requisicao[]>([]);
  const proximoId = useRef(0);
  // Resoluções só disparam DEPOIS do commit que remove o diálogo da árvore.
  const pendentes = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (pendentes.current.length === 0) return;
    const prontas = pendentes.current;
    pendentes.current = [];
    prontas.forEach(fn => fn());
  });

  const mostrar = useCallback((opcoes: KDialogOptions) => {
    return new Promise<string | null>(resolve => {
      proximoId.current += 1;
      const req: Requisicao = { id: proximoId.current, opcoes, resolver: resolve };
      setFila(f => [...f, req]);
    });
  }, []);

  const atual = fila[0] ?? null;

  const onFechar = useCallback((valor: string | null) => {
    setFila(f => {
      const [primeiro, ...resto] = f;
      if (!primeiro) return f;
      // 🔴 Padrão 3 (callback no OK): a resolução é ENFILEIRADA aqui e executada
      // no useEffect acima, ou seja, no ciclo seguinte ao commit que desmonta o
      // Modal. Resolver de forma síncrona faria `router.back()` rodar com o
      // diálogo ainda montado.
      pendentes.current.push(() => primeiro.resolver(valor));
      return resto;
    });
  }, []);

  const api = useMemo<KDialogApi>(() => ({
    mostrar,
    alerta: async (titulo, mensagem, rotuloOk) => {
      await mostrar({ titulo, mensagem, acoes: [{ label: rotuloOk ?? 'OK' }] });
    },
    confirmar: async ({ titulo, mensagem, confirmar: rotuloOk, cancelar: rotuloCancelar, destrutivo }) => {
      const escolha = await mostrar({
        titulo,
        mensagem,
        acoes: [
          { label: rotuloCancelar ?? 'Cancelar', value: '__cancelar__', style: 'cancel' },
          {
            label: rotuloOk ?? 'Confirmar',
            value: '__confirmar__',
            style: destrutivo ? 'destructive' : 'default',
          },
        ],
      });
      return escolha === '__confirmar__';
    },
  }), [mostrar]);

  return (
    <KDialogContext.Provider value={api}>
      {children}
      <KDialog visivel={atual !== null} opcoes={atual?.opcoes ?? null} onFechar={onFechar} />
    </KDialogContext.Provider>
  );
}

export function useDialog(): KDialogApi {
  const ctx = useContext(KDialogContext);
  if (!ctx) throw new Error('useDialog precisa estar dentro de <KDialogProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card:    { width: '100%', maxWidth: 420, borderWidth: 1 },
  acoes:   { width: '100%' },
});
