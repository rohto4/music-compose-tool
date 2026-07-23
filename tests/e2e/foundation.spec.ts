import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';

function createToneWave(): Buffer {
  const sampleRate = 44_100;
  const frames = Math.round(sampleRate * .25);
  const dataBytes = frames * 2;
  const output = Buffer.alloc(44 + dataBytes);
  output.write('RIFF', 0);
  output.writeUInt32LE(36 + dataBytes, 4);
  output.write('WAVE', 8);
  output.write('fmt ', 12);
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(1, 22);
  output.writeUInt32LE(sampleRate, 24);
  output.writeUInt32LE(sampleRate * 2, 28);
  output.writeUInt16LE(2, 32);
  output.writeUInt16LE(16, 34);
  output.write('data', 36);
  output.writeUInt32LE(dataBytes, 40);
  for (let frame = 0; frame < frames; frame += 1) output.writeInt16LE(Math.round(Math.sin(frame / sampleRate * 440 * Math.PI * 2) * 5_000), 44 + frame * 2);
  return output;
}

function pcm16Peak(bytes: Buffer, offset = 44): number {
  let peak = 0;
  for (let cursor = offset; cursor + 1 < bytes.length; cursor += 2) peak = Math.max(peak, Math.abs(bytes.readInt16LE(cursor)));
  return peak;
}

function createHummingWave(): Buffer {
  const sampleRate = 22_050;
  const channels = 2;
  const frequencies = [293.66, 369.99, 440, 587.33];
  const noteSeconds = .8;
  const frames = Math.round(sampleRate * noteSeconds * frequencies.length);
  const dataBytes = frames * channels * 2;
  const output = Buffer.alloc(44 + dataBytes);
  output.write('RIFF', 0);
  output.writeUInt32LE(36 + dataBytes, 4);
  output.write('WAVE', 8);
  output.write('fmt ', 12);
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(channels, 22);
  output.writeUInt32LE(sampleRate, 24);
  output.writeUInt32LE(sampleRate * channels * 2, 28);
  output.writeUInt16LE(channels * 2, 32);
  output.writeUInt16LE(16, 34);
  output.write('data', 36);
  output.writeUInt32LE(dataBytes, 40);
  for (let frame = 0; frame < frames; frame += 1) {
    const time = frame / sampleRate;
    const noteIndex = Math.min(frequencies.length - 1, Math.floor(time / noteSeconds));
    const localTime = time - noteIndex * noteSeconds;
    const frequency = frequencies[noteIndex]!;
    const gate = localTime < .68 ? Math.min(1, localTime / .04, (.68 - localTime) / .05) : 0;
    const sample = gate * (Math.sin(time * frequency * Math.PI * 2) + .22 * Math.sin(time * frequency * Math.PI * 4));
    const value = Math.max(-32_767, Math.min(32_767, Math.round(sample * 8_000)));
    output.writeInt16LE(value, 44 + frame * channels * 2);
    output.writeInt16LE(value, 44 + frame * channels * 2 + 2);
  }
  return output;
}

async function mockHomeAi(page: Page): Promise<void> {
  await page.route('**/api/home-ai/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === 'POST' && path.endsWith('/jobs')) {
      await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ id: 'e2e-job', status: 'queued', capability: 'accompaniment', profile: 'ace-step-1.5-dit-only' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'e2e-job', status: 'fallback', capability: 'accompaniment', profile: 'ace-step-1.5-dit-only', result: { backend: 'template-rule', reason: 'e2e-fixture', output: { kind: 'symbolic-accompaniment', editable: true, melodyPreserved: true, lanes: [], intentTrace: ['e2e:fixture'] } } }) });
  });
}

