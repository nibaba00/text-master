export type ExportFormat = 'markdown' | 'txt' | 'json';

export type ExportRequest = {
  projectId: string;
  documentId?: string;
  format: ExportFormat;
  fileName: string;
  content: string;
};

export type ExportResult = {
  id: string;
  projectId: string;
  format: ExportFormat;
  fileName: string;
  content: string;
  createdAt: string;
};
