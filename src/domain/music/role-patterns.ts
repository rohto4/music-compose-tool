import { CHORD_PROGRESSION_TICKS, chordPadRootPitchClass, chordPadRootPositionPitches, parseChordPatternAssetId } from './chord-patterns';
import { PPQ } from './types';
import type { MusicBlock, NoteEvent, Project } from './types';

export type RolePatternRole = 'bass' | 'arp' | 'drum';
export type RolePatternDensity = 'SPARSE' | 'BALANCED' | 'DENSE';

export interface RolePatternDefinition {
  id: string;
  role: RolePatternRole;
  label: string;
  density: RolePatternDensity;
  character: string;
  description: string;
}

export const ROLE_PATTERN_CATALOG: readonly RolePatternDefinition[] = [
  { id: 'anchor', role: 'bass', label: 'Anchor Notes', density: 'SPARSE', character: 'support', description: 'コード頭を長く支える。Verse / Break向け。' },
  { id: 'quarter-pump', role: 'bass', label: 'Quarter Pump', density: 'BALANCED', character: 'sidechain', description: '4分ごとにrootを刻むFuture Bassの土台。' },
  { id: 'eighth-drive', role: 'bass', label: 'Eighth Drive', density: 'DENSE', character: 'driving', description: '8分でrootとoctaveを交互に鳴らす。' },
  { id: 'sync-bounce', role: 'bass', label: 'Sync Bounce', density: 'BALANCED', character: 'syncopated', description: '裏拍を混ぜ、Dropに弾む推進を足す。' },
  { id: 'octave-drop', role: 'bass', label: 'Octave Drop', density: 'DENSE', character: 'foreground', description: '低rootと上octaveを大きく往復する。' },
  { id: 'sub-glue', role: 'bass', label: 'Sub Glue', density: 'SPARSE', character: 'deep', description: '低いsubを小節単位で伸ばし全体を接着する。' },
  { id: 'dotted-hop', role: 'bass', label: 'Dotted Hop', density: 'BALANCED', character: 'bouncy', description: '付点4分の間隔でrootとoctaveを跳ねる。' },
  { id: 'fifth-answer', role: 'bass', label: 'Fifth Answer', density: 'BALANCED', character: 'dialogue', description: 'rootへ5thが応答する2音の会話を作る。' },
  { id: 'gate-sixteenth', role: 'bass', label: 'Gate 16', density: 'DENSE', character: 'gated', description: '短い16分gateでCoreの隙間を細かく押す。' },
  { id: 'climb-turn', role: 'bass', label: 'Climb & Turn', density: 'DENSE', character: 'rising', description: 'root・5th・octaveを上がって折り返す。' },
  { id: 'rise-eighth', role: 'arp', label: 'Rising Eighths', density: 'BALANCED', character: 'sparkling', description: 'コードtoneを8分で上昇する基本形。' },
  { id: 'fall-eighth', role: 'arp', label: 'Falling Eighths', density: 'BALANCED', character: 'soft', description: '上から下降し、Padの隙間を埋める。' },
  { id: 'updown-sixteenth', role: 'arp', label: 'Up / Down 16', density: 'DENSE', character: 'driving', description: '16分の往復でBuildとCoreを加速する。' },
  { id: 'offbeat-sparkle', role: 'arp', label: 'Offbeat Sparkle', density: 'SPARSE', character: 'air', description: '裏8分だけを短く鳴らし透明感を足す。' },
  { id: 'wide-skip', role: 'arp', label: 'Wide Skip', density: 'BALANCED', character: 'wide', description: 'root・5th・高音を跳躍して広げる。' },
  { id: 'quarter-chime', role: 'arp', label: 'Quarter Chime', density: 'SPARSE', character: 'calm', description: '4分ごとにコードtoneを一音ずつ置く。' },
  { id: 'cascade-sixteenth', role: 'arp', label: 'Cascade 16', density: 'DENSE', character: 'falling', description: '高音から16分で流れ落ちるcascade。' },
  { id: 'pedal-star', role: 'arp', label: 'Pedal Star', density: 'BALANCED', character: 'pedal', description: 'rootを軸に高いtoneを交互に光らせる。' },
  { id: 'high-answer', role: 'arp', label: 'High Answer', density: 'SPARSE', character: 'dialogue', description: '低い合図へ1octave上の音が応答する。' },
  { id: 'staircase-eighth', role: 'arp', label: 'Staircase Eighths', density: 'BALANCED', character: 'stepping', description: '8分で三和音を階段状に往復する。' },
  { id: 'half-time', role: 'drum', label: 'Future Half-time', density: 'BALANCED', character: 'future-bass', description: '3拍目clapと8分hatのFuture Bass基盤。' },
  { id: 'four-floor', role: 'drum', label: 'Core Four Floor', density: 'DENSE', character: 'future-core', description: '4つ打ちkickと2 / 4拍clapで押し切る。' },
  { id: 'broken-bounce', role: 'drum', label: 'Broken Bounce', density: 'BALANCED', character: 'syncopated', description: 'ずらしたkickでコードの隙間を跳ねる。' },
  { id: 'build-sixteenth', role: 'drum', label: 'Build 16 Hats', density: 'DENSE', character: 'build', description: '16分hatと強くなるaccentで上昇を作る。' },
  { id: 'minimal-space', role: 'drum', label: 'Minimal Space', density: 'SPARSE', character: 'support', description: 'kick / clap / open hatを絞り余白を残す。' },
  { id: 'two-step', role: 'drum', label: 'Dusk Two-step', density: 'BALANCED', character: 'garage', description: '1・3拍を外したkickと遅いclapで揺らす。' },
  { id: 'kick-rest', role: 'drum', label: 'Kick & Rest', density: 'SPARSE', character: 'breathing', description: '強いkickの後へ大きな余白を作る。' },
  { id: 'clap-rush', role: 'drum', label: 'Clap Rush', density: 'DENSE', character: 'fill', description: '小節終端のclap連打で次へ押し込む。' },
  { id: 'tom-fill', role: 'drum', label: 'Soft Tom Fill', density: 'BALANCED', character: 'transition', description: '低いtomを下行させsection境界をつなぐ。' },
  { id: 'open-hat-drive', role: 'drum', label: 'Open Hat Drive', density: 'DENSE', character: 'driving', description: '裏拍open hatと4つ打ちで前へ進める。' },
  { id: 'trap-hat-roll', role: 'drum', label: 'Trap Hat Roll', density: 'DENSE', character: 'future-bass', description: 'half-timeの上で終端hatを32分へ加速する。' },
  { id: 'house-backbeat', role: 'drum', label: 'House Backbeat', density: 'BALANCED', character: 'house', description: '4つ打ちと2・4拍clap、裏open hatの定番形。' },
  { id: 'snare-accelerator', role: 'drum', label: 'Snare Accelerator', density: 'DENSE', character: 'build', description: '4分から32分へ段階的にsnare密度を上げる。' },
  { id: 'ghost-pocket', role: 'drum', label: 'Ghost Pocket', density: 'BALANCED', character: 'groove', description: '小さなghost snareと遅いhatで跳ねを作る。' },
  { id: 'kick-switch', role: 'drum', label: 'Kick Switch', density: 'BALANCED', character: 'syncopated', description: '小節ごとにkick位置を切り替えて予測を外す。' },
  { id: 'rim-garage', role: 'drum', label: 'Rim Garage', density: 'SPARSE', character: 'garage', description: 'rim clickとskipping kickで軽い2-stepを作る。' },
  { id: 'break-chop', role: 'drum', label: 'Break Chop', density: 'DENSE', character: 'breakbeat', description: 'kickとsnareを交互に細かく切るbreakbeat。' },
  { id: 'crash-entry', role: 'drum', label: 'Crash Entry', density: 'SPARSE', character: 'section-start', description: '4小節頭のcrashと最小grooveで入口を示す。' },
  { id: 'open-hat-turn', role: 'drum', label: 'Open Hat Turn', density: 'BALANCED', character: 'variation', description: '裏open hatを最終小節だけ細かく入れ替える。' },
  { id: 'tom-cascade', role: 'drum', label: 'Tom Cascade', density: 'BALANCED', character: 'fill', description: '最後の1小節を高いtomから低いtomへ流す。' },
  { id: 'clap-stutter', role: 'drum', label: 'Clap Stutter', density: 'DENSE', character: 'fill', description: 'section終端でclapを16分stutterさせる。' },
  { id: 'drop-pause', role: 'drum', label: 'Drop Pause', density: 'SPARSE', character: 'tension', description: '最後の半拍を空けて次のdropを大きく見せる。' },
] as const;

