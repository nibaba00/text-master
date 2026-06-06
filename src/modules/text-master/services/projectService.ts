import { mockProjects } from '../mock/mockProjects';
import type {
  TextProject,
  TextProjectSettings,
  TextProjectStatus,
  TextProjectType,
} from '../types/project';
import type { WorkspaceType } from '../workflows/types';
import { getDefaultStageId, getWorkflowById } from '../workflows/workflowRegistry';
import {
  cloneValue,
  createTextMasterId,
  readCollection,
  runServiceAction,
  writeCollection,
} from './localStorageRepository';

const PROJECTS_STORAGE_KEY = 'text-master:projects';
const SERVICE_NAME = 'projectService';

export async function listProjects(): Promise<TextProject[]> {
  return runServiceAction(SERVICE_NAME, 'listProjects', () =>
    readProjects().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );
}

export async function getProject(projectId: string): Promise<TextProject | null> {
  return runServiceAction(SERVICE_NAME, 'getProject', () => {
    assertProjectId(projectId);

    return readProjects().find((item) => item.id === projectId) ?? null;
  });
}

export type CreateProjectInput = {
  title: string;
  type: TextProjectType;
  workflowId?: string;
  workspaceType?: WorkspaceType;
  currentStageId?: string;
  summary?: string;
  status?: TextProjectStatus;
  settings?: Partial<TextProjectSettings>;
};

export async function createProject(input: CreateProjectInput): Promise<TextProject> {
  return runServiceAction(SERVICE_NAME, 'createProject', () => {
    const title = input.title.trim();

    if (!title) {
      throw new Error('Project title is required');
    }

    const now = new Date().toISOString();
    const workflow = getWorkflowById(input.workflowId);
    const projects = readProjects();
    const project: TextProject = {
      id: createTextMasterId('project'),
      title,
      type: input.type,
      workflowId: workflow.id,
      workspaceType: input.workspaceType ?? workflow.workspaceType,
      currentStageId: input.currentStageId ?? getDefaultStageId(workflow.id),
      status: input.status ?? 'draft',
      summary: input.summary?.trim() ?? '',
      wordCount: 0,
      progress: 0,
      createdAt: now,
      updatedAt: now,
      settings: {
        ...createDefaultProjectSettings(),
        ...input.settings,
      },
    };

    projects.unshift(project);
    writeProjects(projects);

    return cloneValue(project);
  });
}

export async function saveProject(project: TextProject): Promise<TextProject> {
  return runServiceAction(SERVICE_NAME, 'saveProject', () => {
    assertProjectId(project.id);

    const projects = readProjects();
    const index = projects.findIndex((item) => item.id === project.id);
    const nextProject = normalizeProject({
      ...project,
      updatedAt: new Date().toISOString(),
    });

    if (index >= 0) {
      projects[index] = nextProject;
    } else {
      projects.unshift(nextProject);
    }

    writeProjects(projects);

    return cloneValue(nextProject);
  });
}

export async function updateProject(
  projectId: string,
  patch: Partial<
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
      | 'settings'
    >
  >,
): Promise<TextProject> {
  return runServiceAction(SERVICE_NAME, 'updateProject', async () => {
    const project = await getProject(projectId);

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    return saveProject({
      ...project,
      ...patch,
      settings: {
        ...project.settings,
        ...patch.settings,
      },
    });
  });
}

export async function updateProjectStats(
  projectId: string,
  stats: Partial<Pick<TextProject, 'wordCount' | 'progress'>>,
): Promise<TextProject> {
  return runServiceAction(SERVICE_NAME, 'updateProjectStats', async () => {
    const project = await getProject(projectId);

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    return saveProject({
      ...project,
      ...stats,
    });
  });
}

function readProjects(): TextProject[] {
  return readCollection<TextProject>(
    PROJECTS_STORAGE_KEY,
    mockProjects,
    SERVICE_NAME,
  ).map(normalizeProject);
}

function writeProjects(projects: TextProject[]): void {
  writeCollection(PROJECTS_STORAGE_KEY, projects.map(normalizeProject), SERVICE_NAME);
}

function normalizeProject(project: TextProject): TextProject {
  const defaultSettings = createDefaultProjectSettings();
  const settings = project.settings ?? defaultSettings;
  const exportFormats =
    settings.exportFormats && settings.exportFormats.length > 0
      ? [...settings.exportFormats]
      : defaultSettings.exportFormats;
  const workflow = getWorkflowById(project.workflowId);

  return {
    ...project,
    title: project.title.trim(),
    summary: project.summary ?? '',
    wordCount: Math.max(0, Math.round(project.wordCount ?? 0)),
    progress: clampProgress(project.progress ?? 0),
    workflowId: workflow.id,
    workspaceType: project.workspaceType ?? workflow.workspaceType,
    currentStageId:
      project.currentStageId &&
      workflow.stages.some((stage) => stage.id === project.currentStageId)
        ? project.currentStageId
        : workflow.defaultStageId,
    settings: {
      ...defaultSettings,
      ...settings,
      exportFormats,
    },
  };
}

function createDefaultProjectSettings(): TextProjectSettings {
  return {
    language: 'zh-CN',
    targetAudience: '',
    tone: 'clear',
    defaultModel: 'mock-local',
    autoSave: true,
    exportFormats: ['markdown', 'txt', 'json'],
  };
}

function assertProjectId(projectId: string): void {
  if (!projectId?.trim()) {
    throw new Error('Project id is required');
  }
}

function clampProgress(progress: number): number {
  if (Number.isNaN(progress)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(progress)));
}
