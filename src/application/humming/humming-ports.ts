import type { NoteEvent } from '../../domain/music';

export interface RecordedHumming {
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
}

export interface RecordingSession {
  result: Promise<RecordedHumming>;
  stop(): void;
}

export interface MicrophoneRecorder {
  start(maxDurationSeconds: number): Promise<RecordingSession>;
}

export interface HummingTranscriptionOptions {
  takeId: string;
  bpm: number;
  rangeStartTick: number;
  rangeEndTick: number;
}

export interface HummingTranscriber {
  transcribe(blob: Blob, options: HummingTranscriptionOptions, onProgress?: (progress: number) => void): Promise<NoteEvent[]>;
}

export interface HummingAssetRecord {
  assetId: string;
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
  recordedAt: string;
}

export interface HummingAssetRepository {
  get(assetId: string): Promise<HummingAssetRecord | undefined>;
  save(record: HummingAssetRecord): Promise<void>;
}

export class MemoryHummingAssetRepository implements HummingAssetRepository {
  private readonly records = new Map<string, HummingAssetRecord>();

  get(assetId: string): Promise<HummingAssetRecord | undefined> {
    const record = this.records.get(assetId);
    return Promise.resolve(record ? { ...record, blob: record.blob.slice(0, record.blob.size, record.blob.type) } : undefined);
  }

  save(record: HummingAssetRecord): Promise<void> {
    this.records.set(record.assetId, { ...record, blob: record.blob.slice(0, record.blob.size, record.blob.type) });
    return Promise.resolve();
  }
}
