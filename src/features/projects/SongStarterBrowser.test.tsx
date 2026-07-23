// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AudioEngine } from '../../domain/audio';
import { createProject } from '../../domain/music';
import { SongStarterBrowser } from './SongStarterBrowser';

afterEach(cleanup);

function audioEngine() {
  const playProject = vi.fn<AudioEngine['playProject']>().mockResolvedValue({ durationSeconds: 10, startedAt: performance.now() });
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

describe('SongStarterBrowser', () => {
  it('previews a temporary starter project without applying or persisting it', async () => {
    const user = userEvent.setup();
    const { engine, playProject, stop } = audioEngine();
    const onCommand = vi.fn();
    const project = createProject({
      projectId: 'starter-preview',
      title: 'Starter Preview',
      entryMode: 'patchboard',
      now: '2026-07-24T02:10:00.000Z',
    });
    const originalSource = project.arrangement.sourceAssetId;
    const view = render(<SongStarterBrowser project={project} audioEngine={engine} now={() => '2026-07-24T02:11:00.000Z'} onCommand={onCommand} />);
    const card = screen.getByText('Ah vous dirai-je, Maman · Theme Study').closest('article');
    expect(card).not.toBeNull();

    await user.click(within(card!).getByRole('button', { name: '▶ 聴く' }));
    await waitFor(() => expect(playProject).toHaveBeenCalledTimes(1));
    const previewProject = playProject.mock.calls[0]?.[0];
    expect(previewProject).not.toBe(project);
    expect(previewProject?.arrangement.sourceAssetId).toBe('song-starter:twinkle-theme');
    expect(project.arrangement.sourceAssetId).toBe(originalSource);
    expect(onCommand).not.toHaveBeenCalled();
    expect(within(card!).getByRole('button', { name: '■ 停止' })).toBeTruthy();

    await user.click(within(card!).getByRole('button', { name: '■ 停止' }));
    expect(stop).toHaveBeenCalled();
    expect(within(card!).getByRole('button', { name: '▶ 聴く' })).toBeTruthy();

    await user.click(within(card!).getByRole('button', { name: 'この曲を編集する' }));
    expect(onCommand).toHaveBeenCalledWith({
      type: 'project/starter-apply',
      starterId: 'twinkle-theme',
      at: '2026-07-24T02:11:00.000Z',
    });

    view.unmount();
    expect(stop).toHaveBeenCalled();
  });
});
