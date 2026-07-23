import type { MusicBlock, NoteEvent, TrackRole } from './types';

export type SoundChunkRole = Exclude<TrackRole, 'reference' | 'audio'>;

export interface SoundChunkNote {
  pitch: number;
  offsetTick: number;
  durationTick: number;
  velocity: number;
}

export interface SoundChunk {
  id: string;
  label: string;
  role: SoundChunkRole;
  instrumentId: string;
  lengthTick: number;
  notes: readonly SoundChunkNote[];
  tags: readonly string[];
  userSaved: boolean;
}

const n = (pitch: number, offsetTick: number, durationTick: number, velocity: number): SoundChunkNote => ({ pitch, offsetTick, durationTick, velocity });

export const BUILT_IN_SOUND_CHUNKS: readonly SoundChunk[] = [
  { id: 'harp-gliss', label: 'シャラララン Harp', role: 'arp', instrumentId: 'arp-silver-harp', lengthTick: 1_920, notes: [n(62, 0, 300, 70), n(66, 180, 300, 74), n(69, 360, 360, 78), n(74, 540, 420, 83), n(78, 760, 520, 88), n(81, 1_020, 720, 92)], tags: ['gliss', 'sparkle'], userSaved: false },
  { id: 'music-box-bloom', label: 'Music Box Bloom', role: 'synth', instrumentId: 'synth-music-box', lengthTick: 1_920, notes: [n(74, 0, 420, 76), n(81, 240, 480, 82), n(78, 600, 480, 70), n(86, 960, 760, 88)], tags: ['music box', 'tail'], userSaved: false },
  { id: 'pizzicato-fizz', label: 'Pizzicato Fizz', role: 'synth', instrumentId: 'synth-pizzicato-silk', lengthTick: 1_920, notes: [n(62, 0, 180, 82), n(69, 360, 180, 72), n(66, 600, 180, 78), n(74, 960, 240, 90), n(69, 1_320, 180, 72)], tags: ['pizzicato', 'bounce'], userSaved: false },
  { id: 'star-chime-tail', label: 'Star Chime Tail', role: 'fx', instrumentId: 'fx-star-chime', lengthTick: 1_920, notes: [n(79, 0, 320, 72), n(83, 180, 420, 78), n(86, 420, 560, 86), n(91, 720, 900, 76)], tags: ['FX', 'chime'], userSaved: false },
  { id: 'prism-riser', label: 'Prism Riser', role: 'transition', instrumentId: 'transition-prism-sweep', lengthTick: 1_920, notes: Array.from({ length: 12 }, (_, index) => n(50 + index * 2, index * 150, 210, 58 + index * 5)), tags: ['FX', 'riser'], userSaved: false },
  { id: 'candy-impact', label: 'Candy Impact Stack', role: 'fx', instrumentId: 'fx-candy-impact', lengthTick: 960, notes: [n(38, 0, 720, 108), n(62, 0, 420, 94), n(74, 30, 600, 82), n(86, 60, 780, 74)], tags: ['FX', 'impact'], userSaved: false },
  { id: 'neon-wash-impact', label: 'シュワーーー → ドン', role: 'transition', instrumentId: 'transition-core-impact-rise', lengthTick: 7_680, notes: [n(54, 0, 7_180, 90), n(36, 7_170, 500, 124), n(86, 7_210, 460, 102)], tags: ['FX', '4 bar riser', 'impact'], userSaved: false },
  { id: 'candy-snare-fill', label: 'Candy Snare Fill', role: 'drum', instrumentId: 'drum-hyper-candy', lengthTick: 7_680, notes: [n(38, 6_720, 120, 74), n(38, 6_960, 120, 82), n(38, 7_200, 100, 94), n(38, 7_320, 100, 104), n(38, 7_440, 100, 116), n(38, 7_560, 120, 124)], tags: ['fill', 'snare rush', 'bar end'], userSaved: false },
  { id: 'tom-rush-fill', label: 'Tom Rush Fill', role: 'drum', instrumentId: 'drum-core-impact', lengthTick: 7_680, notes: [n(45, 6_720, 180, 82), n(47, 6_960, 180, 90), n(48, 7_200, 150, 98), n(50, 7_380, 150, 108), n(38, 7_560, 120, 122)], tags: ['fill', 'tom', 'drop cue'], userSaved: false },
  { id: 'reverse-suction-hit', label: 'Reverse Suction Hit', role: 'transition', instrumentId: 'transition-velvet-reverse', lengthTick: 3_840, notes: [n(58, 0, 3_360, 84), n(36, 3_320, 500, 108), n(83, 3_380, 420, 84)], tags: ['FX', 'reverse', 'impact'], userSaved: false },
  { id: 'night-downlifter-tail', label: 'Night Downlifter Tail', role: 'transition', instrumentId: 'transition-night-downlifter', lengthTick: 3_840, notes: [n(58, 0, 3_600, 88), n(34, 2_920, 860, 104)], tags: ['FX', 'downlifter', 'section tail'], userSaved: false },
  { id: 'white-noise-rise', label: 'White Noise Rise 4', role: 'transition', instrumentId: 'transition-white-noise-riser', lengthTick: 7_680, notes: [n(54, 0, 7_560, 70), n(62, 3_840, 3_720, 84), n(86, 7_440, 220, 104)], tags: ['FX', 'noise riser', '4 bar'], userSaved: false },
  { id: 'snare-accelerator', label: 'Snare Accelerator', role: 'drum', instrumentId: 'drum-metallic-core', lengthTick: 7_680, notes: [...Array.from({ length: 8 }, (_, index) => n(38, index * 480, 90, 62 + index * 3)), ...Array.from({ length: 8 }, (_, index) => n(38, 3_840 + index * 240, 80, 78 + index * 4)), ...Array.from({ length: 16 }, (_, index) => n(38, 5_760 + index * 120, 65, 86 + index * 2))], tags: ['fill', 'snare build', 'accelerating'], userSaved: false },
  { id: 'reverse-cymbal-crash', label: 'Reverse Cymbal → Crash', role: 'transition', instrumentId: 'transition-reverse-cymbal-impact', lengthTick: 3_840, notes: [n(58, 0, 3_500, 84), n(86, 3_420, 380, 112), n(36, 3_470, 360, 106)], tags: ['FX', 'reverse cymbal', 'crash'], userSaved: false },
  { id: 'sub-drop-boom', label: 'Sub Drop Boom', role: 'fx', instrumentId: 'fx-low-end-slam', lengthTick: 1_920, notes: [n(36, 0, 1_360, 124), n(34, 180, 1_620, 104), n(58, 0, 1_720, 68)], tags: ['FX', 'sub drop', 'impact'], userSaved: false },
  { id: 'glitch-stutter-fill', label: 'Glitch Stutter Fill', role: 'fx', instrumentId: 'fx-noise-stutter', lengthTick: 1_920, notes: Array.from({ length: 16 }, (_, index) => n(index % 4 === 3 ? 84 : 58, index * 120, 58 + index % 3 * 16, 58 + index * 4)), tags: ['FX', 'stutter', 'digital'], userSaved: false },
  { id: 'hat-thirtysecond-roll', label: '32nd Hat Roll', role: 'drum', instrumentId: 'drum-trap-glass', lengthTick: 1_920, notes: Array.from({ length: 16 }, (_, index) => n(index === 15 ? 46 : 42, 960 + index * 60, 42, 52 + index * 4)), tags: ['fill', 'hat roll', '32nd'], userSaved: false },
  { id: 'house-snare-roll', label: 'House Snare Roll', role: 'drum', instrumentId: 'drum-house-backbeat', lengthTick: 7_680, notes: [...Array.from({ length: 8 }, (_, index) => n(38, 5_760 + index * 240, 90, 68 + index * 5)), ...Array.from({ length: 4 }, (_, index) => n(36, index * 1_920, 140, 106))], tags: ['fill', 'house', 'section end'], userSaved: false },
  { id: 'trap-hat-burst', label: 'Trap Hat Burst', role: 'drum', instrumentId: 'drum-trap-glass', lengthTick: 3_840, notes: [...Array.from({ length: 8 }, (_, index) => n(42, index * 240, 72, index % 2 ? 58 : 72)), ...Array.from({ length: 16 }, (_, index) => n(42, 1_920 + index * 120, 54, 62 + index * 3))], tags: ['fill', 'trap', 'hat burst'], userSaved: false },
  { id: 'crash-entry-stack', label: 'Crash Entry Stack', role: 'fx', instrumentId: 'fx-crash-kick-impact', lengthTick: 1_920, notes: [n(36, 0, 720, 122), n(86, 0, 1_840, 112), n(74, 30, 1_100, 84), n(58, 0, 1_760, 68)], tags: ['FX', 'crash', 'section start'], userSaved: false },
  { id: 'filter-climb-impact', label: 'Filter Climb Impact', role: 'transition', instrumentId: 'transition-filter-climb', lengthTick: 7_680, notes: [n(52, 0, 7_260, 68), n(58, 1_920, 5_360, 78), n(65, 3_840, 3_420, 90), n(36, 7_180, 480, 122)], tags: ['FX', 'filter rise', 'impact'], userSaved: false },
  { id: 'bubble-burst-trail', label: 'Bubble Burst Trail', role: 'fx', instrumentId: 'fx-bubble-rain', lengthTick: 1_920, notes: [n(82, 0, 180, 70), n(86, 210, 220, 78), n(89, 480, 260, 86), n(84, 820, 300, 74), n(91, 1_220, 520, 92)], tags: ['FX', 'bubble', 'tail'], userSaved: false },
  { id: 'prism-downsweep', label: 'Prism Downsweep', role: 'transition', instrumentId: 'transition-prism-downsweep', lengthTick: 3_840, notes: [n(58, 0, 3_720, 92), n(52, 1_920, 1_820, 82), n(34, 3_120, 620, 100)], tags: ['FX', 'down sweep', 'release'], userSaved: false },
  { id: 'bitcrush-spray', label: 'Bitcrush Spray', role: 'fx', instrumentId: 'fx-bitcrush-spray', lengthTick: 1_920, notes: Array.from({ length: 12 }, (_, index) => n(index % 3 === 0 ? 84 : 58, index * 150, 72 + index % 4 * 18, 64 + index * 4)), tags: ['FX', 'bitcrush', 'spray'], userSaved: false },
] as const;

