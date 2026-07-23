/**
 * Local-only asynchronous gateway for heavy music generation.
 *
 * The browser talks to this process through Vite's `/api/home-ai` proxy.  The
 * gateway deliberately keeps the model boundary small: one GPU job at a time,
 * an allowlisted ACE-Step DiT-only profile, and a deterministic symbolic
 * accompaniment fallback when ACE-Step is unavailable.  No Cloudflare,
 * credentials, or public bind is performed by this file.
 */

import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename, dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const GATEWAY_VERSION = '0.1.0';
export const HARD_VRAM_CAP_MIB = 10_240;
export const ALLOWLIST_PROFILE = 'ace-step-1.5-dit-only';
export const MEASURED_PEAK_RESERVED_MIB = 9_624;
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 17_321;
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const MAX_QUEUE_DEPTH = 4;
const MAX_NOTES = 512;
const MAX_PROMPT_LENGTH = 2_000;
const MAX_DURATION_SECONDS = 30;
const MAX_SOURCE_AUDIO_BYTES = 5 * 1024 * 1024;
const SOURCE_AUDIO_MIME_TYPES = new Set(['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/mp4']);

function json(res, status, value, extraHeaders = {}) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...extraHeaders,
  });
  res.end(body);
}

function errorBody(code, message, details = undefined) {
  return { error: { code, message, ...(details === undefined ? {} : { details }) } };
}

function finiteNumber(value, name, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new GatewayError('invalid-request', `${name} must be a finite number between ${min} and ${max}.`, { field: name });
  }
  return value;
}

function nonEmptyString(value, name, maxLength) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) {
    throw new GatewayError('invalid-request', `${name} must be a non-empty string up to ${maxLength} characters.`, { field: name });
  }
  return value.trim();
}

class GatewayError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.code = code;
    this.details = details;
    this.status = code === 'queue-full' ? 429 : code === 'not-found' ? 404 : code === 'method-not-allowed' ? 405 : code === 'unsupported-profile' ? 422 : 400;
  }
}

function keyPitchClass(key) {
  const name = String(key).trim().split(/\s+/)[0] ?? 'D';
  return ({ C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 })[name] ?? 2;
}

function normalizedNote(note, index) {
  if (!note || typeof note !== 'object') throw new GatewayError('invalid-request', `melodyNotes[${index}] must be an object.`);
  return {
    id: typeof note.id === 'string' ? note.id.slice(0, 120) : `melody-${index + 1}`,
    pitch: Math.round(finiteNumber(note.pitch, `melodyNotes[${index}].pitch`, 0, 127)),
    startTick: Math.round(finiteNumber(note.startTick, `melodyNotes[${index}].startTick`, 0, 1_000_000)),
    durationTick: Math.max(1, Math.round(finiteNumber(note.durationTick, `melodyNotes[${index}].durationTick`, 1, 1_000_000))),
    velocity: Math.round(finiteNumber(note.velocity ?? 96, `melodyNotes[${index}].velocity`, 1, 127)),
  };
}

function normalizedAudioPayload(payload, baseName, mimeName) {
  if (payload[baseName] === undefined) return null;
  if (typeof payload[baseName] !== 'string' || payload[baseName].length === 0) throw new GatewayError('invalid-request', `${baseName} must be a non-empty base64 string.`);
  if (payload[baseName].length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(payload[baseName])) throw new GatewayError('invalid-request', `${baseName} is malformed.`);
  if (typeof payload[mimeName] !== 'string' || !SOURCE_AUDIO_MIME_TYPES.has(payload[mimeName].toLowerCase())) throw new GatewayError('invalid-request', `${mimeName} is not supported.`);
  let bytes;
  try { bytes = Buffer.from(payload[baseName], 'base64'); } catch { throw new GatewayError('invalid-request', `${baseName} is malformed.`); }
  if (bytes.length === 0 || bytes.length > MAX_SOURCE_AUDIO_BYTES) throw new GatewayError('payload-too-large', `Source audio must be between 1 and ${MAX_SOURCE_AUDIO_BYTES} bytes.`);
  return { bytes, mimeType: payload[mimeName].toLowerCase() };
}

