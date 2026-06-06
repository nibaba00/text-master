import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const auditPort = Number(process.env.TEXT_MASTER_API_AUDIT_PORT ?? 4910);
const baseUrl = `http://127.0.0.1:${auditPort}`;
const startupDelayMs = 800;
const auditProjectsPath = resolve('artifacts/api-audit-projects.json');
const auditGenerationsPath = resolve('artifacts/api-audit-generations.json');
const auditExportsPath = resolve('artifacts/api-audit-exports.json');

rmSync(auditProjectsPath, { force: true });
rmSync(auditGenerationsPath, { force: true });
rmSync(auditExportsPath, { force: true });

const api = spawn(process.execPath, ['src/main.mjs'], {
  cwd: 'apps/api',
  env: {
    ...process.env,
    PORT: String(auditPort),
    TEXT_MASTER_PROJECTS_PATH: auditProjectsPath,
    TEXT_MASTER_GENERATIONS_PATH: auditGenerationsPath,
    TEXT_MASTER_EXPORTS_PATH: auditExportsPath,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

const serverOutput = [];

api.stdout.on('data', (chunk) => serverOutput.push(chunk.toString()));
api.stderr.on('data', (chunk) => serverOutput.push(chunk.toString()));

try {
  await wait(startupDelayMs);
  const health = await request('/api/health');
  assert(health.ok && health.body?.data?.status === 'ok', 'GET /api/health failed');

  const textTypesResponse = await request('/api/text-types');
  const textTypes = textTypesResponse.body?.data ?? [];
  assert(Array.isArray(textTypes) && textTypes.length > 0, 'GET /api/text-types returned no types');

  const providersResponse = await request('/api/providers');
  const providers = providersResponse.body?.data;
  assert(providers?.activeProviderId, 'GET /api/providers returned no active provider');
  assert(
    Array.isArray(providers.providers) && providers.providers.some((provider) => provider.id === 'mock-provider'),
    'GET /api/providers returned no mock provider',
  );

  const results = [];

  for (const textType of textTypes) {
    const input = {
      title: `api-test-${textType.id}`,
      type: textType.id,
      workflowId: textType.workflowTemplate.workflowId,
      workspaceType: textType.workflowTemplate.workspaceType,
      currentStageId: textType.workflowTemplate.defaultStageId,
      summary: `API smoke test project for ${textType.id}`,
      settings: {
        projectSetup: {
          source: 'api-smoke-test',
        },
      },
    };

    const created = await request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    const project = created.body?.data;
    assert(created.status === 201 && project?.id, `${textType.id}: create project failed`);

    const workflow = await request(`/api/projects/${encodeURIComponent(project.id)}/workflow`);
    assert(workflow.ok, `${textType.id}: workflow request failed`);

    const generated = await request(`/api/projects/${encodeURIComponent(project.id)}/generate`, {
      method: 'POST',
      body: JSON.stringify({
        documentId: `doc-${textType.id}`,
        prompt: `Generate test content for ${textType.id}`,
        context: 'Text Master API smoke test',
      }),
    });
    const task = generated.body?.data;
    assert(generated.status === 202 && task?.id, `${textType.id}: generate request failed`);

    const taskRead = await waitForGeneration(task.id);
    assert(taskRead.ok && taskRead.body?.data?.status === 'succeeded', `${textType.id}: generation read failed`);

    const exported = await request(`/api/projects/${encodeURIComponent(project.id)}/export`, {
      method: 'POST',
      body: JSON.stringify({ format: 'markdown' }),
    });
    assert(exported.status === 201 && exported.body?.data?.fileName, `${textType.id}: export request failed`);

    const exportRecords = await request(`/api/projects/${encodeURIComponent(project.id)}/exports`);
    assert(
      exportRecords.ok &&
        Array.isArray(exportRecords.body?.data) &&
        exportRecords.body.data.some((record) => record.id === exported.body.data.id),
      `${textType.id}: export records request failed`,
    );

    results.push({
      textTypeId: textType.id,
      projectType: project.type,
      expectedWorkflowId: textType.workflowTemplate.workflowId,
      actualWorkflowId: workflow.body?.data?.workflow?.id,
      expectedStageId: textType.workflowTemplate.defaultStageId,
      actualStageId: project.currentStageId,
      taskStatus: taskRead.body?.data?.status,
      exportFileName: exported.body?.data?.fileName,
      passed:
        project.type === textType.id &&
        workflow.body?.data?.workflow?.id === textType.workflowTemplate.workflowId &&
        project.currentStageId === textType.workflowTemplate.defaultStageId &&
        taskRead.body?.data?.status === 'succeeded',
    });
  }

  const failed = results.filter((result) => !result.passed);
  console.log(
    JSON.stringify(
      {
        activeProviderId: providers.activeProviderId,
        providerCount: providers.providers.length,
        textTypeCount: textTypes.length,
        failedCount: failed.length,
        results,
      },
      null,
      2,
    ),
  );
  assert(failed.length === 0, `${failed.length} text type smoke tests failed`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  if (serverOutput.length) {
    console.error(serverOutput.join('').trim());
  }
  process.exitCode = 1;
} finally {
  if (!api.killed) {
    api.kill('SIGTERM');
  }
  rmSync(auditProjectsPath, { force: true });
  rmSync(auditGenerationsPath, { force: true });
  rmSync(auditExportsPath, { force: true });
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
    text,
  };
}

async function waitForGeneration(taskId) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 5000) {
    const response = await request(`/api/generations/${encodeURIComponent(taskId)}`);
    const status = response.body?.data?.status;

    if (status === 'succeeded' || status === 'failed' || status === 'canceled') {
      return response;
    }

    await wait(80);
  }

  throw new Error(`Generation task ${taskId} polling timed out`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
