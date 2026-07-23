import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { ProjectRepository } from '../../application/projects/project-repository';
import { assertValidProject, migrateProject } from '../../domain/music';
import type { Project } from '../../domain/music';

interface PatchtoneDatabase extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { 'by-updated-at': string };
  };
}

const DATABASE_NAME = 'patchtone-projects';
const DATABASE_VERSION = 1;

export class IndexedDbProjectRepository implements ProjectRepository {
  private databasePromise: Promise<IDBPDatabase<PatchtoneDatabase>> | null = null;

  private database(): Promise<IDBPDatabase<PatchtoneDatabase>> {
    this.databasePromise ??= openDB<PatchtoneDatabase>(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(database) {
        const store = database.createObjectStore('projects', { keyPath: 'projectId' });
        store.createIndex('by-updated-at', 'updatedAt');
      },
    });
    return this.databasePromise;
  }

  async list(): Promise<Project[]> {
    const values = await (await this.database()).getAll('projects');
    return values
      .map((value) => migrateProject(value))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async get(projectId: string): Promise<Project | undefined> {
    const value = await (await this.database()).get('projects', projectId);
    return value ? migrateProject(value) : undefined;
  }

  async save(project: Project): Promise<void> {
    assertValidProject(project);
    await (await this.database()).put('projects', structuredClone(project));
  }

  async delete(projectId: string): Promise<void> {
    await (await this.database()).delete('projects', projectId);
  }
}

export const browserProjectRepository = new IndexedDbProjectRepository();
