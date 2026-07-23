import { describe, expect, it } from 'vitest';
import legacyProject from '../../../docs/spec/fixtures/cute-future-bass-project.json';
import productionSchema from '../../../docs/spec/schema/v1/project-manifest.schema.json';
import { applyProjectCommand, createProject, createProjectHistory, executeProjectCommand, isProjectDirty, markProjectSaved, migrateProject, redoProject, undoProject, validateProject } from './index';
import { PPQ } from './types';
import type { NoteEvent } from './types';

const NOW = '2026-07-22T00:00:00.000Z';
const LATER = '2026-07-22T00:01:00.000Z';

function note(id = 'note-test'): NoteEvent {
  return { id, pitch: 66, startTick: 0, durationTick: 480, velocity: 96, source: 'manual', confidence: null, userEdited: false, lockPitch: false, lockTiming: false };
}

describe('Project domain', () => {
  it('pins the portable project contract to format 1.0.0 and the complete top-level shape', () => {
    expect(productionSchema.properties.formatVersion.const).toBe('1.0.0');
    expect(productionSchema.required).toEqual(expect.arrayContaining(['entryMode', 'tracks', 'hummingTakes', 'generationCandidates', 'loop']));
    expect(productionSchema.$defs.section.properties.role.enum).toContain('bridge');
    expect(productionSchema.$defs.hummingTake.required).toContain('transcribedNotes');
    expect(productionSchema.$defs.track.properties.role.enum).toEqual(expect.arrayContaining(['lead', 'pad', 'arp', 'percussion', 'transition', 'audio']));
  });

  it('creates a valid project with main and sub lanes for every instrument track', () => {
    const project = createProject({ projectId: 'project-1', title: 'Sparkle', now: NOW, entryMode: 'patchboard' });

    expect(project.tracks.length).toBeGreaterThanOrEqual(10);
    expect(project.tracks.every((track) => track.lanes.some((lane) => lane.role === 'main') && track.lanes.some((lane) => lane.role === 'sub'))).toBe(true);
    expect(project.arrangement.sections.some((section) => section.role === 'bridge')).toBe(true);
    expect(validateProject(project)).toEqual([]);
  });

  it('applies note commands and keeps revision monotonic through undo and redo', () => {
    const project = createProject({ projectId: 'project-1', title: 'Sparkle', now: NOW, entryMode: 'humming-studio' });
    let history = createProjectHistory(project);
    history = executeProjectCommand(history, { type: 'note/add', trackId: 'track-melody', laneId: 'lane-melody-main', note: note(), at: LATER });
    expect(history.present.revision).toBe(1);
    expect(history.present.tracks[0]?.lanes[0]?.notes).toHaveLength(1);
    history = undoProject(history, '2026-07-22T00:02:00.000Z');
    expect(history.present.revision).toBe(2);
    expect(history.present.tracks[0]?.lanes[0]?.notes).toHaveLength(0);
    history = redoProject(history, '2026-07-22T00:03:00.000Z');
    expect(history.present.revision).toBe(3);
    expect(history.present.tracks[0]?.lanes[0]?.notes).toHaveLength(1);
  });

  it('keeps multi-note transforms and paste as one undoable command', () => {
    const project = createProject({ projectId: 'project-batch', title: 'Batch', now: NOW, entryMode: 'patchboard' });
    const first = note('batch-1');
    const second = { ...note('batch-2'), startTick: 480 };
    let history = createProjectHistory(project);
    history = executeProjectCommand(history, { type: 'note/add-many', trackId: 'track-melody', laneId: 'lane-melody-main', notes: [first, second], at: LATER });
    expect(history.present.tracks[0]?.lanes[0]?.notes).toHaveLength(2);
    history = executeProjectCommand(history, { type: 'note/update-many', trackId: 'track-melody', laneId: 'lane-melody-main', updates: [{ noteId: first.id, patch: { durationTick: 960 } }, { noteId: second.id, patch: { durationTick: 720 } }], at: LATER });
    expect(history.present.tracks[0]?.lanes[0]?.notes.map((item) => item.durationTick)).toEqual([960, 720]);
    history = undoProject(history, '2026-07-22T00:02:00.000Z');
    expect(history.present.tracks[0]?.lanes[0]?.notes.map((item) => item.durationTick)).toEqual([480, 480]);
    history = undoProject(history, '2026-07-22T00:03:00.000Z');
    expect(history.present.tracks[0]?.lanes[0]?.notes).toHaveLength(0);
  });

  it('stores FX automation points through a single parameter lane command', () => {
    const project = createProject({ projectId: 'project-automation', title: 'Automation', now: NOW, entryMode: 'patchboard' });
    const points = [{ id: 'auto-1', tick: 0, value: 0, curve: 'linear' as const }, { id: 'auto-2', tick: 960, value: .8, curve: 'step' as const }];
    const next = applyProjectCommand(project, { type: 'automation/set', trackId: 'track-melody', parameter: 'reverb', points, at: LATER });
    expect(next.tracks.find((item) => item.id === 'track-melody')?.automation.find((item) => item.parameter === 'reverb')?.points).toEqual(points);
  });

  it('tracks manual save without autosaving later edits', () => {
    const project = createProject({ projectId: 'project-1', title: 'Sparkle', now: NOW, entryMode: 'patchboard' });
    const saved = markProjectSaved(project);
    expect(isProjectDirty(saved)).toBe(false);
    const renamed = applyProjectCommand(saved, { type: 'project/rename', title: 'Changed', at: LATER });
    expect(isProjectDirty(renamed)).toBe(true);
  });

  it('stores spoken intent media without replacing the humming melody', () => {
    const project = createProject({ projectId: 'project-voice-intent', title: 'Voice Intent', now: NOW, entryMode: 'humming-studio' });
    const melodyLane = project.tracks.find((track) => track.id === project.melody.trackId)?.lanes.find((lane) => lane.id === project.melody.laneId);
    melodyLane?.notes.push({ ...note('melody-before-voice'), source: 'humming', lockPitch: true, lockTiming: true });
    const before = structuredClone(melodyLane?.notes ?? []);
    const next = applyProjectCommand(project, { type: 'project/intent-media', kind: 'spoken', assetId: 'user-audio-voice-memo', at: LATER });
    const after = next.tracks.find((track) => track.id === next.melody.trackId)?.lanes.find((lane) => lane.id === next.melody.laneId)?.notes;
    expect(next.creativeIntent.spokenIntentAssetId).toBe('user-audio-voice-memo');
    expect(next.assetRefs).toContain('user-audio-voice-memo');
    expect(after).toEqual(before);
  });

  it('updates project-wide length, key, and BPM settings through one command', () => {
    const project = createProject({ projectId: 'project-settings', title: 'Settings', now: NOW, entryMode: 'patchboard' });
    const next = applyProjectCommand(project, { type: 'project/settings', targetDurationSeconds: 180, bpm: 172, key: 'F# minor', at: LATER });
    expect(next.creativeIntent.targetDurationSeconds).toBe(180);
    expect(next.musicalGrid.bpm).toBe(172);
    expect(next.musicalGrid.key).toBe('F# minor');
    expect(next.arrangement.sections.reduce((sum, section) => sum + section.bars, 0)).toBe(Math.round(180 * 172 / 240));
    expect(next.revision).toBe(1);
  });

  it('migrates the Phase 0 fixture to the production main lane', () => {
    const migrated = migrateProject(legacyProject);

    expect(migrated.formatVersion).toBe('1.0.0');
    expect(migrated.entryMode).toBe('humming-studio');
    expect(migrated.tracks.find((track) => track.id === migrated.melody.trackId)?.lanes.find((lane) => lane.id === migrated.melody.laneId)?.notes).toHaveLength(2);
    expect(validateProject(migrated)).toEqual([]);
  });

  it('reports duplicate notes and an invalid melody lane', () => {
    const project = createProject({ projectId: 'project-1', title: 'Sparkle', now: NOW, entryMode: 'patchboard' });
    project.tracks[0]?.lanes[0]?.notes.push(note('duplicate'));
    project.tracks[1]?.lanes[0]?.notes.push(note('duplicate'));
    project.melody.laneId = 'missing';
    const codes = validateProject(project).map((issue) => issue.code);
    expect(codes).toContain('note.duplicate');
    expect(codes).toContain('melody.lane');
  });

  it('applies and switches editable humming take transcriptions without changing their notes', () => {
    let project = createProject({ projectId: 'project-humming', title: 'Humming', now: NOW, entryMode: 'humming-studio' });
    const targetSectionId = project.arrangement.sections[0]!.id;
    project = applyProjectCommand(project, { type: 'humming/take-add', take: { id: 'take-1', assetId: 'asset-take-1', label: 'Take 01', recordedAt: NOW, durationSeconds: 2, targetSectionId, rangeStartTick: 0, rangeEndTick: 1920, status: 'transcribing', selected: false, transcribedNotes: [] }, at: LATER });
    const takeNotes = [note('humming-note-1')].map((item) => ({ ...item, source: 'humming' as const, lockPitch: true, lockTiming: true }));
    project = applyProjectCommand(project, { type: 'humming/transcription-apply', takeId: 'take-1', notes: takeNotes, candidate: { id: 'candidate-take-1', capability: 'humming-transcription', status: 'succeeded', model: 'Basic Pitch', modelRevision: '1.0.1', seed: null, outputAssetId: null, inputAssetIds: ['asset-take-1'], intentTrace: ['melody:pitch-locked', 'melody:timing-locked'], createdAt: LATER }, at: LATER });
    const melodyNotes = project.tracks.find((track) => track.id === project.melody.trackId)?.lanes.find((lane) => lane.id === project.melody.laneId)?.notes;
    expect(project.hummingTakes[0]?.selected).toBe(true);
    expect(project.melody.activeTakeId).toBe('take-1');
    expect(melodyNotes).toEqual(takeNotes);
    expect(validateProject(project)).toEqual([]);
  });

  it('normalizes older 1.0.0 humming takes without embedded notes', () => {
    const project = createProject({ projectId: 'project-old', title: 'Old', now: NOW, entryMode: 'humming-studio' });
    const oldShape = structuredClone(project) as unknown as Record<string, unknown>;
    oldShape.hummingTakes = [{ id: 'take-old', assetId: 'asset-old', label: 'Old', recordedAt: NOW, durationSeconds: 1, targetSectionId: project.arrangement.sections[0]!.id, rangeStartTick: 0, rangeEndTick: 480, status: 'recorded', selected: false }];
    expect(migrateProject(oldShape).hummingTakes[0]?.transcribedNotes).toEqual([]);
  });

  it('adds, moves, edits and removes arrangement sections and lane blocks through commands', () => {
    let project = createProject({ projectId: 'project-arrange', title: 'Arrange', now: NOW, entryMode: 'patchboard' });
    project = applyProjectCommand(project, { type: 'arrangement/section-add', section: { id: 'section-added', role: 'bridge', label: 'Bridge C', startBar: 0, bars: 4, energyStart: .4, energyEnd: .65, transitionAssetId: null }, toIndex: 1, at: LATER });
    expect(project.arrangement.sections[1]?.id).toBe('section-added');
    expect(project.arrangement.sections[2]?.startBar).toBe(project.arrangement.sections[0]!.bars + 4);
    project = applyProjectCommand(project, { type: 'arrangement/section-update', sectionId: 'section-added', patch: { bars: 6, energyEnd: .8 }, at: LATER });
    expect(project.arrangement.sections[1]?.bars).toBe(6);
    project = applyProjectCommand(project, { type: 'block/add', trackId: 'track-chord', laneId: 'lane-chord-sub', block: { id: 'block-1', assetId: 'chord-soft-supersaw', startTick: 4 * 4 * 480, durationTick: 6 * 4 * 480, granularity: 'draft', parentBlockId: 'section-added' }, at: LATER });
    expect(project.tracks.find((track) => track.id === 'track-chord')?.lanes[1]?.blocks).toHaveLength(1);
    project = applyProjectCommand(project, { type: 'arrangement/reorder', sectionId: 'section-added', toIndex: 0, at: LATER });
    expect(project.tracks.find((track) => track.id === 'track-chord')?.lanes[1]?.blocks[0]?.startTick).toBe(0);
    project = applyProjectCommand(project, { type: 'arrangement/section-remove', sectionId: 'section-added', at: LATER });
    expect(project.arrangement.sections.some((section) => section.id === 'section-added')).toBe(false);
    expect(project.tracks.find((track) => track.id === 'track-chord')?.lanes[1]?.blocks).toHaveLength(0);
    expect(validateProject(project)).toEqual([]);
  });

  it('places one built-in sound per role and phrase as an atomic replaceable block', () => {
    let project = createProject({ projectId: 'project-sound-place', title: 'Sound Place', now: NOW, entryMode: 'patchboard' });
    project = applyProjectCommand(project, { type: 'asset/place', trackId: 'track-fx', laneId: 'lane-fx-main', blockId: 'placed-asset-fx-air-wash-0', assetId: 'fx-air-wash', startTick: 0, durationTick: 7_680, at: LATER });
    project = applyProjectCommand(project, { type: 'asset/place', trackId: 'track-fx', laneId: 'lane-fx-main', blockId: 'placed-asset-fx-candy-impact-0', assetId: 'fx-candy-impact', startTick: 0, durationTick: 7_680, at: LATER });
    const lane = project.tracks.find((track) => track.id === 'track-fx')?.lanes.find((candidate) => candidate.id === 'lane-fx-main');
    expect(lane?.blocks).toEqual([{ id: 'placed-asset-fx-candy-impact-0', assetId: 'fx-candy-impact', startTick: 0, durationTick: 7_680, granularity: 'draft', parentBlockId: null }]);
    expect(project.assetRefs).toContain('fx-candy-impact');
    expect(validateProject(project)).toEqual([]);
  });

  it('replaces a flow asset without replacing the melody and realigns section blocks', () => {
    let project = createProject({ projectId: 'project-flow', title: 'Flow', now: NOW, entryMode: 'patchboard' });
    const melodyNote = project.tracks.find((track) => track.id === 'track-melody')!.lanes[0]!;
    melodyNote.notes.push({ id: 'melody-keep', pitch: 69, startTick: 0, durationTick: 480, velocity: 96, source: 'manual', confidence: null, userEdited: true, lockPitch: false, lockTiming: false });
    const oldSectionId = project.arrangement.sections[0]!.id;
    project = applyProjectCommand(project, { type: 'block/add', trackId: 'track-chord', laneId: 'lane-chord-main', block: { id: 'block-old-flow', assetId: 'chord-soft-supersaw', startTick: 0, durationTick: 4 * PPQ, granularity: 'draft', parentBlockId: oldSectionId }, at: LATER });
    const replacement = [
      { id: 'section-gentle-intro', role: 'intro' as const, label: 'Soft Intro', startBar: 0, bars: 8, energyStart: .1, energyEnd: .3, transitionAssetId: null },
      { id: 'section-gentle-drop', role: 'drop' as const, label: 'Main Drop', startBar: 0, bars: 16, energyStart: .9, energyEnd: .86, transitionAssetId: 'transition-soft-rise' },
    ];
    project = applyProjectCommand(project, { type: 'arrangement/replace', sections: replacement, sourceAssetId: 'gentle-rise', at: LATER });
    expect(project.arrangement.sourceAssetId).toBe('gentle-rise');
    expect(project.arrangement.sections.map((section) => section.startBar)).toEqual([0, 8]);
    expect(project.tracks.find((track) => track.id === 'track-melody')?.lanes[0]?.notes[0]?.id).toBe('melody-keep');
    expect(project.tracks.find((track) => track.id === 'track-chord')?.lanes[0]?.blocks).toEqual([]);
    expect(validateProject(project)).toEqual([]);
  });
});
