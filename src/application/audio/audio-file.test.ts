import { describe, expect, it } from 'vitest';
import { detectSupportedAudioType, validateAudioFileEnvelope, validateDecodedAudio } from './audio-file';

function waveHeader(): Uint8Array {
  const bytes = new Uint8Array(44);
  bytes.set(new TextEncoder().encode('RIFF'), 0);
  bytes.set(new TextEncoder().encode('WAVE'), 8);
  return bytes;
}

describe('audio file boundary', () => {
  it('detects WAV and MP3 by content instead of trusting MIME alone', () => {
    expect(detectSupportedAudioType(waveHeader())).toBe('audio/wav');
    expect(detectSupportedAudioType(Uint8Array.from([0x49, 0x44, 0x33, 4, 0, 0]))).toBe('audio/mpeg');
    expect(detectSupportedAudioType(Uint8Array.from([0xff, 0xfb, 0x90, 0x64]))).toBe('audio/mpeg');
    expect(detectSupportedAudioType(new TextEncoder().encode('<script>'))).toBeNull();
  });

  it('rejects extension mismatch and unsupported decoded shapes', () => {
    expect(() => validateAudioFileEnvelope({ name: 'renamed.mp3', size: 44 }, waveHeader())).toThrow('.wav');
    expect(() => validateDecodedAudio({ durationSeconds: 601, sampleRate: 48_000, channels: 2 })).toThrow('10 minutes');
    expect(() => validateDecodedAudio({ durationSeconds: 1, sampleRate: 48_000, channels: 6 })).toThrow('mono or stereo');
  });
});
