import { CHORD_PROGRESSION_TICKS, chordPadById, createChordPatternBlock, generateRolePatternNotes, materializeChordPatternNotes, mergeChordPatternNotes, parseChordPatternAssetId, PPQ } from '../music';
import type { NoteEvent, Project, RolePatternRole } from '../music';
import { findBuiltInAudioAsset } from './built-in-assets';
import type { AudioEvent, AudioEventPlan, BuiltInAudioAsset, ToneAudioEvent } from './types';

const NOTE_NAMES: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

function midiFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function rootMidi(key: string): number {
  const noteName = key.trim().split(/\s+/)[0] ?? 'D';
  return 60 + (NOTE_NAMES[noteName] ?? 2);
}

function secondsPerBeat(bpm: number): number {
  return 60 / bpm;
}

type TrackMix = { enabled: boolean; volume: number; pan: number; effects: { filter: number; reverb: number; delay: number; sidechain: number } };

function tone(asset: BuiltInAudioAsset, midi: number, startSeconds: number, durationSeconds: number, gain: number, pan = 0, effects?: TrackMix['effects']): ToneAudioEvent {
  const attackSeconds = Math.min(asset.synthesis?.attackSeconds ?? .08, durationSeconds * .45);
  const event: ToneAudioEvent = { kind: 'tone', startSeconds, durationSeconds, frequency: midiFrequency(midi), waveform: asset.waveform, gain, pan, brightness: asset.brightness, attackSeconds, releaseSeconds: asset.synthesis?.releaseSeconds ?? Math.min(.22, durationSeconds * .35), timbreId: asset.id };
  if (asset.synthesis) event.synthesis = asset.synthesis;
  if (effects) event.effects = effects;
  return event;
}

const INSTRUMENT_ALIASES: Record<string, string> = {
  'pearl-lead': 'lead-pearl',
  'soft-supersaw': 'chord-soft-supersaw',
  'candy-kit': 'drum-candy-kit',
  'round-sub': 'bass-round-sub',
  'cloud-lead': 'lead-pearl',
  'glass-pluck': 'synth-glass-pluck',
  'pastel-pad': 'pad-pastel-air',
  'pixel-arp': 'arp-pixel-drop',
  'tiny-perc': 'perc-tiny-pop',
  'sparkle-fx': 'fx-sparkle-dust',
  'soft-transition': 'transition-soft-rise',
};

function selected(project: Project, category: BuiltInAudioAsset['category'], fallbackId: string, trackRole: Project['tracks'][number]['role'] = category, tick?: number): BuiltInAudioAsset {
  const track = project.tracks.find((candidate) => candidate.role === trackRole);
  if (track && tick !== undefined) {
    const placed = track.lanes
      .flatMap((lane) => lane.blocks)
      .filter((block) => block.id.startsWith('placed-asset-') && block.startTick <= tick && block.startTick + block.durationTick > tick)
      .toSorted((left, right) => left.startTick - right.startTick || left.id.localeCompare(right.id))
      .map((block) => findBuiltInAudioAsset(block.assetId))
      .findLast((asset) => asset?.category === category && asset.trackRole === trackRole);
    if (placed) return placed;
  }
  const instrumentId = track?.instrumentId ? (INSTRUMENT_ALIASES[track.instrumentId] ?? track.instrumentId) : '';
  const instrument = findBuiltInAudioAsset(instrumentId);
  if (instrument) return instrument;
  const selectedAsset = project.assetRefs.map(findBuiltInAudioAsset).find((asset) => asset?.category === category);
  const fallback = findBuiltInAudioAsset(fallbackId);
  if (!fallback) throw new Error(`Missing built-in audio asset: ${fallbackId}`);
  return selectedAsset ?? fallback;
}

function projectMelodyNotes(project: Project): NoteEvent[] {
  const track = project.tracks.find((candidate) => candidate.id === project.melody.trackId);
  return track?.lanes.find((candidate) => candidate.id === project.melody.laneId)?.notes ?? [];
}

function trackNotes(project: Project, role: Project['tracks'][number]['role']): NoteEvent[] {
  return project.tracks.find((track) => track.role === role)?.lanes.flatMap((lane) => lane.notes) ?? [];
}

