import { expect, test } from '@playwright/test';

async function createProject(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: '新しい曲' }).click();
  await page.getByText('パッチボードで組む', { exact: true }).click();
  await page.getByRole('textbox', { name: '曲の名前' }).fill('Refinement Proof');
  await page.waitForTimeout(450);
  if (await page.evaluate(() => innerWidth <= 375)) {
    await page.screenshot({ path: 'docs/imp/evidence/project-home-route-mobile-2026-07-24.png', fullPage: false });
  }
  await page.getByRole('button', { name: 'パッチボードで始める' }).click();
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

  const quickRail = page.locator('.quick-arrangement-rail');
  await expect(quickRail.locator('article')).toHaveCount(2);
  await quickRail.locator('aside > button').click();
  await quickRail.getByRole('button', { name: 'Bridge', exact: true }).click();
  await expect(quickRail.locator('article')).toHaveCount(3);

  await page.getByRole('button', { name: '展開を整える' }).click();
  await page.getByRole('button', { name: 'コードセット' }).click();
  await page.getByLabel('コード進行テンプレートの適用先').selectOption('2');
  await page.getByRole('button', { name: 'Pop Axisをフレーズ3へ追加' }).click();
  await expect(page.locator('.progression-phrase[data-phrase="3"]')).toContainText('D');
  await page.getByLabel('曲全体のキー（コード譜）').selectOption('A major');
  await expect(page.locator('.progression-phrase[data-phrase="3"]')).toContainText('F#m');
  await page.getByRole('button', { name: '伴奏', exact: true }).click();
  await expect(page.locator('.phrase-kit-card')).toHaveCount(6);
  await expect(page.locator('.role-pattern-card')).toHaveCount(42);
  await page.getByRole('button', { name: 'Prism Dropをフレーズ3へ挿入' }).click();
  await expect(page.locator('.pattern-status')).toContainText('Prism DropをPHRASE 3へ挿入');

  await page.getByRole('button', { name: 'FX・Fill' }).click();
  const harpChunk = page.locator('.sound-block-card').filter({ hasText: 'シャラララン Harp' });
  await harpChunk.getByRole('button', { name: 'シャラララン Harpを試聴' }).click();
  await expect(page.locator('.transport-status')).toContainText('音の塊を試聴: シャラララン Harp');
  await harpChunk.getByRole('button', { name: 'シャラララン Harpをフレーズ3へ挿入' }).click();
  await expect(page.locator('.pattern-status')).toContainText('シャラララン HarpをPHRASE 3へ挿入');
  await page.getByRole('button', { name: '詳細の編集' }).click();
  await expect(page.getByRole('region', { name: '音程範囲。マウスホイールで上下にスクロール' })).toBeVisible();
  await expect(page.getByRole('slider', { name: '再生位置' })).toBeVisible();
  await page.getByRole('button', { name: /BAR 1.*から曲全体を再生/ }).click();
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
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await page.getByRole('button', { name: '曲の一覧' }).click();
  const previewPosition = page.getByRole('slider', { name: 'Refinement Proofの再生位置' });
  await page.getByRole('button', { name: 'Refinement Proofを30秒進める' }).click();
  expect(Number(await previewPosition.inputValue())).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Refinement Proofを再生' }).click();
  await expect(page.getByRole('button', { name: 'Refinement Proofを停止' })).toBeVisible();
  await page.getByRole('button', { name: 'Refinement Proofを停止' }).click();
  await expect(page.getByRole('button', { name: 'Projectを読み込む' })).toContainText('.mctproj 専用');
  await page.screenshot({ path: 'docs/imp/evidence/project-home-preview-wqhd-2026-07-24.png', fullPage: false });
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'docs/imp/evidence/project-home-preview-mobile-2026-07-24.png', fullPage: false });
});

test('375pxで設定・伴奏フレーズ・FX Fillを横はみ出しなく操作する', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await createProject(page);
  await page.getByRole('button', { name: '設定', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'ショートカット設定' })).toBeVisible();
  const saveShortcut = page.getByRole('button', { name: '保存のキー割り当て' });
  await expect(saveShortcut).toHaveText('Ctrl + S');
  await saveShortcut.click();
  await expect(saveShortcut).toHaveText('キーを入力…');
  await saveShortcut.click();
  await expect(saveShortcut).toHaveText('Ctrl + S');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'ショートカット設定を閉じる' }).click();
  await page.getByRole('button', { name: '展開を整える' }).click();
  await page.getByRole('button', { name: '伴奏', exact: true }).click();
  await expect(page.locator('.phrase-kit-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Candy Verseをフレーズ1へ挿入' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'FX・Fill' }).click();
  await expect(page.locator('.sound-block-shelf')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.locator('.sound-block-shelf').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/imp/evidence/autonomous-quality-mobile-2026-07-24.png', fullPage: false });
});
