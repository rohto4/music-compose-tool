import type { ArrangementSection, SectionRole } from '../../domain/music';

export const SECTION_TEMPLATES: ReadonlyArray<{ role: SectionRole; label: string; energyStart: number; energyEnd: number }> = [
  { role: 'intro', label: 'Intro', energyStart: .15, energyEnd: .35 },
  { role: 'verse', label: 'Verse', energyStart: .34, energyEnd: .5 },
  { role: 'build', label: 'Build', energyStart: .48, energyEnd: .82 },
  { role: 'drop', label: 'Drop', energyStart: .92, energyEnd: .86 },
  { role: 'break', label: 'Break', energyStart: .28, energyEnd: .4 },
  { role: 'bridge', label: 'Bridge', energyStart: .42, energyEnd: .66 },
  { role: 'outro', label: 'Outro', energyStart: .35, energyEnd: .12 },
];

export interface ArrangementAssetTemplate {
  id: string;
  name: string;
  summary: string;
  sections: ReadonlyArray<{
    id: string;
    label: string;
    role: SectionRole;
    bars: number;
    energyStart: number;
    energyEnd: number;
    transition: 'fade' | 'riser' | 'impact' | 'tape' | 'bloom';
  }>;
}

export const ARRANGEMENT_TEMPLATES: ReadonlyArray<ArrangementAssetTemplate> = [
  {
    id: 'quick-sketch',
    name: 'Quick Sketch',
    summary: '短いラフを一気に最後まで通して聴く',
    sections: [
      { id: 'intro', label: 'Intro', role: 'intro', bars: 4, energyStart: .18, energyEnd: .32, transition: 'fade' },
      { id: 'verse', label: 'Verse', role: 'verse', bars: 8, energyStart: .35, energyEnd: .5, transition: 'bloom' },
      { id: 'build', label: 'Build', role: 'build', bars: 4, energyStart: .52, energyEnd: .78, transition: 'riser' },
      { id: 'drop', label: 'Drop', role: 'drop', bars: 8, energyStart: .95, energyEnd: .88, transition: 'impact' },
      { id: 'outro', label: 'Outro', role: 'outro', bars: 4, energyStart: .35, energyEnd: .14, transition: 'fade' },
    ],
  },
  {
    id: 'twin-drop',
    name: 'Twin Drop',
    summary: '2回のドロップで主役をしっかり見せる',
    sections: [
      { id: 'intro', label: 'Intro', role: 'intro', bars: 8, energyStart: .15, energyEnd: .35, transition: 'fade' },
      { id: 'build', label: 'Build', role: 'build', bars: 8, energyStart: .35, energyEnd: .72, transition: 'riser' },
      { id: 'drop-a', label: 'Drop A', role: 'drop', bars: 16, energyStart: .92, energyEnd: .86, transition: 'impact' },
      { id: 'break', label: 'Break', role: 'break', bars: 8, energyStart: .28, energyEnd: .4, transition: 'tape' },
      { id: 'bridge', label: 'Bridge', role: 'bridge', bars: 8, energyStart: .42, energyEnd: .66, transition: 'bloom' },
      { id: 'drop-b', label: 'Drop B', role: 'drop', bars: 16, energyStart: .94, energyEnd: .9, transition: 'impact' },
      { id: 'outro', label: 'Outro', role: 'outro', bars: 8, energyStart: .34, energyEnd: .14, transition: 'fade' },
    ],
  },
  {
    id: 'gentle-rise',
    name: 'Gentle Rise',
    summary: '小さく始めて最後のドロップへ集める',
    sections: [
      { id: 'intro-soft', label: 'Soft Intro', role: 'intro', bars: 8, energyStart: .12, energyEnd: .28, transition: 'fade' },
      { id: 'verse', label: 'Verse', role: 'verse', bars: 16, energyStart: .3, energyEnd: .48, transition: 'bloom' },
      { id: 'build-long', label: 'Long Build', role: 'build', bars: 16, energyStart: .46, energyEnd: .78, transition: 'riser' },
      { id: 'drop-main', label: 'Main Drop', role: 'drop', bars: 16, energyStart: .94, energyEnd: .88, transition: 'impact' },
      { id: 'reply', label: 'Reply Bridge', role: 'bridge', bars: 8, energyStart: .42, energyEnd: .56, transition: 'bloom' },
      { id: 'outro-soft', label: 'Outro', role: 'outro', bars: 8, energyStart: .34, energyEnd: .12, transition: 'fade' },
    ],
  },
  {
    id: 'story-break',
    name: 'Story Break',
    summary: '中盤を静かにして後半の変化を強くする',
    sections: [
      { id: 'opening', label: 'Opening', role: 'intro', bars: 8, energyStart: .16, energyEnd: .3, transition: 'fade' },
      { id: 'drop-early', label: 'Early Drop', role: 'drop', bars: 16, energyStart: .86, energyEnd: .8, transition: 'impact' },
      { id: 'story', label: 'Story', role: 'break', bars: 16, energyStart: .24, energyEnd: .34, transition: 'bloom' },
      { id: 'bridge-return', label: 'Bridge', role: 'bridge', bars: 8, energyStart: .42, energyEnd: .58, transition: 'riser' },
      { id: 'rebuild', label: 'Rebuild', role: 'build', bars: 8, energyStart: .5, energyEnd: .76, transition: 'riser' },
      { id: 'final-drop', label: 'Final Drop', role: 'drop', bars: 16, energyStart: .96, energyEnd: .92, transition: 'impact' },
      { id: 'ending', label: 'Ending', role: 'outro', bars: 8, energyStart: .3, energyEnd: .1, transition: 'fade' },
    ],
  },
];

function transitionAssetId(transition: ArrangementAssetTemplate['sections'][number]['transition']): string | null {
  return transition === 'riser' ? 'transition-soft-rise' : null;
}

export function materializeArrangementTemplate(asset: ArrangementAssetTemplate): ArrangementSection[] {
  return asset.sections.map((section) => ({
    id: `section-${asset.id}-${section.id}`,
    role: section.role,
    label: section.label,
    startBar: 0,
    bars: section.bars,
    energyStart: section.energyStart,
    energyEnd: section.energyEnd,
    transitionAssetId: transitionAssetId(section.transition),
  }));
}