test('creates and manually saves a humming-first project without console errors', async ({ page }) => {
  // OfflineAudioContext STEMS rendering is intentionally CPU-heavy. Keep its
  // download timeout strict, while allowing the rest of this full lifecycle
  // (save, arrangement, bundle round-trip) to finish on slower CI hosts.
  test.setTimeout(240_000);
  await mockHomeAi(page);
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'どこから曲を始めますか？' })).toBeVisible();
  await page.getByRole('button', { name: '新しい曲' }).click();
  await page.getByRole('textbox', { name: '曲の名前' }).fill('Browser Soda');
  await page.getByRole('radio', { name: /鼻歌から一曲/ }).check();
  // This lifecycle verifies placed-audio STEM contents and project round-trip;
  // the dedicated export journey covers the longer rendering envelope.
  await page.getByLabel('長さ').selectOption('60');
  await page.getByRole('button', { name: '鼻歌から始める' }).click();
  await expect(page.getByRole('heading', { name: '鼻歌から一曲を作る' })).toBeVisible();
  await expect(page.getByText('未保存')).toBeVisible();
  await page.getByRole('button', { name: 'メロディの下書きを入れる' }).click();
  await expect(page.getByText('16 notes')).toBeVisible();
  await page.getByRole('button', { name: 'このメロディに伴奏をつける' }).click();
  await expect(page.getByText('6 editable tracks')).toBeVisible();
  await expect(page.getByText('MELODY PITCH / RHYTHM LOCK')).toBeVisible();
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByText('保存済み')).toBeVisible();
  await page.getByRole('button', { name: 'PATCHBOARD' }).click();
  await page.getByRole('button', { name: /音を組む/ }).click();
  const supersaw = page.locator('.asset-card').filter({ hasText: 'Soft Supersaw' });
  await supersaw.getByRole('button', { name: '▶ 試聴' }).click();
  await expect(page.getByText('試聴中: Soft Supersaw')).toBeVisible();
  await expect(supersaw.getByRole('button', { name: '再配置' })).toBeVisible();
  await page.locator('input[accept*=".wav"]').setInputFiles({ name: 'tone.wav', mimeType: 'audio/wav', buffer: createToneWave() });
  await expect(page.getByText('tone.wav をprivate assetとして追加しました。')).toBeVisible();
  await expect(page.getByText('PRIVATE / USER OWNED')).toBeVisible();
  await page.getByRole('button', { name: '4小節へ配置', exact: true }).click();
  await expect(page.getByText('tone.wavをPHRASE 1へ配置しました。')).toBeVisible();
  const placedStemsPromise = page.waitForEvent('download', { timeout: 120_000 });
  await page.getByRole('button', { name: 'STEMS' }).click();
  const placedStemsDownload = await placedStemsPromise;
  const placedStemsPath = await placedStemsDownload.path();
  if (!placedStemsPath) throw new Error('Placed-audio STEMS path is unavailable.');
  const placedStems = await JSZip.loadAsync(await readFile(placedStemsPath));
  expect(Object.keys(placedStems.files).some((name) => name.includes('AI_Layer'))).toBe(true);
  const placedLayer = placedStems.file(Object.keys(placedStems.files).find((name) => name.includes('AI_Layer') && name.endsWith('.wav')) ?? '');
  expect(placedLayer).toBeTruthy();
  expect(pcm16Peak(Buffer.from(await placedLayer!.async('nodebuffer')))).toBeGreaterThan(100);
  await page.getByRole('button', { name: /展開を整える/ }).click();
  const sections = page.locator('.arrangement-section-card');
  await expect(sections).toHaveCount(8);
  await page.getByRole('button', { name: '流れを追加' }).click();
  await page.getByRole('button', { name: 'Bridgeを追加' }).click();
  await expect(sections).toHaveCount(9);
  await page.getByRole('button', { name: '元に戻す' }).click();
  await expect(sections).toHaveCount(8);
  await page.getByRole('button', { name: 'やり直す' }).click();
  await expect(sections).toHaveCount(9);
  const addedBridge = sections.filter({ hasText: 'Bridge 2' });
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await addedBridge.dispatchEvent('dragstart', { dataTransfer });
  await sections.first().dispatchEvent('dragenter', { dataTransfer });
  await sections.first().dispatchEvent('dragover', { dataTransfer });
  await sections.first().dispatchEvent('drop', { dataTransfer });
  await expect(sections.first()).toContainText('Bridge 2');
  await page.getByRole('button', { name: 'Bridge 2を後へ' }).click();
  await expect(sections.nth(1)).toContainText('Bridge 2');
  const mainIntroBlock = page.getByRole('button', { name: 'Chords Main / Introへ配置' });
  await mainIntroBlock.click();
  await expect(mainIntroBlock).toHaveAttribute('data-filled', 'true');
  const subDropBlock = page.getByRole('button', { name: 'Chords Sub / Drop Aへ配置' });
  await subDropBlock.click();
  await expect(subDropBlock).toHaveAttribute('data-filled', 'true');
  await page.getByRole('button', { name: '元に戻す' }).click();
  await expect(subDropBlock).toHaveAttribute('data-filled', 'false');
  const flowAsset = page.getByLabel('展開アセットを選ぶ');
  await flowAsset.selectOption('gentle-rise');
  await expect(flowAsset).toHaveValue('gentle-rise');
  await expect(sections).toHaveCount(6);
  await expect(sections.first()).toContainText('Soft Intro');
  await flowAsset.selectOption('twin-drop');
  await expect(flowAsset).toHaveValue('twin-drop');
  await expect(sections).toHaveCount(7);
  await page.getByRole('button', { name: '▶ 再生' }).click();
  await expect(page.getByText(/曲全体 · \d+ sec · 先頭から1回再生/)).toBeVisible();
  await page.getByRole('button', { name: '■ 停止' }).click();
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByText('保存済み')).toBeVisible();
  await page.getByRole('button', { name: '曲の一覧' }).click();
  await expect(page.getByRole('heading', { name: 'Browser Soda' })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'project file', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('Browser Soda.mctproj');
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error('Downloaded project path is unavailable.');
  const projectBundle = await readFile(downloadPath);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Browser Soda' })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({ name: 'Browser Soda.mctproj', mimeType: 'application/zip', buffer: projectBundle });
  await expect(page.getByText('Browser Soda を読み込みました。')).toBeVisible();
  await page.getByRole('button', { name: '続きから' }).click();
  await page.getByRole('button', { name: 'PATCHBOARD' }).click();
  await page.getByRole('button', { name: /音を組む/ }).click();
  await expect(page.getByText('tone.wav')).toBeVisible();
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
  expect(errors).toEqual([]);
});

