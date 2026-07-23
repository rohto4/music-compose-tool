// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProject } from '../../domain/music';
import type { ProjectCommand } from '../../domain/music';
import { emitShortcutCommand } from '../../application/shortcuts/shortcut-registry';
import { DawMelodyEditor } from './DawMelodyEditor';

const transportProps = () => ({
  playing: false,
  playbackMessage: null,
  onTogglePlayback: vi.fn(),
  onAuditionAsset: vi.fn(() => Promise.resolve()),
  onAuditionNotes: vi.fn(() => Promise.resolve()),
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('DawMelodyEditor mix controls', () => {
  it('renders an 88-key vertical piano scale aligned to the scrollable pitch rows', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const project = createProject({ projectId: 'daw-piano-keys', title: 'DAW Piano Keys', now: '2026-07-23T00:00:00.000Z', entryMode: 'patchboard' });
    const { container } = render(<DawMelodyEditor {...transportProps()} project={project} now={() => '2026-07-23T00:01:00.000Z'} onCommand={vi.fn()} />);
    const keyboard = container.querySelector<HTMLElement>('.piano-keys');
    const keys = [...container.querySelectorAll<HTMLElement>('.piano-key')];

    expect(keyboard?.style.getPropertyValue('--piano-row-height')).toBe('18px');
    expect(keys).toHaveLength(88);
    expect(keys.filter((key) => key.classList.contains('is-white'))).toHaveLength(52);
    expect(keys.filter((key) => key.classList.contains('is-black'))).toHaveLength(36);
    expect(keys.filter((key) => key.classList.contains('is-c')).map((key) => key.dataset.note)).toEqual(['C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'C2', 'C1']);
    expect(keys[0]?.dataset.pitch).toBe('108');
    expect(keys[0]?.dataset.note).toBe('C8');
    expect(keys.at(-1)?.dataset.pitch).toBe('21');
    expect(keys.at(-1)?.dataset.note).toBe('A0');
    expect(screen.getByRole('region', { name: '音程範囲。マウスホイールで上下にスクロール' }).scrollTop).toBe((108 - 84) * 18);
  });

  it('does not show a full-width result band or copy zero notes', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const project = createProject({ projectId: 'daw-copy-status', title: 'DAW Copy Status', now: '2026-07-23T00:00:00.000Z', entryMode: 'patchboard' });
    const { container } = render(<DawMelodyEditor {...transportProps()} project={project} now={() => '2026-07-23T00:01:00.000Z'} onCommand={vi.fn()} />);

    fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
    expect(container.querySelector('.palette-message')).toBeNull();
    expect(container.querySelector('.daw-operation-status')).toBeNull();
  });

  it('keeps full-project playback and current instrument audition beside the score', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const project = createProject({ projectId: 'daw-transport', title: 'DAW Transport', now: '2026-07-23T00:00:00.000Z', entryMode: 'patchboard' });
    project.tracks[0]?.lanes[0]?.notes.push({ id: 'preview-block', pitch: 64, startTick: 480, durationTick: 240, velocity: 92, source: 'manual', confidence: 1, userEdited: true, lockPitch: false, lockTiming: false });
    const onTogglePlayback = vi.fn();
    const onAuditionAsset = vi.fn(() => Promise.resolve());
    const onAuditionNotes = vi.fn(() => Promise.resolve());
    render(<DawMelodyEditor project={project} now={() => '2026-07-23T00:01:00.000Z'} onCommand={vi.fn()} playing={false} playbackMessage="停止中" onTogglePlayback={onTogglePlayback} onAuditionAsset={onAuditionAsset} onAuditionNotes={onAuditionNotes} />);

    fireEvent.click(screen.getByRole('button', { name: /から曲全体を再生/ }));
    expect(onTogglePlayback).toHaveBeenCalledWith(0);
    const blockButton = screen.getByRole('button', { name: '選択音符だけ再生' });
    expect(blockButton.hasAttribute('disabled')).toBe(true);
    const canvas = screen.getByLabelText('メロディピアノロール');
    Object.assign(canvas, {
      getBoundingClientRect: () => ({ x: 0, y: 0, left: 0, top: 0, right: 1_120, bottom: 1_584, width: 1_120, height: 1_584, toJSON: () => ({}) }),
    });
    fireEvent.pointerDown(canvas, { clientX: 90, clientY: 800, pointerId: 1, ctrlKey: true });
    expect(blockButton.hasAttribute('disabled')).toBe(false);
    fireEvent.click(blockButton);
    expect(onAuditionNotes).toHaveBeenCalledWith('track-melody', ['preview-block'], 'Melody 1音');
    const auditionButton = screen.getAllByRole('button', { name: /を単体試聴$/ })[0];
    if (!auditionButton) throw new Error('audition button missing');
    fireEvent.click(auditionButton);
    expect(onAuditionAsset).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('FX 音色')).toBeNull();
    expect(screen.getByRole('button', { name: /Sparkle Dustを単体試聴/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Soft Riseを単体試聴/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Chordsを編集' }));
    expect(screen.getByRole('heading', { name: 'Chords' })).toBeTruthy();
    expect(document.querySelector('.daw-edit-target')?.textContent).toBe('Main');
  });

  it('moves the playhead on the ruler, starts playback there, and keeps help outside the normal canvas', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const project = createProject({ projectId: 'daw-playhead', title: 'DAW Playhead', now: '2026-07-24T00:00:00.000Z', entryMode: 'patchboard' });
    const onTogglePlayback = vi.fn();
    render(<DawMelodyEditor {...transportProps()} project={project} now={() => '2026-07-24T00:01:00.000Z'} onCommand={vi.fn()} onTogglePlayback={onTogglePlayback} />);
    const ruler = screen.getByRole('slider', { name: '再生位置' });
    Object.assign(ruler, { getBoundingClientRect: () => ({ x: 0, y: 0, left: 0, top: 0, right: 1_120, bottom: 32, width: 1_120, height: 32, toJSON: () => ({}) }) });

    fireEvent.pointerDown(ruler, { clientX: 336, pointerId: 1 });
    expect(ruler.getAttribute('aria-valuenow')).toBe('1920');
    fireEvent.click(screen.getByRole('button', { name: /BAR 2.*から曲全体を再生/ }));
    expect(onTogglePlayback).toHaveBeenCalledWith(1_920);
    fireEvent.keyDown(ruler, { key: 'End' });
    expect(ruler.getAttribute('aria-valuetext')).toBe('END');
    fireEvent.keyDown(ruler, { key: 'Home' });
    expect(ruler.getAttribute('aria-valuenow')).toBe('0');
    fireEvent.click(screen.getByRole('button', { name: 'Verseから表示' }));
    const verse = project.arrangement.sections.find((section) => section.label === 'Verse');
    if (!verse) throw new Error('Verse section missing');
    expect(ruler.getAttribute('aria-valuenow')).toBe(String(verse.startBar * 4 * 480));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText(/空白をドラッグして範囲選択/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'DAW操作ガイドを開く' }));
    expect(screen.getByRole('dialog', { name: '再生' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '→' }));
    expect(screen.getByRole('dialog', { name: 'タイムライン' })).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('stops project playback without moving the retained playhead', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const project = createProject({ projectId: 'daw-stop', title: 'DAW Stop', now: '2026-07-24T00:00:00.000Z', entryMode: 'patchboard' });
    const onTogglePlayback = vi.fn();
    render(<DawMelodyEditor {...transportProps()} project={project} now={() => '2026-07-24T00:01:00.000Z'} onCommand={vi.fn()} playing onTogglePlayback={onTogglePlayback} />);

    fireEvent.click(screen.getByRole('button', { name: '編集中の曲を停止' }));
    expect(onTogglePlayback).toHaveBeenCalledWith(undefined);
    expect(screen.getByRole('slider', { name: '再生位置' }).getAttribute('aria-valuenow')).toBe('0');
  });

  it('selects notes with a blank-area marquee and moves the group in one command', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const project = createProject({ projectId: 'daw-marquee', title: 'DAW Marquee', now: '2026-07-23T00:00:00.000Z', entryMode: 'patchboard' });
    const melody = project.tracks.find((track) => track.id === 'track-melody');
    const lane = melody?.lanes.find((candidate) => candidate.id === 'lane-melody-main');
    if (!melody || !lane) throw new Error('melody lane missing');
    lane.notes.push(
      { id: 'marquee-1', pitch: 60, startTick: 0, durationTick: 240, velocity: 80, source: 'manual', confidence: 1, userEdited: false, lockPitch: false, lockTiming: false },
      { id: 'marquee-2', pitch: 62, startTick: 480, durationTick: 240, velocity: 90, source: 'manual', confidence: 1, userEdited: false, lockPitch: false, lockTiming: false },
    );
    const commands: ProjectCommand[] = [];
    render(<DawMelodyEditor {...transportProps()} project={project} now={() => '2026-07-23T00:01:00.000Z'} onCommand={(command) => commands.push(command)} />);
    const canvas = screen.getByLabelText('メロディピアノロール');
    Object.assign(canvas, {
      getBoundingClientRect: () => ({ x: 0, y: 0, left: 0, top: 0, right: 1_120, bottom: 1_584, width: 1_120, height: 1_584, toJSON: () => ({}) }),
      setPointerCapture: vi.fn(),
      hasPointerCapture: vi.fn(() => false),
      releasePointerCapture: vi.fn(),
    });

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 820, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 130, clientY: 890, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 130, clientY: 890, pointerId: 1 });
    expect(screen.getByRole('button', { name: '選択音符をコピー' }).hasAttribute('disabled')).toBe(false);

    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 864, pointerId: 2 });
    fireEvent.pointerMove(canvas, { clientX: 94, clientY: 846, pointerId: 2 });
    fireEvent.pointerUp(canvas, { clientX: 94, clientY: 846, pointerId: 2 });
    expect(commands.at(-1)).toMatchObject({
      type: 'note/update-many',
      trackId: melody.id,
      laneId: lane.id,
      updates: [
        { noteId: 'marquee-1', patch: { startTick: 480, pitch: 61, userEdited: true } },
        { noteId: 'marquee-2', patch: { startTick: 960, pitch: 63, userEdited: true } },
      ],
    });
    expect(document.querySelector('.daw-pointer-status')).toBeNull();
  });

  it('toggles notes with Ctrl+click and constrains drag by octave and bar modifiers', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const project = createProject({ projectId: 'daw-modifiers', title: 'DAW Modifiers', now: '2026-07-23T00:00:00.000Z', entryMode: 'patchboard' });
    const melody = project.tracks.find((track) => track.id === 'track-melody');
    const lane = melody?.lanes.find((candidate) => candidate.id === 'lane-melody-main');
    if (!melody || !lane) throw new Error('melody lane missing');
    lane.notes.push(
      { id: 'modifier-1', pitch: 60, startTick: 0, durationTick: 240, velocity: 80, source: 'manual', confidence: 1, userEdited: false, lockPitch: false, lockTiming: false },
      { id: 'modifier-2', pitch: 62, startTick: 480, durationTick: 240, velocity: 90, source: 'manual', confidence: 1, userEdited: false, lockPitch: false, lockTiming: false },
    );
    const commands: ProjectCommand[] = [];
    render(<DawMelodyEditor {...transportProps()} project={project} now={() => '2026-07-23T00:01:00.000Z'} onCommand={(command) => commands.push(command)} />);
    const canvas = screen.getByLabelText('メロディピアノロール');
    Object.assign(canvas, {
      getBoundingClientRect: () => ({ x: 0, y: 0, left: 0, top: 0, right: 1_120, bottom: 1_584, width: 1_120, height: 1_584, toJSON: () => ({}) }),
      setPointerCapture: vi.fn(), hasPointerCapture: vi.fn(() => false), releasePointerCapture: vi.fn(),
    });

    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 864, pointerId: 1, ctrlKey: true });
    fireEvent.pointerDown(canvas, { clientX: 94, clientY: 828, pointerId: 2, ctrlKey: true });
    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 864, pointerId: 3, ctrlKey: true });

    fireEvent.pointerDown(canvas, { clientX: 94, clientY: 828, pointerId: 4, shiftKey: true });
    fireEvent.pointerMove(canvas, { clientX: 94, clientY: 612, pointerId: 4, shiftKey: true });
    fireEvent.pointerUp(canvas, { clientX: 94, clientY: 612, pointerId: 4, shiftKey: true });
    expect(commands.at(-1)).toMatchObject({ type: 'note/update-many', updates: [{ noteId: 'modifier-2', patch: { startTick: 480, pitch: 74 } }] });

    fireEvent.pointerDown(canvas, { clientX: 94, clientY: 828, pointerId: 5, altKey: true });
    fireEvent.pointerMove(canvas, { clientX: 430, clientY: 828, pointerId: 5, altKey: true });
    fireEvent.pointerUp(canvas, { clientX: 430, clientY: 828, pointerId: 5, altKey: true });
    expect(commands.at(-1)).toMatchObject({ type: 'note/update-many', updates: [{ noteId: 'modifier-2', patch: { startTick: 2400, pitch: 62 } }] });
  });

  it('edits and removes generated audio clips through the audio layer panel', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const project = createProject({ projectId: 'daw-audio', title: 'DAW Audio', now: '2026-07-22T00:00:00.000Z', entryMode: 'humming-studio' });
    const reference = project.tracks.find((track) => track.role === 'reference');
    const lane = reference?.lanes.find((candidate) => candidate.kind === 'audio');
    if (!reference || !lane) throw new Error('reference audio lane missing');
    lane.audioClips.push({ id: 'clip-layer-1', assetId: 'user-audio-layer', startTick: 0, durationTick: 960, offsetSeconds: 0, gain: 1 });
    const commands: ProjectCommand[] = [];
    render(<DawMelodyEditor {...transportProps()} project={project} now={() => '2026-07-22T00:01:00.000Z'} onCommand={(command) => commands.push(command)} />);

    fireEvent.change(screen.getByRole('spinbutton', { name: 'clip-layer-1 開始tick' }), { target: { value: '480' } });
    expect(commands.at(-1)).toMatchObject({ type: 'audio-clip/update', trackId: reference.id, laneId: lane.id, clipId: 'clip-layer-1', patch: { startTick: 480 } });
    fireEvent.change(screen.getByRole('slider', { name: 'clip-layer-1 gain' }), { target: { value: '0.5' } });
    expect(commands.at(-1)).toMatchObject({ type: 'audio-clip/update', clipId: 'clip-layer-1', patch: { gain: .5 } });
    fireEvent.click(screen.getByRole('button', { name: 'user-audio-layerを削除' }));
    expect(commands.at(-1)).toMatchObject({ type: 'audio-clip/remove', trackId: reference.id, laneId: lane.id, clipId: 'clip-layer-1' });
  });

  it('writes FX and automation point edits through project commands', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const project = createProject({ projectId: 'daw-ui', title: 'DAW UI', now: '2026-07-22T00:00:00.000Z', entryMode: 'patchboard' });
    const commands: ProjectCommand[] = [];
    render(<DawMelodyEditor {...transportProps()} project={project} now={() => '2026-07-22T00:01:00.000Z'} onCommand={(command) => commands.push(command)} />);

    const filter = screen.getByRole('slider', { name: 'Melody filter' });
    fireEvent.change(filter, { target: { value: '0.65' } });
    expect(commands.at(-1)).toMatchObject({ type: 'track/mixer', trackId: 'track-melody', patch: { fx: { filter: .65 } } });

    fireEvent.click(screen.getByRole('button', { name: '+ Point' }));
    expect(commands.at(-1)).toMatchObject({ type: 'automation/set', trackId: 'track-melody', parameter: 'filter' });
    expect((commands.at(-1) as Extract<ProjectCommand, { type: 'automation/set' }>).points).toHaveLength(1);
  });

  it('uses MIDI note-off timing to replace the provisional note length', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const input = { id: 'keyboard-1', name: 'Test Keyboard', onmidimessage: null } as unknown as MIDIInput;
    const access = { inputs: { values: () => [input][Symbol.iterator]() } } as unknown as MIDIAccess;
    Object.defineProperty(navigator, 'requestMIDIAccess', { configurable: true, value: vi.fn(() => Promise.resolve(access)) });
    const project = createProject({ projectId: 'daw-midi', title: 'DAW MIDI', now: '2026-07-22T00:00:00.000Z', entryMode: 'patchboard' });
    const commands: ProjectCommand[] = [];
    render(<DawMelodyEditor {...transportProps()} project={project} now={() => '2026-07-22T00:01:00.000Z'} onCommand={(command) => commands.push(command)} />);
    fireEvent.click(screen.getByRole('button', { name: 'MIDI入力を接続' }));
    await waitFor(() => expect(screen.getByText('1 MIDI入力を接続')).toBeTruthy());
    input.onmidimessage?.({ data: new Uint8Array([0x90, 60, 100]), timeStamp: 100 } as MIDIMessageEvent);
    input.onmidimessage?.({ data: new Uint8Array([0x80, 60, 0]), timeStamp: 350 } as MIDIMessageEvent);
    const noteAdd = commands.find((command): command is Extract<ProjectCommand, { type: 'note/add' }> => command.type === 'note/add');
    const noteUpdate = commands.find((command): command is Extract<ProjectCommand, { type: 'note/update' }> => command.type === 'note/update');
    expect(noteAdd?.note).toMatchObject({ pitch: 60, durationTick: 240 });
    expect(noteUpdate?.patch.durationTick).toBe(360);
    expect(noteUpdate?.noteIds).toEqual([noteAdd?.note.id]);
  });

  it('edits and duplicates the selected note through score selection and shortcuts without an inspector', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const project = createProject({ projectId: 'daw-inspector', title: 'DAW Inspector', now: '2026-07-22T00:00:00.000Z', entryMode: 'patchboard' });
    const melody = project.tracks.find((track) => track.id === 'track-melody');
    const lane = melody?.lanes.find((candidate) => candidate.id === 'lane-melody-main');
    if (!melody || !lane) throw new Error('melody lane missing');
    lane.notes.push({ id: 'note-inspector-1', pitch: 60, startTick: 0, durationTick: 240, velocity: 80, source: 'manual', confidence: 1, userEdited: false, lockPitch: false, lockTiming: false });
    const commands: ProjectCommand[] = [];
    render(<DawMelodyEditor {...transportProps()} project={project} now={() => '2026-07-22T00:01:00.000Z'} onCommand={(command) => commands.push(command)} />);

    const canvas = screen.getByLabelText('メロディピアノロール');
    Object.assign(canvas, {
      getBoundingClientRect: () => ({ x: 0, y: 0, left: 0, top: 0, right: 1_120, bottom: 1_584, width: 1_120, height: 1_584, toJSON: () => ({}) }),
    });
    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 864, pointerId: 1, ctrlKey: true });
    fireEvent.click(screen.getByRole('button', { name: '選択音符をコピー' }));
    expect(screen.getByText('1音をコピーしました')).toBeTruthy();
    expect(document.querySelector('.palette-message')).toBeNull();
    emitShortcutCommand('note.up');
    expect(commands.at(-1)).toMatchObject({ type: 'note/update-many', trackId: melody.id, laneId: lane.id, updates: [{ noteId: 'note-inspector-1', patch: { pitch: 61, userEdited: true } }] });
    emitShortcutCommand('edit.duplicate');
    expect(commands.at(-1)).toMatchObject({ type: 'note/add-many', trackId: melody.id, laneId: lane.id, notes: [expect.objectContaining({ startTick: 240, durationTick: 240 })] });
    expect(screen.queryByLabelText('選択音符インスペクタ')).toBeNull();
    expect(screen.queryByText('音符未選択')).toBeNull();
    expect(screen.queryByLabelText('音の塊')).toBeNull();
  });
});