function automationValue(track: Project['tracks'][number] | undefined, parameter: keyof TrackMix['effects'] | 'volume' | 'pan', tick: number, fallback: number): number {
  const lane = track?.automation.find((candidate) => candidate.parameter === parameter);
  const points = lane?.points.slice().sort((left, right) => left.tick - right.tick) ?? [];
  if (points.length === 0) return fallback;
  const before = points.filter((point) => point.tick <= tick).at(-1);
  const after = points.find((point) => point.tick >= tick);
  if (!before) return after?.value ?? fallback;
  if (!after || after.id === before.id) return before.value;
  if (before.curve === 'step') return before.value;
  const span = Math.max(1, after.tick - before.tick);
  return before.value + (after.value - before.value) * Math.max(0, Math.min(1, (tick - before.tick) / span));
}

function mixFor(project: Project, role: Project['tracks'][number]['role'], tick = 0): TrackMix {
  const track = project.tracks.find((candidate) => candidate.role === role);
  const soloTracks = project.tracks.filter((candidate) => candidate.solo);
  if (track?.muted || (soloTracks.length > 0 && !track?.solo)) return { enabled: false, volume: 0, pan: 0, effects: { filter: 1, reverb: 0, delay: 0, sidechain: 0 } };
  const fx = track?.fx ?? { filter: 1, reverb: 0, delay: 0, sidechain: 0 };
  return {
    enabled: true,
    volume: Math.max(0, Math.min(1, automationValue(track, 'volume', tick, track?.volume ?? 1))),
    pan: Math.max(-1, Math.min(1, automationValue(track, 'pan', tick, track?.pan ?? 0))),
    effects: {
      filter: Math.max(0, Math.min(1, automationValue(track, 'filter', tick, fx.filter))),
      reverb: Math.max(0, Math.min(1, automationValue(track, 'reverb', tick, fx.reverb))),
      delay: Math.max(0, Math.min(1, automationValue(track, 'delay', tick, fx.delay))),
      sidechain: Math.max(0, Math.min(1, automationValue(track, 'sidechain', tick, fx.sidechain))),
    },
  };
}

