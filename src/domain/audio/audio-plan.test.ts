import { describe, expect, it } from 'vitest';
import { BUILT_IN_SOUND_CHUNKS, CHORD_PROGRESSION_TICKS, ROLE_PATTERN_CATALOG, applyProjectCommand, createChordPatternBlock, createProject, materializeSoundChunk } from '../music';
import { buildAssetAuditionPlan, buildChordPadAuditionPlan, buildNoteBlockAuditionPlan, buildProjectAudioPlan, buildProjectPlaybackPlan, buildRolePatternAuditionPlan } from './audio-plan';
import { BUILT_IN_AUDIO_ASSETS } from './built-in-assets';

const NOW = '2026-07-22T02:00:00.000Z';

function acousticFingerprint(plan: ReturnType<typeof buildAssetAuditionPlan>): string {
  return JSON.stringify(plan.events.map((event) => event.kind === 'tone'
    ? { kind: event.kind, startSeconds: event.startSeconds, durationSeconds: event.durationSeconds, frequency: event.frequency, waveform: event.waveform, gain: event.gain, pan: event.pan, brightness: event.brightness, attackSeconds: event.attackSeconds, releaseSeconds: event.releaseSeconds }
    : { kind: event.kind, startSeconds: event.startSeconds, durationSeconds: event.durationSeconds, gain: event.gain, pan: event.pan, waveform: event.waveform, brightness: event.brightness, character: event.character, direction: event.direction }));
}

