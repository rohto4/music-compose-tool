import type { AudioAssetRepository } from '../../application/audio/audio-asset-repository';
import { sha256Hex, validateAudioFileEnvelope, validateDecodedAudio } from '../../application/audio/audio-file';
import { buildAssetAuditionPlan, buildChordPadAuditionPlan, buildNoteBlockAuditionPlan, buildProjectPlaybackPlan, buildRolePatternAuditionPlan, clipGainEnvelope, findBuiltInAudioAsset, tonalGainEnvelope, transientGainEnvelope } from '../../domain/audio';
import type { AudioEngine, AudioEvent, AudioEventPlan, GainEnvelopePoint, PlaybackReceipt, SustainedAudition, ToneAudioEvent, UserAudioAssetMetadata, UserAudioAssetRecord } from '../../domain/audio';
import { PPQ } from '../../domain/music';
import type { Project, RolePatternRole } from '../../domain/music';
import { browserAudioAssetRepository } from '../storage/indexeddb-audio-asset-repository';

type ContextConstructor = new () => AudioContext;

function audioContextConstructor(): ContextConstructor {
  const constructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: ContextConstructor }).webkitAudioContext;
  if (!constructor) throw new Error('Web Audio is not supported in this browser.');
  return constructor;
}

function scheduleGain(param: AudioParam, start: number, points: GainEnvelopePoint[]): void {
  for (const point of points) {
    const at = start + point.offsetSeconds;
    if (point.curve === 'exponential') param.exponentialRampToValueAtTime(point.value, at);
    else if (point.curve === 'linear') param.linearRampToValueAtTime(point.value, at);
    else param.setValueAtTime(point.value, at);
  }
}

export class WebAudioEngine implements AudioEngine {
  private context: AudioContext | null = null;
  private activeSources = new Set<AudioScheduledSourceNode>();
  private decodedAssets = new Map<string, AudioBuffer>();

  constructor(private readonly assets: AudioAssetRepository = browserAudioAssetRepository) {}

  private async activeContext(): Promise<AudioContext> {
    this.context ??= new (audioContextConstructor())();
    if (this.context.state === 'suspended') await this.context.resume();
    return this.context;
  }

  private trackSource(source: AudioScheduledSourceNode): void {
    this.activeSources.add(source);
    source.addEventListener('ended', () => this.activeSources.delete(source), { once: true });
  }

  private master(context: AudioContext): GainNode {
    const gain = context.createGain();
    gain.gain.value = .72;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = .004;
    compressor.release.value = .22;
    gain.connect(compressor).connect(context.destination);
    return gain;
  }

  private scheduleTone(context: AudioContext, master: GainNode, event: ToneAudioEvent, zero: number): void {
    const start = zero + event.startSeconds;
    const end = start + event.durationSeconds;
    const releaseEnd = end + event.releaseSeconds;
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const outputPanner = context.createStereoPanner();
    const effects = event.effects ?? { filter: 1, reverb: 0, delay: 0, sidechain: 0 };
    const profile = event.synthesis;
    const layers = profile?.layers ?? [{ waveform: event.waveform, octave: 0, detuneCents: 0, gain: 1, pan: 0 }];
    const filterBase = profile?.filterBaseHz ?? 450 + event.brightness * 7_500;
    const filterEnvelope = profile?.filterEnvelopeHz ?? 0;
    const gainEnvelope = tonalGainEnvelope(event.durationSeconds, event.attackSeconds, event.releaseSeconds, Math.max(.0002, event.gain * Math.max(.12, 1 - effects.sidechain * .45)), profile?.sustain ?? .82);
    const attackEnd = start + gainEnvelope[1]!.offsetSeconds;
    filter.type = 'lowpass';
    const cutoff = Math.max(80, filterBase * (.35 + effects.filter * .65));
    filter.frequency.setValueAtTime(cutoff, start);
    if (filterEnvelope > 0) {
      filter.frequency.exponentialRampToValueAtTime(cutoff + filterEnvelope, attackEnd);
      filter.frequency.exponentialRampToValueAtTime(cutoff, Math.max(attackEnd + .01, Math.min(end, start + event.durationSeconds * .62)));
    }
    filter.Q.value = profile?.resonance ?? .8 + event.brightness * 2.4 + effects.filter * 1.2;
    outputPanner.pan.value = event.pan;
    scheduleGain(envelope.gain, start, gainEnvelope);
    filter.connect(envelope).connect(outputPanner).connect(master);
    for (const layer of layers) {
      const oscillator = context.createOscillator();
      const layerGain = context.createGain();
      const layerPanner = context.createStereoPanner();
      oscillator.type = layer.waveform;
      oscillator.frequency.value = event.frequency * 2 ** layer.octave * 2 ** (layer.detuneCents / 1_200);
      layerGain.gain.value = layer.gain;
      layerPanner.pan.value = layer.pan;
      oscillator.connect(layerGain).connect(layerPanner).connect(filter);
      this.trackSource(oscillator);
      oscillator.start(start);
      oscillator.stop(releaseEnd + .01);
    }
    if (effects.delay > 0) {
      const delay = context.createDelay(.6);
      const wet = context.createGain();
      delay.delayTime.value = .11 + effects.delay * .18;
      wet.gain.value = effects.delay * .24;
      outputPanner.connect(delay).connect(wet).connect(master);
    }
    if (effects.reverb > 0) {
      const reverb = context.createDelay(.8);
      const wet = context.createGain();
      reverb.delayTime.value = .19 + effects.reverb * .2;
      wet.gain.value = effects.reverb * .12;
      outputPanner.connect(reverb).connect(wet).connect(master);
    }
  }

