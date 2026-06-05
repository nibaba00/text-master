export type GenerationJobType =
  | 'outline'
  | 'content'
  | 'continue'
  | 'rewrite'
  | 'review'
  | 'repair';

export type GenerationJobStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type GenerationJob = {
  id: string;
  projectId: string;
  documentId?: string;
  type: GenerationJobType;
  status: GenerationJobStatus;
  inputJson: Record<string, unknown>;
  outputJson?: Record<string, unknown>;
  error?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
};

export type GenerationCandidateStatus =
  | 'pending_review'
  | 'applied'
  | 'discarded'
  | 'saved_as_version';

export type GenerationCandidate = {
  id: string;
  projectId: string;
  documentId?: string;
  jobId: string;
  type: GenerationJobType;
  title: string;
  content: string;
  status: GenerationCandidateStatus;
  provider: 'mock' | 'deepseek' | 'openai' | 'local-model' | 'brain-hub';
  createdAt: string;
  updatedAt: string;
};

export type ReviewIssueLevel = 'info' | 'warning' | 'risk';

export type ReviewIssueStatus = 'open' | 'ignored' | 'fixed';

export type ReviewIssue = {
  id: string;
  projectId: string;
  documentId: string;
  candidateId?: string;
  level: ReviewIssueLevel;
  type: string;
  range?: string;
  problem: string;
  suggestion: string;
  canAutoFix: boolean;
  status: ReviewIssueStatus;
  createdAt: string;
  updatedAt: string;
};
