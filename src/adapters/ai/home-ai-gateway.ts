import type { Project } from '../../domain/music';

export type HomeAiJobStatus = 'queued' | 'running' | 'succeeded' | 'fallback' | 'failed';

export type GenerationRange = 'selected' | 'whole' | 'accompaniment';

export interface HomeAiHealth {
  version: string;
  status: 'ok';
  capabilities: Record<string, { backend: string | null; fallback: boolean; editable: boolean }>;
  model: { state: 'unloaded' | 'warming' | 'busy'; profile: string; capMiB: number; measuredPeakReservedMiB: number };
  queue: { depth: number; running: string | null; maxDepth: number };
}

export interface HomeAiJob {
  id: string;
  capability: 'accompaniment' | 'full-track';
  profile: string;
  status: HomeAiJobStatus;
  backend: string;
  createdAt: string;
  updatedAt: string;
  result?: {
    backend: string;
    reason: string | null;
    output?: {
      kind: string;
      editable: boolean;
      melodyPreserved: boolean;
      lanes?: Array<{ role: string; laneRole: string; notes: Array<{ id: string; pitch: number; startTick: number; durationTick: number; velocity: number; source: string; lockPitch: boolean; lockTiming: boolean }> }>;
      intentTrace?: string[];
      artifactId?: string;
      conditioning?: 'text2music' | 'source-audio-complete';
      sourceAudioIncluded?: boolean;
      referenceAudioIncluded?: boolean;
      metrics?: { peakReservedMiB: number; durationSeconds: number; sampleRate: number; channels: number };
    };
  };
  error?: { code: string; message: string; details?: unknown };
}

export class HomeAiGatewayError extends Error {
  constructor(readonly code: string, message: string, readonly status: number, readonly details?: unknown) {
    super(message);
  }
}

interface GatewayOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  idempotencyKey?: string;
  sourceAudio?: { bytes: Uint8Array; mimeType: string };
  referenceAudio?: { bytes: Uint8Array; mimeType: string };
  generationRange?: GenerationRange;
  generationSectionId?: string;
  generationStartTick?: number;
  generationEndTick?: number;
}

interface PollOptions extends GatewayOptions {
  intervalMs?: number;
  timeoutMs?: number;
}

function gatewayUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

