import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { StateStorage } from 'zustand/middleware';

/**
 * Chave do JWT no SecureStore. Separada da chave do `persist` de propósito: o token
 * mora no Keystore/Keychain e o resto do store no AsyncStorage.
 */
export const CHAVE_TOKEN = 'KURA_TUTOR_JWT';

/**
 * Storage do `persist` do Zustand que mantém o JWT fora do armazenamento em claro.
 *
 * POR QUE SÓ O TOKEN VAI PARA O SECURESTORE: ele tem limite de 2048 bytes por valor
 * (`VALUE_BYTES_LIMIT`, expo-secure-store/src/byteCounter.ts) e acima disso o SDK avisa
 * que a gravação pode falhar — e promete lançar numa versão futura. O resto do store
 * (`tutor`, `expiresAt`, `themeOverride`) não é segredo e cresce sem teto previsível;
 * empurrar tudo para lá trocaria um problema de sigilo por um de tamanho.
 *
 * MIGRAÇÃO: quem já tem o app instalado tem o token gravado em claro dentro do blob do
 * AsyncStorage. A leitura aceita esse formato, move o token para o SecureStore e
 * regrava o blob sem ele — ninguém é deslogado, e o valor em claro não sobrevive à
 * primeira abertura.
 *
 * WEB: `expo-secure-store` não existe no navegador (o módulo web do pacote é
 * literalmente `export default {}`). Lá o token continua no AsyncStorage: degradar é
 * melhor que quebrar o alvo web, e `isAvailableAsync()` é quem decide — não um
 * `Platform.OS === 'web'` que só cobre o caso que lembramos.
 */
export function criarAuthStorage(): StateStorage {
  let disponivel: boolean | null = null;
  const secureStoreDisponivel = async () => {
    if (disponivel === null) {
      disponivel = await SecureStore.isAvailableAsync().catch(() => false);
    }
    return disponivel;
  };

  return {
    async getItem(name) {
      const cru = await AsyncStorage.getItem(name);
      if (!cru) return null;
      if (!(await secureStoreDisponivel())) return cru;

      const env = JSON.parse(cru);
      const doSecure = await SecureStore.getItemAsync(CHAVE_TOKEN);

      if (doSecure) {
        env.state.token = doSecure;
        return JSON.stringify(env);
      }

      // Sem token no SecureStore: ou não há sessão, ou é o formato antigo (token em
      // claro no blob). No segundo caso, migra agora — mover na LEITURA e não esperar
      // a próxima escrita é o que garante que o valor em claro não fica mais um ciclo
      // de vida do app no disco.
      const emClaro = env.state?.token;
      if (typeof emClaro === 'string' && emClaro.length > 0) {
        await SecureStore.setItemAsync(CHAVE_TOKEN, emClaro);
        await AsyncStorage.setItem(name, JSON.stringify({ ...env, state: { ...env.state, token: null } }));
      }
      return cru;
    },

    async setItem(name, value) {
      if (!(await secureStoreDisponivel())) {
        await AsyncStorage.setItem(name, value);
        return;
      }
      const env = JSON.parse(value);
      const token = env.state?.token;

      if (typeof token === 'string' && token.length > 0) {
        await SecureStore.setItemAsync(CHAVE_TOKEN, token);
      } else {
        await SecureStore.deleteItemAsync(CHAVE_TOKEN);
      }
      await AsyncStorage.setItem(name, JSON.stringify({ ...env, state: { ...env.state, token: null } }));
    },

    async removeItem(name) {
      await AsyncStorage.removeItem(name);
      if (await secureStoreDisponivel()) await SecureStore.deleteItemAsync(CHAVE_TOKEN);
    },
  };
}
