import { PPQ } from './types';
import { CHORD_PROGRESSION_TICKS, parseChordPatternAssetId } from './chord-patterns';
import { generateRolePatternNotes, parseRolePatternNoteId, refreshAppliedRolePatterns, rolePatternById } from './role-patterns';
import { applySongStarter } from './song-starters';
import { applyKawaiiPhraseKit } from './kawaii-phrase-kits';
import type { RolePatternRole } from './role-patterns';
import type { ArrangementSection, AutomationPoint, HummingTake, NoteEvent, Project, Track, TrackLane } from './types';

type NotePatch = Partial<Pick<NoteEvent, 'pitch' | 'startTick' | 'durationTick' | 'velocity' | 'userEdited' | 'lockPitch' | 'lockTiming'>>;
type BlockPatch = Partial<Pick<TrackLane['blocks'][number], 'assetId' | 'startTick' | 'durationTick' | 'granularity' | 'parentBlockId'>>;

export type ProjectCommand =
  | { type: 'project/rename'; title: string; at: string }
  | { type: 'project/intent'; freeText: string; mood: string[]; at: string }
  | { type: 'project/settings'; targetDurationSeconds: number; bpm: number; key: string; at: string }
  | { type: 'project/starter-apply'; starterId: string; at: string }
  | { type: 'pattern/phrase-kit-apply'; kitId: string; phraseIndex: number; at: string }
  | { type: 'project/intent-media'; kind: 'reference' | 'spoken'; assetId: string; at: string }
  | { type: 'note/add'; trackId: string; laneId: string; note: NoteEvent; at: string }
  | { type: 'note/add-many'; trackId: string; laneId: string; notes: NoteEvent[]; at: string }
  | { type: 'sound-chunk/insert'; trackId: string; laneId: string; instrumentId: string; notes: NoteEvent[]; at: string }
  | { type: 'sound-chunk/save'; trackId: string; laneId: string; blocks: TrackLane['blocks']; at: string }
  | { type: 'note/update'; trackId: string; laneId: string; noteIds: string[]; patch: NotePatch; at: string }
  | { type: 'note/update-many'; trackId: string; laneId: string; updates: Array<{ noteId: string; patch: NotePatch }>; at: string }
  | { type: 'note/remove'; trackId: string; laneId: string; noteIds: string[]; at: string }
  | { type: 'melody/replace'; notes: NoteEvent[]; source: NoteEvent['source']; lockPitch: boolean; lockTiming: boolean; at: string }
  | { type: 'humming/take-add'; take: HummingTake; at: string }
  | { type: 'humming/take-status'; takeId: string; status: HummingTake['status']; at: string }
  | { type: 'humming/transcription-apply'; takeId: string; notes: NoteEvent[]; candidate: Project['generationCandidates'][number]; at: string }
  | { type: 'humming/take-select'; takeId: string; at: string }
  | { type: 'accompaniment/apply'; lanes: Array<{ trackId: string; laneId: string; notes: NoteEvent[] }>; assetIds: string[]; candidate: Project['generationCandidates'][number]; at: string }
  | { type: 'generation/candidate-add'; candidate: Project['generationCandidates'][number]; at: string }
  | { type: 'track/add'; track: Track; at: string }
  | { type: 'lane/add'; trackId: string; lane: TrackLane; at: string }
  | { type: 'track/mixer'; trackId: string; patch: Partial<Pick<Track, 'muted' | 'solo' | 'volume' | 'pan' | 'instrumentId' | 'fx'>>; at: string }
  | { type: 'arrangement/reorder'; sectionId: string; toIndex: number; at: string }
  | { type: 'arrangement/section-add'; section: ArrangementSection; toIndex: number; at: string }
  | { type: 'arrangement/section-update'; sectionId: string; patch: Partial<Pick<ArrangementSection, 'role' | 'label' | 'bars' | 'energyStart' | 'energyEnd' | 'transitionAssetId'>>; at: string }
  | { type: 'arrangement/section-remove'; sectionId: string; at: string }
  | { type: 'arrangement/replace'; sections: ArrangementSection[]; sourceAssetId: string | null; at: string }
  | { type: 'block/add'; trackId: string; laneId: string; block: TrackLane['blocks'][number]; at: string }
  | { type: 'asset/place'; trackId: string; laneId: string; blockId: string; assetId: string; startTick: number; durationTick: number; at: string }
  | { type: 'block/update'; trackId: string; laneId: string; blockId: string; patch: BlockPatch; at: string }
  | { type: 'block/remove'; trackId: string; laneId: string; blockId: string; at: string }
  | { type: 'pattern/chords-sequence'; trackId: string; laneId: string; blocks: TrackLane['blocks']; loopEndTick: number; at: string }
  | { type: 'pattern/chords-materialize'; trackId: string; laneId: string; blockIds: string[]; notes: NoteEvent[]; at: string }
  | { type: 'pattern/role-apply'; trackId: string; laneId: string; role: RolePatternRole; patternId: string; phraseIndex: number; startTick: number; endTick: number; notes: NoteEvent[]; at: string }
  | { type: 'audio-clip/add'; trackId: string; laneId: string; clip: TrackLane['audioClips'][number]; at: string }
  | { type: 'audio-clip/update'; trackId: string; laneId: string; clipId: string; patch: Partial<Pick<TrackLane['audioClips'][number], 'assetId' | 'startTick' | 'durationTick' | 'offsetSeconds' | 'gain'>>; at: string }
  | { type: 'audio-clip/remove'; trackId: string; laneId: string; clipId: string; at: string }
  | { type: 'automation/set'; trackId: string; parameter: Track['automation'][number]['parameter']; points: AutomationPoint[]; at: string }
  | { type: 'asset/ref-add'; assetId: string; at: string }
  | { type: 'asset/ref-remove'; assetId: string; at: string }
  | { type: 'loop/set'; enabled: boolean; startTick: number; endTick: number; at: string };

