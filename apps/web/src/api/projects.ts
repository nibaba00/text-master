import type {
  GenerationTask,
  TextProject,
  TextProjectCreateInput,
  TextProjectSettings,
  TextType,
  WorkspaceType,
} from '@text-master/shared';
import { apiGet, apiPatch, apiPost } from './client';

export type CreateProjectInput = TextProjectCreateInput;

export type ProjectUpdatePatch = Partial<
  Pick<
    TextProject,
    | 'title'
    | 'type'
    | 'workflowId'
    | 'workspaceType'
    | 'currentStageId'
    | 'status'
    | 'summary'
    | 'progress'
    | 'wordCount'
  >
> & {
  settings?: Partial<TextProjectSettings>;
};

export type GenerateProjectInput = {
  projectId: string;
  documentId: string;
  prompt: string;
  context?: string;
};

export type ReviewProjectInput = {
  projectId: string;
  documentId: string;
  text: string;
};

export type RewriteProjectInput = {
  projectId: string;
  documentId: string;
  text: string;
  instruction?: string;
};

export async function listProjects(): Promise<TextProject[]> {
  return apiGet<TextProject[]>('/projects');
}

export async function getProject(projectId: string): Promise<TextProject | null> {
  return apiGet<TextProject | null>(`/projects/${encodeURIComponent(projectId)}`);
}

export async function createProject(input: CreateProjectInput): Promise<TextProject> {
  return apiPost<TextProject>('/projects', input);
}

export async function updateProject(projectId: string, patch: ProjectUpdatePatch): Promise<TextProject> {
  return apiPatch<TextProject>(`/projects/${encodeURIComponent(projectId)}`, patch);
}

export async function updateProjectStats(
  projectId: string,
  stats: Partial<Pick<TextProject, 'wordCount' | 'progress'>>,
): Promise<TextProject> {
  return apiPatch<TextProject>(`/projects/${encodeURIComponent(projectId)}/stats`, stats);
}

export async function getProjectWorkflow(projectId: string): Promise<{
  projectId: string;
  workflow: {
    id: string;
    name: string;
    workspaceType: WorkspaceType;
    defaultStageId: string;
    stageIds: string[];
    exportTargets: string[];
  };
  currentStageId: string;
}> {
  return apiGet(`/projects/${encodeURIComponent(projectId)}/workflow`);
}

export async function listTextTypes(): Promise<TextType[]> {
  return apiGet<TextType[]>('/text-types');
}

export async function generateProjectText(input: GenerateProjectInput): Promise<GenerationTask> {
  return apiPost<GenerationTask>(`/projects/${encodeURIComponent(input.projectId)}/generate`, {
    documentId: input.documentId,
    prompt: input.prompt,
    context: input.context,
  });
}

export async function reviewProjectText(input: ReviewProjectInput): Promise<GenerationTask> {
  return apiPost<GenerationTask>(`/projects/${encodeURIComponent(input.projectId)}/review`, {
    documentId: input.documentId,
    text: input.text,
  });
}

export async function rewriteProjectText(input: RewriteProjectInput): Promise<GenerationTask> {
  return apiPost<GenerationTask>(`/projects/${encodeURIComponent(input.projectId)}/rewrite`, {
    documentId: input.documentId,
    text: input.text,
    instruction: input.instruction,
  });
}

export async function getGenerationTask(taskId: string): Promise<GenerationTask> {
  return apiGet<GenerationTask>(`/generations/${encodeURIComponent(taskId)}`);
}

export async function waitForGenerationTask(
  taskId: string,
  options: {
    intervalMs?: number;
    timeoutMs?: number;
  } = {},
): Promise<GenerationTask> {
  const intervalMs = options.intervalMs ?? 200;
  const timeoutMs = options.timeoutMs ?? 10000;
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    const task = await getGenerationTask(taskId);

    if (task.status === 'succeeded' || task.status === 'failed' || task.status === 'canceled') {
      return task;
    }

    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
  }

  throw new Error('Generation task polling timed out');
}
