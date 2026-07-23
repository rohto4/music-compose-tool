import { applyProjectCommand } from './project-commands';
import type { ProjectCommand } from './project-commands';
import type { Project } from './types';

export interface ProjectHistory {
  past: Project[];
  present: Project;
  future: Project[];
}

export function createProjectHistory(project: Project): ProjectHistory {
  return { past: [], present: project, future: [] };
}

export function executeProjectCommand(history: ProjectHistory, command: ProjectCommand, limit = 100): ProjectHistory {
  const next = applyProjectCommand(history.present, command);
  return { past: [...history.past, history.present].slice(-limit), present: next, future: [] };
}

function restoreSnapshot(snapshot: Project, current: Project, at: string): Project {
  return { ...structuredClone(snapshot), revision: current.revision + 1, savedRevision: current.savedRevision, updatedAt: at };
}

export function undoProject(history: ProjectHistory, at: string): ProjectHistory {
  const snapshot = history.past.at(-1);
  if (!snapshot) return history;
  return {
    past: history.past.slice(0, -1),
    present: restoreSnapshot(snapshot, history.present, at),
    future: [history.present, ...history.future],
  };
}

export function redoProject(history: ProjectHistory, at: string): ProjectHistory {
  const snapshot = history.future[0];
  if (!snapshot) return history;
  return {
    past: [...history.past, history.present],
    present: restoreSnapshot(snapshot, history.present, at),
    future: history.future.slice(1),
  };
}
