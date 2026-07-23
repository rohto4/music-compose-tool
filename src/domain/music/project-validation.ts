import { PPQ, PROJECT_FORMAT_VERSION } from './types';
import type { NoteEvent, Project } from './types';

const SECTION_ROLES = new Set(['intro', 'verse', 'build', 'drop', 'break', 'bridge', 'outro', 'custom']);

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
}

function noteIssues(note: NoteEvent, path: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!Number.isInteger(note.pitch) || note.pitch < 0 || note.pitch > 127) issues.push({ path: `${path}.pitch`, code: 'note.pitch', message: 'Pitch must be a MIDI integer from 0 to 127.' });
  if (!Number.isInteger(note.startTick) || note.startTick < 0) issues.push({ path: `${path}.startTick`, code: 'note.startTick', message: 'Start tick must be a non-negative integer.' });
  if (!Number.isInteger(note.durationTick) || note.durationTick < 1) issues.push({ path: `${path}.durationTick`, code: 'note.durationTick', message: 'Duration must be a positive integer.' });
  if (!Number.isInteger(note.velocity) || note.velocity < 1 || note.velocity > 127) issues.push({ path: `${path}.velocity`, code: 'note.velocity', message: 'Velocity must be a MIDI integer from 1 to 127.' });
  return issues;
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

