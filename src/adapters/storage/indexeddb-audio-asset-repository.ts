import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { AudioAssetRepository } from '../../application/audio/audio-asset-repository';
import type { UserAudioAssetMetadata, UserAudioAssetRecord } from '../../domain/audio';

interface AudioAssetDatabase extends DBSchema {
  assets: {
    key: string;
    value: UserAudioAssetRecord;
    indexes: { 'by-created-at': string };
  };
}

const DATABASE_NAME = 'patchtone-audio-assets';

export class IndexedDbAudioAssetRepository implements AudioAssetRepository {
  private databasePromise: Promise<IDBPDatabase<AudioAssetDatabase>> | null = null;

  private database(): Promise<IDBPDatabase<AudioAssetDatabase>> {
    this.databasePromise ??= openDB<AudioAssetDatabase>(DATABASE_NAME, 1, {
      upgrade(database) {
        const store = database.createObjectStore('assets', { keyPath: 'metadata.id' });
        store.createIndex('by-created-at', 'metadata.createdAt');
      },
    });
    return this.databasePromise;
  }

  async list(): Promise<UserAudioAssetMetadata[]> {
    const values = await (await this.database()).getAllFromIndex('assets', 'by-created-at');
    return values.reverse().map((record) => record.metadata);
  }

  async get(assetId: string): Promise<UserAudioAssetRecord | undefined> {
    return (await this.database()).get('assets', assetId);
  }

  async save(record: UserAudioAssetRecord): Promise<void> {
    await (await this.database()).put('assets', record);
  }
}

export const browserAudioAssetRepository = new IndexedDbAudioAssetRepository();