const ROLE_NOTE_PREFIX = 'role-pattern|v1|';

export interface RolePatternNoteIdentity {
  role: RolePatternRole;
  patternId: string;
  phraseIndex: number;
}

export function rolePatternById(role: RolePatternRole, patternId: string): RolePatternDefinition | undefined {
  return ROLE_PATTERN_CATALOG.find((pattern) => pattern.role === role && pattern.id === patternId);
}

export function parseRolePatternNoteId(id: string): RolePatternNoteIdentity | null {
  if (!id.startsWith(ROLE_NOTE_PREFIX)) return null;
  const [role, patternId, phraseText, noteText, extra] = id.slice(ROLE_NOTE_PREFIX.length).split('|');
  const phraseIndex = Number(phraseText);
  const noteIndex = Number(noteText);
  if (extra || !role || !patternId || !['bass', 'arp', 'drum'].includes(role) || !rolePatternById(role as RolePatternRole, patternId) || !Number.isInteger(phraseIndex) || phraseIndex < 0 || !Number.isInteger(noteIndex) || noteIndex < 0) return null;
  return { role: role as RolePatternRole, patternId, phraseIndex };
}

function patternNoteId(role: RolePatternRole, patternId: string, phraseIndex: number, noteIndex: number): string {
  return `${ROLE_NOTE_PREFIX}${role}|${patternId}|${phraseIndex}|${noteIndex}`;
}

