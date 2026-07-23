import { PPQ } from './types';
import type { ArrangementSection, NoteEvent, Project } from './types';
import type { AccompanimentVariant } from './intent-refinement';

export interface AccompanimentLaneDraft {
  trackId: string;
  laneId: string;
  notes: NoteEvent[];
}

export interface AccompanimentDraft {
  lanes: AccompanimentLaneDraft[];
  assetIds: string[];
  intentTrace: string[];
}

const ROOT_PITCH_CLASSES: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11] as const;
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10] as const;
const DEFAULT_PROGRESSION = [0, 4, 5, 3] as const;

function keyFacts(key: string): { rootPitchClass: number; minor: boolean; scale: readonly number[] } {
  const [name = 'D', quality = 'major'] = key.trim().split(/\s+/);
  const minor = quality.toLowerCase().startsWith('min');
  return { rootPitchClass: ROOT_PITCH_CLASSES[name] ?? 2, minor, scale: minor ? MINOR_SCALE : MAJOR_SCALE };
}

function melodyNotes(project: Project): NoteEvent[] {
  const track = project.tracks.find((candidate) => candidate.id === project.melody.trackId);
  return track?.lanes.find((candidate) => candidate.id === project.melody.laneId)?.notes ?? [];
}

function sectionAtBar(sections: ArrangementSection[], bar: number): ArrangementSection {
  return sections.find((section) => bar >= section.startBar && bar < section.startBar + section.bars) ?? sections.at(-1)!;
}

function note(id: string, pitch: number, startTick: number, durationTick: number, velocity: number): NoteEvent {
  return { id, pitch: Math.max(0, Math.min(127, Math.round(pitch))), startTick: Math.max(0, Math.round(startTick)), durationTick: Math.max(1, Math.round(durationTick)), velocity: Math.max(1, Math.min(127, Math.round(velocity))), source: 'generated', confidence: null, userEdited: false, lockPitch: false, lockTiming: false };
}

function chordForBar(project: Project, bar: number, melody: NoteEvent[]): { rootMidi: number; pitches: [number, number, number]; degree: number } {
  const facts = keyFacts(project.musicalGrid.key);
  const barStart = bar * 4 * PPQ;
  const barEnd = barStart + 4 * PPQ;
  const notes = melody.filter((candidate) => candidate.startTick < barEnd && candidate.startTick + candidate.durationTick > barStart);
  const candidates = facts.scale.slice(0, 6).map((offset, degree) => {
    const thirdOffset = facts.scale[(degree + 2) % 7]! + (degree + 2 >= 7 ? 12 : 0);
    const fifthOffset = facts.scale[(degree + 4) % 7]! + (degree + 4 >= 7 ? 12 : 0);
    const rootPc = (facts.rootPitchClass + offset) % 12;
    const chordPcs = new Set([rootPc, (facts.rootPitchClass + thirdOffset) % 12, (facts.rootPitchClass + fifthOffset) % 12]);
    const melodyScore = notes.reduce((score, melodyNote) => score + (chordPcs.has(melodyNote.pitch % 12) ? 4 : -1) * (melodyNote.velocity / 127), 0);
    const defaultDegree = DEFAULT_PROGRESSION[bar % DEFAULT_PROGRESSION.length];
    const continuityScore = degree === defaultDegree ? 1.25 : 0;
    return { degree, offset, thirdOffset, fifthOffset, score: melodyScore + continuityScore };
  });
  const chosen = candidates.sort((left, right) => right.score - left.score || left.degree - right.degree)[0]!;
  const rootMidi = 48 + facts.rootPitchClass + chosen.offset;
  return { rootMidi, pitches: [rootMidi, 48 + facts.rootPitchClass + chosen.thirdOffset, 48 + facts.rootPitchClass + chosen.fifthOffset], degree: chosen.degree };
}

export function createStarterMelody(project: Project): NoteEvent[] {
  const facts = keyFacts(project.musicalGrid.key);
  const root = 72 + facts.rootPitchClass;
  const pattern = [0, 2, 4, 5, 4, 2, 1, 0, 2, 4, 6, 5, 4, 2, 1, 0];
  return pattern.map((degree, index) => {
    const scaleOffset = facts.scale[degree]!;
    return { ...note(`starter-melody-${index + 1}`, root + scaleOffset, index * PPQ / 2, PPQ * (index % 4 === 3 ? 1 : .42), 88 + index % 4 * 5), source: 'manual' as const, lockPitch: true, lockTiming: true };
  });
}

