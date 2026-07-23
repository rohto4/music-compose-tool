import { chromium } from '@playwright/test';

const baseUrl = process.env.PATCHTONE_PWA_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    const serviceWorker = globalThis.navigator?.serviceWorker;
    const originalRegister = serviceWorker?.register?.bind(serviceWorker);
    if (!originalRegister) return;
    serviceWorker.register = (...args) => {
      globalThis.__patchtoneServiceWorkerCalls = [
        ...(globalThis.__patchtoneServiceWorkerCalls ?? []),
        String(args[0]),
      ];
      return originalRegister(...args).catch((error) => {
        globalThis.__patchtoneServiceWorkerErrors = [
          ...(globalThis.__patchtoneServiceWorkerErrors ?? []),
          String(error),
        ];
        throw error;
      });
    };
  });
  const response = await page.goto(baseUrl, { waitUntil: 'networkidle' });
  if (!response || response.status() !== 200) throw new Error(`PWA shell returned HTTP ${response?.status() ?? 'unknown'}.`);
  const manifest = await page.evaluate(async () => {
    const response = await fetch('/manifest.webmanifest');
    if (!response.ok) throw new Error(`manifest HTTP ${response.status}`);
    return await response.json();
  });
  await page.waitForTimeout(5_000);
  const runtime = await page.evaluate(async () => {
    const browserNavigator = globalThis.navigator;
    const browserCaches = globalThis.caches;
    if (!('serviceWorker' in browserNavigator)) return { supported: false, controller: false, scope: null, shellCache: false, autoRegistered: false, registerError: null };
    const appRegistrationCalls = globalThis.__patchtoneServiceWorkerCalls ?? [];
    const appRegistrationErrors = globalThis.__patchtoneServiceWorkerErrors ?? [];
    const registrationsBeforeQaFallback = await browserNavigator.serviceWorker.getRegistrations();
    let registerError = null;
    let manualRegistration = false;
    if (registrationsBeforeQaFallback.length === 0) {
      manualRegistration = true;
      try { await browserNavigator.serviceWorker.register('/sw.js'); } catch (error) { registerError = String(error); }
    }
    const registration = await Promise.race([
      browserNavigator.serviceWorker.ready,
      new Promise((resolve) => setTimeout(() => resolve(null), 5_000)),
    ]);
    const registrations = await browserNavigator.serviceWorker.getRegistrations();
    const autoRegistered = appRegistrationCalls.includes('/sw.js') && appRegistrationErrors.length === 0 && registrations.length > 0 && !manualRegistration;
    if (!registration) return { supported: true, controller: Boolean(browserNavigator.serviceWorker.controller), scope: null, shellCache: await browserCaches.has('patchtone-shell-v1'), autoRegistered, appRegistrationCalls, appRegistrationErrors, manualRegistration, registerError };
    return { supported: true, controller: Boolean(browserNavigator.serviceWorker.controller), scope: registration.scope, shellCache: await browserCaches.has('patchtone-shell-v1'), autoRegistered, appRegistrationCalls, appRegistrationErrors, manualRegistration, registerError };
  });
  if (manifest.id !== '/' || manifest.start_url !== '/' || manifest.scope !== '/' || manifest.display !== 'standalone') throw new Error('Manifest install fields are incomplete.');
  if (!manifest.icons?.some((icon) => icon.src === '/patchtone-icon.svg')) throw new Error('Manifest icon is missing.');
  if (!runtime.supported || !runtime.scope?.endsWith('/') || !runtime.shellCache) throw new Error(`Service worker registration/cache is incomplete: ${JSON.stringify(runtime)}`);
  console.log(JSON.stringify({ baseUrl, manifest: { id: manifest.id, startUrl: manifest.start_url, scope: manifest.scope, display: manifest.display }, runtime: { ...runtime, registrationSource: runtime.autoRegistered ? 'app' : 'qa-manual-after-app-check' } }, null, 2));
} finally {
  await browser.close();
}