async function gatewayFetch(fetchImpl: typeof fetch, input: RequestInfo | URL, init: RequestInit, signal?: AbortSignal): Promise<Response> {
  try {
    return await fetchImpl(input, init);
  } catch (reason) {
    if (signal?.aborted) throw new HomeAiGatewayError('aborted', 'Home AI gateway request was cancelled.', 499);
    throw new HomeAiGatewayError('gateway-unavailable', 'Home AI gateway is not reachable.', 503, { cause: reason instanceof Error ? reason.name : 'unknown' });
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const raw = await response.text();
  let body: unknown;
  try {
    if (!raw.trim()) throw new SyntaxError('empty body');
    body = JSON.parse(raw);
  } catch {
    if (response.status >= 500) throw new HomeAiGatewayError('gateway-unavailable', 'Home AI gateway is not running or its proxy is unavailable.', response.status, { contentType: contentType || null });
    throw new HomeAiGatewayError('malformed-response', 'Home AI gateway returned malformed JSON.', response.status, { contentType: contentType || null });
  }
  if (!response.ok) {
    const error = (body as { error?: { code?: string; message?: string; details?: unknown } }).error;
    throw new HomeAiGatewayError(error?.code ?? 'gateway-error', error?.message ?? 'Home AI gateway request failed.', response.status, error?.details);
  }
  return body as T;
}

function melodyPayload(project: Project) {
  const track = project.tracks.find((candidate) => candidate.id === project.melody.trackId);
  const lane = track?.lanes.find((candidate) => candidate.id === project.melody.laneId);
  return lane?.notes.slice(0, 512).map((note) => ({ id: note.id, pitch: note.pitch, startTick: note.startTick, durationTick: note.durationTick, velocity: note.velocity })) ?? [];
}

function intentPayload(project: Project, variant: 'sparkle' | 'soft' | 'driving') {
  return {
    variant,
    mood: project.creativeIntent.mood.slice(0, 12),
    freeText: project.creativeIntent.freeText.slice(0, 2_000),
    spokenIntentAssetId: project.creativeIntent.spokenIntentAssetId,
    referenceAssetCount: project.creativeIntent.referenceAssetIds.length,
  };
}

function inferVariant(project: Project): 'sparkle' | 'soft' | 'driving' {
  const source = [project.creativeIntent.freeText, ...project.creativeIntent.mood].join(' ').toLowerCase();
  if (/(勢い|激し|強く|速く|core|drive|energetic)/i.test(source)) return 'driving';
  if (/(切な|やさし|優し|静か|ふわ|soft|gentle|calm)/i.test(source)) return 'soft';
  return 'sparkle';
}

function generationPayload(options: GatewayOptions) {
  return {
    generationRange: options.generationRange ?? 'whole',
    ...(options.generationSectionId ? { generationSectionId: options.generationSectionId } : {}),
    ...(Number.isFinite(options.generationStartTick) ? { generationStartTick: Math.max(0, Math.round(options.generationStartTick!)) } : {}),
    ...(Number.isFinite(options.generationEndTick) ? { generationEndTick: Math.max(1, Math.round(options.generationEndTick!)) } : {}),
  };
}

const MAX_SOURCE_AUDIO_BYTES = 5 * 1024 * 1024;

function bytesToBase64(bytes: Uint8Array): string {
  if (bytes.byteLength > MAX_SOURCE_AUDIO_BYTES) throw new HomeAiGatewayError('source-audio-too-large', `Source humming audio must be at most ${MAX_SOURCE_AUDIO_BYTES} bytes.`, 413);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) binary += String.fromCharCode(...bytes.subarray(offset, Math.min(bytes.length, offset + chunkSize)));
  return btoa(binary);
}

function sourceAudioPayload(options: GatewayOptions): { srcAudioBase64: string; srcAudioMimeType: string } | undefined {
  if (!options.sourceAudio) return undefined;
  if (!options.sourceAudio.mimeType.startsWith('audio/')) throw new HomeAiGatewayError('invalid-source-audio', 'Source humming audio must be an audio MIME type.', 400);
  return { srcAudioBase64: bytesToBase64(options.sourceAudio.bytes), srcAudioMimeType: options.sourceAudio.mimeType };
}

function referenceAudioPayload(options: GatewayOptions): { referenceAudioBase64: string; referenceAudioMimeType: string } | undefined {
  if (!options.referenceAudio) return undefined;
  if (!options.referenceAudio.mimeType.startsWith('audio/')) throw new HomeAiGatewayError('invalid-reference-audio', 'Reference audio must be an audio MIME type.', 400);
  return { referenceAudioBase64: bytesToBase64(options.referenceAudio.bytes), referenceAudioMimeType: options.referenceAudio.mimeType };
}

export async function requestHomeAiHealth(options: GatewayOptions = {}): Promise<HomeAiHealth> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await gatewayFetch(fetchImpl, gatewayUrl(options.baseUrl ?? '/api/home-ai', '/health'), { method: 'GET', ...(options.signal ? { signal: options.signal } : {}) }, options.signal);
  return readResponse<HomeAiHealth>(response);
}

