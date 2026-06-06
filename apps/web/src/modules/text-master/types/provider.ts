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

export type ProviderId = 'mock' | 'deepseek' | 'openai' | 'local-model' | 'brain-hub';

export type ProviderConfig = {
  activeProvider: ProviderId;
  deepseek: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
};

export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  activeProvider: 'mock',
  deepseek: {
    apiKey: '',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
};

export type AiPipelineResult = {
  job: GenerationJob;
  candidate: GenerationCandidate;
  issues: ReviewIssue[];
};
