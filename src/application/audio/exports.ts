import { buildProjectAudioPlan, clipGainEnvelope, tonalGainEnvelope, transientGainEnvelope } from '../../domain/audio';
import JSZip from 'jszip';
import type { AudioEvent, GainEnvelopePoint, ToneAudioEvent } from '../../domain/audio';
import { mergeChordPatternNotes, PPQ } from '../../domain/music';
import type { NoteEvent, Project } from '../../domain/music';
import { browserAudioAssetRepository } from '../../adapters/storage/indexeddb-audio-asset-repository';

function writeU16(value: number): number[] { return [(value >>> 8) & 0xff, value & 0xff]; }
function writeU32(value: number): number[] { return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]; }
function ascii(value: string): number[] { return [...value].map((character) => character.charCodeAt(0)); }

type BinaryInput = ArrayBuffer | Uint8Array;

function scheduleGain(param: AudioParam, start: number, points: GainEnvelopePoint[]): void {
  for (const point of points) {
    const at = start + point.offsetSeconds;
    if (point.curve === 'exponential') param.exponentialRampToValueAtTime(point.value, at);
    else if (point.curve === 'linear') param.linearRampToValueAtTime(point.value, at);
    else param.setValueAtTime(point.value, at);
  }
}

function bytesOf(input: BinaryInput): Uint8Array {
  return input instanceof Uint8Array ? input : new Uint8Array(input);
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function readBigEndianU16(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 2 > bytes.length) throw new Error('Binary data ended while reading a 16-bit integer.');
  return (bytes[offset]! << 8) | bytes[offset + 1]!;
}

function readBigEndianU32(bytes: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 4 > bytes.length) throw new Error('Binary data ended while reading a 32-bit integer.');
  return ((bytes[offset]! * 0x1000000) + (bytes[offset + 1]! << 16) + (bytes[offset + 2]! << 8) + bytes[offset + 3]!) >>> 0;
}

function encodeVlq(value: number): number[] {
  if (!Number.isInteger(value) || value < 0 || value > 0x0fffffff) throw new Error(`MIDI delta is outside the VLQ range: ${value}`);
  let buffer = value & 0x7f;
  const bytes: number[] = [];
  while ((value >>= 7) > 0) { buffer <<= 8; buffer |= (value & 0x7f) | 0x80; }
  while (true) { bytes.push(buffer & 0xff); if ((buffer & 0x80) === 0) break; buffer >>= 8; }
  return bytes;
}

interface MidiLane {
  name: string;
  role: Project['tracks'][number]['role'];
  notes: NoteEvent[];
}

function collectNoteLanes(project: Project): MidiLane[] {
  return project.tracks.flatMap((track) => track.lanes
    .filter((lane) => lane.kind === 'notes' || lane.kind === 'drums')
    .map((lane) => ({
      name: `${track.name} / ${lane.name}`,
      role: track.role,
      notes: track.role === 'chord' && lane.role === 'main'
        ? mergeChordPatternNotes(project, lane.notes)
        : lane.notes,
    })));
}

function channelForLane(index: number, role: MidiLane['role']): number {
  if (role === 'drum') return 9;
  const candidate = index % 16;
  return candidate === 9 ? 10 : candidate;
}

