import type { TextMaterial } from '../types/material';

export const mockMaterials: TextMaterial[] = [
  {
    id: 'material-novel-world',
    projectId: 'mock-text-project-1',
    title: '星港设定',
    type: 'worldbuilding',
    content:
      'C-17 船坞曾是移民船补给站，十年前因事故被封锁。官方记录称事故由能源泄漏引发，但幸存者口供互相矛盾。',
    tags: ['worldbuilding', 'starport'],
    usageCount: 2,
    createdAt: '2026-01-01T00:10:00.000Z',
    updatedAt: '2026-01-02T08:20:00.000Z',
  },
  {
    id: 'material-drama-hook',
    projectId: 'project-drama-demo',
    title: '短剧钩子规则',
    type: 'plot',
    content:
      '每集前 20 秒必须出现异常请求、身份反差或误会升级；结尾保留一个未解释的监控画面。',
    tags: ['hook', 'short_drama'],
    usageCount: 1,
    createdAt: '2026-01-03T00:10:00.000Z',
    updatedAt: '2026-01-03T10:00:00.000Z',
  },
  {
    id: 'material-copy-audience',
    projectId: 'project-copy-demo',
    title: '目标用户',
    type: 'reference',
    content:
      '内容团队、独立创作者、产品运营人员，需要稳定交付长文、脚本、营销文案和项目文档。',
    tags: ['audience', 'copy'],
    usageCount: 3,
    createdAt: '2026-01-04T00:10:00.000Z',
    updatedAt: '2026-01-04T12:30:00.000Z',
  },
];
