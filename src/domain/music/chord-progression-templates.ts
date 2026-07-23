import {
  CHORD_PROGRESSION_BEATS,
  CHORD_PROGRESSION_TICKS,
  chordPadById,
  createChordPatternBlock,
} from './chord-patterns';
import type { ChordPatternRhythmId, ChordProgressionStepCount } from './chord-patterns';
import type { MusicBlock } from './types';

export type ChordProgressionMode = 'major' | 'minor';

export interface ChordProgressionTemplateStep {
  padId: string;
  beats: number;
}

export interface ChordProgressionTemplate {
  id: string;
  label: string;
  mode: ChordProgressionMode;
  character: string;
  description: string;
  tags: readonly string[];
  degreeLabel: string;
  sourceLabel: string;
  sourceUrl: string;
  steps: readonly ChordProgressionTemplateStep[];
}

const BERKLEE_SOURCE = 'https://online.berklee.edu/takenote/common-chord-progressions-and-how-to-make-them-your-own/';
const OPEN_THEORY_FOUR_CHORD = 'https://viva.pressbooks.pub/openmusictheory/chapter/4-chord-schemas/';
const OPEN_THEORY_251 = 'https://viva.pressbooks.pub/openmusictheory/chapter/ii-v-i/';
const OPEN_THEORY_SEQUENCE = 'https://viva.pressbooks.pub/openmusictheory/chapter/diatonic-sequences/';
const OPEN_THEORY_CLASSICAL = 'https://viva.pressbooks.pub/openmusictheory/chapter/classical-schemas/';
const ROYAL_ROAD_SOURCE = 'https://www.mtosmt.org/issues/mto.26.32.1/mto.26.32.1.li.php';

function four(padIds: readonly string[]): ChordProgressionTemplateStep[] {
  return padIds.map((padId) => ({ padId, beats: 4 }));
}

function eight(padIds: readonly string[]): ChordProgressionTemplateStep[] {
  return padIds.map((padId) => ({ padId, beats: 2 }));
}

export const CHORD_PROGRESSION_TEMPLATES: readonly ChordProgressionTemplate[] = [
  { id: 'pop-axis', label: 'Pop Axis', mode: 'major', character: '万能・開放的', description: '明るさと切なさを往復する、最初に試しやすい4コード。', tags: ['Future Bass', 'Drop', '前向き'], degreeLabel: 'I–V–vi–IV', sourceLabel: 'Berklee', sourceUrl: BERKLEE_SOURCE, steps: four(['stable-1', 'stable-5', 'stable-6', 'stable-4']) },
  { id: 'singer-songwriter', label: 'Singer / Songwriter', mode: 'major', character: '切ない・前向き', description: '少し切ない場面から始め、サビ前や周回へ前向きな勢いを残したいとき。', tags: ['Kawaii Pop', 'Verse', '切ない'], degreeLabel: 'vi–IV–I–V', sourceLabel: 'Open Music Theory', sourceUrl: OPEN_THEORY_FOUR_CHORD, steps: four(['stable-6', 'stable-4', 'stable-1', 'stable-5']) },
  { id: 'doo-wop', label: 'Doo-wop 50s', mode: 'major', character: '懐かしい・素直', description: '親しみやすく懐かしい空気を出し、素直なメロディを乗せたいとき。', tags: ['Pop', 'Intro', '懐かしい'], degreeLabel: 'I–vi–IV–V', sourceLabel: 'Open Music Theory', sourceUrl: OPEN_THEORY_FOUR_CHORD, steps: four(['stable-1', 'stable-6', 'stable-4', 'stable-5']) },
  { id: 'hopscotch', label: 'Hopscotch', mode: 'major', character: '上昇・軽快', description: '軽く駆け上がる感覚を作り、明るいBuildや短い間奏へ使いたいとき。', tags: ['Future Core', 'Build', '上昇'], degreeLabel: 'IV–V–vi–I', sourceLabel: 'Open Music Theory', sourceUrl: OPEN_THEORY_FOUR_CHORD, steps: four(['stable-4', 'stable-5', 'stable-6', 'stable-1']) },
  { id: 'royal-road', label: 'Royal Road', mode: 'major', character: 'J-pop・高揚', description: '一気に気持ちを持ち上げ、J-popらしい印象的なサビを作りたいとき。', tags: ['J-pop', 'Drop', '高揚'], degreeLabel: 'IV–V–iii–vi', sourceLabel: 'Music Theory Online', sourceUrl: ROYAL_ROAD_SOURCE, steps: four(['stable-4', 'stable-5', 'stable-3', 'stable-6']) },
  { id: 'circle-turnaround', label: 'Circle Turnaround', mode: 'major', character: '滑らか・解決', description: '流れを途切れさせず自然に着地し、そのまま次のphraseへ戻したいとき。', tags: ['Future Bass', 'Break', '滑らか'], degreeLabel: 'vi–ii–V–I', sourceLabel: 'Berklee', sourceUrl: BERKLEE_SOURCE, steps: four(['stable-6', 'stable-2', 'stable-5', 'stable-1']) },
  { id: 'jazz-251', label: 'Jazz ii–V–I', mode: 'major', character: '都会的・解決', description: '落ち着いた都会感を出し、短い間奏やエンディングをきれいに締めたいとき。', tags: ['Jazz', 'Outro', '都会的'], degreeLabel: 'ii–V7–I–I', sourceLabel: 'Open Music Theory', sourceUrl: OPEN_THEORY_251, steps: four(['stable-2', 'color-5-7', 'stable-1', 'stable-1']) },
  { id: 'pachelbel', label: 'Pachelbel Sequence', mode: 'major', character: '流麗・物語的', description: 'コードを細かく動かし、情景が少しずつ変わる長い物語感を作りたいとき。', tags: ['Pop', 'Bridge', '物語'], degreeLabel: 'I–V–vi–iii–IV–I–IV–V', sourceLabel: 'Open Music Theory', sourceUrl: OPEN_THEORY_SEQUENCE, steps: eight(['stable-1', 'stable-5', 'stable-6', 'stable-3', 'stable-4', 'stable-1', 'stable-4', 'stable-5']) },
  { id: 'lament', label: 'Lament / Andalusian', mode: 'minor', character: 'ドラマチック・下降', description: '緊張感を保ちながら暗く下降し、強いDropや劇的な締めへ向かいたいとき。', tags: ['Future Core', 'Drop', '劇的'], degreeLabel: 'i–VII–VI–V', sourceLabel: 'Open Music Theory', sourceUrl: OPEN_THEORY_CLASSICAL, steps: four(['stable-1', 'stable-7', 'stable-6', 'surprise-major-5']) },
] as const;

