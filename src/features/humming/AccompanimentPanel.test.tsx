// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { applyProjectCommand, createProject, createStarterMelody } from '../../domain/music';
import type { Project } from '../../domain/music';
import { AccompanimentPanel } from './AccompanimentPanel';

afterEach(cleanup);

describe('AccompanimentPanel', () => {
  it('applies only the selected section while retaining editable symbolic lanes', async () => {
    const user = userEvent.setup();
    const base = createProject({ projectId: 'project-range-ui', title: 'Range UI', now: '2026-07-22T00:00:00.000Z', entryMode: 'humming-studio', bpm: 120 });
    const initial = applyProjectCommand(base, { type: 'melody/replace', notes: createStarterMelody(base), source: 'humming', lockPitch: true, lockTiming: true, at: '2026-07-22T00:00:00.000Z' });
    let observed: Project = initial;

    function Harness() {
      const [project, setProject] = useState(initial);
      return <AccompanimentPanel project={project} now={() => '2026-07-22T00:01:00.000Z'} onCommand={(command) => setProject((current) => { const next = applyProjectCommand(current, command); observed = next; return next; })} />;
    }

    render(<Harness />);
    await user.selectOptions(screen.getByRole('combobox', { name: '生成範囲' }), 'selected');
    await user.selectOptions(screen.getByRole('combobox', { name: '生成対象section' }), initial.arrangement.sections[0]!.id);
    await user.click(screen.getByRole('button', { name: 'このメロディに伴奏をつける' }));
    await waitFor(() => expect(screen.getByText(/ブラウザ内テンプレート/)).toBeTruthy());
    const sectionEndTick = initial.arrangement.sections[0]!.bars * 4 * 480;
    const generatedNotes = observed.tracks.flatMap((track) => track.lanes.flatMap((lane) => lane.notes.filter((note) => note.source === 'generated')));
    expect(generatedNotes.length).toBeGreaterThan(0);
    expect(generatedNotes.every((note) => note.startTick < sectionEndTick && note.startTick + note.durationTick <= sectionEndTick)).toBe(true);
    expect(observed.generationCandidates.some((candidate) => candidate.capability === 'accompaniment')).toBe(true);
  });
});
