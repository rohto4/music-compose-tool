import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

type ThemeId = 'dark-pastel' | 'vanilla-pastel' | 'friendly-signal';

const THEMES: Array<{ id: ThemeId; slug: string }> = [
  { id: 'dark-pastel', slug: 'dark' },
  { id: 'vanilla-pastel', slug: 'vanilla' },
  { id: 'friendly-signal', slug: 'friendly' },
];

async function createVisualProject(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: '新しい曲' }).click();
  await page.getByText('パッチボードで組む', { exact: true }).click();
  await page.getByRole('textbox', { name: '曲の名前' }).fill('Visual Quality');
  await page.getByRole('button', { name: 'パッチボードで始める' }).click();
}

async function layoutMetrics(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const rect = (selector: string) => {
      const value = document.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
      return value ? { x: Math.round(value.x), y: Math.round(value.y), width: Math.round(value.width), height: Math.round(value.height) } : null;
    };
    const chordWidths = [...document.querySelectorAll<HTMLElement>('.chord-pad')].map((element) => element.getBoundingClientRect().width);
    return {
      viewport: { width: innerWidth, height: innerHeight },
      overflowX: document.documentElement.scrollWidth - innerWidth,
      board: rect('.chord-pattern-board'),
      score: rect('.progression-deck'),
      atlas: rect('.harmonic-map'),
      prompt: rect('.creative-brief-panel[data-scope="chords"]'),
      rolePatterns: rect('.role-pattern-browser'),
      phraseCount: document.querySelectorAll('.progression-phrase').length,
      chordCount: chordWidths.length,
      rolePatternCount: document.querySelectorAll('.role-pattern-card').length,
      minChordWidth: Math.round(Math.min(...chordWidths)),
      atlasOverflowX: (() => {
        const element = document.querySelector<HTMLElement>('.harmonic-map-scroll');
        return element ? Math.round(element.scrollWidth - element.clientWidth) : null;
      })(),
      rolePatternOverflowX: (() => {
        const element = document.querySelector<HTMLElement>('.role-pattern-browser');
        return element ? Math.round(element.scrollWidth - element.clientWidth) : null;
      })(),
      unnamedButtons: [...document.querySelectorAll<HTMLButtonElement>('button')].filter((button) => !(button.getAttribute('aria-label') || button.getAttribute('title') || button.textContent?.trim())).length,
      theme: document.documentElement.dataset.theme,
      colorScheme: document.documentElement.style.colorScheme,
    };
  });
}