function note(id: string, pitch: number, startTick: number, durationTick: number, velocity: number): NoteEvent {
  return {
    id,
    pitch: Math.max(0, Math.min(127, Math.round(pitch))),
    startTick: Math.max(0, Math.round(startTick)),
    durationTick: Math.max(1, Math.round(durationTick)),
    velocity: Math.max(1, Math.min(127, Math.round(velocity))),
    source: 'generated',
    confidence: null,
    userEdited: false,
    lockPitch: false,
    lockTiming: false,
  };
}

function chordBlocksForPhrase(project: Project, phraseIndex: number): MusicBlock[] {
  const phraseStart = phraseIndex * CHORD_PROGRESSION_TICKS;
  const phraseEnd = phraseStart + CHORD_PROGRESSION_TICKS;
  return project.tracks
    .filter((track) => track.role === 'chord')
    .flatMap((track) => track.lanes.flatMap((lane) => lane.blocks))
    .filter((block) => parseChordPatternAssetId(block.assetId) && block.startTick >= phraseStart && block.startTick < phraseEnd)
    .sort((left, right) => left.startTick - right.startTick || left.id.localeCompare(right.id));
}

function bassSteps(patternId: string, durationTick: number): Array<{ offset: number; octave: number; duration: number; velocity: number }> {
  const bounded = (steps: Array<{ offset: number; octave: number; duration: number; velocity: number }>) => steps.filter((step) => step.offset < durationTick);
  if (patternId === 'anchor') return bounded([{ offset: 0, octave: 0, duration: durationTick - 30, velocity: 88 }]);
  if (patternId === 'quarter-pump') return bounded(Array.from({ length: Math.ceil(durationTick / PPQ) }, (_, index) => ({ offset: index * PPQ, octave: 0, duration: PPQ * .78, velocity: index === 0 ? 104 : 92 })));
  if (patternId === 'eighth-drive') return bounded(Array.from({ length: Math.ceil(durationTick / (PPQ / 2)) }, (_, index) => ({ offset: index * PPQ / 2, octave: index % 2 ? 12 : 0, duration: PPQ * .36, velocity: index % 2 ? 86 : 102 })));
  if (patternId === 'sync-bounce') {
    const motif = [0, .75, 1.5, 2.5, 3.25];
    return bounded(Array.from({ length: Math.ceil(durationTick / (4 * PPQ)) }, (_, bar) => motif.map((beat, index) => ({ offset: (bar * 4 + beat) * PPQ, octave: index % 3 === 1 ? 12 : 0, duration: PPQ * .48, velocity: index === 0 ? 106 : 90 + index * 2 }))).flat());
  }
  if (patternId === 'sub-glue') return bounded(Array.from({ length: Math.ceil(durationTick / (4 * PPQ)) }, (_, bar) => ({ offset: bar * 4 * PPQ, octave: -12, duration: Math.min(4 * PPQ - 36, durationTick - bar * 4 * PPQ), velocity: 84 })));
  if (patternId === 'dotted-hop') return bounded(Array.from({ length: Math.ceil(durationTick / (PPQ * 1.5)) }, (_, index) => ({ offset: index * PPQ * 1.5, octave: index % 2 ? 12 : 0, duration: PPQ * .82, velocity: index % 4 === 0 ? 106 : 90 })));
  if (patternId === 'fifth-answer') return bounded(Array.from({ length: Math.ceil(durationTick / PPQ) }, (_, index) => ({ offset: index * PPQ, octave: index % 2 ? 7 : 0, duration: PPQ * .62, velocity: index % 2 ? 86 : 104 })));
  if (patternId === 'gate-sixteenth') return bounded(Array.from({ length: Math.ceil(durationTick / (PPQ / 4)) }, (_, index) => ({ offset: index * PPQ / 4, octave: index % 8 === 7 ? 12 : 0, duration: PPQ * .12, velocity: index % 4 === 0 ? 108 : 76 + index % 4 * 5 })));
  if (patternId === 'climb-turn') return bounded(Array.from({ length: Math.ceil(durationTick / (PPQ / 2)) }, (_, index) => ({ offset: index * PPQ / 2, octave: [0, 7, 12, 7][index % 4]!, duration: PPQ * .34, velocity: index % 4 === 0 ? 104 : 88 })));
  return bounded(Array.from({ length: Math.ceil(durationTick / (PPQ / 2)) }, (_, index) => ({ offset: index * PPQ / 2, octave: index % 4 === 3 ? 12 : index % 2 ? 7 : 0, duration: PPQ * .31, velocity: index % 4 === 0 ? 110 : 94 })));
}

