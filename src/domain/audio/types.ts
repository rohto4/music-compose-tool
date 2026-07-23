import type { Project, RolePatternRole, TrackRole } from '../music';

export type BuiltInAssetCategory = 'chord' | 'drum' | 'bass' | 'lead' | 'synth' | 'pad' | 'arp' | 'percussion' | 'fx' | 'transition';
export type OscillatorShape = OscillatorType;

export interface SynthesisLayer {
  waveform: OscillatorShape;
  octave: number;
  detuneCents: number;
  gain: number;
  pan: number;
}

export interface SynthesisProfile {
  id: string;
  layers: readonly SynthesisLayer[];
  attackSeconds: number;
  releaseSeconds: number;
  sustain: number;
  filterBaseHz: number;
  filterEnvelopeHz: number;
  resonance: number;
  roleTags: readonly string[];
}

export interface BuiltInAudioAsset {
  id: string;
  category: BuiltInAssetCategory;
  trackRole: TrackRole;
  name: string;
  description: string;
  color: string;
  waveform: OscillatorShape;
  brightness: number;
  character: 'soft' | 'sparkling' | 'punchy' | 'wide' | 'tiny';
  synthesis?: SynthesisProfile;
}

export interface ToneAudioEvent {
  kind: 'tone';
  startSeconds: number;
  durationSeconds: number;
  frequency: number;
  waveform: OscillatorShape;
  gain: number;
  pan: number;
  brightness: number;
  attackSeconds: number;
  releaseSeconds: number;
  timbreId?: string;
  synthesis?: SynthesisProfile;
  effects?: {
    filter: number;
    reverb: number;
    delay: number;
    sidechain: number;
  };
}

export interface DrumAudioEvent {
  kind: 'kick' | 'snare' | 'hat' | 'clap' | 'tom' | 'sparkle' | 'sweep';
  startSeconds: number;
  durationSeconds: number;
  gain: number;
  pan: number;
  timbreId?: string;
  waveform?: OscillatorShape;
  brightness?: number;
  character?: BuiltInAudioAsset['character'];
  direction?: 'up' | 'down';
}

export type AudioEvent = ToneAudioEvent | DrumAudioEvent;

export interface AudioEventPlan {
  bpm: number;
  durationSeconds: number;
  events: AudioEvent[];
}

export interface UserAudioAssetMetadata {
  id: string;
  name: string;
  mimeType: 'audio/wav' | 'audio/mpeg';
  sizeBytes: number;
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  sha256: string;
  source: 'user-upload';
  licenseTag: 'user-owned-private';
  createdAt: string;
}

export interface UserAudioAssetRecord {
  metadata: UserAudioAssetMetadata;
  blob: Blob;
}

export interface PlaybackReceipt {
  durationSeconds: number;
  startedAt: number;
}

export interface SustainedAudition {
  startedAt: number;
  stop(): void;
}

export interface AudioEngine {
  audition(assetId: string): Promise<PlaybackReceipt>;
  auditionChord(project: Project, padId: string): Promise<PlaybackReceipt>;
  auditionRolePattern?(project: Project, role: RolePatternRole, patternId: string, phraseIndex: number): Promise<PlaybackReceipt>;
  /** Piano-roll note blocks only; relative timing is preserved and normalized to start now. */
  auditionNotes?(project: Project, trackId: string, noteIds: string[]): Promise<PlaybackReceipt>;
  /** Optional press-and-hold path. The caller must stop on pointerup, cancel, and unmount. */
  startChordAudition?(project: Project, padId: string): Promise<SustainedAudition>;
  /** Start whole-project playback at an optional PPQ tick without pre-rendering a WAV. */
  playProject(project: Project, startTick?: number): Promise<PlaybackReceipt>;
  stop(): void;
  importUserAudio(file: File, createdAt: string): Promise<UserAudioAssetMetadata>;
  listUserAudio(): Promise<UserAudioAssetMetadata[]>;
  /** Optional access for local AI/reference adapters; implementations must not expose filesystem paths. */
  getUserAudioAsset?(assetId: string): Promise<UserAudioAssetRecord | undefined>;
}
