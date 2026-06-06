import { randomUUID } from 'node:crypto';
import { getGenerationsPath } from '../../config/storagePaths.mjs';
import { readJsonFile, writeJsonFile } from '../../utils/jsonStore.mjs';
import { getActiveProvider } from '../providers/registry.mjs';

const generations = loadGenerations();

export function createGenerationTask(project, body) {
  const now = new Date().toISOString();
  const taskId = `task-${randomUUID()}`;
  const prompt = typeof body?.prompt === 'string' && body.prompt.trim()
    ? body.prompt.trim()
    : `为项目「${project.title}」生成内容`;
  const context = typeof body?.context === 'string' ? body.context : '';
  const provider = getActiveProvider();

  const task = {
    id: taskId,
    projectId: project.id,
    providerId: provider.id,
    request: {
      projectId: project.id,
      documentId: typeof body?.documentId === 'string' ? body.documentId : undefined,
      prompt,
      context: context || undefined,
    },
    status: 'queued',
    createdAt: now,
    updatedAt: now,
  };

  generations.set(task.id, task);
  saveGenerations();
  queueGeneration(task.id, project, provider);
  return task;
}

export function getGenerationTask(taskId) {
  return generations.get(taskId) ?? null;
}

function queueGeneration(taskId, project, provider) {
  setTimeout(() => {
    void runGeneration(taskId, project, provider);
  }, 20);
}

async function runGeneration(taskId, project, provider) {
  const task = generations.get(taskId);

  if (!task || task.status !== 'queued') {
    return;
  }

  updateTask(taskId, {
    status: 'running',
  });

  try {
    const result = await provider.generate({
      project,
      request: task.request,
    });

    updateTask(taskId, {
      status: 'succeeded',
      result: {
        taskId,
        status: 'succeeded',
        output: result.output,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    updateTask(taskId, {
      status: 'failed',
      result: {
        taskId,
        status: 'failed',
        updatedAt: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

function updateTask(taskId, patch) {
  const task = generations.get(taskId);

  if (!task) {
    return null;
  }

  const nextTask = {
    ...task,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  generations.set(taskId, nextTask);
  saveGenerations();
  return nextTask;
}

function loadGenerations() {
  const storedTasks = readJsonFile(getGenerationsPath(), []);
  const tasks = Array.isArray(storedTasks) ? storedTasks : [];
  const normalizedTasks = tasks.map(normalizeTask).filter(Boolean);

  return new Map(normalizedTasks.map((task) => [task.id, task]));
}

function saveGenerations() {
  writeJsonFile(getGenerationsPath(), Array.from(generations.values()));
}

function normalizeTask(task) {
  if (!task || typeof task !== 'object' || typeof task.id !== 'string') {
    return null;
  }

  const status =
    task.status === 'queued' || task.status === 'running'
      ? 'failed'
      : normalizeStatus(task.status);
  const updatedAt = new Date().toISOString();

  return {
    id: task.id,
    projectId: typeof task.projectId === 'string' ? task.projectId : '',
    providerId: typeof task.providerId === 'string' ? task.providerId : 'mock-provider',
    request:
      task.request && typeof task.request === 'object'
        ? task.request
        : {
            projectId: typeof task.projectId === 'string' ? task.projectId : '',
            prompt: '',
          },
    status,
    createdAt: typeof task.createdAt === 'string' ? task.createdAt : updatedAt,
    updatedAt: typeof task.updatedAt === 'string' ? task.updatedAt : updatedAt,
    ...(task.result
      ? { result: task.result }
      : status === 'failed'
        ? {
            result: {
              taskId: task.id,
              status: 'failed',
              updatedAt,
              errorMessage: 'Generation task was interrupted by API restart',
            },
          }
        : {}),
  };
}

function normalizeStatus(status) {
  return ['queued', 'running', 'succeeded', 'failed', 'canceled'].includes(status) ? status : 'failed';
}
