import { randomUUID } from 'node:crypto';
import { getExportsPath } from '../../config/storagePaths.mjs';
import { readJsonFile, writeJsonFile } from '../../utils/jsonStore.mjs';

const exportsStore = loadExports();

export function listExportRecords(projectId) {
  return Array.from(exportsStore.values())
    .filter((record) => !projectId || record.projectId === projectId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function createExportRecord(project, body) {
  const now = new Date().toISOString();
  const format = normalizeExportFormat(body?.format);
  const fileName = getExportFileName(project, format);
  const record = {
    id: `export-${randomUUID()}`,
    projectId: project.id,
    format,
    fileName,
    downloadUrl: `/api/projects/${encodeURIComponent(project.id)}/exports/${encodeURIComponent(format)}`,
    createdAt: now,
    status: 'ready',
  };

  exportsStore.set(record.id, record);
  saveExports();
  return record;
}

export function getExportContent(project, format) {
  const normalizedFormat = normalizeExportFormat(format);
  const fileName = getExportFileName(project, normalizedFormat);

  if (normalizedFormat === 'json') {
    return {
      fileName,
      contentType: 'application/json; charset=utf-8',
      content: JSON.stringify({ project, exportedAt: new Date().toISOString() }, null, 2),
    };
  }

  if (normalizedFormat === 'txt') {
    return {
      fileName,
      contentType: 'text/plain; charset=utf-8',
      content: `${project.title}\n\n${project.summary}\n\n字数：${project.wordCount}\n进度：${project.progress}%\n`,
    };
  }

  return {
    fileName,
    contentType: 'text/markdown; charset=utf-8',
    content: `# ${project.title}\n\n${project.summary}\n\n- 字数：${project.wordCount}\n- 进度：${project.progress}%\n`,
  };
}

function normalizeExportFormat(format) {
  return ['markdown', 'txt', 'json'].includes(format) ? format : 'markdown';
}

function getExportFileName(project, format) {
  const extension = format === 'json' ? 'json' : format === 'txt' ? 'txt' : 'md';
  const safeTitle = project.title.replace(/[\\/:*?"<>|]/g, '_');
  return `${safeTitle}.${extension}`;
}

function loadExports() {
  const storedRecords = readJsonFile(getExportsPath(), []);
  const records = Array.isArray(storedRecords) ? storedRecords : [];
  const normalizedRecords = records.map(normalizeExportRecord).filter(Boolean);

  return new Map(normalizedRecords.map((record) => [record.id, record]));
}

function saveExports() {
  writeJsonFile(getExportsPath(), Array.from(exportsStore.values()));
}

function normalizeExportRecord(record) {
  if (!record || typeof record !== 'object' || typeof record.id !== 'string') {
    return null;
  }

  const format = normalizeExportFormat(record.format);
  const projectId = typeof record.projectId === 'string' ? record.projectId : '';
  const fileName =
    typeof record.fileName === 'string' && record.fileName.trim()
      ? record.fileName.trim()
      : `export.${format === 'json' ? 'json' : format === 'txt' ? 'txt' : 'md'}`;

  return {
    id: record.id,
    projectId,
    format,
    fileName,
    downloadUrl:
      typeof record.downloadUrl === 'string' && record.downloadUrl.trim()
        ? record.downloadUrl.trim()
        : `/api/projects/${encodeURIComponent(projectId)}/exports/${encodeURIComponent(format)}`,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
    status: record.status === 'failed' ? 'failed' : 'ready',
  };
}