export function generateAccompaniment(project: Project, variant: AccompanimentVariant = 'sparkle'): AccompanimentDraft {
  const melody = melodyNotes(project);
  if (melody.length === 0) throw new Error('A melody is required before generating accompaniment.');
  const totalBars = project.arrangement.sections.reduce((total, section) => total + section.bars, 0);
  const lanes = new Map<string, AccompanimentLaneDraft>();
  const lane = (trackRole: string, laneRole: 'main' | 'sub'): AccompanimentLaneDraft => {
    const key = `${trackRole}/${laneRole}`;
    let value = lanes.get(key);
    if (!value) {
      value = { trackId: `track-${trackRole}`, laneId: `lane-${trackRole}-${laneRole}`, notes: [] };
      lanes.set(key, value);
    }
    return value;
  };
  const trace = new Set<string>(['melody:pitch-locked', 'melody:timing-locked', `key:${project.musicalGrid.key}`, `bpm:${project.musicalGrid.bpm}`, `variant:${variant}`]);

  for (let bar = 0; bar < totalBars; bar += 1) {
    const section = sectionAtBar(project.arrangement.sections, bar);
    const chord = chordForBar(project, bar, melody);
    const startTick = bar * 4 * PPQ;
    const energy = Math.max(.1, Math.min(1, section.energyStart + (section.energyEnd - section.energyStart) * ((bar - section.startBar + .5) / section.bars)));
    const velocityScale = variant === 'driving' ? 1.12 : variant === 'soft' ? .76 : 1;
    const baseVelocity = (48 + energy * 50) * velocityScale;
    trace.add(`section:${section.role}`);
    trace.add(`bar:${bar + 1}:degree-${chord.degree + 1}`);

    for (const [index, pitch] of chord.pitches.entries()) {
      lane('chord', 'main').notes.push(note(`acc-chord-main-${bar}-${index}`, pitch, startTick, 4 * PPQ, baseVelocity * .88));
      lane('pad', 'main').notes.push(note(`acc-pad-main-${bar}-${index}`, pitch + 12, startTick, 4 * PPQ, baseVelocity * .62));
      if (section.role === 'drop') lane('chord', 'sub').notes.push(note(`acc-chord-sub-${bar}-${index}`, pitch + 12, startTick, 4 * PPQ, baseVelocity * .58));
    }
    for (let beat = 0; beat < 4; beat += 1) {
      const beatStart = startTick + beat * PPQ;
      if (variant !== 'soft' || beat % 2 === 0) lane('bass', 'main').notes.push(note(`acc-bass-main-${bar}-${beat}`, chord.rootMidi - 12, beatStart, PPQ * .82, baseVelocity));
      if (section.role === 'drop') lane('bass', 'sub').notes.push(note(`acc-bass-sub-${bar}-${beat}`, chord.rootMidi - 24, beatStart, PPQ * .72, baseVelocity * .7));
      lane('drum', 'main').notes.push(note(`acc-kick-${bar}-${beat}`, beat % 2 === 0 ? 36 : 38, beatStart, PPQ / 4, baseVelocity * (beat % 2 === 0 ? 1.05 : .9)));
      const hatSteps = variant === 'driving' ? 4 : variant === 'soft' ? 1 : 2;
      for (let half = 0; half < hatSteps; half += 1) lane('drum', 'sub').notes.push(note(`acc-hat-${bar}-${beat}-${half}`, 42, beatStart + half * PPQ / hatSteps, PPQ / 8, baseVelocity * (half === 0 ? .52 : .4)));
    }
    if (variant !== 'soft' && (section.role === 'build' || section.role === 'drop' || variant === 'sparkle' && section.role === 'verse')) {
      for (let step = 0; step < 8; step += 1) {
        const pitch = chord.pitches[step % chord.pitches.length]! + 24;
        lane('arp', 'main').notes.push(note(`acc-arp-${bar}-${step}`, pitch, startTick + step * PPQ / 2, PPQ * .32, baseVelocity * .58));
      }
    }
    if (section.role === 'drop' && variant !== 'soft') {
      for (let beat = 0; beat < 4; beat += 1) lane('synth', 'sub').notes.push(note(`acc-synth-${bar}-${beat}`, chord.pitches[(beat + 1) % 3]! + 12, startTick + beat * PPQ + PPQ / 2, PPQ * .35, baseVelocity * .55));
    }
  }

  return {
    lanes: [...lanes.values()],
    assetIds: ['chord-soft-supersaw', 'drum-candy-kit', 'bass-round-sub', 'synth-glass-pluck', 'pad-pastel-air', 'arp-pixel-drop'],
    intentTrace: [...trace],
  };
}
