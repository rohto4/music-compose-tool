import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HARD_VRAM_CAP_MIB, MEASURED_PEAK_RESERVED_MIB, startGateway } from '../tools/home-ai-gateway.mjs';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const python = resolve(process.env.HOME_AI_ACE_PYTHON ?? 'C:\\LLM\\tools\\ACE-Step-1.5\\.venv\\Scripts\\python.exe');
const script = resolve(process.env.HOME_AI_ACE_SCRIPT ?? resolve(repositoryRoot, 'scripts', 'spike_ace_step_generate.py'));
const checkpoints = resolve(process.env.HOME_AI_ACE_CHECKPOINTS ?? 'C:\\LLM\\models\\music\\ace-step-1.5');
const artifactRoot = resolve(process.env.HOME_AI_ARTIFACT_ROOT ?? resolve(repositoryRoot, '.cache', 'home-ai-artifacts'));

function requirePath(path, kind) {
  if (!existsSync(path)) throw new Error(`ACE-Step ${kind} is missing. Configure its HOME_AI_ACE_* path before starting the gateway.`);
  const stat = statSync(path);
  if (kind === 'checkpoints' ? !stat.isDirectory() : !stat.isFile()) throw new Error(`ACE-Step ${kind} has the wrong filesystem type.`);
}

requirePath(python, 'python');
requirePath(script, 'script');
requirePath(checkpoints, 'checkpoints');

const gateway = startGateway({ enableAceStep: true, python, script, checkpoints, artifactRoot });
gateway.server.once('listening', () => {
  process.stdout.write(`ACE-Step DiT-only enabled; measured conditioned peak ${MEASURED_PEAK_RESERVED_MIB} MiB / cap ${HARD_VRAM_CAP_MIB} MiB.\n`);
});
gateway.server.once('error', (reason) => {
  process.stderr.write(`Home AI gateway failed to start: ${reason instanceof Error ? reason.message : String(reason)}\n`);
  process.exitCode = 1;
});

const shutdown = () => gateway.server.close(() => process.exit(0));
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
