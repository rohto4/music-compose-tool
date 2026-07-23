import { describe, expect, it } from 'vitest';
import { createAiStarterFoundation } from './ai-starter';
import { createProject } from './project-factory';

describe('AI Starter foundation', () => {
  it('creates editable symbolic melody and accompaniment with a disclosed local fallback', () => {
    const now = '2026-07-22T08:00:00.000Z';
    const base = createProject({ projectId: 'ai-starter', title: 'Starter', now, entryMode: 'patchboard', key: 'D major' });
    const project = createAiStarterFoundation(base, now);
    const melody = project.tracks.find((track) => track.role === 'melody')?.lanes.find((lane) => lane.role === 'main')?.notes ?? [];
    const populatedRoles = project.tracks.filter((track) => track.lanes.some((lane) => lane.notes.some((note) => note.source === 'generated'))).map((track) => track.role);

    expect(melody).toHaveLength(16);
    expect(melody.every((note) => note.source === 'generated' && !note.lockPitch && !note.lockTiming)).toBe(true);
    expect(populatedRoles).toEqual(expect.arrayContaining(['melody', 'chord', 'drum', 'bass', 'pad', 'arp']));
    expect(project.generationCandidates.at(-1)).toMatchObject({ status: 'succeeded', model: 'Template Harmonizer', modelRevision: 'symbolic-v1' });
    expect(project.generationCandidates.at(-1)?.intentTrace.join(' ')).toContain('Local fallback');
  });
});