function arpSteps(patternId: string, durationTick: number, pitches: readonly number[]): Array<{ offset: number; pitch: number; duration: number; velocity: number }> {
  const up = pitches.map((pitch) => pitch + 12);
  const down = [...up].reverse();
  const create = (quantum: number, sequence: readonly number[], offset = 0, durationScale = .58) => Array.from({ length: Math.ceil(Math.max(0, durationTick - offset) / quantum) }, (_, index) => ({ offset: offset + index * quantum, pitch: sequence[index % sequence.length]!, duration: quantum * durationScale, velocity: index % sequence.length === 0 ? 96 : 78 + index % 3 * 5 })).filter((step) => step.offset < durationTick);
  if (patternId === 'rise-eighth') return create(PPQ / 2, up);
  if (patternId === 'fall-eighth') return create(PPQ / 2, down);
  if (patternId === 'updown-sixteenth') return create(PPQ / 4, [...up, ...down.slice(1, -1)], 0, .66);
  if (patternId === 'offbeat-sparkle') return create(PPQ, [up.at(-1)!, up[1] ?? up[0]!], PPQ / 2, .34);
  if (patternId === 'quarter-chime') return create(PPQ, up, 0, .72);
  if (patternId === 'cascade-sixteenth') return create(PPQ / 4, down, 0, .5);
  if (patternId === 'pedal-star') return create(PPQ / 2, [up[0]!, (up[2] ?? up.at(-1)!) + 12, up[0]!, (up[1] ?? up[0]!) + 12], 0, .4);
  if (patternId === 'high-answer') return create(PPQ * 2, [up[0]!, up.at(-1)! + 12], 0, .58);
  if (patternId === 'staircase-eighth') return create(PPQ / 2, [up[0]!, up[1] ?? up[0]!, up[2] ?? up.at(-1)!, up[1] ?? up[0]!], 0, .56);
  return create(PPQ / 2, [up[0]!, up[2] ?? up.at(-1)!, (up[1] ?? up[0]!) + 12, up.at(-1)!], 0, .48);
}

