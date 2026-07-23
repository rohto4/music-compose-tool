import { useState } from 'react';
import { createStarterMelody, generateAccompaniment, inferIntentProfile } from '../../domain/music';
import { PPQ } from '../../domain/music';
import type { Project, ProjectCommand } from '../../domain/music';
import type { NoteEvent } from '../../domain/music';
import type { AudioEngine } from '../../domain/audio';
import type { HummingAssetRepository } from '../../application/humming/humming-ports';
import { audioBlobToWav } from '../../adapters/humming/basic-pitch-transcriber';
import type { GenerationRange } from '../../adapters/ai/home-ai-gateway';
import { fetchHomeAiArtifact, HomeAiGatewayError, submitFullTrackJob, waitForHomeAiJob } from '../../adapters/ai/home-ai-gateway';

interface AccompanimentPanelProps {
  project: Project;
  audioEngine?: AudioEngine;
  hummingAssetRepository?: HummingAssetRepository;
  now: () => string;
  onCommand: (command: ProjectCommand) => void;
}

function melodyNoteCount(project: Project): number {
  return project.tracks.find((track) => track.id === project.melody.trackId)?.lanes.find((lane) => lane.id === project.melody.laneId)?.notes.length ?? 0;
}

function overlaps(note: NoteEvent, startTick: number, endTick: number): boolean {
  return note.startTick < endTick && note.startTick + note.durationTick > startTick;
}

function scopedDraft(project: Project, draft: ReturnType<typeof generateAccompaniment>, range: GenerationRange, startTick: number, endTick: number) {
  if (range !== 'selected') return draft;
  return {
    ...draft,
    lanes: draft.lanes.map((write) => {
      const existing = project.tracks.find((track) => track.id === write.trackId)?.lanes.find((lane) => lane.id === write.laneId)?.notes.filter((note) => note.source === 'generated' && !overlaps(note, startTick, endTick)) ?? [];
      const notes = [...existing, ...write.notes.filter((note) => overlaps(note, startTick, endTick))];
      return { ...write, notes: [...new Map(notes.map((note) => [note.id, note])).values()] };
    }),
    intentTrace: [...draft.intentTrace, `range:${range}`, `range-ticks:${startTick}-${endTick}`],
  };
}

function audioLayerFailureStatus(reason: unknown): string {
  if (reason instanceof HomeAiGatewayError) {
    if (reason.code === 'gateway-unavailable') return 'Home AIがオフラインです。local AI server（npm.cmd run gateway:ace）を起動してから、もう一度生成してください。編集可能な伴奏はそのまま使えます。';
    if (reason.code === 'ace-step-unavailable') return 'Home AI gatewayは起動していますが、ACE-Step音声生成が無効です。npm.cmd run gateway:aceで起動し直してから、もう一度生成してください。';
    if (reason.code === 'timeout') return 'ACE-Step生成が3分以内に完了しませんでした。Projectは変更していません。gateway状態を確認して再試行してください。';
  }
  return reason instanceof Error ? `追加レイヤーを適用できませんでした: ${reason.message}` : '追加レイヤーを適用できませんでした。';
}

