export type TextDocumentType =
  | 'brief'
  | 'setting'
  | 'outline'
  | 'chapter'
  | 'episode'
  | 'copy'
  | 'review'
  | 'export';

export type TextDocument = {
  id: string;
  projectId: string;
  title: string;
  type: TextDocumentType;
  content: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
};