function portableChunkLabel(value: string): string {
  let label = value.trim().slice(0, 24) || 'User Chunk';
  while (encodeURIComponent(label).length > 36 && label.length > 1) label = label.slice(0, -1);
  return label;
}

export function createSoundChunkFromNotes(id: string, label: string, role: SoundChunkRole, instrumentId: string, notes: readonly NoteEvent[]): SoundChunk {
  if (notes.length === 0) throw new Error('音の塊へ保存する音符がありません。');
  const start = Math.min(...notes.map((note) => note.startTick));
  const relative = notes.map((note) => ({ pitch: note.pitch, offsetTick: note.startTick - start, durationTick: note.durationTick, velocity: note.velocity }));
  const lengthTick = Math.max(...relative.map((note) => note.offsetTick + note.durationTick));
  return { id: id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 24), label: portableChunkLabel(label), role, instrumentId, lengthTick, notes: relative, tags: ['user saved'], userSaved: true };
}

const SOUND_CHUNK_ROLES: readonly SoundChunkRole[] = ['melody', 'chord', 'drum', 'bass', 'lead', 'synth', 'pad', 'arp', 'percussion', 'fx', 'transition'];

function soundChunkHeaderAssetId(chunk: SoundChunk): string {
  return `sound-chunk:v1:${chunk.id}:${chunk.role}:${chunk.instrumentId}:${chunk.lengthTick}:${encodeURIComponent(chunk.label)}`;
}

