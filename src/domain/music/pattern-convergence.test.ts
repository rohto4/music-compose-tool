import { describe, expect, it } from 'vitest';
import { applyProjectCommand } from './project-commands';
import { chordPatternRanges, createChordPatternBlock, materializeChordPatternNotes } from './chord-patterns';
import { createProject } from './project-factory';

describe('pattern to detail-note convergence', () => {
  it('atomically replaces covered generated chords, removes blocks, and keeps other AI bars', () => {
    const now = '2026-07-22T08:30:00.000Z';
    const project = createProject({ projectId: 'converge', title: 'Converge', now, entryMode: 'patchboard' });
    const track = project.tracks.find((candidate) => candidate.role === 'chord');
    const lane = track?.lanes.find((candidate) => candidate.role === 'main');
    if (!track || !lane) throw new Error('Chord target is missing.');
    lane.notes.push(
      { id: 'ai-0', pitch: 62, startTick: 0, durationTick: 1_890, velocity: 90, source: 'generated', confidence: null, userEdited: false, lockPitch: false, lockTiming: false },
      { id: 'ai-1', pitch: 67, startTick: 1_920, durationTick: 1_890, velocity: 90, source: 'generated', confidence: null, userEdited: false, lockPitch: false, lockTiming: false },
    );
    lane.blocks.push(createChordPatternBlock('slot-0', 0, 'stable-1', 'pulse'));
    const ranges = chordPatternRanges(project);
    const next = applyProjectCommand(project, { type: 'pattern/chords-materialize', trackId: track.id, laneId: lane.id, blockIds: ranges.map((range) => range.blockId), notes: materializeChordPatternNotes(project), at: now });
    const nextLane = next.tracks.find((candidate) => candidate.id === track.id)?.lanes.find((candidate) => candidate.id === lane.id);

    expect(nextLane?.blocks).toHaveLength(0);
    expect(nextLane?.notes.some((note) => note.id === 'ai-0')).toBe(false);
    expect(nextLane?.notes.some((note) => note.id === 'ai-1')).toBe(true);
    expect(nextLane?.notes.filter((note) => note.source === 'manual').length).toBeGreaterThanOrEqual(12);
  });
});
