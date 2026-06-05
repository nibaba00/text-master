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

  const versionSummaries = versions.map((version) => ({
    id: version.id,
    documentId: version.documentId,
    operation: version.operation,
    model: version.model,
    createdAt: version.createdAt,
    createdBy: version.createdBy,
  }));

  const exportMeta = {
    format: request.format,
    fileName: request.fileName,
    contentScope: request.contentScope ?? ['project', 'documents', 'versions'],
    createdAt: new Date().toISOString(),
  };

  // --- Project Package JSON ---
  if (request.format === 'project-package-json') {
    const exportRecords = await listExportRecords(request.projectId);
    return JSON.stringify(
      {
        sourceApp: 'text-master',
        project,
        settings: project.settings,
        materials,
        documents,
        versions: versionSummaries,
        reviewIssues,
        exportRecords,
        exportMeta,
      },
      null,
      2,
    );
  }

  // --- Media Master JSON ---
  if (request.format === 'media-master-json') {
    const briefDoc = documents.find((d) => d.type === 'brief');
    const outlineDoc = documents.find((d) => d.type === 'outline');
    const characterMaterials = materials.filter(
      (m) => m.type === 'character' || (m.title && m.title.includes('角色')),
    );
    const worldMaterials = materials.filter(
      (m) => m.type === 'worldbuilding' || (m.title && m.title.includes('世界观')),
    );

    return JSON.stringify(
      {
        sourceApp: 'text-master',
        projectTitle: project.title,
        storyBrief: briefDoc?.content ?? project.summary ?? '',
        characters: characterMaterials.map((m) => ({ name: m.title, description: m.content })),
        worldbuilding: worldMaterials.map((m) => ({ aspect: m.title, detail: m.content })),
        episodeOutlines: outlineDoc?.content ?? '',
        scenes: documents
          .filter((d) => d.type === 'episode' || d.type === 'chapter')
          .map((d) => ({ title: d.title, content: d.content })),
        dialogues: [],
        narratorText: '',
        exportMeta,
      },
      null,
      2,
    );
  }

  // --- Novel Master JSON ---
  if (request.format === 'novel-master-json') {
    const briefDoc = documents.find((d) => d.type === 'brief');
    const outlineDoc = documents.find((d) => d.type === 'outline');
    const characterMaterials = materials.filter(
      (m) => m.type === 'character' || (m.title && m.title.includes('角色')),
    );
    const worldMaterials = materials.filter(
      (m) => m.type === 'worldbuilding' || (m.title && m.title.includes('世界观')),
    );
    const chapterDocs = documents.filter((d) => d.type === 'chapter');
    const foreshadowingMaterials = materials.filter(
      (m) => m.title && m.title.includes('伏笔'),
    );

    return JSON.stringify(
      {
        sourceApp: 'text-master',
        projectTitle: project.title,
        novelSettings: project.settings,
        worldbuilding: worldMaterials.map((m) => ({ aspect: m.title, detail: m.content })),
        characters: characterMaterials.map((m) => ({ name: m.title, description: m.content })),
        volumeOutline: outlineDoc?.content ?? '',
        chapterOutlines: chapterDocs.map((d) => ({ title: d.title, outline: '' })),
        chapterDrafts: chapterDocs.map((d) => ({ title: d.title, content: d.content })),
        foreshadowingNotes: foreshadowingMaterials.map((m) => ({ note: m.title, detail: m.content })),
        exportMeta,
      },
      null,
      2,
    );
  }

  // --- Standard JSON / Text Master JSON ---
  if (request.format === 'json' || request.format === 'text-master-json') {
    const payload = {
      sourceApp: 'text-master',
      project,
      settings: project.settings,
      materials,
      documents,
      versions: versionSummaries,
      reviewIssues,
      exportMeta,
    };
    return JSON.stringify(payload, null, 2);
  }

  // --- Markdown / TXT ---
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
