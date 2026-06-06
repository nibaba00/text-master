import { spawn } from 'node:child_process';
import { existsSync, rmSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const configPath = resolve('artifacts/provider-config-persistence-test.json');
const firstPort = Number(process.env.TEXT_MASTER_PROVIDER_AUDIT_PORT ?? 4930);
const secondPort = firstPort + 1;

rmSync(configPath, { force: true });

let api = null;

try {
  api = startApi(firstPort);
  await wait(800);

  const saved = await request(firstPort, '/api/providers/config', {
    method: 'PATCH',
    body: JSON.stringify({
      activeProviderId: 'deepseek',
      deepseek: {
        apiKey: 'provider-config-audit-key',
        baseUrl: 'https://provider-config-audit.example.com',
        model: 'provider-config-audit-model',
      },
    }),
  });
  assert(saved.body?.data?.activeProviderId === 'deepseek', 'Provider config was not saved');
  stopApi(api);
  await wait(500);

  api = startApi(secondPort);
  await wait(800);

  const afterRestart = await request(secondPort, '/api/providers');
  const deepseek = afterRestart.body?.data?.providers?.find((provider) => provider.id === 'deepseek');
  assert(afterRestart.body?.data?.activeProviderId === 'deepseek', 'Active provider was not persisted');
  assert(deepseek?.configured === true, 'DeepSeek configured state was not persisted');
  assert(deepseek?.baseUrl === 'https://provider-config-audit.example.com', 'DeepSeek base URL was not persisted');
  assert(deepseek?.model === 'provider-config-audit-model', 'DeepSeek model was not persisted');

  console.log(
    JSON.stringify(
      {
        persisted: true,
        configPath,
        fileExists: existsSync(configPath),
        fileSize: existsSync(configPath) ? statSync(configPath).size : 0,
        activeProviderId: afterRestart.body.data.activeProviderId,
        deepseek: {
          configured: deepseek.configured,
          baseUrl: deepseek.baseUrl,
          model: deepseek.model,
        },
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (api) {
    stopApi(api);
  }
  rmSync(configPath, { force: true });
}

function startApi(port) {
  return spawn(process.execPath, ['src/main.mjs'], {
    cwd: 'apps/api',
    env: {
      ...process.env,
      PORT: String(port),
      TEXT_MASTER_PROVIDER_CONFIG_PATH: configPath,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function stopApi(process) {
  if (!process.killed) {
    process.kill('SIGTERM');
  }
}

async function request(port, path, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body,
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
