// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AudioEngine } from '../../domain/audio';
import { applyProjectCommand, createProject } from '../../domain/music';
import type { Project } from '../../domain/music';
import { ChordPatternBoard } from './ChordPatternBoard';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function insertDataTransfer(): DataTransfer {
  const values = new Map<string, string>();
  const types: string[] = [];
  return {
    dropEffect: 'none', effectAllowed: 'all', files: [] as unknown as FileList, items: [] as unknown as DataTransferItemList, types,
    clearData: (format?: string) => { if (format) values.delete(format); else values.clear(); },
    getData: (format: string) => values.get(format) ?? '',
    setData: (format: string, value: string) => { values.set(format, value); if (!types.includes(format)) types.push(format); },
    setDragImage: () => undefined,
  };
}

describe('ChordPatternBoard', () => {
  it('shows every chord, opens 60 tonal voices, and keeps dotted durations inside four bars', async () => {
    const user = userEvent.setup();
    const initial = createProject({ projectId: 'pattern-ui', title: 'Pattern UI', now: '2026-07-22T00:00:00.000Z', entryMode: 'patchboard', key: 'D major' });
    let observed: Project = initial;
    const auditionCalls: Array<{ project: Project; padId: string }> = [];
    const auditionChord: AudioEngine['auditionChord'] = (project, padId) => {
      auditionCalls.push({ project, padId });
      return Promise.resolve({ durationSeconds: 1, startedAt: 0 });
    };
    const auditionRolePattern = vi.fn(() => Promise.resolve({ durationSeconds: 6.4, startedAt: 0 }));
    const stopEngine = vi.fn();
    const engine: AudioEngine = {
      audition: vi.fn(() => Promise.resolve({ durationSeconds: 1, startedAt: 0 })),
      auditionChord,
      auditionRolePattern,
      playProject: vi.fn(() => Promise.resolve({ durationSeconds: 1, startedAt: 0 })),
      stop: stopEngine,
      importUserAudio: vi.fn(() => Promise.reject(new Error('not used'))),
      listUserAudio: vi.fn(() => Promise.resolve([])),
    };

    function Harness() {
      const [project, setProject] = useState(initial);
      return <ChordPatternBoard project={project} engine={engine} now={() => '2026-07-22T00:01:00.000Z'} onCommand={(command) => setProject((current) => { const next = applyProjectCommand(current, command); observed = next; return next; })} onTogglePlayback={vi.fn()} />;
    }

    render(<Harness />);
    expect(document.querySelector('[data-insert-target="score"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'コード・音色' }).getAttribute('aria-current')).toBe('page');
    expect(document.querySelectorAll('.chord-pad')).toHaveLength(46);
    await user.click(screen.getByRole('button', { name: 'FX・Fill' }));
    expect(document.querySelector('[data-insert-target="score"]')).not.toBeNull();
    expect(document.querySelectorAll('.sound-block-card')).toHaveLength(24);
    await user.click(screen.getByRole('button', { name: 'シュワーーー → ドンをフレーズ1へ挿入' }));
    expect(observed.tracks.find((track) => track.role === 'transition')?.lanes.find((lane) => lane.role === 'main')?.notes.some((note) => note.id.startsWith('sound-chunk|v1|neon-wash-impact|'))).toBe(true);
    await user.click(screen.getByRole('button', { name: '伴奏' }));
    expect(document.querySelectorAll('.phrase-kit-card')).toHaveLength(6);
    expect(document.querySelectorAll('.role-pattern-card')).toHaveLength(42);
    await user.click(screen.getByRole('button', { name: 'Cloud Introをフレーズ1へ挿入' }));
    expect(observed.tracks.find((track) => track.role === 'pad')?.lanes.find((lane) => lane.role === 'main')?.notes.some((note) => note.id.startsWith('phrase-kit|v1|cloud-intro|pad|0|'))).toBe(true);
    await user.click(screen.getByRole('button', { name: 'コードセット' }));
    expect(screen.getByRole('heading', { name: 'コード進行を挿入' })).toBeTruthy();
    expect(document.querySelectorAll('.progression-template-card').length).toBeGreaterThanOrEqual(9);
    await user.click(screen.getByRole('button', { name: 'Pop Axisをフレーズ1へ追加' }));
    let blocks = observed.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main')?.blocks ?? [];
    expect(blocks.slice(0, 4).map((block) => block.assetId)).toEqual([
      'pattern:chord:v1:stable-1:hold',
      'pattern:chord:v1:stable-5:hold',
      'pattern:chord:v1:stable-6:hold',
      'pattern:chord:v1:stable-4:hold',
    ]);
    expect(screen.getByText('D · A · Bm · G')).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('コード進行テンプレートの適用先'), '2');
    await user.click(screen.getByRole('button', { name: 'Singer / Songwriterをフレーズ3へ追加' }));
    expect(observed.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main')?.blocks.some((block) => block.startTick === 15_360)).toBe(true);
    await user.selectOptions(screen.getByLabelText('コード進行テンプレートの適用先'), '0');
    await user.selectOptions(screen.getByLabelText('曲全体のキー（コード譜）'), 'A major');
    expect(observed.musicalGrid.key).toBe('A major');
    expect(screen.getByText('A · E · F#m · D')).toBeTruthy();
    expect(screen.getAllByText(/手入力・鼻歌Melodyは保持/).length).toBeGreaterThan(0);
    await user.selectOptions(screen.getByLabelText('曲全体のキー（コード譜）'), 'D major');
    await user.click(screen.getByRole('button', { name: 'コード・音色' }));
    expect(screen.getByText('コードを鳴らす音色 · 60')).toBeTruthy();
    expect(document.querySelectorAll('.chord-pad')).toHaveLength(46);
    await user.click(screen.getByRole('button', { name: 'SYNTH12' }));
    await user.click(screen.getByRole('button', { name: /Glass Pluck 短く光る/ }));
    await user.click(screen.getByRole('button', { name: /^PULSE/ }));
    expect(document.querySelectorAll('.progression-phrase')).toHaveLength(4);
    expect(document.querySelectorAll('.progression-score-row')).toHaveLength(2);
    for (let click = 0; click < 5; click += 1) await user.click(screen.getByRole('button', { name: 'フレーズ1 1番目のコードを8分音符ぶん短くする' }));
    await user.click(screen.getByRole('button', { name: /D I home 基本/ }));
    for (let click = 0; click < 2; click += 1) await user.click(screen.getByRole('button', { name: 'フレーズ1 2番目のコードを8分音符ぶん短くする' }));
    await user.click(screen.getByRole('button', { name: /Em ii key内 基本/ }));

    expect(observed.tracks.find((track) => track.role === 'chord')?.instrumentId).toBe('synth-glass-pluck');
    blocks = observed.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main')?.blocks ?? [];
    expect(blocks[0]).toMatchObject({
      id: 'pattern-chord-phrase-0-slot-0',
      assetId: 'pattern:chord:v1:stable-1:pulse',
      startTick: 0,
      durationTick: 720,
    });
    expect(blocks[1]).toMatchObject({ id: 'pattern-chord-phrase-0-slot-1', startTick: 720, durationTick: 1_440 });
    expect(observed.loop).toEqual({ enabled: true, startTick: 0, endTick: 30_720 });
    expect(document.querySelector('.score-meter')?.textContent).toBe('16小節4/4 · 8分音符単位');
    expect(document.querySelector('.pattern-slot[data-auto="true"]')?.textContent).toContain('AUTO');
    expect(document.querySelector('.pattern-slot[data-auto="true"]')?.textContent).toContain('7.5拍');
    expect(auditionCalls).toHaveLength(2);
    expect(auditionCalls[0]?.project.tracks.find((track) => track.role === 'chord')?.instrumentId).toBe('synth-glass-pluck');
    expect(auditionCalls[0]?.padId).toBe('stable-1');
    await user.click(screen.getByRole('button', { name: '伴奏' }));
    await user.click(screen.getByRole('button', { name: 'Anchor Notesをフレーズ1で試聴' }));
    expect(auditionRolePattern).toHaveBeenCalledWith(expect.anything(), 'bass', 'anchor', 0);
    const stopCalls = stopEngine.mock.calls.length;
    await user.click(screen.getByRole('button', { name: 'Anchor Notesの試聴を停止' }));
    expect(stopEngine).toHaveBeenCalledTimes(stopCalls + 1);
    await user.click(screen.getByRole('button', { name: 'Anchor Notesをフレーズ1へ適用' }));
    expect(observed.tracks.find((track) => track.role === 'bass')?.lanes.find((lane) => lane.role === 'main')?.notes.some((note) => note.id.startsWith('role-pattern|v1|bass|anchor|0|'))).toBe(true);
    expect(screen.getByRole('button', { name: 'Anchor Notesをフレーズ1へ適用' }).textContent).toContain('適用中');

    await user.click(screen.getByRole('button', { name: '＋ 4小節' }));
    expect(document.querySelectorAll('.progression-phrase')).toHaveLength(5);
    expect(observed.loop.endTick).toBe(38_400);
  }, 10_000);

  it('starts a sustained chord on pointerdown and always releases it', async () => {
    const initial = createProject({ projectId: 'pattern-hold', title: 'Pattern Hold', now: '2026-07-23T00:00:00.000Z', entryMode: 'patchboard', key: 'D major' });
    const stop = vi.fn();
    const startChordAudition = vi.fn(() => Promise.resolve({ startedAt: 0, stop }));
    const engine: AudioEngine = {
      audition: vi.fn(() => Promise.resolve({ durationSeconds: 1, startedAt: 0 })),
      auditionChord: vi.fn(() => Promise.resolve({ durationSeconds: 1, startedAt: 0 })),
      startChordAudition,
      playProject: vi.fn(() => Promise.resolve({ durationSeconds: 1, startedAt: 0 })),
      stop: vi.fn(),
      importUserAudio: vi.fn(() => Promise.reject(new Error('not used'))),
      listUserAudio: vi.fn(() => Promise.resolve([])),
    };
    const commands: unknown[] = [];
    render(<ChordPatternBoard project={initial} engine={engine} now={() => '2026-07-23T00:01:00.000Z'} onCommand={(command) => commands.push(command)} />);

    const pad = screen.getByRole('button', { name: /D I home 基本/ });
    Object.assign(pad, { setPointerCapture: vi.fn(), hasPointerCapture: vi.fn(() => false), releasePointerCapture: vi.fn() });
    fireEvent.pointerDown(pad, { button: 0, pointerId: 7 });
    expect(startChordAudition).toHaveBeenCalledTimes(1);
    expect(commands).toHaveLength(1);
    fireEvent.pointerCancel(pad, { pointerId: 7 });
    await Promise.resolve();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('drags an insertable chord set into a visible four-bar destination', () => {
    const initial = createProject({ projectId: 'pattern-drag', title: 'Pattern Drag', now: '2026-07-23T00:00:00.000Z', entryMode: 'patchboard', key: 'D major' });
    let observed = initial;
    const engine: AudioEngine = {
      audition: vi.fn(() => Promise.resolve({ durationSeconds: 1, startedAt: 0 })),
      auditionChord: vi.fn(() => Promise.resolve({ durationSeconds: 1, startedAt: 0 })),
      playProject: vi.fn(() => Promise.resolve({ durationSeconds: 1, startedAt: 0 })), stop: vi.fn(),
      importUserAudio: vi.fn(() => Promise.reject(new Error('not used'))), listUserAudio: vi.fn(() => Promise.resolve([])),
    };
    function Harness() {
      const [project, setProject] = useState(initial);
      return <ChordPatternBoard project={project} engine={engine} now={() => '2026-07-23T00:01:00.000Z'} onCommand={(command) => setProject((current) => { observed = applyProjectCommand(current, command); return observed; })} />;
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'コードセット' }));
    const source = screen.getByText('Pop Axis').closest<HTMLElement>('.progression-template-card');
    const target = document.querySelector<HTMLElement>('.progression-phrase[data-phrase="2"]');
    if (!source || !target) throw new Error('Drag fixture is missing.');
    const transfer = insertDataTransfer();
    fireEvent.dragStart(source, { dataTransfer: transfer });
    expect(target.getAttribute('data-drop-ready')).toBe('true');
    fireEvent.dragEnter(target, { dataTransfer: transfer });
    expect(target.getAttribute('data-drop-target')).toBe('true');
    fireEvent.dragOver(target, { dataTransfer: transfer });
    fireEvent.drop(target, { dataTransfer: transfer });
    const blocks = observed.tracks.find((track) => track.role === 'chord')?.lanes.find((lane) => lane.role === 'main')?.blocks ?? [];
    expect(blocks.filter((block) => block.startTick >= 7_680 && block.startTick < 15_360)).toHaveLength(4);
    expect(screen.getByText(/Pop Axis.*PHRASE 2へ追加/)).toBeTruthy();
    const insertableCards = Array.from(document.querySelectorAll<HTMLElement>('[data-insertable="true"]'));
    expect(insertableCards.length).toBeGreaterThan(40);
    expect(insertableCards.every((card) => card.draggable)).toBe(true);
  });

  it('keeps the score visible while switching one insert-source tab at a time', async () => {
    const user = userEvent.setup();
    const initial = createProject({ projectId: 'source-tabs', title: 'Source Tabs', now: '2026-07-23T00:00:00.000Z', entryMode: 'patchboard', key: 'D major' });
    const engine: AudioEngine = {
      audition: vi.fn(() => Promise.resolve({ durationSeconds: 1, startedAt: 0 })),
      auditionChord: vi.fn(() => Promise.resolve({ durationSeconds: 1, startedAt: 0 })),
      playProject: vi.fn(() => Promise.resolve({ durationSeconds: 1, startedAt: 0 })), stop: vi.fn(),
      importUserAudio: vi.fn(() => Promise.reject(new Error('not used'))), listUserAudio: vi.fn(() => Promise.resolve([])),
    };
    const props = { project: initial, engine, now: () => '2026-07-23T00:01:00.000Z', onCommand: vi.fn() };
    render(<ChordPatternBoard {...props} />);
    const score = document.querySelector<HTMLElement>('[data-insert-target="score"]');
    expect(score?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('[data-pattern-panel="chord-live"]')?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('[data-pattern-panel="chord-sets"]')?.hidden).toBe(true);
    await user.click(screen.getByRole('button', { name: '音色割当' }));
    expect(score?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('[data-pattern-panel="chord-live"]')?.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('[data-pattern-panel="tones"]')?.hidden).toBe(false);
    expect(screen.queryByRole('button', { name: /^ALL/ })).toBeNull();
    expect(screen.getByRole('button', { name: /^CHORD/ })).toBeTruthy();
  });
});