export function validateProject(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (project.formatVersion !== PROJECT_FORMAT_VERSION) issues.push({ path: 'formatVersion', code: 'format.version', message: 'Expected project format 1.0.0.' });
  if (!project.projectId.trim()) issues.push({ path: 'projectId', code: 'project.id', message: 'Project ID is required.' });
  if (!project.title.trim()) issues.push({ path: 'title', code: 'project.title', message: 'Title is required.' });
  if (project.musicalGrid.ppq !== PPQ) issues.push({ path: 'musicalGrid.ppq', code: 'grid.ppq', message: 'PPQ must be 480.' });
  if (project.savedRevision !== null && (project.savedRevision < 0 || project.savedRevision > project.revision)) issues.push({ path: 'savedRevision', code: 'revision.saved', message: 'Saved revision must not exceed current revision.' });

  let expectedStartBar = 0;
  const sectionIds: string[] = [];
  for (const [index, section] of project.arrangement.sections.entries()) {
    const path = `arrangement.sections[${index}]`;
    sectionIds.push(section.id);
    if (!SECTION_ROLES.has(section.role)) issues.push({ path: `${path}.role`, code: 'section.role', message: 'Section role is unsupported.' });
    if (section.startBar !== expectedStartBar) issues.push({ path: `${path}.startBar`, code: 'section.contiguous', message: `Expected start bar ${expectedStartBar}.` });
    if (!Number.isInteger(section.bars) || section.bars < 1) issues.push({ path: `${path}.bars`, code: 'section.bars', message: 'Section bars must be a positive integer.' });
    if (section.energyStart < 0 || section.energyStart > 1 || section.energyEnd < 0 || section.energyEnd > 1) issues.push({ path, code: 'section.energy', message: 'Section energy must be between 0 and 1.' });
    expectedStartBar = section.startBar + section.bars;
  }
  for (const duplicate of findDuplicates(sectionIds)) issues.push({ path: 'arrangement.sections', code: 'section.duplicate', message: `Duplicate section ID: ${duplicate}` });

  const trackIds = project.tracks.map((track) => track.id);
  for (const duplicate of findDuplicates(trackIds)) issues.push({ path: 'tracks', code: 'track.duplicate', message: `Duplicate track ID: ${duplicate}` });
  const allNoteIds: string[] = [];
  const allBlockIds: string[] = [];
  const allAudioClipIds: string[] = [];
  for (const [trackIndex, track] of project.tracks.entries()) {
    if (track.volume < 0 || track.volume > 1.5) issues.push({ path: `tracks[${trackIndex}].volume`, code: 'track.volume', message: 'Track volume must be between 0 and 1.5.' });
    if (track.pan < -1 || track.pan > 1) issues.push({ path: `tracks[${trackIndex}].pan`, code: 'track.pan', message: 'Track pan must be between -1 and 1.' });
    for (const duplicate of findDuplicates(track.lanes.map((lane) => lane.id))) issues.push({ path: `tracks[${trackIndex}].lanes`, code: 'lane.duplicate', message: `Duplicate lane ID: ${duplicate}` });
    for (const [laneIndex, lane] of track.lanes.entries()) {
      for (const [clipIndex, clip] of lane.audioClips.entries()) {
        allAudioClipIds.push(clip.id);
        const clipPath = `tracks[${trackIndex}].lanes[${laneIndex}].audioClips[${clipIndex}]`;
        if (!clip.assetId.trim()) issues.push({ path: `${clipPath}.assetId`, code: 'audio-clip.asset', message: 'Audio clip asset ID is required.' });
        if (!Number.isInteger(clip.startTick) || clip.startTick < 0) issues.push({ path: `${clipPath}.startTick`, code: 'audio-clip.start', message: 'Audio clip start must be a non-negative integer.' });
        if (!Number.isInteger(clip.durationTick) || clip.durationTick < 1) issues.push({ path: `${clipPath}.durationTick`, code: 'audio-clip.duration', message: 'Audio clip duration must be positive.' });
        if (clip.offsetSeconds < 0 || !Number.isFinite(clip.offsetSeconds)) issues.push({ path: `${clipPath}.offsetSeconds`, code: 'audio-clip.offset', message: 'Audio clip offset must be non-negative.' });
        if (!Number.isFinite(clip.gain) || clip.gain < 0 || clip.gain > 2) issues.push({ path: `${clipPath}.gain`, code: 'audio-clip.gain', message: 'Audio clip gain must be between 0 and 2.' });
      }
      for (const [blockIndex, block] of lane.blocks.entries()) {
        allBlockIds.push(block.id);
        const path = `tracks[${trackIndex}].lanes[${laneIndex}].blocks[${blockIndex}]`;
        if (!block.assetId.trim()) issues.push({ path: `${path}.assetId`, code: 'block.asset', message: 'Block asset ID is required.' });
        if (!Number.isInteger(block.startTick) || block.startTick < 0) issues.push({ path: `${path}.startTick`, code: 'block.start', message: 'Block start must be a non-negative integer.' });
        if (!Number.isInteger(block.durationTick) || block.durationTick < 1) issues.push({ path: `${path}.durationTick`, code: 'block.duration', message: 'Block duration must be a positive integer.' });
      }
      for (const [noteIndex, note] of lane.notes.entries()) {
        allNoteIds.push(note.id);
        issues.push(...noteIssues(note, `tracks[${trackIndex}].lanes[${laneIndex}].notes[${noteIndex}]`));
      }
    }
  }
  for (const duplicate of findDuplicates(allNoteIds)) issues.push({ path: 'tracks.*.lanes.*.notes', code: 'note.duplicate', message: `Duplicate note ID: ${duplicate}` });
  for (const duplicate of findDuplicates(allBlockIds)) issues.push({ path: 'tracks.*.lanes.*.blocks', code: 'block.duplicate', message: `Duplicate block ID: ${duplicate}` });
  for (const duplicate of findDuplicates(allAudioClipIds)) issues.push({ path: 'tracks.*.lanes.*.audioClips', code: 'audio-clip.duplicate', message: `Duplicate audio clip ID: ${duplicate}` });
  for (const duplicate of findDuplicates(project.assetRefs)) issues.push({ path: 'assetRefs', code: 'asset.duplicate', message: `Duplicate asset reference: ${duplicate}` });
  const selectedTakes = project.hummingTakes.filter((take) => take.selected);
  if (selectedTakes.length > 1) issues.push({ path: 'hummingTakes', code: 'humming.selected', message: 'Only one humming take can be selected.' });
  for (const [takeIndex, take] of project.hummingTakes.entries()) {
    const path = `hummingTakes[${takeIndex}]`;
    if (take.durationSeconds <= 0 || take.durationSeconds > 30) issues.push({ path: `${path}.durationSeconds`, code: 'humming.duration', message: 'Humming take duration must be greater than 0 and at most 30 seconds.' });
    if (!sectionIds.includes(take.targetSectionId)) issues.push({ path: `${path}.targetSectionId`, code: 'humming.section', message: 'Humming target section does not exist.' });
    if (take.rangeStartTick < 0 || take.rangeEndTick <= take.rangeStartTick) issues.push({ path, code: 'humming.range', message: 'Humming range must have a non-negative start and a greater end.' });
    for (const [noteIndex, note] of take.transcribedNotes.entries()) {
      issues.push(...noteIssues(note, `${path}.transcribedNotes[${noteIndex}]`));
      if (note.startTick < take.rangeStartTick || note.startTick + note.durationTick > take.rangeEndTick) issues.push({ path: `${path}.transcribedNotes[${noteIndex}]`, code: 'humming.note-range', message: 'Transcribed note must stay inside its humming range.' });
    }
    for (const duplicate of findDuplicates(take.transcribedNotes.map((note) => note.id))) issues.push({ path: `${path}.transcribedNotes`, code: 'humming.note-duplicate', message: `Duplicate take note ID: ${duplicate}` });
  }
  const melodyTrack = project.tracks.find((track) => track.id === project.melody.trackId);
  if (!melodyTrack) issues.push({ path: 'melody.trackId', code: 'melody.track', message: 'Melody track does not exist.' });
  else if (!melodyTrack.lanes.some((lane) => lane.id === project.melody.laneId)) issues.push({ path: 'melody.laneId', code: 'melody.lane', message: 'Melody lane does not exist.' });
  if (project.melody.activeTakeId !== null) {
    const activeTake = project.hummingTakes.find((take) => take.id === project.melody.activeTakeId);
    if (!activeTake) issues.push({ path: 'melody.activeTakeId', code: 'humming.active', message: 'Active humming take does not exist.' });
    else if (!activeTake.selected) issues.push({ path: 'melody.activeTakeId', code: 'humming.active-selection', message: 'Active humming take must be selected.' });
  }
  if (project.loop.startTick < 0 || project.loop.endTick <= project.loop.startTick) issues.push({ path: 'loop', code: 'loop.range', message: 'Loop range must have a non-negative start and a greater end.' });
  return issues;
}

export function assertValidProject(project: Project): void {
  const issues = validateProject(project);
  if (issues.length > 0) throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n'));
}
