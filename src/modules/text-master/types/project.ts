import type { WorkspaceType } from '../workflows/types';

export type TextProjectType =
  | 'novel'
  | 'short_drama'
  | 'business_copy'
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
