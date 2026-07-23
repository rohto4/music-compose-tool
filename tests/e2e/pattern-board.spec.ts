import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

async function createPatternProject(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: '新しい曲' }).click();
  await page.getByRole('textbox', { name: '曲の名前' }).fill('Pattern Journey');
  await page.getByText('パッチボードで組む', { exact: true }).click();
  await page.getByLabel('長さ').selectOption('60');
  await page.getByRole('button', { name: 'パッチボードから始める' }).click();
  await page.getByRole('button', { name: '音を組む' }).click();
}

test('音を組むの初期配置を保ち、セクション単位で上へ移動して端末へ保存できる', async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await createPatternProject(page);
  const score = page.locator('[data-pattern-section="score"]');
  const atlas = page.locator('[data-pattern-section="atlas"]');
  const voices = page.locator('[data-pattern-section="voices"]');
  const fx = page.locator('[data-pattern-section="sound-blocks"]');
  await expect(score).toHaveCSS('order', '1');
  await expect(atlas).toHaveCSS('order', '2');
  await expect(fx).toHaveCSS('order', '6');

  await page.getByRole('button', { name: '音色と演奏形セクションをドラッグして並べ替え' }).dragTo(atlas.locator('header'));
  await expect(voices).toHaveCSS('order', '2');
  await expect(atlas).toHaveCSS('order', '3');
  const moved = await page.evaluate(() => {
    const voiceRect = document.querySelector<HTMLElement>('[data-pattern-section="voices"]')?.getBoundingClientRect();
    const atlasRect = document.querySelector<HTMLElement>('[data-pattern-section="atlas"]')?.getBoundingClientRect();
    return {
      voiceTop: voiceRect?.top ?? Infinity,
      atlasTop: atlasRect?.top ?? -Infinity,
      order: JSON.parse(localStorage.getItem('patchtone.pattern-board.section-order.v1') ?? 'null') as string[] | null,
    };
  });
  expect(moved.voiceTop).toBeLessThan(moved.atlasTop);
  expect(moved.order?.slice(0, 3)).toEqual(['score', 'voices', 'atlas']);
  await voices.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/imp/evidence/pattern-section-reordered-wqhd-dark-2026-07-23.png', fullPage: false });

  await page.reload();
  await createPatternProject(page);
  await expect(page.locator('[data-pattern-section="voices"]')).toHaveCSS('order', '2');
  await page.getByRole('button', { name: '初期配置' }).click();
  await expect(page.locator('[data-pattern-section="score"]')).toHaveCSS('order', '1');
  await expect(page.locator('[data-pattern-section="atlas"]')).toHaveCSS('order', '2');
  await expect(page.locator('[data-pattern-section="sound-blocks"]')).toHaveCSS('order', '6');
});

