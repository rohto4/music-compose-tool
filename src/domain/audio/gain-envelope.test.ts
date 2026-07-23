import { describe, expect, it } from 'vitest';
import { clipGainEnvelope, tonalGainEnvelope, transientGainEnvelope } from './gain-envelope';

describe('click-safe gain envelopes', () => {
  it('decays before the note end and keeps the same sustain value at release start', () => {
    const points = tonalGainEnvelope(1, .01, .2, .8, .5);
    expect(points.map((point) => point.offsetSeconds)).toEqual([0, .01, .09, 1, 1.2]);
    expect(points[2]?.value).toBe(points[3]?.value);
    expect(points[0]?.value).toBeLessThan(.001);
    expect(points.at(-1)?.value).toBeLessThan(.001);
  });

  it('fades transient and imported clip boundaries instead of starting at full gain', () => {
    const transient = transientGainEnvelope(.2, .6);
    const clip = clipGainEnvelope(2, .7);
    expect(transient[0]?.value).toBeLessThan(.001);
    expect(transient[1]?.offsetSeconds).toBeGreaterThan(0);
    expect(clip.map((point) => point.value)).toEqual([0, .7, .7, 0]);
    expect(clip[1]!.offsetSeconds).toBeGreaterThan(0);
    expect(clip[2]!.offsetSeconds).toBeLessThan(2);
  });
});
