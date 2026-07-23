import { strict as assert } from 'node:assert';
import { createGateway } from '../tools/home-ai-gateway.mjs';

const gateway = createGateway({ now: () => '2026-07-22T00:00:00.000Z', idFactory: (() => { let index = 0; return () => `smoke-job-${++index}`; })() });
await new Promise((resolve) => gateway.server.listen(0, '127.0.0.1', resolve));
const address = gateway.server.address();
if (!address || typeof address === 'string') throw new Error('Gateway did not expose an ephemeral port.');
const base = `http://127.0.0.1:${address.port}`;
try {
  const healthResponse = await globalThis.fetch(`${base}/health`);
  assert.equal(healthResponse.status, 200);
  const health = await healthResponse.json();
  assert.equal(health.model.capMiB, 10_240);
  assert.equal(health.model.measuredPeakReservedMiB, 9_624);

  const jobResponse = await globalThis.fetch(`${base}/jobs`, { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': 'gateway-smoke-1' }, body: JSON.stringify({ capability: 'accompaniment', profile: 'ace-step-1.5-dit-only', bpm: 150, key: 'D major', intentVariant: 'driving', generationRange: 'selected', generationSectionId: 'drop-1', generationStartTick: 1_920, generationEndTick: 3_840, melodyNotes: [{ id: 'humming-1', pitch: 74, startTick: 1_920, durationTick: 240, velocity: 96 }] }) });
  assert.equal(jobResponse.status, 202);
  const job = await jobResponse.json();
  assert.equal(job.id, 'smoke-job-1');
  await new Promise((resolve) => globalThis.setTimeout(resolve, 5));
  const resultResponse = await globalThis.fetch(`${base}/jobs/${job.id}`);
  assert.equal(resultResponse.status, 200);
  const result = await resultResponse.json();
  assert.equal(result.status, 'fallback');
  assert.equal(result.result.output.melodyPreserved, true);
  assert.equal(result.result.output.intentTrace.includes('variant:driving'), true);
  assert.equal(result.result.output.intentTrace.includes('range:selected'), true);

  const sourceBytes = Buffer.from('RIFF' + '0'.repeat(40), 'ascii');
  const sourceResponse = await globalThis.fetch(`${base}/jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ capability: 'full-track', profile: 'ace-step-1.5-dit-only', srcAudioBase64: sourceBytes.toString('base64'), srcAudioMimeType: 'audio/wav' }) });
  assert.equal(sourceResponse.status, 202);
  const sourceJob = await sourceResponse.json();
  assert.equal(JSON.stringify(sourceJob).includes(sourceBytes.toString('base64')), false);
  await new Promise((resolve) => globalThis.setTimeout(resolve, 5));
  const sourceResultResponse = await globalThis.fetch(`${base}/jobs/${sourceJob.id}`);
  const sourceResult = await sourceResultResponse.json();
  assert.equal(sourceResult.input.sourceAudio.bytes, sourceBytes.length);
  assert.equal(JSON.stringify(sourceResult).includes(sourceBytes.toString('base64')), false);

  const referenceResponse = await globalThis.fetch(`${base}/jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ capability: 'full-track', profile: 'ace-step-1.5-dit-only', referenceAudioBase64: sourceBytes.toString('base64'), referenceAudioMimeType: 'audio/wav' }) });
  assert.equal(referenceResponse.status, 202);
  const referenceJob = await referenceResponse.json();
  assert.equal(JSON.stringify(referenceJob).includes(sourceBytes.toString('base64')), false);

  const invalidSourceResponse = await globalThis.fetch(`${base}/jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ capability: 'full-track', srcAudioBase64: sourceBytes.toString('base64'), srcAudioMimeType: 'text/plain' }) });
  assert.equal(invalidSourceResponse.status, 400);
  const malformedSourceResponse = await globalThis.fetch(`${base}/jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ capability: 'full-track', srcAudioBase64: 'not-base64', srcAudioMimeType: 'audio/wav' }) });
  assert.equal(malformedSourceResponse.status, 400);

  const duplicateResponse = await globalThis.fetch(`${base}/jobs`, { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': 'gateway-smoke-1' }, body: JSON.stringify({ capability: 'accompaniment' }) });
  assert.equal(duplicateResponse.status, 200);
  assert.equal((await duplicateResponse.json()).id, job.id);
  process.stdout.write('home-ai-gateway smoke: pass\n');
} finally {
  await new Promise((resolve, reject) => gateway.server.close((error) => error ? reject(error) : resolve()));
}
