import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import { BUILT_IN_AUDIO_ASSETS, BUILT_IN_TONAL_ASSETS } from '../../domain/audio';
import type { AudioEngine, BuiltInAssetCategory, UserAudioAssetMetadata } from '../../domain/audio';
import {
  CHORD_PROGRESSION_BEATS,
  CHORD_PROGRESSION_TICKS,
  CHORD_PROGRESSION_TEMPLATES,
  CHORD_KEY_OPTIONS,
  CHORD_PATTERN_RHYTHMS,
  KAWAII_PHRASE_KITS,
  CHORD_STEP_QUANTUM_BEATS,
  PPQ,
  chordPadCatalog,
  chordKeyMode,
  createChordPatternBlock,
  createChordProgressionTemplateBlocks,
  defaultChordStepBeats,
  maxEditableChordStepBeats,
  normalizeChordStepBeats,
  appliedRolePatternId,
  appliedKawaiiPhraseKitId,
  generateRolePatternNotes,
  parseChordPatternAssetId,
  previewChordProgressionTemplate,
  rebalanceChordStepBeats,
  ROLE_PATTERN_CATALOG,
  BUILT_IN_SOUND_CHUNKS,
  materializeSoundChunk,
} from '../../domain/music';
import type { ChordDiscoveryBand, ChordPatternRhythmId, ChordProgressionStepCount, ChordProgressionTemplate, MusicBlock, Project, ProjectCommand, RolePatternDefinition, RolePatternRole, SoundChunk } from '../../domain/music';
import { AudioPalette } from '../audio/AudioPalette';
import { CreativeBriefPanel } from '../projects/CreativeBriefPanel';
import { beginInsertDrag, canDropOnPhrase, canDropOnStep, endInsertDrag, INSERT_DRAG_MIME, INSERT_DRAG_STATE_EVENT, readInsertDrag } from './insert-drag';
import type { InsertDragPayload } from './insert-drag';

interface ChordPatternBoardProps {
  project: Project;
  engine: AudioEngine;
  now: () => string;
  onCommand: (command: ProjectCommand) => void;
  playing?: boolean;
  playbackMessage?: string | null;
  onTogglePlayback?: () => void;
  onAssetToggle?: (assetId: string, selected: boolean) => void;
  onPlaceUserAsset?: (asset: UserAudioAssetMetadata, phraseIndex: number) => void;
  onAuditionSoundChunk?: (chunk: SoundChunk) => Promise<void>;
}

type VoiceFamily = Extract<BuiltInAssetCategory, 'chord' | 'synth' | 'pad' | 'lead' | 'arp' | 'bass'>;
type PatternWorkspaceTabId = 'chord-live' | 'chord-sets' | 'accompaniment' | 'fx-fill' | 'tones';

const PATTERN_WORKSPACE_TABS: ReadonlyArray<{ id: PatternWorkspaceTabId; label: string }> = [
  { id: 'chord-live', label: 'コード・音色' },
  { id: 'chord-sets', label: 'コードセット' },
  { id: 'accompaniment', label: '伴奏' },
  { id: 'fx-fill', label: 'FX・Fill' },
  { id: 'tones', label: '音色割当' },
];

const BAND_LABELS: Record<ChordDiscoveryBand, string> = { stable: '基本', color: '彩り', surprise: '意外' };
const BAND_HELP: Record<ChordDiscoveryBand, string> = { stable: 'KEY内', color: '響きを足す', surprise: '借用・外側' };
const VOICE_FAMILIES: ReadonlyArray<{ id: VoiceFamily; label: string }> = [
  { id: 'chord', label: 'CHORD' },
  { id: 'synth', label: 'SYNTH' },
  { id: 'pad', label: 'PAD' },
  { id: 'lead', label: 'LEAD' },
  { id: 'arp', label: 'ARP' },
  { id: 'bass', label: 'BASS' },
];
const ROLE_PATTERN_LABELS: Record<RolePatternRole, { label: string; purpose: string }> = {
  bass: { label: 'BASS', purpose: '低域と推進' },
  arp: { label: 'ARP', purpose: '高域の動き' },
  drum: { label: 'DRUM', purpose: '拍とenergy' },
};

interface StepLocation { phraseIndex: number; stepIndex: number }
interface ChordPhraseTiming { stepCount: ChordProgressionStepCount; stepBeats: number[]; autoStepIndex: number }

function stepLocation(block: MusicBlock): StepLocation | null {
  const current = /^pattern-chord-phrase-(\d+)-slot-(\d+)$/.exec(block.id);
  const legacy = /^pattern-chord-slot-(\d+)$/.exec(block.id);
  const phraseIndex = current ? Number(current[1]) : legacy ? 0 : Number.NaN;
  const stepIndex = current ? Number(current[2]) : legacy ? Number(legacy[1]) : Number.NaN;
  return Number.isInteger(phraseIndex) && phraseIndex >= 0 && Number.isInteger(stepIndex) && stepIndex >= 0 && stepIndex < 8
    ? { phraseIndex, stepIndex }
    : null;
}

function initialPhraseTimings(project: Project, existingBlocks: readonly MusicBlock[]): ChordPhraseTiming[] {
  const furthestBlockTick = existingBlocks.reduce((max, block) => Math.max(max, block.startTick + block.durationTick), 0);
  const persistedEndTick = project.loop.enabled ? project.loop.endTick : 0;
  const phraseCount = Math.max(4, Math.ceil(Math.max(furthestBlockTick, persistedEndTick) / CHORD_PROGRESSION_TICKS));
  return Array.from({ length: phraseCount }, (_, phraseIndex) => {
    const phraseBlocks = existingBlocks.filter((block) => stepLocation(block)?.phraseIndex === phraseIndex);
    const stepCount: ChordProgressionStepCount = phraseBlocks.some((block) => (stepLocation(block)?.stepIndex ?? 0) >= 4) ? 8 : 4;
    const candidate = defaultChordStepBeats(stepCount);
    for (const block of phraseBlocks) {
      const location = stepLocation(block);
      if (location && location.stepIndex < stepCount) candidate[location.stepIndex] = block.durationTick / PPQ;
    }
    const normalized = normalizeChordStepBeats(candidate, stepCount);
    return { stepCount, stepBeats: normalized.beats, autoStepIndex: normalized.autoStepIndex };
  });
}

function locationKey(phraseIndex: number, stepIndex: number): string {
  return `${phraseIndex}:${stepIndex}`;
}

function beatOptionLabel(beats: number): string {
  const notation = new Map<number, string>([
    [.5, '8分音符'],
    [1, '4分音符'],
    [1.5, '付点4分音符'],
    [2, '2分音符'],
    [3, '付点2分音符'],
    [4, '全音符'],
  ]).get(beats);
  return notation ? `${beats}拍 · ${notation}` : `${beats}拍`;
}

