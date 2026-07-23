import { PPQ } from './types';
import { applyKawaiiPhraseKitLayers } from './kawaii-phrase-kits';
import type { ArrangementSection, NoteEvent, Project } from './types';

interface MelodyStep {
  pitch: number;
  beats: number;
}

interface SongStarterDefinition {
  id: string;
  title: string;
  composer: string;
  summary: string;
  key: string;
  bpm: number;
  difficulty: 'やさしい' | 'ふつう';
  license: string;
  sourceLabel: string;
  sourceUrl: string;
  attribution: string;
  sections: ReadonlyArray<{ label: string; role: ArrangementSection['role']; bars: number }>;
  melody: ReadonlyArray<MelodyStep>;
  chordDegrees: ReadonlyArray<number>;
}

const quarterPhrase = (pitches: ReadonlyArray<number>): MelodyStep[] => pitches.map((pitch) => ({ pitch, beats: 1 }));

const DEFINITIONS: ReadonlyArray<SongStarterDefinition> = [
  {
    id: 'twinkle-theme',
    title: 'Ah vous dirai-je, Maman · Theme Study',
    composer: 'W. A. Mozart / traditional theme',
    summary: '同じ旋律を音色・コード・展開で変える練習に向く、8小節の主題抜粋',
    key: 'C major',
    bpm: 108,
    difficulty: 'やさしい',
    license: 'Public Domain',
    sourceLabel: 'Mutopia 2236',
    sourceUrl: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2236',
    attribution: 'Mutopia Project, edition maintained by Jeffrey Olson. App data is a newly encoded study excerpt.',
    sections: [{ label: 'Theme A', role: 'verse', bars: 8 }, { label: 'Theme B', role: 'bridge', bars: 8 }],
    melody: [
      ...quarterPhrase([60, 60, 67, 67, 69, 69]), { pitch: 67, beats: 2 },
      ...quarterPhrase([65, 65, 64, 64, 62, 62]), { pitch: 60, beats: 2 },
      ...quarterPhrase([67, 67, 65, 65, 64, 64]), { pitch: 62, beats: 2 },
      ...quarterPhrase([67, 67, 65, 65, 64, 64]), { pitch: 62, beats: 2 },
    ],
    chordDegrees: [1, 4, 1, 5, 1, 4, 5, 1],
  },
  {
    id: 'ode-to-joy-theme',
    title: 'Ode to Joy · Theme Study',
    composer: 'L. V. Beethoven',
    summary: '隣り合う音を中心にした旋律で、範囲選択やリズム変更を試しやすい8小節',
    key: 'D major',
    bpm: 116,
    difficulty: 'やさしい',
    license: 'Public Domain',
    sourceLabel: 'Mutopia 528',
    sourceUrl: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=528',
    attribution: 'Mutopia Project, score maintained by Peter Chubb. App data is a newly encoded instrumental study excerpt.',
    sections: [{ label: 'Theme', role: 'verse', bars: 8 }, { label: 'Theme Return', role: 'drop', bars: 8 }],
    melody: [
      ...quarterPhrase([64, 64, 66, 67, 67, 66, 64, 62, 61, 61, 62, 64]), { pitch: 64, beats: 1.5 }, { pitch: 62, beats: .5 }, { pitch: 62, beats: 2 },
      ...quarterPhrase([64, 64, 66, 67, 67, 66, 64, 62, 61, 61, 62, 64]), { pitch: 62, beats: 1.5 }, { pitch: 61, beats: .5 }, { pitch: 61, beats: 2 },
    ],
    chordDegrees: [1, 5, 1, 5, 1, 4, 5, 1],
  },
  {
    id: 'pachelbel-canon-harmony',
    title: 'Canon in D · Harmony Study',
    composer: 'J. Pachelbel',
    summary: '8つの和音が循環する上で、アルペジオの音色や密度を差し替える練習用',
    key: 'D major',
    bpm: 96,
    difficulty: 'ふつう',
    license: 'CC BY 4.0',
    sourceLabel: 'Mutopia 2047',
    sourceUrl: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2047',
    attribution: 'Canon per 3 Violini e Basso by J. Pachelbel, Mutopia 2047, maintained by Michael Fischer v. Mollard, CC BY 4.0. App data is a reduced study encoding.',
    sections: [{ label: 'Canon Loop', role: 'verse', bars: 8 }, { label: 'Layered Return', role: 'build', bars: 8 }],
    melody: [
      ...quarterPhrase([62, 66, 69, 66]), ...quarterPhrase([69, 73, 76, 73]),
      ...quarterPhrase([71, 74, 78, 74]), ...quarterPhrase([66, 69, 73, 69]),
      ...quarterPhrase([67, 71, 74, 71]), ...quarterPhrase([62, 66, 69, 66]),
      ...quarterPhrase([67, 71, 74, 71]), ...quarterPhrase([69, 73, 76, 73]),
    ],
    chordDegrees: [1, 5, 6, 3, 4, 1, 4, 5],
  },
  {
    id: 'bach-prelude-harmony',
    title: 'Prelude in C · Arpeggio Study',
    composer: 'J. S. Bach',
    summary: '同じ分散和音の形を保ったまま、和音と音色で流れを作る16小節',
    key: 'C major',
    bpm: 96,
    difficulty: 'ふつう',
    license: 'Public Domain',
    sourceLabel: 'Mutopia 2206',
    sourceUrl: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2206',
    attribution: 'J. S. Bach, BWV 846 Prelude I. Mutopia 2206, transcription maintained by Jeffrey Olson, Public Domain. App data is a newly encoded reduced arpeggio study.',
    sections: [{ label: 'Arpeggio Flow', role: 'intro', bars: 8 }, { label: 'Harmonic Turn', role: 'build', bars: 8 }],
    melody: [
      ...quarterPhrase([60, 64, 67, 72]), ...quarterPhrase([62, 65, 69, 74]),
      ...quarterPhrase([59, 62, 67, 71]), ...quarterPhrase([60, 64, 67, 72]),
      ...quarterPhrase([57, 60, 64, 69]), ...quarterPhrase([62, 65, 69, 74]),
      ...quarterPhrase([59, 62, 67, 71]), ...quarterPhrase([60, 64, 67, 72]),
    ],
    chordDegrees: [1, 2, 5, 1, 6, 2, 5, 1],
  },
  {
    id: 'eine-kleine-motif',
    title: 'Eine kleine Nachtmusik · Motif Study',
    composer: 'W. A. Mozart',
    summary: '短い主題と応答をsectionへ分け、音域・強弱・伴奏を変える練習用',
    key: 'G major',
    bpm: 120,
    difficulty: 'ふつう',
    license: 'Public Domain',
    sourceLabel: 'Mutopia 2230',
    sourceUrl: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2230',
    attribution: 'W. A. Mozart, Eine Kleine Nachtmusik KV 525. Mutopia 2230, maintained by Mike Blackstock, Public Domain. App data is a newly encoded simplified motif study.',
    sections: [{ label: 'Opening Motif', role: 'intro', bars: 4 }, { label: 'Answer', role: 'verse', bars: 4 }, { label: 'Return', role: 'drop', bars: 8 }],
    melody: [
      { pitch: 67, beats: 1.5 }, { pitch: 74, beats: .5 }, { pitch: 79, beats: 1 }, { pitch: 71, beats: 1 },
      { pitch: 72, beats: 1.5 }, { pitch: 71, beats: .5 }, { pitch: 69, beats: 1 }, { pitch: 67, beats: 1 },
      { pitch: 66, beats: .5 }, { pitch: 67, beats: .5 }, { pitch: 69, beats: 1 }, { pitch: 74, beats: 1 }, { pitch: 72, beats: 1 },
      { pitch: 71, beats: 1 }, { pitch: 69, beats: 1 }, { pitch: 67, beats: 2 },
    ],
    chordDegrees: [1, 5, 1, 4, 2, 5, 1, 1],
  },
  {
    id: 'beethoven-fifth-rhythm',
    title: 'Symphony No. 5 · Rhythm Motif Study',
    composer: 'L. V. Beethoven',
    summary: '短短短長の動機を繰り返し、リズムを残して音程と展開を変える16小節',
    key: 'C minor',
    bpm: 108,
    difficulty: 'やさしい',
    license: 'Public Domain',
    sourceLabel: 'Mutopia 941',
    sourceUrl: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=941',
    attribution: 'L. V. Beethoven, Symphony No. 5 Op. 67, first movement. Mutopia 941, maintained by Stelios Samelis and Johannes Heinecke, Public Domain. App data is a newly encoded motif study.',
    sections: [{ label: 'Motif', role: 'intro', bars: 4 }, { label: 'Sequence', role: 'build', bars: 4 }, { label: 'Impact', role: 'drop', bars: 8 }],
    melody: [
      { pitch: 67, beats: .5 }, { pitch: 67, beats: .5 }, { pitch: 67, beats: .5 }, { pitch: 63, beats: 2.5 },
      { pitch: 65, beats: .5 }, { pitch: 65, beats: .5 }, { pitch: 65, beats: .5 }, { pitch: 62, beats: 2.5 },
      { pitch: 67, beats: .5 }, { pitch: 67, beats: .5 }, { pitch: 67, beats: .5 }, { pitch: 63, beats: 2.5 },
      { pitch: 70, beats: .5 }, { pitch: 70, beats: .5 }, { pitch: 70, beats: .5 }, { pitch: 67, beats: 2.5 },
    ],
    chordDegrees: [1, 5, 1, 5, 6, 4, 5, 1],
  },
];

