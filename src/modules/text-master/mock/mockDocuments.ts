import type { TextDocument } from '../types/document';

export const mockDocuments: TextDocument[] = [
  {
    id: 'document-novel-brief',
    projectId: 'mock-text-project-1',
    title: '项目 Brief',
    type: 'brief',
    content:
      '主角在废弃星港醒来，只记得一串旧船坞编号。她必须在封锁区重新拼回自己的身份。',
    wordCount: 44,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T08:30:00.000Z',
  },
  {
    id: 'document-novel-outline',
    projectId: 'mock-text-project-1',
    title: '总剧情大纲',
    type: 'outline',
    content:
      '第一幕：林岚在 C-17 船坞醒来，发现身份记录被抹除。\n第二幕：她追查星港封锁事故，发现家族与移民船坞有关。\n第三幕：真相指向她本人曾参与事故后的救援决策。',
    wordCount: 83,
    createdAt: '2026-01-01T00:20:00.000Z',
    updatedAt: '2026-01-02T08:25:00.000Z',
  },
  {
    id: 'document-novel-chapter-1',
    projectId: 'mock-text-project-1',
    title: '第一章：旧船坞编号',
    type: 'chapter',
    content:
      '警报灯在头顶无声闪烁。林岚醒来时，掌心里只有一枚刻着 C-17 的金属牌。她不知道自己是谁，却能准确说出这座废弃船坞每一道闸门的开启顺序。',
    wordCount: 72,
    createdAt: '2026-01-01T01:00:00.000Z',
    updatedAt: '2026-01-02T08:30:00.000Z',
  },
  {
    id: 'document-drama-episode-1',
    projectId: 'project-drama-demo',
    title: 'EP01：凌晨三点的退款',
    type: 'episode',
    content:
      '凌晨三点，一个穿西装的男人拿着空咖啡杯要求退款。店员翻过杯底，发现上面写着“救命”。监控里，这个男人十分钟前已经离开过一次。',
    wordCount: 63,
    createdAt: '2026-01-03T00:30:00.000Z',
    updatedAt: '2026-01-03T10:15:00.000Z',
  },
  {
    id: 'document-copy-main',
    projectId: 'project-copy-demo',
    title: '发布页主文案',
    type: 'copy',
    content:
      'Text Master 帮助内容团队把想法变成可交付文本。从素材、结构、大纲、草稿、审核到导出，所有生产环节都在同一个工作台完成。',
    wordCount: 58,
    createdAt: '2026-01-04T00:30:00.000Z',
    updatedAt: '2026-01-04T12:45:00.000Z',
  },
];
