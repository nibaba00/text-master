export type TextMaterialType =
  | 'note'
  | 'reference'
  | 'character'
  | 'worldbuilding'
  | 'plot'
  | 'prompt'
  | 'quote'
  | 'link'
  | 'file'
  | 'custom';

export type TextMaterial = {
  id: string;
  projectId: string;
  title: string;
  type: TextMaterialType;
  content: string;
  tags: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};