test('3テーマと主要surfaceをWQHDからスマホまで同じlayoutで表示する', async ({ page }) => {
  const errors: string[] = [];
  const failedRequests: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText ?? ''}`));
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto('/');
  for (const theme of THEMES) {
    await page.getByLabel('カラーテーマ').selectOption(theme.id);
    await page.waitForTimeout(220);
    await page.screenshot({ path: `docs/imp/evidence/project-home-wqhd-${theme.slug}-2026-07-23.png`, fullPage: false });
  }
  await page.getByLabel('カラーテーマ').selectOption('vanilla-pastel');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'vanilla-pastel');
  await page.getByRole('button', { name: '新しい曲' }).click();
  await page.screenshot({ path: 'docs/imp/evidence/project-home-new-wqhd-vanilla-2026-07-23.png', fullPage: false });

  await createVisualProject(page);

  await page.getByRole('button', { name: '展開を整える' }).click();
  const themeMetrics: Record<string, Awaited<ReturnType<typeof layoutMetrics>>> = {};
  for (const theme of THEMES) {
    await page.getByLabel('カラーテーマ').selectOption(theme.id);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
    await page.waitForTimeout(220);
    await page.locator('.chord-pattern-board').evaluate((element) => element.scrollIntoView({ block: 'start' }));
    themeMetrics[theme.id] = await layoutMetrics(page);
    expect(themeMetrics[theme.id]!.overflowX).toBeLessThanOrEqual(0);
    expect(themeMetrics[theme.id]!.phraseCount).toBe(4);
    expect(themeMetrics[theme.id]!.chordCount).toBe(46);
    expect(themeMetrics[theme.id]!.rolePatternCount).toBe(42);
    expect(themeMetrics[theme.id]!.rolePatternOverflowX).toBeLessThanOrEqual(0);
    expect(themeMetrics[theme.id]!.unnamedButtons).toBe(0);
    await page.screenshot({ path: `docs/imp/evidence/chord-workbench-wqhd-${theme.slug}-2026-07-23.png`, fullPage: false });
    await page.getByRole('button', { name: '伴奏', exact: true }).click();
    await page.locator('.role-pattern-browser').evaluate((element) => element.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: `docs/imp/evidence/role-pattern-browser-wqhd-${theme.slug}-2026-07-23.png`, fullPage: false });
    await page.getByRole('button', { name: 'コード・音色' }).click();
  }
  expect(themeMetrics['vanilla-pastel']!.board).toEqual(themeMetrics['dark-pastel']!.board);
  expect(themeMetrics['friendly-signal']!.board).toEqual(themeMetrics['dark-pastel']!.board);

  await page.getByRole('button', { name: '曲の設計' }).click();
  await page.screenshot({ path: 'docs/imp/evidence/arrangement-wqhd-friendly-2026-07-23.png', fullPage: false });
  await page.getByRole('button', { name: '詳細の編集' }).click();
  await expect(page.getByRole('heading', { name: 'Melody', level: 2 })).toBeVisible();
  const pianoRoll = page.locator('.piano-roll-viewport');
  const firstViewportRoll = await pianoRoll.boundingBox();
  if (!firstViewportRoll) throw new Error('WQHD piano roll is unavailable.');
  expect(firstViewportRoll.y).toBeLessThan(1440);
  expect(Math.min(firstViewportRoll.y + firstViewportRoll.height, 1440) - Math.max(firstViewportRoll.y, 0)).toBeGreaterThanOrEqual(320);
  await page.screenshot({ path: 'docs/imp/evidence/daw-first-viewport-wqhd-2026-07-24.png', fullPage: false });
  for (const theme of THEMES) {
    await page.getByLabel('カラーテーマ').selectOption(theme.id);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
    await pianoRoll.scrollIntoViewIfNeeded();
    const pianoMetrics = await pianoRoll.evaluate((element) => {
      const keyboard = element.querySelector<HTMLElement>('.piano-keys');
      const canvas = element.querySelector<HTMLCanvasElement>('canvas');
      const white = element.querySelector<HTMLElement>('.piano-key.is-white');
      const black = element.querySelector<HTMLElement>('.piano-key.is-black');
      const keyboardRect = keyboard?.getBoundingClientRect();
      const canvasRect = canvas?.getBoundingClientRect();
      return {
        keyCount: element.querySelectorAll('.piano-key').length,
        whiteCount: element.querySelectorAll('.piano-key.is-white').length,
        blackCount: element.querySelectorAll('.piano-key.is-black').length,
        cCount: element.querySelectorAll('.piano-key.is-c').length,
        whiteWidth: white?.getBoundingClientRect().width ?? 0,
        blackWidth: black?.getBoundingClientRect().width ?? 0,
        rowHeight: white?.getBoundingClientRect().height ?? 0,
        topDelta: keyboardRect && canvasRect ? Math.abs(keyboardRect.top - canvasRect.top) : -1,
        bottomDelta: keyboardRect && canvasRect ? Math.abs(keyboardRect.bottom - canvasRect.bottom) : -1,
      };
    });
    expect(pianoMetrics).toMatchObject({ keyCount: 88, whiteCount: 52, blackCount: 36, cCount: 8, rowHeight: 18 });
    expect(pianoMetrics.blackWidth).toBeLessThan(pianoMetrics.whiteWidth);
    expect(pianoMetrics.topDelta).toBeLessThanOrEqual(1);
    expect(pianoMetrics.bottomDelta).toBeLessThanOrEqual(1);
    await pianoRoll.screenshot({ path: `docs/imp/evidence/customize-piano-roll-wqhd-${theme.slug}-2026-07-23.png` });
  }
  await page.getByLabel('カラーテーマ').selectOption('friendly-signal');
  await page.screenshot({ path: 'docs/imp/evidence/customize-daw-wqhd-friendly-2026-07-23.png', fullPage: false });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByLabel('カラーテーマ').selectOption('dark-pastel');
  await pianoRoll.scrollIntoViewIfNeeded();
  const mobilePianoMetrics = await pianoRoll.evaluate((element) => ({
    viewportWidth: innerWidth,
    documentOverflowX: document.documentElement.scrollWidth - innerWidth,
    wrapWidth: Math.round(element.getBoundingClientRect().width),
    keyCount: element.querySelectorAll('.piano-key').length,
  }));
  expect(mobilePianoMetrics).toMatchObject({ viewportWidth: 375, documentOverflowX: 0, keyCount: 88 });
  expect(mobilePianoMetrics.wrapWidth).toBeLessThanOrEqual(375);
  await pianoRoll.screenshot({ path: 'docs/imp/evidence/customize-piano-roll-375-dark-2026-07-23.png' });
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.getByRole('button', { name: '曲の設計' }).click();
  await page.getByLabel('カラーテーマ').selectOption('vanilla-pastel');
  await page.waitForTimeout(220);
  await page.screenshot({ path: 'docs/imp/evidence/song-design-wqhd-vanilla-2026-07-23.png', fullPage: false });

  const breakpoints = [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 768, height: 1024 },
    { width: 375, height: 812 },
  ];
  const breakpointMetrics: Array<{ width: number; height: number; overflowX: number; rolePatternCount: number; rolePatternOverflowX: number | null }> = [];
  await page.getByRole('button', { name: '展開を整える' }).click();
  await page.getByLabel('カラーテーマ').selectOption('dark-pastel');
  await page.waitForTimeout(220);
  for (const viewport of breakpoints) {
    await page.setViewportSize(viewport);
    await page.locator('.chord-pattern-board').evaluate((element) => element.scrollIntoView({ block: 'start' }));
    const metrics = await layoutMetrics(page);
    breakpointMetrics.push({ ...viewport, overflowX: metrics.overflowX, rolePatternCount: metrics.rolePatternCount, rolePatternOverflowX: metrics.rolePatternOverflowX });
    expect(metrics.overflowX).toBeLessThanOrEqual(0);
    expect(metrics.rolePatternCount).toBe(42);
    expect(metrics.rolePatternOverflowX).toBeLessThanOrEqual(0);
    if (viewport.width === 375) {
      expect(metrics.atlasOverflowX).toBeLessThanOrEqual(0);
      expect(metrics.minChordWidth).toBeGreaterThanOrEqual(44);
      await page.locator('.harmonic-map').scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'docs/imp/evidence/chord-atlas-375-dark-2026-07-23.png', fullPage: false });
    }
  }
  await writeFile('docs/imp/evidence/theme-responsive-qa-2026-07-23.json', `${JSON.stringify({ themeMetrics, breakpointMetrics }, null, 2)}\n`, 'utf8');
  expect(errors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test('ピアノロールをホイールで88鍵範囲へ移動し、表示外範囲でも音符を追加できる', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1648, height: 944 });
  await createVisualProject(page);
  await page.getByRole('button', { name: '詳細の編集' }).click();

  const viewport = page.getByRole('region', { name: '音程範囲。マウスホイールで上下にスクロール' });
  const canvas = page.getByLabel('メロディピアノロール');
  await viewport.scrollIntoViewIfNeeded();
  const initialScrollTop = await viewport.evaluate((element) => element.scrollTop);
  expect(initialScrollTop).toBe((108 - 84) * 18);
  const bounds = await viewport.boundingBox();
  if (!bounds) throw new Error('piano roll viewport missing');
  await page.mouse.move(bounds.x + Math.min(220, bounds.width - 20), bounds.y + Math.min(240, bounds.height - 20));
  await page.mouse.wheel(0, 900);
  await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(initialScrollTop);

  const scrolledBounds = await viewport.boundingBox();
  if (!scrolledBounds) throw new Error('scrolled piano roll viewport missing');
  await page.mouse.dblclick(scrolledBounds.x + Math.min(240, scrolledBounds.width - 30), scrolledBounds.y + scrolledBounds.height - 42);
  await expect(page.getByRole('button', { name: '選択音符をコピー' })).toBeEnabled();
  expect(await canvas.evaluate((element) => Math.round(element.getBoundingClientRect().height))).toBe(88 * 18);
  await viewport.screenshot({ path: 'docs/imp/evidence/customize-piano-roll-wheel-low-1648-dark-2026-07-23.png' });
  expect(errors).toEqual([]);
});
