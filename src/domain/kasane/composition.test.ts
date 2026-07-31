import { describe, expect, it } from 'vitest';
import {
  HERO_KITS,
  KASANE_MOVES,
  KASANE_ROLES,
  KASANE_SCENES,
  commitSceneMove,
  commitComposition,
  createCompositionHistory,
  createCompositionState,
  materializeCompositionProject,
  previewSceneMove,
  rejectSceneMove,
  undoComposition,
} from './composition';
import type { KasaneSceneId } from './composition';

function notesOutsideScene(project: ReturnType<typeof materializeCompositionProject>, sceneId: KasaneSceneId): string {
  const scene = KASANE_SCENES.find((candidate) => candidate.id === sceneId);
  if (!scene) throw new Error(`Unknown scene: ${sceneId}`);
  const startTick = scene.startBar * 4 * 480;
  const endTick = (scene.startBar + scene.bars) * 4 * 480;
  return JSON.stringify(project.tracks.flatMap((track) => track.lanes.flatMap((lane) => lane.notes))
    .filter((note) => note.startTick < startTick || note.startTick >= endTick)
    .sort((left, right) => left.id.localeCompare(right.id)));
}

describe('KASANE composition domain', () => {
  it('exposes exactly three coherent kits, five scenes, five roles, and five moves', () => {
    expect(HERO_KITS).toHaveLength(3);
    expect(new Set(HERO_KITS.map((kit) => kit.id)).size).toBe(3);
    expect(KASANE_SCENES.map((scene) => scene.id)).toEqual(['intro', 'lift', 'drop', 'air', 'final']);
    expect(KASANE_ROLES).toEqual(['lead', 'harmony', 'bass', 'rhythm', 'texture']);
    expect(KASANE_MOVES.map((move) => move.id)).toEqual(['lift', 'strip', 'bounce', 'answer', 'break']);
    for (const kit of HERO_KITS) {
      expect(Object.keys(kit.roles).sort()).toEqual([...KASANE_ROLES].sort());
      expect(new Set(Object.values(kit.roles).map((role) => role.instrumentId)).size).toBe(5);
    }
  });

  it('keeps preview non-destructive and commits as one revision', () => {
    const initial = createCompositionState('candy-skyline');
    const preview = previewSceneMove(initial, 'drop', 'bounce');
    expect(initial.previewMoveId).toBeNull();
    expect(initial.revision).toBe(0);
    expect(preview.previewMoveId).toBe('bounce');
    expect(preview.revision).toBe(0);
    expect(preview.committedMoves.drop).toBeNull();

    const committed = commitSceneMove(preview);
    expect(committed.revision).toBe(1);
    expect(committed.previewMoveId).toBeNull();
    expect(committed.committedMoves.drop).toBe('bounce');
  });

  it('rejects a preview without changing committed state and ignores duplicate commits', () => {
    const initial = createCompositionState('prism-rush');
    const preview = previewSceneMove(initial, 'air', 'strip');
    expect(rejectSceneMove(preview)).toEqual(initial);

    const once = commitSceneMove(preview);
    const samePreview = previewSceneMove(once, 'air', 'strip');
    expect(commitSceneMove(samePreview)).toBe(once);
  });

  it('restores the complete before state with one undo', () => {
    const initial = createCompositionState('moon-soda');
    const history = createCompositionHistory(initial);
    const previewHistory = { ...history, present: previewSceneMove(history.present, 'final', 'lift') };
    const committedHistory = commitComposition(previewHistory);
    expect(committedHistory.present.committedMoves.final).toBe('lift');
    expect(undoComposition(committedHistory)).toEqual(history);
  });

  it('materializes every kit and move deterministically without touching other scenes', () => {
    for (const kit of HERO_KITS) {
      const initial = createCompositionState(kit.id);
      const baseline = materializeCompositionProject(initial);
      for (const scene of KASANE_SCENES) {
        for (const move of KASANE_MOVES) {
          const preview = previewSceneMove(initial, scene.id, move.id);
          const first = materializeCompositionProject(preview, true);
          const second = materializeCompositionProject(preview, true);
          expect(first).toEqual(second);
          expect(notesOutsideScene(first, scene.id)).toBe(notesOutsideScene(baseline, scene.id));
        }
      }
    }
  });

  it('rejects unknown catalog identifiers without mutating state', () => {
    const initial = createCompositionState('candy-skyline');
    expect(() => createCompositionState('missing-kit' as 'candy-skyline')).toThrow(/Unknown Hero Kit/);
    expect(() => previewSceneMove(initial, 'missing-scene' as 'drop', 'lift')).toThrow(/Unknown scene/);
    expect(() => previewSceneMove(initial, 'drop', 'missing-move' as 'lift')).toThrow(/Unknown move/);
    expect(initial).toEqual(createCompositionState('candy-skyline'));
  });
});
