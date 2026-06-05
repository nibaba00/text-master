import type {
  GenerationCandidate,
  GenerationJob,
  GenerationJobType,
  ReviewIssue,
} from './production';

export type TextModelProviderRequest = {
  projectId: string;
  documentId?: string;
  type: GenerationJobType;
  prompt: string;
  context?: string;
};

export type TextModelProviderResult = {
  content: string;
  issues?: Array<Pick<ReviewIssue, 'level' | 'type' | 'range' | 'problem' | 'suggestion' | 'canAutoFix'>>;
  metadata?: Record<string, unknown>;
};

export type TextModelProvider = {
  id: 'mock' | 'deepseek' | 'openai' | 'local-model' | 'brain-hub';
  label: string;
  available: boolean;
  run: (request: TextModelProviderRequest) => Promise<TextModelProviderResult>;
};

export type AiPipelineResult = {
  job: GenerationJob;
  candidate: GenerationCandidate;
  issues: ReviewIssue[];
};