function drumPatternNotes(patternId: string, phraseIndex: number): NoteEvent[] {
  const phraseStart = phraseIndex * CHORD_PROGRESSION_TICKS;
  const events: Array<{ tick: number; pitch: number; velocity: number; duration: number }> = [];
  const add = (bar: number, beat: number, pitch: number, velocity: number, duration = PPQ / 8) => events.push({ tick: phraseStart + bar * 4 * PPQ + beat * PPQ, pitch, velocity, duration });
  for (let bar = 0; bar < 4; bar += 1) {
    if (patternId === 'half-time') {
      add(bar, 0, 36, 112); add(bar, 2.5, 36, 96); add(bar, 2, 38, 108);
      for (let step = 0; step < 8; step += 1) add(bar, step / 2, 42, step % 2 ? 54 : 68, PPQ / 10);
    } else if (patternId === 'four-floor') {
      for (let beat = 0; beat < 4; beat += 1) add(bar, beat, 36, beat === 0 ? 116 : 104);
      add(bar, 1, 38, 104); add(bar, 3, 38, 110);
      for (let step = 0; step < 8; step += 1) add(bar, step / 2, 42, step % 2 ? 60 : 76, PPQ / 10);
    } else if (patternId === 'broken-bounce') {
      [0, 1.5, 2.75, 3.5].forEach((beat, index) => add(bar, beat, 36, index === 0 ? 114 : 94));
      add(bar, 2, 38, 110);
      [0.5, 1.25, 2.5, 3.25].forEach((beat) => add(bar, beat, 42, 68, PPQ / 10));
    } else if (patternId === 'build-sixteenth') {
      add(bar, 0, 36, 108); add(bar, 2, 36, 98); add(bar, 1, 38, 96); add(bar, 3, 38, 106);
      for (let step = 0; step < 16; step += 1) add(bar, step / 4, 42, 48 + step * 3, PPQ / 12);
    } else if (patternId === 'two-step') {
      [0, 1.75, 3.25].forEach((beat, index) => add(bar, beat, 36, index === 0 ? 112 : 96)); add(bar, 1.9, 38, 108);
      for (let step = 0; step < 8; step += 1) add(bar, step / 2 + (step % 2 ? .08 : 0), 42, 54 + step % 2 * 12, PPQ / 10);
    } else if (patternId === 'kick-rest') {
      add(bar, 0, 36, 118); add(bar, 2.75, 38, 94); add(bar, 3.5, 46, 58, PPQ / 5);
    } else if (patternId === 'clap-rush') {
      add(bar, 0, 36, 110); add(bar, 2, 38, 104);
      [3, 3.25, 3.5, 3.75].forEach((beat, index) => add(bar, beat, 38, 70 + index * 10, PPQ / 12));
    } else if (patternId === 'tom-fill') {
      add(bar, 0, 36, 104); add(bar, 2, 38, 96);
      [3, 3.25, 3.5, 3.75].forEach((beat, index) => add(bar, beat, 45 - index * 2, 76 + index * 6, PPQ / 6));
    } else if (patternId === 'open-hat-drive') {
      for (let beat = 0; beat < 4; beat += 1) { add(bar, beat, 36, beat === 0 ? 116 : 102); add(bar, beat + .5, 46, 72, PPQ / 5); }
      add(bar, 1, 38, 102); add(bar, 3, 38, 108);
    } else if (patternId === 'trap-hat-roll') {
      [0, 1.5, 3].forEach((beat, index) => add(bar, beat, 36, index === 0 ? 116 : 92)); add(bar, 2, 38, 112);
      for (let step = 0; step < 8; step += 1) add(bar, step / 2, 42, step % 2 ? 58 : 72, PPQ / 12);
      if (bar === 3) for (let step = 0; step < 8; step += 1) add(bar, 3 + step / 8, 42, 64 + step * 5, PPQ / 20);
    } else if (patternId === 'house-backbeat') {
      for (let beat = 0; beat < 4; beat += 1) add(bar, beat, 36, beat === 0 ? 118 : 105);
      add(bar, 1, 38, 106); add(bar, 3, 38, 112);
      for (let beat = 0; beat < 4; beat += 1) add(bar, beat + .5, 46, beat === 3 ? 82 : 70, PPQ / 4);
    } else if (patternId === 'snare-accelerator') {
      add(bar, 0, 36, 110);
      const quantum = 1 / (2 ** bar);
      for (let beat = 0; beat < 4; beat += quantum) add(bar, beat, 38, Math.min(124, 58 + bar * 12 + Math.round(beat * 5)), Math.max(PPQ / 24, PPQ * quantum * .32));
    } else if (patternId === 'ghost-pocket') {
      add(bar, 0, 36, 114); add(bar, 1.5, 36, 88); add(bar, 2.75, 36, 98); add(bar, 2, 38, 108);
      add(bar, 1.75, 38, 44); add(bar, 3.5, 38, 52);
      for (let step = 0; step < 8; step += 1) add(bar, step / 2 + (step % 2 ? .07 : 0), 42, step % 2 ? 48 : 66, PPQ / 12);
    } else if (patternId === 'kick-switch') {
      const motifs = [[0, 1.5, 2.75], [0, .75, 2.5, 3.25], [0, 1.25, 2, 3.5], [0, .5, 1.75, 3]];
      motifs[bar]!.forEach((beat, index) => add(bar, beat, 36, index === 0 ? 116 : 94 + index * 3)); add(bar, 2, 38, 106);
      [0.5, 1.5, 2.5, 3.5].forEach((beat) => add(bar, beat, 42, 58, PPQ / 12));
    } else if (patternId === 'rim-garage') {
      [0, 1.75, 3.25].forEach((beat, index) => add(bar, beat, 36, index === 0 ? 112 : 94));
      add(bar, 1, 37, 82); add(bar, 2.75, 37, 92); add(bar, 2, 38, 104);
      [0.5, 1.5, 2.5, 3.5].forEach((beat, index) => add(bar, beat + (index % 2 ? .06 : 0), 42, 54, PPQ / 12));
    } else if (patternId === 'break-chop') {
      [[0, 36], [.75, 42], [1.25, 38], [1.75, 36], [2.25, 38], [3, 36], [3.5, 38]].forEach(([beat, pitch], index) => add(bar, beat!, pitch!, index % 2 ? 94 : 110));
      for (let step = 0; step < 8; step += 1) add(bar, step / 2, 42, step % 3 === 0 ? 72 : 48, PPQ / 14);
    } else if (patternId === 'crash-entry') {
      if (bar === 0) add(bar, 0, 49, 118, PPQ * .8);
      add(bar, 0, 36, 112); add(bar, 2, 38, 102); add(bar, 3.5, 46, 64, PPQ / 4);
    } else if (patternId === 'open-hat-turn') {
      add(bar, 0, 36, 114); add(bar, 2.5, 36, 94); add(bar, 2, 38, 108);
      const spacing = bar === 3 ? .25 : .5;
      for (let beat = .5; beat < 4; beat += spacing) add(bar, beat, beat % 1 === .5 ? 46 : 42, 62 + Math.round(beat * 4), beat % 1 === .5 ? PPQ / 4 : PPQ / 12);
    } else if (patternId === 'tom-cascade') {
      add(bar, 0, 36, 112); add(bar, 2, 38, 104);
      if (bar === 3) [50, 48, 47, 45, 43].forEach((pitch, index) => add(bar, 2.75 + index * .25, pitch, 76 + index * 10, PPQ / 5));
      else [0.5, 1.5, 2.5, 3.5].forEach((beat) => add(bar, beat, 42, 54, PPQ / 12));
    } else if (patternId === 'clap-stutter') {
      add(bar, 0, 36, 112); add(bar, 2, 38, 104);
      for (let step = 0; step < 8; step += 1) add(bar, step / 2, 42, 52 + (step % 2) * 12, PPQ / 12);
      if (bar === 3) for (let step = 0; step < 8; step += 1) add(bar, 2 + step / 4, 38, 58 + step * 8, PPQ / 16);
    } else if (patternId === 'drop-pause') {
      add(bar, 0, 36, 116); add(bar, 1.5, 36, 92); add(bar, 2, 38, 110);
      for (let step = 0; step < (bar === 3 ? 7 : 8); step += 1) add(bar, step / 2, 42, step % 2 ? 52 : 66, PPQ / 12);
      if (bar < 3) add(bar, 3.5, 46, 64, PPQ / 4);
    } else {
      add(bar, 0, 36, 108); add(bar, 2, 38, 102); add(bar, 1.5, 46, 62, PPQ / 5); add(bar, 3.5, 42, 58, PPQ / 10);
    }
  }
  return events.map((event, index) => note(patternNoteId('drum', patternId, phraseIndex, index), event.pitch, event.tick, event.duration, event.velocity));
}

