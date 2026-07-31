import { createProject, PPQ } from '../music';
import type { ArrangementSection, NoteEvent, Project, SectionRole, Track, TrackRole } from '../music';

export const KASANE_ROLES = ['lead', 'harmony', 'bass', 'rhythm', 'texture'] as const;
export type KasaneRole = typeof KASANE_ROLES[number];

export const KASANE_SCENES = [
  { id: 'intro', label: 'Intro', cue: 'FOCUS', startBar: 0, bars: 4, energy: .28 },
  { id: 'lift', label: 'Lift', cue: 'OPEN', startBar: 4, bars: 4, energy: .58 },
  { id: 'drop', label: 'Drop', cue: 'ARRIVE', startBar: 8, bars: 4, energy: .96 },
  { id: 'air', label: 'Air', cue: 'BREATHE', startBar: 12, bars: 4, energy: .34 },
  { id: 'final', label: 'Final', cue: 'ANSWER', startBar: 16, bars: 4, energy: .88 },
] as const;
export type KasaneSceneId = typeof KASANE_SCENES[number]['id'];

export const KASANE_MOVES = [
  { id: 'lift', label: 'LIFT', description: 'top note、bass octave、transitionを上げる。' },
  { id: 'strip', label: 'STRIP', description: 'rhythmとtextureを引き、余白を作る。' },
  { id: 'bounce', label: 'BOUNCE', description: 'bassとrhythmを裏拍へ組み替える。' },
  { id: 'answer', label: 'ANSWER', description: 'scene後半へ短いlead responseを置く。' },
  { id: 'break', label: 'BREAK', description: 'transientを減らし、次の頭へ空白を作る。' },
] as const;
export type KasaneMoveId = typeof KASANE_MOVES[number]['id'];

export interface HeroKitRole {
  name: string;
  instrumentId: string;
  pattern: string;
  color: string;
}

export interface HeroKit {
  id: 'candy-skyline' | 'prism-rush' | 'moon-soda';
  name: string;
  edition: string;
  bpm: number;
  key: string;
  rootMidi: number;
  mode: 'major' | 'minor';
  promise: string;
  traits: readonly string[];
  accent: string;
  progression: readonly number[];
  leadMotif: readonly number[];
  roles: Record<KasaneRole, HeroKitRole>;
}

