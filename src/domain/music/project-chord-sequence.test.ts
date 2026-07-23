import { describe, expect, it } from 'vitest';
import { applyProjectCommand, createChordPatternBlock, createProject } from './index';

const NOW = '2026-07-23T00:00:00.000Z';

describe('multi-phrase chord sequence command', () => {
  it('accepts any positive number of complete four-bar phrases', () => {
    const project = createProject({ projectId: 'long-chords', title: 'Long Chords', now: NOW, entryMode: 'patchboard' });
    const track = project.tracks.find((candidate) => candidate.role === 'chord')!;
    const lane = track.lanes.find((candidate) => candidate.role === 'main')!;
    const blocks = [
      createChordPatternBlock('phrase-1', 0, 'stable-1', 'hold', 4),
      createChordPatternBlock('phrase-2', 7_680, 'stable-4', 'hold', 4),
      createChordPatternBlock('phrase-3', 15_360, 'stable-5', 'hold', 4),
    ];
    const next = applyProjectCommand(project, { type: 'pattern/chords-sequence', trackId: track.id, laneId: lane.id, blocks, loopEndTick: 23_040, at: NOW });
    expect(next.loop).toEqual({ enabled: true, startTick: 0, endTick: 23_040 });
    expect(next.tracks.find((candidate) => candidate.id === track.id)?.lanes.find((candidate) => candidate.id === lane.id)?.blocks).toEqual(blocks);
  });

  it('rejects a partial phrase and a step outside the song loop', () => {
    const project = createProject({ projectId: 'invalid-chords', title: 'Invalid Chords', now: NOW, entryMode: 'patchboard' });
    const track = project.tracks.find((candidate) => candidate.role === 'chord')!;
    const lane = track.lanes.find((candidate) => candidate.role === 'main')!;
    expect(() => applyProjectCommand(project, { type: 'pattern/chords-sequence', trackId: track.id, laneId: lane.id, blocks: [], loopEndTick: 8_000, at: NOW })).toThrow(/7680-tick phrases/);
    expect(() => applyProjectCommand(project, { type: 'pattern/chords-sequence', trackId: track.id, laneId: lane.id, blocks: [createChordPatternBlock('outside', 7_680, 'stable-1', 'hold', 4)], loopEndTick: 7_680, at: NOW })).toThrow(/Invalid chord step range/);
  });
});
