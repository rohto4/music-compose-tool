import type { UserAudioAssetMetadata } from '../../domain/audio';

const MAX_AUDIO_FILE_BYTES = 128 * 1024 * 1024;
const MAX_AUDIO_DURATION_SECONDS = 10 * 60;

export interface DecodedAudioFacts {
  durationSeconds: number;
  sampleRate: number;
  channels: number;
}

export function detectSupportedAudioType(bytes: Uint8Array): UserAudioAssetMetadata['mimeType'] | null {
  const isWave = bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.slice(8, 12)) === 'WAVE';
  if (isWave) return 'audio/wav';
  const isId3 = bytes.length >= 3 && String.fromCharCode(...bytes.slice(0, 3)) === 'ID3';
  const isMp3Frame = bytes.length >= 2 && bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0;
  if (isId3 || isMp3Frame) return 'audio/mpeg';
  return null;
}

export function validateAudioFileEnvelope(file: Pick<File, 'name' | 'size'>, bytes: Uint8Array): UserAudioAssetMetadata['mimeType'] {
  if (file.size < 44) throw new Error('Audio file is empty or too small.');
  if (file.size > MAX_AUDIO_FILE_BYTES) throw new Error('Audio file is larger than 128 MiB.');
  const mimeType = detectSupportedAudioType(bytes);
  if (!mimeType) throw new Error('Only decoded WAV or MP3 audio is supported.');
  const lowerName = file.name.toLowerCase();
  if (mimeType === 'audio/wav' && !lowerName.endsWith('.wav')) throw new Error('WAV content must use a .wav file name.');
  if (mimeType === 'audio/mpeg' && !lowerName.endsWith('.mp3')) throw new Error('MP3 content must use a .mp3 file name.');
  return mimeType;
}

export function validateDecodedAudio(facts: DecodedAudioFacts): void {
  if (!Number.isFinite(facts.durationSeconds) || facts.durationSeconds <= 0 || facts.durationSeconds > MAX_AUDIO_DURATION_SECONDS) throw new Error('Audio duration must be greater than 0 and at most 10 minutes.');
  if (!Number.isInteger(facts.channels) || facts.channels < 1 || facts.channels > 2) throw new Error('Audio must be mono or stereo.');
  if (!Number.isFinite(facts.sampleRate) || facts.sampleRate < 8_000 || facts.sampleRate > 192_000) throw new Error('Audio sample rate is outside the supported range.');
}

export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}
