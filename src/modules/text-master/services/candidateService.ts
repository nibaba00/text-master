import type {
  GenerationCandidate,
  GenerationCandidateStatus,
  GenerationJobType,
} from '../types/production';
import {
  cloneValue,
  createTextMasterId,
  readCollection,
  runServiceAction,
  writeCollection,
} from './localStorageRepository';

const CANDIDATES_STORAGE_KEY = 'text-master:generation-candidates';
const SERVICE_NAME = 'candidateService';

export type CreateCandidateInput = {
  projectId: string;
  documentId?: string;
  jobId: string;
  type: GenerationJobType;
  title: string;
  content: string;
  provider?: GenerationCandidate['provider'];
};

export async function listCandidates(projectId?: string): Promise<GenerationCandidate[]> {
  return runServiceAction(SERVICE_NAME, 'listCandidates', () =>
    readCandidates()
      .filter((candidate) => !projectId || candidate.projectId === projectId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  );
}

export async function createCandidate(
  input: CreateCandidateInput,
): Promise<GenerationCandidate> {
  return runServiceAction(SERVICE_NAME, 'createCandidate', () => {
    const now = new Date().toISOString();
    const candidates = readCandidates();
    const candidate: GenerationCandidate = {
      id: createTextMasterId('candidate'),
      projectId: input.projectId,
      documentId: input.documentId,
      jobId: input.jobId,
      type: input.type,
      title: input.title.trim() || `${input.type} candidate`,
      content: input.content,
      status: 'pending_review',
      provider: input.provider ?? 'mock',
      createdAt: now,
      updatedAt: now,
    };

    candidates.unshift(candidate);
    writeCandidates(candidates);

    return cloneValue(candidate);
  });
}

export async function updateCandidateStatus(
  candidateId: string,
  status: GenerationCandidateStatus,
): Promise<GenerationCandidate> {
  return runServiceAction(SERVICE_NAME, 'updateCandidateStatus', () => {
    const candidates = readCandidates();
    const index = candidates.findIndex((candidate) => candidate.id === candidateId);

    if (index < 0) {
      throw new Error(`Generation candidate not found: ${candidateId}`);
    }

    candidates[index] = {
      ...candidates[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    writeCandidates(candidates);

    return cloneValue(candidates[index]);
  });
}

function readCandidates(): GenerationCandidate[] {
  return readCollection<GenerationCandidate>(CANDIDATES_STORAGE_KEY, [], SERVICE_NAME);
}

function writeCandidates(candidates: GenerationCandidate[]): void {
  writeCollection(CANDIDATES_STORAGE_KEY, candidates, SERVICE_NAME);
}
