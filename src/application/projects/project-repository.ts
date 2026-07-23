import { assertValidProject } from '../../domain/music';
import type { Project } from '../../domain/music';

export interface ProjectRepository {
  list(): Promise<Project[]>;
  get(projectId: string): Promise<Project | undefined>;
  save(project: Project): Promise<void>;
  delete(projectId: string): Promise<void>;
}

export class MemoryProjectRepository implements ProjectRepository {
  private readonly projects = new Map<string, Project>();

  constructor(initialProjects: Project[] = []) {
    for (const project of initialProjects) this.projects.set(project.projectId, structuredClone(project));
  }

  list(): Promise<Project[]> {
    return Promise.resolve([...this.projects.values()]
      .map((project) => structuredClone(project))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)));
  }

  get(projectId: string): Promise<Project | undefined> {
    const project = this.projects.get(projectId);
    return Promise.resolve(project ? structuredClone(project) : undefined);
  }

  save(project: Project): Promise<void> {
    assertValidProject(project);
    this.projects.set(project.projectId, structuredClone(project));
    return Promise.resolve();
  }

  delete(projectId: string): Promise<void> {
    this.projects.delete(projectId);
    return Promise.resolve();
  }
}
