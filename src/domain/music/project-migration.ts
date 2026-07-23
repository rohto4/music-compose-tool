import { createProject } from './project-factory';
import { assertValidProject } from './project-validation';
import { PROJECT_FORMAT_VERSION } from './types';
import type { ArrangementSection, GenerationCandidate, NoteEvent, Project, SectionRole } from './types';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): UnknownRecord {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`);
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string.`);
  return value;
}

function legacyNotes(value: unknown): NoteEvent[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry, index) => {
    const note = requireRecord(entry, `melody.notes[${index}]`);
    return {
      id: requireString(note.id, `melody.notes[${index}].id`),
      pitch: Number(note.pitch),
      startTick: Number(note.startTick),
      durationTick: Number(note.durationTick),
      velocity: Number(note.velocity),
      source: note.source === 'humming' ? 'humming' : 'manual',
      confidence: typeof note.confidence === 'number' ? note.confidence : null,
      userEdited: note.userEdited === true,
      lockPitch: note.lockPitch !== false,
      lockTiming: note.lockTiming !== false,
    };
  });
}

function legacySections(value: unknown): ArrangementSection[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry, index) => {
    const section = requireRecord(entry, `arrangement.sections[${index}]`);
    return {
      id: requireString(section.id, `arrangement.sections[${index}].id`),
      role: requireString(section.role, `arrangement.sections[${index}].role`) as SectionRole,
      label: typeof section.label === 'string' ? section.label : `Section ${index + 1}`,
      startBar: Number(section.startBar),
      bars: Number(section.bars),
      energyStart: Number(section.energyStart),
      energyEnd: Number(section.energyEnd),
      transitionAssetId: typeof section.transitionAssetId === 'string' ? section.transitionAssetId : null,
    };
  });
}

function ensureReferenceTrack(project: Project): void {
  if (project.tracks.some((track) => track.role === 'reference')) return;
  const template = createProject({ projectId: `${project.projectId}-reference-template`, title: project.title, now: project.updatedAt, entryMode: project.entryMode, genre: project.creativeIntent.genre, mood: project.creativeIntent.mood, targetDurationSeconds: project.creativeIntent.targetDurationSeconds, bpm: project.musicalGrid.bpm, key: project.musicalGrid.key });
  const reference = template.tracks.find((track) => track.role === 'reference');
  if (reference) project.tracks.push({ ...reference, id: 'track-reference', lanes: reference.lanes.map((lane) => ({ ...lane })) });
}

export function migrateProject(value: unknown): Project {
  const input = requireRecord(value, 'project');
  if (input.formatVersion === PROJECT_FORMAT_VERSION) {
    const project = structuredClone(input) as unknown as Project;
    ensureReferenceTrack(project);
    project.hummingTakes = project.hummingTakes.map((take) => ({
      ...take,
      transcribedNotes: Array.isArray((take as Project['hummingTakes'][number] & { transcribedNotes?: NoteEvent[] }).transcribedNotes)
        ? structuredClone((take as Project['hummingTakes'][number] & { transcribedNotes?: NoteEvent[] }).transcribedNotes ?? [])
        : [],
    }));
    assertValidProject(project);
    return project;
  }
  if (input.formatVersion !== '0.1.0') throw new Error(`Unsupported project format: ${String(input.formatVersion)}`);
  const intent = requireRecord(input.creativeIntent, 'creativeIntent');
  const grid = requireRecord(input.musicalGrid, 'musicalGrid');
  const arrangement = requireRecord(input.arrangement, 'arrangement');
  const melody = requireRecord(input.melody, 'melody');
  const project = createProject({
    projectId: requireString(input.projectId, 'projectId'),
    title: requireString(input.title, 'title'),
    now: requireString(input.updatedAt ?? input.createdAt, 'updatedAt'),
    entryMode: 'humming-studio',
    genre: intent.genre === 'cute-future-core' ? 'cute-future-core' : 'cute-future-bass',
    mood: Array.isArray(intent.mood) ? intent.mood.filter((item): item is string => typeof item === 'string') : [],
    targetDurationSeconds: Number(intent.targetDurationSeconds),
    bpm: Number(grid.bpm),
    key: requireString(grid.key, 'musicalGrid.key'),
  });
  project.revision = Number(input.revision);
  project.savedRevision = typeof input.savedRevision === 'number' ? input.savedRevision : null;
  project.createdAt = requireString(input.createdAt, 'createdAt');
  project.creativeIntent.freeText = typeof intent.freeText === 'string' ? intent.freeText : '';
  project.arrangement.sourceAssetId = typeof arrangement.sourceAssetId === 'string' ? arrangement.sourceAssetId : null;
  project.arrangement.sections = legacySections(arrangement.sections);
  const melodyTrack = project.tracks.find((track) => track.id === project.melody.trackId);
  const melodyLane = melodyTrack?.lanes.find((lane) => lane.id === project.melody.laneId);
  if (!melodyLane) throw new Error('Factory melody lane is missing.');
  melodyLane.notes = legacyNotes(melody.notes);
  project.assetRefs = Array.isArray(input.assetRefs) ? input.assetRefs.filter((item): item is string => typeof item === 'string') : [];
  project.generationCandidates = Array.isArray(input.generationCandidates) ? structuredClone(input.generationCandidates) as GenerationCandidate[] : [];
  assertValidProject(project);
  return project;
}
