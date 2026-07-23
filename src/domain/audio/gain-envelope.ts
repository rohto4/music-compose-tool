export interface GainEnvelopePoint {
  offsetSeconds: number;
  value: number;
  curve: 'set' | 'linear' | 'exponential';
}

const FLOOR_GAIN = .0001;

function finitePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function tonalGainEnvelope(durationSeconds: number, attackSeconds: number, releaseSeconds: number, peak: number, sustainRatio: number): GainEnvelopePoint[] {
  const duration = finitePositive(durationSeconds, .04);
  const attack = Math.min(duration * .45, Math.max(.003, finitePositive(attackSeconds, .003)));
  const decay = Math.min(duration, attack + Math.max(.006, Math.min(.08, duration * .18)));
  const safePeak = Math.max(.0002, finitePositive(peak, .0002));
  const sustain = Math.max(.0002, safePeak * Math.max(.01, Math.min(1, sustainRatio)));
  const release = Math.max(.006, finitePositive(releaseSeconds, .02));
  return [
    { offsetSeconds: 0, value: FLOOR_GAIN, curve: 'set' },
    { offsetSeconds: attack, value: safePeak, curve: 'exponential' },
    { offsetSeconds: decay, value: sustain, curve: 'exponential' },
    { offsetSeconds: duration, value: sustain, curve: 'set' },
    { offsetSeconds: duration + release, value: FLOOR_GAIN, curve: 'exponential' },
  ];
}

export function transientGainEnvelope(durationSeconds: number, peak: number, attackSeconds = .003): GainEnvelopePoint[] {
  const duration = finitePositive(durationSeconds, .04);
  const attack = Math.min(duration * .35, Math.max(.0015, finitePositive(attackSeconds, .003)));
  return [
    { offsetSeconds: 0, value: FLOOR_GAIN, curve: 'set' },
    { offsetSeconds: attack, value: Math.max(.0002, finitePositive(peak, .0002)), curve: 'exponential' },
    { offsetSeconds: duration, value: FLOOR_GAIN, curve: 'exponential' },
  ];
}

export function clipGainEnvelope(durationSeconds: number, peak: number, fadeSeconds = .006): GainEnvelopePoint[] {
  const duration = finitePositive(durationSeconds, .04);
  const fade = Math.min(duration * .25, Math.max(.002, finitePositive(fadeSeconds, .006)));
  const safePeak = Math.max(0, Number.isFinite(peak) ? peak : 0);
  return [
    { offsetSeconds: 0, value: 0, curve: 'set' },
    { offsetSeconds: fade, value: safePeak, curve: 'linear' },
    { offsetSeconds: Math.max(fade, duration - fade), value: safePeak, curve: 'set' },
    { offsetSeconds: duration, value: 0, curve: 'linear' },
  ];
}
