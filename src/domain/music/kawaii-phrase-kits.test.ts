import { describe, expect, it } from 'vitest';
import { createProject } from './project-factory';
import { KAWAII_PHRASE_KITS, applyKawaiiPhraseKit } from './kawaii-phrase-kits';
import { createProjectHistory, executeProjectCommand, undoProject } from './project-history';

function mainNotes(project: ReturnType<typeof createProject>, role: 'melody' | 'bass' | 'arp' | 'drum' | 'pad' | 'synth') {
  return project.tracks.find((track) => track.role === role)?.lanes.find((lane) => lane.role === 'main')?.notes ?? [];
}

describe('Kawaii phrase kits', () => {
  it('inserts a complete four-bar accompaniment while protecting melody, edited notes, and other phrases', () => {
    const project = createProject({ projectId: 'phrase-kit', title: 'Phrase Kit', now: '2026-07-23T00:00:00.000Z', entryMode: 'patchboard', key: 'D major' });
    mainNotes(project, 'melody').push({ id: 'melody-keep', pitch: 74, startTick: 120, durationTick: 480, velocity: 90, source: 'manual', confidence: null, userEdited: true, lockPitch: false, lockTiming: false });
    mainNotes(project, 'bass').push(
      { id: 'edited-keep', pitch: 38, startTick: 240, durationTick: 240, velocity: 80, source: 'generated', confidence: null, userEdited: true, lockPitch: false, lockTiming: false },
      { id: 'other-phrase', pitch: 38, startTick: 8_000, durationTick: 240, velocity: 80, source: 'generated', confidence: null, userEdited: false, lockPitch: false, lockTiming: false },
    );

    applyKawaiiPhraseKit(project, 'prism-drop', 0);

    expect(mainNotes(project, 'melody').map((note) => note.id)).toEqual(['melody-keep']);
    expect(mainNotes(project, 'bass').some((note) => note.id === 'edited-keep')).toBe(true);
    expect(mainNotes(project, 'bass').some((note) => note.id === 'other-phrase')).toBe(true);
    for (const role of ['bass', 'arp', 'drum', 'pad', 'synth'] as const) {
      const notes = mainNotes(project, role).filter((note) => note.startTick < 7_680);
      expect(notes.length, role).toBeGreaterThan(0);
      expect(notes.every((note) => note.startTick + note.durationTick <= 7_680), role).toBe(true);
    }
    expect(project.tracks.find((track) => track.role === 'chord')?.instrumentId).toBe('chord-bright-supersaw');
    expect(project.tracks.find((track) => track.role === 'arp')?.instrumentId).toBe('arp-pixel-drop');
  });

  it('gives all six kits a distinct generated fingerprint', () => {
    const fingerprints = KAWAII_PHRASE_KITS.map((kit) => {
      const project = createProject({ projectId: kit.id, title: kit.label, now: '2026-07-23T00:00:00.000Z', entryMode: 'patchboard', key: 'D major' });
      applyKawaiiPhraseKit(project, kit.id, 0);
      return ['bass', 'arp', 'drum', 'pad', 'synth'].map((role) => {
        const notes = mainNotes(project, role as 'bass' | 'arp' | 'drum' | 'pad' | 'synth');
        return notes.map((note) => `${note.pitch}:${note.startTick}:${note.durationTick}:${note.velocity}`).join(',');
      }).join('|');
    });
    expect(new Set(fingerprints)).toHaveLength(KAWAII_PHRASE_KITS.length);
  });

  it('applies and undoes the kit as one project command', () => {
    const project = createProject({ projectId: 'phrase-history', title: 'History', now: '2026-07-23T00:00:00.000Z', entryMode: 'patchboard', key: 'D major' });
    const before = structuredClone(project);
    const history = executeProjectCommand(createProjectHistory(project), { type: 'pattern/phrase-kit-apply', kitId: 'cloud-intro', phraseIndex: 0, at: '2026-07-23T00:01:00.000Z' });
    expect(mainNotes(history.present, 'pad').length).toBeGreaterThan(0);
    const undone = undoProject(history, '2026-07-23T00:02:00.000Z');
    expect(undone.present.tracks).toEqual(before.tracks);
  });
});
