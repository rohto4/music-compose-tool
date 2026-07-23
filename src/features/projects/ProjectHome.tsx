import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties, FormEvent } from 'react';
import type { AudioEngine } from '../../domain/audio';
import { PPQ } from '../../domain/music';
import type { EntryMode, Genre, Project } from '../../domain/music';
import { MOOD_OPTIONS } from '../../domain/music/mood-options';

export type NewProjectStartMode = 'ai-starter' | EntryMode;

export interface NewProjectDraft {
  title: string;
  startMode: NewProjectStartMode;
  genre: Genre;
  mood: string;
  targetDurationSeconds: number;
  key: string;
  bpm: number;
}

interface ProjectHomeProps {
  projects: Project[];
  audioEngine: AudioEngine;
  creating: boolean;
  draft: NewProjectDraft;
  busy: boolean;
  onCreatingChange: (value: boolean) => void;
  onDraftChange: (draft: NewProjectDraft) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onOpen: (project: Project, surface: EntryMode) => void;
  onExport: (project: Project) => void;
  onImport: (file: File) => void;
}

const surfaceOptions: ReadonlyArray<{ id: NewProjectStartMode; label: string; short: string; description: string; state: string }> = [
  { id: 'patchboard', label: 'パッチボードで組む', short: '01 · PATCHBOARD', description: 'コード、音色、伴奏を自分で選び、4小節ずつ曲の骨格を組みます。', state: '現在のメイン機能' },
  { id: 'ai-starter', label: 'AIで土台 → 鼻歌を追加', short: '02 · AI + HUMMING', description: '選んだ曲の条件から編集可能な土台を作り、あとから鼻歌メロディを重ねます。', state: '次の制作フェーズ' },
  { id: 'humming-studio', label: '鼻歌をもとに曲を作る', short: '03 · HUMMING FIRST', description: '最初の鼻歌をメロディの種にして、伴奏と展開を組み立てます。', state: 'Experimental · 品質改善待ち' },
];

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function projectDurationTick(project: Project): number {
  const arrangementEnd = project.arrangement.sections.reduce((end, section) => Math.max(end, (section.startBar + section.bars) * 4 * PPQ), 0);
  const contentEnd = project.tracks.flatMap((track) => track.lanes).reduce((end, lane) => Math.max(
    end,
    ...lane.notes.map((note) => note.startTick + note.durationTick),
    ...lane.audioClips.map((clip) => clip.startTick + clip.durationTick),
    ...lane.blocks.map((block) => block.startTick + block.durationTick),
  ), 0);
  return Math.max(16 * PPQ, arrangementEnd, contentEnd);
}

