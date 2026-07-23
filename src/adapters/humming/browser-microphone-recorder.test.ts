// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrowserMicrophoneRecorder } from './browser-microphone-recorder';

class FakeMediaRecorder extends EventTarget {
  static isTypeSupported(): boolean { return true; }
  readonly mimeType = 'audio/webm;codecs=opus';
  state: RecordingState = 'inactive';

  constructor() { super(); }

  start(): void {
    this.state = 'recording';
    const event = new Event('dataavailable');
    Object.defineProperty(event, 'data', { value: new Blob(['voice'], { type: this.mimeType }) });
    this.dispatchEvent(event);
  }

  stop(): void {
    this.state = 'inactive';
    this.dispatchEvent(new Event('stop'));
  }
}

afterEach(() => vi.unstubAllGlobals());

describe('BrowserMicrophoneRecorder', () => {
  it('captures a take and releases every media track after explicit stop', async () => {
    const stopTrack = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn(() => Promise.resolve({ getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream)) } });
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    const session = await new BrowserMicrophoneRecorder().start(30);
    session.stop();
    const result = await session.result;

    expect(result.mimeType).toBe('audio/webm;codecs=opus');
    expect(result.blob.size).toBeGreaterThan(0);
    expect(result.durationSeconds).toBeLessThanOrEqual(30);
    expect(stopTrack).toHaveBeenCalledOnce();
  });

  it('returns a usable permission message when microphone access is denied', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn(() => Promise.reject(new DOMException('Denied', 'NotAllowedError'))) } });
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    await expect(new BrowserMicrophoneRecorder().start(30)).rejects.toThrow('Microphone permission was denied');
  });
});
