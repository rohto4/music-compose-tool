import { describe, expect, it } from 'vitest';
import { createStarterMelody, generateAccompaniment } from './harmonizer';
import { applyProjectCommand } from './project-commands';
import { createProject } from './project-factory';
import { validateProject } from './project-validation';

const NOW = '2026-07-22T03:00:00.000Z';

describe('melody-preserving accompaniment', () => {
  it('creates an integer-grid starter melody that can be replaced by humming later', () => {
    const project = createProject({ projectId: 'har-1', title: 'Starter', now: NOW, entryMode: 'patchboard', key: 'D major' });
    const notes = createStarterMelody(project);
    expect(notes).toHaveLength(16);
    expect(notes.every((note) => Number.isInteger(note.startTick) && Number.isInteger(note.durationTick) && note.lockPitch && note.lockTiming)).toBe(true);
  });

  it('keeps melody bytes unchanged while writing editable accompaniment to separate main and sub lanes', () => {
    let project = createProject({ projectId: 'har-2', title: 'Hummed', now: NOW, entryMode: 'humming-studio', key: 'D major' });
    const melody = createStarterMelody(project).map((note) => ({ ...note, source: 'humming' as const, confidence: .92 }));
    project = applyProjectCommand(project, { type: 'melody/replace', notes: melody, source: 'humming', lockPitch: true, lockTiming: true, at: NOW });
    const melodyBefore = structuredClone(project.tracks[0]?.lanes[0]?.notes);
    const draft = generateAccompaniment(project);
    project = applyProjectCommand(project, { type: 'accompaniment/apply', lanes: draft.lanes, assetIds: draft.assetIds, candidate: { id: 'candidate-1', capability: 'accompaniment', status: 'succeeded', model: 'Template Harmonizer', modelRevision: '1.0.0', seed: null, outputAssetId: null, inputAssetIds: [], intentTrace: draft.intentTrace, createdAt: NOW }, at: NOW });

    expect(project.tracks[0]?.lanes[0]?.notes).toEqual(melodyBefore);
    expect(project.melody.lockPitch).toBe(true);
    expect(project.melody.lockTiming).toBe(true);
    expect(draft.lanes.map((lane) => lane.laneId)).toEqual(expect.arrayContaining(['lane-chord-main', 'lane-chord-sub', 'lane-bass-main', 'lane-bass-sub', 'lane-drum-main', 'lane-drum-sub']));
    expect(draft.lanes.flatMap((lane) => lane.notes).every((note) => note.source === 'generated' && !note.lockPitch && !note.lockTiming)).toBe(true);
    expect(project.generationCandidates.at(-1)?.intentTrace).toEqual(expect.arrayContaining(['melody:pitch-locked', 'melody:timing-locked']));
    expect(validateProject(project)).toEqual([]);
  });

  it('refuses accompaniment when no melody exists', () => {
    const project = createProject({ projectId: 'har-3', title: 'Empty', now: NOW, entryMode: 'humming-studio' });
    expect(() => generateAccompaniment(project)).toThrow('melody');
  });

  it('derives the accompaniment variant from the saved creative intent', async () => {
    const project = createProject({ projectId: 'har-intent', title: 'Driving', now: NOW, entryMode: 'humming-studio', mood: ['勢い'] });
    const withMelody = applyProjectCommand(project, { type: 'melody/replace', notes: createStarterMelody(project), source: 'humming', lockPitch: true, lockTiming: true, at: NOW });
    const { inferIntentProfile } = await import('./intent-refinement');
    expect(inferIntentProfile(withMelody).variant).toBe('driving');
    expect(generateAccompaniment(withMelody, inferIntentProfile(withMelody).variant).intentTrace).toContain('variant:driving');
  });
});