function normalizeJobInput(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new GatewayError('invalid-request', 'JSON body must be an object.');
  const capability = payload.capability === 'full-track' ? 'full-track' : payload.capability === 'accompaniment' ? 'accompaniment' : null;
  if (!capability) throw new GatewayError('unsupported-capability', 'Only accompaniment and full-track jobs are supported.');
  const profile = payload.profile ?? ALLOWLIST_PROFILE;
  if (profile !== ALLOWLIST_PROFILE) throw new GatewayError('unsupported-profile', 'Only the measured ACE-Step DiT-only profile is allowed.', { profile, maxPeakReservedMiB: HARD_VRAM_CAP_MIB });
  const bpm = Math.round(finiteNumber(payload.bpm ?? 150, 'bpm', 40, 240));
  const durationSeconds = finiteNumber(payload.durationSeconds ?? 10, 'durationSeconds', 1, MAX_DURATION_SECONDS);
  const key = nonEmptyString(payload.key ?? 'D major', 'key', 32);
  const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim().slice(0, MAX_PROMPT_LENGTH) : '';
  const intentVariant = payload.intentVariant === 'soft' || payload.intentVariant === 'driving' ? payload.intentVariant : 'sparkle';
  const melodyNotes = payload.melodyNotes === undefined ? [] : Array.isArray(payload.melodyNotes) ? payload.melodyNotes.slice(0, MAX_NOTES).map(normalizedNote) : (() => { throw new GatewayError('invalid-request', 'melodyNotes must be an array.'); })();
  if (Array.isArray(payload.melodyNotes) && payload.melodyNotes.length > MAX_NOTES) throw new GatewayError('invalid-request', `melodyNotes must contain at most ${MAX_NOTES} notes.`);
  const projectId = typeof payload.projectId === 'string' ? payload.projectId.trim().slice(0, 128) : null;
  const seed = payload.seed === undefined ? 424242 : Math.round(finiteNumber(payload.seed, 'seed', 0, 2_147_483_647));
  const generationRange = payload.generationRange === 'selected' || payload.generationRange === 'accompaniment' ? payload.generationRange : 'whole';
  const generationStartTick = Math.max(0, Math.round(finiteNumber(payload.generationStartTick ?? 0, 'generationStartTick', 0, 1_000_000)));
  const defaultEndTick = Math.max(1, Math.ceil(durationSeconds * bpm / 60 * 480));
  const generationEndTick = Math.max(generationStartTick + 1, Math.round(finiteNumber(payload.generationEndTick ?? defaultEndTick, 'generationEndTick', 1, 1_000_000)));
  if (generationRange === 'selected' && generationEndTick <= generationStartTick) throw new GatewayError('invalid-request', 'Selected generation range must have a positive duration.');
  const generationSectionId = typeof payload.generationSectionId === 'string' ? payload.generationSectionId.trim().slice(0, 128) : null;
  return { capability, profile, bpm, durationSeconds, key, prompt, melodyNotes, projectId, seed, intentVariant, generationRange, generationSectionId, generationStartTick, generationEndTick, sourceAudio: normalizedAudioPayload(payload, 'srcAudioBase64', 'srcAudioMimeType'), referenceAudio: normalizedAudioPayload(payload, 'referenceAudioBase64', 'referenceAudioMimeType') };
}

function publicInput(input) {
  return {
    ...input,
    prompt: input.prompt ? '[provided]' : '',
    sourceAudio: input.sourceAudio ? { mimeType: input.sourceAudio.mimeType, bytes: input.sourceAudio.bytes.length } : null,
    referenceAudio: input.referenceAudio ? { mimeType: input.referenceAudio.mimeType, bytes: input.referenceAudio.bytes.length } : null,
  };
}

