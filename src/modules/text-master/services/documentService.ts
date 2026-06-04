import { mockDocuments } from '../mock/mockDocuments';
import type { TextDocument, TextDocumentType } from '../types/document';
import {
  cloneValue,
  countTextWords,
  createTextMasterId,
  readCollection,
  runServiceAction,
  writeCollection,
} from './localStorageRepository';
import { getProject, updateProjectStats } from './projectService';

const DOCUMENTS_STORAGE_KEY = 'text-master:documents';
const SERVICE_NAME = 'documentService';

export async function listDocuments(projectId?: string): Promise<TextDocument[]> {
  return runServiceAction(SERVICE_NAME, 'listDocuments', () =>
    readDocuments()
      .filter((document) => !projectId || document.projectId === projectId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );
}

export async function getDocument(
  documentId: string,
): Promise<TextDocument | null> {
  return runServiceAction(SERVICE_NAME, 'getDocument', () => {
    assertDocumentId(documentId);

    return readDocuments().find((item) => item.id === documentId) ?? null;
  });
}

export type SaveDocumentInput = {
  id?: string;
  projectId: string;
  title: string;
  type: TextDocumentType;
  content: string;
  createdAt?: string;
};

export async function saveDocument(
  input: TextDocument | SaveDocumentInput,
): Promise<TextDocument> {
  return runServiceAction(SERVICE_NAME, 'saveDocument', async () => {
    assertProjectId(input.projectId);

    const project = await getProject(input.projectId);

    if (!project) {
      throw new Error(`Project not found: ${input.projectId}`);
    }

    const title = input.title.trim();

    if (!title) {
      throw new Error('Document title is required');
    }

    const now = new Date().toISOString();
    const documents = readDocuments();
    const existing = input.id
      ? documents.find((item) => item.id === input.id)
      : undefined;
    const nextDocument: TextDocument = {
      id: input.id ?? createTextMasterId('document'),
      projectId: input.projectId,
      title,
      type: input.type,
      content: input.content,
      wordCount: countTextWords(input.content),
      createdAt: existing?.createdAt ?? input.createdAt ?? now,
      updatedAt: now,
    };
    const index = documents.findIndex((item) => item.id === nextDocument.id);

    if (index >= 0) {
      documents[index] = nextDocument;
    } else {
      documents.unshift(nextDocument);
    }

    writeDocuments(documents);
    await refreshProjectWordCount(input.projectId);

    return cloneValue(nextDocument);
  });
}

function readDocuments(): TextDocument[] {
  return readCollection<TextDocument>(
    DOCUMENTS_STORAGE_KEY,
    mockDocuments,
    SERVICE_NAME,
  ).map(normalizeDocument);
}

function writeDocuments(documents: TextDocument[]): void {
  writeCollection(
    DOCUMENTS_STORAGE_KEY,
    documents.map(normalizeDocument),
    SERVICE_NAME,
  );
}

function normalizeDocument(document: TextDocument): TextDocument {
  return {
    ...document,
    title: document.title.trim(),
    content: document.content ?? '',
    wordCount: countTextWords(document.content ?? ''),
  };
}

async function refreshProjectWordCount(projectId: string): Promise<void> {
  const projectDocuments = readDocuments().filter(
    (document) => document.projectId === projectId && document.type !== 'review',
  );
  const wordCount = projectDocuments.reduce(
    (total, document) => total + document.wordCount,
    0,
  );

  await updateProjectStats(projectId, { wordCount });
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
