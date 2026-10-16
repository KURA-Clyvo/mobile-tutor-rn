// Roda o gate de cor do Jest e FALHA se nenhum teste executar de fato.
// Por que existe: `jest -t "padrao"` que não casa nada sai com EXIT=0 (todos "skipped"), então um describe
// renomeado desligaria o gate em silêncio no CI. Aqui exigimos >= 1 teste passado e 0 falhos.
// Uso: node scripts/check-gate.js "<padrao de -t>"
const { spawnSync } = require('child_process');
const padrao = process.argv[2];
if (!padrao) { console.error('uso: node scripts/check-gate.js "<padrao>"'); process.exit(2); }
const r = spawnSync(
  process.execPath,
  [require.resolve('jest/bin/jest'), '--watchAll=false', '--json', 'src/__tests__/cor-gates.test.ts', '-t', padrao],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);
let j;
try { j = JSON.parse(r.stdout); } catch (e) { console.error(r.stdout + r.stderr); console.error('check-gate: saída do jest ilegível'); process.exit(1); }
console.log(`check-gate "${padrao}": passed=${j.numPassedTests} failed=${j.numFailedTests} pending=${j.numPendingTests}`);
if (j.numFailedTests > 0 || r.status !== 0) { console.error(r.stderr); process.exit(1); }
if (j.numPassedTests === 0) { console.error(`check-gate: o padrão "${padrao}" não executou nenhum teste (gate desligado).`); process.exit(1); }
