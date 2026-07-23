import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { collectStemTracks, createMidiBlob, parseMidiFile, parseStemBundle, parseWavHeader } from './exports';
import { chordPadCatalog, createChordPatternBlock, createProject, generateRolePatternNotes } from '../../domain/music';

function wavFixture(durationSamples = 4_410): Uint8Array {
  const dataBytes = durationSamples * 2 * 2;
  const bytes = new Uint8Array(44 + dataBytes);
  const view = new DataView(bytes.buffer);
  const write = (offset: number, value: string) => [...value].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  write(0, 'RIFF'); view.setUint32(4, 36 + dataBytes, true); write(8, 'WAVE'); write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 2, true); view.setUint32(24, 44_100, true); view.setUint32(28, 176_400, true); view.setUint16(32, 4, true); view.setUint16(34, 16, true); write(36, 'data'); view.setUint32(40, dataBytes, true);
  return bytes;
}

describe('audio exports', () => {
  it('writes and parses note-off durations in a Standard MIDI file', async () => {
    const project = createProject({ projectId: 'export-test', title: 'Export', now: '2026-07-22T00:00:00.000Z', entryMode: 'patchboard' });
    const lane = project.tracks[0]?.lanes[0];
    lane?.notes.push({ id: 'note-1', pitch: 72, startTick: 0, durationTick: 480, velocity: 100, source: 'manual', confidence: 1, userEdited: true, lockPitch: false, lockTiming: false }, { id: 'note-2', pitch: 74, startTick: 480, durationTick: 960, velocity: 90, source: 'manual', confidence: 1, userEdited: true, lockPitch: false, lockTiming: false });
    const bytes = new Uint8Array(await createMidiBlob(project).arrayBuffer());
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('MThd');
    expect(new TextDecoder().decode(bytes.slice(14, 18))).toBe('MTrk');
    expect(bytes).toContain(0x90);
    expect(bytes).toContain(0x80);
    const parsed = parseMidiFile(bytes);
    const notes = parsed.tracks.flatMap((track) => track.notes);
    expect(parsed.format).toBe(1);
    expect(parsed.division).toBe(480);
    expect(notes.map((note) => ({ pitch: note.pitch, startTick: note.startTick, durationTick: note.durationTick }))).toEqual([{ pitch: 72, startTick: 0, durationTick: 480 }, { pitch: 74, startTick: 480, durationTick: 960 }]);
  });

  it('materializes symbolic chord pattern blocks into the Standard MIDI chord track', async () => {
    const project = createProject({ projectId: 'pattern-midi', title: 'Pattern MIDI', now: '2026-07-22T00:00:00.000Z', entryMode: 'patchboard', bpm: 150, key: 'D major' });
    const chordLane = project.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main');
    if (!chordLane) throw new Error('Chord lane is missing.');
    chordLane.blocks.push({ id: 'slot-0', assetId: 'pattern:chord:v1:stable-1:hold', startTick: 0, durationTick: 1_920, granularity: 'draft', parentBlockId: null });

    const parsed = parseMidiFile(new Uint8Array(await createMidiBlob(project).arrayBuffer()));
    const chordTrack = parsed.tracks.find((track) => track.name === 'Chords / Main');
    expect(chordTrack?.notes).toHaveLength(3);
    expect(chordTrack?.notes.every((note) => note.startTick === 0 && note.durationTick > 1_800)).toBe(true);
  });

  it('exports a dominant thirteenth with the same six pitches used by the chord pad', async () => {
    const project = createProject({ projectId: 'quality-midi', title: 'Quality MIDI', now: '2026-07-24T00:00:00.000Z', entryMode: 'patchboard', bpm: 150, key: 'D major' });
    const chordLane = project.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main');
    if (!chordLane) throw new Error('Chord lane is missing.');
    chordLane.blocks.push(createChordPatternBlock('quality-midi-13', 0, 'extension-5-dom13', 'hold'));

    const parsed = parseMidiFile(new Uint8Array(await createMidiBlob(project).arrayBuffer()));
    const actualPitches = parsed.tracks.find((track) => track.name === 'Chords / Main')?.notes.map((note) => note.pitch) ?? [];
    const intervals = chordPadCatalog('D major').find((pad) => pad.id === 'extension-5-dom13')?.intervals;
    if (!intervals) throw new Error('Dominant thirteenth is missing.');
    expect(actualPitches.map((pitch) => pitch - actualPitches[0]!)).toEqual(intervals);
  });

  it('exports applied Bass, Arp, and Drum role patterns as ordinary MIDI tracks', async () => {
    const project = createProject({ projectId: 'role-pattern-midi', title: 'Role Pattern MIDI', now: '2026-07-23T00:00:00.000Z', entryMode: 'patchboard', bpm: 150, key: 'D major' });
    const chordLane = project.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main');
    if (!chordLane) throw new Error('Chord lane is missing.');
    chordLane.blocks.push(createChordPatternBlock('pattern-chord-phrase-0-slot-0', 0, 'stable-1', 'hold', 16));
    const patternIds = { bass: 'quarter-pump', arp: 'rise-eighth', drum: 'half-time' } as const;
    for (const role of ['bass', 'arp', 'drum'] as const) {
      const lane = project.tracks.find((track) => track.role === role)?.lanes.find((candidate) => candidate.role === 'main');
      if (!lane) throw new Error(`${role} lane is missing.`);
      lane.notes.push(...generateRolePatternNotes(project, role, patternIds[role], 0));
    }

    const parsed = parseMidiFile(new Uint8Array(await createMidiBlob(project).arrayBuffer()));
    expect(parsed.tracks.find((track) => track.name === 'Bass / Main')?.notes.length).toBeGreaterThan(0);
    expect(parsed.tracks.find((track) => track.name === 'Arp / Main')?.notes.length).toBeGreaterThan(0);
    expect(parsed.tracks.find((track) => track.name === 'Drums / Main')?.notes.length).toBeGreaterThan(0);
  });

  it('keeps eighth-grid and dotted-quarter chord positions and durations in MIDI', async () => {
    const project = createProject({ projectId: 'pattern-midi-beats', title: 'Pattern MIDI beats', now: '2026-07-22T00:00:00.000Z', entryMode: 'patchboard', bpm: 150, key: 'D major' });
    const chordLane = project.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main');
    if (!chordLane) throw new Error('Chord lane is missing.');
    chordLane.blocks.push(
      { id: 'pattern-chord-slot-0', assetId: 'pattern:chord:v1:stable-1:hold', startTick: 0, durationTick: 240, granularity: 'draft', parentBlockId: null },
      { id: 'pattern-chord-slot-1', assetId: 'pattern:chord:v1:stable-2:hold', startTick: 240, durationTick: 720, granularity: 'draft', parentBlockId: null },
    );

    const parsed = parseMidiFile(new Uint8Array(await createMidiBlob(project).arrayBuffer()));
    const notes = parsed.tracks.find((track) => track.name === 'Chords / Main')?.notes ?? [];
    expect(notes.filter((note) => note.startTick === 0).every((note) => note.durationTick === 210)).toBe(true);
    expect(notes.filter((note) => note.startTick === 240).every((note) => note.durationTick === 690)).toBe(true);
  });

  it('keeps AI-generated chord bars outside a partially edited pattern bar in MIDI', async () => {
    const project = createProject({ projectId: 'partial-pattern-midi', title: 'Partial', now: '2026-07-22T00:00:00.000Z', entryMode: 'patchboard', bpm: 150, key: 'D major' });
    const chordLane = project.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main');
    if (!chordLane) throw new Error('Chord lane is missing.');
    chordLane.notes.push(
      { id: 'ai-bar-1', pitch: 62, startTick: 0, durationTick: 1_890, velocity: 90, source: 'generated', confidence: null, userEdited: false, lockPitch: false, lockTiming: false },
      { id: 'ai-bar-2', pitch: 67, startTick: 1_920, durationTick: 1_890, velocity: 90, source: 'generated', confidence: null, userEdited: false, lockPitch: false, lockTiming: false },
    );
    chordLane.blocks.push({ id: 'slot-0', assetId: 'pattern:chord:v1:stable-1:hold', startTick: 0, durationTick: 1_920, granularity: 'draft', parentBlockId: null });

    const parsed = parseMidiFile(new Uint8Array(await createMidiBlob(project).arrayBuffer()));
    const notes = parsed.tracks.find((track) => track.name === 'Chords / Main')?.notes ?? [];
    expect(notes.filter((note) => note.startTick === 0)).toHaveLength(3);
    expect(notes.some((note) => note.startTick === 1_920 && note.pitch === 67)).toBe(true);
  });

  it('parses a canonical PCM WAV fixture envelope and duration', () => {
    const header = parseWavHeader(wavFixture());
    expect(header).toMatchObject({ audioFormat: 1, channels: 2, sampleRate: 44_100, bitsPerSample: 16, dataBytes: 17_640 });
    expect(header.durationSeconds).toBeCloseTo(.1, 6);
  });

  it('keeps audio-only reference layers in the stem track list', () => {
    const project = createProject({ projectId: 'audio-stem-test', title: 'Audio stem', now: '2026-07-22T00:00:00.000Z', entryMode: 'patchboard' });
    const reference = project.tracks.find((track) => track.role === 'reference');
    const lane = reference?.lanes.find((candidate) => candidate.kind === 'audio');
    expect(reference).toBeDefined();
    expect(lane).toBeDefined();
    lane?.audioClips.push({ id: 'clip-ai', assetId: 'user-audio-layer', startTick: 0, durationTick: 960, offsetSeconds: 0, gain: 1 });
    expect(collectStemTracks(project).map((track) => track.role)).toContain('reference');
  });

  it('parses a STEMS fixture and validates every member WAV', async () => {
    const zip = new JSZip();
    const fixture = wavFixture(2_205);
    zip.file('master.wav', fixture);
    zip.file('stems/lead.wav', fixture);
    zip.file('stems.json', JSON.stringify({ format: 'patchtone-stems', projectId: 'export-test', tracks: [{ id: 'lead', name: 'Lead', role: 'lead' }] }));
    const parsed = await parseStemBundle(await zip.generateAsync({ type: 'uint8array' }));
    expect(parsed.projectId).toBe('export-test');
    expect(parsed.stemFileNames).toEqual(['stems/lead.wav']);
    expect(parsed.wavHeaders['master.wav']?.durationSeconds).toBeCloseTo(.05, 6);
  });

  it('rejects malformed MIDI and WAV fixtures', async () => {
    expect(() => parseMidiFile(new Uint8Array([0x4d, 0x54, 0x68, 0x64]))).toThrow(/MIDI/);
    expect(() => parseWavHeader(new Uint8Array([0x52, 0x49, 0x46, 0x46]))).toThrow(/WAVE/);
    const zip = new JSZip();
    zip.file('master.wav', wavFixture());
    zip.file('stems.json', JSON.stringify({ format: 'patchtone-stems', projectId: 'broken', tracks: [{ id: 'lead', name: 'Lead', role: 'lead' }] }));
    await expect(parseStemBundle(await zip.generateAsync({ type: 'uint8array' }))).rejects.toThrow(/file count mismatch/);
  });
});
