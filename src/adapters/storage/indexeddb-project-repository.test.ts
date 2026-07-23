// @vitest-environment jsdom

import 'fake-indexeddb/auto';
import { deleteDB } from 'idb';
import { beforeEach, describe, expect, it } from 'vitest';
import { createProject, markProjectSaved } from '../../domain/music';
import { IndexedDbProjectRepository } from './indexeddb-project-repository';

const NOW = '2026-07-22T01:00:00.000Z';

describe('IndexedDbProjectRepository', () => {
  beforeEach(async () => {
    await deleteDB('patchtone-projects');
  });

  it('persists only when save is called and returns detached project values', async () => {
    const repository = new IndexedDbProjectRepository();
    const project = createProject({ projectId: 'db-1', title: 'Candy Route', now: NOW, entryMode: 'patchboard' });
    expect(await repository.list()).toEqual([]);

    const saved = markProjectSaved(project);
    await repository.save(saved);
    const restored = await repository.get(project.projectId);
    expect(restored?.title).toBe('Candy Route');
    expect(restored?.savedRevision).toBe(0);
    if (restored) restored.title = 'Mutated outside';
    expect((await repository.get(project.projectId))?.title).toBe('Candy Route');
  });
});
