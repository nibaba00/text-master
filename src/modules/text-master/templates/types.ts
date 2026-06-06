import type { ExportFormat } from '../types/export';
import type { TextProjectType } from '../types/project';
import type { WorkspaceType } from '../workflows/types';

export type TemplateCategory =
  | 'novel'
  | 'short_drama'
  | 'business_copy'
  | 'document'
  | 'xiaohongshu'
  | 'readme';

export type TemplateTargetApp = 'text-master' | 'media-master' | 'story-forge';

export type TemplateSpec = {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  inputSchema: string[];
  promptRecipe: string[];
  outputSchema: string[];
  exportFormats: ExportFormat[];
  targetApp: TemplateTargetApp;
  workflowId: string;
  workspaceType: WorkspaceType;
  projectType: TextProjectType;
  summary: string;
  scenario: string;
  output: string;
  tags: string[];
  mockParams: Record<string, string>;
};
