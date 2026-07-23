import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'vite';

const execFileAsync = promisify(execFile);
const baseUrl = 'http://127.0.0.1:4173/';

async function serverIsAvailable(): Promise<boolean> {
  try {
    const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1_000) });
    return response.ok;
  } catch {
    return false;
  }
}

export default async function setup() {
  if (await serverIsAvailable()) return;

  await execFileAsync(process.execPath, ['scripts/sync_basic_pitch_model.mjs']);
  const server = await createServer({
    server: {
      host: '127.0.0.1',
      port: 4173,
      strictPort: true,
    },
  });
  await server.listen();

  return async () => {
    await server.close();
  };
}
