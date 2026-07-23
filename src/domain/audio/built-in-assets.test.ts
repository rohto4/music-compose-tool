import { describe, expect, it } from 'vitest';
import { BUILT_IN_AUDIO_ASSETS, BUILT_IN_TONAL_ASSETS } from './built-in-assets';

describe('built-in timbre library', () => {
  it('provides a broad role-based bank with unique synthesis profiles', () => {
    expect(BUILT_IN_AUDIO_ASSETS).toHaveLength(136);
    const tonal = BUILT_IN_AUDIO_ASSETS.filter((asset) => ['chord', 'bass', 'lead', 'synth', 'pad', 'arp'].includes(asset.category));
    expect(tonal.every((asset) => asset.synthesis && asset.synthesis.layers.length >= 2)).toBe(true);
    expect(new Set(tonal.map((asset) => asset.synthesis?.id)).size).toBe(tonal.length);
    for (const category of ['chord', 'bass', 'lead', 'synth', 'pad', 'arp']) {
      expect(tonal.filter((asset) => asset.category === category).length, category).toBeGreaterThanOrEqual(4);
    }
    expect(tonal.some((asset) => asset.synthesis?.roleTags.includes('foreground'))).toBe(true);
    expect(tonal.some((asset) => asset.synthesis?.roleTags.includes('support'))).toBe(true);
  });

  it('exposes every tonal palette sound to the chord voice deck', () => {
    expect(BUILT_IN_TONAL_ASSETS).toHaveLength(60);
    expect(new Set(BUILT_IN_TONAL_ASSETS.map((asset) => asset.category))).toEqual(new Set(['chord', 'bass', 'lead', 'synth', 'pad', 'arp']));
  });

  it('expands the rhythm and transition families without hiding category counts', () => {
    expect(BUILT_IN_AUDIO_ASSETS.filter((asset) => asset.category === 'drum')).toHaveLength(20);
    expect(BUILT_IN_AUDIO_ASSETS.filter((asset) => asset.category === 'percussion')).toHaveLength(8);
    expect(BUILT_IN_AUDIO_ASSETS.filter((asset) => asset.category === 'fx')).toHaveLength(24);
    expect(BUILT_IN_AUDIO_ASSETS.filter((asset) => asset.category === 'transition')).toHaveLength(24);
    for (const category of ['lead', 'synth', 'pad', 'arp']) expect(BUILT_IN_AUDIO_ASSETS.filter((asset) => asset.category === category).length, category).toBeGreaterThanOrEqual(8);
  });

  it('does not disguise duplicate profiles under different names', () => {
    const fingerprints = BUILT_IN_AUDIO_ASSETS.filter((asset) => asset.synthesis).map((asset) => JSON.stringify({
      layers: asset.synthesis?.layers,
      attack: asset.synthesis?.attackSeconds,
      release: asset.synthesis?.releaseSeconds,
      sustain: asset.synthesis?.sustain,
      filter: asset.synthesis?.filterBaseHz,
      envelope: asset.synthesis?.filterEnvelopeHz,
      resonance: asset.synthesis?.resonance,
    }));
    expect(new Set(fingerprints).size).toBe(fingerprints.length);
  });

  it('adds distinct Harp, Pizzicato, Music Box, and Chorus families', () => {
    for (const tag of ['harp', 'pizzicato', 'music-box', 'chorus']) {
      const family = BUILT_IN_TONAL_ASSETS.filter((asset) => asset.synthesis?.roleTags.includes(tag));
      expect(family.length, tag).toBeGreaterThanOrEqual(3);
      expect(new Set(family.map((asset) => asset.category)).size, tag).toBeGreaterThanOrEqual(2);
    }
  });
});
