import { PPQ } from './types';
import type { MusicBlock, NoteEvent, Project } from './types';

export const CHORD_PATTERN_BAR_TICKS = 4 * PPQ;
export const CHORD_PROGRESSION_BEATS = 16;
export const CHORD_PROGRESSION_TICKS = CHORD_PROGRESSION_BEATS * PPQ;
export const CHORD_STEP_QUANTUM_BEATS = .5;
const ASSET_PREFIX = 'pattern:chord:v1:';

export type ChordDiscoveryBand = 'stable' | 'color' | 'surprise';
export type ChordPatternRhythmId = 'hold' | 'pulse' | 'syncopated';
type ChordQuality =
  | 'major' | 'minor' | 'power5' | 'augmented' | 'diminished'
  | 'major6' | 'minor6' | 'dominant7' | 'major7' | 'minor7' | 'minorMajor7' | 'diminished7' | 'halfDiminished7'
  | 'add9' | 'minorAdd9' | 'dominant9' | 'major9' | 'minor9' | 'dominant11' | 'dominant13'
  | 'sus2' | 'sus4';

export interface ChordPadDefinition {
  id: string;
  symbol: string;
  degreeLabel: string;
  character: string;
  band: ChordDiscoveryBand;
  rootOffset: number;
  quality: ChordQuality;
  intervals: readonly number[];
  mapColumn: number;
  mapRow: number;
}

export const CHORD_PATTERN_RHYTHMS: ReadonlyArray<{ id: ChordPatternRhythmId; label: string; description: string; timbreTags: readonly string[] }> = [
  { id: 'hold', label: 'HOLD', description: 'STEPの終わり近くまで和音を伸ばす', timbreTags: ['foreground', 'support', 'pad'] },
  { id: 'pulse', label: 'PULSE', description: '4分音符ごとに和音を区切って刻む', timbreTags: ['foreground', 'supersaw'] },
  { id: 'syncopated', label: 'SYNC', description: '表拍と裏拍を混ぜて跳ねさせる', timbreTags: ['pluck', 'foreground'] },
];

export type ChordProgressionStepCount = 4 | 8;

export interface BalancedChordStepBeats {
  beats: number[];
  autoStepIndex: number;
}

export function defaultChordStepBeats(stepCount: ChordProgressionStepCount): number[] {
  return Array.from({ length: stepCount }, () => CHORD_PROGRESSION_BEATS / stepCount);
}

function quantizeChordStepBeats(value: number): number {
  return Math.round(value / CHORD_STEP_QUANTUM_BEATS) * CHORD_STEP_QUANTUM_BEATS;
}

function fallbackAutoStepIndex(stepCount: ChordProgressionStepCount, editedIndex: number): number {
  for (let index = stepCount - 1; index >= 0; index -= 1) {
    if (index !== editedIndex) return index;
  }
  return 0;
}

export function normalizeChordStepBeats(beats: readonly number[], stepCount: ChordProgressionStepCount, autoStepIndex = stepCount - 1): BalancedChordStepBeats {
  const safeAutoStepIndex = autoStepIndex >= 0 && autoStepIndex < stepCount ? autoStepIndex : stepCount - 1;
  const defaults = defaultChordStepBeats(stepCount);
  const next = defaults.map((value, index) => {
    const candidate = beats[index];
    return Number.isFinite(candidate) ? Math.max(CHORD_STEP_QUANTUM_BEATS, quantizeChordStepBeats(candidate!)) : value;
  });
  const fixedTotal = next.reduce((sum, value, index) => index === safeAutoStepIndex ? sum : sum + value, 0);
  if (fixedTotal > CHORD_PROGRESSION_BEATS - CHORD_STEP_QUANTUM_BEATS) return { beats: defaults, autoStepIndex: stepCount - 1 };
  next[safeAutoStepIndex] = CHORD_PROGRESSION_BEATS - fixedTotal;
  return { beats: next, autoStepIndex: safeAutoStepIndex };
}

