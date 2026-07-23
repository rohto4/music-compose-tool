import { expect, test } from '@playwright/test';

async function createProject(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: '新しい曲' }).click();
  await page.getByRole('textbox', { name: '曲の名前' }).fill('Refinement Proof');
  await page.getByText('パッチボードで組む', { exact: true }).click();
  await page.getByRole('button', { name: 'パッチボードから始める' }).click();
}

test('既製曲・任意phrase・横断展開・カスタマイズ再生を同じProjectで扱う', async ({ page }) => {
  await page.setViewportSize({ width: 1648, height: 944 });
  await createProject(page);

  await expect(page.locator('.song-starter-browser article')).toHaveCount(6);
  await page.getByRole('button', { name: 'この曲を編集する' }).nth(1).click();
  await expect(page.locator('.workspace-project')).toContainText('D major · 116 BPM');
  await expect(page.getByRole('button', { name: '編集中' })).toBeDisabled();
  await page.getByRole('button', { name: '設定', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'ショートカット設定' })).toBeVisible();
  await page.getByRole('button', { name: 'ショートカット設定を閉じる' }).click();

  await page.getByRole('button', { name: '音を組む' }).click();
  const quickRail = page.locator('.quick-arrangement-rail');
  await expect(quickRail.locator('article')).toHaveCount(2);
  await quickRail.locator('aside > button').click();
  await quickRail.getByRole('button', { name: 'Bridge', exact: true }).click();
  await expect(quickRail.locator('article')).toHaveCount(3);

  await page.getByLabel('コード進行テンプレートの適用先').selectOption('2');
  await page.getByRole('button', { name: 'Pop Axisをフレーズ3へ追加' }).click();
  await expect(page.locator('.progression-phrase[data-phrase="3"]')).toContainText('D');
  await page.getByLabel('曲全体のキー（コード譜）').selectOption('A major');
  await expect(page.locator('.progression-phrase[data-phrase="3"]')).toContainText('F#m');
  await expect(page.locator('.phrase-kit-card')).toHaveCount(6);
  await expect(page.locator('.role-pattern-card')).toHaveCount(42);
  await page.getByRole('button', { name: 'Prism Dropをフレーズ3へ挿入' }).click();
  await expect(page.locator('.pattern-status')).toContainText('Prism DropをPHRASE 3へ挿入');

  await page.getByRole('button', { name: '展開を整える' }).click();
  await expect(page.locator('.arrangement-section-card')).toHaveCount(3);
  await expect(page.locator('.arrangement-add-card')).toBeVisible();

  await page.getByRole('button', { name: /^カスタマイズ/ }).click();
  await expect(page.locator('.sound-chunk-shelf')).toBeVisible();
  await page.getByLabel('挿入する音の塊').selectOption('harp-gliss');
  await page.getByRole('button', { name: '塊を試聴' }).click();
  await expect(page.locator('.transport-status')).toContainText('音の塊を試聴');
  await page.getByRole('button', { name: /BAR 1へ挿入/ }).click();
  await expect(page.locator('.daw-operation-status')).toContainText('シャラララン HarpをBAR 1へ挿入');
  await page.getByLabel('選択音符', { exact: true }).selectOption({ index: 1 });
  await page.getByRole('button', { name: '選択音を塊として保存' }).click();
  const savedChunk = page.locator('.sound-chunk-shelf optgroup[label="PROJECT SAVED"] option');
  await expect(savedChunk).toHaveCount(1);
  await page.getByLabel('挿入する音の塊').selectOption(await savedChunk.getAttribute('value') ?? '');
  await page.getByRole('button', { name: /BAR 1へ挿入/ }).click();
  await expect(page.locator('.daw-operation-status')).toContainText('1音をBAR 1へ挿入');
  await page.getByRole('button', { name: '編集中の曲を再生' }).click();
  await expect(page.getByRole('button', { name: '編集中の曲を停止' })).toBeVisible();
  await page.getByRole('button', { name: '編集中の曲を停止' }).click();
  await page.getByRole('button', { name: /を単体試聴$/ }).first().click();
  await expect(page.locator('.transport-status')).toContainText('単体試聴');

  const mixerOverflow = await page.locator('.mixer-strip article').evaluateAll((cards) => cards.map((card) => ({ overflowX: card.scrollWidth - card.clientWidth, width: card.clientWidth })));
  expect(mixerOverflow.length).toBeGreaterThan(8);
  expect(mixerOverflow.every((card) => card.overflowX <= 0 && card.width >= 150)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'docs/imp/evidence/customize-daw-1648-friendly-2026-07-23.png', fullPage: false });
  await page.setViewportSize({ width: 2560, height: 1440 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'docs/imp/evidence/autonomous-quality-wqhd-2026-07-23.png', fullPage: false });
});

test('375pxで設定・伴奏フレーズ・Sound Chunkを横はみ出しなく操作する', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await createProject(page);
  await page.getByRole('button', { name: '設定', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'ショートカット設定' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'ショートカット設定を閉じる' }).click();
  await page.getByRole('button', { name: '音を組む' }).click();
  await expect(page.locator('.phrase-kit-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Candy Verseをフレーズ1へ挿入' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: /^カスタマイズ/ }).click();
  await expect(page.locator('.sound-chunk-shelf')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.locator('.sound-chunk-shelf').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/imp/evidence/autonomous-quality-mobile-2026-07-23.png', fullPage: false });
});
