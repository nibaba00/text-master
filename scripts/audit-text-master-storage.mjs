import { spawn } from 'node:child_process';
import { existsSync, rmSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const projectsPath = resolve('artifacts/storage-audit-projects.json');
const generationsPath = resolve('artifacts/storage-audit-generations.json');
const exportsPath = resolve('artifacts/storage-audit-exports.json');
const firstPort = Number(process.env.TEXT_MASTER_STORAGE_AUDIT_PORT ?? 4940);
const secondPort = firstPort + 1;

rmSync(projectsPath, { force: true });
rmSync(generationsPath, { force: true });
rmSync(exportsPath, { force: true });

let api = null;

try {
  api = startApi(firstPort);
  await wait(800);

  const created = await request(firstPort, '/api/projects', {
    method: 'POST',
    body: JSON.stringify({
      title: 'storage-audit-project',
      type: 'business_bp',
      summary: 'storage audit',
    }),
  });
  const project = created.body?.data;
  assert(created.status === 201 && project?.id, 'Project was not created');

  const generated = await request(firstPort, `/api/projects/${encodeURIComponent(project.id)}/generate`, {
    method: 'POST',
    body: JSON.stringify({
      prompt: 'Generate storage audit content',
      context: 'storage audit',
    }),
  });
  const task = generated.body?.data;
  assert(generated.status === 202 && task?.id, 'Generation task was not created');

  const completedTask = await waitForGeneration(firstPort, task.id);
  assert(completedTask.body?.data?.status === 'succeeded', 'Generation task did not succeed before restart');

  const exported = await request(firstPort, `/api/projects/${encodeURIComponent(project.id)}/export`, {
    method: 'POST',
    body: JSON.stringify({ format: 'json' }),
  });
  const exportRecord = exported.body?.data;
  assert(exported.status === 201 && exportRecord?.id, 'Export record was not created');

  stopApi(api);
  await wait(500);

  api = startApi(secondPort);
  await wait(800);

  const projectAfterRestart = await request(secondPort, `/api/projects/${encodeURIComponent(project.id)}`);
  const taskAfterRestart = await request(secondPort, `/api/generations/${encodeURIComponent(task.id)}`);
  const exportsAfterRestart = await request(secondPort, `/api/projects/${encodeURIComponent(project.id)}/exports`);
  assert(projectAfterRestart.body?.data?.id === project.id, 'Project was not persisted');
  assert(taskAfterRestart.body?.data?.id === task.id, 'Generation task was not persisted');
  assert(taskAfterRestart.body?.data?.status === 'succeeded', 'Generation task status was not persisted');
  assert(
    exportsAfterRestart.body?.data?.some((record) => record.id === exportRecord.id),
    'Export record was not persisted',
  );

  console.log(
    JSON.stringify(
      {
        persisted: true,
        projectsPath,
        generationsPath,
        projectId: project.id,
        taskId: task.id,
        taskStatus: taskAfterRestart.body.data.status,
        exportRecordId: exportRecord.id,
        exportRecordCount: exportsAfterRestart.body.data.length,
        projectsFileSize: existsSync(projectsPath) ? statSync(projectsPath).size : 0,
        generationsFileSize: existsSync(generationsPath) ? statSync(generationsPath).size : 0,
        exportsFileSize: existsSync(exportsPath) ? statSync(exportsPath).size : 0,
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
  rmSync(projectsPath, { force: true });
  rmSync(generationsPath, { force: true });
  rmSync(exportsPath, { force: true });
}

function startApi(port) {
  return spawn(process.execPath, ['src/main.mjs'], {
    cwd: 'apps/api',
    env: {
      ...process.env,
      PORT: String(port),
      TEXT_MASTER_PROJECTS_PATH: projectsPath,
      TEXT_MASTER_GENERATIONS_PATH: generationsPath,
      TEXT_MASTER_EXPORTS_PATH: exportsPath,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function stopApi(process) {
  if (!process.killed) {
    process.kill('SIGTERM');
  }
}

async function waitForGeneration(port, taskId) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 5000) {
    const response = await request(port, `/api/generations/${encodeURIComponent(taskId)}`);
    const status = response.body?.data?.status;

    if (status === 'succeeded' || status === 'failed' || status === 'canceled') {
      return response;
    }

    await wait(80);
  }

  throw new Error(`Generation task ${taskId} polling timed out`);
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