export interface SongStarterSummary extends Omit<SongStarterDefinition, 'melody' | 'chordDegrees'> {
  bars: number;
  tracks: ReadonlyArray<'Melody' | 'Chords' | 'Bass' | 'Drums' | 'Pad' | 'Arp' | 'Synth'>;
}

export const SONG_STARTERS: ReadonlyArray<SongStarterSummary> = DEFINITIONS.map((starter) => ({
  id: starter.id,
  title: starter.title,
  composer: starter.composer,
  summary: starter.summary,
  key: starter.key,
  bpm: starter.bpm,
  difficulty: starter.difficulty,
  license: starter.license,
  sourceLabel: starter.sourceLabel,
  sourceUrl: starter.sourceUrl,
  attribution: starter.attribution,
  sections: starter.sections,
  bars: starter.sections.reduce((sum, section) => sum + section.bars, 0),
  tracks: ['Melody', 'Chords', 'Bass', 'Drums', 'Pad', 'Arp', 'Synth'],
}));

const STARTER_KIT_SEQUENCES: Readonly<Record<string, readonly string[]>> = {
  'twinkle-theme': ['cloud-intro', 'candy-verse', 'soda-build', 'prism-drop'],
  'ode-to-joy-theme': ['candy-verse', 'soda-build', 'prism-drop', 'hyper-finale'],
  'pachelbel-canon-harmony': ['cloud-intro', 'candy-verse', 'bubble-break', 'soda-build'],
  'bach-prelude-harmony': ['cloud-intro', 'bubble-break', 'candy-verse', 'soda-build'],
  'eine-kleine-motif': ['candy-verse', 'soda-build', 'prism-drop', 'hyper-finale'],
  'beethoven-fifth-rhythm': ['bubble-break', 'soda-build', 'prism-drop', 'hyper-finale'],
};