export function buildProjectAudioPlan(project: Project, requestedBars?: number): AudioEventPlan {
  const progressionBars = project.loop.enabled ? Math.ceil(project.loop.endTick / (4 * PPQ)) : 0;
  const bars = requestedBars ?? Math.max(8, progressionBars, project.arrangement.sections.reduce((total, section) => total + section.bars, 0));
  const beatSeconds = secondsPerBeat(project.musicalGrid.bpm);
  const totalBeats = bars * 4;
  const root = rootMidi(project.musicalGrid.key);
  const events: AudioEvent[] = [];
  const mix = {
    chord: mixFor(project, 'chord'), bass: mixFor(project, 'bass'), drum: mixFor(project, 'drum'),
    pad: mixFor(project, 'pad'), arp: mixFor(project, 'arp'), synth: mixFor(project, 'synth'), melody: mixFor(project, 'melody'), fx: mixFor(project, 'fx'),
    percussion: mixFor(project, 'percussion'), transition: mixFor(project, 'transition'),
  };
  const notesByRole = {
    chord: mergeChordPatternNotes(project, trackNotes(project, 'chord')),
    bass: trackNotes(project, 'bass'),
    drum: trackNotes(project, 'drum'),
    pad: trackNotes(project, 'pad'),
    arp: trackNotes(project, 'arp'),
    synth: trackNotes(project, 'synth'),
    percussion: trackNotes(project, 'percussion'),
    fx: trackNotes(project, 'fx'),
    transition: trackNotes(project, 'transition'),
  };
  const hasGeneratedHarmony = notesByRole.chord.length + notesByRole.bass.length + notesByRole.pad.length > 0;
  const hasExplicitFx = notesByRole.fx.length + notesByRole.transition.length > 0 || project.tracks.some((track) => (track.role === 'fx' || track.role === 'transition') && track.lanes.some((lane) => lane.blocks.some((block) => block.id.startsWith('placed-asset-'))));
  const progression = [0, 7, 9, 5];

  for (let bar = 0; bar < bars; bar += 1) {
    const chordRoot = root + progression[bar % progression.length]!;
    const barStart = bar * 4 * beatSeconds;
    const barTick = bar * 4 * PPQ;
    if (!hasGeneratedHarmony && (mix.chord.enabled || mix.pad.enabled)) {
      for (const interval of [0, 4, 7]) {
        const chordMix = mixFor(project, 'chord', barTick);
        const padMix = mixFor(project, 'pad', barTick);
        if (chordMix.enabled) events.push(tone(selected(project, 'chord', 'chord-bright-supersaw', 'chord', barTick), chordRoot + interval, barStart, 3.8 * beatSeconds, .035 * chordMix.volume, chordMix.pan + (interval === 4 ? -.16 : interval === 7 ? .16 : 0), chordMix.effects));
        if (padMix.enabled) events.push(tone(selected(project, 'pad', 'pad-pastel-air', 'pad', barTick), chordRoot + interval - 12, barStart, 3.9 * beatSeconds, .018 * padMix.volume, padMix.pan + (interval === 4 ? -.3 : .3), padMix.effects));
      }
    }
    for (let beat = 0; beat < 4; beat += 1) {
      const start = (bar * 4 + beat) * beatSeconds;
      const beatTick = (bar * 4 + beat) * PPQ;
      const bassMix = mixFor(project, 'bass', beatTick);
      if (!hasGeneratedHarmony && bassMix.enabled) events.push(tone(selected(project, 'bass', 'bass-round-sub', 'bass', beatTick), chordRoot - 24, start, .82 * beatSeconds, .12 * bassMix.volume, bassMix.pan, bassMix.effects));
      if (notesByRole.drum.length === 0 && mix.drum.enabled) {
        const drumAsset = selected(project, 'drum', 'drum-candy-kit', 'drum', beatTick);
        const body = .23 + drumAsset.brightness * .1;
        const common = { timbreId: drumAsset.id, waveform: drumAsset.waveform, brightness: drumAsset.brightness, character: drumAsset.character } as const;
        events.push({ kind: 'kick', startSeconds: start, durationSeconds: .18 + (1 - drumAsset.brightness) * .1, gain: body, pan: 0, ...common });
        if (beat === 1 || beat === 3) events.push({ kind: 'clap', startSeconds: start, durationSeconds: .1 + drumAsset.brightness * .08, gain: .11 + drumAsset.brightness * .08, pan: beat === 1 ? -.08 : .08, ...common });
        for (let half = 0; half < 2; half += 1) events.push({ kind: 'hat', startSeconds: start + half * beatSeconds / 2, durationSeconds: .025 + drumAsset.brightness * .045, gain: (half === 0 ? .035 : .026) + drumAsset.brightness * .018, pan: half === 0 ? -.18 : .18, ...common });
      }
    }
    if (!hasExplicitFx && (bar === 3 || bar === 7) && mix.fx.enabled) events.push({ kind: 'sparkle', startSeconds: barStart + 3.5 * beatSeconds, durationSeconds: .45, gain: .055 * mix.fx.volume, pan: mix.fx.pan + .25, timbreId: 'fx-sparkle-dust', brightness: .92, character: 'sparkling' });
  }

  const maxTick = bars * 4 * PPQ;
  const categoryByRole = { chord: 'chord', bass: 'bass', pad: 'pad', arp: 'arp', synth: 'synth' } as const;
  const fallbackByRole = { chord: 'chord-bright-supersaw', bass: 'bass-round-sub', pad: 'pad-pastel-air', arp: 'arp-pixel-drop', synth: 'synth-glass-pluck' } as const;
  for (const [role, notes] of Object.entries(notesByRole) as Array<[keyof typeof notesByRole, NoteEvent[]]>) {
    for (const note of notes.filter((candidate) => candidate.startTick < maxTick)) {
      const eventMix = mixFor(project, role, note.startTick);
      if (!eventMix.enabled) continue;
      const startSeconds = note.startTick / PPQ * beatSeconds;
      if (role === 'drum' || role === 'percussion') {
        const asset = selected(project, role === 'drum' ? 'drum' : 'percussion', role === 'drum' ? 'drum-candy-kit' : 'perc-tiny-pop', role, note.startTick);
        const kind = note.pitch === 36 ? 'kick' : note.pitch === 38 ? 'clap' : note.pitch >= 41 && note.pitch <= 50 ? 'tom' : 'hat';
        events.push({ kind, startSeconds, durationSeconds: Math.min(note.durationTick / PPQ * beatSeconds, kind === 'kick' ? .18 + (1 - asset.brightness) * .1 : kind === 'tom' ? .13 + (1 - asset.brightness) * .11 : kind === 'clap' ? .09 + asset.brightness * .08 : .025 + asset.brightness * .05), gain: note.velocity / 127 * (kind === 'kick' ? .3 : kind === 'tom' ? .22 : .13) * eventMix.volume, pan: eventMix.pan + (kind === 'hat' ? .12 : 0), timbreId: asset.id, waveform: asset.waveform, brightness: kind === 'tom' ? Math.max(.12, Math.min(.98, (note.pitch - 36) / 16 * .55 + asset.brightness * .45)) : asset.brightness, character: asset.character });
      } else if (role === 'fx' || role === 'transition') {
        const asset = selected(project, role, role === 'fx' ? 'fx-sparkle-dust' : 'transition-soft-rise', role, note.startTick);
        const kind = note.pitch <= 40 ? 'kick' : note.pitch >= 80 ? 'sparkle' : 'sweep';
        const direction = /down|fall|drop|stop/i.test(asset.id) ? 'down' as const : 'up' as const;
        events.push({ kind, startSeconds, durationSeconds: Math.max(.04, note.durationTick / PPQ * beatSeconds), gain: note.velocity / 127 * (kind === 'kick' ? .34 : kind === 'sweep' ? .18 : .13) * eventMix.volume, pan: eventMix.pan + (kind === 'sparkle' ? .2 : 0), timbreId: asset.id, waveform: asset.waveform, brightness: asset.brightness, character: asset.character, ...(kind === 'sweep' ? { direction } : {}) });
      } else {
        const category = categoryByRole[role];
        const asset = selected(project, category, fallbackByRole[role], role, note.startTick);
        const roleGain = role === 'bass' ? .11 : role === 'chord' ? .034 : role === 'pad' ? .018 : .028;
        events.push(tone(asset, note.pitch, startSeconds, note.durationTick / PPQ * beatSeconds, note.velocity / 127 * roleGain * eventMix.volume, eventMix.pan + (role === 'arp' ? .16 : 0), eventMix.effects));
      }
    }
  }

  for (const track of project.tracks.filter((candidate) => candidate.role === 'fx' || candidate.role === 'transition')) {
    for (const block of track.lanes.flatMap((lane) => lane.blocks).filter((candidate) => candidate.id.startsWith('placed-asset-') && candidate.startTick < maxTick)) {
      const asset = findBuiltInAudioAsset(block.assetId);
      if (!asset || (asset.category !== 'fx' && asset.category !== 'transition')) continue;
      const preview = buildAssetAuditionPlan(asset);
      const blockStart = block.startTick / PPQ * beatSeconds;
      const blockEnd = (block.startTick + block.durationTick) / PPQ * beatSeconds;
      const alignEnd = /rise|riser|reverse|wash|swell|lift|launch/i.test(asset.id);
      const offset = alignEnd ? Math.max(blockStart, blockEnd - preview.durationSeconds) : blockStart;
      events.push(...preview.events.map((event) => ({ ...event, startSeconds: event.startSeconds + offset })));
    }
  }

  const existingMelody = projectMelodyNotes(project).filter((note) => note.startTick < bars * 4 * PPQ);
  if (existingMelody.length > 0 && mix.melody.enabled) {
    for (const note of existingMelody) {
      const melodyMix = mixFor(project, 'melody', note.startTick);
      if (melodyMix.enabled) events.push(tone(selected(project, 'lead', 'lead-pearl', 'melody', note.startTick), note.pitch, note.startTick / PPQ * beatSeconds, note.durationTick / PPQ * beatSeconds, note.velocity / 127 * .11 * melodyMix.volume, melodyMix.pan, melodyMix.effects));
    }
  } else if (mix.melody.enabled) {
    const melodyPattern = [0, 4, 7, 11, 9, 7, 4, 2, 0, 2, 4, 7, 9, 11, 7, 4];
    for (let index = 0; index < totalBeats * 2; index += 1) {
      const degree = melodyPattern[index % melodyPattern.length]!;
      const melodyMix = mixFor(project, 'melody', Math.round(index * PPQ / 2));
      if (!melodyMix.enabled) continue;
      const noteTick = Math.round(index * PPQ / 2);
      events.push(tone(selected(project, 'lead', 'lead-pearl', 'melody', noteTick), root + 12 + degree, index * beatSeconds / 2, beatSeconds * .38, .07 * melodyMix.volume, melodyMix.pan + (index % 2 === 0 ? -.08 : .08), melodyMix.effects));
      if (index % 2 === 1) {
        const arpMix = mixFor(project, 'arp', Math.round(index * PPQ / 2));
        if (arpMix.enabled) events.push(tone(selected(project, 'arp', 'arp-pixel-drop', 'arp', noteTick), root + 24 + progression[Math.floor(index / 8) % progression.length]! + (index % 3) * 4, index * beatSeconds / 2, beatSeconds * .18, .025 * arpMix.volume, arpMix.pan + .2, arpMix.effects));
      }
    }
  }
  const durationSeconds = totalBeats * beatSeconds;
  const boundedEvents = events
    .filter((event) => event.startSeconds < durationSeconds)
    .map((event) => ({ ...event, durationSeconds: Math.max(.005, Math.min(event.durationSeconds, durationSeconds - event.startSeconds)) }))
    .sort((left, right) => left.startSeconds - right.startSeconds);
  return { bpm: project.musicalGrid.bpm, durationSeconds, events: boundedEvents };
}

