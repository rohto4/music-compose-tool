import { chordPadRootPositionPitches, parseChordPatternAssetId } from './chord-patterns';
import { chordKeyMode, chordProgressionTemplateById, createChordProgressionTemplateBlocks } from './chord-progression-templates';
import { generateRolePatternNotes } from './role-patterns';
import type { ChordPatternRhythmId } from './chord-patterns';
import type { NoteEvent, Project, TrackRole } from './types';

export interface KawaiiPhraseKit {
  id: string;
  label: string;
  section: 'Intro' | 'Verse' | 'Build' | 'Drop' | 'Break' | 'Final Drop';
  character: string;
  description: string;
  tags: readonly string[];
  progressionId: string;
  chordRhythm: ChordPatternRhythmId;
  patterns: { bass: string; arp: string; drum: string };
  instruments: Partial<Record<TrackRole, string>>;
  layerMotion: 'air' | 'pulse' | 'sync' | 'rise' | 'dense';
}

export const KAWAII_PHRASE_KITS: readonly KawaiiPhraseKit[] = [
  { id: 'cloud-intro', label: 'Cloud Intro', section: 'Intro', character: '浮遊・透明', description: '長いPadと低いSubの上でHarpを間引き、メロディを置く余白を残す。', tags: ['Kawaii Future Bass', 'low energy', 'intro'], progressionId: 'pop-axis', chordRhythm: 'hold', patterns: { bass: 'sub-glue', arp: 'quarter-chime', drum: 'kick-rest' }, instruments: { chord: 'chord-soft-wide-pad', bass: 'bass-round-sub', arp: 'arp-cloud-harp', drum: 'drum-velvet-punch', pad: 'pad-pastel-air', synth: 'synth-music-box' }, layerMotion: 'air' },
  { id: 'candy-verse', label: 'Candy Verse', section: 'Verse', character: '軽快・会話', description: 'Pizzicatoと裏拍Sparkleを小さく掛け合い、主旋律の入口を作る。', tags: ['Kawaii Pop', 'mid energy', 'verse'], progressionId: 'singer-songwriter', chordRhythm: 'pulse', patterns: { bass: 'fifth-answer', arp: 'offbeat-sparkle', drum: 'two-step' }, instruments: { chord: 'chord-pizzicato-ensemble', bass: 'bass-bubble-pluck', arp: 'arp-music-box-rain', drum: 'drum-dusk-garage', pad: 'pad-velvet-chorus', synth: 'synth-pizzicato-silk' }, layerMotion: 'pulse' },
  { id: 'soda-build', label: 'Soda Build', section: 'Build', character: '上昇・加速', description: '上がるBass、16分Arp、Hat buildを重ね、次のDropへ密度を引き上げる。', tags: ['Kawaii Future Bass', 'rising', 'build'], progressionId: 'hopscotch', chordRhythm: 'pulse', patterns: { bass: 'climb-turn', arp: 'updown-sixteenth', drum: 'build-sixteenth' }, instruments: { chord: 'chord-candy-stab', bass: 'bass-octave-bounce', arp: 'arp-core-ratchet', drum: 'drum-hyper-candy', pad: 'pad-cloud-chorus', synth: 'synth-rubber-pulse' }, layerMotion: 'rise' },
  { id: 'prism-drop', label: 'Prism Drop', section: 'Drop', character: '高揚・弾む', description: 'Royal Road、SYNCコード、Half-time Drum、広いArpで明るいDropを一気に作る。', tags: ['Kawaii Future Bass', 'high energy', 'drop'], progressionId: 'royal-road', chordRhythm: 'syncopated', patterns: { bass: 'octave-drop', arp: 'wide-skip', drum: 'half-time' }, instruments: { chord: 'chord-bright-supersaw', bass: 'bass-reese-growl', arp: 'arp-pixel-drop', drum: 'drum-candy-kit', pad: 'pad-sunrise-saw', synth: 'synth-lush-pulse-keys' }, layerMotion: 'sync' },
  { id: 'bubble-break', label: 'Bubble Break', section: 'Break', character: '切ない・静止', description: 'Pizzicato、Harp、薄いPadへ戻し、Drop後に耳を休ませる。', tags: ['Kawaii Future Bass', 'low energy', 'break'], progressionId: 'circle-turnaround', chordRhythm: 'hold', patterns: { bass: 'anchor', arp: 'high-answer', drum: 'minimal-space' }, instruments: { chord: 'chord-pizzicato-ensemble', bass: 'bass-round-sub', arp: 'arp-silver-harp', drum: 'drum-velvet-punch', pad: 'pad-night-veil', synth: 'synth-music-box' }, layerMotion: 'air' },
  { id: 'hyper-finale', label: 'Hyper Finale', section: 'Final Drop', character: '最大・疾走', description: 'Gate Bass、Cascade Arp、Open Hatと厚いSawを重ねた最終Drop。', tags: ['Kawaii Future Core', 'peak energy', 'final drop'], progressionId: 'pop-axis', chordRhythm: 'syncopated', patterns: { bass: 'gate-sixteenth', arp: 'cascade-sixteenth', drum: 'open-hat-drive' }, instruments: { chord: 'chord-hyper-prism', bass: 'bass-core-drive', arp: 'arp-core-ratchet', drum: 'drum-core-impact', pad: 'pad-sunrise-saw', synth: 'synth-juno-chorus' }, layerMotion: 'dense' },
] as const;

