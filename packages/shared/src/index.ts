export type WorkspaceType =
  | 'short-video-script'
  | 'comic-drama-outline'
  | 'business-copy'
  | 'generic-text';

export type WorkflowStageComponent =
  | 'generic'
  | 'short-video'
  | 'comic-drama'
  | 'business-copy';

export type WorkflowActionType =
  | 'generate'
  | 'rewrite'
  | 'review'
  | 'outline'
  | 'export';

export interface WorkflowAction {
  id: string;
  label: string;
  type: WorkflowActionType;
  description?: string;
  primary?: boolean;
}

export interface WorkflowStage {
  id: string;
  title: string;
  description: string;
  component: WorkflowStageComponent;
  requiredInputs: string[];
  outputs: string[];
  aiActions: WorkflowAction[];
}

export interface WorkflowSpec {
  id: string;
  name: string;
  description: string;
  workspaceType: WorkspaceType;
  stages: WorkflowStage[];
  defaultStageId: string;
  exportTargets: Array<'markdown' | 'txt' | 'json' | 'media-master-json'>;
}

export type WorkflowStep = WorkflowStage;
export type WorkflowStepStatus = 'idle' | 'pending' | 'running' | 'completed' | 'failed';

export type WorkflowNode = {
  id: string;
  label: string;
  stageId: string;
  component: WorkflowStageComponent;
  nextNodeIds: string[];
};

export type WorkflowRun = {
  id: string;
  projectId: string;
  workflowId: string;
  currentStepId: string;
  status: 'draft' | 'running' | 'succeeded' | 'failed' | 'archived';
  createdAt: string;
  updatedAt: string;
  nodes: WorkflowNode[];
};

export type TextProjectType =
  | 'novel'
  | 'short_drama'
  | 'business_copy'
  | 'xiaohongshu'
  | 'business_bp'
  | 'investment_copy'
  | 'document'
  | 'custom';

export type TextProjectStatus =
  | 'draft'
  | 'in_progress'
  | 'reviewing'
  | 'completed'
  | 'exported'
  | 'archived';

export type TextProjectSettings = {
  language: string;
  targetAudience: string;
  tone: string;
  defaultModel: string;
  autoSave: boolean;
  exportFormats: Array<'markdown' | 'txt' | 'json'>;
  templateId?: string;
  styleTags?: string[];
  generationStrategy?: 'faithful' | 'expand' | 'rebuild';
  reviewRules?: string[];
  projectSetup?: Record<string, string>;
};

export type TextProject = {
  id: string;
  title: string;
  type: TextProjectType;
  workflowId: string;
  workspaceType: WorkspaceType;
  currentStageId: string;
  status: TextProjectStatus;
  summary: string;
  wordCount: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
  settings: TextProjectSettings;
};

export type TextProjectCreateInput = {
  title: string;
  type: TextProjectType;
  workflowId?: string;
  workspaceType?: WorkspaceType;
  currentStageId?: string;
  summary?: string;
  status?: TextProjectStatus;
  settings?: Partial<TextProjectSettings>;
};

export type TextTypeCategory =
  | 'drama'
  | 'fiction'
  | 'marketing'
  | 'documentation'
  | 'social'
  | 'academic'
  | 'translation'
  | 'custom';

export type TextTypeWorkflowTemplate = {
  id: string;
  name: string;
  workspaceType: WorkspaceType;
  workflowId: string;
  defaultStageId: string;
  stageIds: string[];
  exportTargets: WorkflowSpec['exportTargets'];
};

export type TextType = {
  id: string;
  label: string;
  category: TextTypeCategory;
  description: string;
  workflowTemplate: TextTypeWorkflowTemplate;
};

export type GenerationTaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';

export type GenerationRequest = {
  projectId: string;
  documentId?: string;
  prompt: string;
  context?: string;
};

export type GenerationResult = {
  taskId: string;
  status: GenerationTaskStatus;
  output?: string;
  updatedAt: string;
  errorMessage?: string;
};

export type GenerationTask = {
  id: string;
  projectId: string;
  providerId?: string;
  request: GenerationRequest;
  status: GenerationTaskStatus;
  createdAt: string;
  updatedAt: string;
  result?: GenerationResult;
};

export type ApiResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type PaginatedResponse<T> = {
  success: true;
  data: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type SharedPackageMarker = {
  readonly package: 'text-master-shared';
};