test('opens the real browser microphone path and stores a stoppable 30-second take', async ({ page }) => {
  await mockHomeAi(page);
  await page.goto('/');
  await page.getByRole('button', { name: '新しい曲' }).click();
  await page.getByRole('textbox', { name: '曲の名前' }).fill('Mic Permission');
  await page.getByRole('radio', { name: /鼻歌から一曲/ }).check();
  await page.getByRole('button', { name: '鼻歌から始める' }).click();
  await page.getByRole('button', { name: 'ボイスメモを録音' }).click();
  await expect(page.getByRole('button', { name: 'ボイスメモの録音停止' })).toBeVisible();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'ボイスメモの録音停止' }).click();
  await expect(page.getByText('ボイスメモ指示 1件')).toBeVisible({ timeout: 30_000 });
  await page.getByLabel('鼻歌を入れる小節数').selectOption('1');
  await expect(page.getByLabel('鼻歌を入れる小節数')).toHaveValue('1');
  await page.getByRole('button', { name: '鼻歌を録音' }).click();
  await expect(page.getByText('録音中', { exact: true })).toBeVisible();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: '鼻歌の録音を停止' }).click();
  await expect(page.getByText('Take 01')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Microphone permission was denied/)).toHaveCount(0);
});

test('downmixes a stereo humming file and applies bundled Basic Pitch notes', async ({ page }) => {
  await mockHomeAi(page);
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: '新しい曲' }).click();
  await page.getByRole('textbox', { name: '曲の名前' }).fill('Basic Pitch Melody');
  await page.getByRole('radio', { name: /鼻歌から一曲/ }).check();
  await page.getByRole('button', { name: '鼻歌から始める' }).click();
  await page.locator('.humming-recorder input[type="file"]').setInputFiles({ name: 'humming.wav', mimeType: 'audio/wav', buffer: createHummingWave() });
  await expect(page.getByText(/個の音符をMelodyへ適用しました/)).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('.humming-takes article[data-selected="true"]')).toContainText(/notes/);
  await expect(page.getByText('Melodyに使用中')).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
