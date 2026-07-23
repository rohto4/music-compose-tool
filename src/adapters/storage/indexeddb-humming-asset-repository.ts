import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { HummingAssetRecord, HummingAssetRepository } from '../../application/humming/humming-ports';

interface HummingDatabase extends DBSchema {
  takes: {
    key: string;
    value: HummingAssetRecord;
  };
}

export class IndexedDbHummingAssetRepository implements HummingAssetRepository {
  private databasePromise: Promise<IDBPDatabase<HummingDatabase>> | null = null;

  private database(): Promise<IDBPDatabase<HummingDatabase>> {
    this.databasePromise ??= openDB<HummingDatabase>('patchtone-humming-takes', 1, { upgrade(database) { database.createObjectStore('takes', { keyPath: 'assetId' }); } });
    return this.databasePromise;
  }

  async get(assetId: string): Promise<HummingAssetRecord | undefined> {
    return (await this.database()).get('takes', assetId);
  }

  async save(record: HummingAssetRecord): Promise<void> {
    await (await this.database()).put('takes', record);
  }
}

export const browserHummingAssetRepository = new IndexedDbHummingAssetRepository();
