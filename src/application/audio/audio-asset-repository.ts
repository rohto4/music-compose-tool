import type { UserAudioAssetMetadata, UserAudioAssetRecord } from '../../domain/audio';

export interface AudioAssetRepository {
  list(): Promise<UserAudioAssetMetadata[]>;
  get(assetId: string): Promise<UserAudioAssetRecord | undefined>;
  save(record: UserAudioAssetRecord): Promise<void>;
}

export class MemoryAudioAssetRepository implements AudioAssetRepository {
  private readonly records = new Map<string, UserAudioAssetRecord>();

  list(): Promise<UserAudioAssetMetadata[]> {
    return Promise.resolve([...this.records.values()].map((record) => structuredClone(record.metadata)).sort((left, right) => right.createdAt.localeCompare(left.createdAt)));
  }

  get(assetId: string): Promise<UserAudioAssetRecord | undefined> {
    const record = this.records.get(assetId);
    return Promise.resolve(record ? { metadata: structuredClone(record.metadata), blob: record.blob.slice(0, record.blob.size, record.blob.type) } : undefined);
  }

  save(record: UserAudioAssetRecord): Promise<void> {
    this.records.set(record.metadata.id, { metadata: structuredClone(record.metadata), blob: record.blob.slice(0, record.blob.size, record.blob.type) });
    return Promise.resolve();
  }
}