/** Minimal Standard MIDI File (format 1) writer; each lane becomes a track. */
export function createMidiBlob(project: Project): Blob {
  if (!Number.isInteger(project.musicalGrid.bpm) || project.musicalGrid.bpm <= 0) throw new Error('MIDI export requires a positive BPM.');
  const tracks = collectNoteLanes(project);
  if (tracks.length === 0) tracks.push({ name: 'Master', role: 'reference', notes: [] });
  const tempo = Math.round(60_000_000 / project.musicalGrid.bpm);
  const trackChunks = tracks.map((lane, index) => {
    const events: number[] = [];
    const nameBytes = new TextEncoder().encode(lane.name).slice(0, 255);
    events.push(0, 0xff, 0x03, ...encodeVlq(nameBytes.length), ...nameBytes);
    if (index === 0) events.push(0, 0xff, 0x51, 0x03, (tempo >>> 16) & 0xff, (tempo >>> 8) & 0xff, tempo & 0xff);
    const channel = channelForLane(index, lane.role);
    const ordered = lane.notes.flatMap((note, noteIndex) => {
      if (!Number.isInteger(note.startTick) || note.startTick < 0 || !Number.isInteger(note.durationTick) || note.durationTick <= 0) return [];
      if (!Number.isInteger(note.pitch) || note.pitch < 0 || note.pitch > 127) return [];
      const startTick = note.startTick;
      const endTick = note.startTick + note.durationTick;
      const velocity = Math.max(1, Math.min(127, Math.round(note.velocity)));
      return [
        { tick: startTick, priority: 1, order: noteIndex * 2, bytes: [0x90 | channel, note.pitch & 0x7f, velocity] },
        // Note-off is deliberately emitted before a note-on at the same tick.
        { tick: endTick, priority: 0, order: noteIndex * 2 + 1, bytes: [0x80 | channel, note.pitch & 0x7f, 0] },
      ];
    }).sort((left, right) => left.tick - right.tick || left.priority - right.priority || left.order - right.order);
    let cursor = 0;
    for (const event of ordered) { events.push(...encodeVlq(Math.max(0, event.tick - cursor)), ...event.bytes); cursor = event.tick; }
    events.push(0, 0xff, 0x2f, 0x00);
    return [...ascii('MTrk'), ...writeU32(events.length), ...events];
  });
  const header = [...ascii('MThd'), ...writeU32(6), ...writeU16(1), ...writeU16(trackChunks.length), ...writeU16(PPQ)];
  return new Blob([new Uint8Array([...header, ...trackChunks.flat()])], { type: 'audio/midi' });
}

export interface ParsedMidiNote {
  channel: number;
  pitch: number;
  velocity: number;
  startTick: number;
  durationTick: number;
}

export interface ParsedMidiTrack {
  name: string | null;
  notes: ParsedMidiNote[];
}

export interface ParsedMidiFile {
  format: number;
  division: number;
  tracks: ParsedMidiTrack[];
}

interface MidiVlq { value: number; next: number; }

function readVlq(bytes: Uint8Array, offset: number, end: number): MidiVlq {
  let value = 0;
  let cursor = offset;
  for (let count = 0; count < 4; count += 1) {
    if (cursor >= end) throw new Error('MIDI VLQ is truncated.');
    const byte = bytes[cursor++]!;
    value = (value << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) return { value, next: cursor };
  }
  throw new Error('MIDI VLQ exceeds four bytes.');
}

function closeMidiNote(active: Map<string, ParsedMidiNote[]>, notes: ParsedMidiNote[], key: string, endTick: number): void {
  const pending = active.get(key);
  const note = pending?.shift();
  if (!note) return;
  note.durationTick = Math.max(0, endTick - note.startTick);
  notes.push(note);
  if (pending?.length === 0) active.delete(key);
}

