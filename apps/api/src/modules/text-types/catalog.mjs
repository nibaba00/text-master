const workflowCatalog = {
  short_drama: {
    id: 'workflow-short-drama',
    name: '短剧生产链路',
    description: '面向短剧、短视频脚本和分集内容，覆盖选题、结构、剧本、改写、审核和导出。',
    workspaceType: 'short-video-script',
    defaultStageId: 'concept',
    stageIds: ['concept', 'outline', 'script', 'revise', 'review', 'export'],
    exportTargets: ['markdown', 'txt', 'json'],
  },
  novel: {
    id: 'workflow-novel',
    name: '小说生产链路',
    description: '面向长篇小说和连载内容，覆盖设定、世界观、人物、章节、正文、改写、审核和导出。',
    workspaceType: 'generic-text',
    defaultStageId: 'brief',
    stageIds: ['brief', 'worldbuilding', 'characters', 'outline', 'draft', 'revise', 'review', 'export'],
    exportTargets: ['markdown', 'txt', 'json'],
  },
  business_copy: {
    id: 'workflow-business-copy',
    name: '商业文案生产链路',
    description: '面向产品发布、品牌推广和销售文案，覆盖简报、定位、卖点、成稿、审核和导出。',
    workspaceType: 'business-copy',
    defaultStageId: 'brief',
    stageIds: ['brief', 'positioning', 'selling-points', 'copy', 'review', 'export'],
    exportTargets: ['markdown', 'txt', 'json'],
  },
  xiaohongshu: {
    id: 'workflow-xiaohongshu',
    name: '小红书生产链路',
    description: '面向种草笔记和社媒内容，覆盖选题、钩子、结构、正文、标题、标签、审核和导出。',
    workspaceType: 'business-copy',
    defaultStageId: 'topic',
    stageIds: ['topic', 'hook', 'structure', 'body', 'titles', 'hashtags', 'review', 'export'],
    exportTargets: ['markdown', 'txt', 'json'],
  },
  business_bp: {
    id: 'workflow-business-bp',
    name: '商业 BP 生产链路',
    description: '面向商业计划书和融资材料，覆盖概览、市场、模式、财务、路演稿、审核和导出。',
    workspaceType: 'generic-text',
    defaultStageId: 'overview',
    stageIds: ['overview', 'market-analysis', 'business-model', 'financial-forecast', 'pitch-deck', 'review', 'export'],
    exportTargets: ['markdown', 'txt', 'json'],
  },
  investment_copy: {
    id: 'workflow-investment-copy',
    name: '招商文案生产链路',
    description: '面向加盟招商和平台招商内容，覆盖定位、政策、卖点、收益、落地页、审核和导出。',
    workspaceType: 'business-copy',
    defaultStageId: 'positioning',
    stageIds: ['positioning', 'policy', 'offer', 'revenue-model', 'landing-page', 'review', 'export'],
    exportTargets: ['markdown', 'txt', 'json'],
  },
  document: {
    id: 'workflow-document',
    name: '项目文档生产链路',
    description: '面向需求文档、合同草案和方案说明，覆盖信息收集、资料整理、条款、风险、格式化和导出。',
    workspaceType: 'generic-text',
    defaultStageId: 'intake',
    stageIds: ['intake', 'sources', 'clauses', 'risk-review', 'format', 'export'],
    exportTargets: ['markdown', 'txt', 'json'],
  },
  custom: {
    id: 'workflow-custom',
    name: '自定义生产链路',
    description: '面向自定义文本项目，保留一个轻量但完整的起草、执行、审核和导出闭环。',
    workspaceType: 'generic-text',
    defaultStageId: 'brief',
    stageIds: ['brief', 'plan', 'draft', 'review', 'export'],
    exportTargets: ['markdown', 'txt', 'json'],
  },
};

const textTypes = [
  createTextType('short_drama', '短视频 / 短剧', 'drama', '适合短视频脚本、短剧分集和节奏导向内容创作。'),
  createTextType('novel', '小说 / 故事', 'fiction', '适合小说、故事、人物设定、章节大纲和正文生产。'),
  createTextType('business_copy', '商业文案', 'marketing', '适合产品发布、品牌传播、销售页和广告文案。'),
  createTextType('xiaohongshu', '小红书文案', 'social', '适合小红书笔记、种草内容、标题标签和发布建议。'),
  createTextType('business_bp', '商业 BP', 'marketing', '适合商业计划书、融资材料和路演文本。'),
  createTextType('investment_copy', '招商文案', 'marketing', '适合加盟招商、渠道拓展和落地页文案。'),
  createTextType('document', '合同 / 文档', 'documentation', '适合合同草案、需求文档、方案说明和风险提示。'),
  createTextType('custom', '自定义类型', 'custom', '适合自定义项目类型和工作流。'),
];

export function listTextTypes() {
  return textTypes;
}

export function getWorkflowForProjectType(type) {
  return workflowCatalog[type] ?? workflowCatalog.short_drama;
}

export function getWorkflowById(workflowId) {
  const normalizedWorkflowId = legacyWorkflowAliases[workflowId] ?? workflowId;

  return Object.values(workflowCatalog).find((workflow) => workflow.id === normalizedWorkflowId) ?? workflowCatalog.short_drama;
}

export function getWorkflowCatalog() {
  return workflowCatalog;
}

function createTextType(id, label, category, description) {
  const workflow = workflowCatalog[id];

  return {
    id,
    label,
    category,
    description,
    workflowTemplate: {
      id: workflow.id,
      name: workflow.name,
      workspaceType: workflow.workspaceType,
      workflowId: workflow.id,
      defaultStageId: workflow.defaultStageId,
      stageIds: workflow.stageIds,
      exportTargets: workflow.exportTargets,
    },
  };
}

const legacyWorkflowAliases = {
  'short-video-script-workflow': 'workflow-short-drama',
  'business-copy-workflow': 'workflow-business-copy',
  'novel-workflow': 'workflow-novel',
  'xiaohongshu-workflow': 'workflow-xiaohongshu',
  'business-bp-workflow': 'workflow-business-bp',
  'investment-copy-workflow': 'workflow-investment-copy',
  'document-workflow': 'workflow-document',
  'custom-workflow': 'workflow-custom',
  'generic-text-workflow': 'workflow-novel',
};
