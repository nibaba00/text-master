import type {
  GenerationJob,
  GenerationJobStatus,
  GenerationJobType,
} from '../types/production';
import {
  cloneValue,
  createTextMasterId,
  readCollection,
  runServiceAction,
  writeCollection,
} from './localStorageRepository';

const JOBS_STORAGE_KEY = 'text-master:generation-jobs';
const SERVICE_NAME = 'jobService';

export type CreateJobInput = {
  projectId: string;
  documentId?: string;
  type: GenerationJobType;
  inputJson: Record<string, unknown>;
};

export async function listJobs(projectId?: string): Promise<GenerationJob[]> {
  return runServiceAction(SERVICE_NAME, 'listJobs', () =>
    readJobs()
      .filter((job) => !projectId || job.projectId === projectId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  );
}

export async function createJob(input: CreateJobInput): Promise<GenerationJob> {
  return runServiceAction(SERVICE_NAME, 'createJob', () => {
    const now = new Date().toISOString();
    const jobs = readJobs();
    const job: GenerationJob = {
      id: createTextMasterId('job'),
      projectId: input.projectId,
      documentId: input.documentId,
      type: input.type,
      status: 'pending',
      inputJson: input.inputJson,
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    jobs.unshift(job);
    writeJobs(jobs);

    return cloneValue(job);
  });
}

export async function updateJob(
  jobId: string,
  patch: Partial<Pick<GenerationJob, 'outputJson' | 'error'>> & {
    status?: GenerationJobStatus;
    retryCount?: number;
  },
): Promise<GenerationJob> {
  return runServiceAction(SERVICE_NAME, 'updateJob', () => {
    const jobs = readJobs();
    const index = jobs.findIndex((job) => job.id === jobId);

    if (index < 0) {
      throw new Error(`Generation job not found: ${jobId}`);
    }

    jobs[index] = {
      ...jobs[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    writeJobs(jobs);

    return cloneValue(jobs[index]);
  });
}

function readJobs(): GenerationJob[] {
  return readCollection<GenerationJob>(JOBS_STORAGE_KEY, [], SERVICE_NAME);
}

function writeJobs(jobs: GenerationJob[]): void {
  writeCollection(JOBS_STORAGE_KEY, jobs, SERVICE_NAME);
}
