// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import type { HummingTranscriber, MicrophoneRecorder } from '../../application/humming/humming-ports';
import { MemoryHummingAssetRepository } from '../../application/humming/humming-ports';
import { applyProjectCommand, createProject } from '../../domain/music';
import type { Project } from '../../domain/music';
import { HummingRecorder } from './HummingRecorder';

afterEach(cleanup);

describe('HummingRecorder', () => {
  it('records repeated takes, applies Basic Pitch notes, and switches the selected melody take', async () => {
    const user = userEvent.setup();
    const initial = createProject({ projectId: 'project-humming', title: 'Humming', now: '2026-07-22T00:00:00.000Z', entryMode: 'humming-studio', bpm: 120 });
    let observed: Project = initial;
    let id = 0;
    const transcribedRanges: number[] = [];
    const recorder: MicrophoneRecorder = {
      start: () => Promise.resolve({
        result: Promise.resolve({ blob: new Blob(['take'], { type: 'audio/webm' }), mimeType: 'audio/webm', durationSeconds: 2 }),
        stop: () => undefined,
      }),
    };
    const transcriber: HummingTranscriber = {
      transcribe: (_blob, options, onProgress) => {
        transcribedRanges.push(options.rangeEndTick - options.rangeStartTick);
        onProgress?.(.5);
        return Promise.resolve([
          { id: `note-${options.takeId}-1`, pitch: 66, startTick: options.rangeStartTick, durationTick: 480, velocity: 96, source: 'humming', confidence: .91, userEdited: false, lockPitch: true, lockTiming: true },
          { id: `note-${options.takeId}-2`, pitch: 69, startTick: options.rangeStartTick + 480, durationTick: 480, velocity: 92, source: 'humming', confidence: .88, userEdited: false, lockPitch: true, lockTiming: true },
        ]);
      },
    };
    const repository = new MemoryHummingAssetRepository();

    function Harness() {
      const [project, setProject] = useState(initial);
      return <HummingRecorder project={project} recorder={recorder} transcriber={transcriber} assetRepository={repository} inspectDuration={() => Promise.resolve(2)} createId={() => String(++id)} now={() => '2026-07-22T00:01:00.000Z'} onCommand={(command) => setProject((current) => {
        const next = applyProjectCommand(current, command);
        observed = next;
        return next;
      })} />;
    }

    render(<Harness />);
    await user.selectOptions(screen.getByRole('combobox', { name: '鼻歌を入れる小節数' }), '1');
    await user.click(screen.getByRole('button', { name: '鼻歌を録音' }));
    await waitFor(() => expect(screen.getByText(/2個の音符をMelodyへ適用/)).toBeTruthy());
    await user.click(screen.getByRole('button', { name: '鼻歌を録音' }));
    await waitFor(() => expect(screen.getByText('Take 02')).toBeTruthy());

    expect(observed.hummingTakes).toHaveLength(2);
    expect(transcribedRanges[0]).toBe(4 * 480);
    expect(observed.hummingTakes[1]?.selected).toBe(true);
    expect(observed.melody.activeTakeId).toBe(observed.hummingTakes[1]?.id);
    await user.click(screen.getAllByRole('button', { name: 'このtakeを使う' })[0]!);
    expect(observed.melody.activeTakeId).toBe(observed.hummingTakes[0]?.id);
    expect(observed.tracks.find((track) => track.id === observed.melody.trackId)?.lanes.find((lane) => lane.id === observed.melody.laneId)?.notes).toEqual(observed.hummingTakes[0]?.transcribedNotes);
  });
});