/** Build the one-shot plan used by the DAW transport, optionally sliced at a PPQ tick. */
export function buildProjectPlaybackPlan(project: Project, bars?: number, startTick = 0): AudioEventPlan {
  const plan = buildProjectAudioPlan(project, bars);
  const boundedStartTick = Math.max(0, startTick);
  if (boundedStartTick === 0) return plan;
  const offsetSeconds = boundedStartTick / PPQ * secondsPerBeat(project.musicalGrid.bpm);
  const durationSeconds = Math.max(0, plan.durationSeconds - offsetSeconds);
  const events = plan.events.flatMap((event): AudioEvent[] => {
    const eventEnd = event.startSeconds + event.durationSeconds;
    if (eventEnd <= offsetSeconds || event.startSeconds >= plan.durationSeconds) return [];
    const clippedStart = Math.max(event.startSeconds, offsetSeconds);
    return [{
      ...event,
      startSeconds: clippedStart - offsetSeconds,
      durationSeconds: Math.max(.005, Math.min(eventEnd, plan.durationSeconds) - clippedStart),
    }];
  });
  return { ...plan, durationSeconds, events };
}

/** Audition only the selected piano-roll note blocks, normalized to start now. */
export function buildNoteBlockAuditionPlan(project: Project, trackId: string, noteIds: string[]): AudioEventPlan {
  const track = project.tracks.find((candidate) => candidate.id === trackId);
  if (!track) throw new Error('選択ブロックのトラックが見つかりません。');
  const selectedIds = new Set(noteIds);
  const notes = track.lanes.flatMap((lane) => lane.notes).filter((note) => selectedIds.has(note.id));
  if (notes.length === 0) throw new Error('再生するブロックを選択してください。');

  const beatSeconds = secondsPerBeat(project.musicalGrid.bpm);
  const firstTick = Math.min(...notes.map((note) => note.startTick));
  const fallbackByRole: Partial<Record<Project['tracks'][number]['role'], { category: BuiltInAudioAsset['category']; assetId: string }>> = {
    melody: { category: 'lead', assetId: 'lead-pearl' },
    chord: { category: 'chord', assetId: 'chord-bright-supersaw' },
    drum: { category: 'drum', assetId: 'drum-candy-kit' },
    bass: { category: 'bass', assetId: 'bass-round-sub' },
    lead: { category: 'lead', assetId: 'lead-pearl' },
    synth: { category: 'synth', assetId: 'synth-glass-pluck' },
    pad: { category: 'pad', assetId: 'pad-pastel-air' },
    arp: { category: 'arp', assetId: 'arp-pixel-drop' },
    percussion: { category: 'percussion', assetId: 'perc-tiny-pop' },
    fx: { category: 'fx', assetId: 'fx-sparkle-dust' },
    transition: { category: 'transition', assetId: 'transition-soft-rise' },
  };
  const fallback = fallbackByRole[track.role] ?? fallbackByRole.melody!;
  const asset = selected(project, fallback.category, fallback.assetId, track.role);
  const events: AudioEvent[] = [];
  for (const note of notes) {
    const startSeconds = (note.startTick - firstTick) / PPQ * beatSeconds;
    const durationSeconds = Math.max(.04, note.durationTick / PPQ * beatSeconds);
    const gain = note.velocity / 127 * Math.max(.04, Math.min(.14, track.volume * .14));
    if (track.role === 'drum' || track.role === 'percussion') {
      const kind = note.pitch <= 36 ? 'kick' : note.pitch <= 40 ? 'clap' : note.pitch <= 48 ? 'tom' : 'hat';
      events.push({ kind, startSeconds, durationSeconds: Math.min(durationSeconds, kind === 'kick' ? .22 : kind === 'tom' ? .2 : kind === 'clap' ? .16 : .07), gain, pan: track.pan, timbreId: asset.id, waveform: asset.waveform, brightness: kind === 'tom' ? Math.max(.12, Math.min(.9, (note.pitch - 36) / 16)) : asset.brightness, character: asset.character });
    } else if (track.role === 'fx' || track.role === 'transition') {
      const kind = note.pitch <= 40 ? 'kick' : note.pitch >= 80 ? 'sparkle' : 'sweep';
      const direction = /down|fall|drop|stop/i.test(asset.id) ? 'down' as const : 'up' as const;
      events.push({ kind, startSeconds, durationSeconds, gain: gain * (kind === 'kick' ? 2.5 : kind === 'sweep' ? 1.45 : 1), pan: track.pan + (kind === 'sparkle' ? .2 : 0), timbreId: asset.id, waveform: asset.waveform, brightness: asset.brightness, character: asset.character, ...(kind === 'sweep' ? { direction } : {}) });
    } else {
      events.push(tone(asset, note.pitch, startSeconds, durationSeconds, gain, track.pan, track.fx));
    }
  }
  const durationSeconds = Math.max(...events.map((event) => event.startSeconds + event.durationSeconds + (event.kind === 'tone' ? event.releaseSeconds : 0)), .1) + .04;
  return { bpm: project.musicalGrid.bpm, durationSeconds, events: events.sort((left, right) => left.startSeconds - right.startSeconds) };
}