function timeLabel(seconds: number): string {
  const rounded = Math.max(0, Math.round(seconds));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

export function ProjectHome({ projects, audioEngine, creating, draft, busy, onCreatingChange, onDraftChange, onCreate, onOpen, onExport, onImport }: ProjectHomeProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const stopTimer = useRef<number | null>(null);
  const [previewProjectId, setPreviewProjectId] = useState<string | null>(null);
  const [previewTick, setPreviewTick] = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewStartedAt, setPreviewStartedAt] = useState<number | null>(null);
  const [previewStartTick, setPreviewStartTick] = useState(0);
  const [routeConfirmed, setRouteConfirmed] = useState(false);
  const patchDraft = <K extends keyof NewProjectDraft>(key: K, value: NewProjectDraft[K]) => onDraftChange({ ...draft, [key]: value });
  const draftMoods = draft.mood.split(/[、,]/).map((item) => item.trim()).filter(Boolean);
  const patchMood = (index: number, value: string) => {
    const next = [draftMoods[0] ?? MOOD_OPTIONS[0], draftMoods[1] ?? MOOD_OPTIONS[1]];
    next[index] = value;
    patchDraft('mood', next.join('、'));
  };
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onImport(file);
    event.target.value = '';
  };
  const clearPreviewTimer = () => {
    if (stopTimer.current === null) return;
    window.clearTimeout(stopTimer.current);
    stopTimer.current = null;
  };
  const stopPreview = (keepPosition = true) => {
    clearPreviewTimer();
    audioEngine.stop();
    setPreviewPlaying(false);
    setPreviewStartedAt(null);
    if (!keepPosition) {
      setPreviewProjectId(null);
      setPreviewTick(0);
    }
  };
  const playPreview = async (project: Project, startTick: number) => {
    const durationTick = projectDurationTick(project);
    const bounded = Math.max(0, Math.min(startTick >= durationTick ? 0 : startTick, durationTick));
    stopPreview();
    setPreviewProjectId(project.projectId);
    setPreviewTick(bounded);
    setPreviewStartTick(bounded);
    try {
      const receipt = await audioEngine.playProject(project, bounded);
      setPreviewStartedAt(receipt.startedAt);
      setPreviewPlaying(true);
      stopTimer.current = window.setTimeout(() => {
        audioEngine.stop();
        stopTimer.current = null;
        setPreviewPlaying(false);
        setPreviewStartedAt(null);
        setPreviewTick(durationTick);
      }, receipt.durationSeconds * 1_000 + 150);
    } catch {
      setPreviewPlaying(false);
      setPreviewStartedAt(null);
    }
  };
  const seekPreview = (project: Project, nextTick: number) => {
    const durationTick = projectDurationTick(project);
    const bounded = Math.max(0, Math.min(nextTick, durationTick));
    const wasPlaying = previewPlaying && previewProjectId === project.projectId;
    stopPreview();
    setPreviewProjectId(project.projectId);
    setPreviewTick(bounded);
    if (wasPlaying) void playPreview(project, bounded);
  };

  useEffect(() => {
    if (!previewPlaying || previewStartedAt === null || previewProjectId === null) return undefined;
    const project = projects.find((candidate) => candidate.projectId === previewProjectId);
    if (!project) return undefined;
    const durationTick = projectDurationTick(project);
    const update = () => {
      const elapsedSeconds = Math.max(0, performance.now() - previewStartedAt) / 1_000;
      setPreviewTick(Math.min(durationTick, previewStartTick + elapsedSeconds * project.musicalGrid.bpm / 60 * PPQ));
    };
    update();
    const interval = window.setInterval(update, 80);
    return () => window.clearInterval(interval);
  }, [previewPlaying, previewProjectId, previewStartTick, previewStartedAt, projects]);

  useEffect(() => () => {
    audioEngine.stop();
    if (stopTimer.current !== null) window.clearTimeout(stopTimer.current);
  }, [audioEngine]);

  return (
    <main id="main" className="project-home">
      <section className="home-intro" aria-labelledby="home-title">
        <div>
          <h1 id="home-title"><span>どこから曲を</span><span>始めますか？</span></h1>
        </div>
        <div className="home-actions">
          <button className="button button-primary" type="button" onClick={() => {
            if (creating) setRouteConfirmed(false);
            onCreatingChange(!creating);
          }} aria-expanded={creating}>
            {creating ? '作成を閉じる' : '新しい曲'}
          </button>
          <button className="button" type="button" onClick={() => fileInput.current?.click()}>Projectを読み込む <small>.mctproj 専用</small></button>
          <input ref={fileInput} className="visually-hidden" type="file" accept=".mctproj" aria-label=".mctproj Project fileを読み込む" onChange={handleFile} />
        </div>
      </section>

      {creating && (
        <form className="new-project-panel" onSubmit={onCreate} aria-labelledby="new-project-title">
          <div className="panel-heading">
            <span className="section-index">01</span>
            <h2 id="new-project-title">始め方を選ぶ</h2>
          </div>
          <div className="surface-picker">
            {surfaceOptions.map((option) => (
              <label className="surface-option" data-selected={routeConfirmed && draft.startMode === option.id} key={option.id}>
                <input type="radio" name="startMode" value={option.id} checked={routeConfirmed && draft.startMode === option.id} onChange={() => {
                  patchDraft('startMode', option.id);
                  setRouteConfirmed(true);
                }} />
                <span className="surface-kicker">{option.short}</span>
                <strong>{option.label}</strong>
                <span>{option.description}</span>
                <small className="surface-state">{option.state}</small>
              </label>
            ))}
          </div>
          <div className="new-project-details" data-open={routeConfirmed}>
            {routeConfirmed && <>
              <p className="mobile-rough-note"><strong>スマホは曲・展開の設計に最適化</strong><span>コードパッド、縦型コード譜、試聴、Prompt共有を中心に使えます。精密なMIDI編集は大きな画面を推奨します。</span></p>
              <div className="project-fields" data-compact={draft.startMode === 'humming-studio'}>
                <label className="field field-title">
                  <span>曲の名前</span>
                  <input required maxLength={160} value={draft.title} onChange={(event) => patchDraft('title', event.target.value)} placeholder="例: Soda Sky" autoFocus />
                </label>
                <label className="field">
                  <span>ジャンル</span>
                  <select value={draft.genre} onChange={(event) => {
                    const genre = event.target.value as Genre;
                    onDraftChange({ ...draft, genre, bpm: genre === 'cute-future-core' ? 175 : 150 });
                  }}>
                    <option value="cute-future-bass">かわいい Future Bass</option>
                    <option value="cute-future-core">かわいい Future Core</option>
                  </select>
                </label>
                {draft.startMode !== 'humming-studio' && <>
                  <label className="field">
                    <span>ムード1</span>
                    <select aria-label="新しい曲のムード1" value={draftMoods[0] ?? MOOD_OPTIONS[0]} onChange={(event) => patchMood(0, event.target.value)}>{MOOD_OPTIONS.map((mood) => <option value={mood} key={mood}>{mood}</option>)}</select>
                  </label>
                  <label className="field">
                    <span>ムード2</span>
                    <select aria-label="新しい曲のムード2" value={draftMoods[1] ?? MOOD_OPTIONS[1]} onChange={(event) => patchMood(1, event.target.value)}>{MOOD_OPTIONS.map((mood) => <option value={mood} key={mood}>{mood}</option>)}</select>
                  </label>
                  <label className="field">
                    <span>キー</span>
                    <select value={draft.key} onChange={(event) => patchDraft('key', event.target.value)}>
                      <option>D major</option><option>E major</option><option>F major</option><option>G major</option><option>A major</option>
                      <option>B minor</option><option>C# minor</option><option>F# minor</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>BPM</span>
                    <input type="number" min={30} max={300} value={draft.bpm} onChange={(event) => patchDraft('bpm', Number(event.target.value))} />
                  </label>
                </>}
              </div>
              <div className="new-project-footer">
                <span>{draft.startMode === 'ai-starter' ? '選択内容からAIへ渡す設計promptを組み立てます。' : draft.startMode === 'humming-studio' ? 'KeyとBPMは録音後にも調整できます。' : '保存は編集画面の「保存」を押した時だけ行います。'}</span>
                <button className="button button-primary" type="submit" disabled={busy}>{busy ? '作成中…' : draft.startMode === 'ai-starter' ? 'AIで土台を作る' : draft.startMode === 'humming-studio' ? '鼻歌から始める' : 'パッチボードで始める'}</button>
              </div>
            </>}
          </div>
        </form>
      )}

      <section className="project-shelf" aria-labelledby="shelf-title">
        <div className="shelf-heading">
          <h2 id="shelf-title">保存した曲</h2>
          <span>{projects.length} PROJECTS</span>
        </div>
        {projects.length === 0 ? (
          <div className="empty-shelf">
            <strong>まだ保存した曲はありません。</strong>
            <span>「新しい曲」から始め、編集画面で保存するとここに並びます。</span>
          </div>
        ) : (
          <div className="project-list">
            {projects.map((project, index) => {
              const durationTick = projectDurationTick(project);
              const durationSeconds = durationTick / PPQ * 60 / project.musicalGrid.bpm;
              const active = previewProjectId === project.projectId;
              const currentTick = active ? previewTick : 0;
              const currentSeconds = currentTick / PPQ * 60 / project.musicalGrid.bpm;
              const skipTick = 30 * project.musicalGrid.bpm / 60 * PPQ;
              return <article className="project-card project-preview-card" data-playing={active && previewPlaying} key={project.projectId}>
                <div className="project-number">{String(index + 1).padStart(2, '0')}</div>
                <div className="project-main">
                  <div className="project-title-row">
                    <h3>{project.title}</h3>
                    <span>{project.creativeIntent.genre === 'cute-future-core' ? 'FUTURE CORE' : 'FUTURE BASS'}</span>
                  </div>
                  <p>{project.musicalGrid.key} · {project.musicalGrid.bpm} BPM · {Math.ceil(durationTick / (4 * PPQ))} bars · {timeLabel(durationSeconds)}</p>
                  <div className="project-preview-sections" aria-hidden="true">{project.arrangement.sections.map((section) => <span data-role={section.role} style={{ '--section-span': section.bars } as CSSProperties} key={section.id}>{section.label}</span>)}</div>
                  <div className="project-preview-transport">
                    <button type="button" aria-label={`${project.title}を先頭へ戻す`} title="先頭" onClick={() => seekPreview(project, 0)}>↤</button>
                    <button type="button" aria-label={`${project.title}を30秒戻す`} title="30秒戻る" onClick={() => seekPreview(project, currentTick - skipTick)}>−30</button>
                    <button className="project-preview-play" type="button" aria-label={active && previewPlaying ? `${project.title}を停止` : `${project.title}を再生`} onClick={() => active && previewPlaying ? stopPreview() : void playPreview(project, currentTick)}>{active && previewPlaying ? '■' : '▶'}</button>
                    <button type="button" aria-label={`${project.title}を30秒進める`} title="30秒進む" onClick={() => seekPreview(project, currentTick + skipTick)}>＋30</button>
                    <input type="range" min="0" max={durationTick} step={PPQ / 4} value={currentTick} aria-label={`${project.title}の再生位置`} onChange={(event) => seekPreview(project, Number(event.target.value))} style={{ '--preview-progress': `${durationTick === 0 ? 0 : currentTick / durationTick * 100}%` } as CSSProperties} />
                    <output>{timeLabel(currentSeconds)} / {timeLabel(durationSeconds)}</output>
                  </div>
                  <small>更新 {formatUpdatedAt(project.updatedAt)}</small>
                </div>
                <div className="project-card-actions">
                  <button className="button button-primary" type="button" onClick={() => onOpen(project, project.entryMode)}>続きから</button>
                  <button className="button" type="button" onClick={() => onOpen(project, project.entryMode === 'patchboard' ? 'humming-studio' : 'patchboard')}>別の画面で開く</button>
                  <button className="button button-quiet" type="button" onClick={() => onExport(project)}>project file</button>
                </div>
              </article>;
            })}
          </div>
        )}
      </section>
    </main>
  );
}
