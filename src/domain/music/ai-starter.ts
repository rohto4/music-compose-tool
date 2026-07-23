import { applyProjectCommand } from './project-commands';
import { createStarterMelody, generateAccompaniment } from './harmonizer';
import { inferIntentProfile, variantSeed } from './intent-refinement';
import type { Project } from './types';

export const AI_STARTER_MODEL = 'Template Harmonizer';
export const AI_STARTER_MODEL_REVISION = 'symbolic-v1';

/**
 * Create an immediately editable local foundation. The candidate records that
 * the always-available rule route was used; a future symbolic AI adapter can
 * replace this route without changing the Project contract.
 */
export function createAiStarterFoundation(project: Project, at: string): Project {
  const starterMelody = createStarterMelody(project).map((note) => ({
    ...note,
    source: 'generated' as const,
    lockPitch: false,
    lockTiming: false,
  }));
  let next = applyProjectCommand(project, {
    type: 'melody/replace',
    notes: starterMelody,
    source: 'generated',
    lockPitch: false,
    lockTiming: false,
    at,
  });
  const intent = inferIntentProfile(next);
  const accompaniment = generateAccompaniment(next, intent.variant);
  next = applyProjectCommand(next, {
    type: 'accompaniment/apply',
    lanes: accompaniment.lanes,
    assetIds: accompaniment.assetIds,
    candidate: {
      id: `ai-starter-${project.projectId}`,
      capability: 'accompaniment',
      status: 'succeeded',
      model: AI_STARTER_MODEL,
      modelRevision: AI_STARTER_MODEL_REVISION,
      seed: variantSeed(intent.variant),
      outputAssetId: null,
      inputAssetIds: [],
      intentTrace: [
        'AI Starter requested an editable symbolic foundation.',
        `Local fallback: ${AI_STARTER_MODEL} / ${intent.summary}.`,
        ...accompaniment.intentTrace,
      ],
      createdAt: at,
    },
    at,
  });
  return next;
}