function getTrack(project: Project, trackId: string): Track {
  const track = project.tracks.find((candidate) => candidate.id === trackId);
  if (!track) throw new Error(`Unknown track: ${trackId}`);
  return track;
}

function getLane(project: Project, trackId: string, laneId: string): TrackLane {
  const lane = getTrack(project, trackId).lanes.find((candidate) => candidate.id === laneId);
  if (!lane) throw new Error(`Unknown lane: ${trackId}/${laneId}`);
  return lane;
}

function normalizeSections(sections: ArrangementSection[]): void {
  let startBar = 0;
  for (const section of sections) {
    section.startBar = startBar;
    startBar += section.bars;
  }
}

function alignSectionBlocks(project: Project): void {
  const sections = new Map(project.arrangement.sections.map((section) => [section.id, section]));
  for (const track of project.tracks) {
    for (const lane of track.lanes) {
      lane.blocks = lane.blocks.filter((block) => !block.parentBlockId || sections.has(block.parentBlockId));
      for (const block of lane.blocks) {
        if (!block.parentBlockId) continue;
        const section = sections.get(block.parentBlockId);
        if (!section) continue;
        block.startTick = section.startBar * 4 * PPQ;
        block.durationTick = section.bars * 4 * PPQ;
      }
    }
  }
}

function normalizeArrangement(project: Project): void {
  normalizeSections(project.arrangement.sections);
  alignSectionBlocks(project);
}

function resizeArrangementToSettings(project: Project): void {
  const minimumBars = 2;
  const targetBars = Math.max(minimumBars * project.arrangement.sections.length, Math.round(project.creativeIntent.targetDurationSeconds * project.musicalGrid.bpm / 240));
  let totalBars = project.arrangement.sections.reduce((sum, section) => sum + section.bars, 0);
  if (totalBars < targetBars) {
    const last = project.arrangement.sections.at(-1);
    if (last) last.bars += targetBars - totalBars;
  } else if (totalBars > targetBars) {
    let remaining = totalBars - targetBars;
    for (let index = project.arrangement.sections.length - 1; index >= 0 && remaining > 0; index -= 1) {
      const section = project.arrangement.sections[index];
      if (!section) continue;
      const reducible = Math.max(0, section.bars - minimumBars);
      const reduction = Math.min(reducible, remaining);
      section.bars -= reduction;
      remaining -= reduction;
    }
    totalBars = project.arrangement.sections.reduce((sum, section) => sum + section.bars, 0);
    if (totalBars !== targetBars && project.arrangement.sections.length > 0) {
      project.arrangement.sections[project.arrangement.sections.length - 1]!.bars = Math.max(minimumBars, project.arrangement.sections.at(-1)!.bars + targetBars - totalBars);
    }
  }
  normalizeArrangement(project);
}

