import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('AI Starterから多数音色を試し、同じMIDI譜面へ進める', async ({ page }) => {
  const errors: string[] = [];
  const failures: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => failures.push(`${request.url()} ${request.failure()?.errorText ?? ''}`));

  await page.goto('/');
  await page.getByRole('button', { name: '新しい曲' }).click();
  await page.getByRole('radio', { name: /AIで土台/ }).check();
  await page.getByRole('textbox', { name: '曲の名前' }).fill('AI Starter Journey');
  await expect(page.getByRole('radio', { name: /AIで土台/ })).toBeChecked();
  await page.screenshot({ path: 'docs/imp/evidence/ai-starter-home-desktop-2026-07-22.png', fullPage: false });
  await page.getByRole('button', { name: 'AIで土台を作る' }).click();
  await expect(page.getByText(/AI Starterの音を、コード・ベース・ドラム等のtrack別に保持/)).toBeVisible();

  await page.getByRole('button', { name: '展開を整える' }).click();
  await expect(page.getByText('AI Starterの土台を編集中')).toBeVisible();
  await expect(page.getByText('コードを鳴らす音色 · 60')).toBeVisible();
  await expect(page.locator('.voice-family-tabs button')).toHaveCount(6);
  await expect(page.locator('.chord-pad')).toHaveCount(46);
  await page.getByRole('button', { name: /Hyper Prism Saw/ }).click();
  await expect(page.locator('.voice-keys button[aria-pressed="true"]')).toContainText('Hyper Prism Saw');
  await page.getByRole('button', { name: '音色割当' }).click();
  await page.locator('.asset-category-filter').getByRole('button', { name: /^PAD 11$/ }).click();
  await expect(page.locator('.asset-card')).toHaveCount(11);
  await expect(page.getByText('Frozen Glass')).toBeVisible();
  await page.getByText('Frozen Glass').hover();
  await page.screenshot({ path: 'docs/imp/evidence/ai-starter-timbre-bank-desktop-2026-07-22.png', fullPage: false });

  await page.getByRole('button', { name: 'MIDI譜面を編集' }).click();
  await expect(page.getByRole('heading', { name: 'Melody', level: 2 })).toBeVisible();
  await page.getByLabel('編集トラック', { exact: true }).selectOption('track-chord');
  await expect(page.getByRole('heading', { name: 'Chords', level: 2 })).toBeVisible();
  await expect(page.locator('.daw-edit-target')).toContainText('Main');
  await expect(page.getByRole('slider', { name: '再生位置' })).toBeVisible();
  await expect(page.getByRole('region', { name: '音程範囲。マウスホイールで上下にスクロール' })).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'MIDI', exact: true }).click();
  const path = await (await download).path();
  if (!path) throw new Error('MIDI download path is unavailable.');
  expect((await readFile(path)).subarray(0, 4).toString('ascii')).toBe('MThd');

  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'docs/imp/evidence/ai-starter-midi-mobile-2026-07-22.png', fullPage: false });
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
});