export const HERO_KITS: readonly HeroKit[] = [
  {
    id: 'candy-skyline', name: 'Candy Skyline', edition: 'SKY / 01', bpm: 142, key: 'D major', rootMidi: 62, mode: 'major',
    promise: '弾けるglass leadとelasticな裏拍。明るいのに甘すぎない。', traits: ['sparkle', 'elastic', 'wide'], accent: '#ffd56a',
    progression: [0, 7, 9, 5], leadMotif: [0, 4, 7, 11, 9, 7, 4, 2],
    roles: {
      lead: { name: 'Glass ribbon', instrumentId: 'lead-ribbon-pluck', pattern: 'ribbon motif', color: '#f7a8cf' },
      harmony: { name: 'Open candy', instrumentId: 'chord-glass-pluck', pattern: 'open stack', color: '#f6cf84' },
      bass: { name: 'Bubble bounce', instrumentId: 'bass-bubble-pluck', pattern: 'elastic offbeat', color: '#9de4ca' },
      rhythm: { name: 'Candy kit', instrumentId: 'drum-candy-kit', pattern: 'soft snap', color: '#83d5ee' },
      texture: { name: 'Pastel air', instrumentId: 'pad-pastel-air', pattern: 'air + sparkle', color: '#b9c9f4' },
    },
  },
  {
    id: 'prism-rush', name: 'Prism Rush', edition: 'CORE / 02', bpm: 176, key: 'F# minor', rootMidi: 66, mode: 'minor',
    promise: '硬い輪郭と高速の推進力。細いleadが大きなstackを切り裂く。', traits: ['sharp', 'fast', 'kinetic'], accent: '#ff8e76',
    progression: [0, 8, 3, 10], leadMotif: [0, 3, 7, 10, 12, 10, 7, 3],
    roles: {
      lead: { name: 'Needle laser', instrumentId: 'lead-laser-ribbon', pattern: 'needle run', color: '#ff8eaa' },
      harmony: { name: 'Hyper prism', instrumentId: 'chord-hyper-prism', pattern: 'power stack', color: '#ffb26f' },
      bass: { name: 'Core drive', instrumentId: 'bass-core-drive', pattern: 'drive octave', color: '#72dfb0' },
      rhythm: { name: 'Metallic core', instrumentId: 'drum-metallic-core', pattern: 'rush + fill', color: '#5fd2f2' },
      texture: { name: 'Sunrise saw', instrumentId: 'pad-sunrise-saw', pattern: 'prism shard', color: '#cfaff6' },
    },
  },
  {
    id: 'moon-soda', name: 'Moon Soda', edition: 'NIGHT / 03', bpm: 128, key: 'A major', rootMidi: 69, mode: 'major',
    promise: 'music-boxの粒と丸いsub。静かな余白から少しだけ胸が上がる。', traits: ['soft', 'floating', 'bittersweet'], accent: '#8fe7e1',
    progression: [0, 7, 9, 5], leadMotif: [0, 4, 7, 9, 7, 4, 2, 4],
    roles: {
      lead: { name: 'Celesta star', instrumentId: 'lead-celesta-star', pattern: 'music-box answer', color: '#d5b7f5' },
      harmony: { name: 'Moon sus', instrumentId: 'chord-moon-sus', pattern: 'suspended bloom', color: '#f1c7a8' },
      bass: { name: 'Round sub', instrumentId: 'bass-round-sub', pattern: 'round pulse', color: '#a7dfc6' },
      rhythm: { name: 'Pillow pop', instrumentId: 'drum-pillow-pop', pattern: 'soft two-step', color: '#9bd8e6' },
      texture: { name: 'Night veil', instrumentId: 'pad-night-veil', pattern: 'reverse bloom', color: '#aeb9e9' },
    },
  },
] as const;

type CommittedMoves = Record<KasaneSceneId, KasaneMoveId | null>;

export interface CompositionState {
  kitId: HeroKit['id'];
  selectedSceneId: KasaneSceneId;
  previewSceneId: KasaneSceneId | null;
  previewMoveId: KasaneMoveId | null;
  committedMoves: CommittedMoves;
  revision: number;
}

export interface CompositionHistory {
  past: CompositionState[];
  present: CompositionState;
}

function emptyCommittedMoves(): CommittedMoves {
  return { intro: null, lift: null, drop: null, air: null, final: null };
}

function heroKit(kitId: string): HeroKit {
  const kit = HERO_KITS.find((candidate) => candidate.id === kitId);
  if (!kit) throw new Error(`Unknown Hero Kit: ${kitId}`);
  return kit;
}

function scene(sceneId: string) {
  const value = KASANE_SCENES.find((candidate) => candidate.id === sceneId);
  if (!value) throw new Error(`Unknown scene: ${sceneId}`);
  return value;
}

function move(moveId: string) {
  const value = KASANE_MOVES.find((candidate) => candidate.id === moveId);
  if (!value) throw new Error(`Unknown move: ${moveId}`);
  return value;
}

export function createCompositionState(kitId: HeroKit['id']): CompositionState {
  heroKit(kitId);
  return {
    kitId,
    selectedSceneId: 'drop',
    previewSceneId: null,
    previewMoveId: null,
    committedMoves: emptyCommittedMoves(),
    revision: 0,
  };
}

export function switchHeroKit(state: CompositionState, kitId: HeroKit['id']): CompositionState {
  heroKit(kitId);
  if (kitId === state.kitId) return state;
  return createCompositionState(kitId);
}

