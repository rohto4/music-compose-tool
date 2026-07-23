import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const host = '127.0.0.1';
const port = Number(process.env.PATCHTONE_DARK_QA_PORT ?? 4175);
const baseUrl = process.env.PATCHTONE_DARK_QA_URL ?? `http://${host}:${port}`;
const evidenceDir = resolve('docs/imp/evidence');

const waitForHttp = async (url, timeoutMs = 30_000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // The preview is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`Dark theme QA preview did not become ready at ${url}.`);
};

const preview = process.env.PATCHTONE_DARK_QA_URL
  ? null
  : spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port)], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const results = [];
try {
  if (preview) await waitForHttp(baseUrl);
  await mkdir(evidenceDir, { recursive: true });
  for (const width of [1440, 768, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: 'dark' });
    const page = await context.newPage();
    const consoleErrors = [];
    const requestFailures = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('requestfailed', (request) => requestFailures.push(`${request.method()} ${request.url()}`));
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.screenshot({ path: resolve(evidenceDir, `dark-theme-home-${width}.png`), fullPage: true });
    const home = await page.evaluate(() => {
      const doc = globalThis.document;
      const root = doc.documentElement;
      const body = doc.body;
      const resolveToken = (name) => {
        const probe = doc.createElement('i');
        probe.style.color = `var(${name})`;
        doc.body.append(probe);
        const value = globalThis.getComputedStyle(probe).color;
        probe.remove();
        return value;
      };
      const primary = doc.querySelector('.button-primary');
      const secondary = [...doc.querySelectorAll('.button')].find((control) => !control.classList.contains('button-primary'));
      return {
        viewport: globalThis.innerWidth,
        scrollWidth: root.scrollWidth,
        bodyBackground: globalThis.getComputedStyle(body).backgroundColor,
        paperToken: globalThis.getComputedStyle(body).getPropertyValue('--color-paper').trim(),
        actionToken: globalThis.getComputedStyle(body).getPropertyValue('--color-action').trim(),
        actionColor: resolveToken('--color-action'),
        actionMutedColor: resolveToken('--color-action-muted'),
        primaryBackground: primary ? globalThis.getComputedStyle(primary).backgroundColor : null,
        secondaryBorder: secondary ? globalThis.getComputedStyle(secondary).borderColor : null,
        radiusCard: globalThis.getComputedStyle(body).getPropertyValue('--radius-card').trim(),
        radiusInput: globalThis.getComputedStyle(body).getPropertyValue('--radius-input').trim(),
      };
    });
    results.push({ width, home, consoleErrors, requestFailures });
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'dark' });
  const page = await context.newPage();
  const consoleErrors = [];
  const requestFailures = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('requestfailed', (request) => requestFailures.push(`${request.method()} ${request.url()}`));
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '新しい曲' }).click();
  await page.getByLabel('曲の名前').fill('Night Grid QA');
  await page.locator('input[name="startMode"][value="patchboard"]').check();
  await page.getByRole('button', { name: 'パッチボードから始める' }).click();
  await page.getByRole('button', { name: /^カスタマイズ/ }).click();
  const canvas = page.getByLabel('メロディピアノロール');
  await canvas.waitFor();
  await page.screenshot({ path: resolve(evidenceDir, 'dark-theme-editor-1440.png'), fullPage: true });
  const editor = await page.evaluate(() => {
    const doc = globalThis.document;
    const canvasNode = doc.querySelector('[aria-label="メロディピアノロール"]');
    const roll = doc.querySelector('.piano-roll-wrap');
    const rootStyle = globalThis.getComputedStyle(doc.body);
    const trackAdd = [...doc.querySelectorAll('.daw-tools .button')].find((control) => control.textContent?.includes('トラック追加'));
    const deleteButton = [...doc.querySelectorAll('.daw-tools .button')].find((control) => control.textContent?.includes('Delete'));
    return {
      canvasBackground: canvasNode ? globalThis.getComputedStyle(canvasNode).backgroundColor : null,
      rollBackground: roll ? globalThis.getComputedStyle(roll).backgroundColor : null,
      editorBlackToken: rootStyle.getPropertyValue('--color-editor-black').trim(),
      editorGridToken: rootStyle.getPropertyValue('--color-editor-grid').trim(),
      actionToken: rootStyle.getPropertyValue('--color-action').trim(),
      trackAddBorder: trackAdd ? globalThis.getComputedStyle(trackAdd).borderColor : null,
      deleteBorder: deleteButton ? globalThis.getComputedStyle(deleteButton).borderColor : null,
      deleteErrorToken: rootStyle.getPropertyValue('--color-error').trim(),
      radiusCard: rootStyle.getPropertyValue('--radius-card').trim(),
      radiusInput: rootStyle.getPropertyValue('--radius-input').trim(),
      scrollWidth: doc.documentElement.scrollWidth,
      viewport: globalThis.innerWidth,
    };
  });
  results.push({ width: 1440, editor, consoleErrors, requestFailures });
  await context.close();
} finally {
  await browser.close();
  if (preview && !preview.killed) preview.kill();
}

const failures = results.flatMap((result) => [
  ...(result.consoleErrors ?? []).map((error) => `${result.width}px console: ${error}`),
  ...(result.requestFailures ?? []).map((failure) => `${result.width}px network: ${failure}`),
  ...(result.home && result.home.scrollWidth > result.home.viewport ? [`${result.width}px home overflow`] : []),
  ...(result.home && !result.home.actionToken ? [`${result.width}px action token missing`] : []),
  ...(result.home && result.home.primaryBackground !== result.home.actionColor ? [`${result.width}px primary action is not solid yellow`] : []),
  ...(result.home && result.home.secondaryBorder !== result.home.actionMutedColor ? [`${result.width}px secondary action is not yellow-outlined`] : []),
  ...(result.editor && result.editor.scrollWidth > result.editor.viewport ? ['1440px editor overflow'] : []),
  ...(result.editor && !result.editor.actionToken ? ['1440px editor action token missing'] : []),
]);
if (failures.length > 0) throw new Error(failures.join('\n'));
await writeFile(resolve(evidenceDir, 'dark-theme-qa-2026-07-23.json'), `${JSON.stringify({ baseUrl, results, failures }, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ baseUrl, results, failures }, null, 2));
