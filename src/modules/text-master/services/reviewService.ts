import type { ReviewIssue } from '../types/production';
import {
  cloneValue,
  createTextMasterId,
  readCollection,
  runServiceAction,
  writeCollection,
} from './localStorageRepository';

const REVIEW_ISSUES_STORAGE_KEY = 'text-master:review-issues';
const SERVICE_NAME = 'reviewService';

export type CreateReviewIssueInput = Omit<
  ReviewIssue,
  'id' | 'status' | 'createdAt' | 'updatedAt'
> & {
  status?: ReviewIssue['status'];
};

export async function listReviewIssues(projectId?: string): Promise<ReviewIssue[]> {
  return runServiceAction(SERVICE_NAME, 'listReviewIssues', () =>
    readIssues()
      .filter((issue) => !projectId || issue.projectId === projectId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  );
}

export async function createReviewIssue(
  input: CreateReviewIssueInput,
): Promise<ReviewIssue> {
  return runServiceAction(SERVICE_NAME, 'createReviewIssue', () => {
    const now = new Date().toISOString();
    const issues = readIssues();
    const issue: ReviewIssue = {
      id: createTextMasterId('review'),
      ...input,
      status: input.status ?? 'open',
      createdAt: now,
      updatedAt: now,
    };

    issues.unshift(issue);
    writeIssues(issues);

    return cloneValue(issue);
  });
}

export async function updateReviewIssueStatus(
  issueId: string,
  status: ReviewIssue['status'],
): Promise<ReviewIssue> {
  return runServiceAction(SERVICE_NAME, 'updateReviewIssueStatus', () => {
    const issues = readIssues();
    const index = issues.findIndex((issue) => issue.id === issueId);

    if (index < 0) {
      throw new Error(`Review issue not found: ${issueId}`);
    }

    issues[index] = {
      ...issues[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    writeIssues(issues);

    return cloneValue(issues[index]);
  });
}

function readIssues(): ReviewIssue[] {
  return readCollection<ReviewIssue>(REVIEW_ISSUES_STORAGE_KEY, [], SERVICE_NAME);
}

function writeIssues(issues: ReviewIssue[]): void {
  writeCollection(REVIEW_ISSUES_STORAGE_KEY, issues, SERVICE_NAME);
}