const KEY_ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export const CHORD_KEY_OPTIONS: readonly string[] = [
  ...KEY_ROOTS.map((root) => `${root} major`),
  ...KEY_ROOTS.map((root) => `${root} minor`),
];

export function chordKeyMode(key: string): ChordProgressionMode {
  return key.trim().toLowerCase().endsWith('minor') ? 'minor' : 'major';
}

export function keyWithMode(key: string, mode: ChordProgressionMode): string {
  const [root = 'D'] = key.trim().split(/\s+/);
  return `${root} ${mode}`;
}

export function chordProgressionTemplateById(id: string): ChordProgressionTemplate | undefined {
  return CHORD_PROGRESSION_TEMPLATES.find((template) => template.id === id);
}

function validatedStepCount(template: ChordProgressionTemplate): ChordProgressionStepCount {
  if (template.steps.length !== 4 && template.steps.length !== 8) throw new Error(`Chord template must contain 4 or 8 steps: ${template.id}`);
  const total = template.steps.reduce((sum, step) => sum + step.beats, 0);
  if (total !== CHORD_PROGRESSION_BEATS) throw new Error(`Chord template must fill four bars: ${template.id}`);
  return template.steps.length;
}

export function createChordProgressionTemplateBlocks(template: ChordProgressionTemplate, phraseIndex: number, rhythmId: ChordPatternRhythmId): MusicBlock[] {
  if (!Number.isInteger(phraseIndex) || phraseIndex < 0) throw new Error(`Invalid chord template phrase: ${phraseIndex}`);
  validatedStepCount(template);
  let cursor = phraseIndex * CHORD_PROGRESSION_TICKS;
  return template.steps.map((step, stepIndex) => {
    const block = createChordPatternBlock(`pattern-chord-phrase-${phraseIndex}-slot-${stepIndex}`, cursor, step.padId, rhythmId, step.beats);
    cursor += block.durationTick;
    return block;
  });
}

export function previewChordProgressionTemplate(key: string, template: ChordProgressionTemplate): { key: string; symbols: string[] } {
  validatedStepCount(template);
  const previewKey = keyWithMode(key, template.mode);
  const symbols = template.steps.map((step) => {
    const pad = chordPadById(previewKey, step.padId);
    if (!pad) throw new Error(`Chord template uses an unsupported pad: ${template.id}/${step.padId}`);
    return pad.symbol;
  });
  return { key: previewKey, symbols };
}
