import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { HummingAssetRepository, HummingTranscriber, MicrophoneRecorder, RecordedHumming, RecordingSession } from '../../application/humming/humming-ports';
import { PPQ } from '../../domain/music';
import type { Project, ProjectCommand } from '../../domain/music';

type RecorderPhase = 'idle' | 'requesting' | 'recording' | 'transcribing' | 'ready' | 'error';

interface HummingRecorderProps {
  project: Project;
  recorder: MicrophoneRecorder;
  transcriber: HummingTranscriber;
  assetRepository: HummingAssetRepository;
  now: () => string;
  createId: () => string;
  inspectDuration: (blob: Blob) => Promise<number>;
  onCommand: (command: ProjectCommand) => void;
}

function sectionStartTick(startBar: number): number {
  return startBar * 4 * PPQ;
}

function statusLabel(phase: RecorderPhase, progress: number): string {
  if (phase === 'requesting') return 'マイクの許可を確認しています';
  if (phase === 'recording') return '録音中';
  if (phase === 'transcribing') return `音程を解析中 ${Math.round(progress * 100)}%`;
  if (phase === 'ready') return '音符候補をMelodyへ適用しました';
  if (phase === 'error') return '録音または解析を完了できませんでした';
  return '録音できます';
}

export function HummingRecorder({ project, recorder, transcriber, assetRepository, now, createId, inspectDuration, onCommand }: HummingRecorderProps) {
  const [phase, setPhase] = useState<RecorderPhase>('idle');
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [targetSectionId, setTargetSectionId] = useState(project.arrangement.sections[0]?.id ?? '');
  const [startBarOffset, setStartBarOffset] = useState(0);
  const [hummingBars, setHummingBars] = useState(4);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const intervalRef = useRef<number | null>(null);
  const targetSection = project.arrangement.sections.find((section) => section.id === targetSectionId) ?? project.arrangement.sections[0];

  useEffect(() => {
    if (phase !== 'recording') return;
    const startedAt = performance.now();
    intervalRef.current = window.setInterval(() => setElapsedSeconds(Math.min(30, (performance.now() - startedAt) / 1_000)), 100);
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [phase]);

  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    void Promise.all(project.hummingTakes.map(async (take) => {
      const record = await assetRepository.get(take.assetId);
      if (!record || typeof URL.createObjectURL !== 'function') return null;
      const url = URL.createObjectURL(record.blob);
      urls.push(url);
      return [take.assetId, url] as const;
    })).then((entries) => {
      if (active) setPreviewUrls(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null)));
      else if (typeof URL.revokeObjectURL === 'function') urls.forEach((url) => URL.revokeObjectURL(url));
    }).catch(() => undefined);
    return () => {
      active = false;
      if (typeof URL.revokeObjectURL === 'function') urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [assetRepository, project.hummingTakes]);

  const availableStartBars = useMemo(() => Array.from({ length: targetSection?.bars ?? 1 }, (_, index) => index), [targetSection?.bars]);
  const maxHummingBars = Math.max(1, (targetSection?.bars ?? 1) - startBarOffset);
  const effectiveHummingBars = Math.min(hummingBars, maxHummingBars);

  const processRecording = async (recording: RecordedHumming) => {
    if (!targetSection) throw new Error('鼻歌を置くsectionがありません。');
    if (recording.durationSeconds <= 0 || recording.durationSeconds > 30) throw new Error('鼻歌takeは30秒以内にしてください。');
    const takeId = `take-${createId()}`;
    const assetId = `humming-asset-${createId()}`;
    const recordedAt = now();
    const rangeStartTick = sectionStartTick(targetSection.startBar + Math.min(startBarOffset, targetSection.bars - 1));
    const sectionEndTick = sectionStartTick(targetSection.startBar + targetSection.bars);
    const capturedTicks = Math.max(1, Math.round(recording.durationSeconds * project.musicalGrid.bpm / 60 * PPQ));
    const rangeEndTick = Math.min(sectionEndTick, rangeStartTick + effectiveHummingBars * 4 * PPQ, rangeStartTick + capturedTicks);
    setPhase('transcribing');
    setProgress(0);
    setError(null);
    setMessage('録音を保存し、Basic Pitchで音符にしています。');
    await assetRepository.save({ assetId, blob: recording.blob, mimeType: recording.mimeType, durationSeconds: recording.durationSeconds, recordedAt });
    onCommand({ type: 'humming/take-add', take: { id: takeId, assetId, label: `Take ${String(project.hummingTakes.length + 1).padStart(2, '0')}`, recordedAt, durationSeconds: recording.durationSeconds, targetSectionId: targetSection.id, rangeStartTick, rangeEndTick, status: 'transcribing', selected: false, transcribedNotes: [] }, at: recordedAt });
    try {
      const notes = await transcriber.transcribe(recording.blob, { takeId, bpm: project.musicalGrid.bpm, rangeStartTick, rangeEndTick }, setProgress);
      const completedAt = now();
      onCommand({
        type: 'humming/transcription-apply',
        takeId,
        notes,
        candidate: {
          id: `candidate-humming-${createId()}`,
          capability: 'humming-transcription',
          status: 'succeeded',
          model: 'Spotify Basic Pitch',
          modelRevision: '1.0.1',
          seed: null,
          outputAssetId: null,
          inputAssetIds: [assetId],
          intentTrace: ['melody:pitch-locked', 'melody:timing-locked', `target:${targetSection.id}`],
          createdAt: completedAt,
        },
        at: completedAt,
      });
      setProgress(1);
      setPhase('ready');
      setMessage(`${notes.length}個の音符をMelodyへ適用しました。伴奏はこの音程とリズムを基準に作ります。`);
    } catch (reason) {
      onCommand({ type: 'humming/take-status', takeId, status: 'failed', at: now() });
      throw reason;
    }
  };

  const startRecording = async () => {
    if (phase === 'requesting' || phase === 'recording' || phase === 'transcribing') return;
    setPhase('requesting');
    setElapsedSeconds(0);
    setError(null);
    setMessage(null);
    try {
      const activeSession = await recorder.start(30);
      setSession(activeSession);
      setPhase('recording');
      const result = await activeSession.result;
      setSession(null);
      await processRecording(result);
    } catch (reason) {
      setSession(null);
      setPhase('error');
      setError(reason instanceof Error ? reason.message : '鼻歌を録音できませんでした。');
    }
  };

  const importRecording = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(null);
    try {
      const durationSeconds = await inspectDuration(file);
      await processRecording({ blob: file, mimeType: file.type || 'audio/wav', durationSeconds });
    } catch (reason) {
      setPhase('error');
      setError(reason instanceof Error ? reason.message : '録音fileを読み込めませんでした。');
    }
  };

  const busy = phase === 'requesting' || phase === 'recording' || phase === 'transcribing';
  return (
    <section className="humming-recorder" aria-labelledby="humming-recorder-title">
      <div className="humming-target-controls">
        <div><span className="record-label">MELODY INPUT</span><h2 id="humming-recorder-title">鼻歌を入れる</h2></div>
        <label>Section<select value={targetSection?.id ?? ''} onChange={(event) => { setTargetSectionId(event.target.value); setStartBarOffset(0); setHummingBars(4); }} disabled={busy}>{project.arrangement.sections.map((section) => <option value={section.id} key={section.id}>{section.label}</option>)}</select></label>
        <label>開始小節<select value={startBarOffset} onChange={(event) => setStartBarOffset(Number(event.target.value))} disabled={busy}>{availableStartBars.map((offset) => <option value={offset} key={offset}>{(targetSection?.startBar ?? 0) + offset + 1}小節目</option>)}</select></label>
        <label>長さ<select aria-label="鼻歌を入れる小節数" value={effectiveHummingBars} onChange={(event) => setHummingBars(Number(event.target.value))} disabled={busy}>{[1, 2, 4, 8].filter((bars) => bars <= maxHummingBars).map((bars) => <option value={bars} key={bars}>{bars} bars</option>)}</select></label>
      </div>
      <div className="record-stage" data-phase={phase}>
        <div className="record-meter" aria-hidden="true">{Array.from({ length: 32 }, (_, index) => <i key={index} style={{ '--meter': `${phase === 'recording' ? 24 + (index * 37) % 70 : 14 + (index * 19) % 38}%` } as React.CSSProperties} />)}</div>
        <div className="record-copy">
          <span className="record-label">{statusLabel(phase, progress)}</span>
          <strong>{phase === 'recording' ? `${elapsedSeconds.toFixed(1)} / 30.0 sec` : '短い鼻歌を、1 takeずつ録ります。'}</strong>
          <p>録り直しは別takeとして残り、すぐ聴き比べられます。</p>
          {message && <p className="recorder-message" role="status">{message}</p>}
          {error && <p className="recorder-error" role="alert">{error}</p>}
          {phase === 'transcribing' && <progress max="1" value={progress} aria-label="鼻歌の解析進捗" />}
        </div>
        <div className="record-actions">
          <button className="record-button" type="button" aria-label={phase === 'recording' ? '鼻歌の録音を停止' : '鼻歌を録音'} onClick={() => phase === 'recording' ? session?.stop() : void startRecording()} disabled={phase === 'requesting' || phase === 'transcribing'}><span aria-hidden="true" /></button>
          <label className="file-recording-button">録音fileを使う<input type="file" accept="audio/wav,audio/mpeg,audio/webm,audio/mp4" onChange={(event) => void importRecording(event)} disabled={busy} /></label>
        </div>
      </div>
      {project.hummingTakes.length > 0 && <div className="humming-takes" aria-label="鼻歌takeの比較">
        {project.hummingTakes.map((take) => <article key={take.id} data-selected={take.selected}>
          <div><span>{take.label}</span><strong>{take.durationSeconds.toFixed(1)} sec · {take.transcribedNotes.length} notes</strong><small>{project.arrangement.sections.find((section) => section.id === take.targetSectionId)?.label ?? 'Unknown section'} · {take.status}</small></div>
          {previewUrls[take.assetId] && <audio controls preload="metadata" src={previewUrls[take.assetId]} aria-label={`${take.label}を試聴`} />}
          <button type="button" className="button" disabled={take.status !== 'ready' || take.selected} onClick={() => onCommand({ type: 'humming/take-select', takeId: take.id, at: now() })}>{take.selected ? 'Melodyに使用中' : 'このtakeを使う'}</button>
        </article>)}
      </div>}
    </section>
  );
}
