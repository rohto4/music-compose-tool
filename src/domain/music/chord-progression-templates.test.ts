import { describe, expect, it } from 'vitest';
import { CHORD_PROGRESSION_TICKS, parseChordPatternAssetId } from './chord-patterns';
import {
  CHORD_PROGRESSION_TEMPLATES,
  chordProgressionTemplateById,
  createChordProgressionTemplateBlocks,
  previewChordProgressionTemplate,
} from './chord-progression-templates';

describe('chord progression templates', () => {
  it('offers source-labelled major and minor starting points with unique identities', () => {
    expect(CHORD_PROGRESSION_TEMPLATES.length).toBeGreaterThanOrEqual(9);
    expect(new Set(CHORD_PROGRESSION_TEMPLATES.map((template) => template.id)).size).toBe(CHORD_PROGRESSION_TEMPLATES.length);
    expect(CHORD_PROGRESSION_TEMPLATES.some((template) => template.mode === 'major')).toBe(true);
    expect(CHORD_PROGRESSION_TEMPLATES.some((template) => template.mode === 'minor')).toBe(true);
    expect(CHORD_PROGRESSION_TEMPLATES.every((template) => template.sourceLabel && template.degreeLabel && template.description)).toBe(true);
  });

  it('materializes every template as one exact four-bar phrase', () => {
    for (const template of CHORD_PROGRESSION_TEMPLATES) {
      const blocks = createChordProgressionTemplateBlocks(template, 2, 'pulse');
      expect(blocks).toHaveLength(template.steps.length);
      expect(blocks[0]?.startTick).toBe(2 * CHORD_PROGRESSION_TICKS);
      expect(blocks.reduce((sum, block) => sum + block.durationTick, 0)).toBe(CHORD_PROGRESSION_TICKS);
      expect(blocks.at(-1)!.startTick + blocks.at(-1)!.durationTick).toBe(3 * CHORD_PROGRESSION_TICKS);
      expect(blocks.every((block) => parseChordPatternAssetId(block.assetId)?.rhythmId === 'pulse')).toBe(true);
    }
  });

  it('keeps degree identity while previewing the same Pop Axis progression in another key', () => {
    const template = chordProgressionTemplateById('pop-axis')!;
    expect(template.steps.map((step) => step.padId)).toEqual(['stable-1', 'stable-5', 'stable-6', 'stable-4']);
    expect(previewChordProgressionTemplate('D major', template).symbols).toEqual(['D', 'A', 'Bm', 'G']);
    expect(previewChordProgressionTemplate('A major', template).symbols).toEqual(['A', 'E', 'F#m', 'D']);
  });
});