export function ChordPatternBoard({ project, engine, now, onCommand, playing = false, playbackMessage = null, onTogglePlayback, onAssetToggle = () => undefined, onPlaceUserAsset = () => undefined, onAuditionSoundChunk }: ChordPatternBoardProps) {
  const chordTrack = project.tracks.find((track) => track.role === 'chord');
  const chordLane = chordTrack?.lanes.find((lane) => lane.role === 'main');
  const existingBlocks = (chordLane?.blocks ?? [])
    .filter((block) => parseChordPatternAssetId(block.assetId))
    .toSorted((left, right) => left.startTick - right.startTick);
  const blockByLocation = new Map<string, MusicBlock>();
  for (const block of existingBlocks) {
    const location = stepLocation(block);
    if (location) blockByLocation.set(locationKey(location.phraseIndex, location.stepIndex), block);
  }
  const [phrases, setPhrases] = useState<ChordPhraseTiming[]>(() => initialPhraseTimings(project, existingBlocks));
  const [selectedLocation, setSelectedLocation] = useState<StepLocation>({ phraseIndex: 0, stepIndex: 0 });
  const [rhythmId, setRhythmId] = useState<ChordPatternRhythmId>('hold');
  const currentTimbre = BUILT_IN_TONAL_ASSETS.find((asset) => asset.id === chordTrack?.instrumentId) ?? BUILT_IN_TONAL_ASSETS[0]!;
  const initialFamily = VOICE_FAMILIES.some((family) => family.id === currentTimbre.category) ? currentTimbre.category as VoiceFamily : 'chord';
  const [voiceFamily, setVoiceFamily] = useState<VoiceFamily>(initialFamily);
  const [status, setStatus] = useState('コードを押すと、表示中の音色で即座に鳴って選択STEPへ入ります。');
  const [holdingPadId, setHoldingPadId] = useState<string | null>(null);
  const holdRef = useRef<{ released: boolean; stop?: () => void } | null>(null);
  const suppressClickRef = useRef<string | null>(null);
  const suppressResetTimerRef = useRef<number | null>(null);
  const roleAuditionTimerRef = useRef<number | null>(null);
  const [auditioningRolePattern, setAuditioningRolePattern] = useState<string | null>(null);
  const [activeInsertDrag, setActiveInsertDrag] = useState<InsertDragPayload | null>(null);
  const [draggingSource, setDraggingSource] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<PatternWorkspaceTabId>('chord-live');
  const insertSerialRef = useRef(0);
  const aiStarter = project.generationCandidates.find((candidate) => candidate.id.startsWith('ai-starter-') && candidate.status === 'succeeded');
  const catalog = useMemo(() => chordPadCatalog(project.musicalGrid.key), [project.musicalGrid.key]);
  const familyTimbres = BUILT_IN_TONAL_ASSETS.filter((asset) => asset.category === voiceFamily);
  const toggleFullPreview = onTogglePlayback ?? (() => { void engine.playProject(project); });

  useEffect(() => () => {
    holdRef.current?.stop?.();
    holdRef.current = null;
    if (suppressResetTimerRef.current !== null) window.clearTimeout(suppressResetTimerRef.current);
    if (roleAuditionTimerRef.current !== null) window.clearTimeout(roleAuditionTimerRef.current);
  }, []);

  useEffect(() => {
    const handleInsertDragState = (event: Event) => {
      const payload = (event as CustomEvent<InsertDragPayload | null>).detail;
      setActiveInsertDrag(payload ?? null);
      if (!payload) {
        setDraggingSource(null);
        setDropTarget(null);
      }
    };
    window.addEventListener(INSERT_DRAG_STATE_EVENT, handleInsertDragState);
    return () => window.removeEventListener(INSERT_DRAG_STATE_EVENT, handleInsertDragState);
  }, []);

  const slotsForPhrase = (phraseIndex: number, phrase: ChordPhraseTiming) => Array.from({ length: phrase.stepCount }, (_, stepIndex) => {
    const block = blockByLocation.get(locationKey(phraseIndex, stepIndex));
    const identity = block ? parseChordPatternAssetId(block.assetId) : null;
    const beats = phrase.stepBeats[stepIndex] ?? CHORD_PROGRESSION_BEATS / phrase.stepCount;
    return { phraseIndex, stepIndex, beats, maxBeats: maxEditableChordStepBeats(phrase.stepBeats, phrase.stepCount, stepIndex, phrase.autoStepIndex), block, identity, pad: identity ? catalog.find((candidate) => candidate.id === identity.padId) : undefined };
  });

  const buildSequence = (nextPhrases: readonly ChordPhraseTiming[], overrides = new Map<string, MusicBlock | null>()) => {
    const blocks: MusicBlock[] = [];
    for (let phraseIndex = 0; phraseIndex < nextPhrases.length; phraseIndex += 1) {
      const phrase = nextPhrases[phraseIndex]!;
      let cursor = phraseIndex * CHORD_PROGRESSION_TICKS;
      for (let stepIndex = 0; stepIndex < phrase.stepCount; stepIndex += 1) {
        const beatCount = phrase.stepBeats[stepIndex] ?? CHORD_PROGRESSION_BEATS / phrase.stepCount;
        const key = locationKey(phraseIndex, stepIndex);
        const source = overrides.has(key) ? overrides.get(key) : blockByLocation.get(key);
        if (source) blocks.push({ ...source, startTick: cursor, durationTick: beatCount * PPQ });
        cursor += beatCount * PPQ;
      }
      const expectedEnd = (phraseIndex + 1) * CHORD_PROGRESSION_TICKS;
      if (Math.abs(cursor - expectedEnd) > .001) throw new Error(`Chord phrase ${phraseIndex + 1} must fill four bars.`);
    }
    return { blocks, loopEndTick: nextPhrases.length * CHORD_PROGRESSION_TICKS };
  };

  const commitSequence = (nextPhrases: readonly ChordPhraseTiming[], overrides?: Map<string, MusicBlock | null>) => {
    if (!chordTrack || !chordLane) return;
    const sequence = buildSequence(nextPhrases, overrides);
    onCommand({ type: 'pattern/chords-sequence', trackId: chordTrack.id, laneId: chordLane.id, blocks: sequence.blocks, loopEndTick: sequence.loopEndTick, at: now() });
  };

  const selectTimbre = (instrumentId: string) => {
    if (!chordTrack) return;
    onCommand({ type: 'track/mixer', trackId: chordTrack.id, patch: { instrumentId }, at: now() });
    const timbre = BUILT_IN_TONAL_ASSETS.find((asset) => asset.id === instrumentId);
    setStatus(`${timbre?.name ?? instrumentId}をLIVE VOICEに選びました。次に押すコードからこの音で鳴ります。`);
  };

  const setPhraseSteps = (phraseIndex: number, value: ChordProgressionStepCount) => {
    const next = defaultChordStepBeats(value);
    const nextPhrases = phrases.map((phrase, index) => index === phraseIndex ? { stepCount: value, stepBeats: next, autoStepIndex: value - 1 } : phrase);
    setPhrases(nextPhrases);
    setSelectedLocation((current) => current.phraseIndex === phraseIndex ? { phraseIndex, stepIndex: Math.min(current.stepIndex, value - 1) } : current);
    commitSequence(nextPhrases);
    setStatus(`フレーズ${phraseIndex + 1}を${value}コードへ均等配分しました。4小節は維持しています。`);
  };

  const changeStepBeats = (phraseIndex: number, stepIndex: number, beats: number) => {
    const phrase = phrases[phraseIndex];
    if (!phrase) return;
    const balanced = rebalanceChordStepBeats(phrase.stepBeats, phrase.stepCount, stepIndex, beats, phrase.autoStepIndex);
    const nextPhrases = phrases.map((value, index) => index === phraseIndex ? { ...value, stepBeats: balanced.beats, autoStepIndex: balanced.autoStepIndex } : value);
    setPhrases(nextPhrases);
    commitSequence(nextPhrases);
    setStatus(`フレーズ${phraseIndex + 1}のSTEP ${stepIndex + 1}を${balanced.beats[stepIndex]}拍へ変更し、STEP ${balanced.autoStepIndex + 1}を${balanced.beats[balanced.autoStepIndex]}拍へ自動調整しました。`);
  };

  const addPhrase = () => {
    const nextPhrases = [...phrases, { stepCount: 4 as const, stepBeats: defaultChordStepBeats(4), autoStepIndex: 3 }];
    setPhrases(nextPhrases);
    setSelectedLocation({ phraseIndex: nextPhrases.length - 1, stepIndex: 0 });
    commitSequence(nextPhrases);
    setStatus(`4小節を追加しました。全${nextPhrases.length * 4}小節です。`);
  };

  const removeLastPhrase = () => {
    if (phrases.length <= 1) return;
    const nextPhrases = phrases.slice(0, -1);
    setPhrases(nextPhrases);
    setSelectedLocation((current) => ({ phraseIndex: Math.min(current.phraseIndex, nextPhrases.length - 1), stepIndex: current.phraseIndex >= nextPhrases.length ? 0 : current.stepIndex }));
    commitSequence(nextPhrases);
    setStatus(`最後の4小節を削除しました。全${nextPhrases.length * 4}小節です。`);
  };

  const placePad = (padId: string, symbol: string, audition: boolean, target: StepLocation = selectedLocation, advance = true) => {
    if (!chordTrack || !chordLane) {
      setStatus('Chord trackが見つからないため配置できません。');
      return;
    }
    if (audition) void engine.auditionChord(project, padId).catch((reason: unknown) => {
      setStatus(reason instanceof Error ? reason.message : 'コードを試聴できませんでした。');
    });
    const phrase = phrases[target.phraseIndex];
    if (!phrase) return;
    const startTick = target.phraseIndex * CHORD_PROGRESSION_TICKS + phrase.stepBeats.slice(0, target.stepIndex).reduce((sum, beats) => sum + beats * PPQ, 0);
    const block = createChordPatternBlock(`pattern-chord-phrase-${target.phraseIndex}-slot-${target.stepIndex}`, startTick, padId, rhythmId, phrase.stepBeats[target.stepIndex]);
    commitSequence(phrases, new Map([[locationKey(target.phraseIndex, target.stepIndex), block]]));
    setStatus(`BAR ${target.phraseIndex * 4 + 1}–${target.phraseIndex * 4 + 4} / STEP ${target.stepIndex + 1}へ ${symbol} / ${phrase.stepBeats[target.stepIndex]}拍 / ${CHORD_PATTERN_RHYTHMS.find((rhythm) => rhythm.id === rhythmId)?.label} を配置しました。`);
    setSelectedLocation(advance ? { phraseIndex: target.phraseIndex, stepIndex: (target.stepIndex + 1) % phrase.stepCount } : target);
  };

  const startPadHold = (padId: string, symbol: string) => {
    holdRef.current?.stop?.();
    if (suppressResetTimerRef.current !== null) window.clearTimeout(suppressResetTimerRef.current);
    const hold: { released: boolean; stop?: () => void } = { released: false };
    holdRef.current = hold;
    suppressClickRef.current = padId;
    setHoldingPadId(padId);
    placePad(padId, symbol, false);
    const start = engine.startChordAudition
      ? engine.startChordAudition(project, padId)
      : engine.auditionChord(project, padId).then(() => ({ startedAt: performance.now(), stop: () => engine.stop() }));
    void start.then((session) => {
      hold.stop = () => session.stop();
      if (hold.released || holdRef.current !== hold) session.stop();
    }).catch((reason: unknown) => {
      if (holdRef.current === hold) {
        setHoldingPadId(null);
        setStatus(reason instanceof Error ? reason.message : 'コードを長く試聴できませんでした。');
      }
    });
  };

  const stopPadHold = () => {
    const hold = holdRef.current;
    if (hold) {
      hold.released = true;
      hold.stop?.();
    }
    holdRef.current = null;
    setHoldingPadId(null);
    const suppressedPadId = suppressClickRef.current;
    suppressResetTimerRef.current = window.setTimeout(() => {
      if (suppressClickRef.current === suppressedPadId) suppressClickRef.current = null;
      suppressResetTimerRef.current = null;
    }, 0);
  };

  const clearStep = (phraseIndex: number, stepIndex: number) => {
    const key = locationKey(phraseIndex, stepIndex);
    if (!blockByLocation.has(key)) return;
    commitSequence(phrases, new Map([[key, null]]));
    setSelectedLocation({ phraseIndex, stepIndex });
    setStatus(`フレーズ${phraseIndex + 1}のSTEP ${stepIndex + 1}を空にしました。`);
  };

  const applyProgressionTemplate = (template: ChordProgressionTemplate, targetPhraseIndex = selectedLocation.phraseIndex) => {
    if (template.mode !== chordKeyMode(project.musicalGrid.key)) return;
    const phraseIndex = targetPhraseIndex;
    const stepCount = template.steps.length as ChordProgressionStepCount;
    const blocks = createChordProgressionTemplateBlocks(template, phraseIndex, rhythmId);
    const stepBeats = template.steps.map((step) => step.beats);
    const nextPhrases = phrases.map((phrase, index) => index === phraseIndex ? { stepCount, stepBeats, autoStepIndex: stepCount - 1 } : phrase);
    const overrides = new Map<string, MusicBlock | null>();
    for (const block of blocks) {
      const location = stepLocation(block);
      if (location) overrides.set(locationKey(location.phraseIndex, location.stepIndex), block);
    }
    setPhrases(nextPhrases);
    setSelectedLocation({ phraseIndex, stepIndex: 0 });
    commitSequence(nextPhrases, overrides);
    setStatus(`${template.label}（${template.degreeLabel}）をPHRASE ${phraseIndex + 1}へ追加しました。通常のSTEPと同じように編集できます。`);
  };

  const changeProjectKey = (key: string) => {
    onCommand({ type: 'project/settings', targetDurationSeconds: project.creativeIntent.targetDurationSeconds, bpm: project.musicalGrid.bpm, key, at: now() });
    setStatus(`曲全体を${key}へ変更しました。コード記号と追従Bass / Arpを更新し、手入力・鼻歌Melodyは保持しています。`);
  };

  const applyRolePattern = (pattern: RolePatternDefinition, targetPhraseIndex = selectedLocation.phraseIndex) => {
    const role = pattern.role;
    const track = project.tracks.find((candidate) => candidate.role === role);
    const lane = track?.lanes.find((candidate) => candidate.role === 'main');
    if (!track || !lane) {
      setStatus(`${ROLE_PATTERN_LABELS[role].label} Main laneが見つかりません。`);
      return;
    }
    const notes = generateRolePatternNotes(project, role, pattern.id, targetPhraseIndex);
    if (role !== 'drum' && notes.length === 0) {
      setStatus(`PHRASE ${selectedLocation.phraseIndex + 1}へ先にコードを配置してください。`);
      return;
    }
    const startTick = targetPhraseIndex * CHORD_PROGRESSION_TICKS;
    onCommand({ type: 'pattern/role-apply', trackId: track.id, laneId: lane.id, role, patternId: pattern.id, phraseIndex: targetPhraseIndex, startTick, endTick: startTick + CHORD_PROGRESSION_TICKS, notes, at: now() });
    setSelectedLocation({ phraseIndex: targetPhraseIndex, stepIndex: 0 });
    setStatus(`${pattern.label}をPHRASE ${targetPhraseIndex + 1}の${ROLE_PATTERN_LABELS[role].label}へ適用しました。コード変更にも追従します。`);
  };

  const applyPhraseKit = (kitId: string, label: string, targetPhraseIndex = selectedLocation.phraseIndex) => {
    onCommand({ type: 'pattern/phrase-kit-apply', kitId, phraseIndex: targetPhraseIndex, at: now() });
    setSelectedLocation({ phraseIndex: targetPhraseIndex, stepIndex: 0 });
    setStatus(`${label}をPHRASE ${targetPhraseIndex + 1}へ挿入しました。Melodyと他の4小節は保持しています。`);
  };

  const placeBuiltInAsset = (assetId: string, targetPhraseIndex = selectedLocation.phraseIndex) => {
    const asset = BUILT_IN_AUDIO_ASSETS.find((candidate) => candidate.id === assetId);
    const track = asset ? project.tracks.find((candidate) => candidate.role === asset.trackRole) : undefined;
    const lane = track?.lanes.find((candidate) => candidate.role === 'main') ?? track?.lanes[0];
    if (!asset || !track || !lane) {
      setStatus('この音のピースを配置するtrack / Main laneが見つかりません。');
      return;
    }
    const startTick = targetPhraseIndex * CHORD_PROGRESSION_TICKS;
    onCommand({ type: 'asset/place', trackId: track.id, laneId: lane.id, blockId: `placed-asset-${asset.id}-phrase-${targetPhraseIndex}`, assetId: asset.id, startTick, durationTick: CHORD_PROGRESSION_TICKS, at: now() });
    setSelectedLocation({ phraseIndex: targetPhraseIndex, stepIndex: 0 });
    setStatus(`${asset.name}をPHRASE ${targetPhraseIndex + 1}の${asset.trackRole.toUpperCase()}へ挿入しました。`);
  };

  const insertSoundChunk = (chunk: SoundChunk, targetPhraseIndex = selectedLocation.phraseIndex) => {
    const track = project.tracks.find((candidate) => candidate.role === chunk.role);
    const lane = track?.lanes.find((candidate) => candidate.role === 'main') ?? track?.lanes[0];
    if (!track || !lane) {
      setStatus(`${chunk.role.toUpperCase()} Main laneが見つからないため挿入できません。`);
      return;
    }
    insertSerialRef.current += 1;
    const stamp = `${now().replace(/\D/g, '')}-${insertSerialRef.current}`;
    const notes = materializeSoundChunk(chunk, targetPhraseIndex * CHORD_PROGRESSION_TICKS, stamp);
    onCommand({ type: 'sound-chunk/insert', trackId: track.id, laneId: lane.id, instrumentId: chunk.instrumentId, notes, at: now() });
    setSelectedLocation({ phraseIndex: targetPhraseIndex, stepIndex: 0 });
    setStatus(`${chunk.label}をPHRASE ${targetPhraseIndex + 1}へ挿入しました。複合FX / Fillを通常音符として編集できます。`);
  };

  const placeUserAudioById = async (assetId: string, targetPhraseIndex: number) => {
    try {
      const asset = (await engine.listUserAudio()).find((candidate) => candidate.id === assetId);
      if (!asset) throw new Error('追加した音声が見つかりません。');
      onPlaceUserAsset(asset, targetPhraseIndex);
      setSelectedLocation({ phraseIndex: targetPhraseIndex, stepIndex: 0 });
      setStatus(`${asset.name}をPHRASE ${targetPhraseIndex + 1}の開始位置へ挿入しました。`);
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : '追加した音声を挿入できませんでした。');
    }
  };

  const applyInsertPayload = (payload: InsertDragPayload, targetPhraseIndex: number, targetStepIndex?: number) => {
    if (payload.kind === 'chord') {
      const pad = catalog.find((candidate) => candidate.id === payload.padId);
      if (pad && targetStepIndex !== undefined) placePad(pad.id, pad.symbol, false, { phraseIndex: targetPhraseIndex, stepIndex: targetStepIndex }, false);
    } else if (payload.kind === 'progression') {
      const template = CHORD_PROGRESSION_TEMPLATES.find((candidate) => candidate.id === payload.templateId);
      if (template) applyProgressionTemplate(template, targetPhraseIndex);
    } else if (payload.kind === 'phrase-kit') {
      const kit = KAWAII_PHRASE_KITS.find((candidate) => candidate.id === payload.kitId);
      if (kit) applyPhraseKit(kit.id, kit.label, targetPhraseIndex);
    } else if (payload.kind === 'role-pattern') {
      const pattern = ROLE_PATTERN_CATALOG.find((candidate) => candidate.role === payload.role && candidate.id === payload.patternId);
      if (pattern) applyRolePattern(pattern, targetPhraseIndex);
    } else if (payload.kind === 'asset') {
      placeBuiltInAsset(payload.assetId, targetPhraseIndex);
    } else if (payload.kind === 'user-audio') {
      void placeUserAudioById(payload.assetId, targetPhraseIndex);
    } else {
      const chunk = BUILT_IN_SOUND_CHUNKS.find((candidate) => candidate.id === payload.chunkId);
      if (chunk) insertSoundChunk(chunk, targetPhraseIndex);
    }
  };

  const startInsertDrag = (event: DragEvent<HTMLElement>, payload: InsertDragPayload, sourceKey: string) => {
    beginInsertDrag(event.dataTransfer, payload);
    setActiveInsertDrag(payload);
    setDraggingSource(sourceKey);
    setStatus(`${payload.label}を移動中です。上の${payload.kind === 'chord' ? 'STEP' : '4小節'}へドロップします。`);
  };

  const finishInsertDrag = () => {
    endInsertDrag();
    setActiveInsertDrag(null);
    setDraggingSource(null);
    setDropTarget(null);
  };

  const acceptsCurrentDrag = (event: DragEvent<HTMLElement>, target: 'phrase' | 'step') => {
    if (!activeInsertDrag) return event.dataTransfer.types.includes(INSERT_DRAG_MIME);
    return target === 'phrase' ? canDropOnPhrase(activeInsertDrag) : canDropOnStep(activeInsertDrag);
  };

  const dropOnPhrase = (event: DragEvent<HTMLElement>, phraseIndex: number) => {
    event.preventDefault();
    const payload = readInsertDrag(event.dataTransfer);
    if (canDropOnPhrase(payload)) applyInsertPayload(payload!, phraseIndex);
    finishInsertDrag();
  };

  const dropOnStep = (event: DragEvent<HTMLElement>, phraseIndex: number, stepIndex: number) => {
    event.preventDefault();
    const payload = readInsertDrag(event.dataTransfer);
    if (canDropOnStep(payload)) applyInsertPayload(payload!, phraseIndex, stepIndex);
    finishInsertDrag();
  };

  const auditionRolePattern = async (pattern: RolePatternDefinition) => {
    const auditionId = `${pattern.role}:${pattern.id}`;
    if (auditioningRolePattern === auditionId) {
      engine.stop();
      if (roleAuditionTimerRef.current !== null) window.clearTimeout(roleAuditionTimerRef.current);
      roleAuditionTimerRef.current = null;
      setAuditioningRolePattern(null);
      setStatus(`${pattern.label}の試聴を停止しました。`);
      return;
    }
    if (!engine.auditionRolePattern) {
      setStatus('このAudio Engineはrole pattern試聴へ対応していません。');
      return;
    }
    try {
      if (roleAuditionTimerRef.current !== null) window.clearTimeout(roleAuditionTimerRef.current);
      const receipt = await engine.auditionRolePattern(project, pattern.role, pattern.id, selectedLocation.phraseIndex);
      setAuditioningRolePattern(auditionId);
      setStatus(`${pattern.label}をPHRASE ${selectedLocation.phraseIndex + 1}のコードで試聴中です。`);
      roleAuditionTimerRef.current = window.setTimeout(() => {
        setAuditioningRolePattern((current) => current === auditionId ? null : current);
        roleAuditionTimerRef.current = null;
      }, Math.min(8_000, receipt.durationSeconds * 1_000));
    } catch (reason) {
      setAuditioningRolePattern(null);
      setStatus(reason instanceof Error ? reason.message : 'role patternを試聴できませんでした。');
    }
  };

  return (
    <section className="chord-pattern-board harmonic-atlas" data-tabbed="true" aria-labelledby="chord-pattern-title">
      <h2 className="visually-hidden" id="chord-pattern-title">コード譜と挿入アイテム</h2>

      {aiStarter && <div className="ai-starter-banner"><div><span>EDITABLE FOUNDATION</span><strong>AI Starterの土台を編集中</strong></div><p>{aiStarter.model} / local fallback。変更した範囲だけを更新し、残りの伴奏は保持します。</p></div>}

      <nav className="phrase-drop-dock" aria-label="4小節の挿入先">
        <span className="phrase-drop-dock-label"><b>INSERT TARGET</b><small>どのタブからもここへ挿入</small></span>
        <div>
          {phrases.map((_, phraseIndex) => <button
            type="button"
            aria-pressed={selectedLocation.phraseIndex === phraseIndex}
            aria-label={`フレーズ${phraseIndex + 1}を挿入先にする`}
            data-drop-ready={canDropOnPhrase(activeInsertDrag)}
            data-drop-target={dropTarget === `dock:${phraseIndex}`}
            onClick={() => setSelectedLocation({ phraseIndex, stepIndex: 0 })}
            onDragEnter={(event) => { if (acceptsCurrentDrag(event, 'phrase')) setDropTarget(`dock:${phraseIndex}`); }}
            onDragOver={(event) => { if (acceptsCurrentDrag(event, 'phrase')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } }}
            onDrop={(event) => dropOnPhrase(event, phraseIndex)}
            key={phraseIndex}
          ><span>PHRASE {String(phraseIndex + 1).padStart(2, '0')}</span><strong>BAR {phraseIndex * 4 + 1}–{phraseIndex * 4 + 4}</strong></button>)}
        </div>
      </nav>

      <nav className="pattern-workspace-tabs" aria-label="展開を整える機能">
        {PATTERN_WORKSPACE_TABS.map((tab) => <button
          type="button"
          aria-current={activeWorkspaceTab === tab.id ? 'page' : undefined}
          onClick={() => setActiveWorkspaceTab(tab.id)}
          key={tab.id}
        >{tab.label}</button>)}
      </nav>

      <section className="progression-template-browser" data-pattern-panel="chord-sets" hidden={activeWorkspaceTab !== 'chord-sets'} aria-labelledby="progression-template-title">
        <header>
          <h3 className="visually-hidden" id="progression-template-title">コード進行を挿入</h3>
          <div className="insert-shelf-mark"><span>CHORD SETS</span><strong>4小節へドラッグ</strong></div>
          <div className="progression-key-control">
            <label><span>追加する4小節</span><select aria-label="コード進行テンプレートの適用先" value={selectedLocation.phraseIndex} onChange={(event) => setSelectedLocation({ phraseIndex: Number(event.target.value), stepIndex: 0 })}>{phrases.map((_, phraseIndex) => <option value={phraseIndex} key={phraseIndex}>PHRASE {String(phraseIndex + 1).padStart(2, '0')} · BAR {phraseIndex * 4 + 1}–{phraseIndex * 4 + 4}</option>)}</select></label>
            <label><span>曲全体のキー</span><select aria-label="曲全体のキー（コード譜）" value={project.musicalGrid.key} onChange={(event) => changeProjectKey(event.target.value)}><optgroup label="Major">{CHORD_KEY_OPTIONS.filter((key) => key.endsWith('major')).map((key) => <option value={key} key={key}>{key}</option>)}</optgroup><optgroup label="Minor">{CHORD_KEY_OPTIONS.filter((key) => key.endsWith('minor')).map((key) => <option value={key} key={key}>{key}</option>)}</optgroup></select></label>
            <small>全phraseのコードと適用済み追従Bass / Arpを移調 · 手入力・鼻歌Melodyは保持</small>
          </div>
        </header>
        <div className="progression-template-grid">
          {CHORD_PROGRESSION_TEMPLATES.map((template) => {
            const compatible = template.mode === chordKeyMode(project.musicalGrid.key);
            const preview = previewChordProgressionTemplate(project.musicalGrid.key, template);
            return <article
              className="progression-template-card insertable-item"
              data-compatible={compatible}
              data-mode={template.mode}
              data-insertable={compatible}
              data-unavailable={!compatible}
              data-dragging={draggingSource === `progression:${template.id}`}
              draggable={compatible}
              onDragStart={(event) => startInsertDrag(event, { kind: 'progression', templateId: template.id, label: template.label }, `progression:${template.id}`)}
              onDragEnd={finishInsertDrag}
              key={template.id}
            >
              <div className="progression-template-meta"><span>{template.mode.toUpperCase()}</span><small>{template.character}</small></div>
              <strong>{template.label}</strong>
              <span className="progression-template-degrees">{template.degreeLabel}</span>
              <span className="progression-template-symbols">{preview.symbols.join(' · ')}</span>
              <p>{template.description}</p>
              <div className="progression-template-tags">{template.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <div className="progression-template-actions"><button type="button" disabled={!compatible} aria-label={`${template.label}をフレーズ${selectedLocation.phraseIndex + 1}へ追加`} onClick={() => applyProgressionTemplate(template)}>{compatible ? `PHRASE ${String(selectedLocation.phraseIndex + 1).padStart(2, '0')}へ追加` : `${template.mode === 'minor' ? 'Minor' : 'Major'} keyで使用`}</button></div>
            </article>;
          })}
        </div>
        <details className="progression-sources"><summary>出典・設計根拠</summary><ul>{Array.from(new Map(CHORD_PROGRESSION_TEMPLATES.map((template) => [template.sourceUrl, template.sourceLabel])).entries()).map(([sourceUrl, sourceLabel]) => <li key={sourceUrl}><a href={sourceUrl} target="_blank" rel="noreferrer">{sourceLabel}</a></li>)}</ul></details>
      </section>

      <section className="phrase-kit-browser" data-pattern-panel="accompaniment" hidden={activeWorkspaceTab !== 'accompaniment'} aria-labelledby="phrase-kit-title">
        <header><div><h3 className="visually-hidden" id="phrase-kit-title">伴奏フレーズを挿入</h3><span className="insert-shelf-mark"><span>FULL PHRASE</span><strong>コード＋6レイヤー</strong></span></div><strong>PHRASE {String(selectedLocation.phraseIndex + 1).padStart(2, '0')}</strong></header>
        <div className="phrase-kit-grid">{KAWAII_PHRASE_KITS.map((kit) => {
          const compatible = chordKeyMode(project.musicalGrid.key) === 'major';
          const applied = appliedKawaiiPhraseKitId(project, selectedLocation.phraseIndex) === kit.id;
          return <article
            className="phrase-kit-card insertable-item"
            data-applied={applied}
            data-insertable="true"
            data-dragging={draggingSource === `phrase-kit:${kit.id}`}
            draggable={compatible}
            onDragStart={(event) => startInsertDrag(event, { kind: 'phrase-kit', kitId: kit.id, label: kit.label }, `phrase-kit:${kit.id}`)}
            onDragEnd={finishInsertDrag}
            key={kit.id}
          >
            <div><span>{kit.section} · {kit.character}</span><strong>{kit.label}</strong></div>
            <p>{kit.description}</p>
            <div className="phrase-kit-tags">{kit.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <small>{kit.chordRhythm.toUpperCase()} · {kit.patterns.bass} / {kit.patterns.arp} / {kit.patterns.drum}</small>
            <button type="button" disabled={!compatible} aria-pressed={applied} aria-label={`${kit.label}をフレーズ${selectedLocation.phraseIndex + 1}へ挿入`} onClick={() => applyPhraseKit(kit.id, kit.label)}>{!compatible ? 'Major keyで使用' : applied ? '適用中' : '4小節へ挿入'}</button>
          </article>;
        })}</div>
      </section>

      <div className="performance-deck" data-pattern-panel="chord-live" hidden={activeWorkspaceTab !== 'chord-live'}>
        <section className="voice-deck" aria-labelledby="chord-timbre-title">
          <div className="voice-readout">
            <span>コードを鳴らす音色 · {BUILT_IN_TONAL_ASSETS.length}</span>
            <strong id="chord-timbre-title">{currentTimbre.name}</strong>
            <small>コードパッドの現在音色 · {currentTimbre.category.toUpperCase()} / {currentTimbre.synthesis?.roleTags.join(' · ')}</small>
          </div>
          <nav className="voice-family-tabs" aria-label="コード音色の種類">
            {VOICE_FAMILIES.map((family) => <button type="button" aria-current={voiceFamily === family.id ? 'page' : undefined} onClick={() => setVoiceFamily(family.id)} key={family.id}>{family.label}<small>{BUILT_IN_TONAL_ASSETS.filter((asset) => asset.category === family.id).length}</small></button>)}
          </nav>
          <div className="voice-keys" aria-label={`${voiceFamily}音色`}>
            {familyTimbres.map((asset) => <button type="button" aria-pressed={chordTrack?.instrumentId === asset.id} aria-label={`${asset.name} ${asset.description}`} onClick={() => selectTimbre(asset.id)} key={asset.id}><span aria-hidden="true">{asset.character === 'wide' ? '≋' : asset.character === 'sparkling' ? '✦' : asset.character === 'punchy' ? '▰' : asset.character === 'soft' ? '◒' : '▪'}</span><strong>{asset.name}</strong></button>)}
          </div>
        </section>

        <section className="rhythm-deck" aria-labelledby="chord-rhythm-title">
          <div><span>PLAY SHAPE</span><strong id="chord-rhythm-title">{CHORD_PATTERN_RHYTHMS.find((rhythm) => rhythm.id === rhythmId)?.label}</strong></div>
          <div className="rhythm-options">{CHORD_PATTERN_RHYTHMS.map((rhythm) => <button type="button" aria-pressed={rhythmId === rhythm.id} title={rhythm.timbreTags.join(' · ')} onClick={() => setRhythmId(rhythm.id)} key={rhythm.id}><strong>{rhythm.label}</strong><small>{rhythm.description}</small></button>)}</div>
        </section>
      </div>

      <section className="progression-deck" data-insert-target="score" aria-labelledby="progression-title">
        <header className="score-target-toolbar">
          <h3 className="visually-hidden" id="progression-title">コード譜を編集</h3>
          <div className="score-target-state"><span>INSERT TARGET</span><strong>PHRASE {String(selectedLocation.phraseIndex + 1).padStart(2, '0')}</strong><small>BAR {selectedLocation.phraseIndex * 4 + 1}–{selectedLocation.phraseIndex * 4 + 4} · STEP {selectedLocation.stepIndex + 1}</small></div>
          <div className="score-meter"><strong>{phrases.length * 4}小節</strong><small>4/4 · 8分音符単位</small></div>
          <div className="pattern-length" aria-label="小節を追加・削除">
            <button type="button" onClick={addPhrase}>＋ 4小節</button>
            <button type="button" onClick={removeLastPhrase} disabled={phrases.length <= 1}>最後の4小節を削除</button>
          </div>
        </header>
        <div className="score-playback-flow" aria-label="コード譜から曲全体を試聴"><span>このコード譜</span><b aria-hidden="true">→</b><span>{currentTimbre.name}</span><b aria-hidden="true">→</b><button type="button" aria-pressed={playing} onClick={toggleFullPreview}>{playing ? '■ 停止' : '▶ コード・伴奏込みで全曲試聴'}</button><small>{playbackMessage ?? '上の譜面を現在音色で鳴らします'}</small></div>
        <div className="progression-score" aria-label={`${phrases.length * 4}小節のコード譜`}>
          {Array.from({ length: Math.ceil(phrases.length / 2) }, (_, rowIndex) => (
            <section className="progression-score-row" aria-label={`譜面 ${rowIndex + 1}行目`} key={rowIndex}>
              <div className="score-row-label"><span>SCORE ROW {String(rowIndex + 1).padStart(2, '0')}</span><small>BAR {rowIndex * 8 + 1}–{Math.min(phrases.length * 4, rowIndex * 8 + 8)}</small></div>
              <div className="score-row-phrases">
                {phrases.slice(rowIndex * 2, rowIndex * 2 + 2).map((phrase, localIndex) => {
                  const phraseIndex = rowIndex * 2 + localIndex;
                  const slots = slotsForPhrase(phraseIndex, phrase);
                  return <article
                    className="progression-phrase"
                    data-phrase={phraseIndex + 1}
                    data-drop-ready={canDropOnPhrase(activeInsertDrag)}
                    data-drop-target={dropTarget === `phrase:${phraseIndex}`}
                    onDragEnter={(event) => { if (acceptsCurrentDrag(event, 'phrase')) setDropTarget(`phrase:${phraseIndex}`); }}
                    onDragOver={(event) => { if (acceptsCurrentDrag(event, 'phrase')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } }}
                    onDrop={(event) => dropOnPhrase(event, phraseIndex)}
                    key={phraseIndex}
                  >
                    {canDropOnPhrase(activeInsertDrag) && <span className="drop-callout" aria-hidden="true">ここへ4小節挿入</span>}
                    <header className="phrase-heading">
                      <div><span>PHRASE {String(phraseIndex + 1).padStart(2, '0')}</span><strong>BAR {phraseIndex * 4 + 1}–{phraseIndex * 4 + 4}</strong></div>
                      <div className="phrase-step-count" aria-label={`フレーズ${phraseIndex + 1}のコード数`}>
                        <small>4小節内</small>
                        <button type="button" aria-pressed={phrase.stepCount === 4} onClick={() => setPhraseSteps(phraseIndex, 4)}>4コード</button>
                        <button type="button" aria-pressed={phrase.stepCount === 8} onClick={() => setPhraseSteps(phraseIndex, 8)}>8コード</button>
                      </div>
                    </header>
                    <div className="progression-ruler" aria-label={`フレーズ${phraseIndex + 1}の4小節位置`}>{[1, 2, 3, 4].map((bar) => <span key={bar}>BAR {phraseIndex * 4 + bar}</span>)}</div>
                    <div className="progression-rail" aria-label={`フレーズ${phraseIndex + 1}のコード進行`}>
                      {slots.map((slot) => <article
                        className="pattern-slot"
                        data-selected={slot.phraseIndex === selectedLocation.phraseIndex && slot.stepIndex === selectedLocation.stepIndex}
                        data-filled={Boolean(slot.block)}
                        data-auto={slot.stepIndex === phrase.autoStepIndex}
                        data-drop-ready={canDropOnStep(activeInsertDrag)}
                        data-drop-target={dropTarget === `step:${slot.phraseIndex}:${slot.stepIndex}`}
                        onDragEnter={(event) => { event.stopPropagation(); if (acceptsCurrentDrag(event, 'step')) setDropTarget(`step:${slot.phraseIndex}:${slot.stepIndex}`); }}
                        onDragOver={(event) => { event.stopPropagation(); if (acceptsCurrentDrag(event, 'step')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } }}
                        onDrop={(event) => { event.stopPropagation(); dropOnStep(event, slot.phraseIndex, slot.stepIndex); }}
                        style={{ '--step-eighths': slot.beats / CHORD_STEP_QUANTUM_BEATS } as CSSProperties}
                        key={slot.stepIndex}
                      >
                        {canDropOnStep(activeInsertDrag) && <span className="drop-callout drop-callout-step" aria-hidden="true">コード</span>}
                        <button type="button" className="pattern-slot-select" aria-pressed={slot.phraseIndex === selectedLocation.phraseIndex && slot.stepIndex === selectedLocation.stepIndex} onClick={() => setSelectedLocation({ phraseIndex: slot.phraseIndex, stepIndex: slot.stepIndex })}>
                          <span>STEP {String(slot.stepIndex + 1).padStart(2, '0')}</span><strong>{slot.pad?.symbol ?? '＋'}</strong><small>{slot.identity ? CHORD_PATTERN_RHYTHMS.find((rhythm) => rhythm.id === slot.identity?.rhythmId)?.label : 'EMPTY'}</small>
                        </button>
                        <div className="step-duration" role="group" aria-label={`フレーズ${slot.phraseIndex + 1} ${slot.stepIndex + 1}番目のコードの長さ`}>
                          <button
                            type="button"
                            aria-label={`フレーズ${slot.phraseIndex + 1} ${slot.stepIndex + 1}番目のコードを8分音符ぶん短くする`}
                            title="8分音符ぶん短く"
                            disabled={slot.beats <= CHORD_STEP_QUANTUM_BEATS}
                            onClick={() => changeStepBeats(slot.phraseIndex, slot.stepIndex, slot.beats - CHORD_STEP_QUANTUM_BEATS)}
                          >←</button>
                          <span title={`${beatOptionLabel(slot.beats)}${slot.stepIndex === phrase.autoStepIndex ? ' · 残り拍を自動調整' : ''}`}><small>{slot.stepIndex === phrase.autoStepIndex ? 'AUTO' : 'LENGTH'}</small><strong>{slot.beats}拍</strong></span>
                          <button
                            type="button"
                            aria-label={`フレーズ${slot.phraseIndex + 1} ${slot.stepIndex + 1}番目のコードを8分音符ぶん長くする`}
                            title="8分音符ぶん長く"
                            disabled={slot.beats >= slot.maxBeats}
                            onClick={() => changeStepBeats(slot.phraseIndex, slot.stepIndex, slot.beats + CHORD_STEP_QUANTUM_BEATS)}
                          >→</button>
                        </div>
                        {slot.block && <button type="button" className="pattern-slot-clear" aria-label={`フレーズ${slot.phraseIndex + 1} ${slot.stepIndex + 1}番目のコードを空にする`} onClick={() => clearStep(slot.phraseIndex, slot.stepIndex)}>×</button>}
                      </article>)}
                    </div>
                  </article>;
                })}
              </div>
            </section>
          ))}
        </div>
      </section>

      <div className="chord-brief-panel" data-insert-target="score"><CreativeBriefPanel project={project} scope="chords" /></div>

      <section className="harmonic-map" data-pattern-panel="chord-live" hidden={activeWorkspaceTab !== 'chord-live'} aria-labelledby="harmonic-map-title">
        <header><strong className="harmonic-key-readout" id="harmonic-map-title"><span className="visually-hidden">Harmonic Atlas · </span>{project.musicalGrid.key}</strong><div className="chord-band-legend">{(['stable', 'color', 'surprise'] as const).map((band) => <span data-band={band} key={band}><b>{BAND_LABELS[band]}</b>{BAND_HELP[band]}</span>)}</div></header>
        <div className="harmonic-map-scroll">
          <div className="harmonic-map-grid">
            {catalog.map((pad) => <button
              type="button"
              className="chord-pad"
              data-band={pad.band}
              data-holding={holdingPadId === pad.id}
              style={{ '--map-column': pad.mapColumn, '--map-row': pad.mapRow } as CSSProperties}
              aria-label={`${pad.symbol} ${pad.degreeLabel} ${pad.character} ${BAND_LABELS[pad.band]}。押している間鳴ります`}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.currentTarget.setPointerCapture?.(event.pointerId);
                startPadHold(pad.id, pad.symbol);
              }}
              onPointerUp={(event) => {
                if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture?.(event.pointerId);
                stopPadHold();
              }}
              onPointerCancel={stopPadHold}
              onLostPointerCapture={stopPadHold}
              onClick={() => {
                if (suppressClickRef.current === pad.id) {
                  suppressClickRef.current = null;
                  if (suppressResetTimerRef.current !== null) window.clearTimeout(suppressResetTimerRef.current);
                  suppressResetTimerRef.current = null;
                  return;
                }
                placePad(pad.id, pad.symbol, true);
              }}
              key={pad.id}
            ><span className="chord-band-mark">{BAND_LABELS[pad.band]}</span><span>{pad.degreeLabel}</span><strong>{pad.symbol}</strong><small>{pad.character}</small><span
              className="insert-grip"
              draggable
              data-dragging={draggingSource === `chord:${pad.id}`}
              title={`${pad.symbol}をSTEPへドラッグ`}
              aria-hidden="true"
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              onDragStart={(event) => { event.stopPropagation(); startInsertDrag(event, { kind: 'chord', padId: pad.id, label: pad.symbol }, `chord:${pad.id}`); }}
              onDragEnd={(event) => { event.stopPropagation(); finishInsertDrag(); }}
            >⠿</span></button>)}
          </div>
        </div>
      </section>
      <section className="sound-block-shelf" data-pattern-panel="fx-fill" hidden={activeWorkspaceTab !== 'fx-fill'} aria-labelledby="sound-block-shelf-title">
        <header>
          <h3 className="visually-hidden" id="sound-block-shelf-title">複合FXとFillを挿入</h3>
          <span className="insert-shelf-mark"><span>FX / TRANSITION / FILL</span><strong>時間を持つ音のブロック</strong></span>
          <strong>PHRASE {String(selectedLocation.phraseIndex + 1).padStart(2, '0')}</strong>
        </header>
        <div className="sound-block-grid">
          {BUILT_IN_SOUND_CHUNKS.map((chunk) => <article
            className="sound-block-card insertable-item"
            data-role={chunk.role}
            data-insertable="true"
            data-dragging={draggingSource === `sound-chunk:${chunk.id}`}
            draggable
            onDragStart={(event) => startInsertDrag(event, { kind: 'sound-chunk', chunkId: chunk.id, label: chunk.label }, `sound-chunk:${chunk.id}`)}
            onDragEnd={finishInsertDrag}
            key={chunk.id}
          >
            <span>{chunk.role.toUpperCase()} · {(chunk.lengthTick / PPQ).toFixed(chunk.lengthTick % PPQ === 0 ? 0 : 1)}拍</span>
            <strong>{chunk.label}</strong>
            <div>{chunk.tags.map((tag) => <small key={tag}>{tag}</small>)}</div>
            <div className="sound-block-actions">
              <button type="button" aria-label={`${chunk.label}を試聴`} onClick={() => void (onAuditionSoundChunk ? onAuditionSoundChunk(chunk) : engine.audition(chunk.instrumentId))}>▶ 試聴</button>
              <button type="button" aria-label={`${chunk.label}をフレーズ${selectedLocation.phraseIndex + 1}へ挿入`} onClick={() => insertSoundChunk(chunk)}>PHRASE {String(selectedLocation.phraseIndex + 1).padStart(2, '0')}へ挿入</button>
            </div>
          </article>)}
        </div>
      </section>
      <section className="role-pattern-browser" data-pattern-panel="accompaniment" hidden={activeWorkspaceTab !== 'accompaniment'} aria-labelledby="role-pattern-browser-title">
        <header>
          <div><h3 className="visually-hidden" id="role-pattern-browser-title">Bass / Arp / Drum パターンを挿入</h3><span className="insert-shelf-mark"><span>ROLE PATTERNS</span><strong>Bass · Arp · Drum / {ROLE_PATTERN_CATALOG.length}</strong></span></div>
          <div className="role-pattern-target"><span>TARGET PHRASE</span><strong>{String(selectedLocation.phraseIndex + 1).padStart(2, '0')}</strong><small>BAR {selectedLocation.phraseIndex * 4 + 1}–{selectedLocation.phraseIndex * 4 + 4}</small></div>
        </header>
        <div className="role-pattern-columns">
          {(['bass', 'arp', 'drum'] as const).map((role) => {
            const roleTrack = project.tracks.find((track) => track.role === role);
            const instrument = BUILT_IN_AUDIO_ASSETS.find((asset) => asset.id === roleTrack?.instrumentId);
            return <section className="role-pattern-role" data-role={role} aria-labelledby={`role-pattern-${role}`} key={role}>
              <header><div><span>{ROLE_PATTERN_LABELS[role].purpose}</span><strong id={`role-pattern-${role}`}>{ROLE_PATTERN_LABELS[role].label}</strong></div><small>{instrument?.name ?? roleTrack?.instrumentId ?? 'No instrument'}</small></header>
              <div className="role-pattern-list">
                {ROLE_PATTERN_CATALOG.filter((pattern) => pattern.role === role).map((pattern) => {
                  const applied = appliedRolePatternId(project, role, selectedLocation.phraseIndex) === pattern.id;
                  const auditionId = `${role}:${pattern.id}`;
                  return <article
                    className="role-pattern-card insertable-item"
                    data-applied={applied}
                    data-insertable="true"
                    data-dragging={draggingSource === `role-pattern:${role}:${pattern.id}`}
                    draggable
                    onDragStart={(event) => startInsertDrag(event, { kind: 'role-pattern', role, patternId: pattern.id, label: pattern.label }, `role-pattern:${role}:${pattern.id}`)}
                    onDragEnd={finishInsertDrag}
                    key={pattern.id}
                  >
                    <div className="role-pattern-copy"><span>{pattern.density} · {pattern.character}</span><strong>{pattern.label}</strong><small>{pattern.description}</small></div>
                    <div className="role-pattern-actions">
                      <button type="button" aria-label={auditioningRolePattern === auditionId ? `${pattern.label}の試聴を停止` : `${pattern.label}をフレーズ${selectedLocation.phraseIndex + 1}で試聴`} aria-pressed={auditioningRolePattern === auditionId} onClick={() => void auditionRolePattern(pattern)}>{auditioningRolePattern === auditionId ? '■ 停止' : '▶ 試聴'}</button>
                      <button type="button" className="pattern-apply" aria-label={`${pattern.label}をフレーズ${selectedLocation.phraseIndex + 1}へ適用`} aria-pressed={applied} onClick={() => applyRolePattern(pattern)}>{applied ? '適用中' : '適用'}</button>
                    </div>
                  </article>;
                })}
              </div>
            </section>;
          })}
        </div>
      </section>
      <div className="pattern-section-shell" data-pattern-panel="tones" hidden={activeWorkspaceTab !== 'tones'}>
        <AudioPalette
          project={project}
          engine={engine}
          now={now}
          targetPhraseIndex={selectedLocation.phraseIndex}
          onAssetToggle={onAssetToggle}
          onPlaceBuiltInAsset={placeBuiltInAsset}
          onPlaceUserAsset={(asset, phraseIndex) => { onPlaceUserAsset(asset, phraseIndex); setStatus(`${asset.name}をPHRASE ${phraseIndex + 1}へ挿入しました。`); }}
        />
      </div>
      <p className="pattern-status" role="status">{status}</p>
    </section>
  );
}