export function soundChunkBlocks(chunk: SoundChunk, stamp: string): MusicBlock[] {
  const headerAssetId = soundChunkHeaderAssetId(chunk);
  if (headerAssetId.length > 160) throw new Error('音の塊の名前または音色IDが長すぎます。');
  const prefix = `saved-sound-chunk-${chunk.id}-${stamp}`.slice(0, 120);
  return [
    { id: `${prefix}-meta`, assetId: headerAssetId, startTick: 0, durationTick: chunk.lengthTick, granularity: 'detail', parentBlockId: null },
    ...chunk.notes.map((note, index) => ({ id: `${prefix}-note-${index}`, assetId: `sound-chunk-note:v1:${chunk.id}:${note.pitch}:${note.velocity}`, startTick: note.offsetTick, durationTick: note.durationTick, granularity: 'detail' as const, parentBlockId: null })),
  ];
}

export function soundChunksFromBlocks(blocks: readonly MusicBlock[]): SoundChunk[] {
  const chunks: SoundChunk[] = [];
  for (const header of blocks) {
    const parts = header.assetId.split(':');
    if (parts[0] !== 'sound-chunk' || parts[1] !== 'v1' || parts.length < 7) continue;
    const [, , id = '', role = '', instrumentId = '', lengthText = '', ...labelParts] = parts;
    if (!id || !SOUND_CHUNK_ROLES.includes(role as SoundChunkRole)) continue;
    const lengthTick = Number(lengthText);
    if (!Number.isInteger(lengthTick) || lengthTick <= 0) continue;
    const notes = blocks.flatMap((block): SoundChunkNote[] => {
      const noteParts = block.assetId.split(':');
      if (noteParts[0] !== 'sound-chunk-note' || noteParts[1] !== 'v1' || noteParts[2] !== id) return [];
      const pitch = Number(noteParts[3]);
      const velocity = Number(noteParts[4]);
      if (!Number.isInteger(pitch) || !Number.isInteger(velocity) || block.startTick < 0 || block.durationTick <= 0) return [];
      return [{ pitch, velocity, offsetTick: block.startTick, durationTick: block.durationTick }];
    }).sort((left, right) => left.offsetTick - right.offsetTick || left.pitch - right.pitch);
    if (notes.length === 0 || notes.some((note) => note.offsetTick + note.durationTick > lengthTick)) continue;
    let label = id;
    try { label = decodeURIComponent(labelParts.join(':')); } catch { /* keep stable id fallback */ }
    chunks.push({ id, label, role: role as SoundChunkRole, instrumentId, lengthTick, notes, tags: ['user saved'], userSaved: true });
  }
  return chunks;
}

export function materializeSoundChunk(chunk: SoundChunk, startTick: number, stamp: string): NoteEvent[] {
  return chunk.notes.map((source, index) => ({
    id: `sound-chunk|v1|${chunk.id}|${stamp}|${index}`,
    pitch: Math.max(0, Math.min(127, Math.round(source.pitch))),
    startTick: Math.max(0, Math.round(startTick + source.offsetTick)),
    durationTick: Math.max(1, Math.round(source.durationTick)),
    velocity: Math.max(1, Math.min(127, Math.round(source.velocity))),
    source: 'manual', confidence: null, userEdited: true, lockPitch: false, lockTiming: false,
  }));
}
