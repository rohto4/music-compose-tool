import { BUILT_IN_AUDIO_ASSETS, findBuiltInAudioAsset } from '../../domain/audio';
import {
  CHORD_PROGRESSION_TICKS,
  PPQ,
  chordPadCatalog,
  parseChordPatternAssetId,
} from '../../domain/music';
import type { MusicBlock, Project, TrackRole } from '../../domain/music';

export type CreativeBriefScope = 'song' | 'sounds' | 'arrangement' | 'melody' | 'chords';

export interface ChordScoreSegment {
  symbol: string | null;
  eighths: number;
  beats: number;
}

export interface ChordScoreBar {
  bar: number;
  segments: ChordScoreSegment[];
}

export interface CreativeBriefTrack {
  role: TrackRole;
  name: string;
  instrumentId: string;
  instrumentName: string;
  character: string;
  noteCount: number;
  blockCount: number;
  muted: boolean;
}

export interface PatchtoneCreativeBrief {
  format: 'patchtone-creative-brief';
  version: '1.0';
  constraints: {
    instrumentalOnly: true;
    allowLyrics: false;
    allowVocals: false;
    mainLineType: 'instrumental-melody';
  };
  song: {
    title: string;
    genre: string;
    mood: string[];
    intent: string;
    targetDurationSeconds: number;
    bpm: number;
    key: string;
    meter: string;
  };
  mainLine: {
    source: Project['melody']['source'];
    instrumentName: string;
    noteCount: number;
    pitchLocked: boolean;
    timingLocked: boolean;
  };
  tracks: CreativeBriefTrack[];
  selectedSoundPieces: Array<{ id: string; name: string; category: string }>;
  arrangement: Array<{ label: string; role: string; startBar: number; bars: number; energyStart: number; energyEnd: number }>;
  harmony: {
    bars: ChordScoreBar[];
    totalBars: number;
    abc: string;
  };
  generationPrompt: string;
}

const ROLE_PURPOSE: Partial<Record<TrackRole, string>> = {
  melody: '主線メロディ',
  lead: '前面のリード',
  chord: '和音とコード進行',
  bass: '低域と推進',
  drum: 'ビート',
  pad: '奥行きと補強',
  arp: '細かな動き',
  synth: '中域の彩り',
  percussion: 'アクセント',
  fx: '効果音',
  transition: '展開の接続',
  audio: '配置音声',
  reference: '参照素材',
};

function chordBlocks(project: Project): MusicBlock[] {
  return project.tracks
    .filter((track) => track.role === 'chord')
    .flatMap((track) => track.lanes.flatMap((lane) => lane.blocks))
    .filter((block) => parseChordPatternAssetId(block.assetId) !== null)
    .toSorted((left, right) => left.startTick - right.startTick || left.id.localeCompare(right.id));
}

function chordScoreEndTick(project: Project, blocks: readonly MusicBlock[]): number {
  const blockEnd = blocks.reduce((max, block) => Math.max(max, block.startTick + block.durationTick), 0);
  const loopEnd = project.loop.enabled ? project.loop.endTick : 0;
  const contentEnd = Math.max(blockEnd, loopEnd);
  return contentEnd > 0 ? Math.ceil(contentEnd / CHORD_PROGRESSION_TICKS) * CHORD_PROGRESSION_TICKS : 0;
}

export function buildChordScore(project: Project): ChordScoreBar[] {
  const blocks = chordBlocks(project);
  const endTick = chordScoreEndTick(project, blocks);
  if (endTick === 0) return [];
  const tickPerEighth = PPQ / 2;
  const totalEighths = Math.round(endTick / tickPerEighth);
  const symbols = Array<string | null>(totalEighths).fill(null);
  const definitions = new Map(chordPadCatalog(project.musicalGrid.key).map((pad) => [pad.id, pad.symbol]));
  for (const block of blocks) {
    const identity = parseChordPatternAssetId(block.assetId);
    const symbol = identity ? definitions.get(identity.padId) : undefined;
    if (!symbol) continue;
    const start = Math.max(0, Math.round(block.startTick / tickPerEighth));
    const end = Math.min(totalEighths, Math.round((block.startTick + block.durationTick) / tickPerEighth));
    for (let eighth = start; eighth < end; eighth += 1) symbols[eighth] = symbol;
  }
  const bars: ChordScoreBar[] = [];
  for (let barIndex = 0; barIndex < totalEighths / 8; barIndex += 1) {
    const values = symbols.slice(barIndex * 8, barIndex * 8 + 8);
    const segments: ChordScoreSegment[] = [];
    for (const symbol of values) {
      const previous = segments.at(-1);
      if (previous?.symbol === symbol) {
        previous.eighths += 1;
        previous.beats = previous.eighths / 2;
      } else {
        segments.push({ symbol, eighths: 1, beats: .5 });
      }
    }
    bars.push({ bar: barIndex + 1, segments });
  }
  return bars;
}

