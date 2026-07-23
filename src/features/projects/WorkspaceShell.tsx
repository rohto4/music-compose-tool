import { useEffect, useRef, useState } from 'react';
import type { AudioEngine } from '../../domain/audio';
import type { HummingAssetRepository, HummingTranscriber, MicrophoneRecorder } from '../../application/humming/humming-ports';
import type { EntryMode, Project, ProjectCommand, SoundChunk } from '../../domain/music';
import { chordPatternRanges, materializeChordPatternNotes, materializeSoundChunk, PPQ } from '../../domain/music';
import { CHORD_KEY_OPTIONS } from '../../domain/music/chord-progression-templates';
import { MOOD_OPTIONS } from '../../domain/music/mood-options';
import { ARRANGEMENT_TEMPLATES, materializeArrangementTemplate, SECTION_TEMPLATES } from '../arrangement/arrangement-templates';
import { AccompanimentPanel } from '../humming/AccompanimentPanel';
import { HummingRecorder } from '../humming/HummingRecorder';
import { audioBlobToWav } from '../../adapters/humming/basic-pitch-transcriber';
import { DawMelodyEditor } from '../melody/DawMelodyEditor';
import { ChordPatternBoard } from '../patterns/ChordPatternBoard';
import { CreativeBriefPanel } from './CreativeBriefPanel';
import { SongStarterBrowser } from './SongStarterBrowser';
import { createMidiBlob, createStemBundle, createWavBlob } from '../../application/audio/exports';
import { downloadBlob } from '../../application/projects/project-bundle';
import { buildMisskeyShareUrl, buildXShareUrl, postMisskeyNote } from '../../application/share/share-intent';
import { SHORTCUT_COMMAND_EVENT, shortcutCommandId } from '../../application/shortcuts/shortcut-registry';