  private noiseBuffer(context: AudioContext, seconds: number): AudioBuffer {
    const length = Math.max(1, Math.ceil(context.sampleRate * seconds));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const channel = buffer.getChannelData(0);
    let seed = 0x2468ace;
    for (let index = 0; index < channel.length; index += 1) {
      seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
      channel[index] = (seed / 0xffffffff) * 2 - 1;
    }
    return buffer;
  }

  private scheduleDrum(context: AudioContext, master: GainNode, event: Exclude<AudioEvent, ToneAudioEvent>, zero: number): void {
    const start = zero + event.startSeconds;
    if (event.kind === 'kick' || event.kind === 'tom') {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const timbreHash = [...(event.timbreId ?? event.kind)].reduce((value, character) => (value * 33 + character.charCodeAt(0)) >>> 0, 17);
      const variation = (timbreHash % 19) / 18;
      const brightness = event.brightness ?? .6;
      oscillator.type = event.kind === 'tom' || event.character === 'soft' ? 'triangle' : event.waveform === 'triangle' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(event.kind === 'tom' ? 112 + brightness * 118 + variation * 32 : 92 + brightness * 108 + variation * 38, start);
      oscillator.frequency.exponentialRampToValueAtTime(event.kind === 'tom' ? 65 + brightness * 58 + variation * 16 : 31 + brightness * 17 + variation * 9, start + Math.min(.18, event.durationSeconds * (.68 + variation * .17)));
      scheduleGain(gain.gain, start, transientGainEnvelope(event.durationSeconds, event.gain));
      oscillator.connect(gain).connect(master);
      this.trackSource(oscillator);
      oscillator.start(start);
      oscillator.stop(start + event.durationSeconds + .01);
      return;
    }
    if (event.kind === 'sweep') {
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      const panner = context.createStereoPanner();
      const brightness = event.brightness ?? .7;
      const low = 180 + brightness * 520;
      const high = 3_200 + brightness * 7_200;
      source.buffer = this.noiseBuffer(context, event.durationSeconds + .03);
      filter.type = event.character === 'soft' ? 'lowpass' : 'bandpass';
      filter.Q.value = event.character === 'punchy' ? .9 : .48;
      filter.frequency.setValueAtTime(event.direction === 'down' ? high : low, start);
      filter.frequency.exponentialRampToValueAtTime(event.direction === 'down' ? low : high, start + event.durationSeconds);
      panner.pan.setValueAtTime(Math.max(-1, event.pan - .18), start);
      panner.pan.linearRampToValueAtTime(Math.min(1, event.pan + .18), start + event.durationSeconds);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0002, event.gain * .22), start + event.durationSeconds * .12);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0002, event.gain), start + event.durationSeconds * .82);
      gain.gain.exponentialRampToValueAtTime(.0001, start + event.durationSeconds);
      source.connect(filter).connect(gain).connect(panner).connect(master);
      this.trackSource(source);
      source.start(start);
      source.stop(start + event.durationSeconds + .03);
      return;
    }
    if (event.kind === 'sparkle') {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const panner = context.createStereoPanner();
      const brightness = event.brightness ?? .7;
      const low = 440 + brightness * 560;
      const high = 1_100 + brightness * 2_900;
      oscillator.type = event.waveform ?? 'sine';
      oscillator.frequency.setValueAtTime(event.direction === 'down' ? high : low, start);
      oscillator.frequency.exponentialRampToValueAtTime(event.direction === 'down' ? low : high, start + event.durationSeconds);
      panner.pan.value = event.pan;
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(event.gain, start + event.durationSeconds * .25);
      gain.gain.exponentialRampToValueAtTime(.0001, start + event.durationSeconds);
      oscillator.connect(gain).connect(panner).connect(master);
      this.trackSource(oscillator);
      oscillator.start(start);
      oscillator.stop(start + event.durationSeconds + .01);
      return;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const panner = context.createStereoPanner();
    source.buffer = this.noiseBuffer(context, event.durationSeconds);
    const brightness = event.brightness ?? .65;
    filter.type = event.kind === 'hat' ? 'highpass' : 'bandpass';
    filter.frequency.value = event.kind === 'hat' ? 3_800 + brightness * 4_200 : event.kind === 'clap' ? 1_000 + brightness * 1_500 : 620 + brightness * 1_250;
    filter.Q.value = event.character === 'tiny' ? 2.1 : event.kind === 'hat' ? .7 : 1.2;
    panner.pan.value = event.pan;
    scheduleGain(gain.gain, start, transientGainEnvelope(event.durationSeconds, event.gain));
    source.connect(filter).connect(gain).connect(panner).connect(master);
    this.trackSource(source);
    source.start(start);
    source.stop(start + event.durationSeconds + .01);
  }

  private async scheduleProjectAudioClips(context: AudioContext, master: GainNode, project: Project, zero: number, startTick = 0): Promise<number> {
    const beatSeconds = 60 / project.musicalGrid.bpm;
    const playbackOffsetSeconds = Math.max(0, startTick) / PPQ * beatSeconds;
    const soloTracks = project.tracks.filter((track) => track.solo);
    let latestEnd = 0;
    for (const track of project.tracks) {
      if (track.muted || (soloTracks.length > 0 && !track.solo)) continue;
      for (const lane of track.lanes) {
        if (lane.muted) continue;
        for (const clip of lane.audioClips) {
          const record = await this.assets.get(clip.assetId);
          if (!record) continue;
          let buffer = this.decodedAssets.get(clip.assetId);
          if (!buffer) {
            try { buffer = await context.decodeAudioData(await record.blob.arrayBuffer()); }
            catch { continue; }
            this.decodedAssets.set(clip.assetId, buffer);
          }
          const clipStartSeconds = clip.startTick / PPQ * beatSeconds;
          const offset = Math.min(Math.max(0, clip.offsetSeconds), Math.max(0, buffer.duration - .01));
          const duration = Math.min(clip.durationTick / PPQ * beatSeconds, buffer.duration - offset);
          if (duration <= 0) continue;
          const consumed = Math.max(0, Math.min(duration, playbackOffsetSeconds - clipStartSeconds));
          const remainingDuration = duration - consumed;
          if (remainingDuration <= 0) continue;
          const placements = [{ start: Math.max(0, clipStartSeconds - playbackOffsetSeconds), duration: remainingDuration, offset: offset + consumed }];
          for (const placement of placements) {
            const source = context.createBufferSource();
            const gain = context.createGain();
            const pan = context.createStereoPanner();
            source.buffer = buffer;
            const clipGain = Math.max(0, Math.min(2, clip.gain * track.volume));
            pan.pan.value = track.pan;
            source.connect(gain).connect(pan).connect(master);
            this.trackSource(source);
            scheduleGain(gain.gain, zero + placement.start, clipGainEnvelope(placement.duration, clipGain));
            source.start(zero + placement.start, placement.offset, placement.duration);
            latestEnd = Math.max(latestEnd, placement.start + placement.duration);
          }
        }
      }
    }
    return latestEnd;
  }

  private async playPlan(plan: AudioEventPlan): Promise<PlaybackReceipt> {
    const context = await this.activeContext();
    this.stop();
    const master = this.master(context);
    const zero = context.currentTime + .04;
    for (const event of plan.events) {
      if (event.kind === 'tone') this.scheduleTone(context, master, event, zero);
      else this.scheduleDrum(context, master, event, zero);
    }
    return { durationSeconds: plan.durationSeconds, startedAt: performance.now() };
  }

  async audition(assetId: string): Promise<PlaybackReceipt> {
    const builtIn = findBuiltInAudioAsset(assetId);
    if (builtIn) return this.playPlan(buildAssetAuditionPlan(builtIn));
    const record = await this.assets.get(assetId);
    if (!record) throw new Error(`Audio asset is missing: ${assetId}`);
    const context = await this.activeContext();
    this.stop();
    let buffer = this.decodedAssets.get(assetId);
    if (!buffer) {
      buffer = await context.decodeAudioData(await record.blob.arrayBuffer());
      this.decodedAssets.set(assetId, buffer);
    }
    const source = context.createBufferSource();
    const gain = this.master(context);
    source.buffer = buffer;
    source.connect(gain);
    this.trackSource(source);
    const durationSeconds = Math.min(6, buffer.duration);
    source.start(context.currentTime + .02, 0, durationSeconds);
    return { durationSeconds, startedAt: performance.now() };
  }

  auditionChord(project: Project, padId: string): Promise<PlaybackReceipt> {
    return this.playPlan(buildChordPadAuditionPlan(project, padId));
  }

  auditionRolePattern(project: Project, role: RolePatternRole, patternId: string, phraseIndex: number): Promise<PlaybackReceipt> {
    return this.playPlan(buildRolePatternAuditionPlan(project, role, patternId, phraseIndex));
  }

  auditionNotes(project: Project, trackId: string, noteIds: string[]): Promise<PlaybackReceipt> {
    return this.playPlan(buildNoteBlockAuditionPlan(project, trackId, noteIds));
  }

  async startChordAudition(project: Project, padId: string): Promise<SustainedAudition> {
    const base = buildChordPadAuditionPlan(project, padId);
    const sustained: AudioEventPlan = {
      ...base,
      durationSeconds: 60,
      events: base.events.map((event) => event.kind === 'tone' ? { ...event, durationSeconds: 60 } : event),
    };
    const receipt = await this.playPlan(sustained);
    let stopped = false;
    return {
      startedAt: receipt.startedAt,
      stop: () => {
        if (stopped) return;
        stopped = true;
        this.stop();
      },
    };
  }

  async playProject(project: Project, startTick = 0): Promise<PlaybackReceipt> {
    const plan = buildProjectPlaybackPlan(project, undefined, startTick);
    const context = await this.activeContext();
    this.stop();
    const master = this.master(context);
    const zero = context.currentTime + .04;
    for (const event of plan.events) {
      if (event.kind === 'tone') this.scheduleTone(context, master, event, zero);
      else this.scheduleDrum(context, master, event, zero);
    }
    const clipDuration = await this.scheduleProjectAudioClips(context, master, project, zero, startTick);
    return { durationSeconds: Math.max(plan.durationSeconds, clipDuration), startedAt: performance.now() };
  }

  stop(): void {
    for (const source of this.activeSources) {
      try { source.stop(); } catch { /* source has already ended */ }
    }
    this.activeSources.clear();
  }

  async importUserAudio(file: File, createdAt: string): Promise<UserAudioAssetMetadata> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const mimeType = validateAudioFileEnvelope(file, bytes);
    const context = await this.activeContext();
    let decoded: AudioBuffer;
    try {
      decoded = await context.decodeAudioData(arrayBuffer.slice(0));
    } catch {
      throw new Error('Browser could not decode this audio file.');
    }
    validateDecodedAudio({ durationSeconds: decoded.duration, sampleRate: decoded.sampleRate, channels: decoded.numberOfChannels });
    const sha256 = await sha256Hex(arrayBuffer);
    const metadata: UserAudioAssetMetadata = {
      id: `user-audio-${sha256.slice(0, 24)}`,
      name: file.name,
      mimeType,
      sizeBytes: file.size,
      durationSeconds: decoded.duration,
      sampleRate: decoded.sampleRate,
      channels: decoded.numberOfChannels,
      sha256,
      source: 'user-upload',
      licenseTag: 'user-owned-private',
      createdAt,
    };
    await this.assets.save({ metadata, blob: new Blob([arrayBuffer], { type: mimeType }) });
    this.decodedAssets.set(metadata.id, decoded);
    return metadata;
  }

  listUserAudio(): Promise<UserAudioAssetMetadata[]> {
    return this.assets.list();
  }

  getUserAudioAsset(assetId: string): Promise<UserAudioAssetRecord | undefined> {
    return this.assets.get(assetId);
  }
}

export const browserAudioEngine = new WebAudioEngine();
