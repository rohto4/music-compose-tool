// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AudioEngine } from '../../domain/audio';
import { KasaneCompositionDesk } from './KasaneCompositionDesk';

type DeskAudio = Pick<AudioEngine, 'playProject' | 'stop'>;

function audioEngine(failure?: Error): DeskAudio {
  return {
    playProject: vi.fn(failure
      ? () => Promise.reject(failure)
      : () => Promise.resolve({ durationSeconds: 4, startedAt: 1 })),
    stop: vi.fn(),
  };
}

afterEach(cleanup);

describe('KasaneCompositionDesk', () => {
  it('starts from three Hero Kits without AI or microphone controls', () => {
    render(<KasaneCompositionDesk audioEngine={audioEngine()} />);

    expect(screen.getByRole('main', { name: 'KASANE Composition Desk' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Candy Skyline' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Hero Kit/ })).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /scene/ })).toHaveLength(5);
    expect(screen.getAllByRole('row', { name: /role/ })).toHaveLength(5);
    const controlNames = screen.getAllByRole('button').map((button) => button.getAttribute('aria-label') ?? button.textContent ?? '').join(' ');
    expect(controlNames).not.toMatch(/\bAI\b|鼻歌|humming|microphone/i);
  });

  it('switches a coherent kit as one unit', async () => {
    const user = userEvent.setup();
    render(<KasaneCompositionDesk audioEngine={audioEngine()} />);

    await user.click(screen.getByRole('button', { name: /Prism Rush Hero Kit/ }));
    expect(screen.getByRole('heading', { name: 'Prism Rush' })).toBeTruthy();
    expect(screen.getByText('176 BPM')).toBeTruthy();
    expect(screen.getByText('F# minor')).toBeTruthy();
    expect(screen.getByText('Needle laser')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Prism Rush Hero Kit/ }).getAttribute('aria-pressed')).toBe('true');
  });

  it('previews, rejects, commits, and undoes one scoped Scene Move', async () => {
    const user = userEvent.setup();
    render(<KasaneCompositionDesk audioEngine={audioEngine()} />);

    await user.click(screen.getByRole('button', { name: 'Air scene' }));
    await user.click(screen.getByRole('button', { name: 'STRIP move' }));
    expect(screen.getByText(/STRIPをAirへpreview/)).toBeTruthy();
    expect(screen.getByText('VARIATION', { selector: 'button' }).getAttribute('aria-pressed')).toBe('true');

    await user.click(screen.getByRole('button', { name: 'REJECT VARIATION' }));
    expect(screen.getByText(/variationを破棄/)).toBeTruthy();
    expect(screen.getByText('REV 00')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'STRIP move' }));
    await user.click(screen.getByRole('button', { name: 'KEEP CHANGE' }));
    expect(screen.getByText('REV 01')).toBeTruthy();
    expect(screen.getByText('STRIP', { selector: '[data-committed-move]' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'UNDO LAST CHANGE' }));
    expect(screen.getByText('REV 00')).toBeTruthy();
    expect(screen.queryByText('STRIP', { selector: '[data-committed-move]' })).toBeNull();
  });

  it('plays the selected scene from its exact tick and stops active sources', async () => {
    const user = userEvent.setup();
    const audio = audioEngine();
    render(<KasaneCompositionDesk audioEngine={audio} />);

    await user.click(screen.getByRole('button', { name: 'Air scene' }));
    await user.click(screen.getByRole('button', { name: 'PLAY SCENE' }));
    await waitFor(() => expect(audio.playProject).toHaveBeenCalledTimes(1));
    expect(vi.mocked(audio.playProject).mock.calls[0]?.[1]).toBe(12 * 4 * 480);
    await user.click(screen.getByRole('button', { name: 'STOP' }));
    expect(audio.stop).toHaveBeenCalled();
  });

  it('keeps editing state usable when Web Audio fails', async () => {
    const user = userEvent.setup();
    render(<KasaneCompositionDesk audioEngine={audioEngine(new Error('Web Audio unavailable'))} />);

    await user.click(screen.getByRole('button', { name: 'PLAY SCENE' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Web Audio unavailable');
    await user.click(screen.getByRole('button', { name: 'LIFT move' }));
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'KEEP CHANGE' }).disabled).toBe(false);
  });

  it('does not resume a stale playback request after STOP', async () => {
    const user = userEvent.setup();
    let resolvePlayback: ((value: { durationSeconds: number; startedAt: number }) => void) | undefined;
    const audio: DeskAudio = {
      playProject: vi.fn(() => new Promise<{ durationSeconds: number; startedAt: number }>((resolve) => { resolvePlayback = resolve; })),
      stop: vi.fn(),
    };
    render(<KasaneCompositionDesk audioEngine={audio} />);

    await user.click(screen.getByRole('button', { name: 'PLAY SCENE' }));
    await user.click(screen.getByRole('button', { name: 'STOP' }));
    resolvePlayback?.({ durationSeconds: 4, startedAt: 1 });
    await Promise.resolve();
    expect(screen.getByRole('button', { name: 'PLAY SCENE' }).getAttribute('aria-pressed')).toBe('false');
  });
});
