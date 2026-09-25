import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/index';
import { derivarCacheKeyFoto } from '../../utils/fotoCache';

export type PetPalette = 'lab' | 'siam' | 'pup';
type Tier = 'emoji' | 'photo' | 'detected';

// Palettes ported EXACTLY from kura-shared.jsx KPetPhoto
const PALETTES: Record<PetPalette, { base: string; mid: string; top: string; spot: string }> = {
  lab:  { base: '#8B6F45', mid: '#C9A876', top: '#F2E0C0', spot: '#FFFCF7' }, // Bóbi — Labrador
  siam: { base: '#4A3418', mid: '#C9A876', top: '#E8DDC8', spot: '#6B8AA8' }, // Luna — Siamesa
  pup:  { base: '#3D2B18', mid: '#6B4A2B', top: '#C9A876', spot: '#F2E0C0' }, // Thor — SRD
};

const SPECIES_EMOJI: Record<string, string> = { Cão: '🐶', Gato: '🐱', Coelho: '🐰', Ave: '🦜' };

// FT-08: blurhash neutro (cinza uniforme) mostrado pelo expo-image enquanto
// a foto real carrega.
const BLURHASH_NEUTRO = 'L4L4-;~q00~q00Rj9Fxu00xu%MRj';

interface KPetPortraitProps {
  palette:  PetPalette;
  size?:    number;
  tier?:    Tier;
  emoji?:   string;
  badge?:   string;
  especie?: string;
  /**
   * FT-08: URL assinada da foto real do pet (Java BFF, FT-05/FT-09 — a
   * clínica sobe pela FT-07, este app só EXIBE). Com `fotoUrl` (e sem erro
   * de carregamento) substitui a ilustração por `expo-image` de verdade,
   * INDEPENDENTE do `tier` — a FT-09 decide o `tier` que acompanha.
   * `null`/`undefined`/erro no `onError` caem no comportamento de sempre
   * (ilustração por `tier`).
   */
  fotoUrl?: string | null;
  /**
   * FT-08: nome do pet, usado só para compor o `accessibilityLabel` nos 2
   * ramos (com foto e sem foto).
   */
  nome?: string;
}

export function KPetPortrait({
  palette, size = 56, tier = 'emoji', emoji, badge, especie, fotoUrl, nome
}: KPetPortraitProps) {
  const theme = useTheme();
  const p = PALETTES[palette];
  const r = size / 2;

  // FT-08: erro no carregamento da imagem volta para a ilustração por
  // `tier` — sem crash, sem espaço em branco. Reseta quando a URL muda
  // (componente reaproveitado numa lista) para não prender um pet novo no
  // erro de outro.
  const [erroFoto, setErroFoto] = useState(false);
  useEffect(() => {
    setErroFoto(false);
  }, [fotoUrl]);

  const ringStyle = (tier === 'photo' || tier === 'detected')
    ? { borderWidth: 2, borderColor: theme.colors.primary }  // Sage border
    : {};

  const displayEmoji = emoji ?? (especie ? SPECIES_EMOJI[especie] : '🐾') ?? '🐾';

  const accessibilityLabel = nome ? `Foto de ${nome}` : undefined;

  return (
    // Outer container has NO overflow:hidden so badge can visually overflow
    <View accessibilityLabel={accessibilityLabel} style={[{ width: size, height: size, borderRadius: r }, ringStyle]}>
      {/* Inner clipped area — handles rounded corners for content */}
      <View style={[StyleSheet.absoluteFillObject, { borderRadius: r, overflow: 'hidden' }]}>
        {fotoUrl && !erroFoto ? (
          <Image
            testID="k-pet-portrait-foto"
            source={{ uri: fotoUrl }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={200}
            cachePolicy="disk"
            cacheKey={derivarCacheKeyFoto(fotoUrl)}
            placeholder={{ blurhash: BLURHASH_NEUTRO }}
            placeholderContentFit="cover"
            onError={() => setErroFoto(true)}
          />
        ) : tier === 'emoji' ? (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: size * 0.45 }}>{displayEmoji}</Text>
          </View>
        ) : (
          <>
            <LinearGradient
              colors={[p.top, p.mid, p.base]}
              start={{ x: 0.3, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Ear highlight spots */}
            <View style={[styles.spot, { backgroundColor: p.spot, width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14, top: size * 0.06, left: size * 0.08 }]} />
            <View style={[styles.spot, { backgroundColor: p.spot, width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14, top: size * 0.06, right: size * 0.08 }]} />
          </>
        )}
      </View>

      {/* Badge overflows the portrait — amber dot with emoji */}
      {badge && (
        <View style={[styles.badge, { backgroundColor: theme.colors.amber, borderColor: theme.colors.surface, bottom: -size * 0.05, right: -size * 0.05 }]}>
          <Text style={{ fontSize: size * 0.22 }}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  spot:  { position: 'absolute', opacity: 0.5 },
  badge: { position: 'absolute', width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});

export function racaToPalette(raca: string): PetPalette {
  if (/labrador|golden|retriever/i.test(raca)) return 'lab';
  if (/siames|persa|ragdoll|angora/i.test(raca)) return 'siam';
  return 'pup';
}