function fallbackAccompaniment(input) {
  const ppq = 480;
  const inferredEndTick = input.melodyNotes.reduce((end, note) => Math.max(end, note.startTick + note.durationTick), 0) || input.durationSeconds * input.bpm / 60 * ppq;
  const rangeStartTick = input.generationRange === 'selected' ? input.generationStartTick : 0;
  const rangeEndTick = input.generationRange === 'selected' ? input.generationEndTick : Math.max(input.generationEndTick, inferredEndTick);
  const startBar = Math.floor(rangeStartTick / (4 * ppq));
  const totalBars = Math.max(startBar + 1, Math.ceil(rangeEndTick / (4 * ppq)));
  const root = keyPitchClass(input.key);
  const progression = [0, 7, 9, 5];
  const variant = input.intentVariant ?? 'sparkle';
  const lanes = new Map();
  const lane = (role, laneRole) => {
    const id = `${role}/${laneRole}`;
    if (!lanes.has(id)) lanes.set(id, { role, laneRole, notes: [] });
    return lanes.get(id);
  };
  const note = (id, pitch, startTick, durationTick, velocity) => ({ id, pitch: Math.max(0, Math.min(127, Math.round(pitch))), startTick, durationTick, velocity: Math.max(1, Math.min(127, Math.round(velocity))), source: 'generated', lockPitch: false, lockTiming: false });
  for (let bar = startBar; bar < totalBars; bar += 1) {
    const start = bar * 4 * ppq;
    const chordRoot = 48 + ((root + progression[bar % progression.length]) % 12);
    const chord = [chordRoot, chordRoot + 4, chordRoot + 7];
    chord.forEach((pitch, index) => lane('chord', 'main').notes.push(note(`gateway-chord-${bar}-${index}`, pitch, start, 4 * ppq, 72)));
    for (let beat = 0; beat < 4; beat += 1) {
      const beatStart = start + beat * ppq;
      if (variant !== 'soft' || beat % 2 === 0) lane('bass', 'main').notes.push(note(`gateway-bass-${bar}-${beat}`, chordRoot - 12, beatStart, Math.round(ppq * .8), variant === 'driving' ? 96 : 84));
      lane('drum', 'main').notes.push(note(`gateway-kick-${bar}-${beat}`, beat % 2 === 0 ? 36 : 38, beatStart, Math.round(ppq * .25), beat % 2 === 0 ? 104 : 88));
      lane('drum', 'sub').notes.push(note(`gateway-hat-${bar}-${beat}`, 42, beatStart + Math.round(ppq / 2), Math.round(ppq * .12), variant === 'driving' ? 72 : 56));
      if (variant === 'driving') lane('drum', 'sub').notes.push(note(`gateway-hat-open-${bar}-${beat}`, 46, beatStart + Math.round(ppq * .75), Math.round(ppq * .12), 62));
    }
  }
  for (const value of lanes.values()) value.notes = value.notes.filter((item) => item.startTick < rangeEndTick && item.startTick + item.durationTick > rangeStartTick);
  return {
    kind: 'symbolic-accompaniment',
    melodyPreserved: true,
    editable: true,
    lanes: [...lanes.values()],
    intentTrace: ['fallback:template-rule', 'melody:pitch-preserved', 'melody:timing-preserved', `variant:${variant}`, `key:${input.key}`, `bpm:${input.bpm}`, `range:${input.generationRange}`, `range-ticks:${rangeStartTick}-${rangeEndTick}`],
  };
}

function safeArtifactRoot(config) {
  const root = resolve(config.artifactRoot ?? join(process.cwd(), '.cache', 'home-ai-artifacts'));
  mkdirSync(root, { recursive: true });
  return root;
}

