#!/usr/bin/env bash
# scripts/f09-mutation-proof.sh
#
# TASK-F09 — prova de mutação VERSIONADA do gate `src/__tests__/arquitetura-gate.test.ts`.
#
# Por que este script existe no repo, e não como comando de uso único:
# as 5 classes de bug que o gate cobre JÁ ESTAVAM LIMPAS quando o gate foi
# escrito. Um teste tautológico (varre diretório errado, detector que nunca casa,
# recursão de 1 nível) PASSA nesse cenário e não protege nada. A única evidência
# de que o gate morde é introduzir a regressão de propósito e ver o teste ficar
# vermelho. Um implementador anterior deste ciclo APAGOU o script da própria
# prova, e ela virou alegação — por isso este fica versionado.
#
# Cada mutação roda em RODADA ISOLADA (`jest -t`), porque o runner para na
# primeira falha e uma prova de mordida já foi invalidada por isso neste
# ecossistema (precedente FIX_7).
#
# Uso:  bash scripts/f09-mutation-proof.sh
# Requisito: working tree LIMPA. O script reverte tudo que muda, inclusive se
# você interromper (trap EXIT).

set -u
cd "$(dirname "$0")/.."

GATE="src/__tests__/arquitetura-gate.test.ts"
FALHAS_ESPERADAS=0
INESPERADO=0

restaurar() {
  if [ -f "src/app/(tabs)/saude/_layout.tsx.mutado" ]; then
    mv -f "src/app/(tabs)/saude/_layout.tsx.mutado" "src/app/(tabs)/saude/_layout.tsx"
  fi
  git checkout -- src/ 2>/dev/null
}
trap restaurar EXIT

rodar() {
  # $1 = número da mutação, $2 = descrição, $3 = nome do teste (-t)
  echo ""
  echo "=============================================================="
  echo "MUTACAO $1 — $2"
  echo "=============================================================="
  # GUARDA ANTI-NO-OP: se a mutação não alterou nada, a rodada é inútil e
  # PARECERIA um gate tautológico. Aconteceu de verdade na 1a execução (mutação 2).
  if [ -z "$(git status --porcelain -- src/)" ]; then
    echo ">>> ABORTADO: a mutacao $1 NAO alterou nenhum arquivo (regex/rename falhou)."
    echo ">>> Rodada invalida - corrija a mutacao antes de interpretar o resultado."
    INESPERADO=$((INESPERADO + 1))
    return
  fi
  echo "--- diff aplicado ---"
  git status --porcelain -- src/
  npx jest --watchAll=false "$GATE" -t "$3" 2>&1 | tail -n 30
  local st=${PIPESTATUS[0]}
  if [ "$st" -ne 0 ]; then
    echo ">>> RESULTADO: FALHOU (esperado) — o gate mordeu."
    FALHAS_ESPERADAS=$((FALHAS_ESPERADAS + 1))
  else
    echo ">>> RESULTADO: PASSOU — GATE TAUTOLOGICO, NAO PROTEGE NADA."
    INESPERADO=$((INESPERADO + 1))
  fi
  restaurar
}

# --- Mutação 1: tira o `export default` de uma rota de 3o nível -------------
# Alvo em `(tabs)/pets/[id]/index.tsx` de propósito: é o nível mais profundo,
# invisível para uma varredura de 1 nível.
perl -0pi -e 's/export default function/function/' "src/app/(tabs)/pets/[id]/index.tsx"
rodar 1 "src/app/(tabs)/pets/[id]/index.tsx sem export default" \
      "nenhum arquivo de rota fica sem export default"

# --- Mutação 2: importa SafeAreaView de react-native -------------------------
perl -0pi -e "s/\A/import { SafeAreaView } from 'react-native';\n/" src/app/login.tsx
rodar 2 "src/app/login.tsx importando SafeAreaView de react-native" \
      "nenhum arquivo importa SafeAreaView de react-native"

# --- Mutação 3: chamada real a Alert.alert numa tela -------------------------
perl -0pi -e "s/\A/import { Alert } from 'react-native';\n/" src/app/notificacoes.tsx
perl -0pi -e "s/^export default function/Alert.alert('regressao F06');\nexport default function/m" src/app/notificacoes.tsx
rodar 3 "src/app/notificacoes.tsx chamando Alert.alert" \
      "nenhuma tela chama Alert.alert"

# --- Mutação 4: chamada crua a router.back() fora do helper ------------------
perl -0pi -e "s/^export default function/export function regressaoF02(router: any){ router.back(); }\nexport default function/m" "src/app/(tabs)/agenda/novo.tsx"
rodar 4 "src/app/(tabs)/agenda/novo.tsx chamando router.back() cru" \
      "nenhuma tela chama router.back"

# --- Mutação 5: aba declarada perde o _layout.tsx ---------------------------
mv "src/app/(tabs)/saude/_layout.tsx" "src/app/(tabs)/saude/_layout.tsx.mutado"
rodar 5 "aba 'saude' declarada em (tabs)/_layout.tsx mas sem _layout.tsx" \
      "cada aba declarada tem um _layout.tsx proprio"

echo ""
echo "=============================================================="
echo "RESUMO: $FALHAS_ESPERADAS/5 mutacoes derrubaram o gate (esperado: 5/5)."
echo "        $INESPERADO mutacao(oes) passaram indevidamente."
git status --porcelain
[ "$FALHAS_ESPERADAS" -eq 5 ] && [ "$INESPERADO" -eq 0 ]
