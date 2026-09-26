import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      // getByTestId, não getByLabelText: com o fix do G2-4 a `<Image>`
      // TAMBÉM carrega `accessibilityLabel` — o RTL, ao contrário de um
      // leitor de tela real, não sabe que o `accessible` do container
      // absorve o filho, e `getByLabelText` acharia 2 elementos (ver
      // describe G2-4 abaixo).
      const { getByTestId } = render(
        <KPetPortrait palette="lab" fotoUrl={FOTO_URL} nome="Thor" />, { wrapper: W },
      );
      expect(getByTestId('k-pet-portrait-foto').props.accessibilityLabel).toBe('Foto de Thor');
    });

    it('accessibilityLabel com o nome do pet no ramo SEM foto — G2-5: "Avatar de X", não "Foto de X" (não existe foto nenhuma)', () => {
      const { getByLabelText, queryByLabelText } = render(
        <KPetPortrait palette="lab" nome="Bolinha" />, { wrapper: W },
      );
      expect(getByLabelText('Avatar de Bolinha')).toBeTruthy();
      expect(queryByLabelText('Foto de Bolinha')).toBeNull();
    });

    // G2-2: o reset de `erroFoto` quando a `fotoUrl` muda não tinha teste —
    // mordida: remover o `useEffect([fotoUrl])` passa verde (G2, T6,
    // `26 passed`, `EXIT=0`, "NINGUÉM" pegava). Cenário real: URL expira, o
    // `onError` dispara, o pet é recarregado com uma URL nova — sem o reset
    // o avatar ficaria preso na ilustração mesmo com a foto nova válida.
    it('G2-2 — após onError, uma NOVA fotoUrl reseta erroFoto e volta a tentar a imagem', () => {
      const FOTO_2 =
        'https://kura-tutor.vercel.app/proxy/tutor/api/v1/fotos/clinica/1/pet/2/uuid-novo_1080.webp?exp=1790099999&sig=novasig';
      const { getByTestId, queryByTestId, rerender } = render(
        <KPetPortrait palette="lab" fotoUrl={FOTO_URL} />, { wrapper: W },
      );
      const foto1 = getByTestId('k-pet-portrait-foto');
      fireEvent(foto1, 'error', { nativeEvent: { error: 'expirou' } } as never);
      expect(queryByTestId('k-pet-portrait-foto')).toBeNull();

      // `rerender` (RTL) reaplica o `wrapper` (`W`) sozinho — passar
      // `<W>...</W>` aqui envolveria DUAS vezes, mudando a posição do
      // `KPetPortrait` na árvore e forçando um remount que resetaria
      // `erroFoto` por conta própria, mascarando a mordida (medido: sem
      // isto a mutação NÃO era pega, `EXIT=0` — falso negativo).
      rerender(<KPetPortrait palette="lab" fotoUrl={FOTO_2} />);

      const foto2 = getByTestId('k-pet-portrait-foto');
      expect(foto2.props.source).toEqual([
        { uri: FOTO_2, cacheKey: 'https://kura-tutor.vercel.app/proxy/tutor/api/v1/fotos/clinica/1/pet/2/uuid-novo_1080.webp' },
      ]);
    });

    // G2-3: a asserção de "sem ilustração por baixo da foto" só cobria o
    // tier "emoji" (queryByText('🐾')) — nos tiers "photo"/"detected" (os que
    // a FT-09 provavelmente usa com foto), um `LinearGradient` por baixo da
    // foto passava verde (G2, T5b, `26 passed`, `EXIT=0`, "NINGUÉM" pegava).
    it.each(['photo', 'detected'] as const)(
      'G2-3 — com fotoUrl e tier="%s", NÃO renderiza o LinearGradient da ilustração por baixo da foto',
      (tier) => {
        const { UNSAFE_queryAllByType } = render(
          <KPetPortrait palette="lab" tier={tier} fotoUrl={FOTO_URL} />, { wrapper: W },
        );
        expect(UNSAFE_queryAllByType(LinearGradient)).toHaveLength(0);
      },
    );

    it('CONTROLE — sem fotoUrl e tier="photo", o LinearGradient da ilustração RENDERIZA (prova que o instrumento enxerga)', () => {
      const { UNSAFE_queryAllByType } = render(
        <KPetPortrait palette="lab" tier="photo" />, { wrapper: W },
      );
      expect(UNSAFE_queryAllByType(LinearGradient)).toHaveLength(1);
    });

    // G2-4: acessibilidade real, não só a letra do brief. (a) o CONTAINER
    // precisa ser `accessible` para o leitor de tela anunciar o avatar UMA
    // VEZ; sem isso ele desce nos filhos e tenta ler cada um. (b) a
    // `<Image>` precisa de `accessibilityLabel` (vira `alt` na web).
    describe('G2-4 — acessibilidade (container `accessible` + accessibilityLabel na imagem)', () => {
      it('ramo COM foto: container é accessible, role "image", e a Image recebe o mesmo rótulo — mordida: remover `accessible` faz esta asserção falhar', () => {
        const { getByTestId } = render(
          <KPetPortrait palette="lab" fotoUrl={FOTO_URL} nome="Thor" />, { wrapper: W },
        );
        const container = getByTestId('k-pet-portrait');
        expect(container.props.accessible).toBe(true);
        expect(container.props.accessibilityRole).toBe('image');
        expect(container.props.accessibilityLabel).toBe('Foto de Thor');
        expect(getByTestId('k-pet-portrait-foto').props.accessibilityLabel).toBe('Foto de Thor');
      });

      it('ramo SEM foto: container é accessible com role "image" e o rótulo "Avatar de X"', () => {
        const { getByTestId } = render(
          <KPetPortrait palette="lab" nome="Bolinha" />, { wrapper: W },
        );
        const container = getByTestId('k-pet-portrait');
        expect(container.props.accessible).toBe(true);
        expect(container.props.accessibilityRole).toBe('image');
        expect(container.props.accessibilityLabel).toBe('Avatar de Bolinha');
      });

      it('sem nome, `accessible`/`accessibilityRole` continuam undefined', () => {
        const { getByTestId } = render(<KPetPortrait palette="lab" />, { wrapper: W });
        const container = getByTestId('k-pet-portrait');
        expect(container.props.accessible).toBeUndefined();
        expect(container.props.accessibilityRole).toBeUndefined();
      });

      // NÃO É MORDIDA — nota de medição sobre o LIMITE da ferramenta de
      // teste (mesma observação feita na clínica, KCPetPortrait.test.tsx):
      // num leitor de tela real, `accessible=true` no container faz
      // iOS/Android tratarem a subárvore como UM elemento opaco. O RTL não
      // simula essa fusão. NÃO VERIFICADO com leitor de tela real.
      it('RTL (ao contrário de um leitor de tela real) enxerga 2 nós com o mesmo rótulo — limite da ferramenta, não do componente', () => {
        const { getAllByLabelText } = render(
          <KPetPortrait palette="lab" fotoUrl={FOTO_URL} nome="Thor" />, { wrapper: W },
        );
        expect(getAllByLabelText('Foto de Thor')).toHaveLength(2);
      });
    });
  });
});

describe('racaToPalette', () => {
  it('maps Labrador → lab',          () => expect(racaToPalette('Labrador')).toBe('lab'));
  it('maps Siamesa → siam',          () => expect(racaToPalette('Siamesa')).toBe('siam'));
  it('maps SRD → pup',               () => expect(racaToPalette('SRD')).toBe('pup'));
  it('maps Golden Retriever → lab',  () => expect(racaToPalette('Golden Retriever')).toBe('lab'));
});