/** Parse the note/event subset written by createMidiBlob (and ordinary SMF running status). */
export function parseMidiFile(input: BinaryInput): ParsedMidiFile {
  const bytes = bytesOf(input);
  if (bytes.length < 14 || readAscii(bytes, 0, 4) !== 'MThd') throw new Error('Invalid Standard MIDI header.');
  const headerLength = readBigEndianU32(bytes, 4);
  if (headerLength < 6 || 8 + headerLength > bytes.length) throw new Error('Invalid MIDI header length.');
  const format = readBigEndianU16(bytes, 8);
  const trackCount = readBigEndianU16(bytes, 10);
  const division = readBigEndianU16(bytes, 12);
  if (format > 2 || trackCount === 0 || division === 0) throw new Error('Unsupported MIDI header values.');
  let cursor = 8 + headerLength;
  const tracks: ParsedMidiTrack[] = [];
  for (let trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
    if (cursor + 8 > bytes.length || readAscii(bytes, cursor, 4) !== 'MTrk') throw new Error(`Missing MIDI track ${trackIndex}.`);
    const length = readBigEndianU32(bytes, cursor + 4);
    const start = cursor + 8;
    const end = start + length;
    if (end > bytes.length) throw new Error(`MIDI track ${trackIndex} is truncated.`);
    cursor = end;
    let position = start;
    let tick = 0;
    let runningStatus: number | null = null;
    let name: string | null = null;
    const notes: ParsedMidiNote[] = [];
    const active = new Map<string, ParsedMidiNote[]>();
    while (position < end) {
      const delta = readVlq(bytes, position, end);
      tick += delta.value;
      position = delta.next;
      if (position >= end) throw new Error(`MIDI track ${trackIndex} ended after a delta.`);
      const raw = bytes[position]!;
      if (raw === 0xff) {
        position += 1;
        if (position >= end) throw new Error('MIDI meta event is truncated.');
        const metaType = bytes[position++]!;
        const metaLength = readVlq(bytes, position, end);
        position = metaLength.next;
        if (position + metaLength.value > end) throw new Error('MIDI meta event payload is truncated.');
        if (metaType === 0x03) name = new TextDecoder().decode(bytes.slice(position, position + metaLength.value));
        position += metaLength.value;
        runningStatus = null;
        if (metaType === 0x2f) break;
        continue;
      }
      if (raw === 0xf0 || raw === 0xf7) {
        position += 1;
        const sysexLength = readVlq(bytes, position, end);
        position = sysexLength.next + sysexLength.value;
        if (position > end) throw new Error('MIDI sysex payload is truncated.');
        runningStatus = null;
        continue;
      }
      let status: number;
      let firstData: number | null = null;
      if (raw & 0x80) {
        status = raw;
        position += 1;
        if (status >= 0xf0) {
          const systemDataLength = status === 0xf1 || status === 0xf3 ? 1 : status === 0xf2 ? 2 : 0;
          if (position + systemDataLength > end) throw new Error('MIDI system event is truncated.');
          position += systemDataLength;
          runningStatus = null;
          continue;
        }
        runningStatus = status;
      } else {
        if (runningStatus === null) throw new Error('MIDI data byte appeared without running status.');
        status = runningStatus;
        firstData = raw;
        position += 1;
      }
      const command = status & 0xf0;
      const channel = status & 0x0f;
      if (command < 0x80 || command > 0xe0) throw new Error(`Unsupported MIDI status byte: ${status}`);
      const dataLength = command === 0xc0 || command === 0xd0 ? 1 : 2;
      const data1 = firstData ?? bytes[position++];
      if (data1 === undefined || data1 > 127) throw new Error('MIDI event is truncated.');
      const data2 = dataLength === 2 ? bytes[position++] : 0;
      if (data2 === undefined || data2 > 127) throw new Error('MIDI event is truncated.');
      if (command === 0x90 && data2 > 0) {
        const key = `${channel}:${data1}`;
        const pending = active.get(key) ?? [];
        pending.push({ channel, pitch: data1, velocity: data2, startTick: tick, durationTick: 0 });
        active.set(key, pending);
      } else if (command === 0x80 || (command === 0x90 && data2 === 0)) {
        closeMidiNote(active, notes, `${channel}:${data1}`, tick);
      }
    }
    for (const [key, pending] of active) for (const note of pending) {
      note.durationTick = Math.max(0, tick - note.startTick);
      notes.push(note);
      active.delete(key);
    }
    notes.sort((left, right) => left.startTick - right.startTick || left.pitch - right.pitch);
    tracks.push({ name, notes });
  }
  return { format, division, tracks };
}