const PHRASE_TICKS = 16 * 480;
const NOTE_PREFIX = 'phrase-kit|v1|';

export function kawaiiPhraseKitById(id: string): KawaiiPhraseKit | undefined {
  return KAWAII_PHRASE_KITS.find((kit) => kit.id === id);
}

function targetLane(project: Project, role: TrackRole) {
  return project.tracks.find((track) => track.role === role)?.lanes.find((lane) => lane.role === 'main');
}

function replaceGeneratedPhraseNotes(project: Project, role: TrackRole, phraseIndex: number, notes: NoteEvent[]): void {
  const lane = targetLane(project, role);
  if (!lane) return;
  const start = phraseIndex * PHRASE_TICKS;
  const end = start + PHRASE_TICKS;
  const overlaps = (note: NoteEvent) => note.startTick < end && note.startTick + note.durationTick > start;
  lane.notes = [...lane.notes.filter((note) => note.userEdited || note.source !== 'generated' || !overlaps(note)), ...notes]
    .sort((left, right) => left.startTick - right.startTick || left.pitch - right.pitch || left.id.localeCompare(right.id));
}

function layerNotes(project: Project, kit: KawaiiPhraseKit, phraseIndex: number, role: 'pad' | 'synth'): NoteEvent[] {
  const start = phraseIndex * PHRASE_TICKS;
  const end = start + PHRASE_TICKS;
  const blocks = targetLane(project, 'chord')?.blocks.filter((block) => block.startTick >= start && block.startTick < end && parseChordPatternAssetId(block.assetId)) ?? [];
  const result: NoteEvent[] = [];
  for (const block of blocks) {
    const identity = parseChordPatternAssetId(block.assetId);
    if (!identity) continue;
    const pitches = chordPadRootPositionPitches(project.musicalGrid.key, identity.padId, role === 'pad' ? 48 : 60);
    if (role === 'pad') {
      for (const [pitchIndex, pitch] of pitches.entries()) result.push(note(`${NOTE_PREFIX}${kit.id}|pad|${phraseIndex}|${result.length}`, pitch, block.startTick, Math.max(120, block.durationTick - 36), 54 + pitchIndex * 4));
      continue;
    }
    const offsets = kit.layerMotion === 'air' ? [0, 2 * 480] : kit.layerMotion === 'pulse' ? [0, 480, 960, 1_440] : kit.layerMotion === 'sync' ? [0, 360, 720, 1_320, 1_680] : kit.layerMotion === 'rise' ? [0, 240, 480, 720, 960, 1_200, 1_440, 1_680] : Array.from({ length: 16 }, (_, index) => index * 120);
    for (const offset of offsets.filter((value) => value < block.durationTick)) {
      const pitch = pitches[(Math.floor(offset / 240) + phraseIndex) % pitches.length] ?? pitches[0];
      if (pitch !== undefined) result.push(note(`${NOTE_PREFIX}${kit.id}|synth|${phraseIndex}|${result.length}`, pitch + (kit.layerMotion === 'rise' ? Math.floor(offset / 960) * 12 : 0), block.startTick + offset, kit.layerMotion === 'air' ? 360 : kit.layerMotion === 'dense' ? 78 : 150, kit.layerMotion === 'dense' ? 82 : 68));
    }
  }
  return result;
}

