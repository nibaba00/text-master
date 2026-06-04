import type { ExportRequest, ExportResult } from '../types/export';

export async function exportProject(
  request: ExportRequest,
): Promise<ExportResult> {
  return {
    id: `export-${Date.now()}`,
    projectId: request.projectId,
    format: request.format,
    fileName: request.fileName,
    content: request.content,
    createdAt: new Date().toISOString(),
  };
}
