import { describe, expect, it } from 'vitest';
import { createProject } from './project-factory';
import { CHORD_PATTERN_BAR_TICKS, CHORD_PROGRESSION_BEATS, CHORD_PROGRESSION_TICKS, chordPatternAssetId, chordPadCatalog, createChordPatternBlock, defaultChordStepBeats, materializeChordPatternNotes, mergeChordPatternNotes, normalizeChordStepBeats, parseChordPatternAssetId, rebalanceChordStepBeats } from './chord-patterns';

const NOW = '2026-07-22T06:00:00.000Z';

describe('chord pattern foundation', () => {
  it('keeps four- and eight-chord layouts inside four bars on an eighth-note grid', () => {
    expect(defaultChordStepBeats(4)).toEqual([4, 4, 4, 4]);
    expect(defaultChordStepBeats(8)).toEqual([2, 2, 2, 2, 2, 2, 2, 2]);

    const dottedQuarter = rebalanceChordStepBeats([4, 4, 4, 4], 4, 0, 1.5, 3);
    expect(dottedQuarter).toEqual({ beats: [1.5, 4, 4, 6.5], autoStepIndex: 3 });
    const next = rebalanceChordStepBeats(dottedQuarter.beats, 4, 1, 3, dottedQuarter.autoStepIndex);
    expect(next).toEqual({ beats: [1.5, 3, 4, 7.5], autoStepIndex: 3 });
    expect(next.beats.reduce((sum, beats) => sum + beats, 0)).toBe(CHORD_PROGRESSION_BEATS);
    expect(next.beats.every((beats) => Number.isInteger(beats * 2))).toBe(true);

    const movedAuto = rebalanceChordStepBeats(next.beats, 4, 3, 2.5, next.autoStepIndex);
    expect(movedAuto).toEqual({ beats: [1.5, 3, 9, 2.5], autoStepIndex: 2 });
    expect(normalizeChordStepBeats([4, 4, 4, 4, 4, 4, 4, 4], 8).beats).toEqual(defaultChordStepBeats(8));
    expect(CHORD_PROGRESSION_TICKS).toBe(7_680);
  });

  it('offers a deterministic pad bank split into stable, color, and surprise discovery bands', () => {
    const first = chordPadCatalog('D major');
    const second = chordPadCatalog('D major');

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThanOrEqual(12);
    expect(new Set(first.map((pad) => pad.band))).toEqual(new Set(['stable', 'color', 'surprise']));
    expect(first).toHaveLength(46);
    expect(first.filter((pad) => pad.band === 'stable').map((pad) => pad.mapColumn)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(first.some((pad) => pad.symbol === 'D')).toBe(true);
    expect(first.some((pad) => pad.symbol === 'Gm' && pad.band === 'surprise')).toBe(true);
    expect(first.find((pad) => pad.symbol === 'D5')?.intervals).toEqual([0, 7]);
    expect(first.find((pad) => pad.symbol === 'Daug')?.intervals).toEqual([0, 4, 8]);
    expect(first.find((pad) => pad.symbol === 'C#dim7')?.intervals).toEqual([0, 3, 6, 9]);
    expect(first.find((pad) => pad.symbol === 'C#m7♭5')?.intervals).toEqual([0, 3, 6, 10]);
    expect(first.find((pad) => pad.symbol === 'A9')?.intervals).toEqual([0, 4, 7, 10, 14]);
    expect(first.find((pad) => pad.symbol === 'A11')?.intervals).toEqual([0, 4, 7, 10, 14, 17]);
    expect(first.find((pad) => pad.symbol === 'A13')?.intervals).toEqual([0, 4, 7, 10, 14, 21]);

    const minor = chordPadCatalog('A minor');
    expect(minor).toHaveLength(46);
    expect(minor.find((pad) => pad.symbol === 'Am(maj7)')?.intervals).toEqual([0, 3, 7, 11]);
    expect(new Set(first.map((pad) => pad.id)).size).toBe(first.length);
    expect(new Set(minor.map((pad) => pad.id)).size).toBe(minor.length);
  });

  it('keeps every major and minor quality interval identical from catalog to placed notes', () => {
    for (const key of ['D major', 'A minor']) {
      const catalog = chordPadCatalog(key);
      expect(catalog).toHaveLength(46);
      for (const pad of catalog) {
        const project = createProject({ projectId: `quality-${key}-${pad.id}`, title: 'Quality bank', now: NOW, entryMode: 'patchboard', key });
        const chordLane = project.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main');
        if (!chordLane) throw new Error('Chord lane is missing.');
        chordLane.blocks.push(createChordPatternBlock(`block-${pad.id}`, 0, pad.id, 'hold'));

        const placedPitches = materializeChordPatternNotes(project).map((note) => note.pitch);
        expect(placedPitches, `${key}/${pad.id} voice count`).toHaveLength(pad.intervals.length);
        expect(placedPitches.map((pitch) => pitch - placedPitches[0]!), `${key}/${pad.id} intervals`).toEqual(pad.intervals);
      }
    }
  });

  it('retains the original fourteen pad IDs for existing major and minor projects', () => {
    const stableIds = Array.from({ length: 7 }, (_, index) => `stable-${index + 1}`);
    const majorLegacyIds = [...stableIds, 'color-1-add9', 'color-4-maj7', 'color-2-min7', 'color-5-7', 'surprise-borrowed-4', 'surprise-b7', 'surprise-secondary-6'];
    const minorLegacyIds = [...stableIds, 'color-1-add9', 'color-4-min7', 'color-5-sus4', 'color-6-maj7', 'surprise-major-4', 'surprise-b2', 'surprise-major-5'];

    expect(majorLegacyIds.every((id) => chordPadCatalog('D major').some((pad) => pad.id === id))).toBe(true);
    expect(minorLegacyIds.every((id) => chordPadCatalog('A minor').some((pad) => pad.id === id))).toBe(true);
  });

  it('materializes eighth-note and dotted-quarter steps without pulse notes escaping the block', () => {
    const project = createProject({ projectId: 'pattern-beats', title: 'Variable beats', now: NOW, entryMode: 'patchboard', key: 'D major' });
    const chordLane = project.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main');
    if (!chordLane) throw new Error('Chord lane is missing.');
    chordLane.blocks.push(
      createChordPatternBlock('pattern-chord-slot-0', 0, 'stable-1', 'pulse', .5),
      createChordPatternBlock('pattern-chord-slot-1', 240, 'stable-2', 'pulse', 1.5),
    );

    const notes = materializeChordPatternNotes(project);
    expect(notes.filter((note) => note.id.startsWith('pattern-chord-slot-0'))).toHaveLength(3);
    expect(notes.some((note) => note.startTick >= 240 && note.id.startsWith('pattern-chord-slot-0'))).toBe(false);
    expect(notes.some((note) => note.startTick === 240 + 480 && note.id.startsWith('pattern-chord-slot-1'))).toBe(true);
  });

  it('round-trips versioned pattern identity and rejects malformed IDs', () => {
    const assetId = chordPatternAssetId('stable-1', 'syncopated');
    expect(parseChordPatternAssetId(assetId)).toEqual({ padId: 'stable-1', rhythmId: 'syncopated' });
    expect(parseChordPatternAssetId('pattern:chord:unknown')).toBeNull();
  });

  it('materializes one-bar blocks into deterministic notes and revoices when the project key changes', () => {
    const project = createProject({ projectId: 'pattern-1', title: 'Pattern', now: NOW, entryMode: 'patchboard', key: 'D major' });
    const chordLane = project.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main');
    if (!chordLane) throw new Error('Chord lane is missing.');
    chordLane.blocks.push(
      createChordPatternBlock('slot-0', 0, 'stable-1', 'hold'),
      createChordPatternBlock('slot-1', CHORD_PATTERN_BAR_TICKS, 'stable-5', 'pulse'),
    );

    const first = materializeChordPatternNotes(project);
    const second = materializeChordPatternNotes(project);
    expect(first).toEqual(second);
    expect(first.filter((note) => note.startTick === 0)).toHaveLength(3);
    expect(first.some((note) => note.startTick === CHORD_PATTERN_BAR_TICKS + 3 * 480)).toBe(true);

    const transposed = structuredClone(project);
    transposed.musicalGrid.key = 'E major';
    const shifted = materializeChordPatternNotes(transposed);
    expect(shifted[0]!.pitch - first[0]!.pitch).toBe(2);
  });

  it('replaces generated harmony only inside the bars covered by manual pattern blocks', () => {
    const project = createProject({ projectId: 'pattern-merge', title: 'Merge', now: NOW, entryMode: 'patchboard', key: 'D major' });
    const chordLane = project.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main');
    if (!chordLane) throw new Error('Chord lane is missing.');
    chordLane.blocks.push(createChordPatternBlock('slot-0', 0, 'surprise-borrowed-4', 'hold'));
    const generated = [0, 1, 2, 3].map((bar) => ({ id: `generated-${bar}`, pitch: 62 + bar, startTick: bar * CHORD_PATTERN_BAR_TICKS, durationTick: CHORD_PATTERN_BAR_TICKS - 30, velocity: 90, source: 'generated' as const, confidence: null, userEdited: false, lockPitch: false, lockTiming: false }));

    const merged = mergeChordPatternNotes(project, generated);
    expect(merged.some((note) => note.id === 'generated-0')).toBe(false);
    expect(merged.filter((note) => note.id.startsWith('generated-')).map((note) => note.id)).toEqual(['generated-1', 'generated-2', 'generated-3']);
    expect(merged.filter((note) => note.source === 'asset')).toHaveLength(3);
  });
});