export function AccompanimentPanel({ project, audioEngine, hummingAssetRepository, now, onCommand }: AccompanimentPanelProps) {
  const [busy, setBusy] = useState(false);
  const [layerBusy, setLayerBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [generationRange, setGenerationRange] = useState<GenerationRange>('whole');
  const [generationSectionId, setGenerationSectionId] = useState(() => project.hummingTakes.find((take) => take.selected)?.targetSectionId ?? project.arrangement.sections[0]?.id ?? '');
  const noteCount = melodyNoteCount(project);
  const intentProfile = inferIntentProfile(project);
  const candidate = project.generationCandidates.find((item) => item.capability === 'accompaniment' && item.status === 'succeeded');
  const generatedTracks = project.tracks.filter((track) => track.role !== 'melody' && track.lanes.some((lane) => lane.notes.some((note) => note.source === 'generated')));
  const layerCandidate = project.generationCandidates.find((item) => item.capability === 'full-track-layer' && item.status === 'succeeded');
  const generationSection = project.arrangement.sections.find((section) => section.id === generationSectionId) ?? project.arrangement.sections[0];
  const projectEndTick = Math.max(PPQ * 4, project.arrangement.sections.reduce((total, section) => total + section.bars, 0) * 4 * PPQ);
  const generationStartTick = generationRange === 'selected' && generationSection ? generationSection.startBar * 4 * PPQ : 0;
  const generationEndTick = generationRange === 'selected' && generationSection ? generationStartTick + generationSection.bars * 4 * PPQ : projectEndTick;
  const generationDurationSeconds = Math.min(30, Math.max(1, (generationEndTick - generationStartTick) / PPQ * 60 / project.musicalGrid.bpm));
  const generationRangeLabel = generationRange === 'selected' ? `${generationSection?.label ?? 'section'} · ${generationSection?.bars ?? 1} bars` : generationRange === 'whole' ? '曲全体' : '伴奏だけ（曲全体）';

  const addStarter = () => {
    onCommand({ type: 'melody/replace', notes: createStarterMelody(project), source: 'manual', lockPitch: true, lockTiming: true, at: now() });
  };

  const generate = async () => {
    const createdAt = now();
    setBusy(true);
    setStatus('ローカルAIへ伴奏ジョブを送信しています…');
    let draft = scopedDraft(project, generateAccompaniment(project, intentProfile.variant), generationRange, generationStartTick, generationEndTick);
    let model = 'Template Harmonizer';
    let revision = '1.0.0';
    try {
       const melody = project.tracks.find((track) => track.id === project.melody.trackId)?.lanes.find((lane) => lane.id === project.melody.laneId)?.notes ?? [];
       const scopedMelody = generationRange === 'selected' ? melody.filter((note) => overlaps(note, generationStartTick, generationEndTick)) : melody;
       const response = await fetch('/api/home-ai/jobs', { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': `accompaniment-${project.projectId}-${project.revision}-${generationRange}-${generationStartTick}` }, body: JSON.stringify({ capability: 'accompaniment', projectId: project.projectId, bpm: project.musicalGrid.bpm, key: project.musicalGrid.key, durationSeconds: generationDurationSeconds, melodyNotes: scopedMelody, intentVariant: intentProfile.variant, prompt: [project.creativeIntent.freeText, project.creativeIntent.mood.join(' ')].filter(Boolean).join(' ').slice(0, 2_000), generationRange, generationSectionId: generationRange === 'selected' ? generationSection?.id : undefined, generationStartTick, generationEndTick }) });
      if (!response.ok) throw new Error(`gateway ${response.status}`);
      const queued = await response.json() as { id?: string };
      if (!queued.id) throw new Error('gateway job id missing');
      let job: { status?: string; result?: { output?: { lanes?: Array<{ role: string; laneRole: string; notes: Array<Record<string, unknown>> }>; intentTrace?: string[] } } } = {};
      for (let attempt = 0; attempt < 40; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        const poll = await fetch(`/api/home-ai/jobs/${queued.id}`);
        if (!poll.ok) throw new Error(`gateway poll ${poll.status}`);
        job = await poll.json() as typeof job;
        if (job.status === 'succeeded' || job.status === 'fallback' || job.status === 'failed') break;
      }
      const remoteLanes = job.result?.output?.lanes;
      if (job.status === 'failed' || !remoteLanes) throw new Error('gateway returned no symbolic lanes');
      const remoteMapped = remoteLanes.flatMap((remote) => {
        const targetTrack = project.tracks.find((track) => track.role === remote.role);
        const targetLane = targetTrack?.lanes.find((lane) => lane.role === remote.laneRole);
        if (!targetTrack || !targetLane) return [];
        const notes: NoteEvent[] = remote.notes.map((raw, index) => ({ id: typeof raw.id === 'string' ? raw.id : `gateway-${remote.role}-${index}`, pitch: Number(raw.pitch ?? 60), startTick: Number(raw.startTick ?? 0), durationTick: Number(raw.durationTick ?? 240), velocity: Number(raw.velocity ?? 80), source: 'generated', confidence: 1, userEdited: false, lockPitch: false, lockTiming: false }));
        return [{ trackId: targetTrack.id, laneId: targetLane.id, notes }];
      });
      const remoteLaneIds = new Set(remoteMapped.map((lane) => `${lane.trackId}/${lane.laneId}`));
      const lanes = [...draft.lanes.filter((lane) => !remoteLaneIds.has(`${lane.trackId}/${lane.laneId}`)), ...remoteMapped];
      draft = scopedDraft(project, { ...draft, lanes, intentTrace: job.result?.output?.intentTrace ?? ['gateway:template-rule', 'melody:preserved'] }, generationRange, generationStartTick, generationEndTick);
      model = 'Home AI Gateway';
      revision = '0.1.0';
      setStatus(job.status === 'fallback' ? 'GPUモデル未接続のため、ローカル規則フォールバックを適用しました。' : 'ローカルAIの伴奏候補を適用しました。');
    } catch {
      setStatus('AI gatewayに接続できないため、ブラウザ内テンプレートを適用しました。');
    }
    onCommand({
      type: 'accompaniment/apply',
      lanes: draft.lanes,
      assetIds: draft.assetIds,
      candidate: { id: `candidate-accompaniment-${createdAt.replace(/\D/g, '')}`, capability: 'accompaniment', status: 'succeeded', model, modelRevision: revision, seed: null, outputAssetId: null, inputAssetIds: project.melody.activeTakeId ? [project.melody.activeTakeId] : [], intentTrace: draft.intentTrace, createdAt },
      at: createdAt,
    });
    setBusy(false);
  };

  const generateAudioLayer = async () => {
    if (!audioEngine) { setStatus('音声エンジンが利用できないため、音声レイヤーを追加できません。'); return; }
    const createdAt = now();
    setLayerBusy(true);
    setStatus('ACE-Step追加レイヤーを生成しています（最大30秒）…');
    try {
      const selectedTake = project.hummingTakes.find((take) => take.selected) ?? project.hummingTakes.find((take) => take.id === project.melody.activeTakeId) ?? project.hummingTakes.at(-1);
      const sourceRecord = selectedTake && hummingAssetRepository ? await hummingAssetRepository.get(selectedTake.assetId) : undefined;
      const sourceWav = sourceRecord ? await audioBlobToWav(sourceRecord.blob) : undefined;
      const sourceAudio = sourceWav ? { bytes: new Uint8Array(await sourceWav.arrayBuffer()), mimeType: sourceWav.type } : undefined;
      const referenceAssetId = project.creativeIntent.referenceAssetIds[0] ?? project.creativeIntent.spokenIntentAssetId;
      const referenceRecord = referenceAssetId && audioEngine.getUserAudioAsset ? await audioEngine.getUserAudioAsset(referenceAssetId) : undefined;
      const referenceWav = referenceRecord ? await audioBlobToWav(referenceRecord.blob) : undefined;
      const referenceAudio = referenceWav ? { bytes: new Uint8Array(await referenceWav.arrayBuffer()), mimeType: referenceWav.type } : undefined;
      const queued = await submitFullTrackJob(project, { idempotencyKey: `full-track-${project.projectId}-${project.revision}-${generationRange}-${generationStartTick}`, generationRange, ...(generationRange === 'selected' && generationSection ? { generationSectionId: generationSection.id } : {}), generationStartTick, generationEndTick, ...(sourceAudio ? { sourceAudio } : {}), ...(referenceAudio ? { referenceAudio } : {}) });
      const job = await waitForHomeAiJob(queued.id, { timeoutMs: 180_000, intervalMs: 300 });
      const artifactId = job.result?.output?.artifactId;
      if (job.status === 'fallback') throw new HomeAiGatewayError('ace-step-unavailable', 'ACE-Step audio generation is not enabled.', 503, { reason: job.result?.reason ?? null });
      if (job.status !== 'succeeded' || !artifactId) throw new Error(job.error?.message ?? 'ACE-Step音声artifactが返りませんでした。');
      const blob = await fetchHomeAiArtifact(artifactId);
      const file = new File([blob], `${project.title || 'patchtone'}-ai-layer.wav`, { type: 'audio/wav' });
      const metadata = await audioEngine.importUserAudio(file, createdAt);
      const referenceTrack = project.tracks.find((track) => track.role === 'reference') ?? project.tracks.find((track) => track.role === 'fx');
      const referenceLane = referenceTrack?.lanes.find((lane) => lane.kind === 'audio') ?? referenceTrack?.lanes[0];
      if (!referenceTrack || !referenceLane) throw new Error('AI layer用のaudio laneがありません。');
      const generatedDurationTick = Math.max(1, Math.round(metadata.durationSeconds * project.musicalGrid.bpm / 60 * PPQ));
      const durationTick = generationRange === 'selected' ? Math.min(generatedDurationTick, generationEndTick - generationStartTick) : Math.min(generatedDurationTick, generationEndTick);
      onCommand({ type: 'audio-clip/add', trackId: referenceTrack.id, laneId: referenceLane.id, clip: { id: `ai-layer-${createdAt.replace(/\D/g, '')}`, assetId: metadata.id, startTick: generationStartTick, durationTick, offsetSeconds: 0, gain: 1 }, at: createdAt });
      onCommand({ type: 'generation/candidate-add', candidate: { id: `candidate-full-track-${createdAt.replace(/\D/g, '')}`, capability: 'full-track-layer', status: 'succeeded', model: job.backend, modelRevision: job.profile, seed: null, outputAssetId: metadata.id, inputAssetIds: project.melody.activeTakeId ? [project.melody.activeTakeId] : [], intentTrace: ['audio-layer:additional', 'melody:preserved-as-symbolic-source', `artifact:${artifactId}`], createdAt }, at: createdAt });
      setStatus(`ACE-Step音声レイヤーを${referenceTrack.name}へ追加しました（${generationRangeLabel}）${sourceAudio ? '（鼻歌音声を条件に使用）' : '（テキスト条件）'}${referenceAudio ? '（参考音声も反映）' : ''}。`);
    } catch (reason) {
      setStatus(audioLayerFailureStatus(reason));
    } finally { setLayerBusy(false); }
  };

  return (
    <section className="accompaniment-panel" aria-labelledby="accompaniment-title">
      <div className="accompaniment-heading">
        <h2 id="accompaniment-title">メロディの周りを作る</h2>
        <span className="melody-lock-label">MELODY PITCH / RHYTHM LOCK</span>
      </div>
      <div className="accompaniment-status-grid">
        <article><span>MELODY</span><strong>{noteCount} notes</strong><small>{project.melody.source === 'humming' ? 'humming' : project.melody.source}</small></article>
        <article><span>CHORD POLICY</span><strong>メロディ優先</strong><small>合わないコード側を変更</small></article>
        <article><span>OUTPUT</span><strong>{candidate ? `${generatedTracks.length} editable tracks` : '未生成'}</strong><small>{candidate ? `${candidate.model ?? 'Template'} · Main / Sub lane` : `指示から${intentProfile.summary}`}</small></article>
      </div>
      <div className="accompaniment-action">
        {noteCount === 0 ? <>
          <div><strong>鼻歌を録る前でも、非AIの下書きから試せます。</strong><span>録音後はこのtemplate melodyを本人の鼻歌へ差し替えます。</span></div>
          <button className="button button-primary" type="button" onClick={addStarter}>メロディの下書きを入れる</button>
        </> : <>
          <div><strong>メロディは変更せず、伴奏だけを再生成します。</strong><span>Chord / Bass / Drum / Pad / Arp / Synthを個別noteとして作ります。</span></div>
          <button className="button button-primary" type="button" onClick={() => void generate()} disabled={busy}>{busy ? '生成中…' : candidate ? '指示を反映して作り直す' : 'このメロディに伴奏をつける'}</button>
        </>}
      </div>
      {status && <p className="palette-message" role="status">{status}</p>}
      {noteCount > 0 && <div className="ai-generation-controls" aria-label="AI生成範囲設定">
        <label>生成範囲<select aria-label="生成範囲" value={generationRange} onChange={(event) => setGenerationRange(event.target.value as GenerationRange)} disabled={busy || layerBusy}><option value="selected">選択section</option><option value="whole">曲全体</option><option value="accompaniment">伴奏だけ</option></select></label>
        {generationRange === 'selected' && <label>対象section<select aria-label="生成対象section" value={generationSection?.id ?? ''} onChange={(event) => setGenerationSectionId(event.target.value)} disabled={busy || layerBusy}>{project.arrangement.sections.map((section) => <option value={section.id} key={section.id}>{section.label}</option>)}</select></label>}
        <span>AI / 追加レイヤー: {generationRangeLabel}</span>
      </div>}
      {noteCount > 0 && <div className="audio-layer-action"><div><strong>ACE-Step追加レイヤー</strong><span>{layerCandidate ? '生成済みのWAVレイヤーをProjectへ追加済み' : '鼻歌を正本に残したまま、参考/追加音声を生成します'}</span></div><button className="button" type="button" onClick={() => void generateAudioLayer()} disabled={layerBusy || !audioEngine}>{layerBusy ? '生成中…' : layerCandidate ? 'もう一度生成' : '追加レイヤーを生成'}</button></div>}
      {candidate && <div className="generated-track-list">{generatedTracks.map((track) => <span key={track.id}>{track.name}<b>{track.lanes.reduce((total, lane) => total + lane.notes.filter((note) => note.source === 'generated').length, 0)}</b></span>)}</div>}
    </section>
  );
}
