import { describe, expect, it } from 'vitest';
import { applyProjectCommand, createChordPatternBlock, createProject } from '../../domain/music';
import {
  buildChordScore,
  buildCreativeBrief,
  createAbcChordScore,
  createCreativeBriefJson,
  createCreativeBriefMarkdown,
  createPromptFragment,
  createReadableChordChart,
} from './creative-brief';

function projectWithEightBarProgression() {
  const project = createProject({
    projectId: 'creative-brief',
    title: 'Glass / Sky',
    now: '2026-07-23T00:00:00.000Z',
    entryMode: 'patchboard',
    key: 'D major',
  });
  const track = project.tracks.find((candidate) => candidate.role === 'chord')!;
  const lane = track.lanes.find((candidate) => candidate.role === 'main')!;
  const firstPhrase = [
    createChordPatternBlock('p0-s0', 0, 'stable-1', 'hold', 1.5),
    createChordPatternBlock('p0-s1', 720, 'stable-2', 'hold', 2.5),
    createChordPatternBlock('p0-s2', 1_920, 'stable-4', 'hold', 4),
    createChordPatternBlock('p0-s3', 3_840, 'stable-5', 'hold', 4),
    createChordPatternBlock('p0-s4', 5_760, 'stable-1', 'hold', 4),
  ];
  const secondPhrase = [
    createChordPatternBlock('p1-s0', 7_680, 'stable-6', 'pulse', 4),
    createChordPatternBlock('p1-s1', 9_600, 'stable-4', 'pulse', 4),
    createChordPatternBlock('p1-s2', 11_520, 'stable-2', 'pulse', 4),
    createChordPatternBlock('p1-s3', 13_440, 'stable-5', 'pulse', 4),
  ];
  return applyProjectCommand(project, {
    type: 'pattern/chords-sequence',
    trackId: track.id,
    laneId: lane.id,
    blocks: [...firstPhrase, ...secondPhrase],
    loopEndTick: 15_360,
    at: '2026-07-23T00:01:00.000Z',
  });
}

describe('Creative Brief and chord score export', () => {
  it('preserves bar lines and eighth-note chord durations in readable and ABC forms', () => {
    const project = projectWithEightBarProgression();
    const bars = buildChordScore(project);
    expect(bars).toHaveLength(8);
    expect(bars[0]).toEqual({
      bar: 1,
      segments: [
        { symbol: 'D', eighths: 3, beats: 1.5 },
        { symbol: 'Em', eighths: 5, beats: 2.5 },
      ],
    });
    expect(createReadableChordChart(project)).toContain('BAR 01 | D (1.5拍・付点4分音符) | Em (2.5拍)');

    const abc = createAbcChordScore(project);
    expect(abc).toContain('M:4/4');
    expect(abc).toContain('L:1/8');
    expect(abc).toContain('Q:1/4=');
    expect(abc).toContain('K:D');
    expect(abc).toContain('"D"z3 "Em"z5 |');
    expect(abc.endsWith('|]')).toBe(true);
  });

  it('exports an instrumental-only whole-song design for external and local AI handoff', () => {
    const project = projectWithEightBarProgression();
    const brief = buildCreativeBrief(project);
    expect(brief.constraints).toEqual({ instrumentalOnly: true, allowLyrics: false, allowVocals: false, mainLineType: 'instrumental-melody' });
    expect(brief.harmony.totalBars).toBe(8);
    expect(brief.arrangement.length).toBeGreaterThan(0);
    expect(brief.tracks.some((track) => track.role === 'chord')).toBe(true);
    expect(brief.generationPrompt).toContain('Instrumental only. No vocals');

    const markdown = createCreativeBriefMarkdown(project);
    expect(markdown).toContain('外部生成アプリではInstrumental modeを有効にする');
    expect(markdown).toContain('## コード譜');
    expect(createPromptFragment(project, 'chords')).toContain('No vocals, no spoken words, and no lyrics.');

    const json: unknown = JSON.parse(createCreativeBriefJson(project));
    expect(json).toMatchObject({
      format: 'patchtone-creative-brief',
      constraints: { allowLyrics: false, allowVocals: false },
      harmony: { totalBars: 8 },
    });
  });
});