function durationLabel(beats: number): string {
  const names = new Map<number, string>([[.5, '8分音符'], [1, '4分音符'], [1.5, '付点4分音符'], [2, '2分音符'], [3, '付点2分音符'], [4, '全音符']]);
  const name = names.get(beats);
  return `${beats}拍${name ? `・${name}` : ''}`;
}

export function createReadableChordChart(project: Project): string {
  const bars = buildChordScore(project);
  if (bars.length === 0) return 'コード進行: 未設定';
  return bars.map((bar) => `BAR ${String(bar.bar).padStart(2, '0')} | ${bar.segments.map((segment) => `${segment.symbol ?? 'N.C.'} (${durationLabel(segment.beats)})`).join(' | ')}`).join('\n');
}

function abcKey(key: string): string {
  const [root = 'C', quality = 'major'] = key.trim().split(/\s+/);
  return quality.toLowerCase().startsWith('min') ? `${root}m` : root;
}

function abcRest(eighths: number): string {
  return eighths === 1 ? 'z' : `z${eighths}`;
}

export function createAbcChordScore(project: Project): string {
  const bars = buildChordScore(project);
  const body = bars.length > 0
    ? bars.map((bar) => `${bar.segments.map((segment) => `${segment.symbol ? `"${segment.symbol}"` : ''}${abcRest(segment.eighths)}`).join(' ')} |`).join('\n')
    : 'z8 |';
  return [
    'X:1',
    `T:${project.title || 'Patchtone Chord Score'}`,
    'C:Patchtone',
    'M:4/4',
    'L:1/8',
    `Q:1/4=${project.musicalGrid.bpm}`,
    `K:${abcKey(project.musicalGrid.key)}`,
    '% Instrumental only. Chord symbols are attached to eighth-note rests as timing carriers.',
    `${body.slice(0, -1)}|]`,
  ].join('\n');
}

function trackBrief(project: Project): CreativeBriefTrack[] {
  return project.tracks.map((track) => {
    const asset = findBuiltInAudioAsset(track.instrumentId);
    return {
      role: track.role,
      name: track.name,
      instrumentId: track.instrumentId,
      instrumentName: asset?.name ?? track.instrumentId,
      character: asset ? `${asset.character}; ${asset.description}` : 'user or generated sound',
      noteCount: track.lanes.reduce((sum, lane) => sum + lane.notes.length, 0),
      blockCount: track.lanes.reduce((sum, lane) => sum + lane.blocks.length + lane.audioClips.length, 0),
      muted: track.muted,
    };
  });
}

function generationPrompt(project: Project, tracks: readonly CreativeBriefTrack[], chordChart: string): string {
  const genre = project.creativeIntent.genre === 'cute-future-core' ? 'cute Future Core' : 'cute Future Bass';
  const roles = tracks
    .filter((track) => !track.muted && ['melody', 'lead', 'chord', 'bass', 'drum', 'pad', 'arp', 'synth'].includes(track.role))
    .map((track) => `${ROLE_PURPOSE[track.role] ?? track.role}: ${track.instrumentName} (${track.character})`)
    .join('; ');
  const sections = project.arrangement.sections.map((section) => `${section.label} ${section.bars} bars`).join(' -> ');
  return [
    'Instrumental only. No vocals, no singer, no spoken words, and no lyrics.',
    `Create a ${genre} instrumental in ${project.musicalGrid.key}, ${project.musicalGrid.meter}, ${project.musicalGrid.bpm} BPM, around ${project.creativeIntent.targetDurationSeconds} seconds.`,
    `Mood: ${project.creativeIntent.mood.join(', ') || 'not specified'}.`,
    project.creativeIntent.freeText.trim() ? `Creative direction: ${project.creativeIntent.freeText.trim()}` : '',
    `Instrumental roles: ${roles}.`,
    `Arrangement: ${sections}.`,
    `Chord score with exact chord lengths:\n${chordChart}`,
    'Keep the main line as an editable instrumental melody; do not reinterpret it as a vocal part.',
  ].filter(Boolean).join('\n');
}