export function buildAssetAuditionPlan(asset: BuiltInAudioAsset): AudioEventPlan {
  const bpm = 150;
  const beat = secondsPerBeat(bpm);
  const events: AudioEvent[] = [];
  const hash = [...asset.id].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 17);
  const variation = (hash % 29) / 28;
  const previewAsset = asset.synthesis ? { ...asset, synthesis: { ...asset.synthesis, releaseSeconds: Math.min(.65, asset.synthesis.releaseSeconds) } } : asset;
  const percussive = (kind: Exclude<AudioEvent['kind'], 'tone'>, startSeconds: number, durationSeconds: number, gain: number, pan: number, direction?: 'up' | 'down'): AudioEvent => ({ kind, startSeconds, durationSeconds, gain, pan, timbreId: asset.id, waveform: asset.waveform, brightness: asset.brightness, character: asset.character, ...(direction ? { direction } : {}) });
  const motifs: Partial<Record<BuiltInAudioAsset['category'], number[]>> = {
    bass: [38, 38, 45, 43],
    lead: [67, 71, 74, 71],
    synth: [62, 66, 69, 66],
    arp: [62, 66, 69, 74, 69, 66],
  };
  const pitches = motifs[asset.category] ?? [62, 66, 69, 73];
  if (asset.category === 'drum') {
    const patterns = [
      ['kick', 'hat', 'clap', 'hat', 'kick', 'hat', 'clap', 'hat'],
      ['kick', 'hat', 'snare', 'kick', 'hat', 'kick', 'snare', 'hat'],
      ['kick', 'hat', 'kick', 'clap', 'kick', 'hat', 'kick', 'clap'],
      ['kick', 'hat', 'hat', 'snare', 'kick', 'kick', 'hat', 'snare'],
    ] as const;
    const pattern = patterns[hash % patterns.length]!;
    for (let index = 0; index < 8; index += 1) {
      const start = index * beat / 2;
      const kind = pattern[index]!;
      const duration = kind === 'kick' ? .16 + (1 - asset.brightness) * .14 + variation * .025 : kind === 'hat' ? .025 + asset.brightness * .065 + variation * .012 : .09 + asset.brightness * .07 + variation * .018;
      const gain = kind === 'kick' ? .22 + asset.brightness * .1 + variation * .025 : .11 + asset.brightness * .07 + variation * .018;
      const spread = .08 + variation * .2;
      events.push(percussive(kind, start, duration, gain, kind === 'kick' ? 0 : index % 2 ? spread : -spread));
    }
  } else if (asset.category === 'percussion') {
    const patterns = [
      ['hat', 'clap', 'hat', 'snare', 'hat', 'clap', 'hat', 'snare'],
      ['snare', 'hat', 'hat', 'clap', 'snare', 'hat', 'clap', 'hat'],
      ['hat', 'hat', 'clap', 'hat', 'hat', 'snare', 'hat', 'clap'],
    ] as const;
    const pattern = patterns[hash % patterns.length]!;
    for (let index = 0; index < 8; index += 1) events.push(percussive(pattern[index]!, index * beat / 2, pattern[index] === 'hat' ? .055 : .1, .1 + asset.brightness * .05, index % 2 ? .34 : -.34));
  } else if (asset.category === 'fx') {
    const descending = /fall|drop|boom|brake|down/i.test(asset.id);
    const impact = /impact|boom|pop|burst|zap|slam|crash|shatter/i.test(asset.id);
    const long = /wash|trail|reverse|suction|whoosh/i.test(asset.id);
    const fragmented = /stutter|spray|alarm|gate|shatter/i.test(asset.id);
    const duration = long ? 2.15 + variation * .22 : impact ? .72 + variation * .3 : 1.25 + variation * .48;
    events.push(percussive(impact && !/impact|boom/i.test(asset.id) ? 'sparkle' : 'sweep', 0, duration, .12 + asset.brightness * .08, variation * .24 - .12, descending ? 'down' : 'up'));
    if (fragmented) {
      const count = /stutter|spray/i.test(asset.id) ? 8 : 4;
      for (let index = 0; index < count; index += 1) events.push(percussive(index % 3 === 2 ? 'clap' : 'sparkle', .18 + index * Math.max(.07, (duration - .34) / count), .045 + index % 2 * .025, .07 + asset.brightness * .035, index % 2 ? .34 : -.34, index % 2 ? 'down' : 'up'));
    }
    if (impact) {
      const hitAt = Math.max(.18, duration - .16);
      events.push(percussive(/boom|impact|drop|slam|crash/i.test(asset.id) ? 'kick' : 'clap', hitAt, .2 + (1 - asset.brightness) * .12, .22 + variation * .08, 0));
      if (/impact|burst|crash|shatter/i.test(asset.id)) events.push(percussive('sparkle', hitAt + .015, .34, .11 + asset.brightness * .05, .22, 'up'));
    }
  } else if (asset.category === 'transition') {
    const descending = /down|fall|stop/i.test(asset.id);
    const duration = Math.min(2.32, (/short/i.test(asset.id) ? .92 : /long|wash|riser/i.test(asset.id) ? 2.18 : asset.character === 'tiny' ? 1.35 : asset.character === 'soft' ? 2.05 : 1.72) + variation * .26);
    const pan = /prism|star/i.test(asset.id) ? -.2 + variation * .4 : variation * .14 - .07;
    events.push(percussive('sweep', 0, duration, .12 + asset.brightness * .08, pan, descending ? 'down' : 'up'));
    if (/double-swell/i.test(asset.id)) events.push(percussive('sweep', duration * .42, duration * .58, .1 + asset.brightness * .06, -pan, 'up'));
    if (/glitch|stutter|spiral/i.test(asset.id)) for (let index = 0; index < 6; index += 1) events.push(percussive('sparkle', duration * .28 + index * duration * .1, .06, .075 + index * .008, index % 2 ? .3 : -.3, 'up'));
    if (/impact|soda|star|launch|crash|reverse-cymbal/i.test(asset.id)) {
      const hitAt = Math.max(.2, duration - .17);
      const heavy = /impact|crash/i.test(asset.id);
      events.push(percussive(heavy ? 'kick' : 'sparkle', hitAt, heavy ? .28 : .22, heavy ? .3 : .16, heavy ? 0 : .26, 'up'));
      if (heavy) events.push(percussive('clap', hitAt + .012, .16, .16, -.12));
    }
  } else if (asset.category === 'chord' || asset.category === 'pad') {
    for (const pitch of pitches) events.push(tone(previewAsset, pitch, 0, 1.7, .06, (pitch - 68) / 20));
  } else {
    for (const [index, pitch] of pitches.entries()) events.push(tone(previewAsset, pitch, index * beat / 2, beat * (asset.category === 'arp' ? .3 : .42), asset.category === 'bass' ? .13 : .09, index % 2 ? .15 : -.15));
  }
  const eventEnd = Math.max(...events.map((event) => event.startSeconds + event.durationSeconds + (event.kind === 'tone' ? event.releaseSeconds : 0)), .5);
  return { bpm, durationSeconds: Number((eventEnd + .08).toFixed(3)), events };
}

