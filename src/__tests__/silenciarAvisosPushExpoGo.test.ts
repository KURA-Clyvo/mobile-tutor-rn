import fs from 'fs';
import path from 'path';
import {
  ehAvisoDePushDoExpoGo,
  aplicarFiltroDeAvisosPush,
  type ConsoleFiltravel,
} from '../utils/silenciarAvisosPushExpoGo.fx';

// TASK-F04. O risco real de regressão não é o nosso código mudar — é a Expo mudar
// o TEXTO do aviso num bump de SDK, e o filtro virar no-op em silêncio. Por isso os
// casos abaixo NÃO usam literais copiados à mão: extraem a mensagem da fonte
// instalada em node_modules. Se o texto da biblioteca mudar, estes testes falham.

const raizLib = path.join(__dirname, '..', '..', 'node_modules', 'expo-notifications', 'src');

function extrairMensagem(arquivo: string, ancora: string): string {
  const fonte = fs.readFileSync(path.join(raizLib, arquivo), 'utf8');
  const idx = fonte.indexOf(ancora);
  expect(idx).toBeGreaterThan(-1); // a âncora sumiu => a biblioteca mudou
  return ancora;
}

describe('filtro dos avisos de push do Expo Go (TASK-F04)', () => {
  const avisoDeChamadaDePush = extrairMensagem(
    'warnOfExpoGoPushUsage.ts',
    'expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go',
  );
  const avisoDeCargaDeModulo = extrairMensagem(
    'index.ts',
    '`expo-notifications` functionality is not fully supported in Expo Go',
  );

  it('reconhece os 2 avisos que a biblioteca realmente emite', () => {
    expect(ehAvisoDePushDoExpoGo([avisoDeChamadaDePush + ' Use a development build...'])).toBe(true);
    expect(ehAvisoDePushDoExpoGo([avisoDeCargaDeModulo + ':\nWe recommend...'])).toBe(true);
  });

  it('NÃO engole nada além desses 2 — inclusive erros parecidos', () => {
    expect(ehAvisoDePushDoExpoGo(['[Push] falha ao registrar push token — status: 500'])).toBe(false);
    expect(ehAvisoDePushDoExpoGo(['expo-notifications: outro problema qualquer'])).toBe(false);
    expect(ehAvisoDePushDoExpoGo([new Error('boom')])).toBe(false);
    expect(ehAvisoDePushDoExpoGo([])).toBe(false);
  });

  it('descarta os 2 avisos e deixa passar o resto, em error e em warn', () => {
    const errosVistos: unknown[][] = [];
    const avisosVistos: unknown[][] = [];
    const logsVistos: unknown[][] = [];
    const falso: ConsoleFiltravel = {
      error: (...a: unknown[]) => { errosVistos.push(a); },
      warn:  (...a: unknown[]) => { avisosVistos.push(a); },
      log:   (...a: unknown[]) => { logsVistos.push(a); },
    };

    aplicarFiltroDeAvisosPush(falso);

    falso.error(avisoDeChamadaDePush + ' etc');
    falso.warn(avisoDeCargaDeModulo + ' etc');
    falso.error('erro de verdade que precisa aparecer');
    falso.warn('aviso de verdade que precisa aparecer');

    expect(errosVistos).toEqual([['erro de verdade que precisa aparecer']]);
    expect(avisosVistos).toEqual([['aviso de verdade que precisa aparecer']]);
  });

  it('imprime uma única linha própria no lugar, sem gerar outro toast', () => {
    const logsVistos: unknown[][] = [];
    const falso: ConsoleFiltravel = {
      error: () => {}, warn: () => {},
      log: (...a: unknown[]) => { logsVistos.push(a); },
    };

    aplicarFiltroDeAvisosPush(falso);

    expect(logsVistos).toHaveLength(1);
    expect(String((logsVistos[0] ?? [])[0])).toContain('push remoto indisponível');
    // `log`, nunca `warn`/`error`: os dois últimos voltariam a produzir toast.
  });
});
