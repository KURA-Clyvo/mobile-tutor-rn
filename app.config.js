// S4-MOB-02: injeta o commit do build no `extra` para a tela "Sobre o App" (rubrica Sprint 4: a tela
// tem de exibir o hash do commit da versão PUBLICADA). O hash nunca é digitado à mão.
// - No EAS (nuvem), `EAS_BUILD_GIT_COMMIT_HASH` é o commit que o EAS buildou.
// - Local (expo start / build local), vem do `git rev-parse HEAD`, e `alteracoesLocais` marca working
//   tree suja: um build com mudança não commitada NÃO corresponde ao hash, e a tela avisa isso.
// O resto da config continua no app.json (o Expo passa ele em `config`).
const { execSync } = require('child_process');

function rodarGit(args) {
  return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
}

function resolverCommit(env = process.env, git = rodarGit) {
  if (env.EAS_BUILD_GIT_COMMIT_HASH) return { commit: env.EAS_BUILD_GIT_COMMIT_HASH, alteracoesLocais: false };
  try {
    return { commit: git('rev-parse HEAD'), alteracoesLocais: git('status --porcelain').length > 0 };
  } catch {
    return { commit: null, alteracoesLocais: false };
  }
}

module.exports = ({ config }) => ({
  ...config,
  extra: { ...config.extra, build: resolverCommit() },
});
module.exports.resolverCommit = resolverCommit;