export function generateRolePatternNotes(project: Project, role: RolePatternRole, patternId: string, phraseIndex: number): NoteEvent[] {
  if (!Number.isInteger(phraseIndex) || phraseIndex < 0) throw new Error(`Invalid phrase index: ${phraseIndex}`);
  if (!rolePatternById(role, patternId)) throw new Error(`Unknown ${role} pattern: ${patternId}`);
  if (role === 'drum') return drumPatternNotes(patternId, phraseIndex);
  const result: NoteEvent[] = [];
  for (const block of chordBlocksForPhrase(project, phraseIndex)) {
    const identity = parseChordPatternAssetId(block.assetId);
    if (!identity) continue;
    if (role === 'bass') {
      const rootPitchClass = chordPadRootPitchClass(project.musicalGrid.key, identity.padId);
      if (rootPitchClass === null) continue;
      const root = 36 + rootPitchClass;
      for (const step of bassSteps(patternId, block.durationTick)) {
        const index = result.length;
        result.push(note(patternNoteId(role, patternId, phraseIndex, index), root + step.octave, block.startTick + step.offset, Math.min(step.duration, block.durationTick - step.offset), step.velocity));
      }
    } else {
      const pitches = chordPadRootPositionPitches(project.musicalGrid.key, identity.padId, 60);
      if (pitches.length === 0) continue;
      for (const step of arpSteps(patternId, block.durationTick, pitches)) {
        const index = result.length;
        result.push(note(patternNoteId(role, patternId, phraseIndex, index), step.pitch, block.startTick + step.offset, Math.min(step.duration, block.durationTick - step.offset), step.velocity));
      }
    }
  }
  return result;
}

