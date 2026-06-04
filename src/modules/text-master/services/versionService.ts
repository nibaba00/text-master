import { mockVersions } from '../mock/mockVersions';
import type { TextVersion, TextVersionOperation } from '../types/version';
import {
  cloneValue,
  createTextMasterId,
  readCollection,
  runServiceAction,
  writeCollection,
} from './localStorageRepository';
import { getDocument } from './documentService';
import { getProject } from './projectService';

const VERSIONS_STORAGE_KEY = 'text-master:versions';
const SERVICE_NAME = 'versionService';

export async function listVersions(projectId?: string): Promise<TextVersion[]> {
  return runServiceAction(SERVICE_NAME, 'listVersions', () =>
    readVersions()
      .filter((version) => !projectId || version.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
}

export async function listDocumentVersions(
  documentId: string,
): Promise<TextVersion[]> {
  return runServiceAction(SERVICE_NAME, 'listDocumentVersions', () => {
    assertDocumentId(documentId);

    return readVersions()
      .filter((version) => version.documentId === documentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}

export type CreateVersionInput = {
  projectId: string;
  documentId: string;
  operation: TextVersionOperation;
  inputSnapshot: string;
  outputSnapshot: string;
  model?: string;
  createdBy?: string;
};

export async function createVersion(
  input: CreateVersionInput,
): Promise<TextVersion> {
  return runServiceAction(SERVICE_NAME, 'createVersion', async () => {
    assertProjectId(input.projectId);
    assertDocumentId(input.documentId);

    const [project, document] = await Promise.all([
      getProject(input.projectId),
      getDocument(input.documentId),
    ]);

    if (!project) {
      throw new Error(`Project not found: ${input.projectId}`);
    }

    if (!document) {
      throw new Error(`Document not found: ${input.documentId}`);
    }

    const versions = readVersions();
    const version: TextVersion = {
      id: createTextMasterId('version'),
      projectId: input.projectId,
      documentId: input.documentId,
      operation: input.operation,
      inputSnapshot: input.inputSnapshot,
      outputSnapshot: input.outputSnapshot,
      model: input.model ?? 'mock-local',
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy ?? 'local-user',
    };

    versions.unshift(version);
    writeVersions(versions);

    return cloneValue(version);
  });
}

function readVersions(): TextVersion[] {
  return readCollection<TextVersion>(
    VERSIONS_STORAGE_KEY,
    mockVersions,
    SERVICE_NAME,
  );
}

function writeVersions(versions: TextVersion[]): void {
  writeCollection(VERSIONS_STORAGE_KEY, versions, SERVICE_NAME);
}

function assertProjectId(projectId: string): void {
  if (!projectId?.trim()) {
    throw new Error('Project id is required');
  }
}

function assertDocumentId(documentId: string): void {
  if (!documentId?.trim()) {
    throw new Error('Document id is required');
  }
}