test('選択中の音色でコードを長押し演奏し、複数phraseをABCとMIDIへ持ち出せる', async ({ page, context }) => {
  const errors: string[] = [];
  const failedRequests: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText ?? ''}`));

  await page.setViewportSize({ width: 2560, height: 1440 });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await createPatternProject(page);
  await expect(page.getByRole('region', { name: 'コード譜を編集' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Harmonic Atlas · D major' })).toBeVisible();
  await expect(page.getByText('LIVE VOICE · 60')).toBeVisible();
  await expect(page.locator('.chord-pad')).toHaveCount(14);
  await expect(page.locator('.sound-block-card')).toHaveCount(24);
  await expect(page.locator('.role-pattern-card')).toHaveCount(42);
  await expect(page.locator('.progression-phrase')).toHaveCount(4);
  await expect(page.locator('.progression-score-row')).toHaveCount(2);
  const desktopLayout = await page.evaluate(() => {
    const board = document.querySelector<HTMLElement>('.chord-pattern-board');
    const map = document.querySelector<HTMLElement>('.harmonic-map');
    const score = document.querySelector<HTMLElement>('.progression-deck');
    const sourceShelf = document.querySelector<HTMLElement>('.progression-template-browser');
    const firstPad = document.querySelector<HTMLElement>('.chord-pad');
    const lastPad = document.querySelectorAll<HTMLElement>('.chord-pad').item(13);
    const tokens = getComputedStyle(document.documentElement);
    const rect = (element: HTMLElement | null) => element ? {
      top: Math.round(element.getBoundingClientRect().top),
      right: Math.round(element.getBoundingClientRect().right),
      bottom: Math.round(element.getBoundingClientRect().bottom),
      left: Math.round(element.getBoundingClientRect().left),
      width: Math.round(element.getBoundingClientRect().width),
      height: Math.round(element.getBoundingClientRect().height),
    } : null;
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentOverflowX: document.documentElement.scrollWidth - window.innerWidth,
      board: rect(board),
      harmonicMap: rect(map),
      score: rect(score),
      sourceShelf: rect(sourceShelf),
      firstPad: rect(firstPad),
      lastPad: rect(lastPad),
      chordPads: document.querySelectorAll('.chord-pad').length,
      scoreRows: document.querySelectorAll('.progression-score-row').length,
      scorePhrases: document.querySelectorAll('.progression-phrase').length,
      rolePatterns: document.querySelectorAll('.role-pattern-card').length,
      voiceSelectors: document.querySelectorAll('.voice-keys button').length,
      voiceFamilies: document.querySelectorAll('.voice-family-tabs button').length,
      soundBlocks: document.querySelectorAll('.sound-block-card').length,
      insertableCount: document.querySelectorAll('[data-insertable="true"]').length,
      draggableInsertableCount: [...document.querySelectorAll<HTMLElement>('[data-insertable="true"]')].filter((element) => element.draggable).length,
      surface: {
        paper: tokens.getPropertyValue('--color-paper').trim(),
        paper2: tokens.getPropertyValue('--color-paper-2').trim(),
        editor: tokens.getPropertyValue('--color-editor-black').trim(),
      },
    };
  });
  expect(desktopLayout.documentOverflowX).toBeLessThanOrEqual(0);
  expect(desktopLayout.harmonicMap?.right ?? Infinity).toBeLessThanOrEqual(desktopLayout.viewport.width);
  expect(desktopLayout.score?.top ?? Infinity).toBeLessThan(desktopLayout.harmonicMap?.top ?? -Infinity);
  expect(desktopLayout.harmonicMap?.top ?? Infinity).toBeLessThan(desktopLayout.sourceShelf?.top ?? -Infinity);
  expect(desktopLayout.scoreRows).toBe(2);
  expect(desktopLayout.scorePhrases).toBe(4);
  expect(desktopLayout.rolePatterns).toBe(42);
  expect(desktopLayout.soundBlocks).toBe(24);
  expect(desktopLayout.insertableCount).toBe(desktopLayout.draggableInsertableCount);
  const phraseTwo = page.locator('.progression-phrase[data-phrase="2"]');
  const phraseTwoDock = page.getByRole('button', { name: 'フレーズ2を挿入先にする' });
  await page.locator('.progression-template-card').filter({ hasText: 'Pop Axis' }).dragTo(phraseTwoDock);
  await expect(phraseTwo).toContainText('Bm');
  await expect(page.locator('.pattern-status')).toContainText('Pop Axis（I–V–vi–IV）をPHRASE 2へ追加');
  await page.locator('.sound-block-card').filter({ hasText: 'シュワーーー → ドン' }).dragTo(page.getByRole('button', { name: 'フレーズ3を挿入先にする' }));
  await expect(page.locator('.pattern-status')).toContainText('シュワーーー → ドンをPHRASE 3へ挿入');
  await page.locator('.sound-block-shelf').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/imp/evidence/insertable-compound-fx-wqhd-dark-2026-07-23.png', fullPage: false });
  const fxTab = page.getByRole('button', { name: /^FX\s+24$/ });
  await page.locator('.audio-palette').scrollIntoViewIfNeeded();
  await fxTab.click();
  const categoryLink = await page.evaluate(() => {
    const tab = document.querySelector<HTMLElement>('.asset-category-filter button[aria-current="page"]');
    const grid = document.querySelector<HTMLElement>('.asset-grid');
    return {
      active: tab?.textContent?.trim() ?? '',
      tabToken: tab ? getComputedStyle(tab).getPropertyValue('--tab-color').trim() : '',
      gridToken: grid ? getComputedStyle(grid).getPropertyValue('--category-color').trim() : '',
      tabColor: tab ? getComputedStyle(tab).borderBottomColor : '',
      gridColor: grid ? getComputedStyle(grid).borderTopColor : '',
      tabStyle: tab ? getComputedStyle(tab).borderBottomStyle : '',
      gridStyle: grid ? getComputedStyle(grid).borderTopStyle : '',
    };
  });
  expect(categoryLink.active).toMatch(/^FX/);
  expect(categoryLink.tabToken).toBe(categoryLink.gridToken);
  expect(categoryLink.tabStyle).toBe('solid');
  expect(categoryLink.gridStyle).toBe('solid');
  await expect.poll(() => fxTab.evaluate((element) => getComputedStyle(element).borderBottomColor)).not.toBe('rgba(0, 0, 0, 0)');
  await expect.poll(() => page.locator('.asset-grid').evaluate((element) => getComputedStyle(element).borderTopColor)).not.toBe('rgb(241, 204, 84)');
  await page.screenshot({ path: 'docs/imp/evidence/audio-palette-fx-wqhd-dark-2026-07-23.png', fullPage: false });
  await page.getByRole('button', { name: 'フレーズ1を挿入先にする' }).click();
  await page.locator('.progression-deck').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/imp/evidence/chord-score-wqhd-dark-2026-07-23.png', fullPage: false });
  await page.locator('.harmonic-map').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/imp/evidence/harmonic-atlas-wqhd-dark-2026-07-23.png', fullPage: false });
  await writeFile('docs/imp/evidence/chord-score-layout-2026-07-23.json', `${JSON.stringify(desktopLayout, null, 2)}\n`, 'utf8');
  await page.locator('.voice-family-tabs').getByRole('button', { name: /^SYNTH\s*12$/ }).click();
  await page.getByRole('button', { name: /Glass Pluck 短く光る/ }).click();
  await page.getByRole('button', { name: /^PULSE/ }).click();
  await expect(page.getByRole('region', { name: 'コード譜を編集' })).toBeVisible();
  const firstPhrase = page.locator('.progression-phrase[data-phrase="1"]');
  await expect(firstPhrase.getByLabel('フレーズ1の4小節位置').locator('span')).toHaveCount(4);
  await firstPhrase.getByLabel('フレーズ1 1番目のコードの拍数').selectOption('1.5');
  const homeChord = page.getByRole('button', { name: /D I home 基本/ });
  await homeChord.hover();
  await page.mouse.down();
  await expect(homeChord).toHaveAttribute('data-holding', 'true');
  await page.waitForTimeout(80);
  await page.mouse.up();
  await expect(homeChord).toHaveAttribute('data-holding', 'false');
  await expect(page.locator('.pattern-status')).toContainText('BAR 1–4 / STEP 1へ D / 1.5拍 / PULSE');

  await firstPhrase.getByLabel('フレーズ1 2番目のコードの拍数').selectOption('3');
  await page.getByRole('button', { name: /Gm iv 切なさ 意外/ }).click();
  await expect(firstPhrase.locator('.pattern-slot[data-auto="true"]')).toContainText('7.5拍');
  await firstPhrase.getByRole('button', { name: '8 CHORDS' }).click();
  await expect(firstPhrase.locator('.pattern-slot[data-auto="true"]')).toContainText('2拍');
  await page.getByRole('button', { name: /F# V\/vi 意外な推進 意外/ }).click();
  await expect(firstPhrase.locator('.pattern-slot[data-filled="true"]')).toHaveCount(3);
  await expect(firstPhrase.locator('.pattern-slot-select[aria-pressed="true"]')).toContainText('04');
  await expect(page.locator('.voice-readout')).toContainText('Glass Pluck');
  await expect(page.locator('.voice-keys button[aria-pressed="true"]')).toContainText('Glass Pluck');

  const rolePatternBrowser = page.locator('.role-pattern-browser');
  await rolePatternBrowser.scrollIntoViewIfNeeded();
  await expect(page.getByRole('region', { name: 'Bass / Arp / Drum パターンを挿入' })).toBeVisible();
  await page.getByRole('button', { name: 'Quarter Pumpをフレーズ1で試聴' }).click();
  await expect(page.locator('.pattern-status')).toContainText('Quarter PumpをPHRASE 1のコードで試聴中です');
  await page.getByRole('button', { name: 'Quarter Pumpをフレーズ1へ適用' }).click();
  await page.getByRole('button', { name: 'Rising Eighthsをフレーズ1へ適用' }).click();
  await page.getByRole('button', { name: 'Future Half-timeをフレーズ1へ適用' }).click();
  await expect(rolePatternBrowser.locator('.role-pattern-card[data-applied="true"]')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Quarter Pumpをフレーズ1へ適用' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.pattern-status')).toContainText('Future Half-timeをPHRASE 1のDRUMへ適用しました');
  await page.screenshot({ path: 'docs/imp/evidence/role-pattern-applied-wqhd-dark-2026-07-23.png', fullPage: false });

  await page.getByRole('button', { name: '元に戻す' }).click();
  await expect(rolePatternBrowser.locator('.role-pattern-card[data-applied="true"]')).toHaveCount(2);
  await page.getByRole('button', { name: 'やり直す' }).click();
  await expect(rolePatternBrowser.locator('.role-pattern-card[data-applied="true"]')).toHaveCount(3);
  await page.getByRole('button', { name: /A7 V7 強い期待 彩り/ }).click();
  await expect(rolePatternBrowser.locator('.role-pattern-card[data-applied="true"]')).toHaveCount(3);

  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('.save-state')).toContainText('保存済み');
  await page.reload();
  await page.getByRole('button', { name: '続きから' }).click();
  await page.getByRole('button', { name: '音を組む' }).click();
  await expect(page.locator('.role-pattern-card')).toHaveCount(42);
  await expect(page.locator('.role-pattern-card[data-applied="true"]')).toHaveCount(3);

  await page.locator('.creative-brief-panel[data-scope="chords"]').getByRole('button', { name: 'コード譜をコピー' }).click();
  await expect(page.locator('.creative-brief-panel[data-scope="chords"]')).toContainText('Instrumental Promptをコピーしました');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Instrumental only. No vocals');
  const abcDownload = page.waitForEvent('download');
  await page.locator('.creative-brief-panel[data-scope="chords"]').getByRole('button', { name: 'ABC譜' }).click();
  const abcPath = await (await abcDownload).path();
  if (!abcPath) throw new Error('ABC download path is unavailable.');
  const abc = await readFile(abcPath, 'utf8');
  expect(abc).toContain('M:4/4');
  expect(abc).toContain('L:1/8');
  expect(abc).toContain('Instrumental only');

  const midiDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'MIDI', exact: true }).click();
  const midiPath = await (await midiDownload).path();
  if (!midiPath) throw new Error('MIDI download path is unavailable.');
  expect((await readFile(midiPath)).subarray(0, 4).toString('ascii')).toBe('MThd');

  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator('.chord-pattern-board').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await expect(page.locator('.chord-pattern-board button').filter({ hasNotText: /./ })).toHaveCount(0);
  const mobileOrder = await page.evaluate(() => {
    const map = document.querySelector('.harmonic-map')?.getBoundingClientRect();
    const score = document.querySelector('.progression-deck')?.getBoundingClientRect();
    const source = document.querySelector('.progression-template-browser')?.getBoundingClientRect();
    return { mapTop: map?.top ?? Infinity, scoreTop: score?.top ?? -Infinity, sourceTop: source?.top ?? -Infinity, phrases: document.querySelectorAll('.progression-phrase').length };
  });
  expect(mobileOrder.scoreTop).toBeLessThan(mobileOrder.mapTop);
  expect(mobileOrder.mapTop).toBeLessThan(mobileOrder.sourceTop);
  expect(mobileOrder.phrases).toBe(4);
  await page.locator('.harmonic-map').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/imp/evidence/chord-pad-mobile-2026-07-23.png', fullPage: false });
  await page.locator('.progression-deck').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/imp/evidence/chord-score-mobile-2026-07-23.png', fullPage: false });
  await page.locator('.role-pattern-browser').evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await expect(page.locator('.role-pattern-card')).toHaveCount(42);
  expect(await page.locator('.role-pattern-browser').evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'docs/imp/evidence/role-pattern-browser-mobile-2026-07-23.png', fullPage: false });

  await page.getByRole('button', { name: '＋ 4小節' }).click();
  await expect(page.locator('.progression-phrase')).toHaveCount(5);
  await expect(page.locator('.progression-score-row')).toHaveCount(3);
  expect(errors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
