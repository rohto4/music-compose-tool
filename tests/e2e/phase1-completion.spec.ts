import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

function createToneWave(channels = 1): Buffer {
  const sampleRate = 44_100;
  const frames = Math.round(sampleRate * .12);
  const dataBytes = frames * channels * 2;
  const output = Buffer.alloc(44 + dataBytes);
  output.write('RIFF', 0); output.writeUInt32LE(36 + dataBytes, 4); output.write('WAVE', 8);
  output.write('fmt ', 12); output.writeUInt32LE(16, 16); output.writeUInt16LE(1, 20); output.writeUInt16LE(channels, 22);
  output.writeUInt32LE(sampleRate, 24); output.writeUInt32LE(sampleRate * channels * 2, 28); output.writeUInt16LE(channels * 2, 32); output.writeUInt16LE(16, 34);
  output.write('data', 36); output.writeUInt32LE(dataBytes, 40);
  for (let frame = 0; frame < frames; frame += 1) {
    const value = Math.round(Math.sin(frame / sampleRate * 440 * Math.PI * 2) * 4_000);
    for (let channel = 0; channel < channels; channel += 1) output.writeInt16LE(value, 44 + (frame * channels + channel) * 2);
  }
  return output;
}

function pcm16Peak(bytes: Buffer, offset = 44): number {
  let peak = 0;
  for (let cursor = offset; cursor + 1 < bytes.length; cursor += 2) peak = Math.max(peak, Math.abs(bytes.readInt16LE(cursor)));
  return peak;
}

async function mockHomeAi(page: Page): Promise<() => { sourceAudioConditioned: boolean; referenceAudioConditioned: boolean; sourceChannels: number | null; referenceChannels: number | null }> {
  const artifact = createToneWave();
  let sourceAudioConditioned = false;
  let referenceAudioConditioned = false;
  let sourceChannels: number | null = null;
  let referenceChannels: number | null = null;
  await page.route('**/api/home-ai/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith('/artifacts/e2e-artifact')) {
      await route.fulfill({ status: 200, contentType: 'audio/wav', body: artifact });
      return;
    }
    if (request.method() === 'POST' && path.endsWith('/jobs')) {
      const body = request.postDataJSON() as { capability?: string; srcAudioBase64?: string; referenceAudioBase64?: string };
      const fullTrack = body.capability === 'full-track';
      if (fullTrack && body.srcAudioBase64) { sourceAudioConditioned = true; sourceChannels = Buffer.from(body.srcAudioBase64, 'base64').readUInt16LE(22); }
      if (fullTrack && body.referenceAudioBase64) { referenceAudioConditioned = true; referenceChannels = Buffer.from(body.referenceAudioBase64, 'base64').readUInt16LE(22); }
      await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ id: fullTrack ? 'e2e-full-track' : 'e2e-accompaniment', status: 'queued', capability: fullTrack ? 'full-track' : 'accompaniment', profile: 'ace-step-1.5-dit-only' }) });
      return;
    }
    const fullTrack = path.endsWith('/jobs/e2e-full-track');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: fullTrack ? 'e2e-full-track' : 'e2e-accompaniment', status: fullTrack ? 'succeeded' : 'fallback', capability: fullTrack ? 'full-track' : 'accompaniment', backend: fullTrack ? 'ace-step-1.5-dit-only' : 'template-rule', profile: 'ace-step-1.5-dit-only', result: { backend: fullTrack ? 'ace-step-1.5-dit-only' : 'template-rule', reason: 'e2e-fixture', output: fullTrack ? { kind: 'audio-layer', editable: false, melodyPreserved: true, conditioning: 'source-audio-complete', sourceAudioIncluded: true, artifactId: 'e2e-artifact', metrics: { peakReservedMiB: 7_504, durationSeconds: .12, sampleRate: 44_100, channels: 1 } } : { kind: 'symbolic-accompaniment', editable: true, melodyPreserved: true, lanes: [], intentTrace: ['e2e:fixture'] } } }) });
  });
  return () => ({ sourceAudioConditioned, referenceAudioConditioned, sourceChannels, referenceChannels });
}

