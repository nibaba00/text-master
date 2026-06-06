import type {
  TextProject,
  TextProjectSettings,
  TextProjectStatus,
  TextProjectType,
  TextProjectCreateInput,
} from '@text-master/shared';
import type { WorkspaceType } from '../workflows/types';
import {
  createProject as apiCreateProject,
  getProject as apiGetProject,
  listProjects as apiListProjects,
  updateProject as apiUpdateProject,
  updateProjectStats as apiUpdateProjectStats,
} from '../../../api/projects';

export type CreateProjectInput = TextProjectCreateInput;

export async function listProjects(): Promise<TextProject[]> {
  return apiListProjects();
}

export async function getProject(projectId: string): Promise<TextProject | null> {
  assertProjectId(projectId);
  return apiGetProject(projectId);
}

export async function createProject(input: CreateProjectInput): Promise<TextProject> {
  const title = input.title.trim();
  if (!title) {
    throw new Error('Project title is required');
  }

  return apiCreateProject({
    ...input,
    title,
  });
}

export async function saveProject(project: TextProject): Promise<TextProject> {
  assertProjectId(project.id);
  return apiUpdateProject(project.id, {
    title: project.title,
    type: project.type,
    workflowId: project.workflowId,
    workspaceType: project.workspaceType,
    currentStageId: project.currentStageId,
    status: project.status,
    summary: project.summary,
    progress: project.progress,
    wordCount: project.wordCount,
    settings: project.settings,
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
  assertProjectId(projectId);

  const nextPatch = {
    ...patch,
    settings: patch.settings ? normalizeSettings(patch.settings) : undefined,
  };

  return apiUpdateProject(projectId, nextPatch);
}

export async function updateProjectStats(
  projectId: string,
  stats: Partial<Pick<TextProject, 'wordCount' | 'progress'>>,
): Promise<TextProject> {
  assertProjectId(projectId);
  return apiUpdateProjectStats(projectId, stats);
}

function normalizeSettings(settings: Partial<TextProjectSettings>): Partial<TextProjectSettings> {
  return {
    ...settings,
    exportFormats: settings.exportFormats ? [...settings.exportFormats] : settings.exportFormats,
    styleTags: settings.styleTags ? [...settings.styleTags] : settings.styleTags,
    reviewRules: settings.reviewRules ? [...settings.reviewRules] : settings.reviewRules,
    projectSetup: settings.projectSetup ? { ...settings.projectSetup } : settings.projectSetup,
  };
}

function assertProjectId(projectId: string): void {
  if (!projectId?.trim()) {
    throw new Error('Project id is required');
  }
}
