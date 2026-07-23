import { describe, expect, it } from 'vitest';
import { BUILT_IN_SOUND_CHUNKS, createSoundChunkFromNotes, materializeSoundChunk, soundChunkBlocks, soundChunksFromBlocks } from './sound-chunks';

describe('sound chunks', () => {
  it('keeps twenty-four distinct processed symbolic recipes bounded', () => {
    expect(BUILT_IN_SOUND_CHUNKS).toHaveLength(24);
    expect(new Set(BUILT_IN_SOUND_CHUNKS.map((chunk) => chunk.id)).size).toBe(24);
    expect(new Set(BUILT_IN_SOUND_CHUNKS.map((chunk) => chunk.instrumentId)).size).toBeGreaterThanOrEqual(23);
    expect(BUILT_IN_SOUND_CHUNKS.filter((chunk) => chunk.role === 'transition')).toHaveLength(8);
    expect(BUILT_IN_SOUND_CHUNKS.filter((chunk) => chunk.role === 'drum')).toHaveLength(6);
    for (const chunk of BUILT_IN_SOUND_CHUNKS) {
      expect(chunk.notes.length).toBeGreaterThanOrEqual(2);
      expect(chunk.notes.every((note) => note.offsetTick >= 0 && note.offsetTick + note.durationTick <= chunk.lengthTick)).toBe(true);
    }
  });

  it('serializes a selected block into project data and inserts it at another bar', () => {
    const chunk = createSoundChunkFromNotes('mine', 'My Sparkle', 'synth', 'synth-music-box', [
      { id: 'a', pitch: 72, startTick: 960, durationTick: 240, velocity: 80, source: 'manual', confidence: null, userEdited: true, lockPitch: false, lockTiming: false },
      { id: 'b', pitch: 79, startTick: 1_440, durationTick: 480, velocity: 92, source: 'manual', confidence: null, userEdited: true, lockPitch: false, lockTiming: false },
    ]);
    const blocks = soundChunkBlocks(chunk, '20260723');
    expect(blocks.every((block) => block.assetId.length <= 160)).toBe(true);
    const restored = soundChunksFromBlocks(blocks)[0];
    expect(restored).toEqual(chunk);
    expect(materializeSoundChunk(restored!, 7_680, 'stamp').map((note) => [note.pitch, note.startTick, note.durationTick])).toEqual([[72, 7_680, 240], [79, 8_160, 480]]);
  });
});