export function applyProjectCommand(project: Project, command: ProjectCommand): Project {
  const next = structuredClone(project);
  switch (command.type) {
    case 'project/rename':
      next.title = command.title.trim();
      break;
    case 'project/intent':
      next.creativeIntent.freeText = command.freeText;
      next.creativeIntent.mood = [...new Set(command.mood.map((item) => item.trim()).filter(Boolean))];
      break;
    case 'project/settings':
      {
      const previousKey = next.musicalGrid.key;
      next.creativeIntent.targetDurationSeconds = Math.max(30, Math.min(600, Math.round(command.targetDurationSeconds)));
      next.musicalGrid.bpm = Math.max(30, Math.min(300, Math.round(command.bpm)));
      next.musicalGrid.key = command.key.trim() || next.musicalGrid.key;
      resizeArrangementToSettings(next);
      if (next.musicalGrid.key !== previousKey) refreshAppliedRolePatterns(next);
      break;
      }
    case 'project/starter-apply':
      applySongStarter(next, command.starterId);
      break;
    case 'pattern/phrase-kit-apply':
      applyKawaiiPhraseKit(next, command.kitId, command.phraseIndex);
      break;
    case 'project/intent-media':
      if (command.kind === 'spoken') next.creativeIntent.spokenIntentAssetId = command.assetId;
      else next.creativeIntent.referenceAssetIds = [...new Set([...next.creativeIntent.referenceAssetIds, command.assetId])];
      next.assetRefs = [...new Set([...next.assetRefs, command.assetId])];
      break;
    case 'note/add':
      getLane(next, command.trackId, command.laneId).notes.push(structuredClone(command.note));
      break;
    case 'note/add-many': {
      const lane = getLane(next, command.trackId, command.laneId);
      const existing = new Set(lane.notes.map((note) => note.id));
      for (const note of command.notes) {
        if (existing.has(note.id)) throw new Error(`Duplicate note: ${note.id}`);
        existing.add(note.id);
      }
      lane.notes.push(...structuredClone(command.notes));
      break;
    }
    case 'sound-chunk/insert': {
      const track = getTrack(next, command.trackId);
      const lane = getLane(next, command.trackId, command.laneId);
      const existing = new Set(lane.notes.map((note) => note.id));
      for (const note of command.notes) {
        if (existing.has(note.id)) throw new Error(`Duplicate note: ${note.id}`);
        existing.add(note.id);
      }
      track.instrumentId = command.instrumentId;
      lane.notes.push(...structuredClone(command.notes));
      break;
    }
    case 'sound-chunk/save': {
      const lane = getLane(next, command.trackId, command.laneId);
      const existing = new Set(lane.blocks.map((block) => block.id));
      for (const block of command.blocks) {
        if (existing.has(block.id)) throw new Error(`Duplicate block: ${block.id}`);
        if (block.assetId.length > 160) throw new Error(`Sound chunk asset ID is too long: ${block.id}`);
        existing.add(block.id);
      }
      lane.blocks.push(...structuredClone(command.blocks));
      break;
    }
    case 'note/update': {
      const ids = new Set(command.noteIds);
      const lane = getLane(next, command.trackId, command.laneId);
      lane.notes = lane.notes.map((note) => ids.has(note.id) ? { ...note, ...command.patch } : note);
      break;
    }
    case 'note/update-many': {
      const lane = getLane(next, command.trackId, command.laneId);
      const updates = new Map(command.updates.map((update) => [update.noteId, update.patch]));
      lane.notes = lane.notes.map((note) => {
        const patch = updates.get(note.id);
        return patch ? { ...note, ...structuredClone(patch) } : note;
      });
      break;
    }
    case 'note/remove': {
      const ids = new Set(command.noteIds);
      const lane = getLane(next, command.trackId, command.laneId);
      lane.notes = lane.notes.filter((note) => !ids.has(note.id));
      break;
    }
    case 'melody/replace': {
      const melodyLane = getLane(next, next.melody.trackId, next.melody.laneId);
      melodyLane.notes = structuredClone(command.notes);
      next.melody.source = command.source;
      next.melody.lockPitch = command.lockPitch;
      next.melody.lockTiming = command.lockTiming;
      break;
    }
    case 'humming/take-add':
      if (next.hummingTakes.some((take) => take.id === command.take.id)) throw new Error(`Duplicate humming take: ${command.take.id}`);
      next.hummingTakes.push(structuredClone(command.take));
      break;
    case 'humming/take-status': {
      const take = next.hummingTakes.find((candidate) => candidate.id === command.takeId);
      if (!take) throw new Error(`Unknown humming take: ${command.takeId}`);
      take.status = command.status;
      break;
    }
    case 'humming/transcription-apply': {
      const take = next.hummingTakes.find((candidate) => candidate.id === command.takeId);
      if (!take) throw new Error(`Unknown humming take: ${command.takeId}`);
      for (const candidate of next.hummingTakes) candidate.selected = candidate.id === command.takeId;
      take.status = 'ready';
      take.transcribedNotes = structuredClone(command.notes);
      const melodyLane = getLane(next, next.melody.trackId, next.melody.laneId);
      melodyLane.notes = structuredClone(command.notes);
      next.melody.source = 'humming';
      next.melody.lockPitch = true;
      next.melody.lockTiming = true;
      next.melody.activeTakeId = command.takeId;
      next.assetRefs = [...new Set([...next.assetRefs, take.assetId])];
      next.generationCandidates = [
        ...next.generationCandidates.filter((candidate) => candidate.capability !== 'humming-transcription' || candidate.inputAssetIds[0] !== take.assetId),
        structuredClone(command.candidate),
      ];
      break;
    }
    case 'humming/take-select': {
      const take = next.hummingTakes.find((candidate) => candidate.id === command.takeId);
      if (!take) throw new Error(`Unknown humming take: ${command.takeId}`);
      if (take.status !== 'ready' || take.transcribedNotes.length === 0) throw new Error('Ready状態の鼻歌takeだけを選べます。');
      for (const candidate of next.hummingTakes) candidate.selected = candidate.id === command.takeId;
      getLane(next, next.melody.trackId, next.melody.laneId).notes = structuredClone(take.transcribedNotes);
      next.melody.source = 'humming';
      next.melody.lockPitch = true;
      next.melody.lockTiming = true;
      next.melody.activeTakeId = command.takeId;
      break;
    }
    case 'accompaniment/apply':
      for (const write of command.lanes) {
        const target = getLane(next, write.trackId, write.laneId);
        target.notes = [...target.notes.filter((note) => note.source !== 'generated'), ...structuredClone(write.notes)];
      }
      next.assetRefs = [...new Set([...next.assetRefs, ...command.assetIds])];
      next.generationCandidates = [...next.generationCandidates.filter((candidate) => candidate.capability !== 'accompaniment'), structuredClone(command.candidate)];
      break;
    case 'generation/candidate-add':
      next.generationCandidates = [...next.generationCandidates.filter((candidate) => candidate.id !== command.candidate.id), structuredClone(command.candidate)];
      break;
    case 'track/add':
      next.tracks.push(structuredClone(command.track));
      break;
    case 'lane/add':
      getTrack(next, command.trackId).lanes.push(structuredClone(command.lane));
      break;
    case 'track/mixer':
      Object.assign(getTrack(next, command.trackId), structuredClone(command.patch));
      break;
    case 'arrangement/reorder': {
      const fromIndex = next.arrangement.sections.findIndex((section) => section.id === command.sectionId);
      if (fromIndex < 0) throw new Error(`Unknown section: ${command.sectionId}`);
      const [section] = next.arrangement.sections.splice(fromIndex, 1);
      if (!section) throw new Error(`Unable to move section: ${command.sectionId}`);
      next.arrangement.sections.splice(Math.max(0, Math.min(command.toIndex, next.arrangement.sections.length)), 0, section);
      normalizeArrangement(next);
      break;
    }
    case 'arrangement/section-add':
      next.arrangement.sections.splice(Math.max(0, Math.min(command.toIndex, next.arrangement.sections.length)), 0, structuredClone(command.section));
      normalizeArrangement(next);
      break;
    case 'arrangement/section-update': {
      const section = next.arrangement.sections.find((candidate) => candidate.id === command.sectionId);
      if (!section) throw new Error(`Unknown section: ${command.sectionId}`);
      Object.assign(section, structuredClone(command.patch));
      normalizeArrangement(next);
      break;
    }
    case 'arrangement/section-remove': {
      if (next.arrangement.sections.length <= 1) throw new Error('Arrangement must keep at least one section.');
      const before = next.arrangement.sections.length;
      next.arrangement.sections = next.arrangement.sections.filter((section) => section.id !== command.sectionId);
      if (next.arrangement.sections.length === before) throw new Error(`Unknown section: ${command.sectionId}`);
      normalizeArrangement(next);
      break;
    }
    case 'arrangement/replace':
      next.arrangement.sections = structuredClone(command.sections);
      next.arrangement.sourceAssetId = command.sourceAssetId;
      normalizeArrangement(next);
      break;
    case 'block/add':
      getLane(next, command.trackId, command.laneId).blocks.push(structuredClone(command.block));
      break;
    case 'asset/place': {
      if (!Number.isInteger(command.startTick) || command.startTick < 0 || !Number.isInteger(command.durationTick) || command.durationTick <= 0) throw new Error('Placed asset range is invalid.');
      const lane = getLane(next, command.trackId, command.laneId);
      const endTick = command.startTick + command.durationTick;
      lane.blocks = lane.blocks.filter((block) => !block.id.startsWith('placed-asset-') || block.startTick + block.durationTick <= command.startTick || block.startTick >= endTick);
      lane.blocks.push({ id: command.blockId, assetId: command.assetId, startTick: command.startTick, durationTick: command.durationTick, granularity: 'draft', parentBlockId: null });
      lane.blocks.sort((left, right) => left.startTick - right.startTick || left.id.localeCompare(right.id));
      next.assetRefs = [...new Set([...next.assetRefs, command.assetId])];
      break;
    }
    case 'block/update': {
      const lane = getLane(next, command.trackId, command.laneId);
      const block = lane.blocks.find((candidate) => candidate.id === command.blockId);
      if (!block) throw new Error(`Unknown block: ${command.blockId}`);
      Object.assign(block, structuredClone(command.patch));
      break;
    }
    case 'block/remove': {
      const lane = getLane(next, command.trackId, command.laneId);
      const before = lane.blocks.length;
      lane.blocks = lane.blocks.filter((block) => block.id !== command.blockId);
      if (lane.blocks.length === before) throw new Error(`Unknown block: ${command.blockId}`);
      break;
    }
    case 'pattern/chords-sequence': {
      const lane = getLane(next, command.trackId, command.laneId);
      const blocks = structuredClone(command.blocks);
      if (!Number.isInteger(command.loopEndTick) || command.loopEndTick < CHORD_PROGRESSION_TICKS || command.loopEndTick % CHORD_PROGRESSION_TICKS !== 0) throw new Error(`Chord progression must use ${CHORD_PROGRESSION_TICKS}-tick phrases.`);
      const ids = new Set<string>();
      for (const block of blocks) {
        if (!parseChordPatternAssetId(block.assetId)) throw new Error(`Unsupported chord pattern: ${block.assetId}`);
        if (ids.has(block.id)) throw new Error(`Duplicate block: ${block.id}`);
        if (block.startTick < 0 || block.startTick % (PPQ / 2) !== 0 || block.durationTick < PPQ / 2 || block.durationTick > CHORD_PROGRESSION_TICKS || block.durationTick % (PPQ / 2) !== 0 || block.startTick + block.durationTick > command.loopEndTick) throw new Error(`Invalid chord step range: ${block.id}`);
        ids.add(block.id);
      }
      const ordered = [...blocks].sort((left, right) => left.startTick - right.startTick || left.id.localeCompare(right.id));
      for (let index = 1; index < ordered.length; index += 1) {
        const previous = ordered[index - 1]!;
        const current = ordered[index]!;
        if (current.startTick < previous.startTick + previous.durationTick) throw new Error(`Overlapping chord steps: ${previous.id}/${current.id}`);
      }
      lane.blocks = [...lane.blocks.filter((block) => parseChordPatternAssetId(block.assetId) === null), ...ordered];
      next.loop = { enabled: true, startTick: 0, endTick: command.loopEndTick };
      refreshAppliedRolePatterns(next);
      break;
    }
    case 'pattern/chords-materialize': {
      const lane = getLane(next, command.trackId, command.laneId);
      const blockIds = new Set(command.blockIds);
      const ranges = lane.blocks.filter((block) => blockIds.has(block.id)).map((block) => ({ start: block.startTick, end: block.startTick + block.durationTick }));
      const overlaps = (note: NoteEvent) => ranges.some((range) => note.startTick < range.end && note.startTick + note.durationTick > range.start);
      lane.notes = [
        ...lane.notes.filter((note) => note.source !== 'generated' || !overlaps(note)),
        ...structuredClone(command.notes).map((note) => ({ ...note, source: 'manual' as const, userEdited: false })),
      ].sort((left, right) => left.startTick - right.startTick || left.pitch - right.pitch || left.id.localeCompare(right.id));
      lane.blocks = lane.blocks.filter((block) => !blockIds.has(block.id));
      break;
    }
    case 'pattern/role-apply': {
      const track = getTrack(next, command.trackId);
      const lane = getLane(next, command.trackId, command.laneId);
      if (track.role !== command.role || lane.role !== 'main') throw new Error(`Role pattern target mismatch: ${command.trackId}/${command.laneId}`);
      if (!rolePatternById(command.role, command.patternId)) throw new Error(`Unknown ${command.role} pattern: ${command.patternId}`);
      if (!Number.isInteger(command.phraseIndex) || command.phraseIndex < 0 || command.startTick !== command.phraseIndex * CHORD_PROGRESSION_TICKS || command.endTick !== command.startTick + CHORD_PROGRESSION_TICKS || command.endTick > next.loop.endTick) throw new Error(`Invalid role pattern phrase: ${command.phraseIndex}`);
      const expected = generateRolePatternNotes(next, command.role, command.patternId, command.phraseIndex);
      if (expected.length === 0 || command.notes.length !== expected.length) throw new Error(`Role pattern does not match generator: ${command.role}/${command.patternId}`);
      const expectedById = new Map(expected.map((event) => [event.id, event]));
      const ids = new Set<string>();
      for (const event of command.notes) {
        const identity = parseRolePatternNoteId(event.id);
        if (!identity || identity.role !== command.role || identity.patternId !== command.patternId || identity.phraseIndex !== command.phraseIndex) throw new Error(`Invalid role pattern note: ${event.id}`);
        if (ids.has(event.id) || event.startTick < command.startTick || event.startTick + event.durationTick > command.endTick || event.durationTick <= 0) throw new Error(`Invalid role pattern range: ${event.id}`);
        const generated = expectedById.get(event.id);
        if (!generated || event.source !== 'generated' || event.userEdited || event.pitch !== generated.pitch || event.startTick !== generated.startTick || event.durationTick !== generated.durationTick || event.velocity !== generated.velocity) throw new Error(`Role pattern note does not match generator: ${event.id}`);
        ids.add(event.id);
      }
      const overlaps = (event: NoteEvent) => event.startTick < command.endTick && event.startTick + event.durationTick > command.startTick;
      lane.notes = [
        ...lane.notes.filter((event) => event.userEdited || event.source !== 'generated' || !overlaps(event)),
        ...structuredClone(command.notes),
      ].sort((left, right) => left.startTick - right.startTick || left.pitch - right.pitch || left.id.localeCompare(right.id));
      break;
    }
    case 'audio-clip/add':
      getLane(next, command.trackId, command.laneId).audioClips.push(structuredClone(command.clip));
      next.assetRefs = [...new Set([...next.assetRefs, command.clip.assetId])];
      break;
    case 'audio-clip/update': {
      const clip = getLane(next, command.trackId, command.laneId).audioClips.find((candidate) => candidate.id === command.clipId);
      if (!clip) throw new Error(`Unknown audio clip: ${command.clipId}`);
      Object.assign(clip, structuredClone(command.patch));
      break;
    }
    case 'audio-clip/remove': {
      const lane = getLane(next, command.trackId, command.laneId);
      const before = lane.audioClips.length;
      lane.audioClips = lane.audioClips.filter((clip) => clip.id !== command.clipId);
      if (lane.audioClips.length === before) throw new Error(`Unknown audio clip: ${command.clipId}`);
      break;
    }
    case 'automation/set': {
      const track = getTrack(next, command.trackId);
      const lane = track.automation.find((candidate) => candidate.parameter === command.parameter);
      if (lane) lane.points = structuredClone(command.points);
      else track.automation.push({ id: `automation-${track.id}-${command.parameter}`, parameter: command.parameter, enabled: true, points: structuredClone(command.points) });
      break;
    }
    case 'asset/ref-add':
      next.assetRefs = [...new Set([...next.assetRefs, command.assetId])];
      break;
    case 'asset/ref-remove':
      next.assetRefs = next.assetRefs.filter((assetId) => assetId !== command.assetId);
      break;
    case 'loop/set':
      next.loop = { enabled: command.enabled, startTick: command.startTick, endTick: command.endTick };
      break;
  }
  next.revision = project.revision + 1;
  next.updatedAt = command.at;
  return next;
}

export function markProjectSaved(project: Project): Project {
  return { ...project, savedRevision: project.revision };
}

export function isProjectDirty(project: Project): boolean {
  return project.savedRevision === null || project.savedRevision !== project.revision;
}
