import type { Project } from './types';

export type AccompanimentVariant = 'sparkle' | 'soft' | 'driving';

export interface IntentProfile {
  variant: AccompanimentVariant;
  mood: string[];
  summary: string;
}

const BRIGHT = ['明る', 'きらきら', 'かわい', 'spark', 'bright', 'happy', '前向き'];
const SOFT = ['優し', '静か', 'ふわ', '切な', 'soft', 'gentle', 'calm', '悲し'];
const DRIVING = ['激し', '強く', '速く', 'ドラム', '勢い', 'hard', 'drive', 'energetic', 'core'];

function includesAny(value: string, words: string[]): boolean {
  const normalized = value.toLowerCase();
  return words.some((word) => normalized.includes(word));
}

export function inferIntentProfile(project: Project, instruction = ''): IntentProfile {
  const source = [project.creativeIntent.freeText, project.creativeIntent.mood.join(' '), instruction].join(' ');
  const variant: AccompanimentVariant = includesAny(source, DRIVING)
    ? 'driving'
    : includesAny(source, SOFT)
      ? 'soft'
      : 'sparkle';
  const mood = [...new Set([
    ...project.creativeIntent.mood,
    ...(includesAny(instruction, BRIGHT) ? ['きらきら'] : []),
    ...(includesAny(instruction, SOFT) ? ['やさしい'] : []),
    ...(includesAny(instruction, DRIVING) ? ['勢い'] : []),
  ])];
  const summary = variant === 'driving' ? 'ドラムと低音を前へ出す' : variant === 'soft' ? '余白とパッドを増やす' : 'きらめくアルペジオを足す';
  return { variant, mood, summary };
}

export function alternateVariant(variant: AccompanimentVariant): AccompanimentVariant {
  if (variant === 'driving' || variant === 'soft') return 'sparkle';
  return 'soft';
}

export function variantFromSeed(seed: number | null): AccompanimentVariant {
  if (seed === 2) return 'soft';
  if (seed === 3) return 'driving';
  return 'sparkle';
}

export function variantSeed(variant: AccompanimentVariant): number {
  if (variant === 'soft') return 2;
  if (variant === 'driving') return 3;
  return 1;
}
