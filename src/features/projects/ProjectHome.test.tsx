// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AudioEngine } from '../../domain/audio';
import { createProject, PPQ } from '../../domain/music';
import { ProjectHome } from './ProjectHome';
import type { NewProjectDraft } from './ProjectHome';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function audioEngine(durationSeconds = 5) {
  const playProject = vi.fn<AudioEngine['playProject']>().mockResolvedValue({ durationSeconds, startedAt: performance.now() });
  const stop = vi.fn<AudioEngine['stop']>();
  const engine: AudioEngine = {
    audition: vi.fn(),
    auditionChord: vi.fn(),
    playProject,
    stop,
    importUserAudio: vi.fn(),
    listUserAudio: vi.fn(),
  };
  return { engine, playProject, stop };
}

const draft: NewProjectDraft = {
  title: '新しい曲 1',
  startMode: 'patchboard',
  genre: 'cute-future-bass',
  mood: '前向き、きらきら',
  targetDurationSeconds: 90,
  key: 'D major',
  bpm: 150,
};

function project(projectId: string, title: string) {
  return createProject({
    projectId,
    title,
    entryMode: 'patchboard',
    genre: 'cute-future-bass',
    mood: ['前向き', 'きらきら'],
    targetDurationSeconds: 90,
    key: 'D major',
    bpm: 150,
    now: '2026-07-24T02:00:00.000Z',
  });
}

describe('ProjectHome preview', () => {
  it('plays one saved project at a time and seeks by BPM-derived 30 second ticks', async () => {
    const user = userEvent.setup();
    const { engine, playProject, stop } = audioEngine();
    const first = project('project-one', 'Soda One');
    const second = project('project-two', 'Soda Two');
    const view = render(
      <ProjectHome
        projects={[first, second]}
        audioEngine={engine}
        creating={false}
        draft={draft}
        busy={false}
        onCreatingChange={vi.fn()}
        onDraftChange={vi.fn()}
        onCreate={vi.fn()}
        onOpen={vi.fn()}
        onExport={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Soda Oneを再生' }));
    await waitFor(() => expect(playProject).toHaveBeenLastCalledWith(first, 0));
    expect(screen.getByRole('button', { name: 'Soda Oneを停止' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Soda Twoを再生' }));
    await waitFor(() => expect(playProject).toHaveBeenLastCalledWith(second, 0));
    expect(stop).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Soda Oneを再生' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Soda Twoを停止' }));
    await user.click(screen.getByRole('button', { name: 'Soda Twoを先頭へ戻す' }));
    await user.click(screen.getByRole('button', { name: 'Soda Twoを30秒進める' }));
    const thirtySecondsTick = 30 * second.musicalGrid.bpm / 60 * PPQ;
    await user.click(screen.getByRole('button', { name: 'Soda Twoを再生' }));
    await waitFor(() => expect(playProject).toHaveBeenLastCalledWith(second, thirtySecondsTick));

    view.unmount();
    expect(stop).toHaveBeenCalled();
  });

  it('returns the preview to its finished state after the playback receipt duration', async () => {
    vi.useFakeTimers();
    const { engine, stop } = audioEngine(.05);
    const saved = project('project-finish', 'Finish Line');
    render(
      <ProjectHome
        projects={[saved]}
        audioEngine={engine}
        creating={false}
        draft={draft}
        busy={false}
        onCreatingChange={vi.fn()}
        onDraftChange={vi.fn()}
        onCreate={vi.fn()}
        onOpen={vi.fn()}
        onExport={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Finish Lineを再生' }));
      await Promise.resolve();
    });
    expect(screen.getByRole('button', { name: 'Finish Lineを停止' })).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(250);
      await Promise.resolve();
    });
    expect(screen.getByRole('button', { name: 'Finish Lineを再生' })).toBeTruthy();
    expect(stop).toHaveBeenCalled();
  });

  it('identifies the import boundary as .mctproj only', () => {
    render(
      <ProjectHome
        projects={[]}
        audioEngine={audioEngine().engine}
        creating={false}
        draft={draft}
        busy={false}
        onCreatingChange={vi.fn()}
        onDraftChange={vi.fn()}
        onCreate={vi.fn()}
        onOpen={vi.fn()}
        onExport={vi.fn()}
        onImport={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Projectを読み込む.*mctproj 専用/ })).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>('.mctproj Project fileを読み込む').accept).toBe('.mctproj');
  });
});
