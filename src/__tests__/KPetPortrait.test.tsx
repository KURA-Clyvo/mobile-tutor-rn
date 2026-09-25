import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/index';
import { KPetPortrait, racaToPalette } from '../components/primitives/KPetPortrait';

const W = ({ children }: any) => <ThemeProvider>{children}</ThemeProvider>;

describe('KPetPortrait', () => {
  const palettes = ['lab','siam','pup'] as const;
  const tiers    = ['emoji','photo','detected'] as const;

  palettes.forEach(p => tiers.forEach(t => {
    it(`renders ${p}/${t}`, () => {
      const { toJSON } = render(<KPetPortrait palette={p} tier={t} />, { wrapper: W });
      expect(toJSON()).toBeTruthy();
    });
  }));

  it('renders badge ✨', () => {
    const { toJSON } = render(<KPetPortrait palette="pup" badge="✨" />, { wrapper: W });
    expect(toJSON()).toBeTruthy();
  });

  // FT-08 — ramo com foto real (URL vinda do BFF Java, FT-05/FT-09).
  // Literais próprios aqui (regra do ciclo: não importar do módulo testado
  // nem do helper de cacheKey para montar o esperado).
  describe('foto real (FT-08)', () => {
    const FOTO_URL =
      'https://kura-tutor.vercel.app/proxy/tutor/api/v1/fotos/clinica/1/pet/2/uuid-fixo_1080.webp?exp=1790000000&sig=deadbeef';
    const CACHE_KEY_ESPERADA =
      'https://kura-tutor.vercel.app/proxy/tutor/api/v1/fotos/clinica/1/pet/2/uuid-fixo_1080.webp';

    it('com fotoUrl, renderiza a imagem real independente do tier (default "emoji")', () => {
      const { getByTestId, queryByText } = render(
        <KPetPortrait palette="lab" fotoUrl={FOTO_URL} />, { wrapper: W },
      );
      expect(getByTestId('k-pet-portrait-foto')).toBeTruthy();
      // com fotoUrl, nem o emoji do tier "emoji" (default) é renderizado.
      expect(queryByText('🐾')).toBeNull();
    });

    it('sem fotoUrl, mantém a ilustração por tier e não renderiza a imagem', () => {
      const { queryByTestId } = render(<KPetPortrait palette="lab" />, { wrapper: W });
      expect(queryByTestId('k-pet-portrait-foto')).toBeNull();
    });

    it('usa a URL completa (com query) como source.uri', () => {
      const { getByTestId } = render(
        <KPetPortrait palette="lab" fotoUrl={FOTO_URL} />, { wrapper: W },
      );
      const foto = getByTestId('k-pet-portrait-foto');
      // expo-image normaliza `source` para array (resolveSources) mesmo
      // recebendo um objeto único.
      expect(foto.props.source).toEqual([{ uri: FOTO_URL, cacheKey: CACHE_KEY_ESPERADA }]);
    });

    it('cacheKey (dentro de source) é a URL SEM a query string — mordida: usar a URL completa faz esta asserção falhar', () => {
      const { getByTestId } = render(
        <KPetPortrait palette="lab" fotoUrl={FOTO_URL} />, { wrapper: W },
      );
      const foto = getByTestId('k-pet-portrait-foto');
      // `cacheKey` é campo de `ImageSource` (dentro de `source`), não prop
      // solta do componente `<Image>` do expo-image.
      const cacheKey = foto.props.source[0].cacheKey;
      expect(cacheKey).toBe(CACHE_KEY_ESPERADA);
      expect(cacheKey).not.toContain('sig=');
      expect(cacheKey).not.toContain('exp=');
    });

    it('usa cachePolicy de disco e contentFit cover', () => {
      const { getByTestId } = render(
        <KPetPortrait palette="lab" fotoUrl={FOTO_URL} />, { wrapper: W },
      );
      const foto = getByTestId('k-pet-portrait-foto');
      expect(foto.props.cachePolicy).toBe('disk');
      expect(foto.props.contentFit).toBe('cover');
    });

    it('onError volta para a ilustração — mordida: remover o fallback faz este teste falhar', () => {
      const { getByTestId, queryByTestId } = render(
        <KPetPortrait palette="lab" fotoUrl={FOTO_URL} />, { wrapper: W },
      );
      const foto = getByTestId('k-pet-portrait-foto');
      fireEvent(foto, 'error', { nativeEvent: { error: 'falha ao carregar' } } as never);
      expect(queryByTestId('k-pet-portrait-foto')).toBeNull();
    });

    it('accessibilityLabel com o nome do pet no ramo COM foto', () => {
      const { getByLabelText } = render(
        <KPetPortrait palette="lab" fotoUrl={FOTO_URL} nome="Thor" />, { wrapper: W },
      );
      expect(getByLabelText('Foto de Thor')).toBeTruthy();
    });

    it('accessibilityLabel com o nome do pet no ramo SEM foto', () => {
      const { getByLabelText } = render(
        <KPetPortrait palette="lab" nome="Bolinha" />, { wrapper: W },
      );
      expect(getByLabelText('Foto de Bolinha')).toBeTruthy();
    });
  });
});

describe('racaToPalette', () => {
  it('maps Labrador → lab',          () => expect(racaToPalette('Labrador')).toBe('lab'));
  it('maps Siamesa → siam',          () => expect(racaToPalette('Siamesa')).toBe('siam'));
  it('maps SRD → pup',               () => expect(racaToPalette('SRD')).toBe('pup'));
  it('maps Golden Retriever → lab',  () => expect(racaToPalette('Golden Retriever')).toBe('lab'));
});
