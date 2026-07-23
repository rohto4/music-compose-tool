import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

async function createPatternProject(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: '新しい曲' }).click();
  await page.getByText('パッチボードで組む', { exact: true }).click();
  await page.getByRole('textbox', { name: '曲の名前' }).fill('Pattern Journey');
  await page.getByRole('button', { name: 'パッチボードで始める' }).click();
  await page.getByRole('button', { name: '展開を整える' }).click();
}

test('共有挿入先を保ったまま5つのINSERT SOURCEを切り替え、伴奏推薦を確認できる', async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await createPatternProject(page);
  const insertTarget = page.getByRole('navigation', { name: '4小節の挿入先' });
  const sourceTabs = page.getByRole('navigation', { name: '展開を整える機能' });
  await expect(insertTarget.getByRole('button')).toHaveCount(4);
  await expect(sourceTabs.getByRole('button')).toHaveCount(5);
  await expect(sourceTabs.getByRole('button', { name: 'コード・音色' })).toHaveAttribute('aria-current', 'page');

  await sourceTabs.getByRole('button', { name: 'コードセット' }).click();
  await expect(page.locator('.progression-template-browser')).toBeVisible();
  await expect(insertTarget).toBeVisible();

  await sourceTabs.getByRole('button', { name: '伴奏' }).click();
  await expect(page.locator('.phrase-kit-card')).toHaveCount(6);
  await expect(page.locator('.phrase-kit-card[data-recommended="true"]')).toHaveCount(2);
  expect(await page.locator('.phrase-kit-card[data-recommended="true"] .phrase-kit-fit').evaluateAll((items) => items.every((item) => Boolean(item.textContent?.trim())))).toBe(true);
  await page.locator('.phrase-kit-browser').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/imp/evidence/flow-recommendations-wqhd-2026-07-24.png', fullPage: false });

  await sourceTabs.getByRole('button', { name: 'FX・Fill' }).click();
  await expect(page.locator('.sound-block-card')).toHaveCount(24);
  await sourceTabs.getByRole('button', { name: '音色割当' }).click();
  await expect(page.locator('.audio-palette')).toBeVisible();
  await expect(page.locator('.asset-category-filter button')).toHaveCount(10);
  await expect(page.locator('.asset-category-filter').getByRole('button', { name: /^ALL/ })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
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
  await expect(page.getByText('コードを鳴らす音色 · 60')).toBeVisible();
  await expect(page.locator('.chord-pad')).toHaveCount(46);
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
  expect(desktopLayout.scoreRows).toBe(2);
  expect(desktopLayout.scorePhrases).toBe(4);
  expect(desktopLayout.rolePatterns).toBe(42);
  expect(desktopLayout.soundBlocks).toBe(24);
  expect(desktopLayout.insertableCount).toBe(desktopLayout.draggableInsertableCount);
  await page.getByRole('button', { name: 'コードセット' }).click();
  const phraseTwo = page.locator('.progression-phrase[data-phrase="2"]');
  const phraseTwoDock = page.getByRole('button', { name: 'フレーズ2を挿入先にする' });
  await page.locator('.progression-template-card').filter({ hasText: 'Pop Axis' }).dragTo(phraseTwoDock);
  await expect(phraseTwo).toContainText('Bm');
  await expect(page.locator('.pattern-status')).toContainText('Pop Axis（I–V–vi–IV）をPHRASE 2へ追加');
  await page.getByRole('button', { name: 'FX・Fill' }).click();
  await page.locator('.sound-block-card').filter({ hasText: 'シュワーーー → ドン' }).dragTo(page.getByRole('button', { name: 'フレーズ3を挿入先にする' }));
  await expect(page.locator('.pattern-status')).toContainText('シュワーーー → ドンをPHRASE 3へ挿入');
  await page.locator('.sound-block-shelf').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/imp/evidence/insertable-compound-fx-wqhd-dark-2026-07-23.png', fullPage: false });
  await page.getByRole('button', { name: '音色割当' }).click();
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
  await page.getByRole('button', { name: 'コード・音色' }).click();
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
  const firstDuration = firstPhrase.getByRole('group', { name: 'フレーズ1 1番目のコードの長さ' });
  const beforeBeats = Number((await firstDuration.locator('strong').innerText()).replace('拍', ''));
  await firstDuration.getByRole('button', { name: 'フレーズ1 1番目のコードを8分音符ぶん長くする' }).click();
  const afterBeats = Number((await firstDuration.locator('strong').innerText()).replace('拍', ''));
  expect(afterBeats - beforeBeats).toBe(.5);
  const homeChord = page.getByRole('button', { name: /D I home 基本/ });
  await homeChord.hover();
  await page.mouse.down();
  await expect(homeChord).toHaveAttribute('data-holding', 'true');
  await page.waitForTimeout(80);
  await page.mouse.up();
  await expect(homeChord).toHaveAttribute('data-holding', 'false');
  await expect(page.locator('.pattern-status')).toContainText(`BAR 1–4 / STEP 1へ D / ${afterBeats}拍 / PULSE`);

  await firstPhrase.getByRole('group', { name: 'フレーズ1 2番目のコードの長さ' }).getByRole('button', { name: 'フレーズ1 2番目のコードを8分音符ぶん長くする' }).click();
  await page.getByRole('button', { name: /Gm iv 切なさ 意外/ }).click();
  await expect(firstPhrase.locator('.pattern-slot[data-auto="true"]')).toContainText('AUTO');
  await firstPhrase.getByRole('button', { name: '8コード' }).click();
  await expect(firstPhrase.locator('.pattern-slot')).toHaveCount(8);
  await page.getByRole('button', { name: /F# V\/vi 意外な推進 意外/ }).click();
  await expect(firstPhrase.locator('.pattern-slot[data-filled="true"]')).toHaveCount(3);
  await expect(firstPhrase.locator('.pattern-slot-select[aria-pressed="true"]')).toContainText('04');
  await expect(page.locator('.voice-readout')).toContainText('Glass Pluck');
  await expect(page.locator('.voice-keys button[aria-pressed="true"]')).toContainText('Glass Pluck');

  await page.getByRole('button', { name: '伴奏', exact: true }).click();
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
  await page.getByRole('button', { name: 'コード・音色' }).click();
  await page.getByRole('button', { name: /A7 V7 強い期待 彩り/ }).click();
  await page.getByRole('button', { name: '伴奏', exact: true }).click();
  await expect(rolePatternBrowser.locator('.role-pattern-card[data-applied="true"]')).toHaveCount(3);

  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('.save-state')).toContainText('保存済み');
  await page.reload();
  await page.getByRole('button', { name: '続きから' }).click();
  await page.getByRole('button', { name: '展開を整える' }).click();
  await page.getByRole('button', { name: '伴奏', exact: true }).click();
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
  await expect(page.getByRole('navigation', { name: '4小節の挿入先' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: '展開を整える機能' }).getByRole('button')).toHaveCount(5);
  await page.getByRole('button', { name: 'コード・音色' }).click();
  await page.locator('.harmonic-map').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/imp/evidence/chord-pad-mobile-2026-07-23.png', fullPage: false });
  await page.locator('.progression-deck').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/imp/evidence/chord-score-mobile-2026-07-23.png', fullPage: false });
  await page.getByRole('button', { name: '伴奏', exact: true }).click();
  await page.locator('.role-pattern-browser').evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await expect(page.locator('.role-pattern-card')).toHaveCount(42);
  expect(await page.locator('.role-pattern-browser').evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'docs/imp/evidence/role-pattern-browser-mobile-2026-07-23.png', fullPage: false });

  await page.getByRole('button', { name: 'コード・音色' }).click();
  await page.getByRole('button', { name: '＋ 4小節' }).click();
  await expect(page.locator('.progression-phrase')).toHaveCount(5);
  await expect(page.locator('.progression-score-row')).toHaveCount(3);
  expect(errors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