async function createPatchboardProject(page: Page, title: string): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: '新しい曲' }).click();
  await page.getByRole('textbox', { name: '曲の名前' }).fill(title);
  await page.getByText('パッチボードで組む', { exact: true }).click();
  await page.getByLabel('長さ').selectOption('60');
  await page.getByRole('button', { name: 'パッチボードから始める' }).click();
}

test('カスタマイズDAW編集の主要操作をdomainへ反映する', async ({ page }) => {
  const errors: string[] = [];
  await page.addInitScript(() => {
    const input = { id: 'midi-e2e-input', name: 'E2E MIDI', onmidimessage: null as ((event: { data: Uint8Array; timeStamp: number }) => void) | null };
    (window as unknown as { __patchtoneMidiInput: typeof input }).__patchtoneMidiInput = input;
    (navigator as Navigator & { requestMIDIAccess: () => Promise<unknown> }).requestMIDIAccess = async () => ({ inputs: new Map([['midi-e2e-input', input]]), outputs: new Map() });
  });
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await mockHomeAi(page);
  await createPatchboardProject(page, 'DAW Completion');

  await page.getByLabel('曲の長さ').selectOption('120');
  await page.getByLabel('曲のキー').selectOption('F# minor');
  await page.getByLabel('曲のBPM').fill('172');
  await expect(page.getByText('F# minor · 172 BPM')).toBeVisible();

  await page.getByRole('button', { name: 'HUMMING STUDIO' }).click();
  await page.getByRole('button', { name: 'メロディの下書きを入れる' }).click();
  await page.getByRole('button', { name: 'このメロディに伴奏をつける' }).click();
  await expect(page.getByText('6 editable tracks')).toBeVisible();
  const generationRange = page.getByLabel('生成範囲', { exact: true });
  await expect(generationRange).toHaveValue('whole');
  await generationRange.selectOption('accompaniment');
  await expect(generationRange).toHaveValue('accompaniment');
  await generationRange.selectOption('selected');
  await page.getByRole('button', { name: 'PATCHBOARD' }).click();
  await page.getByRole('button', { name: '音を組む' }).click();
  await page.getByLabel('WAV / MP3ファイル').setInputFiles({ name: 'layer.wav', mimeType: 'audio/wav', buffer: createToneWave() });
  await page.getByRole('button', { name: '4小節へ配置', exact: true }).click();
  await expect(page.getByText('layer.wavをPHRASE 1へ配置しました。')).toBeVisible();
  await page.getByRole('button', { name: /^カスタマイズ/ }).click();
  await expect(page.getByRole('heading', { name: '音声レイヤー' })).toBeVisible();
  await page.locator('.audio-clip-row input[aria-label*="開始tick"]').fill('480');
  await page.getByRole('slider', { name: /gain/ }).fill('0.5');
  const trackSelect = page.getByLabel('編集トラック');
  await page.getByLabel('追加トラック種別').selectOption('lead');
  await page.getByRole('button', { name: 'トラック追加' }).click();
  await expect(page.getByText('Lead 2を追加しました')).toBeVisible();
  await trackSelect.selectOption('track-chord');
  await expect(page.getByLabel('Chordsピアノロール')).toBeVisible();
  await trackSelect.selectOption('track-melody');
  await page.getByLabel('Melody 音色').selectOption('arp-pixel-drop');
  const canvas = page.getByLabel('メロディピアノロール');
  await expect(canvas).toBeVisible();
  const viewportSlider = page.getByLabel('全曲内の表示位置');
  await expect(viewportSlider).toBeEnabled();
  await viewportSlider.fill('336');
  await page.getByRole('button', { name: 'Drop Aから表示' }).click();
  await canvas.dblclick({ position: { x: 140, y: 180 } });
  await canvas.dblclick({ position: { x: 220, y: 210 } });
  const selectedNote = page.getByLabel('選択音符', { exact: true });
  await expect(selectedNote).toHaveValue(/manual-/);
  const selectedNoteId = await selectedNote.inputValue();
  const canvasOrigin = await canvas.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { left: bounds.left, top: bounds.top };
  });
  await page.mouse.move(canvasOrigin.left + 110, canvasOrigin.top + 160);
  await page.mouse.down();
  await page.mouse.move(canvasOrigin.left + 270, canvasOrigin.top + 235, { steps: 4 });
  await page.mouse.up();
  await expect(page.getByText('2音を選択中')).toBeVisible();
  await expect(page.getByText(/2音を範囲選択しました/)).toBeVisible();
  await selectedNote.selectOption(selectedNoteId);
  await page.getByRole('button', { name: '音程を1半音上げる' }).click();
  await page.getByLabel('選択音符の開始tick').fill('480');
  await page.getByLabel('選択音符のvelocity').fill('112');
  await page.getByRole('button', { name: '長さを1グリッド伸ばす' }).click();
  await page.getByRole('button', { name: '複製' }).click();
  await expect(page.getByText(/音を複製しました/)).toBeVisible();
  await page.getByLabel('Loop開始小節').selectOption('2');
  await page.getByLabel('Loop終了小節').selectOption('4');
  await page.getByRole('button', { name: 'Loop off' }).click();
  await expect(page.getByRole('button', { name: 'Loop on' })).toBeVisible();
  await page.getByLabel('Grid').selectOption(String(480 / 6));
  await page.getByRole('button', { name: 'Quantize' }).click();
  await page.getByRole('button', { name: 'Copy' }).click();
  await page.getByRole('button', { name: 'Paste', exact: true }).click();
  const filter = page.getByLabel('Melody filter');
  await filter.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = '0.35';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.getByRole('button', { name: '+ Point' }).click();
  await expect(page.getByText('1 points')).toBeVisible();
  await page.getByRole('button', { name: 'MIDI入力' }).click();
  await expect(page.locator('.daw-midi-status')).toContainText('1 MIDI入力を接続');
  await page.evaluate(() => {
    const input = (window as unknown as { __patchtoneMidiInput: { onmidimessage: ((event: { data: Uint8Array; timeStamp: number }) => void) | null } }).__patchtoneMidiInput;
    input.onmidimessage?.({ data: new Uint8Array([0x90, 72, 104]), timeStamp: 100 });
    input.onmidimessage?.({ data: new Uint8Array([0x80, 72, 0]), timeStamp: 350 });
  });
  await expect(page.getByRole('button', { name: 'Copy' })).toBeEnabled();
  expect(errors).toEqual([]);
});

