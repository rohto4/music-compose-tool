import { describe, expect, it } from 'vitest';
import { downmixChannelsToMono, encodeMonoPcm16Wav, noteTimesToProjectNotes } from './basic-pitch-transcriber';

describe('Basic Pitch note conversion', () => {
  it('downmixes stereo microphone input by averaging channels', () => {
    const mono = downmixChannelsToMono([
      new Float32Array([1, .5, -1, -.5]),
      new Float32Array([.5, -.5, -.5, .5]),
    ]);

    expect(Array.from(mono)).toEqual([.75, 0, -.75, 0]);
  });

  it('encodes normalized input as a one-channel PCM WAV', async () => {
    const wav = encodeMonoPcm16Wav(new Float32Array([0, .5, -.5, 1, -1]), 22_050);
    const view = new DataView(await wav.arrayBuffer());

    expect(wav.type).toBe('audio/wav');
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(22_050);
    expect(view.getUint16(32, true)).toBe(2);
  });

  it('keeps the strongest monophonic note and clips it to the requested project range', () => {
    const notes = noteTimesToProjectNotes([
      { startTimeSeconds: 0, durationSeconds: .5, pitchMidi: 61.7, amplitude: .4 },
      { startTimeSeconds: .02, durationSeconds: .75, pitchMidi: 66.2, amplitude: .9 },
      { startTimeSeconds: 1, durationSeconds: 3, pitchMidi: 69, amplitude: .7 },
      { startTimeSeconds: 5, durationSeconds: .5, pitchMidi: 72, amplitude: .8 },
    ], { takeId: 'take-a', bpm: 120, rangeStartTick: 480, rangeEndTick: 2_400 });

    expect(notes).toHaveLength(2);
    expect(notes[0]).toMatchObject({ id: 'humming-take-a-1', pitch: 66, startTick: 499, durationTick: 720, velocity: 114, source: 'humming', lockPitch: true, lockTiming: true });
    expect(notes[1]).toMatchObject({ pitch: 69, startTick: 1_440, durationTick: 960 });
  });
});
