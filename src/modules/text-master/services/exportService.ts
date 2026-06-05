import type { ExportRecord, ExportRequest, ExportResult } from '../types/export';
import { listDocuments } from './documentService';
import {
  cloneValue,
  createTextMasterId,
  readCollection,
  runServiceAction,
  writeCollection,
} from './localStorageRepository';
import { listMaterials } from './materialService';
import { getProject } from './projectService';
import { listReviewIssues } from './reviewService';
import { listVersions } from './versionService';

const EXPORT_RECORDS_STORAGE_KEY = 'text-master:export-records';
const SERVICE_NAME = 'exportService';

export async function exportProject(
  request: ExportRequest,
): Promise<ExportResult> {
  return runServiceAction(SERVICE_NAME, 'exportProject', async () => {
    const content = request.content ?? (await renderExportContent(request));
    const result: ExportResult = {
      id: createTextMasterId('export'),
      projectId: request.projectId,
      format: request.format,
      fileName: request.fileName,
      content,
      createdAt: new Date().toISOString(),
    };

    await createExportRecord({
      ...result,
      documentId: request.documentId,
      contentScope: request.contentScope ?? ['project', 'documents', 'versions'],
    });

    return result;
  });
}

export async function listExportRecords(projectId?: string): Promise<ExportRecord[]> {
  return runServiceAction(SERVICE_NAME, 'listExportRecords', () =>
    readExportRecords()
      .filter((record) => !projectId || record.projectId === projectId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
  );
}

export async function createExportRecord(record: ExportRecord): Promise<ExportRecord> {
  return runServiceAction(SERVICE_NAME, 'createExportRecord', () => {
    const records = readExportRecords();
    records.unshift(record);
    writeExportRecords(records);
    return cloneValue(record);
  });
}

export async function renderExportContent(request: ExportRequest): Promise<string> {
  const [project, documents, materials, versions, reviewIssues] = await Promise.all([
    getProject(request.projectId),
    listDocuments(request.projectId),
    listMaterials(request.projectId),
    listVersions(request.projectId),
    listReviewIssues(request.projectId),
  ]);

  if (!project) {
    throw new Error(`Project not found: ${request.projectId}`);
  }

  const payload = {
    sourceApp: 'text-master',
    project,
    settings: project.settings,
    materials,
    documents,
    versions: versions.map((version) => ({
      id: version.id,
      documentId: version.documentId,
      operation: version.operation,
      model: version.model,
      createdAt: version.createdAt,
      createdBy: version.createdBy,
    })),
    reviewIssues,
    exportMeta: {
      format: request.format,
      fileName: request.fileName,
      contentScope: request.contentScope ?? ['project', 'documents', 'versions'],
      createdAt: new Date().toISOString(),
    },
  };

  if (
    request.format === 'json' ||
    request.format === 'text-master-json' ||
    request.format === 'media-master-json' ||
    request.format === 'novel-master-json'
  ) {
    const crossAppPayload =
      request.format === 'media-master-json'
        ? { ...payload, targetApp: 'media-master', mediaPlan: { scenes: [], assets: [] } }
        : request.format === 'novel-master-json'
          ? { ...payload, targetApp: 'novel-master', novelPlan: { chapters: [], arcs: [] } }
          : payload;

    return JSON.stringify(crossAppPayload, null, 2);
  }

  const markdown = [
    `# ${project.title}`,
    '',
    project.summary,
    '',
    '## 项目设定',
    '',
    JSON.stringify(project.settings, null, 2),
    '',
    '## 资料库',
    '',
    ...materials.map((material) => `### ${material.title}\n\n${material.content}`),
    '',
    '## 文档',
    '',
    ...documents.map((document) => `### ${document.title}\n\n${document.content}`),
    '',
    '## 审核问题',
    '',
    ...reviewIssues.map((issue) => `- [${issue.level}] ${issue.problem}：${issue.suggestion}`),
    '',
    '## 版本摘要',
    '',
    ...versions.map((version) => `- ${version.operation} / ${version.model} / ${version.createdAt}`),
  ].join('\n');

  return request.format === 'txt'
    ? markdown.replace(/^#{1,6}\s+/gm, '').replace(/```/g, '')
    : markdown;
}

function readExportRecords(): ExportRecord[] {
  return readCollection<ExportRecord>(EXPORT_RECORDS_STORAGE_KEY, [], SERVICE_NAME);
}

function writeExportRecords(records: ExportRecord[]): void {
  writeCollection(EXPORT_RECORDS_STORAGE_KEY, records, SERVICE_NAME);
}