export interface ParsedWavHeader {
  audioFormat: number;
  channels: number;
  sampleRate: number;
  byteRate: number;
  blockAlign: number;
  bitsPerSample: number;
  dataBytes: number;
  durationSeconds: number;
}

/** Validate and read the PCM/float WAV envelope without decoding audio samples. */
export function parseWavHeader(input: BinaryInput): ParsedWavHeader {
  const bytes = bytesOf(input);
  if (bytes.length < 12 || readAscii(bytes, 0, 4) !== 'RIFF' || readAscii(bytes, 8, 4) !== 'WAVE') throw new Error('Invalid RIFF/WAVE header.');
  let cursor = 12;
  let format: ParsedWavHeader['audioFormat'] | null = null;
  let channels = 0;
  let sampleRate = 0;
  let byteRate = 0;
  let blockAlign = 0;
  let bitsPerSample = 0;
  let dataBytes = 0;
  while (cursor + 8 <= bytes.length) {
    const chunkId = readAscii(bytes, cursor, 4);
    const littleLength = (bytes[cursor + 4]! | (bytes[cursor + 5]! << 8) | (bytes[cursor + 6]! << 16) | (bytes[cursor + 7]! << 24)) >>> 0;
    const payloadStart = cursor + 8;
    const payloadEnd = payloadStart + littleLength;
    if (payloadEnd > bytes.length) throw new Error('WAV chunk is truncated.');
    if (chunkId === 'fmt ') {
      if (littleLength < 16) throw new Error('WAV fmt chunk is too short.');
      const view = new DataView(bytes.buffer, bytes.byteOffset + payloadStart, littleLength);
      format = view.getUint16(0, true);
      channels = view.getUint16(2, true);
      sampleRate = view.getUint32(4, true);
      byteRate = view.getUint32(8, true);
      blockAlign = view.getUint16(12, true);
      bitsPerSample = view.getUint16(14, true);
    } else if (chunkId === 'data') {
      dataBytes = littleLength;
    }
    cursor = payloadEnd + (littleLength & 1);
  }
  if (format === null || channels <= 0 || sampleRate <= 0 || blockAlign <= 0 || bitsPerSample <= 0 || dataBytes <= 0) throw new Error('WAV is missing a usable fmt or data chunk.');
  return { audioFormat: format, channels, sampleRate, byteRate, blockAlign, bitsPerSample, dataBytes, durationSeconds: dataBytes / blockAlign / sampleRate };
}

export interface ParsedStemTrack {
  id: string;
  name: string;
  role: string;
}

export interface ParsedStemBundle {
  format: 'patchtone-stems';
  projectId: string;
  tracks: ParsedStemTrack[];
  stemFileNames: string[];
  wavHeaders: Record<string, ParsedWavHeader>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Inspect a generated stems ZIP and validate every WAV envelope before import/share. */
export async function parseStemBundle(input: BinaryInput): Promise<ParsedStemBundle> {
  const zip = await JSZip.loadAsync(input);
  const manifestEntry = zip.file('stems.json');
  if (!manifestEntry) throw new Error('STEMS bundle is missing stems.json.');
  let manifestValue: unknown;
  try { manifestValue = JSON.parse(await manifestEntry.async('text')) as unknown; } catch { throw new Error('STEMS manifest is not valid JSON.'); }
  if (!isRecord(manifestValue) || manifestValue.format !== 'patchtone-stems' || typeof manifestValue.projectId !== 'string' || !Array.isArray(manifestValue.tracks)) throw new Error('STEMS manifest has an unsupported shape.');
  const tracks: ParsedStemTrack[] = manifestValue.tracks.map((value) => {
    if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.role !== 'string') throw new Error('STEMS manifest contains an invalid track.');
    return { id: value.id, name: value.name, role: value.role };
  });
  const stemFileNames = Object.entries(zip.files).filter(([name, entry]) => name.startsWith('stems/') && name.toLowerCase().endsWith('.wav') && !entry.dir).map(([name]) => name).sort();
  if (stemFileNames.length !== tracks.length) throw new Error(`STEMS manifest/file count mismatch: ${tracks.length} tracks, ${stemFileNames.length} WAV files.`);
  const master = zip.file('master.wav');
  if (!master) throw new Error('STEMS bundle is missing master.wav.');
  const wavHeaders: Record<string, ParsedWavHeader> = {};
  wavHeaders['master.wav'] = parseWavHeader(await master.async('uint8array'));
  for (const name of stemFileNames) {
    const entry = zip.file(name);
    if (!entry) throw new Error(`STEMS file disappeared while reading: ${name}`);
    wavHeaders[name] = parseWavHeader(await entry.async('uint8array'));
  }
  return { format: 'patchtone-stems', projectId: manifestValue.projectId, tracks, stemFileNames, wavHeaders };
}