export function maxEditableChordStepBeats(beats: readonly number[], stepCount: ChordProgressionStepCount, stepIndex: number, autoStepIndex: number): number {
  const normalized = normalizeChordStepBeats(beats, stepCount, autoStepIndex);
  const balancingIndex = stepIndex === normalized.autoStepIndex ? fallbackAutoStepIndex(stepCount, stepIndex) : normalized.autoStepIndex;
  const otherFixedTotal = normalized.beats.reduce((sum, value, index) => index === stepIndex || index === balancingIndex ? sum : sum + value, 0);
  return Math.max(CHORD_STEP_QUANTUM_BEATS, CHORD_PROGRESSION_BEATS - CHORD_STEP_QUANTUM_BEATS - otherFixedTotal);
}

export function rebalanceChordStepBeats(beats: readonly number[], stepCount: ChordProgressionStepCount, stepIndex: number, desiredBeats: number, autoStepIndex: number): BalancedChordStepBeats {
  if (stepIndex < 0 || stepIndex >= stepCount) throw new Error(`Invalid chord step index: ${stepIndex}`);
  const normalized = normalizeChordStepBeats(beats, stepCount, autoStepIndex);
  const nextAutoStepIndex = stepIndex === normalized.autoStepIndex ? fallbackAutoStepIndex(stepCount, stepIndex) : normalized.autoStepIndex;
  const next = [...normalized.beats];
  const maxBeats = maxEditableChordStepBeats(next, stepCount, stepIndex, normalized.autoStepIndex);
  next[stepIndex] = Math.max(CHORD_STEP_QUANTUM_BEATS, Math.min(maxBeats, quantizeChordStepBeats(desiredBeats)));
  const fixedTotal = next.reduce((sum, value, index) => index === nextAutoStepIndex ? sum : sum + value, 0);
  next[nextAutoStepIndex] = CHORD_PROGRESSION_BEATS - fixedTotal;
  return { beats: next, autoStepIndex: nextAutoStepIndex };
}

const ROOT_PITCH_CLASSES: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const PITCH_CLASS_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const FLAT_PITCH_CLASS_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
const QUALITY_INTERVALS: Record<ChordQuality, readonly number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  power5: [0, 7],
  augmented: [0, 4, 8],
  diminished: [0, 3, 6],
  major6: [0, 4, 7, 9],
  minor6: [0, 3, 7, 9],
  dominant7: [0, 4, 7, 10],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  minorMajor7: [0, 3, 7, 11],
  diminished7: [0, 3, 6, 9],
  halfDiminished7: [0, 3, 6, 10],
  add9: [0, 4, 7, 14],
  minorAdd9: [0, 3, 7, 14],
  dominant9: [0, 4, 7, 10, 14],
  major9: [0, 4, 7, 11, 14],
  minor9: [0, 3, 7, 10, 14],
  dominant11: [0, 4, 7, 10, 14, 17],
  dominant13: [0, 4, 7, 10, 14, 21],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
};
const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  major: '', minor: 'm', power5: '5', augmented: 'aug', diminished: 'dim',
  major6: '6', minor6: 'm6', dominant7: '7', major7: 'maj7', minor7: 'm7', minorMajor7: 'm(maj7)', diminished7: 'dim7', halfDiminished7: 'm7♭5',
  add9: 'add9', minorAdd9: 'm(add9)', dominant9: '9', major9: 'maj9', minor9: 'm9', dominant11: '11', dominant13: '13',
  sus2: 'sus2', sus4: 'sus4',
};