/** Dedicated user-gesture preview: a pad sounds now with the selected chord timbre. */
export function buildChordPadAuditionPlan(project: Project, padId: string): AudioEventPlan {
  if (!chordPadById(project.musicalGrid.key, padId)) throw new Error(`Unknown chord pad: ${padId}`);
  const preview = structuredClone(project);
  const lane = preview.tracks.find((track) => track.role === 'chord')?.lanes.find((candidate) => candidate.role === 'main');
  if (!lane) throw new Error('Chord lane is missing.');
  lane.blocks = [createChordPatternBlock('chord-pad-audition', 0, padId, 'hold')];
  const asset = selected(project, 'chord', 'chord-bright-supersaw');
  const beatSeconds = secondsPerBeat(project.musicalGrid.bpm);
  const notes = materializeChordPatternNotes(preview).filter((note) => note.startTick === 0);
  const durationSeconds = Math.min(1.6, beatSeconds * 2.5);
  const events = notes.map((note, index) => tone(asset, note.pitch, 0, durationSeconds, note.velocity / 127 * .065, (index - (notes.length - 1) / 2) * .12));
  return { bpm: project.musicalGrid.bpm, durationSeconds: Math.min(2.5, durationSeconds + (asset.synthesis?.releaseSeconds ?? .22)), events };
}