function renderTone(context: OfflineAudioContext, destination: GainNode, event: ToneAudioEvent): void {
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  const outputPan = context.createStereoPanner();
  const effects = event.effects ?? { filter: 1, reverb: 0, delay: 0, sidechain: 0 };
  const profile = event.synthesis;
  const layers = profile?.layers ?? [{ waveform: event.waveform, octave: 0, detuneCents: 0, gain: 1, pan: 0 }];
  const start = event.startSeconds;
  const end = start + event.durationSeconds;
  const envelopePoints = tonalGainEnvelope(event.durationSeconds, event.attackSeconds, event.releaseSeconds, Math.max(.0002, event.gain * Math.max(.12, 1 - effects.sidechain * .45)), profile?.sustain ?? .8);
  const attackEnd = start + envelopePoints[1]!.offsetSeconds;
  const filterBase = profile?.filterBaseHz ?? 450 + event.brightness * 7_500;
  const cutoff = Math.max(80, filterBase * (.35 + effects.filter * .65));
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoff, start);
  if ((profile?.filterEnvelopeHz ?? 0) > 0) {
    filter.frequency.exponentialRampToValueAtTime(cutoff + profile!.filterEnvelopeHz, attackEnd);
    filter.frequency.exponentialRampToValueAtTime(cutoff, Math.max(attackEnd + .01, Math.min(end, start + event.durationSeconds * .62)));
  }
  filter.Q.value = profile?.resonance ?? .8 + event.brightness * 2.4 + effects.filter * 1.2;
  outputPan.pan.value = event.pan;
  scheduleGain(envelope.gain, start, envelopePoints);
  filter.connect(envelope).connect(outputPan).connect(destination);
  for (const layer of layers) {
    const oscillator = context.createOscillator();
    const layerGain = context.createGain();
    const layerPan = context.createStereoPanner();
    oscillator.type = layer.waveform;
    oscillator.frequency.value = event.frequency * 2 ** layer.octave * 2 ** (layer.detuneCents / 1_200);
    layerGain.gain.value = layer.gain;
    layerPan.pan.value = layer.pan;
    oscillator.connect(layerGain).connect(layerPan).connect(filter);
    oscillator.start(start);
    oscillator.stop(end + event.releaseSeconds + .01);
  }
  if (effects.delay > 0) {
    const delay = context.createDelay(.6);
    const wet = context.createGain();
    delay.delayTime.value = .11 + effects.delay * .18;
    wet.gain.value = effects.delay * .24;
    outputPan.connect(delay).connect(wet).connect(destination);
  }
  if (effects.reverb > 0) {
    const reverb = context.createDelay(.8);
    const wet = context.createGain();
    reverb.delayTime.value = .19 + effects.reverb * .2;
    wet.gain.value = effects.reverb * .12;
    outputPan.connect(reverb).connect(wet).connect(destination);
  }
}