interface WorkspaceShellProps {
  project: Project;
  surface: EntryMode;
  dirty: boolean;
  busy: boolean;
  audioEngine: AudioEngine;
  microphoneRecorder: MicrophoneRecorder;
  hummingTranscriber: HummingTranscriber;
  hummingAssetRepository: HummingAssetRepository;
  inspectHummingDuration: (blob: Blob) => Promise<number>;
  createHummingId: () => string;
  now: () => string;
  onHome: () => void;
  onSave: () => void;
  onExport: () => void;
  onSwitchSurface: (surface: EntryMode) => void;
  onCommand: (command: ProjectCommand) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const patchboardTabs = ['曲の設計', '展開を整える', '詳細の編集'];

function arrangementDurationSeconds(project: Project): number {
  const totalBars = project.arrangement.sections.reduce((sum, section) => sum + section.bars, 0);
  return totalBars * 4 * 60 / project.musicalGrid.bpm;
}

function templateDurationSeconds(project: Project, template: typeof ARRANGEMENT_TEMPLATES[number]): number {
  return template.sections.reduce((sum, section) => sum + section.bars, 0) * 4 * 60 / project.musicalGrid.bpm;
}

function durationLabel(seconds: number): string {
  const rounded = Math.max(0, Math.round(seconds));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

function selectableMoods(current: string): readonly string[] {
  return current && !MOOD_OPTIONS.some((mood) => mood === current) ? [current, ...MOOD_OPTIONS] : MOOD_OPTIONS;
}

export function WorkspaceShell({ project, surface, dirty, busy, audioEngine, microphoneRecorder, hummingTranscriber, hummingAssetRepository, inspectHummingDuration, createHummingId, now, onHome, onSave, onExport, onSwitchSurface, onCommand, canUndo, canRedo, onUndo, onRedo }: WorkspaceShellProps) {
  const humming = surface === 'humming-studio';
  const [playing, setPlaying] = useState(false);
  const [audioMessage, setAudioMessage] = useState<string | null>(null);
  const [playbackStartTick, setPlaybackStartTick] = useState(0);
  const [playbackStartedAt, setPlaybackStartedAt] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [midiJump, setMidiJump] = useState(0);
  const stopTimer = useRef<number | null>(null);

  const clearPlaybackTimer = () => {
    if (stopTimer.current === null) return;
    window.clearTimeout(stopTimer.current);
    stopTimer.current = null;
  };

  useEffect(() => () => {
    audioEngine.stop();
    if (stopTimer.current !== null) window.clearTimeout(stopTimer.current);
  }, [audioEngine]);

  const togglePlayback = async (requestedStartTick?: number) => {
    if (playing && requestedStartTick === undefined) {
      clearPlaybackTimer();
      audioEngine.stop();
      setPlaying(false);
      setPlaybackStartedAt(null);
      setAudioMessage('停止しました');
      return;
    }
    if (playing) {
      clearPlaybackTimer();
      audioEngine.stop();
      setPlaying(false);
    }
    const startTick = Math.max(0, requestedStartTick ?? 0);
    try {
      clearPlaybackTimer();
      const receipt = await audioEngine.playProject(project, startTick);
      setPlaybackStartTick(startTick);
      setPlaybackStartedAt(receipt.startedAt);
      setPlaying(true);
      const startBar = Math.floor(startTick / (4 * PPQ)) + 1;
      setAudioMessage(`曲全体 · ${Math.round(receipt.durationSeconds)} sec · BAR ${startBar}から再生`);
      stopTimer.current = window.setTimeout(() => {
        audioEngine.stop();
        stopTimer.current = null;
        setPlaying(false);
        setPlaybackStartedAt(null);
        setAudioMessage('曲全体の再生が終わりました');
      }, receipt.durationSeconds * 1_000 + 150);
    } catch (reason) {
      setAudioMessage(reason instanceof Error ? reason.message : '再生を開始できませんでした。');
    }
  };
  const togglePlaybackRef = useRef(togglePlayback);
  useEffect(() => { togglePlaybackRef.current = togglePlayback; });
  useEffect(() => {
    const handleShortcutCommand = (event: Event) => {
      if (shortcutCommandId(event) === 'transport.play-toggle') void togglePlaybackRef.current();
    };
    window.addEventListener(SHORTCUT_COMMAND_EVENT, handleShortcutCommand);
    return () => window.removeEventListener(SHORTCUT_COMMAND_EVENT, handleShortcutCommand);
  }, []);
  const auditionWorkspaceAsset = async (assetId: string, label: string) => {
    clearPlaybackTimer();
    if (playing) {
      audioEngine.stop();
      setPlaying(false);
    }
    try {
      const receipt = await audioEngine.audition(assetId);
      setAudioMessage(`単体試聴: ${label} · ${receipt.durationSeconds.toFixed(1)} sec`);
    } catch (reason) {
      setAudioMessage(reason instanceof Error ? reason.message : `${label}を試聴できませんでした。`);
    }
  };
  const auditionWorkspaceNotes = async (trackId: string, noteIds: string[], label: string) => {
    clearPlaybackTimer();
    audioEngine.stop();
    if (playing) setPlaying(false);
    try {
      if (!audioEngine.auditionNotes) throw new Error('選択ブロック試聴を利用できません。');
      const receipt = await audioEngine.auditionNotes(project, trackId, noteIds);
      setAudioMessage(`選択ブロック試聴: ${label} · ${receipt.durationSeconds.toFixed(1)} sec`);
    } catch (reason) {
      setAudioMessage(reason instanceof Error ? reason.message : '選択ブロックを試聴できませんでした。');
    }
  };
  const auditionWorkspaceSoundChunk = async (chunk: SoundChunk) => {
    clearPlaybackTimer();
    audioEngine.stop();
    if (playing) setPlaying(false);
    try {
      if (!audioEngine.auditionNotes) throw new Error('音の塊の試聴を利用できません。');
      const previewProject = structuredClone(project);
      const previewTrack = previewProject.tracks.find((candidate) => candidate.role === chunk.role);
      const previewLane = previewTrack?.lanes.find((candidate) => candidate.role === 'main');
      if (!previewTrack || !previewLane) throw new Error(`${chunk.role}トラックが見つかりません。`);
      const notes = materializeSoundChunk(chunk, 0, 'preview');
      previewTrack.instrumentId = chunk.instrumentId;
      previewLane.notes.push(...notes);
      const receipt = await audioEngine.auditionNotes(previewProject, previewTrack.id, notes.map((note) => note.id));
      setAudioMessage(`音の塊を試聴: ${chunk.label} · ${receipt.durationSeconds.toFixed(1)} sec`);
    } catch (reason) {
      setAudioMessage(reason instanceof Error ? reason.message : `${chunk.label}を試聴できませんでした。`);
    }
  };
  const exportAudio = async (kind: 'wav' | 'midi' | 'stems') => {
    setExporting(true);
    try {
      if (kind === 'midi') downloadBlob(createMidiBlob(project), `${project.title || 'patchtone'}.mid`);
      else if (kind === 'stems') { const bundle = await createStemBundle(project); downloadBlob(bundle.blob, bundle.fileName); }
      else downloadBlob(await createWavBlob(project), `${project.title || 'patchtone'}.wav`);
      setAudioMessage(`${kind.toUpperCase()}を書き出しました`);
    } catch (reason) {
      setAudioMessage(reason instanceof Error ? reason.message : '書き出しに失敗しました');
    } finally { setExporting(false); }
  };
  const openMidiEditor = () => {
    const ranges = chordPatternRanges(project);
    const chordTrack = project.tracks.find((track) => track.role === 'chord');
    const chordLane = chordTrack?.lanes.find((lane) => lane.role === 'main');
    if (ranges.length > 0 && chordTrack && chordLane) {
      onCommand({ type: 'pattern/chords-materialize', trackId: chordTrack.id, laneId: chordLane.id, blockIds: ranges.map((range) => range.blockId), notes: materializeChordPatternNotes(project), at: now() });
    }
    if (humming) onSwitchSurface('patchboard');
    setMidiJump((value) => value + 1);
  };
  const shareX = () => window.open(buildXShareUrl(`${project.title} — ${project.musicalGrid.key} ${project.musicalGrid.bpm} BPM`, window.location.href), '_blank', 'noopener,noreferrer');
  const shareMisskey = () => {
    const instance = window.prompt('Misskeyのinstance URL（例: https://misskey.io）');
    if (!instance) return;
    try { window.open(buildMisskeyShareUrl(instance, `${project.title} — Patchtoneで作曲中`, window.location.href), '_blank', 'noopener,noreferrer'); }
    catch (reason) { setAudioMessage(reason instanceof Error ? reason.message : 'Misskey共有URLを作れませんでした'); }
  };
  const postMisskey = async () => {
    const instance = window.prompt('Misskeyのinstance URL（例: https://misskey.io）');
    if (!instance) return;
    const token = window.prompt('Misskey access token（一時利用。保存しません）');
    if (!token) return;
    try {
      const result = await postMisskeyNote(instance, token, `${project.title} — Patchtoneで作曲中`, { url: window.location.href, visibility: 'public' });
      setAudioMessage(`Misskeyへ投稿しました（${result.id}）`);
    } catch (reason) { setAudioMessage(reason instanceof Error ? reason.message : 'Misskey投稿に失敗しました'); }
  };
  return (
    <main id="main" className="workspace-shell">
      <div className="workspace-bar">
        <div className="workspace-left">
          <nav className="surface-switcher" aria-label="作曲画面">
            <button type="button" aria-label="PATCHBOARD" title="Patchboard" aria-current={!humming ? 'page' : undefined} onClick={() => onSwitchSurface('patchboard')}><span aria-hidden="true">P</span></button>
            <button type="button" aria-label="HUMMING STUDIO" title="Humming Studio" aria-current={humming ? 'page' : undefined} onClick={() => onSwitchSurface('humming-studio')}><span aria-hidden="true">H</span></button>
          </nav>
          <button className="text-button" type="button" onClick={onHome}>← 曲の一覧</button>
        </div>
        <div className="workspace-project">
          <strong>{project.title}</strong>
          <span>{project.musicalGrid.key} · {project.musicalGrid.bpm} BPM</span>
        </div>
        <div className="workspace-actions">
          <button className="transport-button" type="button" onClick={() => void togglePlayback()} aria-pressed={playing}>{playing ? '■ 停止' : '▶ 再生'}</button>
          <button className="history-button" type="button" onClick={onUndo} disabled={!canUndo} aria-label="元に戻す">↶</button>
          <button className="history-button" type="button" onClick={onRedo} disabled={!canRedo} aria-label="やり直す">↷</button>
          <span className="save-state" data-dirty={dirty}>{dirty ? '未保存' : '保存済み'}</span>
          <button className="button" type="button" onClick={() => void exportAudio('wav')} disabled={exporting}>WAV</button>
          <button className="button" type="button" onClick={() => void exportAudio('stems')} disabled={exporting}>STEMS</button>
          <button className="button" type="button" onClick={() => void exportAudio('midi')} disabled={exporting}>MIDI</button>
          <button className="button" type="button" onClick={onExport}>project file</button>
          <button className="button" type="button" onClick={shareX}>X共有</button>
          <button className="button" type="button" onClick={shareMisskey}>Misskey共有</button>
          <button className="button" type="button" onClick={() => void postMisskey()}>Misskeyへ投稿</button>
          <button className="button button-primary" type="button" onClick={onSave} disabled={busy || !dirty}>{busy ? '保存中…' : '保存'}</button>
        </div>
      </div>
      {audioMessage && <div className="transport-status" role="status">{audioMessage}</div>}

      <section className="midi-convergence" aria-label="共通MIDI編集への導線">
        <strong>3つの入口 → 同じMIDI譜面</strong>
        <span>{project.melody.source === 'humming' ? '鼻歌' : project.generationCandidates.some((candidate) => candidate.id.startsWith('ai-starter-')) ? 'AI Starter' : 'Pattern Board'}の音を、コード・ベース・ドラム等のtrack別に保持</span>
        <button className="button button-primary" type="button" onClick={openMidiEditor}>MIDI譜面を編集</button>
      </section>

      {humming ? <HummingStudioStart project={project} audioEngine={audioEngine} recorder={microphoneRecorder} transcriber={hummingTranscriber} assetRepository={hummingAssetRepository} inspectDuration={inspectHummingDuration} createId={createHummingId} now={now} onCommand={onCommand} /> : <PatchboardStart key={`patchboard-${midiJump}`} project={project} engine={audioEngine} now={now} onCommand={onCommand} onProjectExport={onExport} initialDetail={midiJump > 0} playing={playing} playbackMessage={audioMessage} playbackStartTick={playbackStartTick} playbackStartedAt={playbackStartedAt} onTogglePlayback={(startTick) => void togglePlayback(startTick)} onAuditionAsset={auditionWorkspaceAsset} onAuditionNotes={auditionWorkspaceNotes} onAuditionSoundChunk={auditionWorkspaceSoundChunk} />}
    </main>
  );
}

function HummingStudioStart({ project, audioEngine, recorder, transcriber, assetRepository, inspectDuration, createId, now, onCommand }: { project: Project; audioEngine: AudioEngine; recorder: MicrophoneRecorder; transcriber: HummingTranscriber; assetRepository: HummingAssetRepository; inspectDuration: (blob: Blob) => Promise<number>; createId: () => string; now: () => string; onCommand: (command: ProjectCommand) => void }) {
  const melodyNotes = project.tracks.find((track) => track.id === project.melody.trackId)?.lanes.find((lane) => lane.id === project.melody.laneId)?.notes.length ?? 0;
  const hasAccompaniment = project.generationCandidates.some((candidate) => candidate.capability === 'accompaniment' && candidate.status === 'succeeded');
  const hasIntent = project.creativeIntent.freeText.trim().length > 0 || project.creativeIntent.spokenIntentAssetId !== null || project.creativeIntent.referenceAssetIds.length > 0;
  const currentStep = hasAccompaniment ? 3 : melodyNotes > 0 ? hasIntent ? 2 : 1 : 0;
  return (
    <section className="humming-studio" aria-labelledby="humming-studio-title">
      <header className="studio-heading">
        <h1 id="humming-studio-title">鼻歌から一曲を作る</h1>
        <div className="condition-strip" aria-label="曲の条件">
          <span>{project.creativeIntent.genre === 'cute-future-core' ? 'Future Core' : 'Future Bass'}</span>
          <span>{project.creativeIntent.mood.join(' / ') || '雰囲気 未設定'}</span>
          <span>{project.creativeIntent.targetDurationSeconds} sec</span>
        </div>
      </header>
      <ol className="studio-steps">
        <li className={currentStep === 0 ? 'is-current' : ''}><span>01</span><strong>鼻歌を録る</strong><small>30秒以内の部分take</small></li>
        <li className={currentStep === 1 ? 'is-current' : ''}><span>02</span><strong>イメージを足す</strong><small>文章・声・参考音</small></li>
        <li className={currentStep === 2 ? 'is-current' : ''}><span>03</span><strong>一曲にする</strong><small>伴奏・展開・FX</small></li>
        <li className={currentStep === 3 ? 'is-current' : ''}><span>04</span><strong>ニュアンスを整える</strong><small>自然言語と個別編集</small></li>
      </ol>
      <IntentPanel project={project} audioEngine={audioEngine} recorder={recorder} now={now} onCommand={onCommand} />
      <HummingRecorder project={project} recorder={recorder} transcriber={transcriber} assetRepository={assetRepository} inspectDuration={inspectDuration} createId={createId} now={now} onCommand={onCommand} />
      <AccompanimentPanel project={project} audioEngine={audioEngine} hummingAssetRepository={assetRepository} now={now} onCommand={onCommand} />
    </section>
  );
}

function IntentPanel({ project, audioEngine, recorder, now, onCommand }: { project: Project; audioEngine: AudioEngine; recorder: MicrophoneRecorder; now: () => string; onCommand: (command: ProjectCommand) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const voiceSessionRef = useRef<{ stop: () => void } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [voicePhase, setVoicePhase] = useState<'idle' | 'requesting' | 'recording' | 'saving' | 'error'>('idle');
  const [status, setStatus] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<'reference' | 'spoken'>('reference');
  const moods = ['きらきら', '前向き', 'やさしい', '切ない', '勢い'];
  const voiceBusy = voicePhase === 'requesting' || voicePhase === 'recording' || voicePhase === 'saving';
  useEffect(() => () => voiceSessionRef.current?.stop(), []);
  const toggleMood = (mood: string) => {
    const next = project.creativeIntent.mood.includes(mood)
      ? project.creativeIntent.mood.filter((item) => item !== mood)
      : [...project.creativeIntent.mood, mood];
    onCommand({ type: 'project/intent', freeText: project.creativeIntent.freeText, mood: next, at: now() });
  };
  const importReference = async (file: File) => {
    setUploading(true); setStatus(null);
    try {
      const asset = await audioEngine.importUserAudio(file, now());
      onCommand({ type: 'project/intent-media', kind: mediaKind, assetId: asset.id, at: now() });
      setStatus(`${asset.name}を${mediaKind === 'spoken' ? 'ボイスメモ指示' : '参考音声'}として追加しました。`);
    } catch (reason) { setStatus(reason instanceof Error ? reason.message : '参考音声を追加できませんでした。'); }
    finally { setUploading(false); }
  };
  const recordVoiceIntent = async () => {
    if (voiceBusy || uploading) return;
    setVoicePhase('requesting'); setStatus(null);
    try {
      const session = await recorder.start(30);
      voiceSessionRef.current = session;
      setVoicePhase('recording');
      const recording = await session.result;
      voiceSessionRef.current = null;
      setVoicePhase('saving');
      const wav = await audioBlobToWav(recording.blob);
      const file = new File([wav], `voice-memo-${now().replace(/\D/g, '')}.wav`, { type: 'audio/wav' });
      const asset = await audioEngine.importUserAudio(file, now());
      onCommand({ type: 'project/intent-media', kind: 'spoken', assetId: asset.id, at: now() });
      setStatus(`${asset.name}をボイスメモ指示として追加しました。`);
      setVoicePhase('idle');
    } catch (reason) {
      voiceSessionRef.current = null;
      setVoicePhase('error');
      setStatus(reason instanceof Error ? reason.message : 'ボイスメモを録音できませんでした。');
    }
  };
  return (
    <section className="intent-panel" aria-labelledby="intent-panel-title">
      <div className="panel-heading"><span className="section-index">02</span><div><h2 id="intent-panel-title">イメージ指示</h2><p>文章・雰囲気・参考音声はAIへ自動で渡し、鼻歌の音程とリズムはそのまま残します。</p></div></div>
      <label className="intent-textarea"><span>文章で伝える</span><textarea aria-label="AIへのイメージ指示" value={project.creativeIntent.freeText} onChange={(event) => onCommand({ type: 'project/intent', freeText: event.target.value, mood: project.creativeIntent.mood, at: now() })} placeholder="例: ブルーアーカイブ風の可愛いFuture Bass。ドロップは明るく、余韻はふわっと。" rows={3} /></label>
      <div className="intent-moods" aria-label="雰囲気を選ぶ"><span>雰囲気</span>{moods.map((mood) => <button className="button" type="button" aria-pressed={project.creativeIntent.mood.includes(mood)} onClick={() => toggleMood(mood)} key={mood}>{mood}</button>)}</div>
      <div className="intent-media"><button className="button" type="button" onClick={() => { setMediaKind('spoken'); fileInput.current?.click(); }} disabled={uploading || voiceBusy}>{uploading ? 'ボイスメモを解析中…' : 'ボイスメモ指示を追加'}</button><button className="button" type="button" aria-label={voicePhase === 'recording' ? 'ボイスメモの録音停止' : 'ボイスメモを録音'} onClick={() => voicePhase === 'recording' ? voiceSessionRef.current?.stop() : void recordVoiceIntent()} disabled={uploading || voicePhase === 'requesting' || voicePhase === 'saving'}>{voicePhase === 'recording' ? '録音停止' : voicePhase === 'saving' ? '保存中…' : '声で話して録音'}</button><button className="button" type="button" onClick={() => { setMediaKind('reference'); fileInput.current?.click(); }} disabled={uploading || voiceBusy}>{uploading ? '参考音声を解析中…' : '参考音声を追加'}</button><input ref={fileInput} className="visually-hidden" type="file" accept=".wav,.mp3,audio/wav,audio/mpeg" aria-label="AI指示音声ファイル" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void importReference(file); }} />{status && <span role="status">{status}</span>}{project.creativeIntent.spokenIntentAssetId && <span>ボイスメモ指示 1件</span>}{project.creativeIntent.referenceAssetIds.length > 0 && <span>{project.creativeIntent.referenceAssetIds.length}件の参考音声</span>}</div>
    </section>
  );
}

function DesignImpactBoard({ project, now, onCommand }: { project: Project; now: () => string; onCommand: (command: ProjectCommand) => void }) {
  const currentSeconds = arrangementDurationSeconds(project);
  const targetSeconds = project.creativeIntent.targetDurationSeconds;
  const closestTemplate = [...ARRANGEMENT_TEMPLATES].sort((left, right) => Math.abs(templateDurationSeconds(project, left) - targetSeconds) - Math.abs(templateDurationSeconds(project, right) - targetSeconds))[0];
  const differenceBars = Math.round((targetSeconds - currentSeconds) * project.musicalGrid.bpm / 60 / 4);
  return (
    <section className="design-impact-board" aria-label="曲の条件と展開候補">
      <div className="design-impact-strip">
        <span><b>{project.musicalGrid.key}</b>コード譜と書き出し</span>
        <span><b>{project.musicalGrid.bpm} BPM</b>試聴と推定尺</span>
        <span data-match={Math.abs(targetSeconds - currentSeconds) < 8}><b>{durationLabel(currentSeconds)} / 目標 {durationLabel(targetSeconds)}</b>{Math.abs(targetSeconds - currentSeconds) < 8 ? 'ほぼ目標どおり' : `${Math.abs(differenceBars)}小節ほど${differenceBars > 0 ? '追加' : '短縮'}の余地`}</span>
        <span><b>{project.creativeIntent.mood.join(' · ') || '雰囲気 未設定'}</b>音色と展開の選択基準</span>
      </div>
      <div className="arrangement-template-grid" aria-label="曲の流れの候補">
        {ARRANGEMENT_TEMPLATES.map((template) => {
          const active = project.arrangement.sourceAssetId === template.id;
          return <article data-recommended={template.id === closestTemplate?.id} data-active={active} key={template.id}>
            <div><strong>{template.name}</strong><span>{durationLabel(templateDurationSeconds(project, template))}</span></div>
            <p>{template.summary}</p>
            <div className="template-section-sequence" aria-label={`${template.name}の流れ`}>{template.sections.map((section) => <span data-role={section.role} key={section.id}>{section.label}<small>{section.bars}</small></span>)}</div>
            <button type="button" disabled={active} onClick={() => onCommand({ type: 'arrangement/replace', sections: materializeArrangementTemplate(template), sourceAssetId: template.id, at: now() })}>{active ? '現在の流れ' : '現在の流れを置換'}</button>
          </article>;
        })}
      </div>
    </section>
  );
}

function QuickArrangementRail({ project, now, onCommand }: { project: Project; now: () => string; onCommand: (command: ProjectCommand) => void }) {
  const [adding, setAdding] = useState(false);
  const sections = project.arrangement.sections;
  const addSection = (template: typeof SECTION_TEMPLATES[number]) => {
    const count = sections.filter((section) => section.role === template.role).length + 1;
    onCommand({ type: 'arrangement/section-add', section: { id: `section-${template.role}-${now().replace(/\D/g, '')}-${count}`, role: template.role, label: count === 1 ? template.label : `${template.label} ${count}`, startBar: 0, bars: 4, energyStart: template.energyStart, energyEnd: template.energyEnd, transitionAssetId: template.role === 'build' ? 'transition-soft-rise' : null }, toIndex: sections.length, at: now() });
    setAdding(false);
  };
  return (
    <section className="quick-arrangement-rail" aria-label="曲の設計で流れを編集">
      <header><strong>曲の流れ</strong><span>左から右へ再生</span></header>
      <div className="quick-arrangement-scroll">
        {sections.map((section, index) => <article data-role={section.role} key={section.id}>
          <span>{String(index + 1).padStart(2, '0')}</span><strong>{section.label}</strong>
          <label><select aria-label={`${section.label}の長さ`} value={section.bars} onChange={(event) => onCommand({ type: 'arrangement/section-update', sectionId: section.id, patch: { bars: Number(event.target.value) }, at: now() })}>{[2, 4, 6, 8, 12, 16].map((bars) => <option value={bars} key={bars}>{bars} bars</option>)}</select></label>
          <div><button type="button" aria-label={`${section.label}を前へ`} disabled={index === 0} onClick={() => onCommand({ type: 'arrangement/reorder', sectionId: section.id, toIndex: index - 1, at: now() })}>←</button><button type="button" aria-label={`${section.label}を後へ`} disabled={index === sections.length - 1} onClick={() => onCommand({ type: 'arrangement/reorder', sectionId: section.id, toIndex: index + 1, at: now() })}>→</button></div>
        </article>)}
        <aside data-open={adding}><button type="button" aria-expanded={adding} onClick={() => setAdding((current) => !current)}><b>＋</b><span>流れを追加</span></button>{adding && <div>{SECTION_TEMPLATES.map((template) => <button type="button" onClick={() => addSection(template)} key={template.role}>{template.label}</button>)}</div>}</aside>
      </div>
    </section>
  );
}

function PatchboardStart({ project, engine, now, onCommand, onProjectExport, initialDetail, playing, playbackMessage, playbackStartTick, playbackStartedAt, onTogglePlayback, onAuditionAsset, onAuditionNotes, onAuditionSoundChunk }: { project: Project; engine: AudioEngine; now: () => string; onCommand: (command: ProjectCommand) => void; onProjectExport: () => void; initialDetail: boolean; playing: boolean; playbackMessage: string | null; playbackStartTick: number; playbackStartedAt: number | null; onTogglePlayback: (startTick?: number) => void; onAuditionAsset: (assetId: string, label: string) => Promise<void>; onAuditionNotes: (trackId: string, noteIds: string[], label: string) => Promise<void>; onAuditionSoundChunk: (chunk: SoundChunk) => Promise<void> }) {
  const [activeTab, setActiveTab] = useState(initialDetail ? 2 : 0);
  useEffect(() => {
    const handleShortcutCommand = (event: Event) => {
      const commandId = shortcutCommandId(event);
      if (commandId === 'workflow.design') setActiveTab(0);
      else if (commandId === 'workflow.chords') setActiveTab(1);
      else if (commandId === 'workflow.customize') setActiveTab(2);
    };
    window.addEventListener(SHORTCUT_COMMAND_EVENT, handleShortcutCommand);
    return () => window.removeEventListener(SHORTCUT_COMMAND_EVENT, handleShortcutCommand);
  }, []);
  const updateSettings = (patch: Partial<Pick<Project['musicalGrid'], 'bpm' | 'key'>>) => onCommand({ type: 'project/settings', targetDurationSeconds: project.creativeIntent.targetDurationSeconds, bpm: patch.bpm ?? project.musicalGrid.bpm, key: patch.key ?? project.musicalGrid.key, at: now() });
  const selectedMoods: [string, string] = [project.creativeIntent.mood[0] ?? MOOD_OPTIONS[0], project.creativeIntent.mood[1] ?? MOOD_OPTIONS[1]];
  const updateMood = (index: number, value: string) => {
    const next = [...selectedMoods];
    next[index] = value;
    onCommand({ type: 'project/intent', freeText: project.creativeIntent.freeText, mood: next, at: now() });
  };
  const designComplete = selectedMoods.every(Boolean) && project.musicalGrid.key.trim().length > 0 && project.musicalGrid.bpm >= 30;
  const chordTrack = project.tracks.find((track) => track.role === 'chord');
  const soundComplete = chordTrack?.lanes.some((lane) => lane.blocks.length > 0 || lane.notes.length > 0) ?? false;
  const detailComplete = project.tracks.some((track) => track.lanes.some((lane) => lane.notes.some((note) => note.userEdited)));
  const stepComplete = [designComplete, soundComplete, detailComplete] as const;
  return (
    <section className="patchboard-start" aria-labelledby="patchboard-title">
      <h1 className="visually-hidden" id="patchboard-title">{patchboardTabs[activeTab]}</h1>
      <nav className="workspace-tabs" aria-label="制作ステップ">
        {patchboardTabs.map((tab, index) => <button type="button" aria-current={index === activeTab ? 'page' : undefined} onClick={() => setActiveTab(index)} key={tab}><span>0{index + 1}</span><strong>{tab}</strong><b className="workspace-step-state" data-complete={stepComplete[index]} aria-label={stepComplete[index] ? '入力済み' : '未入力'}>{stepComplete[index] ? '✓' : '○'}</b></button>)}
      </nav>
      {activeTab === 0 && <>
        <div className="project-condition-board">
          <article data-complete={Boolean(selectedMoods[0])}><label><span className="condition-label">MOOD 1<i aria-label="入力済み">✓</i></span><select aria-label="曲のムード1" value={selectedMoods[0]} onChange={(event) => updateMood(0, event.target.value)}>{selectableMoods(selectedMoods[0]).map((mood) => <option value={mood} key={mood}>{mood}</option>)}</select></label></article>
          <article data-complete={Boolean(selectedMoods[1])}><label><span className="condition-label">MOOD 2<i aria-label="入力済み">✓</i></span><select aria-label="曲のムード2" value={selectedMoods[1]} onChange={(event) => updateMood(1, event.target.value)}>{selectableMoods(selectedMoods[1]).map((mood) => <option value={mood} key={mood}>{mood}</option>)}</select></label></article>
          <article data-complete={project.musicalGrid.key.trim().length > 0}><label><span className="condition-label">KEY<i aria-label="入力済み">✓</i></span><select aria-label="曲のキー" value={project.musicalGrid.key} onChange={(event) => updateSettings({ key: event.target.value })}>{CHORD_KEY_OPTIONS.map((key) => <option value={key} key={key}>{key}</option>)}</select></label></article>
          <article data-complete={project.musicalGrid.bpm >= 30}><label><span className="condition-label">TEMPO<i aria-label="入力済み">✓</i></span><input aria-label="曲のBPM" type="number" min={30} max={300} value={project.musicalGrid.bpm} onChange={(event) => updateSettings({ bpm: Number(event.target.value) })} /><small>BPM</small></label></article>
        </div>
        <DesignImpactBoard project={project} now={now} onCommand={onCommand} />
        <SongStarterBrowser project={project} audioEngine={engine} now={now} onCommand={onCommand} />
        <QuickArrangementRail project={project} now={now} onCommand={onCommand} />
        <CreativeBriefPanel project={project} scope="song" onProjectExport={onProjectExport} />
      </>}
      {activeTab === 1 && <><ChordPatternBoard project={project} engine={engine} now={now} onCommand={onCommand} playing={playing} playbackMessage={playbackMessage} onTogglePlayback={onTogglePlayback} onAuditionSoundChunk={onAuditionSoundChunk} onAssetToggle={(assetId, selected) => onCommand({ type: selected ? 'asset/ref-add' : 'asset/ref-remove', assetId, at: now() })} onPlaceUserAsset={(asset, phraseIndex) => {
        const referenceTrack = project.tracks.find((track) => track.role === 'reference');
        const referenceLane = referenceTrack?.lanes.find((lane) => lane.kind === 'audio') ?? referenceTrack?.lanes[0];
        if (!referenceTrack || !referenceLane) return;
        const durationTick = Math.max(1, Math.round(asset.durationSeconds * project.musicalGrid.bpm / 60 * PPQ));
        onCommand({ type: 'audio-clip/add', trackId: referenceTrack.id, laneId: referenceLane.id, clip: { id: `user-clip-${asset.id}-${now().replace(/\D/g, '')}`, assetId: asset.id, startTick: phraseIndex * 16 * PPQ, durationTick, offsetSeconds: 0, gain: 1 }, at: now() });
      }} /><CreativeBriefPanel project={project} scope="sounds" /></>}
      {activeTab === 2 && <>
        <DawMelodyEditor project={project} now={now} onCommand={onCommand} playing={playing} playbackMessage={playbackMessage} playbackStartTick={playbackStartTick} playbackStartedAt={playbackStartedAt} onTogglePlayback={onTogglePlayback} onAuditionAsset={onAuditionAsset} onAuditionNotes={onAuditionNotes} />
        <CreativeBriefPanel project={project} scope="melody" />
      </>}
    </section>
  );
}