describe('audio event planning', () => {
  it('extends a full-song render to an unlimited chord phrase loop', () => {
    const project = createProject({ projectId: 'audio-long-score', title: 'Long Score', now: NOW, entryMode: 'patchboard', bpm: 120, key: 'D major' });
    project.loop = { enabled: true, startTick: 0, endTick: 20 * 7_680 };
    const plan = buildProjectAudioPlan(project);
    expect(plan.durationSeconds).toBe(160);
    expect(plan.events.every((event) => event.startSeconds < plan.durationSeconds)).toBe(true);
  });

  it('builds a deterministic multi-role Future Bass preview without flat audio', () => {
    const project = createProject({ projectId: 'audio-1', title: 'Soda', now: NOW, entryMode: 'patchboard', bpm: 150, key: 'D major' });
    const first = buildProjectAudioPlan(project, 2);
    const second = buildProjectAudioPlan(project, 2);

    expect(first).toEqual(second);
    expect(first.durationSeconds).toBeCloseTo(3.2);
    expect(first.events.some((event) => event.kind === 'tone')).toBe(true);
    expect(first.events.some((event) => event.kind === 'kick')).toBe(true);
    expect(first.events.some((event) => event.kind === 'clap')).toBe(true);
    expect(first.events.every((event) => event.startSeconds >= 0)).toBe(true);
  });

  it('auditions a four-bar role pattern with the real selected chord and timbres', () => {
    const project = createProject({ projectId: 'audio-role-pattern', title: 'Role Pattern', now: NOW, entryMode: 'patchboard', bpm: 150, key: 'D major' });
    const chordLane = project.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main');
    if (!chordLane) throw new Error('Chord lane is missing.');
    chordLane.blocks.push(createChordPatternBlock('pattern-chord-phrase-0-slot-0', 0, 'stable-1', 'hold', 16));
    const plan = buildRolePatternAuditionPlan(project, 'bass', 'eighth-drive', 0);
    const tones = plan.events.filter((event) => event.kind === 'tone');
    expect(plan.durationSeconds).toBeCloseTo(6.4);
    expect(tones.some((event) => event.kind === 'tone' && event.timbreId?.includes('bass'))).toBe(true);
    expect(tones.some((event) => event.kind === 'tone' && event.timbreId?.includes('chord'))).toBe(true);
  });

  it('keeps all role-pattern auditions free of the unrelated end sparkle whistle', () => {
    const project = createProject({ projectId: 'audio-role-pattern-bank', title: 'Role Pattern Bank', now: NOW, entryMode: 'patchboard', bpm: 150, key: 'D major' });
    const chordLane = project.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main');
    if (!chordLane) throw new Error('Chord lane is missing.');
    chordLane.blocks = [0, 1, 2, 3].map((bar) => createChordPatternBlock(`pattern-chord-phrase-0-slot-${bar}`, bar * 1_920, ['stable-1', 'stable-5', 'stable-6', 'stable-4'][bar]!, 'hold', 4));
    project.loop = { enabled: true, startTick: 0, endTick: CHORD_PROGRESSION_TICKS };

    for (const pattern of ROLE_PATTERN_CATALOG) {
      const plan = buildRolePatternAuditionPlan(project, pattern.role, pattern.id, 0);
      expect(plan.events.some((event) => event.kind === 'sparkle'), `${pattern.role}/${pattern.id}`).toBe(false);
      expect(plan.events.every((event) => event.startSeconds + event.durationSeconds <= plan.durationSeconds + .001), `${pattern.role}/${pattern.id} range`).toBe(true);
    }
  });

  it('uses humming melody notes when present instead of replacing them', () => {
    const project = createProject({ projectId: 'audio-2', title: 'Humming', now: NOW, entryMode: 'humming-studio', bpm: 120, key: 'D major' });
    project.tracks[0]?.lanes[0]?.notes.push({ id: 'hummed', pitch: 72, startTick: 0, durationTick: 480, velocity: 100, source: 'humming', confidence: .9, userEdited: false, lockPitch: true, lockTiming: true });
    const plan = buildProjectAudioPlan(project, 1);
    const matchingFrequency = 440 * 2 ** ((72 - 69) / 12);
    expect(plan.events.some((event) => event.kind === 'tone' && Math.abs(event.frequency - matchingFrequency) < .001 && event.gain > .07)).toBe(true);
  });

  it('provides a non-empty one-tap phrase for every built-in asset', () => {
    for (const asset of BUILT_IN_AUDIO_ASSETS) {
      const plan = buildAssetAuditionPlan(asset);
      expect(plan.events.length, asset.id).toBeGreaterThan(0);
      expect(plan.durationSeconds, asset.id).toBeLessThanOrEqual(2.5);
      expect(plan.events.every((event) => event.timbreId === asset.id), `${asset.id} audition source`).toBe(true);
    }
  });

  it('gives every drum kit an audible fingerprint beyond its name and rhythm', () => {
    const assets = BUILT_IN_AUDIO_ASSETS.filter((asset) => asset.category === 'drum');
    const fingerprints = assets.map((asset) => acousticFingerprint(buildAssetAuditionPlan(asset)));
    expect(assets).toHaveLength(20);
    expect(new Set(fingerprints).size).toBe(assets.length);
    for (const [index, asset] of assets.entries()) {
      const events = buildAssetAuditionPlan(asset).events;
      expect(events.every((event) => event.kind !== 'tone' && event.waveform === asset.waveform), asset.id).toBe(true);
      expect(events.every((event) => event.kind !== 'tone' && event.brightness === asset.brightness), `${asset.id} brightness`).toBe(true);
      expect(fingerprints[index]).toContain(asset.character);
    }
  });

  it('renders transition sweeps as distinct motion and layers the common rise-to-impact sound', () => {
    const transitions = BUILT_IN_AUDIO_ASSETS.filter((asset) => asset.category === 'transition');
    const fingerprints = transitions.map((asset) => acousticFingerprint(buildAssetAuditionPlan(asset)));
    expect(transitions).toHaveLength(24);
    expect(new Set(fingerprints).size).toBe(transitions.length);
    expect(transitions.every((asset) => buildAssetAuditionPlan(asset).events.some((event) => event.kind === 'sweep'))).toBe(true);
    const impact = BUILT_IN_AUDIO_ASSETS.find((asset) => asset.id === 'transition-core-impact-rise');
    if (!impact) throw new Error('Core Impact Rise is missing.');
    expect(buildAssetAuditionPlan(impact).events.map((event) => event.kind)).toEqual(['sweep', 'kick', 'clap']);
  });

  it('schedules an inserted four-bar wash and impact as actual transition audio events', () => {
    const project = createProject({ projectId: 'audio-transition-chunk', title: 'Transition Chunk', now: NOW, entryMode: 'patchboard', bpm: 150, key: 'D major' });
    const chunk = BUILT_IN_SOUND_CHUNKS.find((candidate) => candidate.id === 'neon-wash-impact');
    const track = project.tracks.find((candidate) => candidate.role === 'transition');
    const lane = track?.lanes.find((candidate) => candidate.role === 'main');
    if (!chunk || !track || !lane) throw new Error('Transition chunk fixture is incomplete.');
    const withChunk = applyProjectCommand(project, {
      type: 'sound-chunk/insert', trackId: track.id, laneId: lane.id, instrumentId: chunk.instrumentId,
      notes: materializeSoundChunk(chunk, 0, 'test'), at: NOW,
    });
    const events = buildProjectAudioPlan(withChunk, 4).events.filter((event) => event.timbreId === chunk.instrumentId);
    expect(events.some((event) => event.kind === 'sweep' && event.durationSeconds > 5.5)).toBe(true);
    expect(events.some((event) => event.kind === 'kick' && event.startSeconds > 5.5)).toBe(true);
    expect(events.some((event) => event.kind === 'sparkle' && event.startSeconds > 5.5)).toBe(true);
  });

  it('uses lower role-specific melodic previews without a detached whistle note at the end', () => {
    for (const category of ['lead', 'synth', 'arp'] as const) {
      const asset = BUILT_IN_AUDIO_ASSETS.find((candidate) => candidate.category === category);
      if (!asset) throw new Error(`Missing ${category} asset`);
      const tones = buildAssetAuditionPlan(asset).events.filter((event) => event.kind === 'tone');
      expect(tones.length).toBeGreaterThanOrEqual(4);
      expect(Math.max(...tones.map((event) => event.kind === 'tone' ? event.frequency : 0)), category).toBeLessThan(900);
      expect(tones.at(-1)!.startSeconds - tones.at(-2)!.startSeconds, category).toBeLessThanOrEqual(.21);
    }
  });

  it('auditions a chord pad immediately with the currently selected chord timbre', () => {
    const project = createProject({ projectId: 'audio-pad', title: 'Pad', now: NOW, entryMode: 'patchboard', bpm: 150, key: 'D major' });
    const chordTrack = project.tracks.find((track) => track.role === 'chord');
    if (!chordTrack) throw new Error('Chord track is missing.');
    chordTrack.instrumentId = 'chord-glass-pluck';

    const plan = buildChordPadAuditionPlan(project, 'stable-1');
    const tones = plan.events.filter((event) => event.kind === 'tone');
    expect(tones).toHaveLength(3);
    expect(tones.every((event) => event.kind === 'tone' && event.timbreId === 'chord-glass-pluck')).toBe(true);
    expect(tones.every((event) => event.kind === 'tone' && event.synthesis?.layers.length === 2)).toBe(true);
    expect(plan.durationSeconds).toBeLessThanOrEqual(2.5);
  });

  it('uses materialized chord blocks instead of the fallback progression', () => {
    const project = createProject({ projectId: 'audio-pattern', title: 'Pattern', now: NOW, entryMode: 'patchboard', bpm: 120, key: 'D major' });
    const chordLane = project.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main');
    if (!chordLane) throw new Error('Chord lane is missing.');
    chordLane.blocks.push({ id: 'slot-0', assetId: 'pattern:chord:v1:surprise-b7:hold', startTick: 0, durationTick: 1_920, granularity: 'draft', parentBlockId: null });
    const plan = buildProjectAudioPlan(project, 1);
    const patternTones = plan.events.filter((event) => event.kind === 'tone' && event.timbreId?.startsWith('chord-'));
    expect(patternTones.length).toBeGreaterThanOrEqual(3);
  });

  it('carries mixer FX and automation values into scheduled notes', () => {
    const project = createProject({ projectId: 'audio-fx', title: 'FX', now: NOW, entryMode: 'humming-studio', bpm: 120, key: 'D major' });
    const melody = project.tracks.find((track) => track.role === 'melody');
    const lane = melody?.lanes.find((candidate) => candidate.role === 'main');
    if (!melody || !lane) throw new Error('Melody fixture is incomplete.');
    melody.fx = { filter: .4, reverb: .2, delay: .6, sidechain: .1 };
    melody.automation = [{ id: 'automation-filter', parameter: 'filter', enabled: true, points: [{ id: 'p0', tick: 0, value: .2, curve: 'linear' }, { id: 'p1', tick: 480, value: .8, curve: 'linear' }] }];
    lane.notes.push({ id: 'fx-note', pitch: 72, startTick: 240, durationTick: 240, velocity: 100, source: 'manual', confidence: 1, userEdited: true, lockPitch: false, lockTiming: false });
    const event = buildProjectAudioPlan(project, 1).events.find((candidate) => candidate.kind === 'tone' && Math.abs(candidate.frequency - 523.2511306011972) < .01);
    expect(event?.kind).toBe('tone');
    if (event?.kind !== 'tone') throw new Error('FX fixture did not schedule a tone.');
    expect(event.effects?.filter).toBeCloseTo(.5);
    expect(event.effects?.delay).toBeCloseTo(.6);
  });

  it('uses the selected track instrument when scheduling its tones', () => {
    const project = createProject({ projectId: 'audio-instrument', title: 'Instrument', now: NOW, entryMode: 'patchboard', bpm: 120, key: 'D major' });
    const melody = project.tracks.find((track) => track.role === 'melody');
    const lane = melody?.lanes.find((candidate) => candidate.role === 'main');
    if (!melody || !lane) throw new Error('Melody fixture is incomplete.');
    melody.instrumentId = 'arp-pixel-drop';
    lane.notes.push({ id: 'instrument-note', pitch: 72, startTick: 0, durationTick: 480, velocity: 100, source: 'manual', confidence: 1, userEdited: true, lockPitch: false, lockTiming: false });
    const event = buildProjectAudioPlan(project, 1).events.find((candidate) => candidate.kind === 'tone' && Math.abs(candidate.frequency - 523.2511306011972) < .01);
    expect(event?.kind).toBe('tone');
    expect(event && event.kind === 'tone' ? event.waveform : null).toBe('square');
  });

  it('plays the whole song once even when the chord score stores its extent in loop', () => {
    const project = createProject({ projectId: 'audio-whole-song', title: 'Whole Song', now: NOW, entryMode: 'patchboard', bpm: 120, key: 'D major' });
    project.loop = { enabled: true, startTick: 0, endTick: 4 * 4 * 480 };
    const exportPlan = buildProjectAudioPlan(project, 8);
    const playbackPlan = buildProjectPlaybackPlan(project, 8);
    expect(playbackPlan).toEqual(exportPlan);
    expect(playbackPlan.durationSeconds).toBeCloseTo(16);
  });

  it('slices whole-project playback at a PPQ tick and keeps the remaining tail of crossing notes', () => {
    const project = createProject({ projectId: 'audio-seek', title: 'Seek', now: NOW, entryMode: 'patchboard', bpm: 120, key: 'D major' });
    const melody = project.tracks.find((track) => track.role === 'melody');
    const lane = melody?.lanes.find((candidate) => candidate.role === 'main');
    if (!melody || !lane) throw new Error('Melody fixture is incomplete.');
    lane.notes.push({ id: 'crossing-note', pitch: 72, startTick: 1_680, durationTick: 480, velocity: 100, source: 'manual', confidence: 1, userEdited: true, lockPitch: false, lockTiming: false });
    const full = buildProjectPlaybackPlan(project, 4);
    const sliced = buildProjectPlaybackPlan(project, 4, 4 * 480);
    const crossing = sliced.events.find((event) => event.kind === 'tone' && Math.abs(event.frequency - 523.2511306011972) < .01);

    expect(sliced.durationSeconds).toBeCloseTo(full.durationSeconds - 2);
    expect(crossing).toMatchObject({ startSeconds: 0 });
    expect(crossing?.durationSeconds).toBeCloseTo(.25);
    expect(sliced.events.every((event) => event.startSeconds >= 0 && event.startSeconds < sliced.durationSeconds)).toBe(true);
  });

  it('auditions selected note blocks with relative timing and the current track timbre', () => {
    const project = createProject({ projectId: 'audio-blocks', title: 'Blocks', now: NOW, entryMode: 'patchboard', bpm: 120, key: 'D major' });
    const track = project.tracks.find((candidate) => candidate.role === 'melody');
    const lane = track?.lanes.find((candidate) => candidate.role === 'main');
    if (!track || !lane) throw new Error('Melody fixture is missing.');
    track.instrumentId = 'lead-ribbon-pluck';
    lane.notes.push(
      { id: 'block-a', pitch: 64, startTick: 960, durationTick: 240, velocity: 80, source: 'manual', confidence: 1, userEdited: true, lockPitch: false, lockTiming: false },
      { id: 'block-b', pitch: 67, startTick: 1_440, durationTick: 480, velocity: 104, source: 'manual', confidence: 1, userEdited: true, lockPitch: false, lockTiming: false },
    );
    const plan = buildNoteBlockAuditionPlan(project, track.id, ['block-a', 'block-b']);
    const tones = plan.events.filter((event) => event.kind === 'tone');
    expect(tones.map((event) => event.startSeconds)).toEqual([0, .5]);
    expect(tones.every((event) => event.timbreId === 'lead-ribbon-pluck')).toBe(true);
    expect(plan.durationSeconds).toBeGreaterThan(1);
    expect(() => buildNoteBlockAuditionPlan(project, track.id, [])).toThrow(/選択/);
  });
});
