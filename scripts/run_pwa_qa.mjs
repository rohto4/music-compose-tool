import { spawn } from 'node:child_process';

const host = '127.0.0.1';
const port = Number(process.env.PATCHTONE_PWA_PORT ?? 4174);
const baseUrl = process.env.PATCHTONE_PWA_URL ?? `http://${host}:${port}`;

const waitForHttp = async (url, timeoutMs = 30_000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`PWA preview did not become ready at ${url}.`);
};

const runQa = () => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ['scripts/qa_pwa.mjs'], {
    cwd: process.cwd(),
    env: { ...process.env, PATCHTONE_PWA_URL: baseUrl },
    stdio: 'inherit',
  });
  child.once('error', reject);
  child.once('exit', (code, signal) => {
    if (signal) reject(new Error(`PWA QA exited with signal ${signal}.`));
    else resolve(code ?? 1);
  });
});

const preview = process.env.PATCHTONE_PWA_URL
  ? null
  : spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port)], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });

try {
  if (preview) await waitForHttp(baseUrl);
  const code = await runQa();
  if (code !== 0) process.exitCode = code;
} finally {
  if (preview && !preview.killed) {
    preview.kill();
  }
}
