import type { TextVersion } from '../types/version';

export const mockVersions: TextVersion[] = [
  {
    id: 'version-novel-generate-1',
    projectId: 'mock-text-project-1',
    documentId: 'document-novel-chapter-1',
    operation: 'generate',
    inputSnapshot: '根据 Brief 和星港设定生成第一章开头。',
    outputSnapshot:
      '警报灯在头顶无声闪烁。林岚醒来时，掌心里只有一枚刻着 C-17 的金属牌。',
    model: 'mock-local',
    createdAt: '2026-01-02T08:30:00.000Z',
    createdBy: 'local-user',
  },
  {
    id: 'version-novel-rewrite-1',
    projectId: 'mock-text-project-1',
    documentId: 'document-novel-chapter-1',
    operation: 'rewrite',
    inputSnapshot: '她不知道自己是谁，却能说出船坞闸门顺序。',
    outputSnapshot:
      '记忆像被人切断，但身体还记得这里。她抬手输入闸门密码，指尖没有一秒迟疑。',
    model: 'mock-local',
    createdAt: '2026-01-02T09:10:00.000Z',
    createdBy: 'local-user',
  },
  {
    id: 'version-copy-review-1',
    projectId: 'project-copy-demo',
    documentId: 'document-copy-main',
    operation: 'review',
    inputSnapshot:
      'Text Master 帮助内容团队把想法变成可交付文本，从素材到导出都在一个工作台完成。',
    outputSnapshot:
      '文案清晰，但可以增加结果导向和具体使用场景，以提高转化动机。',
    model: 'mock-local',
    createdAt: '2026-01-04T12:45:00.000Z',
    createdBy: 'local-user',
  },
];