/** Four-bar role preview using the selected phrase's real chord identity and track timbres. */
export function buildRolePatternAuditionPlan(project: Project, role: RolePatternRole, patternId: string, phraseIndex: number): AudioEventPlan {
  const phraseStart = phraseIndex * CHORD_PROGRESSION_TICKS;
  const phraseEnd = phraseStart + CHORD_PROGRESSION_TICKS;
  const generated = generateRolePatternNotes(project, role, patternId, phraseIndex);
  if (role !== 'drum' && generated.length === 0) throw new Error('選択フレーズへ先にコードを配置してください。');
  const preview = structuredClone(project);
  for (const track of preview.tracks) {
    track.muted = track.role !== 'chord' && track.role !== role;
    for (const lane of track.lanes) {
      lane.notes = [];
      lane.blocks = [];
      lane.audioClips = [];
    }
  }
  const sourceChordBlocks = project.tracks
    .filter((track) => track.role === 'chord')
    .flatMap((track) => track.lanes.flatMap((lane) => lane.blocks))
    .filter((block) => parseChordPatternAssetId(block.assetId) && block.startTick >= phraseStart && block.startTick < phraseEnd);
  const chordLane = preview.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main');
  if (chordLane) chordLane.blocks = sourceChordBlocks.map((block) => ({ ...block, startTick: block.startTick - phraseStart }));
  const roleLane = preview.tracks.find((track) => track.role === role)?.lanes.find((lane) => lane.role === 'main');
  if (!roleLane) throw new Error(`${role} Main laneが見つかりません。`);
  roleLane.notes = generated.map((event) => ({ ...event, startTick: event.startTick - phraseStart }));
  preview.loop = { enabled: false, startTick: 0, endTick: CHORD_PROGRESSION_TICKS };
  return buildProjectAudioPlan(preview, 4);
}
