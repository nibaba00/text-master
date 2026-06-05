export type TextVersionOperation =
  | 'generate'
  | 'rewrite'
  | 'review'
  | 'repair'
  | 'manual_edit'
  | 'export'
  | 'restore';

export type TextVersion = {
  id: string;
  projectId: string;
  documentId: string;
  operation: TextVersionOperation;
  inputSnapshot: string;
  outputSnapshot: string;
  model: string;
  createdAt: string;
  createdBy: string;
};