function runAceStep(input, config, job) {
  const python = config.python ?? process.env.HOME_AI_ACE_PYTHON;
  const script = config.script ?? process.env.HOME_AI_ACE_SCRIPT;
  const checkpoints = config.checkpoints ?? process.env.HOME_AI_ACE_CHECKPOINTS;
  if (!python || !script || !checkpoints) return Promise.resolve({ status: 'fallback', backend: 'template-rule', output: fallbackAccompaniment(input), reason: 'ace-step-not-configured' });
  const root = safeArtifactRoot(config);
  const outputDir = resolve(root, job.id);
  mkdirSync(outputDir, { recursive: true });
  const sourceAudioPath = input.sourceAudio ? join(outputDir, `humming-source${input.sourceAudio.mimeType === 'audio/mpeg' ? '.mp3' : input.sourceAudio.mimeType === 'audio/webm' ? '.webm' : '.wav'}`) : null;
  const referenceAudioPath = input.referenceAudio ? join(outputDir, `reference-audio${input.referenceAudio.mimeType === 'audio/mpeg' ? '.mp3' : input.referenceAudio.mimeType === 'audio/webm' ? '.webm' : '.wav'}`) : null;
  const cleanupInputs = () => {
    for (const path of [sourceAudioPath, referenceAudioPath]) if (path && existsSync(path)) { try { unlinkSync(path); } catch { /* best effort cleanup */ } }
  };
  try {
    if (sourceAudioPath && input.sourceAudio) writeFileSync(sourceAudioPath, input.sourceAudio.bytes, { mode: 0o600 });
    if (referenceAudioPath && input.referenceAudio) writeFileSync(referenceAudioPath, input.referenceAudio.bytes, { mode: 0o600 });
  } catch (reason) {
    cleanupInputs();
    return Promise.reject(reason);
  }
  const args = [script, '--checkpoints', checkpoints, '--output-dir', outputDir, '--duration', String(input.durationSeconds), '--bpm', String(input.bpm), '--key-scale', input.key, '--seed', String(input.seed), '--prompt', input.prompt || 'Cute future bass instrumental BGM with bright plucks, warm supersaw chords, playful drums, and no vocals.'];
  if (sourceAudioPath) args.push('--task-type', 'complete', '--src-audio', sourceAudioPath, '--instruction', 'Complete the humming source with drums, bass, chords, pads, synths and FX while keeping the source melody and rhythm recognizable.');
  if (referenceAudioPath) args.push('--reference-audio', referenceAudioPath);
  return new Promise((resolveResult, reject) => {
    const child = spawn(python, args, { cwd: dirname(resolve(script)), env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', ACESTEP_DISABLE_LM: '1' }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', (reason) => { cleanupInputs(); reject(reason); });
    child.on('close', (code) => {
      try {
        if (code !== 0) return reject(new GatewayError('model-failed', `ACE-Step exited with code ${code}.`, { stderr: stderr.slice(-2_000) }));
        let metrics;
        try { metrics = JSON.parse(readFileSync(join(outputDir, 'metrics.json'), 'utf8')); } catch { return reject(new GatewayError('malformed-output', 'ACE-Step did not produce a valid metrics file.')); }
        const peak = Number(metrics.peak_reserved_mib ?? metrics.max_peak_reserved_mib);
        if (!Number.isFinite(peak) || peak > HARD_VRAM_CAP_MIB) return reject(new GatewayError('vram-cap-exceeded', `ACE-Step peak reserved VRAM exceeded ${HARD_VRAM_CAP_MIB} MiB.`, { peakReservedMiB: peak, capMiB: HARD_VRAM_CAP_MIB }));
        const audio = Array.isArray(metrics.audio) ? metrics.audio.find((candidate) => typeof candidate?.path === 'string' && existsSync(candidate.path)) : null;
        if (!audio) return reject(new GatewayError('malformed-output', 'ACE-Step produced no audio artifact.'));
        const audioPath = resolve(audio.path);
        if (!audioPath.startsWith(`${outputDir}${process.platform === 'win32' ? '\\' : '/'}`)) return reject(new GatewayError('unsafe-artifact-path', 'ACE-Step artifact path escaped the job output directory.'));
        const artifactId = `artifact-${createHash('sha256').update(`${job.id}:${basename(audio.path)}`).digest('hex').slice(0, 24)}`;
        return resolveResult({ status: 'succeeded', backend: ALLOWLIST_PROFILE, output: { kind: 'audio-layer', editable: false, melodyPreserved: Boolean(sourceAudioPath), conditioning: sourceAudioPath ? 'source-audio-complete' : 'text2music', sourceAudioIncluded: Boolean(sourceAudioPath), referenceAudioIncluded: Boolean(referenceAudioPath), artifactId, metrics: { peakReservedMiB: peak, durationSeconds: audio.duration_seconds, sampleRate: audio.sample_rate, channels: audio.channels } }, artifact: { artifactId, path: audioPath }, stdout: stdout.slice(-1_000) });
      } finally { cleanupInputs(); }
    });
  });
}

function corsHeaders(origin, allowedOrigin) {
  if (!origin || origin === allowedOrigin) return { 'access-control-allow-origin': origin || allowedOrigin, vary: 'Origin', 'access-control-allow-headers': 'content-type, idempotency-key', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
  return {};
}

function requestBody(req) {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) { reject(new GatewayError('payload-too-large', `Request body exceeds ${MAX_BODY_BYTES} bytes.`)); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('error', reject);
    req.on('end', () => {
      try { resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new GatewayError('malformed-json', 'Request body is not valid JSON.')); }
    });
  });
}