export function selectScene(state: CompositionState, sceneId: KasaneSceneId): CompositionState {
  scene(sceneId);
  if (state.selectedSceneId === sceneId && state.previewMoveId === null) return state;
  return { ...state, selectedSceneId: sceneId, previewSceneId: null, previewMoveId: null };
}

export function previewSceneMove(state: CompositionState, sceneId: KasaneSceneId, moveId: KasaneMoveId): CompositionState {
  scene(sceneId);
  move(moveId);
  if (state.committedMoves[sceneId] === moveId) return state;
  return { ...state, previewSceneId: sceneId, previewMoveId: moveId };
}

export function rejectSceneMove(state: CompositionState): CompositionState {
  if (!state.previewMoveId) return state;
  return { ...state, previewSceneId: null, previewMoveId: null };
}

export function commitSceneMove(state: CompositionState): CompositionState {
  if (!state.previewMoveId || !state.previewSceneId) return state;
  if (state.committedMoves[state.previewSceneId] === state.previewMoveId) return state;
  return {
    ...state,
    selectedSceneId: state.previewSceneId,
    previewSceneId: null,
    previewMoveId: null,
    committedMoves: { ...state.committedMoves, [state.previewSceneId]: state.previewMoveId },
    revision: state.revision + 1,
  };
}

export function createCompositionHistory(state: CompositionState): CompositionHistory {
  return { past: [], present: state };
}

export function commitComposition(history: CompositionHistory): CompositionHistory {
  const next = commitSceneMove(history.present);
  if (next === history.present) return history;
  return { past: [...history.past, rejectSceneMove(history.present)], present: next };
}

export function undoComposition(history: CompositionHistory): CompositionHistory {
  const snapshot = history.past.at(-1);
  if (!snapshot) return history;
  return { past: history.past.slice(0, -1), present: snapshot };
}

function note(id: string, pitch: number, startTick: number, durationTick: number, velocity: number): NoteEvent {
  return { id, pitch, startTick, durationTick, velocity, source: 'asset', confidence: null, userEdited: false, lockPitch: false, lockTiming: false };
}

function chordIntervals(kit: HeroKit): readonly number[] {
  return kit.mode === 'minor' ? [0, 3, 7] : [0, 4, 7];
}

function baseRoleNotes(kit: HeroKit, sceneId: KasaneSceneId, role: KasaneRole): NoteEvent[] {
  const currentScene = scene(sceneId);
  const sceneStart = currentScene.startBar * 4 * PPQ;
  const sceneTicks = currentScene.bars * 4 * PPQ;
  const id = (index: number) => `kasane-${kit.id}-${sceneId}-keep-${role}-${index}`;
  const notes: NoteEvent[] = [];

  if (role === 'harmony') {
    for (let bar = 0; bar < currentScene.bars; bar += 1) {
      const root = kit.rootMidi + kit.progression[bar % kit.progression.length]!;
      chordIntervals(kit).forEach((interval, voice) => notes.push(note(id(notes.length), root + interval, sceneStart + bar * 4 * PPQ, 4 * PPQ, 72 - voice * 4)));
    }
  }

  if (role === 'lead') {
    const subdivisions = currentScene.energy > .8 ? 8 : currentScene.energy > .45 ? 6 : 4;
    for (let bar = 0; bar < currentScene.bars; bar += 1) {
      for (let step = 0; step < subdivisions; step += 1) {
        const offset = kit.leadMotif[(bar * subdivisions + step) % kit.leadMotif.length]!;
        const spacing = 4 * PPQ / subdivisions;
        notes.push(note(id(notes.length), kit.rootMidi + 12 + offset, sceneStart + bar * 4 * PPQ + step * spacing, Math.max(PPQ / 2, spacing * .78), 72 + Math.round(currentScene.energy * 34)));
      }
    }
  }

  if (role === 'bass') {
    for (let bar = 0; bar < currentScene.bars; bar += 1) {
      const root = kit.rootMidi + kit.progression[bar % kit.progression.length]! - 24;
      const pulses = currentScene.energy > .75 ? 4 : 2;
      for (let pulse = 0; pulse < pulses; pulse += 1) {
        const spacing = 4 * PPQ / pulses;
        notes.push(note(id(notes.length), root, sceneStart + bar * 4 * PPQ + pulse * spacing, spacing * .72, 84 + Math.round(currentScene.energy * 24)));
      }
    }
  }

  if (role === 'rhythm') {
    for (let bar = 0; bar < currentScene.bars; bar += 1) {
      const barStart = sceneStart + bar * 4 * PPQ;
      for (let beat = 0; beat < 4; beat += 1) {
        notes.push(note(id(notes.length), 36, barStart + beat * PPQ, PPQ / 4, 104));
        if (beat === 1 || beat === 3) notes.push(note(id(notes.length), 38, barStart + beat * PPQ, PPQ / 4, 94));
        const hats = currentScene.energy > .65 ? 2 : 1;
        for (let hat = 0; hat < hats; hat += 1) notes.push(note(id(notes.length), 42, barStart + beat * PPQ + hat * PPQ / hats, PPQ / 8, 62 + hat * 8));
      }
    }
  }

  if (role === 'texture') {
    for (let half = 0; half < 2; half += 1) {
      const root = kit.rootMidi + kit.progression[(half * 2) % kit.progression.length]! - 12;
      chordIntervals(kit).forEach((interval, voice) => notes.push(note(id(notes.length), root + interval, sceneStart + half * sceneTicks / 2, sceneTicks / 2, 44 + Math.round(currentScene.energy * 18) - voice * 2)));
    }
  }

  return notes;
}

