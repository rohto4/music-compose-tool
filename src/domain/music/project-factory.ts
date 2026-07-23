import { PPQ, PROJECT_FORMAT_VERSION } from './types';
import type { ArrangementSection, Project, ProjectCreateOptions, Track, TrackRole } from './types';

const TRACK_DEFINITIONS: ReadonlyArray<readonly [TrackRole, string, string, string]> = [
  ['melody', 'Melody', '#e8b9dc', 'pearl-lead'],
  ['chord', 'Chords', '#f0c48d', 'chord-bright-supersaw'],
  ['drum', 'Drums', '#9ed9ef', 'candy-kit'],
  ['bass', 'Bass', '#aee6c2', 'round-sub'],
  ['lead', 'Lead', '#d2b9ef', 'cloud-lead'],
  ['synth', 'Synth', '#efb5ae', 'glass-pluck'],
  ['pad', 'Pad', '#b9d3ef', 'pastel-pad'],
  ['arp', 'Arp', '#d8e99e', 'pixel-arp'],
  ['percussion', 'Percussion', '#e7c3a6', 'tiny-perc'],
  ['fx', 'FX', '#c5c7ed', 'sparkle-fx'],
  ['transition', 'Transition', '#b5dddd', 'soft-transition'],
  ['reference', 'AI Layer', '#c8b9e8', 'generated-layer'],
];

function createTrack(role: TrackRole, name: string, color: string, instrumentId: string): Track {
  const laneKind = role === 'drum' || role === 'percussion' ? 'drums' : role === 'reference' ? 'audio' : 'notes';
  return {
    id: `track-${role}`,
    role,
    name,
    color,
    instrumentId,
    muted: false,
    solo: false,
    volume: role === 'melody' ? 0.9 : 0.74,
    pan: 0,
    fx: { filter: 1, reverb: role === 'drum' ? 0.08 : 0.2, delay: 0, sidechain: role === 'chord' || role === 'pad' ? 0.55 : 0 },
    lanes: [
      { id: `lane-${role}-main`, name: 'Main', role: 'main', kind: laneKind, muted: false, notes: [], blocks: [], audioClips: [] },
      { id: `lane-${role}-sub`, name: 'Sub', role: 'sub', kind: laneKind, muted: false, notes: [], blocks: [], audioClips: [] },
    ],
    automation: [],
  };
}

function buildSections(targetDurationSeconds: number, bpm: number): ArrangementSection[] {
  const targetBars = Math.max(24, Math.round(targetDurationSeconds * bpm / 240));
  const roles: ReadonlyArray<readonly [ArrangementSection['role'], string, number, number]> = [
    ['intro', 'Intro', 0.18, 0.34],
    ['verse', 'Verse', 0.35, 0.48],
    ['build', 'Build', 0.48, 0.78],
    ['drop', 'Drop A', 0.9, 0.82],
    ['break', 'Break', 0.3, 0.42],
    ['bridge', 'Bridge', 0.44, 0.62],
    ['drop', 'Drop B', 0.94, 0.88],
    ['outro', 'Outro', 0.34, 0.14],
  ];
  const base = Math.max(2, Math.floor(targetBars / roles.length / 2) * 2);
  let remaining = targetBars;
  let startBar = 0;
  return roles.map(([role, label, energyStart, energyEnd], index) => {
    const remainingSlots = roles.length - index;
    const bars = index === roles.length - 1 ? remaining : Math.max(2, Math.min(base, remaining - (remainingSlots - 1) * 2));
    remaining -= bars;
    const section = {
      id: `section-${role}-${index + 1}`,
      role,
      label,
      startBar,
      bars,
      energyStart,
      energyEnd,
      transitionAssetId: role === 'build' ? 'asset-up-sweep' : role === 'drop' ? 'asset-soft-impact' : null,
    } satisfies ArrangementSection;
    startBar += bars;
    return section;
  });
}

export function createProject(options: ProjectCreateOptions): Project {
  const genre = options.genre ?? 'cute-future-bass';
  const bpm = options.bpm ?? (genre === 'cute-future-core' ? 175 : 150);
  const targetDurationSeconds = options.targetDurationSeconds ?? 90;
  const tracks = TRACK_DEFINITIONS.map(([role, name, color, instrumentId]) => createTrack(role, name, color, instrumentId));
  return {
    formatVersion: PROJECT_FORMAT_VERSION,
    projectId: options.projectId,
    title: options.title,
    revision: 0,
    savedRevision: null,
    createdAt: options.now,
    updatedAt: options.now,
    entryMode: options.entryMode,
    creativeIntent: {
      genre,
      mood: options.mood ?? ['hopeful', 'sparkling'],
      targetDurationSeconds,
      freeText: '',
      spokenIntentAssetId: null,
      referenceAssetIds: [],
    },
    musicalGrid: { ppq: PPQ, bpm, meter: '4/4', key: options.key ?? 'D major' },
    arrangement: { sourceAssetId: 'arrangement-sparkle-arc', sections: buildSections(targetDurationSeconds, bpm) },
    melody: {
      source: options.entryMode === 'humming-studio' ? 'humming' : 'manual',
      trackId: 'track-melody',
      laneId: 'lane-melody-main',
      lockPitch: true,
      lockTiming: true,
      activeTakeId: null,
    },
    tracks,
    hummingTakes: [],
    assetRefs: [],
    generationCandidates: [],
    loop: { enabled: false, startTick: 0, endTick: 4 * PPQ },
  };
}
