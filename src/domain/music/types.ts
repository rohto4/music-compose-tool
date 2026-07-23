export const PROJECT_FORMAT_VERSION = '1.0.0' as const;
export const PPQ = 480 as const;

export type Genre = 'cute-future-bass' | 'cute-future-core';
export type EntryMode = 'patchboard' | 'humming-studio';
export type Meter = '2/4' | '3/4' | '4/4' | '6/8';
export type SectionRole = 'intro' | 'verse' | 'build' | 'drop' | 'break' | 'bridge' | 'outro' | 'custom';
export type TrackRole =
  | 'melody'
  | 'chord'
  | 'drum'
  | 'bass'
  | 'lead'
  | 'synth'
  | 'pad'
  | 'arp'
  | 'percussion'
  | 'fx'
  | 'transition'
  | 'audio'
  | 'reference';
export type LaneRole = 'main' | 'sub' | 'take';
export type LaneKind = 'notes' | 'drums' | 'audio';
export type NoteSource = 'humming' | 'generated' | 'manual' | 'asset' | 'midi-input';
export type GenerationStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'rejected' | 'expired';
export type GenerationCapability = 'humming-transcription' | 'accompaniment' | 'full-track-layer' | 'loop-fx' | 'asset-retrieval' | 'repaint';
export type AutomationParameter = 'volume' | 'pan' | 'filter' | 'reverb' | 'delay' | 'sidechain';

export interface NoteEvent {
  id: string;
  pitch: number;
  startTick: number;
  durationTick: number;
  velocity: number;
  source: NoteSource;
  confidence: number | null;
  userEdited: boolean;
  lockPitch: boolean;
  lockTiming: boolean;
}

export interface MusicBlock {
  id: string;
  assetId: string;
  startTick: number;
  durationTick: number;
  granularity: 'draft' | 'shape' | 'detail';
  parentBlockId: string | null;
}

export interface AudioClip {
  id: string;
  assetId: string;
  startTick: number;
  durationTick: number;
  offsetSeconds: number;
  gain: number;
}

export interface TrackLane {
  id: string;
  name: string;
  role: LaneRole;
  kind: LaneKind;
  muted: boolean;
  notes: NoteEvent[];
  blocks: MusicBlock[];
  audioClips: AudioClip[];
}

export interface AutomationPoint {
  id: string;
  tick: number;
  value: number;
  curve: 'linear' | 'step';
}

export interface AutomationLane {
  id: string;
  parameter: AutomationParameter;
  enabled: boolean;
  points: AutomationPoint[];
}

export interface Track {
  id: string;
  role: TrackRole;
  name: string;
  color: string;
  instrumentId: string;
  muted: boolean;
  solo: boolean;
  volume: number;
  pan: number;
  fx: {
    filter: number;
    reverb: number;
    delay: number;
    sidechain: number;
  };
  lanes: TrackLane[];
  automation: AutomationLane[];
}

export interface ArrangementSection {
  id: string;
  role: SectionRole;
  label: string;
  startBar: number;
  bars: number;
  energyStart: number;
  energyEnd: number;
  transitionAssetId: string | null;
}

export interface HummingTake {
  id: string;
  assetId: string;
  label: string;
  recordedAt: string;
  durationSeconds: number;
  targetSectionId: string;
  rangeStartTick: number;
  rangeEndTick: number;
  status: 'recorded' | 'transcribing' | 'ready' | 'failed';
  selected: boolean;
  transcribedNotes: NoteEvent[];
}

export interface GenerationCandidate {
  id: string;
  capability: GenerationCapability;
  status: GenerationStatus;
  model: string | null;
  modelRevision: string | null;
  seed: number | null;
  outputAssetId: string | null;
  inputAssetIds: string[];
  intentTrace: string[];
  createdAt: string;
}

export interface Project {
  formatVersion: typeof PROJECT_FORMAT_VERSION;
  projectId: string;
  title: string;
  revision: number;
  savedRevision: number | null;
  createdAt: string;
  updatedAt: string;
  entryMode: EntryMode;
  creativeIntent: {
    genre: Genre;
    mood: string[];
    targetDurationSeconds: number;
    freeText: string;
    spokenIntentAssetId: string | null;
    referenceAssetIds: string[];
  };
  musicalGrid: {
    ppq: typeof PPQ;
    bpm: number;
    meter: Meter;
    key: string;
  };
  arrangement: {
    sourceAssetId: string | null;
    sections: ArrangementSection[];
  };
  melody: {
    source: NoteSource;
    trackId: string;
    laneId: string;
    lockPitch: boolean;
    lockTiming: boolean;
    activeTakeId: string | null;
  };
  tracks: Track[];
  hummingTakes: HummingTake[];
  assetRefs: string[];
  generationCandidates: GenerationCandidate[];
  loop: {
    enabled: boolean;
    startTick: number;
    endTick: number;
  };
}

export interface ProjectCreateOptions {
  projectId: string;
  title: string;
  now: string;
  entryMode: EntryMode;
  genre?: Genre;
  mood?: string[];
  targetDurationSeconds?: number;
  bpm?: number;
  key?: string;
}