function applyMove(notes: NoteEvent[], kit: HeroKit, sceneId: KasaneSceneId, role: KasaneRole, moveId: KasaneMoveId | null): NoteEvent[] {
  if (!moveId) return notes;
  const currentScene = scene(sceneId);
  const sceneStart = currentScene.startBar * 4 * PPQ;
  const midpoint = sceneStart + currentScene.bars * 2 * PPQ;
  const renamed = (items: NoteEvent[]) => items.map((item, index) => ({ ...item, id: `kasane-${kit.id}-${sceneId}-${moveId}-${role}-${index}` }));

  if (moveId === 'lift') {
    return renamed(notes.map((item, index) => ({
      ...item,
      pitch: item.startTick >= midpoint && (role === 'lead' || role === 'bass' || (role === 'harmony' && index % 3 === 2)) ? item.pitch + 12 : item.pitch,
      velocity: Math.min(127, item.velocity + (item.startTick >= midpoint ? 8 : 2)),
    })));
  }

  if (moveId === 'strip') {
    const sparse = role === 'rhythm'
      ? notes.filter((item, index) => item.pitch === 36 ? index % 2 === 0 : item.pitch === 38)
      : role === 'harmony' ? notes.filter((_item, index) => index % 3 !== 1)
        : role === 'texture' ? notes.filter((_item, index) => index < 3)
          : role === 'bass' ? notes.filter((_item, index) => index % 2 === 0)
            : notes;
    return renamed(sparse.map((item) => ({ ...item, velocity: Math.max(28, item.velocity - 12) })));
  }

  if (moveId === 'bounce') {
    if (role !== 'bass' && role !== 'rhythm') return renamed(notes);
    return renamed(notes.map((item) => ({ ...item, startTick: Math.min(sceneStart + currentScene.bars * 4 * PPQ - PPQ / 8, item.startTick + (item.pitch === 38 ? 0 : PPQ / 2)), durationTick: Math.min(item.durationTick, PPQ / 2) })));
  }

  if (moveId === 'answer') {
    if (role !== 'lead') return renamed(notes);
    const answerStart = sceneStart + 12 * PPQ;
    const answer = [7, 9, 11, 7].map((offset, index) => note('', kit.rootMidi + 24 + offset, answerStart + index * PPQ / 2, PPQ * .42, 104 - index * 4));
    return renamed([...notes, ...answer]);
  }

  if (role === 'rhythm') return renamed(notes.filter((item) => item.pitch === 36 && (item.startTick - sceneStart) % (4 * PPQ) === 0));
  if (role === 'bass') return renamed(notes.filter((_item, index) => index % 2 === 0).map((item) => ({ ...item, durationTick: PPQ * 1.5, velocity: item.velocity - 10 })));
  if (role === 'lead') return renamed(notes.filter((item) => item.startTick < midpoint));
  return renamed(notes.map((item) => ({ ...item, velocity: Math.max(24, item.velocity - 18) })));
}