export function applySongStarter(project: Project, starterId: string): void {
  const starter = DEFINITIONS.find((candidate) => candidate.id === starterId);
  if (!starter) throw new Error(`Unknown song starter: ${starterId}`);
  const melodyTrack = project.tracks.find((track) => track.id === project.melody.trackId);
  const melodyLane = melodyTrack?.lanes.find((lane) => lane.id === project.melody.laneId);
  const chordTrack = project.tracks.find((track) => track.role === 'chord');
  const chordLane = chordTrack?.lanes.find((lane) => lane.role === 'main');
  if (!melodyLane || !chordLane) throw new Error('Song starter target tracks are missing');

  const totalBars = starter.sections.reduce((sum, section) => sum + section.bars, 0);
  const totalTicks = totalBars * 4 * PPQ;
  let startTick = 0;
  let noteIndex = 0;
  const melodyNotes: NoteEvent[] = [];
  while (startTick < totalTicks) {
    for (const step of starter.melody) {
      if (startTick >= totalTicks) break;
      const durationTick = Math.min(Math.round(step.beats * PPQ), totalTicks - startTick);
      melodyNotes.push({ id: `starter|${starter.id}|melody|${noteIndex}`, pitch: step.pitch, startTick, durationTick, velocity: 88, source: 'generated', confidence: 1, userEdited: false, lockPitch: false, lockTiming: false });
      startTick += durationTick;
      noteIndex += 1;
    }
  }
  melodyLane.notes = melodyNotes;
  melodyLane.blocks = [];
  project.melody.source = 'generated';
  project.melody.lockPitch = false;
  project.melody.lockTiming = false;

  chordLane.notes = [];
  chordLane.blocks = Array.from({ length: totalBars }, (_, index) => {
    const degree = starter.chordDegrees[index % starter.chordDegrees.length] ?? 1;
    return { id: `starter|${starter.id}|chord|${index}`, assetId: `pattern:chord:v1:stable-${degree}:hold`, startTick: index * 4 * PPQ, durationTick: 4 * PPQ, granularity: 'draft' as const, parentBlockId: null };
  });
  for (const track of project.tracks.filter((candidate) => ['bass', 'arp', 'drum', 'pad', 'synth'].includes(candidate.role))) {
    for (const lane of track.lanes) lane.notes = lane.notes.filter((note) => note.source !== 'generated' || note.userEdited);
  }

  let startBar = 0;
  project.arrangement.sections = starter.sections.map((section, index) => {
    const materialized: ArrangementSection = { id: `section-starter-${starter.id}-${index}`, label: section.label, role: section.role, startBar, bars: section.bars, energyStart: index === 0 ? .28 : .52, energyEnd: index === 0 ? .5 : .78, transitionAssetId: index === 0 ? null : 'transition-soft-rise' };
    startBar += section.bars;
    return materialized;
  });
  project.arrangement.sourceAssetId = `song-starter:${starter.id}`;
  project.musicalGrid.key = starter.key;
  project.musicalGrid.bpm = starter.bpm;
  project.creativeIntent.targetDurationSeconds = Math.round(startBar * 4 * 60 / starter.bpm);
  project.loop = { enabled: true, startTick: 0, endTick: startBar * 4 * PPQ };
  const kitSequence = STARTER_KIT_SEQUENCES[starter.id] ?? ['cloud-intro'];
  for (let phraseIndex = 0; phraseIndex < Math.ceil(totalBars / 4); phraseIndex += 1) {
    applyKawaiiPhraseKitLayers(project, kitSequence[phraseIndex % kitSequence.length]!, phraseIndex);
  }
}
