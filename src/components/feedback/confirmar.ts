// BR-TUT-T05 — contrato compartilhado do ciclo (`confirmar`/`avisar`, igual ao da clínica,
// `mobile-clinica-rn/src/components/feedback/confirmar.ts`). No tutor quem desenha é o `KDialogProvider`
// (que já existia); aqui só há o canal por módulo para qualquer tela chamar sem `useDialog()`.
// Sem provider montado, `confirmar` devolve `false` (falha segura: a ação decisória NÃO acontece sem
// confirmação visível) e `avisar` resolve.
import type { KDialogApi } from '../primitives/KDialog';

export type OpcoesConfirmar = {
  titulo: string;
  mensagem?: string;
  /** Verbo da ação, escrito no botão ("Revogar consentimento", "Sair"). */
  verbo: string;
  destrutivo?: boolean;
  /** Rótulo do botão de recusa; padrão "Cancelar". */
  rotuloCancelar?: string;
};

export type OpcoesAvisar = { titulo: string; mensagem?: string };

let api: KDialogApi | null = null;

/** Usado só pelo `KDialogProvider`. Devolve a função que desregistra. */
export function registrarDialogo(a: KDialogApi): () => void {
  api = a;
  return () => {
    if (api === a) api = null;
  };
}

export function confirmar(o: OpcoesConfirmar): Promise<boolean> {
  if (!api) {
    if (__DEV__) console.warn('confirmar(): nenhum KDialogProvider montado — ação NÃO confirmada.');
    return Promise.resolve(false);
  }
  return api.confirmar({
    titulo: o.titulo,
    mensagem: o.mensagem,
    confirmar: o.verbo,
    cancelar: o.rotuloCancelar,
    destrutivo: o.destrutivo,
  });
}

export function avisar(o: OpcoesAvisar): Promise<void> {
  if (!api) {
    if (__DEV__) console.warn('avisar(): nenhum KDialogProvider montado.');
    return Promise.resolve();
  }
  return api.alerta(o.titulo, o.mensagem);
}