function roleTrack(role: KasaneRole): TrackRole {
  return ({ lead: 'lead', harmony: 'chord', bass: 'bass', rhythm: 'drum', texture: 'pad' } as const)[role];
}

function sectionRole(sceneId: KasaneSceneId): SectionRole {
  return ({ intro: 'intro', lift: 'build', drop: 'drop', air: 'break', final: 'drop' } as const)[sceneId];
}

function effectiveMove(state: CompositionState, sceneId: KasaneSceneId, includePreview: boolean): KasaneMoveId | null {
  if (includePreview && state.previewSceneId === sceneId && state.previewMoveId) return state.previewMoveId;
  return state.committedMoves[sceneId];
}

export function materializeCompositionProject(state: CompositionState, includePreview = false): Project {
  const kit = heroKit(state.kitId);
  const base = createProject({
    projectId: `kasane-${kit.id}`,
    title: kit.name,
    now: '2026-08-01T00:00:00.000Z',
    entryMode: 'patchboard',
    genre: kit.id === 'prism-rush' ? 'cute-future-core' : 'cute-future-bass',
    mood: [...kit.traits],
    targetDurationSeconds: KASANE_SCENES.length * 16 * 60 / kit.bpm,
    bpm: kit.bpm,
    key: kit.key,
  });
  const arrangements: ArrangementSection[] = KASANE_SCENES.map((item) => ({
    id: `kasane-scene-${item.id}`,
    role: sectionRole(item.id),
    label: item.label,
    startBar: item.startBar,
    bars: item.bars,
    energyStart: item.energy,
    energyEnd: item.id === 'lift' ? .82 : item.id === 'air' ? .42 : item.energy,
    transitionAssetId: null,
  }));

  const tracks = base.tracks.map((track): Track => {
    const role = KASANE_ROLES.find((candidate) => roleTrack(candidate) === track.role);
    if (!role) return { ...track, muted: true };
    const design = kit.roles[role];
    const notes = KASANE_SCENES.flatMap((item) => applyMove(baseRoleNotes(kit, item.id, role), kit, item.id, role, effectiveMove(state, item.id, includePreview)));
    return {
      ...track,
      name: design.name,
      instrumentId: design.instrumentId,
      color: design.color,
      muted: false,
      volume: role === 'lead' ? .78 : role === 'harmony' ? .62 : role === 'bass' ? .72 : role === 'rhythm' ? .7 : .5,
      fx: { ...track.fx, reverb: role === 'texture' ? .48 : role === 'lead' ? .24 : .12, sidechain: role === 'harmony' || role === 'texture' ? .42 : 0 },
      lanes: track.lanes.map((lane, index) => ({ ...lane, notes: index === 0 ? notes : [] })),
    };
  });

  return {
    ...base,
    revision: state.revision,
    savedRevision: null,
    arrangement: { sourceAssetId: `hero-kit:${kit.id}:v1`, sections: arrangements },
    tracks,
    assetRefs: KASANE_ROLES.map((role) => kit.roles[role].instrumentId),
    loop: { enabled: false, startTick: 0, endTick: KASANE_SCENES.length * 16 * PPQ },
  };
}

export function selectedHeroKit(state: CompositionState): HeroKit {
  return heroKit(state.kitId);
}

export function selectedScene(state: CompositionState) {
  return scene(state.selectedSceneId);
}
