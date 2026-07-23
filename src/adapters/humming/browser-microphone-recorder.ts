import type { MicrophoneRecorder, RecordedHumming, RecordingSession } from '../../application/humming/humming-ports';

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];

function permissionError(reason: unknown): Error {
  if (reason instanceof DOMException && reason.name === 'NotAllowedError') return new Error('Microphone permission was denied. Browser settingsから許可してください。');
  if (reason instanceof DOMException && reason.name === 'NotFoundError') return new Error('利用できるmicrophoneが見つかりません。');
  if (reason instanceof Error) return reason;
  return new Error('Microphoneを開始できませんでした。');
}

export class BrowserMicrophoneRecorder implements MicrophoneRecorder {
  async start(maxDurationSeconds: number): Promise<RecordingSession> {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('このbrowserはmicrophone recordingに対応していません。');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false });
    } catch (reason) {
      throw permissionError(reason);
    }
    const mimeType = MIME_CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? '';
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 128_000 } : { audioBitsPerSecond: 128_000 });
    const chunks: BlobPart[] = [];
    const startedAt = performance.now();
    let timeout = 0;
    let resolveResult: (value: RecordedHumming) => void;
    let rejectResult: (reason: unknown) => void;
    const result = new Promise<RecordedHumming>((resolve, reject) => { resolveResult = resolve; rejectResult = reject; });
    const stopTracks = () => stream.getTracks().forEach((track) => track.stop());
    recorder.addEventListener('dataavailable', (event) => { if (event.data.size > 0) chunks.push(event.data); });
    recorder.addEventListener('error', (event) => { window.clearTimeout(timeout); stopTracks(); rejectResult(event.error); }, { once: true });
    recorder.addEventListener('stop', () => {
      window.clearTimeout(timeout);
      stopTracks();
      const durationSeconds = Math.min(maxDurationSeconds, Math.max(.01, (performance.now() - startedAt) / 1_000));
      const type = recorder.mimeType || mimeType || 'audio/webm';
      resolveResult({ blob: new Blob(chunks, { type }), mimeType: type, durationSeconds });
    }, { once: true });
    recorder.start(250);
    timeout = window.setTimeout(() => { if (recorder.state !== 'inactive') recorder.stop(); }, maxDurationSeconds * 1_000);
    return { result, stop: () => { if (recorder.state !== 'inactive') recorder.stop(); } };
  }
}

export const browserMicrophoneRecorder = new BrowserMicrophoneRecorder();