export function createGateway(config = {}) {
  const jobs = new Map();
  const artifacts = new Map();
  const queue = [];
  let running = null;
  const now = config.now ?? (() => new Date().toISOString());
  const idFactory = config.idFactory ?? (() => `job-${randomUUID()}`);
  const origin = config.allowedOrigin ?? process.env.HOME_AI_ALLOWED_ORIGIN ?? 'http://127.0.0.1:4173';
  const enableAceStep = config.enableAceStep ?? process.env.HOME_AI_ENABLE_ACE_STEP === '1';

  const modelState = { state: 'unloaded', profile: ALLOWLIST_PROFILE, capMiB: HARD_VRAM_CAP_MIB, measuredPeakReservedMiB: MEASURED_PEAK_RESERVED_MIB };
  const processNext = async () => {
    if (running || queue.length === 0) return;
    const job = queue.shift();
    if (!job) return;
    running = job;
    job.status = 'running'; job.updatedAt = now();
    modelState.state = enableAceStep && job.capability === 'full-track' ? 'warming' : 'busy';
    try {
      const result = enableAceStep && job.capability === 'full-track' ? await runAceStep(job.input, config, job) : { status: 'fallback', backend: 'template-rule', output: job.input.capability === 'accompaniment' ? fallbackAccompaniment(job.input) : { kind: 'symbolic-draft', editable: true, melodyPreserved: true, intentTrace: ['fallback:template-rule'] }, reason: enableAceStep ? 'accompaniment-uses-symbolic-baseline' : 'ace-step-disabled' };
      if (result.artifact) artifacts.set(result.artifact.artifactId, result.artifact.path);
      job.status = result.status === 'succeeded' ? 'succeeded' : 'fallback';
      job.result = { backend: result.backend, output: result.output, reason: result.reason ?? null };
      job.updatedAt = now();
    } catch (reason) {
      job.status = 'failed';
      job.error = reason instanceof GatewayError ? errorBody(reason.code, reason.message, reason.details).error : errorBody('model-failed', reason instanceof Error ? reason.message : 'Model job failed.').error;
      job.updatedAt = now();
    } finally {
      modelState.state = 'unloaded';
      running = null;
      void processNext();
    }
  };

  const server = createServer(async (req, res) => {
    const headers = corsHeaders(req.headers.origin, origin);
    if (req.method === 'OPTIONS') { res.writeHead(204, headers); res.end(); return; }
    if (Object.keys(headers).length === 0 && req.headers.origin) { json(res, 403, errorBody('origin-not-allowed', 'Origin is not allowed.'), headers); return; }
    const path = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`).pathname.replace(/\/$/, '') || '/';
    try {
      if (req.method === 'GET' && (path === '/health' || path === '/api/health')) {
        json(res, 200, { version: GATEWAY_VERSION, status: 'ok', capabilities: { accompaniment: { backend: 'template-rule', fallback: true, editable: true }, 'full-track': { backend: enableAceStep ? ALLOWLIST_PROFILE : null, fallback: true, editable: false } }, model: modelState, queue: { depth: queue.length, running: running?.id ?? null, maxDepth: MAX_QUEUE_DEPTH } }, headers); return;
      }
      if (req.method === 'POST' && (path === '/jobs' || path === '/api/jobs')) {
        const body = await requestBody(req);
        const input = normalizeJobInput(body);
        const idempotencyKey = typeof req.headers['idempotency-key'] === 'string' ? req.headers['idempotency-key'] : typeof body.idempotencyKey === 'string' ? body.idempotencyKey : null;
        if (idempotencyKey) {
          const existing = [...jobs.values()].find((candidate) => candidate.idempotencyKey === idempotencyKey);
          if (existing) { json(res, 200, existing, headers); return; }
        }
        if (queue.length + (running ? 1 : 0) >= MAX_QUEUE_DEPTH) throw new GatewayError('queue-full', 'The local GPU queue is full. Try again later.');
        const job = { id: idFactory(), idempotencyKey, capability: input.capability, profile: input.profile, status: 'queued', backend: enableAceStep && input.capability === 'full-track' ? ALLOWLIST_PROFILE : 'template-rule', input: publicInput(input), createdAt: now(), updatedAt: now() };
        jobs.set(job.id, { ...job, input: structuredClone(input) });
        queue.push(jobs.get(job.id));
        void processNext();
        json(res, 202, job, headers); return;
      }
      const jobMatch = path.match(/^\/(?:api\/)?jobs\/([^/]+)$/);
      if (req.method === 'GET' && jobMatch) {
        const job = jobs.get(jobMatch[1]);
        if (!job) throw new GatewayError('not-found', 'Job was not found.');
        json(res, 200, { ...job, input: publicInput(job.input) }, headers); return;
      }
      const artifactMatch = path.match(/^\/(?:api\/)?artifacts\/([^/]+)$/);
      if (req.method === 'GET' && artifactMatch) {
        const artifactPath = artifacts.get(artifactMatch[1]);
        if (!artifactPath || !existsSync(artifactPath)) throw new GatewayError('not-found', 'Artifact was not found or has expired.');
        res.writeHead(200, { 'content-type': 'audio/wav', 'cache-control': 'no-store', ...headers });
        createReadStream(artifactPath).pipe(res); return;
      }
      throw new GatewayError('not-found', 'Gateway route was not found.');
    } catch (reason) {
      const error = reason instanceof GatewayError ? reason : new GatewayError('internal-error', reason instanceof Error ? reason.message : 'Gateway request failed.');
      json(res, error.status, errorBody(error.code, error.message, error.details), headers);
    }
  });
  return { server, jobs, artifacts, modelState, processNext };
}

export function startGateway(options = {}) {
  const host = options.host ?? process.env.HOME_AI_HOST ?? DEFAULT_HOST;
  const port = Number(options.port ?? process.env.HOME_AI_PORT ?? DEFAULT_PORT);
  const gateway = createGateway(options);
  gateway.server.listen(port, host, () => {
    process.stdout.write(`home-ai-gateway listening on http://${host}:${port}\n`);
  });
  return gateway;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const gateway = startGateway();
  const shutdown = () => gateway.server.close(() => process.exit(0));
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