function note(id: string, pitch: number, startTick: number, durationTick: number, velocity: number): NoteEvent {
  return { id, pitch: Math.max(0, Math.min(127, Math.round(pitch))), startTick, durationTick: Math.max(1, Math.round(durationTick)), velocity, source: 'generated', confidence: null, userEdited: false, lockPitch: false, lockTiming: false };
}

export function applyKawaiiPhraseKitLayers(project: Project, kitId: string, phraseIndex: number): void {
  const kit = kawaiiPhraseKitById(kitId);
  if (!kit) throw new Error(`Unknown phrase kit: ${kitId}`);
  if (!Number.isInteger(phraseIndex) || phraseIndex < 0) throw new Error(`Invalid phrase kit location: ${phraseIndex}`);
  const start = phraseIndex * PHRASE_TICKS;
  const end = start + PHRASE_TICKS;
  project.loop = { enabled: true, startTick: 0, endTick: Math.max(project.loop.endTick, end) };
  for (const role of ['bass', 'arp', 'drum'] as const) replaceGeneratedPhraseNotes(project, role, phraseIndex, generateRolePatternNotes(project, role, kit.patterns[role], phraseIndex));
  replaceGeneratedPhraseNotes(project, 'pad', phraseIndex, layerNotes(project, kit, phraseIndex, 'pad'));
  replaceGeneratedPhraseNotes(project, 'synth', phraseIndex, layerNotes(project, kit, phraseIndex, 'synth'));
  for (const [role, instrumentId] of Object.entries(kit.instruments) as Array<[TrackRole, string]>) {
    const track = project.tracks.find((candidate) => candidate.role === role);
    if (track) track.instrumentId = instrumentId;
  }
}

export function applyKawaiiPhraseKit(project: Project, kitId: string, phraseIndex: number): void {
  const kit = kawaiiPhraseKitById(kitId);
  if (!kit) throw new Error(`Unknown phrase kit: ${kitId}`);
  const template = chordProgressionTemplateById(kit.progressionId);
  if (!template || template.mode !== chordKeyMode(project.musicalGrid.key)) throw new Error(`Phrase kit is incompatible with ${project.musicalGrid.key}: ${kit.id}`);
  const chordLane = targetLane(project, 'chord');
  if (!chordLane) throw new Error('Chord Main laneが見つかりません。');
  const start = phraseIndex * PHRASE_TICKS;
  const end = start + PHRASE_TICKS;
  const blocks = createChordProgressionTemplateBlocks(template, phraseIndex, kit.chordRhythm);
  chordLane.blocks = [...chordLane.blocks.filter((block) => !parseChordPatternAssetId(block.assetId) || block.startTick < start || block.startTick >= end), ...blocks]
    .sort((left, right) => left.startTick - right.startTick || left.id.localeCompare(right.id));
  applyKawaiiPhraseKitLayers(project, kitId, phraseIndex);
}

export function appliedKawaiiPhraseKitId(project: Project, phraseIndex: number): string | null {
  const prefix = `${NOTE_PREFIX}`;
  const start = phraseIndex * PHRASE_TICKS;
  const end = start + PHRASE_TICKS;
  for (const role of ['pad', 'synth'] as const) {
    const candidate = targetLane(project, role)?.notes.find((note) => note.startTick >= start && note.startTick < end && note.id.startsWith(prefix));
    const kitId = candidate?.id.split('|')[2];
    if (kitId && kawaiiPhraseKitById(kitId)) return kitId;
  }
  return null;
}
