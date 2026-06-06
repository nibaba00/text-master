import { randomUUID } from 'node:crypto';
import { getProjectsPath } from '../../config/storagePaths.mjs';
import { readJsonFile, writeJsonFile } from '../../utils/jsonStore.mjs';
import { getWorkflowById, getWorkflowForProjectType } from '../text-types/catalog.mjs';

const projects = loadProjects();

export function listProjects() {
  return projects.slice().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getProject(projectId) {
  return projects.find((project) => project.id === projectId) ?? null;
}

export function createProject(body) {
  const now = new Date().toISOString();
  const type = normalizeTextProjectType(body?.type);
  const workflow = body?.workflowId ? getWorkflowById(body.workflowId) : getWorkflowForProjectType(type);
  const title = normalizeText(body?.title, '未命名项目');

  const project = {
    id: `project-${randomUUID()}`,
    title,
    type,
    workflowId: workflow.id,
    workspaceType: body?.workspaceType ?? workflow.workspaceType,
    currentStageId: body?.currentStageId && workflow.stageIds.includes(body.currentStageId)
      ? body.currentStageId
      : workflow.defaultStageId,
    status: normalizeProjectStatus(body?.status, 'draft'),
    summary: normalizeText(body?.summary, ''),
    wordCount: 0,
    progress: 0,
    createdAt: now,
    updatedAt: now,
    settings: createSettings(body?.settings),
  };

  projects.unshift(project);
  saveProjects();
  return project;
}

export function updateProject(project, patch = {}) {
  const requestedType = normalizeTextProjectType(patch.type ?? project.type);
  const workflow = patch.workflowId ? getWorkflowById(patch.workflowId) : getWorkflowById(project.workflowId);
  const nextProject = {
    ...project,
    ...patch,
    type: requestedType,
    workflowId: workflow.id,
    workspaceType: patch.workspaceType ?? workflow.workspaceType,
    currentStageId: patch.currentStageId && workflow.stageIds.includes(patch.currentStageId)
      ? patch.currentStageId
      : project.currentStageId,
    status: normalizeProjectStatus(patch.status, project.status),
    title: typeof patch.title === 'string' && patch.title.trim() ? patch.title.trim() : project.title,
    summary: typeof patch.summary === 'string' ? patch.summary.trim() : project.summary,
    wordCount: typeof patch.wordCount === 'number' ? Math.max(0, Math.round(patch.wordCount)) : project.wordCount,
    progress: typeof patch.progress === 'number' ? clampProgress(patch.progress) : project.progress,
    updatedAt: new Date().toISOString(),
    settings:
      patch.settings && typeof patch.settings === 'object'
        ? createSettings({ ...project.settings, ...patch.settings })
        : project.settings,
  };

  replaceProject(nextProject);
  return nextProject;
}

export function replaceProject(nextProject) {
  const index = projects.findIndex((project) => project.id === nextProject.id);

  if (index >= 0) {
    projects[index] = nextProject;
  } else {
    projects.unshift(nextProject);
  }

  saveProjects();
}

export function getProjectWorkflow(project) {
  const workflow = getWorkflowById(project.workflowId);

  return {
    projectId: project.id,
    workflow: {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      workspaceType: workflow.workspaceType,
      defaultStageId: workflow.defaultStageId,
      stageIds: workflow.stageIds,
      exportTargets: workflow.exportTargets,
    },
    currentStageId: project.currentStageId,
  };
}

function seedProjects() {
  const now = new Date().toISOString();

  return [
    createSeedProject({
      id: 'project-drama-demo',
      title: '便利店夜班',
      type: 'short_drama',
      summary: '短剧项目示例，包含分集大纲和脚本草稿。',
      progress: 32,
      wordCount: 1200,
      createdAt: now,
      updatedAt: now,
    }),
    createSeedProject({
      id: 'project-doc-demo',
      title: '产品需求文档',
      type: 'document',
      summary: '项目文档示例，包含需求和方案结构。',
      progress: 54,
      wordCount: 1860,
      createdAt: now,
      updatedAt: now,
    }),
    createSeedProject({
      id: 'project-copy-demo',
      title: 'AI 写作工具发布文案',
      type: 'business_copy',
      summary: '商业文案示例，用于产品发布传播。',
      progress: 18,
      wordCount: 680,
      createdAt: now,
      updatedAt: now,
    }),
  ];
}

function loadProjects() {
  const storedProjects = readJsonFile(getProjectsPath(), null);

  if (Array.isArray(storedProjects)) {
    return storedProjects.map(normalizeProject).filter(Boolean);
  }

  const seededProjects = seedProjects();
  writeJsonFile(getProjectsPath(), seededProjects);
  return seededProjects;
}

function saveProjects() {
  writeJsonFile(getProjectsPath(), projects);
}

function normalizeProject(project) {
  if (!project || typeof project !== 'object' || typeof project.id !== 'string') {
    return null;
  }

  const type = normalizeTextProjectType(project.type);
  const workflow = project.workflowId ? getWorkflowById(project.workflowId) : getWorkflowForProjectType(type);

  return {
    id: project.id,
    title: normalizeText(project.title, '未命名项目'),
    type,
    workflowId: workflow.id,
    workspaceType: project.workspaceType ?? workflow.workspaceType,
    currentStageId:
      typeof project.currentStageId === 'string' && workflow.stageIds.includes(project.currentStageId)
        ? project.currentStageId
        : workflow.defaultStageId,
    status: normalizeProjectStatus(project.status, 'draft'),
    summary: normalizeText(project.summary, ''),
    wordCount: typeof project.wordCount === 'number' ? Math.max(0, Math.round(project.wordCount)) : 0,
    progress: typeof project.progress === 'number' ? clampProgress(project.progress) : 0,
    createdAt: typeof project.createdAt === 'string' ? project.createdAt : new Date().toISOString(),
    updatedAt: typeof project.updatedAt === 'string' ? project.updatedAt : new Date().toISOString(),
    settings: createSettings(project.settings),
  };
}

function createSeedProject(seed) {
  const workflow = getWorkflowForProjectType(seed.type);

  return {
    id: seed.id,
    title: seed.title,
    type: seed.type,
    workflowId: workflow.id,
    workspaceType: workflow.workspaceType,
    currentStageId: workflow.defaultStageId,
    status: 'in_progress',
    summary: seed.summary,
    wordCount: seed.wordCount,
    progress: seed.progress,
    createdAt: seed.createdAt,
    updatedAt: seed.updatedAt,
    settings: createSettings(),
  };
}

function createSettings(settings = {}) {
  return {
    language: typeof settings.language === 'string' ? settings.language : 'zh-CN',
    targetAudience: typeof settings.targetAudience === 'string' ? settings.targetAudience : '默认受众',
    tone: typeof settings.tone === 'string' ? settings.tone : '专业',
    defaultModel: typeof settings.defaultModel === 'string' ? settings.defaultModel : 'mock-model',
    autoSave: typeof settings.autoSave === 'boolean' ? settings.autoSave : true,
    exportFormats: Array.isArray(settings.exportFormats) ? settings.exportFormats : ['markdown', 'txt', 'json'],
    templateId: typeof settings.templateId === 'string' ? settings.templateId : '',
    styleTags: Array.isArray(settings.styleTags) ? settings.styleTags : [],
    generationStrategy: normalizeGenerationStrategy(settings.generationStrategy),
    reviewRules: Array.isArray(settings.reviewRules) ? settings.reviewRules : [],
    projectSetup: settings.projectSetup && typeof settings.projectSetup === 'object' ? settings.projectSetup : {},
  };
}

function normalizeTextProjectType(value) {
  if (
    [
      'novel',
      'short_drama',
      'business_copy',
      'xiaohongshu',
      'business_bp',
      'investment_copy',
      'document',
      'custom',
    ].includes(value)
  ) {
    return value;
  }

  return 'short_drama';
}

function normalizeProjectStatus(value, fallback) {
  return ['draft', 'in_progress', 'reviewing', 'completed', 'exported', 'archived'].includes(value) ? value : fallback;
}

function normalizeGenerationStrategy(value) {
  return ['faithful', 'expand', 'rebuild'].includes(value) ? value : 'expand';
}

function normalizeText(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function clampProgress(progress) {
  if (Number.isNaN(progress)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(progress)));
}