function offlineNoiseBuffer(context: OfflineAudioContext, seconds: number, seedText: string): AudioBuffer {
  const length = Math.max(1, Math.ceil(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const channel = buffer.getChannelData(0);
  let seed = [...seedText].reduce((value, character) => (value * 33 + character.charCodeAt(0)) >>> 0, 0x2468ace);
  for (let index = 0; index < channel.length; index += 1) {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    channel[index] = seed / 0xffffffff * 2 - 1;
  }
  return buffer;
}

function renderDrum(context: OfflineAudioContext, destination: GainNode, event: Exclude<AudioEvent, ToneAudioEvent>): void {
  const start = event.startSeconds;
  if (event.kind === 'sweep') {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const pan = context.createStereoPanner();
    const brightness = event.brightness ?? .7;
    const low = 180 + brightness * 520;
    const high = 3_200 + brightness * 7_200;
    source.buffer = offlineNoiseBuffer(context, event.durationSeconds + .03, event.timbreId ?? 'sweep');
    filter.type = event.character === 'soft' ? 'lowpass' : 'bandpass';
    filter.Q.value = event.character === 'punchy' ? .9 : .48;
    filter.frequency.setValueAtTime(event.direction === 'down' ? high : low, start);
    filter.frequency.exponentialRampToValueAtTime(event.direction === 'down' ? low : high, start + event.durationSeconds);
    pan.pan.setValueAtTime(Math.max(-1, event.pan - .18), start);
    pan.pan.linearRampToValueAtTime(Math.min(1, event.pan + .18), start + event.durationSeconds);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, event.gain * .22), start + event.durationSeconds * .12);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, event.gain), start + event.durationSeconds * .82);
    gain.gain.exponentialRampToValueAtTime(.0001, start + event.durationSeconds);
    source.connect(filter).connect(gain).connect(pan).connect(destination);
    source.start(start);
    source.stop(start + event.durationSeconds + .03);
    return;
  }
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const timbreHash = [...(event.timbreId ?? event.kind)].reduce((value, character) => (value * 33 + character.charCodeAt(0)) >>> 0, 17);
  const variation = (timbreHash % 19) / 18;
  const brightness = event.brightness ?? .6;
  oscillator.type = event.kind === 'kick' || event.kind === 'tom' ? event.character === 'soft' ? 'triangle' : 'sine' : event.kind === 'sparkle' ? event.waveform ?? 'sine' : 'square';
  const startHz = event.kind === 'kick' ? 92 + brightness * 108 + variation * 38 : event.kind === 'tom' ? 112 + brightness * 118 + variation * 32 : event.kind === 'sparkle' ? 680 + brightness * 1_100 : 900 + brightness * 1_000;
  const endHz = event.kind === 'kick' ? 31 + brightness * 17 + variation * 9 : event.kind === 'tom' ? 65 + brightness * 58 + variation * 16 : event.kind === 'sparkle' ? 1_900 + brightness * 2_400 : 1_500 + brightness * 1_200;
  oscillator.frequency.setValueAtTime(startHz, start);
  oscillator.frequency.exponentialRampToValueAtTime(endHz, start + event.durationSeconds);
  scheduleGain(gain.gain, start, transientGainEnvelope(event.durationSeconds, event.gain));
  oscillator.connect(gain).connect(destination);
  oscillator.start(start);
  oscillator.stop(start + event.durationSeconds + .01);
}

