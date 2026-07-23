import type { HummingTranscriber, HummingTranscriptionOptions } from '../../application/humming/humming-ports';
import { PPQ } from '../../domain/music';
import type { NoteEvent } from '../../domain/music';

interface BasicPitchNoteTime {
  startTimeSeconds: number;
  durationSeconds: number;
  pitchMidi: number;
  amplitude: number;
}

type ContextConstructor = new (options?: AudioContextOptions) => AudioContext;

function audioContextConstructor(): ContextConstructor {
  const constructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: ContextConstructor }).webkitAudioContext;
  if (!constructor) throw new Error('Web Audio is not supported in this browser.');
  return constructor;
}

/**
 * Average every decoded input channel into one mono signal. Some microphones
 * ignore `getUserMedia({ channelCount: 1 })` and MediaRecorder then produces a
 * stereo file. Basic Pitch accepts only a one-channel AudioBuffer, so channel
 * normalization belongs at this adapter boundary rather than in device setup.
 */
export function downmixChannelsToMono(channels: readonly Float32Array[]): Float32Array<ArrayBuffer> {
  if (channels.length === 0) throw new Error('Audio buffer has no channels.');
  const frames = channels[0]?.length ?? 0;
  if (channels.some((channel) => channel.length !== frames)) throw new Error('Audio channels have inconsistent lengths.');
  const mono = new Float32Array(new ArrayBuffer(frames * Float32Array.BYTES_PER_ELEMENT));
  for (let frame = 0; frame < frames; frame += 1) {
    let sum = 0;
    for (const channel of channels) sum += channel[frame] ?? 0;
    mono[frame] = Math.max(-1, Math.min(1, sum / channels.length));
  }
  return mono;
}

export function encodeMonoPcm16Wav(samples: Float32Array, sampleRate: number): Blob {
  if (!Number.isFinite(sampleRate) || sampleRate < 8_000 || sampleRate > 192_000) throw new Error('Audio sample rate is not supported.');
  const channels = 1;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataBytes = samples.length * blockAlign;
  const output = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(output);
  const writeAscii = (offset: number, value: string) => { for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index)); };
  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataBytes, true);
  let offset = 44;
  for (const source of samples) {
    const sample = Math.max(-1, Math.min(1, source));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += bytesPerSample;
  }
  return new Blob([output], { type: 'audio/wav' });
}

function monoAudioBuffer(context: AudioContext, source: AudioBuffer): AudioBuffer {
  const channels = Array.from({ length: source.numberOfChannels }, (_, index) => source.getChannelData(index));
  const samples = downmixChannelsToMono(channels);
  const mono = context.createBuffer(1, samples.length, source.sampleRate);
  mono.copyToChannel(samples, 0);
  return mono;
}

export async function audioBlobDuration(blob: Blob): Promise<number> {
  const context = new (audioContextConstructor())({ sampleRate: 22_050 });
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    return buffer.duration;
  } catch {
    throw new Error('Audio file could not be decoded.');
  } finally {
    await context.close();
  }
}

/**
 * Normalize a recorded take to a small PCM WAV before sending it to a local
 * audio-conditioned generator. MediaRecorder commonly returns WebM/Opus,
 * while model runtimes are considerably more portable with WAV input.
 */
export async function audioBlobToWav(blob: Blob): Promise<Blob> {
  const context = new (audioContextConstructor())({ sampleRate: 22_050 });
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
    return encodeMonoPcm16Wav(downmixChannelsToMono(channels), buffer.sampleRate);
  } catch {
    throw new Error('Recorded audio could not be normalized to WAV.');
  } finally {
    await context.close();
  }
}

function collapseMonophonic(notes: BasicPitchNoteTime[]): BasicPitchNoteTime[] {
  const sorted = [...notes].sort((left, right) => left.startTimeSeconds - right.startTimeSeconds || right.amplitude - left.amplitude);
  const result: BasicPitchNoteTime[] = [];
  for (const candidate of sorted) {
    const previous = result.at(-1);
    if (previous && Math.abs(previous.startTimeSeconds - candidate.startTimeSeconds) < .07) {
      if (candidate.amplitude > previous.amplitude) result[result.length - 1] = candidate;
      continue;
    }
    result.push(candidate);
  }
  return result.slice(0, 512);
}

export function noteTimesToProjectNotes(notes: BasicPitchNoteTime[], options: HummingTranscriptionOptions): NoteEvent[] {
  const ticksPerSecond = options.bpm / 60 * PPQ;
  return collapseMonophonic(notes).map((source, index) => {
    const startTick = options.rangeStartTick + Math.round(source.startTimeSeconds * ticksPerSecond);
    const durationTick = Math.max(1, Math.round(source.durationSeconds * ticksPerSecond));
    const endTick = Math.min(options.rangeEndTick, startTick + durationTick);
    return {
      id: `humming-${options.takeId}-${index + 1}`,
      pitch: Math.max(0, Math.min(127, Math.round(source.pitchMidi))),
      startTick,
      durationTick: Math.max(1, endTick - startTick),
      velocity: Math.max(1, Math.min(127, Math.round(source.amplitude * 127))),
      source: 'humming',
      confidence: Math.max(0, Math.min(1, source.amplitude)),
      userEdited: false,
      lockPitch: true,
      lockTiming: true,
    } satisfies NoteEvent;
  }).filter((note) => note.startTick < options.rangeEndTick && note.durationTick > 0);
}

export class BasicPitchTranscriber implements HummingTranscriber {
  constructor(private readonly modelPath = '/models/basic-pitch/model.json') {}

  async transcribe(blob: Blob, options: HummingTranscriptionOptions, onProgress: (progress: number) => void = () => undefined): Promise<NoteEvent[]> {
    const context = new (audioContextConstructor())({ sampleRate: 22_050 });
    let buffer: AudioBuffer;
    try {
      buffer = await context.decodeAudioData(await blob.arrayBuffer());
    } catch {
      await context.close();
      throw new Error('Recorded audio could not be decoded.');
    }
    try {
      const normalizedBuffer = buffer.numberOfChannels === 1 ? buffer : monoAudioBuffer(context, buffer);
      const { BasicPitch, addPitchBendsToNoteEvents, noteFramesToTime, outputToNotesPoly } = await import('@spotify/basic-pitch');
      const basicPitch = new BasicPitch(this.modelPath);
      const output = await new Promise<{ frames: number[][]; onsets: number[][]; contours: number[][] }>((resolve, reject) => {
        void basicPitch.evaluateModel(normalizedBuffer, (frames, onsets, contours) => resolve({ frames, onsets, contours }), (percent) => onProgress(Math.max(0, Math.min(1, percent)))).catch(reject);
      });
      const detected = outputToNotesPoly(output.frames, output.onsets, .3, .25, 5, true, 1_400, 70, true, 8);
      const withBends = addPitchBendsToNoteEvents(output.contours, detected);
      const timed = noteFramesToTime(withBends);
      const notes = noteTimesToProjectNotes(timed, options);
      if (notes.length === 0) throw new Error('音程を検出できませんでした。もう少し長く、はっきり歌ってください。');
      onProgress(1);
      return notes;
    } finally {
      await context.close();
    }
  }
}

export const basicPitchTranscriber = new BasicPitchTranscriber();