export async function submitAccompanimentJob(project: Project, options: GatewayOptions = {}): Promise<HomeAiJob> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const request = {
    capability: 'accompaniment' as const,
    profile: 'ace-step-1.5-dit-only',
    projectId: project.projectId,
    bpm: project.musicalGrid.bpm,
    key: project.musicalGrid.key,
    durationSeconds: Math.min(30, Math.max(1, project.creativeIntent.targetDurationSeconds)),
    melodyNotes: melodyPayload(project),
    prompt: [project.creativeIntent.freeText, project.creativeIntent.mood.join(' ')].filter(Boolean).join(' ').slice(0, 2_000),
    intent: intentPayload(project, inferVariant(project)),
    intentVariant: inferVariant(project),
    ...generationPayload(options),
  };
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (options.idempotencyKey) headers['idempotency-key'] = options.idempotencyKey;
  const response = await gatewayFetch(fetchImpl, gatewayUrl(options.baseUrl ?? '/api/home-ai', '/jobs'), { method: 'POST', headers, body: JSON.stringify(request), ...(options.signal ? { signal: options.signal } : {}) }, options.signal);
  return readResponse<HomeAiJob>(response);
}

export async function submitFullTrackJob(project: Project, options: GatewayOptions = {}): Promise<HomeAiJob> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const request = {
    capability: 'full-track' as const,
    profile: 'ace-step-1.5-dit-only',
    projectId: project.projectId,
    bpm: project.musicalGrid.bpm,
    key: project.musicalGrid.key,
    durationSeconds: Math.min(30, Math.max(1, project.creativeIntent.targetDurationSeconds)),
    melodyNotes: melodyPayload(project),
    prompt: [project.creativeIntent.freeText, project.creativeIntent.mood.join(' ')].filter(Boolean).join(' ').slice(0, 2_000),
    intent: intentPayload(project, inferVariant(project)),
    intentVariant: inferVariant(project),
    ...generationPayload(options),
    ...sourceAudioPayload(options),
    ...referenceAudioPayload(options),
  };
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (options.idempotencyKey) headers['idempotency-key'] = options.idempotencyKey;
  const response = await gatewayFetch(fetchImpl, gatewayUrl(options.baseUrl ?? '/api/home-ai', '/jobs'), { method: 'POST', headers, body: JSON.stringify(request), ...(options.signal ? { signal: options.signal } : {}) }, options.signal);
  return readResponse<HomeAiJob>(response);
}

export async function getHomeAiJob(jobId: string, options: GatewayOptions = {}): Promise<HomeAiJob> {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(jobId)) throw new HomeAiGatewayError('invalid-job-id', 'Job ID has an invalid format.', 400);
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await gatewayFetch(fetchImpl, gatewayUrl(options.baseUrl ?? '/api/home-ai', `/jobs/${encodeURIComponent(jobId)}`), { method: 'GET', ...(options.signal ? { signal: options.signal } : {}) }, options.signal);
  return readResponse<HomeAiJob>(response);
}

export async function waitForHomeAiJob(jobId: string, options: PollOptions = {}): Promise<HomeAiJob> {
  const intervalMs = options.intervalMs ?? 300;
  const timeoutMs = options.timeoutMs ?? 120_000;
  const started = Date.now();
  while (Date.now() - started <= timeoutMs) {
    const job = await getHomeAiJob(jobId, options);
    if (job.status === 'succeeded' || job.status === 'fallback' || job.status === 'failed') return job;
    await new Promise<void>((resolve) => globalThis.setTimeout(resolve, intervalMs));
  }
  throw new HomeAiGatewayError('timeout', `Home AI job did not finish within ${timeoutMs}ms.`, 408);
}

export async function fetchHomeAiArtifact(artifactId: string, options: GatewayOptions = {}): Promise<Blob> {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(artifactId)) throw new HomeAiGatewayError('invalid-artifact-id', 'Artifact ID has an invalid format.', 400);
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await gatewayFetch(fetchImpl, gatewayUrl(options.baseUrl ?? '/api/home-ai', `/artifacts/${encodeURIComponent(artifactId)}`), { method: 'GET', ...(options.signal ? { signal: options.signal } : {}) }, options.signal);
  if (!response.ok) await readResponse<never>(response);
  return response.blob();
}