function keyFacts(key: string): { rootPitchClass: number; minor: boolean; scale: readonly number[]; qualities: readonly ChordQuality[] } {
  const [name = 'D', quality = 'major'] = key.trim().split(/\s+/);
  const minor = quality.toLowerCase().startsWith('min');
  return minor
    ? { rootPitchClass: ROOT_PITCH_CLASSES[name] ?? 2, minor, scale: [0, 2, 3, 5, 7, 8, 10], qualities: ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'] }
    : { rootPitchClass: ROOT_PITCH_CLASSES[name] ?? 2, minor, scale: [0, 2, 4, 5, 7, 9, 11], qualities: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'] };
}

function usesFlatSpelling(key: string): boolean {
  const [root = 'D', mode = 'major'] = key.trim().split(/\s+/);
  return mode.toLowerCase().startsWith('min')
    ? ['D', 'G', 'C', 'F', 'Bb', 'Eb', 'Ab'].includes(root)
    : ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].includes(root);
}

function pad(key: string, keyRoot: number, id: string, degreeLabel: string, character: string, band: ChordDiscoveryBand, rootOffset: number, quality: ChordQuality, mapColumn: number, mapRow?: number): ChordPadDefinition {
  const names = usesFlatSpelling(key) ? FLAT_PITCH_CLASS_NAMES : PITCH_CLASS_NAMES;
  const rootName = names[(keyRoot + rootOffset + 120) % 12]!;
  const defaultRow = band === 'color' ? 1 : band === 'stable' ? 2 : 3;
  return { id, symbol: `${rootName}${QUALITY_SUFFIX[quality]}`, degreeLabel, character, band, rootOffset, quality, intervals: QUALITY_INTERVALS[quality], mapColumn, mapRow: mapRow ?? defaultRow };
}

export function chordPadCatalog(key: string): ChordPadDefinition[] {
  const facts = keyFacts(key);
  const roman = facts.minor ? ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'] : ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
  const stable = facts.scale.map((rootOffset, index) => pad(key, facts.rootPitchClass, `stable-${index + 1}`, roman[index]!, index === 0 ? 'home' : index === 4 ? 'lift' : 'key内', 'stable', rootOffset, facts.qualities[index]!, index + 1));
  const color = facts.minor
    ? [pad(key, facts.rootPitchClass, 'color-1-add9', 'i add9', '透明', 'color', 0, 'minorAdd9', 1), pad(key, facts.rootPitchClass, 'color-4-min7', 'iv7', '深い', 'color', 5, 'minor7', 4), pad(key, facts.rootPitchClass, 'color-5-sus4', 'Vsus4', '浮遊', 'color', 7, 'sus4', 5), pad(key, facts.rootPitchClass, 'color-6-maj7', 'VImaj7', '柔らかい', 'color', 8, 'major7', 6)]
    : [pad(key, facts.rootPitchClass, 'color-1-add9', 'I add9', 'きらめき', 'color', 0, 'add9', 1), pad(key, facts.rootPitchClass, 'color-4-maj7', 'IVmaj7', '広がり', 'color', 5, 'major7', 4), pad(key, facts.rootPitchClass, 'color-2-min7', 'ii7', '滑らか', 'color', 2, 'minor7', 2), pad(key, facts.rootPitchClass, 'color-5-7', 'V7', '強い期待', 'color', 7, 'dominant7', 5)];
  const surprise = facts.minor
    ? [pad(key, facts.rootPitchClass, 'surprise-major-4', 'IV', '一瞬明るい', 'surprise', 5, 'major', 4), pad(key, facts.rootPitchClass, 'surprise-b2', '♭II', 'ドラマチック', 'surprise', 1, 'major', 2), pad(key, facts.rootPitchClass, 'surprise-major-5', 'V', '強く戻る', 'surprise', 7, 'major', 5)]
    : [pad(key, facts.rootPitchClass, 'surprise-borrowed-4', 'iv', '切なさ', 'surprise', 5, 'minor', 4), pad(key, facts.rootPitchClass, 'surprise-b7', '♭VII', '開放感', 'surprise', 10, 'major', 7), pad(key, facts.rootPitchClass, 'surprise-secondary-6', 'V/vi', '意外な推進', 'surprise', 4, 'major', 3)];
  const extensions: ReadonlyArray<{ degree: number; id: string; degreeLabel: string; character: string; quality: ChordQuality }> = facts.minor
    ? [
        { degree: 0, id: '1-min7', degreeLabel: 'i7', character: '深い主和音', quality: 'minor7' },
        { degree: 0, id: '1-min9', degreeLabel: 'i9', character: '透明な主和音', quality: 'minor9' },
        { degree: 0, id: '1-min-maj7', degreeLabel: 'imaj7', character: '妖しい緊張', quality: 'minorMajor7' },
        { degree: 0, id: '1-power5', degreeLabel: 'i5', character: '硬い芯', quality: 'power5' },
        { degree: 0, id: '1-min6', degreeLabel: 'i6', character: '哀愁', quality: 'minor6' },
        { degree: 0, id: '1-sus2', degreeLabel: 'isus2', character: '空白感', quality: 'sus2' },
        { degree: 0, id: '1-sus4', degreeLabel: 'isus4', character: '保留', quality: 'sus4' },
        { degree: 1, id: '2-half-dim7', degreeLabel: 'iiø7', character: '不安定', quality: 'halfDiminished7' },
        { degree: 1, id: '2-dim7', degreeLabel: 'ii°7', character: '強い緊張', quality: 'diminished7' },
        { degree: 1, id: '2-power5', degreeLabel: 'ii5', character: '無機質', quality: 'power5' },
        { degree: 2, id: '3-maj7', degreeLabel: 'IIImaj7', character: '柔らかい光', quality: 'major7' },
        { degree: 2, id: '3-add9', degreeLabel: 'IIIadd9', character: 'きらめき', quality: 'add9' },
        { degree: 2, id: '3-maj9', degreeLabel: 'IIImaj9', character: '大きな広がり', quality: 'major9' },
        { degree: 2, id: '3-power5', degreeLabel: 'III5', character: '太い輪郭', quality: 'power5' },
        { degree: 2, id: '3-major6', degreeLabel: 'III6', character: '甘い明るさ', quality: 'major6' },
        { degree: 2, id: '3-aug', degreeLabel: 'IIIaug', character: '上昇する緊張', quality: 'augmented' },
        { degree: 3, id: '4-min9', degreeLabel: 'iv9', character: '深い余韻', quality: 'minor9' },
        { degree: 3, id: '4-power5', degreeLabel: 'iv5', character: '暗い推進', quality: 'power5' },
        { degree: 3, id: '4-min6', degreeLabel: 'iv6', character: '切ない色', quality: 'minor6' },
        { degree: 3, id: '4-min-add9', degreeLabel: 'iv add9', character: '霞んだ広がり', quality: 'minorAdd9' },
        { degree: 4, id: '5-min7', degreeLabel: 'v7', character: '穏やかな戻り', quality: 'minor7' },
        { degree: 4, id: '5-min9', degreeLabel: 'v9', character: '暗い浮遊', quality: 'minor9' },
        { degree: 4, id: '5-power5', degreeLabel: 'v5', character: '硬い推進', quality: 'power5' },
        { degree: 4, id: '5-sus2', degreeLabel: 'vsus2', character: '開いた期待', quality: 'sus2' },
        { degree: 5, id: '6-add9', degreeLabel: 'VIadd9', character: '明るい余白', quality: 'add9' },
        { degree: 5, id: '6-maj9', degreeLabel: 'VImaj9', character: '包む広がり', quality: 'major9' },
        { degree: 5, id: '6-power5', degreeLabel: 'VI5', character: '太い支え', quality: 'power5' },
        { degree: 5, id: '6-major6', degreeLabel: 'VI6', character: '暖かい色', quality: 'major6' },
        { degree: 6, id: '7-dom7', degreeLabel: 'VII7', character: '強い前進', quality: 'dominant7' },
        { degree: 6, id: '7-dom9', degreeLabel: 'VII9', character: 'ざらつく期待', quality: 'dominant9' },
        { degree: 6, id: '7-power5', degreeLabel: 'VII5', character: '開いた終止', quality: 'power5' },
        { degree: 6, id: '7-major6', degreeLabel: 'VII6', character: '浮いた明るさ', quality: 'major6' },
      ]
    : [
        { degree: 0, id: '1-maj7', degreeLabel: 'Imaj7', character: '柔らかい主和音', quality: 'major7' },
        { degree: 0, id: '1-maj9', degreeLabel: 'Imaj9', character: '大きな広がり', quality: 'major9' },
        { degree: 0, id: '1-power5', degreeLabel: 'I5', character: '硬い芯', quality: 'power5' },
        { degree: 0, id: '1-major6', degreeLabel: 'I6', character: '甘い明るさ', quality: 'major6' },
        { degree: 0, id: '1-sus2', degreeLabel: 'Isus2', character: '開いた空気', quality: 'sus2' },
        { degree: 0, id: '1-sus4', degreeLabel: 'Isus4', character: '保留', quality: 'sus4' },
        { degree: 0, id: '1-aug', degreeLabel: 'Iaug', character: '上昇する緊張', quality: 'augmented' },
        { degree: 1, id: '2-min9', degreeLabel: 'ii9', character: '滑らかな余韻', quality: 'minor9' },
        { degree: 1, id: '2-power5', degreeLabel: 'ii5', character: '無機質', quality: 'power5' },
        { degree: 1, id: '2-min6', degreeLabel: 'ii6', character: '少し切ない', quality: 'minor6' },
        { degree: 2, id: '3-min7', degreeLabel: 'iii7', character: '控えめな影', quality: 'minor7' },
        { degree: 2, id: '3-min9', degreeLabel: 'iii9', character: '淡い陰影', quality: 'minor9' },
        { degree: 2, id: '3-power5', degreeLabel: 'iii5', character: '硬い中間色', quality: 'power5' },
        { degree: 2, id: '3-min6', degreeLabel: 'iii6', character: '甘い切なさ', quality: 'minor6' },
        { degree: 3, id: '4-add9', degreeLabel: 'IVadd9', character: '明るい余白', quality: 'add9' },
        { degree: 3, id: '4-power5', degreeLabel: 'IV5', character: '太い開放感', quality: 'power5' },
        { degree: 3, id: '4-major6', degreeLabel: 'IV6', character: '暖かい色', quality: 'major6' },
        { degree: 3, id: '4-maj9', degreeLabel: 'IVmaj9', character: '包む広がり', quality: 'major9' },
        { degree: 4, id: '5-dom9', degreeLabel: 'V9', character: '華やかな期待', quality: 'dominant9' },
        { degree: 4, id: '5-dom11', degreeLabel: 'V11', character: '厚い浮遊', quality: 'dominant11' },
        { degree: 4, id: '5-dom13', degreeLabel: 'V13', character: '最大の期待', quality: 'dominant13' },
        { degree: 4, id: '5-power5', degreeLabel: 'V5', character: '強い推進', quality: 'power5' },
        { degree: 4, id: '5-sus2', degreeLabel: 'Vsus2', character: '開いた期待', quality: 'sus2' },
        { degree: 4, id: '5-sus4', degreeLabel: 'Vsus4', character: '戻る直前', quality: 'sus4' },
        { degree: 5, id: '6-min7', degreeLabel: 'vi7', character: '切ない安定', quality: 'minor7' },
        { degree: 5, id: '6-min9', degreeLabel: 'vi9', character: '深い透明感', quality: 'minor9' },
        { degree: 5, id: '6-min-add9', degreeLabel: 'vi add9', character: '霞んだ余韻', quality: 'minorAdd9' },
        { degree: 5, id: '6-power5', degreeLabel: 'vi5', character: '暗い芯', quality: 'power5' },
        { degree: 5, id: '6-min6', degreeLabel: 'vi6', character: '哀愁', quality: 'minor6' },
        { degree: 6, id: '7-half-dim7', degreeLabel: 'viiø7', character: '不安定', quality: 'halfDiminished7' },
        { degree: 6, id: '7-dim7', degreeLabel: 'vii°7', character: '強い緊張', quality: 'diminished7' },
        { degree: 6, id: '7-power5', degreeLabel: 'vii5', character: '鋭い輪郭', quality: 'power5' },
      ];
  const rowsByDegree = Array.from({ length: 7 }, () => 0);
  const utility = extensions.map((extension) => {
    const degreeRow = rowsByDegree[extension.degree] ?? 0;
    const mapRow = 4 + degreeRow;
    rowsByDegree[extension.degree] = degreeRow + 1;
    return pad(key, facts.rootPitchClass, `extension-${extension.id}`, extension.degreeLabel, extension.character, 'color', facts.scale[extension.degree]!, extension.quality, extension.degree + 1, mapRow);
  });
  return [...stable, ...color, ...surprise, ...utility];
}

export function chordPatternAssetId(padId: string, rhythmId: ChordPatternRhythmId): string {
  return `${ASSET_PREFIX}${padId}:${rhythmId}`;
}

export function parseChordPatternAssetId(assetId: string): { padId: string; rhythmId: ChordPatternRhythmId } | null {
  if (!assetId.startsWith(ASSET_PREFIX)) return null;
  const [padId, rhythmId, extra] = assetId.slice(ASSET_PREFIX.length).split(':');
  if (!padId || extra || !CHORD_PATTERN_RHYTHMS.some((rhythm) => rhythm.id === rhythmId)) return null;
  return { padId, rhythmId: rhythmId as ChordPatternRhythmId };
}

export function createChordPatternBlock(id: string, startTick: number, padId: string, rhythmId: ChordPatternRhythmId, durationBeats = 4): MusicBlock {
  const safeBeats = Math.max(CHORD_STEP_QUANTUM_BEATS, Math.min(CHORD_PROGRESSION_BEATS, quantizeChordStepBeats(durationBeats)));
  return { id, assetId: chordPatternAssetId(padId, rhythmId), startTick, durationTick: safeBeats * PPQ, granularity: 'draft', parentBlockId: null };
}

function chordVoicing(key: string, definition: ChordPadDefinition, previous: readonly number[]): number[] {
  const facts = keyFacts(key);
  let root = 60 + ((facts.rootPitchClass + definition.rootOffset) % 12);
  if (root > 67) root -= 12;
  const rootPosition = definition.intervals.map((interval) => root + interval);
  const candidates: number[][] = [];
  for (let inversion = 0; inversion < rootPosition.length; inversion += 1) {
    const inverted = rootPosition.map((pitch, index) => pitch + (index < inversion ? 12 : 0)).sort((left, right) => left - right);
    for (const octave of [-12, 0, 12]) candidates.push(inverted.map((pitch) => pitch + octave));
  }
  if (previous.length === 0) return rootPosition;
  const score = (candidate: readonly number[]): number => {
    const center = candidate.reduce((sum, pitch) => sum + pitch, 0) / candidate.length;
    const forward = candidate.reduce((sum, pitch) => sum + Math.min(...previous.map((other) => Math.abs(other - pitch))), 0);
    const backward = previous.reduce((sum, pitch) => sum + Math.min(...candidate.map((other) => Math.abs(other - pitch))), 0);
    return forward + backward * .5 + Math.abs(center - 64) * .08;
  };
  return candidates.sort((left, right) => score(left) - score(right) || left.join(',').localeCompare(right.join(',')))[0]!;
}

function rhythmSteps(rhythmId: ChordPatternRhythmId, durationTick: number): Array<{ offset: number; duration: number; velocity: number }> {
  if (rhythmId === 'pulse') return [0, 1, 2, 3].map((beat) => ({ offset: beat * PPQ, duration: Math.round(PPQ * .82), velocity: beat === 0 ? 104 : 92 })).filter((step) => step.offset < durationTick);
  if (rhythmId === 'syncopated') return [
    { offset: 0, duration: 600, velocity: 104 },
    { offset: 720, duration: 360, velocity: 88 },
    { offset: 1_200, duration: 360, velocity: 98 },
    { offset: 1_680, duration: 210, velocity: 84 },
  ].filter((step) => step.offset < durationTick);
  return [{ offset: 0, duration: Math.max(1, durationTick - 30), velocity: 96 }];
}

export function materializeChordPatternNotes(project: Project): NoteEvent[] {
  const blocks = project.tracks
    .filter((track) => track.role === 'chord')
    .flatMap((track) => track.lanes.flatMap((lane) => lane.blocks))
    .filter((block) => parseChordPatternAssetId(block.assetId) !== null)
    .sort((left, right) => left.startTick - right.startTick || left.id.localeCompare(right.id));
  const definitions = new Map(chordPadCatalog(project.musicalGrid.key).map((definition) => [definition.id, definition]));
  const notes: NoteEvent[] = [];
  let previous: number[] = [];
  for (const block of blocks) {
    const identity = parseChordPatternAssetId(block.assetId);
    const definition = identity ? definitions.get(identity.padId) : undefined;
    if (!identity || !definition) continue;
    const pitches = chordVoicing(project.musicalGrid.key, definition, previous);
    const steps = rhythmSteps(identity.rhythmId, block.durationTick);
    for (const [stepIndex, step] of steps.entries()) {
      for (const [voiceIndex, pitch] of pitches.entries()) {
        notes.push({ id: `${block.id}-step-${stepIndex}-voice-${voiceIndex}`, pitch, startTick: block.startTick + step.offset, durationTick: Math.min(step.duration, block.durationTick - step.offset), velocity: step.velocity, source: 'asset', confidence: null, userEdited: false, lockPitch: false, lockTiming: false });
      }
    }
    previous = pitches;
  }
  return notes;
}

export interface ChordPatternRange {
  startTick: number;
  endTick: number;
  blockId: string;
}

export function chordPatternRanges(project: Project): ChordPatternRange[] {
  return project.tracks
    .filter((track) => track.role === 'chord')
    .flatMap((track) => track.lanes.flatMap((lane) => lane.blocks))
    .filter((block) => parseChordPatternAssetId(block.assetId) !== null)
    .map((block) => ({ startTick: block.startTick, endTick: block.startTick + block.durationTick, blockId: block.id }))
    .sort((left, right) => left.startTick - right.startTick || left.blockId.localeCompare(right.blockId));
}

/** Replace only generated chord notes covered by pattern blocks. */
export function mergeChordPatternNotes(project: Project, notes: readonly NoteEvent[]): NoteEvent[] {
  const patterns = materializeChordPatternNotes(project);
  if (patterns.length === 0) return [...notes];
  const ranges = chordPatternRanges(project);
  const overlapsPattern = (note: NoteEvent) => ranges.some((range) => note.startTick < range.endTick && note.startTick + note.durationTick > range.startTick);
  return [...notes.filter((note) => note.source !== 'generated' || !overlapsPattern(note)), ...patterns]
    .sort((left, right) => left.startTick - right.startTick || left.pitch - right.pitch || left.id.localeCompare(right.id));
}

export function chordPadById(key: string, padId: string): ChordPadDefinition | undefined {
  return chordPadCatalog(key).find((definition) => definition.id === padId);
}

export function chordPadRootPitchClass(key: string, padId: string): number | null {
  const definition = chordPadById(key, padId);
  if (!definition) return null;
  const facts = keyFacts(key);
  return (facts.rootPitchClass + definition.rootOffset + 120) % 12;
}

export function chordPadRootPositionPitches(key: string, padId: string, rootOctaveMidi = 60): number[] {
  const definition = chordPadById(key, padId);
  const pitchClass = chordPadRootPitchClass(key, padId);
  if (!definition || pitchClass === null) return [];
  const basePitchClass = ((rootOctaveMidi % 12) + 12) % 12;
  const root = rootOctaveMidi + ((pitchClass - basePitchClass + 12) % 12);
  return definition.intervals.map((interval) => root + interval);
}
