import { describe, expect, it } from 'vitest';
import { createProject } from '../../domain/music';
import { getHomeAiJob, requestHomeAiHealth, submitAccompanimentJob, submitFullTrackJob, waitForHomeAiJob } from './home-ai-gateway';

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('home AI gateway client', () => {
  it('classifies an empty proxy 502 as unavailable instead of malformed JSON', async () => {
    await expect(requestHomeAiHealth({ fetchImpl: () => Promise.resolve(new Response('', { status: 502, headers: { 'content-type': 'text/plain' } })) })).rejects.toMatchObject({
      code: 'gateway-unavailable',
      status: 502,
      message: 'Home AI gateway is not running or its proxy is unavailable.',
    });
  });

  it('normalizes a network refusal and keeps malformed successful JSON distinct', async () => {
    await expect(requestHomeAiHealth({ fetchImpl: () => Promise.reject(new TypeError('fetch failed')) })).rejects.toMatchObject({ code: 'gateway-unavailable', status: 503 });
    await expect(requestHomeAiHealth({ fetchImpl: () => Promise.resolve(new Response('<html>bad</html>', { status: 200, headers: { 'content-type': 'text/html' } })) })).rejects.toMatchObject({ code: 'malformed-response', status: 200 });
  });

  it('reads health without exposing a model path', async () => {
    let requested = '';
    const health = { version: '0.1.0', status: 'ok', capabilities: { accompaniment: { backend: 'template-rule', fallback: true, editable: true } }, model: { state: 'unloaded', profile: 'ace-step-1.5-dit-only', capMiB: 10240, measuredPeakReservedMiB: 7504 }, queue: { depth: 0, running: null, maxDepth: 4 } };
    const result = await requestHomeAiHealth({ baseUrl: 'http://127.0.0.1:17321/api', fetchImpl: (input) => { requested = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url; return Promise.resolve(response(health)); } });
    expect(requested).toBe('http://127.0.0.1:17321/api/health');
    expect(result.model).not.toHaveProperty('path');
    expect(result.model.capMiB).toBe(10240);
  });

  it('sends melody-only input and uses idempotency', async () => {
    const project = createProject({ projectId: 'project-ai', title: 'AI', now: '2026-07-22T00:00:00.000Z', entryMode: 'humming-studio', bpm: 150 });
    const melodyLane = project.tracks.find((track) => track.id === project.melody.trackId)?.lanes.find((lane) => lane.id === project.melody.laneId);
    melodyLane?.notes.push({ id: 'melody-1', pitch: 74, startTick: 0, durationTick: 240, velocity: 101, source: 'humming', confidence: .9, userEdited: false, lockPitch: true, lockTiming: true });
    let body = '';
    let idempotency = '';
    const job = { id: 'job-1', capability: 'accompaniment', profile: 'ace-step-1.5-dit-only', status: 'queued', backend: 'template-rule', createdAt: '2026-07-22T00:00:00.000Z', updatedAt: '2026-07-22T00:00:00.000Z' } as const;
    const result = await submitAccompanimentJob(project, { baseUrl: 'http://gateway/api', idempotencyKey: 'idem-1', fetchImpl: (_input, init) => { body = typeof init?.body === 'string' ? init.body : ''; idempotency = new Headers(init?.headers).get('idempotency-key') ?? ''; return Promise.resolve(response(job, 202)); } });
    const parsed = JSON.parse(body) as { capability: string; melodyNotes: Array<{ pitch: number }>; profile: string };
    expect(result.id).toBe('job-1');
    expect(idempotency).toBe('idem-1');
    expect(parsed).toMatchObject({ capability: 'accompaniment', profile: 'ace-step-1.5-dit-only' });
    expect(parsed.melodyNotes).toEqual([{ id: 'melody-1', pitch: 74, startTick: 0, durationTick: 240, velocity: 101 }]);
  });

  it('sends the selected generation range without changing the melody contract', async () => {
    const project = createProject({ projectId: 'project-range', title: 'Range', now: '2026-07-22T00:00:00.000Z', entryMode: 'humming-studio', bpm: 120 });
    let body = '';
    await submitAccompanimentJob(project, { generationRange: 'selected', generationSectionId: 'section-drop', generationStartTick: 3_840, generationEndTick: 7_680, fetchImpl: (_input, init) => { body = typeof init?.body === 'string' ? init.body : ''; return Promise.resolve(response({ id: 'job-range', capability: 'accompaniment', profile: 'ace-step-1.5-dit-only', status: 'queued', backend: 'template-rule', createdAt: '2026-07-22T00:00:00.000Z', updatedAt: '2026-07-22T00:00:00.000Z' }, 202)); } });
    expect(JSON.parse(body)).toMatchObject({ generationRange: 'selected', generationSectionId: 'section-drop', generationStartTick: 3_840, generationEndTick: 7_680 });
  });

  it('polls until a deterministic fallback is returned', async () => {
    let reads = 0;
    const fetchImpl: typeof fetch = () => {
      reads += 1;
      return Promise.resolve(response({ id: 'job-2', capability: 'accompaniment', profile: 'ace-step-1.5-dit-only', status: reads === 1 ? 'running' : 'fallback', backend: 'template-rule', createdAt: '2026-07-22T00:00:00.000Z', updatedAt: '2026-07-22T00:00:00.000Z', result: { backend: 'template-rule', reason: 'ace-step-disabled', output: { kind: 'symbolic-accompaniment', editable: true, melodyPreserved: true } } }));
    };
    const result = await waitForHomeAiJob('job-2', { baseUrl: 'http://gateway/api', fetchImpl, intervalMs: 1, timeoutMs: 100 });
    expect(result.status).toBe('fallback');
    expect(reads).toBe(2);
    await expect(getHomeAiJob('../path', { fetchImpl })).rejects.toMatchObject({ code: 'invalid-job-id' });
  });

  it('encodes a normalized humming source as an ephemeral full-track input', async () => {
    const project = createProject({ projectId: 'project-source', title: 'Source', now: '2026-07-22T00:00:00.000Z', entryMode: 'humming-studio' });
    let body = '';
    const sourceBytes = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0]);
    await submitFullTrackJob(project, { sourceAudio: { bytes: sourceBytes, mimeType: 'audio/wav' }, fetchImpl: (_input, init) => { body = typeof init?.body === 'string' ? init.body : ''; return Promise.resolve(response({ id: 'job-source', capability: 'full-track', profile: 'ace-step-1.5-dit-only', status: 'queued', backend: 'template-rule', createdAt: '2026-07-22T00:00:00.000Z', updatedAt: '2026-07-22T00:00:00.000Z' }, 202)); } });
    const parsed = JSON.parse(body) as { srcAudioBase64: string; srcAudioMimeType: string };
    expect(parsed.srcAudioMimeType).toBe('audio/wav');
    expect(parsed.srcAudioBase64).toBe(btoa(String.fromCharCode(...sourceBytes)));
  });

  it('encodes a reference audio payload without persisting it in the project request', async () => {
    const project = createProject({ projectId: 'project-reference', title: 'Reference', now: '2026-07-22T00:00:00.000Z', entryMode: 'humming-studio' });
    let body = '';
    const sourceBytes = new Uint8Array([82, 73, 70, 70]);
    await submitFullTrackJob(project, { referenceAudio: { bytes: sourceBytes, mimeType: 'audio/wav' }, fetchImpl: (_input, init) => { body = typeof init?.body === 'string' ? init.body : ''; return Promise.resolve(response({ id: 'job-reference', capability: 'full-track', profile: 'ace-step-1.5-dit-only', status: 'queued', backend: 'template-rule', createdAt: '2026-07-22T00:00:00.000Z', updatedAt: '2026-07-22T00:00:00.000Z' }, 202)); } });
    const parsed = JSON.parse(body) as { referenceAudioBase64: string; referenceAudioMimeType: string };
    expect(parsed.referenceAudioMimeType).toBe('audio/wav');
    expect(parsed.referenceAudioBase64).toBe(btoa(String.fromCharCode(...sourceBytes)));
  });
});
