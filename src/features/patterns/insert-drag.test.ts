import { describe, expect, it } from 'vitest';
import { canDropOnPhrase, canDropOnStep, parseInsertDragPayload } from './insert-drag';

describe('insert drag payload', () => {
  it('accepts only bounded versioned insert payload shapes', () => {
    const chord = parseInsertDragPayload(JSON.stringify({ kind: 'chord', padId: 'stable-1', label: 'D' }));
    const asset = parseInsertDragPayload(JSON.stringify({ kind: 'asset', assetId: 'fx-air-wash', label: 'Air Wash' }));
    expect(chord).toEqual({ kind: 'chord', padId: 'stable-1', label: 'D' });
    expect(asset).toEqual({ kind: 'asset', assetId: 'fx-air-wash', label: 'Air Wash' });
    expect(parseInsertDragPayload('{broken')).toBeNull();
    expect(parseInsertDragPayload(JSON.stringify({ kind: 'role-pattern', role: 'fx', patternId: 'bad', label: 'Bad' }))).toBeNull();
    expect(parseInsertDragPayload('x'.repeat(641))).toBeNull();
  });

  it('routes chord items to steps and all other insert items to phrases', () => {
    const chord = { kind: 'chord', padId: 'stable-1', label: 'D' } as const;
    const kit = { kind: 'phrase-kit', kitId: 'cloud-intro', label: 'Cloud Intro' } as const;
    expect(canDropOnStep(chord)).toBe(true);
    expect(canDropOnPhrase(chord)).toBe(false);
    expect(canDropOnPhrase(kit)).toBe(true);
    expect(canDropOnStep(kit)).toBe(false);
  });
});