test('鼻歌由来メロディを残してAI追加WAVレイヤーを適用する', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  const wasSourceAudioConditioned = await mockHomeAi(page);
  await page.goto('/');
  await page.getByRole('button', { name: '新しい曲' }).click();
  await page.getByRole('textbox', { name: '曲の名前' }).fill('AI Layer Completion');
  await page.getByRole('radio', { name: /鼻歌から一曲/ }).check();
  await page.getByRole('button', { name: '鼻歌から始める' }).click();
  await page.getByLabel('AIへのイメージ指示').fill('きらきらしたFuture Bass、ドロップは軽く跳ねる感じ。');
  await page.getByRole('button', { name: 'きらきら' }).click();
  await page.getByLabel('AI指示音声ファイル').setInputFiles({ name: 'reference.wav', mimeType: 'audio/wav', buffer: createToneWave(2) });
  await expect(page.getByText('reference.wavを参考音声として追加しました。')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'ボイスメモを録音' }).click();
  await expect(page.getByRole('button', { name: 'ボイスメモの録音停止' })).toBeVisible();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'ボイスメモの録音停止' }).click();
  await expect(page.getByText('ボイスメモ指示 1件')).toBeVisible({ timeout: 30_000 });
  await page.getByLabel('録音fileを使う').setInputFiles({ name: 'humming.wav', mimeType: 'audio/wav', buffer: createToneWave(2) });
  await expect(page.getByText(/音符をMelodyへ適用しました/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'このメロディに伴奏をつける' }).click();
  await expect(page.getByText('6 editable tracks')).toBeVisible();
  await page.getByLabel('AIへのイメージ指示').fill('勢いのあるFuture Core。ドロップは強く、細かいハイハット。');
  await page.getByRole('button', { name: '指示を反映して作り直す' }).click();
  await expect(page.getByText('6 editable tracks')).toBeVisible();
  await page.getByRole('button', { name: '追加レイヤーを生成' }).click();
  await expect(page.getByText('生成済みのWAVレイヤーをProjectへ追加済み')).toBeVisible({ timeout: 15_000 });
  expect(wasSourceAudioConditioned()).toEqual({ sourceAudioConditioned: true, referenceAudioConditioned: true, sourceChannels: 1, referenceChannels: 1 });
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByText('保存済み')).toBeVisible();
  await page.getByRole('button', { name: 'PATCHBOARD' }).click();
  await expect(page.getByRole('heading', { name: '曲の設計' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('gateway停止時はmalformed JSONではなく再起動可能なoffline状態を表示する', async ({ page }) => {
  await page.route('**/api/home-ai/**', (route) => route.fulfill({ status: 502, contentType: 'text/plain', body: '' }));
  await createPatchboardProject(page, 'Offline AI Layer');
  await page.getByRole('button', { name: 'HUMMING STUDIO' }).click();
  await page.getByRole('button', { name: 'メロディの下書きを入れる' }).click();
  await page.getByRole('button', { name: 'このメロディに伴奏をつける' }).click();
  await expect(page.getByText('6 editable tracks')).toBeVisible();
  await page.getByRole('button', { name: '追加レイヤーを生成' }).click();
  await expect(page.getByText(/Home AIがオフラインです/)).toBeVisible();
  await expect(page.getByText(/malformed JSON/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: '追加レイヤーを生成' })).toBeEnabled();
});

test('WAV・STEMS・MIDIの実ブラウザdownload envelopeを検証する', async ({ page }) => {
  test.setTimeout(120_000);
  await createPatchboardProject(page, 'Export Completion');
  const wavPromise = page.waitForEvent('download', { timeout: 120_000 });
  await page.getByRole('button', { name: 'WAV' }).click();
  const wavDownload = await wavPromise;
  const wavPath = await wavDownload.path();
  if (!wavPath) throw new Error('WAV download path is unavailable.');
  const wav = await readFile(wavPath);
  expect(wav.subarray(0, 4).toString('ascii')).toBe('RIFF');
  expect(wav.subarray(8, 12).toString('ascii')).toBe('WAVE');
  expect(pcm16Peak(wav)).toBeGreaterThan(100);

  const stemsPromise = page.waitForEvent('download', { timeout: 120_000 });
  await page.getByRole('button', { name: 'STEMS' }).click();
  const stemsDownload = await stemsPromise;
  const stemsPath = await stemsDownload.path();
  if (!stemsPath) throw new Error('STEMS download path is unavailable.');
  expect((await readFile(stemsPath)).subarray(0, 2).toString('ascii')).toBe('PK');

  const midiPromise = page.waitForEvent('download', { timeout: 120_000 });
  await page.getByRole('button', { name: 'MIDI', exact: true }).click();
  const midiDownload = await midiPromise;
  const midiPath = await midiDownload.path();
  if (!midiPath) throw new Error('MIDI download path is unavailable.');
  expect((await readFile(midiPath)).subarray(0, 4).toString('ascii')).toBe('MThd');
});

test('Misskey投稿は明示クリックから一時tokenでadapterへ接続する', async ({ page }) => {
  let promptCount = 0;
  page.on('dialog', async (dialog) => { await dialog.accept(promptCount++ === 0 ? 'https://misskey.example' : 'temporary-token'); });
  await page.route('https://misskey.example/api/notes/create', async (route) => {
    const body = route.request().postDataJSON() as { i?: string; text?: string; visibility?: string };
    if (body.i !== 'temporary-token' || body.visibility !== 'public' || !body.text?.includes('Export')) {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { message: 'unexpected test payload' } }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'note-e2e-1' }) });
  });
  await createPatchboardProject(page, 'Export Completion');
  await page.getByRole('button', { name: 'Misskeyへ投稿' }).click();
  await expect(page.locator('.transport-status')).toContainText('Misskeyへ投稿しました（note-e2e-1）');
});