export function appliedRolePatternId(project: Project, role: RolePatternRole, phraseIndex: number): string | null {
  const track = project.tracks.find((candidate) => candidate.role === role);
  const lane = track?.lanes.find((candidate) => candidate.role === 'main');
  const notes = lane?.notes ?? [];
  for (const event of notes) {
    const identity = parseRolePatternNoteId(event.id);
    if (!event.userEdited && identity?.role === role && identity.phraseIndex === phraseIndex) return identity.patternId;
  }
  return null;
}

export function refreshAppliedRolePatterns(project: Project): void {
  const phraseCount = Math.max(1, Math.floor(project.loop.endTick / CHORD_PROGRESSION_TICKS));
  for (const role of ['bass', 'arp', 'drum'] as const) {
    const track = project.tracks.find((candidate) => candidate.role === role);
    const lane = track?.lanes.find((candidate) => candidate.role === 'main');
    if (!lane) continue;
    const instances = new Map<number, RolePatternNoteIdentity>();
    for (const event of lane.notes) {
      const identity = parseRolePatternNoteId(event.id);
      if (!event.userEdited && identity && identity.role === role && identity.phraseIndex < phraseCount && !instances.has(identity.phraseIndex)) instances.set(identity.phraseIndex, identity);
    }
    const protectedIds = new Set(lane.notes.filter((event) => event.userEdited).map((event) => event.id));
    const preserved = lane.notes.filter((event) => !parseRolePatternNoteId(event.id) || event.userEdited);
    const refreshed = [...instances.values()].flatMap((identity) => generateRolePatternNotes(project, identity.role, identity.patternId, identity.phraseIndex)).filter((event) => !protectedIds.has(event.id));
    lane.notes = [...preserved, ...refreshed].sort((left, right) => left.startTick - right.startTick || left.pitch - right.pitch || left.id.localeCompare(right.id));
  }
}