export async function createWavBlob(project: Project): Promise<Blob> {
  const plan = buildProjectAudioPlan(project);
  const sampleRate = 44_100;
  const beatSeconds = 60 / project.musicalGrid.bpm;
  const clipEnd = project.tracks.flatMap((track) => track.lanes.flatMap((lane) => lane.audioClips.map((clip) => clip.startTick / PPQ * beatSeconds + clip.durationTick / PPQ * beatSeconds))).reduce((max, value) => Math.max(max, value), 0);
  const length = Math.ceil((Math.max(plan.durationSeconds, clipEnd) + .5) * sampleRate);
  const context = new OfflineAudioContext(2, length, sampleRate);
  const destination = context.createGain();
  destination.gain.value = .8;
  destination.connect(context.destination);
  for (const event of plan.events) {
    if (event.kind === 'tone') {
      renderTone(context, destination, event);
    } else {
      renderDrum(context, destination, event);
    }
  }
  const soloTracks = project.tracks.filter((track) => track.solo);
  for (const track of project.tracks) {
    if (track.muted || (soloTracks.length > 0 && !track.solo)) continue;
    for (const lane of track.lanes) {
      if (lane.muted) continue;
      for (const clip of lane.audioClips) {
        const record = await browserAudioAssetRepository.get(clip.assetId);
        if (!record) continue;
        let decoded: AudioBuffer;
        try { decoded = await context.decodeAudioData(await record.blob.arrayBuffer()); } catch { continue; }
        const source = context.createBufferSource();
        const gain = context.createGain();
        const pan = context.createStereoPanner();
        const start = clip.startTick / PPQ * beatSeconds;
        const offset = Math.min(Math.max(0, clip.offsetSeconds), Math.max(0, decoded.duration - .01));
        const duration = Math.min(clip.durationTick / PPQ * beatSeconds, decoded.duration - offset);
        if (duration <= 0) continue;
        source.buffer = decoded;
        scheduleGain(gain.gain, start, clipGainEnvelope(duration, Math.max(0, Math.min(2, clip.gain * track.volume))));
        pan.pan.value = track.pan;
        source.connect(gain).connect(pan).connect(destination);
        source.start(start, offset, duration);
      }
    }
  }
  const rendered = await context.startRendering();
  const channels = [rendered.getChannelData(0), rendered.getChannelData(1)];
  const dataSize = rendered.length * channels.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const write = (offset: number, value: string) => value.split('').forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  write(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); write(8, 'WAVE'); write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 2, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 4, true); view.setUint16(32, 4, true); view.setUint16(34, 16, true); write(36, 'data'); view.setUint32(40, dataSize, true);
  let cursor = 44;
  for (let index = 0; index < rendered.length; index += 1) for (const channel of channels) { const sample = Math.max(-1, Math.min(1, channel[index] ?? 0)); view.setInt16(cursor, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true); cursor += 2; }
  return new Blob([buffer], { type: 'audio/wav' });
}

/** Return every track that contributes symbolic blocks/notes or rendered audio clips to stems. */
export function collectStemTracks(project: Project): Project['tracks'] {
  return project.tracks.filter((track) => track.lanes.some((lane) => lane.notes.length > 0 || lane.blocks.length > 0 || lane.audioClips.length > 0));
}

export async function createStemBundle(project: Project): Promise<{ blob: Blob; fileName: string }> {
  const zip = new JSZip();
  zip.file('master.wav', await createWavBlob(project));
  const tracks = collectStemTracks(project);
  const usedNames = new Set<string>();
  for (const target of tracks) {
    const stemProject = structuredClone(project);
    stemProject.tracks = stemProject.tracks.map((track) => ({ ...track, muted: false, solo: track.id === target.id }));
    const baseName = target.name.replace(/[^a-zA-Z0-9_-]+/g, '_') || target.id;
    let stemName = baseName;
    let suffix = 2;
    while (usedNames.has(stemName.toLowerCase())) stemName = `${baseName}_${suffix++}`;
    usedNames.add(stemName.toLowerCase());
    zip.file(`stems/${stemName}.wav`, await createWavBlob(stemProject));
  }
  zip.file('stems.json', JSON.stringify({ format: 'patchtone-stems', projectId: project.projectId, tracks: tracks.map((track) => ({ id: track.id, name: track.name, role: track.role })) }, null, 2));
  return { blob: await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }), fileName: `${project.title || 'patchtone'}-stems.zip` };
}
