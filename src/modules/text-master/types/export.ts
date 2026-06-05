export type ExportFormat =
  | 'markdown'
  | 'txt'
  | 'json'
  | 'text-master-json'
  | 'media-master-json'
  | 'novel-master-json'
  | 'project-package-json';

export type ExportRequest = {
  projectId: string;
  documentId?: string;
  format: ExportFormat;
  fileName: string;
  content?: string;
  contentScope?: string[];
};

export type ExportResult = {
  id: string;
  projectId: string;
  format: ExportFormat;
  fileName: string;
  content: string;
  createdAt: string;
};

export type ExportRecord = ExportResult & {
  documentId?: string;
  versionId?: string;
  contentScope: string[];
};