export function buildCreativeBrief(project: Project): PatchtoneCreativeBrief {
  const tracks = trackBrief(project);
  const melodyTrack = project.tracks.find((track) => track.id === project.melody.trackId) ?? project.tracks.find((track) => track.role === 'melody');
  const melodyAsset = melodyTrack ? findBuiltInAudioAsset(melodyTrack.instrumentId) : undefined;
  const chordChart = createReadableChordChart(project);
  const selectedSoundPieces = project.assetRefs.map((id) => {
    const asset = BUILT_IN_AUDIO_ASSETS.find((candidate) => candidate.id === id);
    return { id, name: asset?.name ?? id, category: asset?.category ?? 'user' };
  });
  const harmonyBars = buildChordScore(project);
  return {
    format: 'patchtone-creative-brief',
    version: '1.0',
    constraints: { instrumentalOnly: true, allowLyrics: false, allowVocals: false, mainLineType: 'instrumental-melody' },
    song: {
      title: project.title,
      genre: project.creativeIntent.genre,
      mood: [...project.creativeIntent.mood],
      intent: project.creativeIntent.freeText,
      targetDurationSeconds: project.creativeIntent.targetDurationSeconds,
      bpm: project.musicalGrid.bpm,
      key: project.musicalGrid.key,
      meter: project.musicalGrid.meter,
    },
    mainLine: {
      source: project.melody.source,
      instrumentName: melodyAsset?.name ?? melodyTrack?.instrumentId ?? 'not assigned',
      noteCount: melodyTrack?.lanes.reduce((sum, lane) => sum + lane.notes.length, 0) ?? 0,
      pitchLocked: project.melody.lockPitch,
      timingLocked: project.melody.lockTiming,
    },
    tracks,
    selectedSoundPieces,
    arrangement: project.arrangement.sections.map((section) => ({ label: section.label, role: section.role, startBar: section.startBar + 1, bars: section.bars, energyStart: section.energyStart, energyEnd: section.energyEnd })),
    harmony: { bars: harmonyBars, totalBars: harmonyBars.length, abc: createAbcChordScore(project) },
    generationPrompt: generationPrompt(project, tracks, chordChart),
  };
}

function trackLines(brief: PatchtoneCreativeBrief): string[] {
  return brief.tracks
    .filter((track) => !track.muted && ['melody', 'lead', 'chord', 'bass', 'drum', 'pad', 'arp', 'synth'].includes(track.role))
    .map((track) => `- ${ROLE_PURPOSE[track.role] ?? track.role}: ${track.instrumentName} — ${track.character}（notes ${track.noteCount} / pieces ${track.blockCount}）`);
}

export function createCreativeBriefMarkdown(project: Project): string {
  const brief = buildCreativeBrief(project);
  const chordChart = createReadableChordChart(project);
  return [
    `# ${brief.song.title || 'Untitled'} — Instrumental Creative Brief`,
    '',
    '## 生成時の固定制約',
    '',
    '- Instrumental only（歌詞なし・歌声なし・spoken wordなし）',
    '- 主線はLead / Melody楽器として扱い、vocalへ置き換えない',
    '- 外部生成アプリではInstrumental modeを有効にする',
    '',
    '## 曲の設計',
    '',
    `- Genre: ${brief.song.genre}`,
    `- Mood: ${brief.song.mood.join(' / ') || '未設定'}`,
    `- Key / Meter / Tempo: ${brief.song.key} / ${brief.song.meter} / ${brief.song.bpm} BPM`,
    `- Target length: ${brief.song.targetDurationSeconds} sec`,
    `- Direction: ${brief.song.intent || '未設定'}`,
    '',
    '## 主線と音の役割',
    '',
    `- 主線: ${brief.mainLine.instrumentName} / ${brief.mainLine.source} / ${brief.mainLine.noteCount} notes`,
    ...trackLines(brief),
    '',
    '## 曲構成',
    '',
    ...brief.arrangement.map((section) => `- BAR ${section.startBar}–${section.startBar + section.bars - 1}: ${section.label} (${section.role}) / energy ${section.energyStart}→${section.energyEnd}`),
    '',
    '## コード譜',
    '',
    '```text',
    chordChart,
    '```',
    '',
    '## 外部／ローカルAIへ渡すPrompt',
    '',
    '```text',
    brief.generationPrompt,
    '```',
    '',
  ].join('\n');
}

export function createCreativeBriefJson(project: Project): string {
  return `${JSON.stringify(buildCreativeBrief(project), null, 2)}\n`;
}

export function createPromptFragment(project: Project, scope: CreativeBriefScope): string {
  const brief = buildCreativeBrief(project);
  const constraint = 'Instrumental only. No vocals, no spoken words, and no lyrics.';
  if (scope === 'chords') return `${constraint}\n${createReadableChordChart(project)}`;
  if (scope === 'sounds') return [constraint, 'Instrumental roles:', ...trackLines(brief)].join('\n');
  if (scope === 'arrangement') return [constraint, `Arrangement: ${brief.arrangement.map((section) => `${section.label} ${section.bars} bars`).join(' -> ')}`, createReadableChordChart(project)].join('\n');
  if (scope === 'melody') return [constraint, `Main instrumental line: ${brief.mainLine.instrumentName}; source ${brief.mainLine.source}; ${brief.mainLine.noteCount} notes.`, 'Keep pitch and timing editable. Do not turn this line into a vocal.'].join('\n');
  return brief.generationPrompt;
}

export function creativeBriefFileStem(project: Project): string {
  return (project.title || 'patchtone').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').slice(0, 80) || 'patchtone';
}
