import type { ExportRequest, ExportResult } from '../types/export';
import type { TextDocument, TextDocumentType } from '../types/document';
import type { TextMaterial } from '../types/material';
import type {
  TextProject,
  TextProjectSettings,
  TextProjectType,
} from '../types/project';
import type { TextVersion, TextVersionOperation } from '../types/version';
import type {
  GenerationCandidate,
  GenerationJob,
  ReviewIssue,
} from '../types/production';
import type { WorkspaceType } from '../workflows/types';
import { createSafeBrainHubRuntime } from './BrainHubRuntime';
import { createLocalRuntime } from './LocalRuntime';
import { detectRuntimeMode } from './runtimeDetection';

export const TEXT_MASTER_RUNTIME_VERSION = '0.2.0';

export type RuntimeMode = 'local' | 'brain-hub';

export type RuntimeContext = {
  appId: 'text-master';
  launchSource: RuntimeMode;
  userId?: string;
  workspaceId?: string;
  projectId?: string;
};

export type RuntimeUser = {
  id: string;
  displayName: string;
  source: RuntimeMode;
};

export type RuntimeWorkspace = {
  id: string;
  name: string;
  source: RuntimeMode;
};

export type ProjectCreateInput = {
  title: string;
  type: TextProjectType;
  workflowId?: string;
  workspaceType?: WorkspaceType;
  currentStageId?: string;
  summary?: string;
  settings?: Partial<TextProjectSettings>;
};

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
    | 'settings'
  >
>;

export type DocumentSaveInput = {
  id?: string;
  projectId: string;
  title: string;
  content: string;
  type: TextDocumentType;
};

export type GenerateTextInput = {
  projectId: string;
  documentId: string;
  prompt: string;
  context?: string;
};

export type ReviewTextInput = {
  projectId: string;
  documentId: string;
  text: string;
};

export type RewriteTextInput = {
  projectId: string;
  documentId: string;
  text: string;
  instruction?: string;
};

export type TextGenerationResult = {
  text: string;
  provider: 'mock' | 'deepseek' | 'openai' | 'local-model' | 'brain-hub';
  createdAt: string;
  job?: GenerationJob;
  candidate?: GenerationCandidate;
};

export type TextReviewResult = {
  summary: string;
  issues: string[];
  provider: 'mock' | 'deepseek' | 'openai' | 'local-model' | 'brain-hub';
  createdAt: string;
  job?: GenerationJob;
  candidate?: GenerationCandidate;
  reviewIssues?: ReviewIssue[];
};

export type VersionCreateInput = {
  projectId: string;
  documentId: string;
  operation: TextVersionOperation;
  inputSnapshot: string;
  outputSnapshot: string;
  model?: string;
  createdBy?: string;
};

export type UsageSummary = {
  runtimeMode: RuntimeMode;
  projectCount: number;
  documentCount: number;
  generatedTextCount: number;
  reviewCount: number;
  rewriteCount: number;
  exportCount: number;
  hubConnected: boolean;
};

export type TextMasterRuntime = {
  readonly mode: RuntimeMode;
  readonly context: RuntimeContext;
  getRuntimeMode: () => RuntimeMode;
  getCurrentUser: () => Promise<RuntimeUser | null>;
  getCurrentWorkspace: () => Promise<RuntimeWorkspace | null>;
  listProjects: () => Promise<TextProject[]>;
  createProject: (input: ProjectCreateInput) => Promise<TextProject>;
  updateProject: (
    projectId: string,
    patch: ProjectUpdatePatch,
  ) => Promise<TextProject>;
  listDocuments: (projectId: string) => Promise<TextDocument[]>;
  listMaterials: (projectId: string) => Promise<TextMaterial[]>;
  listVersions: (projectId: string) => Promise<TextVersion[]>;
  listJobs: (projectId?: string) => Promise<GenerationJob[]>;
  listCandidates: (projectId?: string) => Promise<GenerationCandidate[]>;
  listReviewIssues: (projectId?: string) => Promise<ReviewIssue[]>;
  saveDocument: (input: DocumentSaveInput) => Promise<TextDocument>;
  generateText: (input: GenerateTextInput) => Promise<TextGenerationResult>;
  reviewText: (input: ReviewTextInput) => Promise<TextReviewResult>;
  rewriteText: (input: RewriteTextInput) => Promise<TextGenerationResult>;
  createVersion: (input: VersionCreateInput) => Promise<TextVersion>;
  exportProject: (input: ExportRequest) => Promise<ExportResult>;
  getUsageSummary: () => Promise<UsageSummary>;
};

export async function createTextMasterRuntime(): Promise<TextMasterRuntime> {
  return detectRuntimeMode() === 'brain-hub'
    ? createSafeBrainHubRuntime()
    : createLocalRuntime();
}
