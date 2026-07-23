import { describe, expect, it } from 'vitest';
import { applyProjectCommand } from './project-commands';
import { createProject } from './project-factory';
import { SONG_STARTERS } from './song-starters';
import { PPQ } from './types';

describe('song starters', () => {
  it('keeps source and license metadata for every editable starter', () => {
    expect(SONG_STARTERS).toHaveLength(6);
    for (const starter of SONG_STARTERS) {
      expect(starter.sourceUrl).toMatch(/^https:\/\/www\.mutopiaproject\.org\//);
      expect(starter.license).toMatch(/Public Domain|CC BY 4\.0/);
      expect(starter.attribution.length).toBeGreaterThan(30);
      expect(starter.bars).toBe(16);
      expect(starter.tracks).toEqual(['Melody', 'Chords', 'Bass', 'Drums', 'Pad', 'Arp', 'Synth']);
    }
    expect(new Set(SONG_STARTERS.map((starter) => starter.key)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(SONG_STARTERS.flatMap((starter) => starter.sections.map((section) => section.role))).size).toBeGreaterThanOrEqual(5);
  });

  it('materializes every catalog entry as a bounded editable score', () => {
    for (const starter of SONG_STARTERS) {
      const project = createProject({ projectId: `starter-${starter.id}`, title: starter.title, now: '2026-07-23T00:00:00.000Z', entryMode: 'patchboard' });
      const next = applyProjectCommand(project, { type: 'project/starter-apply', starterId: starter.id, at: '2026-07-23T00:01:00.000Z' });
      const melody = next.tracks.find((track) => track.id === next.melody.trackId)?.lanes.find((lane) => lane.id === next.melody.laneId);
      expect(melody?.notes.length).toBeGreaterThan(15);
      expect(melody?.notes.every((note) => note.durationTick > 0 && note.startTick + note.durationTick <= 16 * 4 * PPQ)).toBe(true);
      expect(next.arrangement.sections.reduce((sum, section) => sum + section.bars, 0)).toBe(16);
      expect(next.loop.endTick).toBe(16 * 4 * PPQ);
      for (const role of ['bass', 'drum', 'pad', 'arp', 'synth'] as const) {
        const notes = next.tracks.find((track) => track.role === role)?.lanes.find((lane) => lane.role === 'main')?.notes ?? [];
        expect(notes.length, `${starter.id}:${role}`).toBeGreaterThan(0);
        expect(notes.every((note) => note.startTick >= 0 && note.startTick + note.durationTick <= next.loop.endTick), `${starter.id}:${role}`).toBe(true);
      }
    }
  });

  it('applies melody, chords, sections, key and tempo as one undoable command', () => {
    const project = createProject({ projectId: 'starter-test', title: 'Starter Test', now: '2026-07-23T00:00:00.000Z', entryMode: 'patchboard' });
    const next = applyProjectCommand(project, { type: 'project/starter-apply', starterId: 'ode-to-joy-theme', at: '2026-07-23T00:01:00.000Z' });
    const melody = next.tracks.find((track) => track.id === next.melody.trackId)?.lanes.find((lane) => lane.id === next.melody.laneId);
    const chords = next.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main');

    expect(next.revision).toBe(project.revision + 1);
    expect(next.musicalGrid).toMatchObject({ key: 'D major', bpm: 116 });
    expect(next.arrangement.sourceAssetId).toBe('song-starter:ode-to-joy-theme');
    expect(next.arrangement.sections.map((section) => [section.label, section.startBar, section.bars])).toEqual([
      ['Theme', 0, 8],
      ['Theme Return', 8, 8],
    ]);
    expect(melody?.notes.length).toBeGreaterThan(30);
    expect(melody?.notes.at(-1)?.startTick).toBeLessThan(16 * 4 * PPQ);
    expect(chords?.blocks).toHaveLength(16);
    expect(chords?.blocks[0]?.assetId).toBe('pattern:chord:v1:stable-1:hold');
    expect(chords?.blocks[1]?.assetId).toBe('pattern:chord:v1:stable-5:hold');
    expect(next.loop).toEqual({ enabled: true, startTick: 0, endTick: 16 * 4 * PPQ });
  });

  it('rejects an unknown starter without changing the project', () => {
    const project = createProject({ projectId: 'starter-invalid', title: 'Starter Invalid', now: '2026-07-23T00:00:00.000Z', entryMode: 'patchboard' });
    expect(() => applyProjectCommand(project, { type: 'project/starter-apply', starterId: 'missing', at: '2026-07-23T00:01:00.000Z' })).toThrow('Unknown song starter');
    expect(project.revision).toBe(0);
  });
});
