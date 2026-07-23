import { describe, expect, it } from 'vitest';
import { createChordPatternBlock } from './chord-patterns';
import { applyProjectCommand } from './project-commands';
import { createProject } from './project-factory';
import { ROLE_PATTERN_CATALOG, appliedRolePatternId, generateRolePatternNotes, parseRolePatternNoteId } from './role-patterns';
import type { NoteEvent } from './types';

const NOW = '2026-07-23T02:00:00.000Z';

function projectWithChord(padId = 'stable-1') {
  const project = createProject({ projectId: 'role-patterns', title: 'Role Patterns', now: NOW, entryMode: 'patchboard', key: 'D major' });
  const track = project.tracks.find((candidate) => candidate.role === 'chord')!;
  const lane = track.lanes.find((candidate) => candidate.role === 'main')!;
  return applyProjectCommand(project, {
    type: 'pattern/chords-sequence',
    trackId: track.id,
    laneId: lane.id,
    blocks: [createChordPatternBlock('pattern-chord-phrase-0-slot-0', 0, padId, 'hold', 16)],
    loopEndTick: 7_680,
    at: NOW,
  });
}

describe('role-follow patterns', () => {
  it('provides ten Bass and Arp patterns plus twenty-two distinct Drum patterns', () => {
    const project = projectWithChord();
    expect(ROLE_PATTERN_CATALOG).toHaveLength(42);
    for (const role of ['bass', 'arp', 'drum'] as const) {
      const patterns = ROLE_PATTERN_CATALOG.filter((pattern) => pattern.role === role);
      const expectedCount = role === 'drum' ? 22 : 10;
      expect(patterns).toHaveLength(expectedCount);
      const fingerprints = patterns.map((pattern) => generateRolePatternNotes(project, role, pattern.id, 0)
        .map((note) => `${note.startTick}:${note.pitch}:${note.durationTick}:${note.velocity}`).join('|'));
      expect(new Set(fingerprints).size).toBe(expectedCount);
      expect(fingerprints.every(Boolean)).toBe(true);
    }
  });

  it('follows the selected chord roots and keeps every note inside its phrase', () => {
    const d = projectWithChord('stable-1');
    const a = projectWithChord('stable-5');
    const dBass = generateRolePatternNotes(d, 'bass', 'quarter-pump', 0);
    const aBass = generateRolePatternNotes(a, 'bass', 'quarter-pump', 0);
    const arp = generateRolePatternNotes(d, 'arp', 'rise-eighth', 0);
    expect(dBass[0]?.pitch).toBe(38);
    expect(aBass[0]?.pitch).toBe(45);
    expect(new Set(arp.map((note) => note.pitch % 12))).toEqual(new Set([2, 6, 9]));
    expect([...dBass, ...arp].every((note) => note.startTick >= 0 && note.startTick + note.durationTick <= 7_680)).toBe(true);
    expect(parseRolePatternNoteId(dBass[0]!.id)).toEqual({ role: 'bass', patternId: 'quarter-pump', phraseIndex: 0 });
    const longSync = generateRolePatternNotes(d, 'bass', 'sync-bounce', 0);
    expect(longSync.some((note) => note.startTick >= 4 * 480)).toBe(true);
    expect(longSync.at(-1)!.startTick).toBeGreaterThanOrEqual(12 * 480);
  });

  it('replaces only the target phrase and refreshes unedited notes after a chord change', () => {
    let project = projectWithChord('stable-1');
    const bassTrack = project.tracks.find((candidate) => candidate.role === 'bass')!;
    const bassLane = bassTrack.lanes.find((candidate) => candidate.role === 'main')!;
    const preservedManual: NoteEvent = { id: 'manual-bass', pitch: 40, startTick: 240, durationTick: 240, velocity: 90, source: 'manual', confidence: null, userEdited: true, lockPitch: false, lockTiming: false };
    const preservedOtherPhrase: NoteEvent = { id: 'ai-other-phrase', pitch: 41, startTick: 8_000, durationTick: 240, velocity: 80, source: 'generated', confidence: null, userEdited: false, lockPitch: false, lockTiming: false };
    bassLane.notes.push(preservedManual, preservedOtherPhrase);
    const notes = generateRolePatternNotes(project, 'bass', 'quarter-pump', 0);
    project = applyProjectCommand(project, { type: 'pattern/role-apply', trackId: bassTrack.id, laneId: bassLane.id, role: 'bass', patternId: 'quarter-pump', phraseIndex: 0, startTick: 0, endTick: 7_680, notes, at: NOW });
    const appliedLane = project.tracks.find((track) => track.role === 'bass')!.lanes.find((lane) => lane.role === 'main')!;
    expect(appliedLane.notes.some((note) => note.id === preservedManual.id)).toBe(true);
    expect(appliedLane.notes.some((note) => note.id === preservedOtherPhrase.id)).toBe(true);
    expect(appliedLane.notes.find((note) => parseRolePatternNoteId(note.id))?.pitch).toBe(38);

    const chordTrack = project.tracks.find((track) => track.role === 'chord')!;
    const chordLane = chordTrack.lanes.find((lane) => lane.role === 'main')!;
    project = applyProjectCommand(project, {
      type: 'pattern/chords-sequence',
      trackId: chordTrack.id,
      laneId: chordLane.id,
      blocks: [createChordPatternBlock('pattern-chord-phrase-0-slot-0', 0, 'stable-5', 'hold', 16)],
      loopEndTick: 7_680,
      at: NOW,
    });
    const refreshed = project.tracks.find((track) => track.role === 'bass')!.lanes.find((lane) => lane.role === 'main')!;
    expect(refreshed.notes.find((note) => parseRolePatternNoteId(note.id))?.pitch).toBe(45);
    expect(refreshed.notes.some((note) => note.id === preservedManual.id)).toBe(true);
  });

  it('rejects notes whose encoded role or phrase does not match the command', () => {
    const project = projectWithChord();
    const track = project.tracks.find((candidate) => candidate.role === 'bass')!;
    const lane = track.lanes.find((candidate) => candidate.role === 'main')!;
    const wrong = generateRolePatternNotes(project, 'bass', 'anchor', 0).map((note) => ({ ...note, id: note.id.replace('|bass|', '|arp|') }));
    expect(() => applyProjectCommand(project, { type: 'pattern/role-apply', trackId: track.id, laneId: lane.id, role: 'bass', patternId: 'anchor', phraseIndex: 0, startTick: 0, endTick: 7_680, notes: wrong, at: NOW })).toThrow(/Invalid role pattern note/);
    const wrongPitch = generateRolePatternNotes(project, 'bass', 'anchor', 0).map((note) => ({ ...note, pitch: note.pitch + 1 }));
    expect(() => applyProjectCommand(project, { type: 'pattern/role-apply', trackId: track.id, laneId: lane.id, role: 'bass', patternId: 'anchor', phraseIndex: 0, startTick: 0, endTick: 7_680, notes: wrongPitch, at: NOW })).toThrow(/does not match generator/);
  });

  it('keeps an edited old-pattern note without reactivating that old pattern', () => {
    let project = projectWithChord('stable-1');
    const bassTrack = project.tracks.find((track) => track.role === 'bass')!;
    const bassLane = bassTrack.lanes.find((lane) => lane.role === 'main')!;
    project = applyProjectCommand(project, { type: 'pattern/role-apply', trackId: bassTrack.id, laneId: bassLane.id, role: 'bass', patternId: 'anchor', phraseIndex: 0, startTick: 0, endTick: 7_680, notes: generateRolePatternNotes(project, 'bass', 'anchor', 0), at: NOW });
    project.tracks.find((track) => track.role === 'bass')!.lanes.find((lane) => lane.role === 'main')!.notes[0]!.userEdited = true;
    expect(appliedRolePatternId(project, 'bass', 0)).toBeNull();
    project = applyProjectCommand(project, { type: 'pattern/role-apply', trackId: bassTrack.id, laneId: bassLane.id, role: 'bass', patternId: 'quarter-pump', phraseIndex: 0, startTick: 0, endTick: 7_680, notes: generateRolePatternNotes(project, 'bass', 'quarter-pump', 0), at: NOW });
    expect(appliedRolePatternId(project, 'bass', 0)).toBe('quarter-pump');

    const chordTrack = project.tracks.find((track) => track.role === 'chord')!;
    const chordLane = chordTrack.lanes.find((lane) => lane.role === 'main')!;
    project = applyProjectCommand(project, { type: 'pattern/chords-sequence', trackId: chordTrack.id, laneId: chordLane.id, blocks: [createChordPatternBlock('pattern-chord-phrase-0-slot-0', 0, 'stable-5', 'hold', 16)], loopEndTick: 7_680, at: NOW });
    const notes = project.tracks.find((track) => track.role === 'bass')!.lanes.find((lane) => lane.role === 'main')!.notes;
    expect(notes.some((event) => event.userEdited && parseRolePatternNoteId(event.id)?.patternId === 'anchor')).toBe(true);
    expect(new Set(notes.filter((event) => !event.userEdited).map((event) => parseRolePatternNoteId(event.id)?.patternId))).toEqual(new Set(['quarter-pump']));
  });

  it('revoices applied Bass and Arp after a project key change without moving the melody', () => {
    let project = projectWithChord('stable-1');
    const melodyLane = project.tracks.find((track) => track.id === project.melody.trackId)!.lanes.find((lane) => lane.id === project.melody.laneId)!;
    melodyLane.notes.push({ id: 'melody-protected', pitch: 66, startTick: 0, durationTick: 480, velocity: 96, source: 'humming', confidence: .9, userEdited: true, lockPitch: true, lockTiming: true });
    for (const [role, patternId] of [['bass', 'anchor'], ['arp', 'rise-eighth']] as const) {
      const track = project.tracks.find((candidate) => candidate.role === role)!;
      const lane = track.lanes.find((candidate) => candidate.role === 'main')!;
      project = applyProjectCommand(project, { type: 'pattern/role-apply', trackId: track.id, laneId: lane.id, role, patternId, phraseIndex: 0, startTick: 0, endTick: 7_680, notes: generateRolePatternNotes(project, role, patternId, 0), at: NOW });
    }
    const dBassPitch = project.tracks.find((track) => track.role === 'bass')!.lanes.find((lane) => lane.role === 'main')!.notes.find((event) => parseRolePatternNoteId(event.id))!.pitch;
    const next = applyProjectCommand(project, { type: 'project/settings', targetDurationSeconds: project.creativeIntent.targetDurationSeconds, bpm: project.musicalGrid.bpm, key: 'A major', at: NOW });
    const aBassPitch = next.tracks.find((track) => track.role === 'bass')!.lanes.find((lane) => lane.role === 'main')!.notes.find((event) => parseRolePatternNoteId(event.id))!.pitch;
    expect([dBassPitch, aBassPitch]).toEqual([38, 45]);
    expect(next.tracks.find((track) => track.role === 'arp')!.lanes.find((lane) => lane.role === 'main')!.notes.some((event) => event.pitch % 12 === 9)).toBe(true);
    expect(next.tracks.find((track) => track.id === next.melody.trackId)!.lanes.find((lane) => lane.id === next.melody.laneId)!.notes.find((event) => event.id === 'melody-protected')?.pitch).toBe(66);
  });
});
