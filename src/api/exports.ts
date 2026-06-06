import { apiGet, apiPost } from './client';

export type BackendExportFormat = 'markdown' | 'txt' | 'json';

export type BackendExportRecord = {
  id: string;
  projectId: string;
  format: BackendExportFormat;
  fileName: string;
  downloadUrl: string;
  createdAt: string;
  status: 'ready' | 'failed';
};

export async function createProjectExport(
  projectId: string,
  input: {
    format: BackendExportFormat;
  },
): Promise<BackendExportRecord> {
  return apiPost<BackendExportRecord>(`/projects/${encodeURIComponent(projectId)}/export`, input);
}

export async function listProjectExports(projectId: string): Promise<BackendExportRecord[]> {
  return apiGet<BackendExportRecord[]>(`/projects/${encodeURIComponent(projectId)}/exports`);
}

export async function downloadProjectExport(downloadUrl: string): Promise<string> {
  const response = await fetch(downloadUrl);

  if (!response.ok) {
    throw new Error(`Export download failed with status ${response.status}`);
  }

  return response.text();
}
