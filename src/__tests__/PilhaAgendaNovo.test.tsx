// BR-TUT-G4 C-1: o formulário "Pedir horário" aberto de OUTRA aba (Saúde, aba Vacinas, FAB do pet) não pode
// ficar no topo da pilha da aba Agenda. Ele mora na pilha RAIZ, fora das abas: fechar/enviar volta à origem
// e a aba Agenda mostra "Minha agenda".
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { Text } from 'react-native';
import { Stack, Tabs, useRouter } from 'expo-router';
import { renderRouter, screen, fireEvent, act } from 'expo-router/testing-library';

const APP = path.join(__dirname, '..', 'app');

describe('C-1 — pedir horário fora da pilha da aba Agenda', () => {
  it('a rota do formulário não está sob (tabs)/agenda e existe na raiz', () => {
    expect(fs.existsSync(path.join(APP, '(tabs)', 'agenda', 'novo.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(APP, 'agenda', 'novo.tsx'))).toBe(true);
  });

  it('nenhum chamador usa o caminho antigo dentro das abas', () => {
    const files = [
      path.join(APP, '(tabs)', 'saude', 'index.tsx'),
      path.join(APP, '(tabs)', 'pets', '[id]', 'index.tsx'),
      path.join(APP, '(tabs)', 'agenda', 'index.tsx'),
      path.join(__dirname, '..', 'components', 'domain', 'VacinasTab.tsx'),
    ];
    for (const f of files) expect(fs.readFileSync(f, 'utf8')).not.toContain('(tabs)/agenda/novo');
  });

  it('com a árvore (abas + formulário na raiz): enviar/fechar volta à origem e a aba Agenda mostra o índice', () => {
    function Abrir() {
      const r = useRouter();
      return <Text onPress={() => r.push('/agenda/novo')}>abrir</Text>;
    }
    function Fechar() {
      const r = useRouter();
      return <Text onPress={() => r.back()}>fechar</Text>;
    }
    renderRouter({
      _layout: () => <Stack screenOptions={{ headerShown: false }} />,
      '(tabs)/_layout': () => <Tabs screenOptions={{ headerShown: false }} />,
      '(tabs)/saude/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
      '(tabs)/saude/index': () => <><Text>SAUDE</Text><Abrir /></>,
      '(tabs)/agenda/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
      '(tabs)/agenda/index': () => <Text>MINHA AGENDA</Text>,
      'agenda/novo': () => <><Text>FORM</Text><Fechar /></>,
    }, { initialUrl: '/saude' });

    expect(screen.getByText('SAUDE')).toBeTruthy();
    fireEvent.press(screen.getByText('abrir'));
    expect(screen.getByText('FORM')).toBeTruthy();
    fireEvent.press(screen.getByText('fechar'));
    expect(screen.getByText('SAUDE')).toBeTruthy();
    act(() => { (require('expo-router').router).navigate('/agenda'); });
    expect(screen.getByText('MINHA AGENDA')).toBeTruthy();
    expect(screen.queryByText('FORM')).toBeNull();
  });
});
