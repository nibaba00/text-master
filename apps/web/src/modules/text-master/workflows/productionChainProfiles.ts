import type { TextDocument } from '../types/document';
import type { TextProjectType } from '../types/project';

export type WorkspaceStep =
  | 'overview'
  | 'settings'
  | 'materials'
  | 'outline'
  | 'editor'
  | 'rewrite'
  | 'review'
  | 'versions'
  | 'export';

export type WorkspaceNavItem = {
  key: WorkspaceStep;
  label: string;
  description: string;
};

export type ProductionCardTone = 'success' | 'running' | 'warning' | 'idle';

export type ProductionCard = {
  title: string;
  status: string;
  detail: string;
  score: number;
  tone?: ProductionCardTone;
};

export type ProductionEntryCard = {
  title: string;
  description: string;
  step: WorkspaceStep;
  tone?: ProductionCardTone;
};

export type ProductionRule = {
  label: string;
  value: string;
};

export type ProductionChainProfile = {
  typeLabel: string;
  heroNote: string;
  labels: {
    settings: string;
    materials: string;
    outline: string;
    editor: string;
    rewrite: string;
    review: string;
    versions: string;
    export: string;
  };
  documentPrefix: string;
  documentSlots: string[];
  ruleSectionTitle: string;
  ruleLabels: string[];
};

export type ProductionChainCounts = {
  settingCompleteness: number;
  materialsCount: number;
  outlineCount: number;
  editableCount: number;
  reviewCount: number;
  exportCount: number;
};

const fallbackProfile: ProductionChainProfile = {
  typeLabel: '文本项目',
  heroNote: '围绕设定、结构、正文、审核和导出推进。',
  labels: {
    settings: '创作设定',
    materials: '资料库',
    outline: '结构工厂',
    editor: '正文生产',
    rewrite: '改写工厂',
    review: '审核工厂',
    versions: '版本记录',
    export: '导出中心',
  },
  documentPrefix: 'DOC',
  documentSlots: ['DOC01', 'DOC02', 'DOC03', 'DOC04'],
  ruleSectionTitle: '生产约束',
  ruleLabels: ['目标', '结构', '执行', '导出'],
};

const profiles: Record<TextProjectType, ProductionChainProfile> = {
  short_drama: {
    typeLabel: '短剧项目',
    heroNote: '围绕分集、钩子、节奏和台词推进。',
    labels: {
      settings: '创作设定',
      materials: '资料库',
      outline: '分集大纲',
      editor: '剧本生产',
      rewrite: '改写工厂',
      review: '审核工厂',
      versions: '版本记录',
      export: '导出中心',
    },
    documentPrefix: 'EP',
    documentSlots: ['EP01', 'EP02', 'EP03', 'EP04'],
    ruleSectionTitle: '短剧生产约束',
    ruleLabels: ['一钩', '二钩', '付费点', '结尾悬念'],
  },
  novel: {
    typeLabel: '小说项目',
    heroNote: '围绕世界观、人物、章节和正文推进。',
    labels: {
      settings: '作品设定',
      materials: '资料库',
      outline: '章节大纲',
      editor: '正文生产',
      rewrite: '改写工厂',
      review: '审核工厂',
      versions: '版本记录',
      export: '导出中心',
    },
    documentPrefix: 'CH',
    documentSlots: ['CH01', 'CH02', 'CH03', 'CH04'],
    ruleSectionTitle: '小说生产约束',
    ruleLabels: ['世界观边界', '人物关系', '章节钩子', '冲突升级'],
  },
  business_copy: {
    typeLabel: '商业文案',
    heroNote: '围绕卖点、转化、证明和 CTA 推进。',
    labels: {
      settings: '品牌设定',
      materials: '资料库',
      outline: '卖点结构',
      editor: '文案生产',
      rewrite: '改写工厂',
      review: '审核工厂',
      versions: '版本记录',
      export: '导出中心',
    },
    documentPrefix: 'COPY',
    documentSlots: ['COPY01', 'COPY02', 'COPY03', 'COPY04'],
    ruleSectionTitle: '商业文案约束',
    ruleLabels: ['核心卖点', '转化路径', '证明素材', 'CTA'],
  },
  xiaohongshu: {
    typeLabel: '小红书文案',
    heroNote: '围绕选题、钩子、场景、标签和转化推进。',
    labels: {
      settings: '选题设定',
      materials: '资料库',
      outline: '笔记结构',
      editor: '种草正文',
      rewrite: '改写工厂',
      review: '审核工厂',
      versions: '版本记录',
      export: '导出中心',
    },
    documentPrefix: 'NOTE',
    documentSlots: ['NOTE01', 'NOTE02', 'NOTE03', 'NOTE04'],
    ruleSectionTitle: '种草约束',
    ruleLabels: ['标题钩子', '痛点', '场景', '标签'],
  },
  business_bp: {
    typeLabel: '商业 BP',
    heroNote: '围绕市场、模型、财务和路演材料推进。',
    labels: {
      settings: '商业设定',
      materials: '资料库',
      outline: '市场分析',
      editor: '路演材料',
      rewrite: '改写工厂',
      review: '审核工厂',
      versions: '版本记录',
      export: '导出中心',
    },
    documentPrefix: 'BP',
    documentSlots: ['BP01', 'BP02', 'BP03', 'BP04'],
    ruleSectionTitle: 'BP 约束',
    ruleLabels: ['市场规模', '商业模式', '财务假设', '路演结论'],
  },
  investment_copy: {
    typeLabel: '招商文案',
    heroNote: '围绕定位、政策、收益和落地页推进。',
    labels: {
      settings: '招商定位',
      materials: '资料库',
      outline: '招商政策',
      editor: '招商文案',
      rewrite: '改写工厂',
      review: '审核工厂',
      versions: '版本记录',
      export: '导出中心',
    },
    documentPrefix: 'INV',
    documentSlots: ['INV01', 'INV02', 'INV03', 'INV04'],
    ruleSectionTitle: '招商约束',
    ruleLabels: ['定位', '政策', '收益', '落地页'],
  },
  document: {
    typeLabel: '项目文档',
    heroNote: '围绕需求、资料、条款、风险和格式推进。',
    labels: {
      settings: '文档设定',
      materials: '资料库',
      outline: '资料整理',
      editor: '条款生产',
      rewrite: '改写工厂',
      review: '审核工厂',
      versions: '版本记录',
      export: '导出中心',
    },
    documentPrefix: 'DOC',
    documentSlots: ['DOC01', 'DOC02', 'DOC03', 'DOC04'],
    ruleSectionTitle: '文档约束',
    ruleLabels: ['范围', '条款', '风险', '格式'],
  },
  custom: {
    typeLabel: '自定义类型',
    heroNote: '围绕目标、结构、执行和导出推进。',
    labels: {
      settings: '自定义设定',
      materials: '资料库',
      outline: '执行计划',
      editor: '正文生产',
      rewrite: '改写工厂',
      review: '审核工厂',
      versions: '版本记录',
      export: '导出中心',
    },
    documentPrefix: 'CUS',
    documentSlots: ['CUS01', 'CUS02', 'CUS03', 'CUS04'],
    ruleSectionTitle: '自定义约束',
    ruleLabels: ['目标', '结构', '执行', '导出'],
  },
};

export function getProductionChainProfile(type?: TextProjectType | null): ProductionChainProfile {
  if (!type) {
    return fallbackProfile;
  }

  return profiles[type] ?? fallbackProfile;
}

export function buildWorkspaceNavItems(profile: ProductionChainProfile): WorkspaceNavItem[] {
  return [
    { key: 'overview', label: '项目总览', description: `${profile.typeLabel} 的决策与进度` },
    { key: 'settings', label: profile.labels.settings, description: '风格、策略、规则' },
    { key: 'materials', label: profile.labels.materials, description: '素材、引用与沉淀' },
    { key: 'outline', label: profile.labels.outline, description: '结构、节奏、章节' },
    { key: 'editor', label: profile.labels.editor, description: '草稿和正文生产' },
    { key: 'rewrite', label: profile.labels.rewrite, description: '重写、压缩与扩写' },
    { key: 'review', label: profile.labels.review, description: '一致性和风险检查' },
    { key: 'versions', label: profile.labels.versions, description: '快照与历史版本' },
    { key: 'export', label: profile.labels.export, description: '交付格式与导出' },
  ];
}

export function buildWorkflowCards(
  profile: ProductionChainProfile,
  counts: ProductionChainCounts,
): ProductionCard[] {
  return [
    {
      title: profile.labels.settings,
      status: counts.settingCompleteness >= 80 ? '完成' : '待补全',
      detail: `${counts.settingCompleteness}% 完整度`,
      score: counts.settingCompleteness,
      tone: counts.settingCompleteness >= 80 ? 'success' : 'warning',
    },
    {
      title: profile.labels.materials,
      status: counts.materialsCount > 0 ? '已建立' : '待开始',
      detail: `${counts.materialsCount} 条资料`,
      score: counts.materialsCount > 0 ? 100 : 20,
      tone: counts.materialsCount > 0 ? 'success' : 'idle',
    },
    {
      title: profile.labels.outline,
      status: counts.outlineCount > 0 ? '已建立' : '待生成',
      detail: `${counts.outlineCount} 个相关文档`,
      score: counts.outlineCount > 0 ? 100 : 20,
      tone: counts.outlineCount > 0 ? 'running' : 'idle',
    },
    {
      title: profile.labels.editor,
      status: counts.editableCount > 0 ? '生产中' : '未开始',
      detail: `${counts.editableCount} 个正文相关文档`,
      score: Math.min(100, counts.editableCount * 24),
      tone: counts.editableCount > 0 ? 'running' : 'idle',
    },
    {
      title: profile.labels.review,
      status: counts.reviewCount > 0 ? '已有记录' : '待审核',
      detail: `${counts.reviewCount} 条审核文档`,
      score: counts.reviewCount > 0 ? 75 : 10,
      tone: counts.reviewCount > 0 ? 'warning' : 'idle',
    },
    {
      title: profile.labels.export,
      status: counts.exportCount > 0 ? '已导出' : '待导出',
      detail: `${counts.exportCount} 个导出文档`,
      score: counts.exportCount > 0 ? 100 : 10,
      tone: counts.exportCount > 0 ? 'success' : 'idle',
    },
  ];
}

export function buildProductionEntryCards(
  profile: ProductionChainProfile,
): ProductionEntryCard[] {
  switch (profile.typeLabel) {
    case '短剧项目':
      return [
        { title: '题材定标', description: '锁定分集方向与平台节奏', step: 'settings', tone: 'warning' },
        { title: '分集大纲', description: '拆分钩子、付费点与节奏', step: 'outline', tone: 'running' },
        { title: '剧本生产', description: '进入台词与正文生产', step: 'editor', tone: 'success' },
        { title: '审核工厂', description: '检查人设、节奏和风险', step: 'review', tone: 'idle' },
      ];
    case '小说项目':
      return [
        { title: '作品简报', description: '确认题材、读者和风格', step: 'settings', tone: 'warning' },
        { title: '章节大纲', description: '拆解世界观与章节结构', step: 'outline', tone: 'running' },
        { title: '正文生产', description: '进入章节正文与持续扩写', step: 'editor', tone: 'success' },
        { title: '审核工厂', description: '检查连贯性与冲突升级', step: 'review', tone: 'idle' },
      ];
    case 'business_copy':
      return [
        { title: '品牌设定', description: '明确定位、卖点与受众', step: 'settings', tone: 'warning' },
        { title: '卖点结构', description: '整理转化路径和证明素材', step: 'outline', tone: 'running' },
        { title: '文案生产', description: '输出可直接交付的文案', step: 'editor', tone: 'success' },
        { title: '导出中心', description: '统一输出成品版本', step: 'export', tone: 'idle' },
      ];
    case 'xiaohongshu':
      return [
        { title: '选题设定', description: '锁定场景、痛点和目标', step: 'settings', tone: 'warning' },
        { title: '笔记结构', description: '拆分标题、钩子与正文', step: 'outline', tone: 'running' },
        { title: '种草正文', description: '生成可发布的正文内容', step: 'editor', tone: 'success' },
        { title: '审核工厂', description: '检查敏感表达与平台风险', step: 'review', tone: 'idle' },
      ];
    case 'business_bp':
      return [
        { title: '商业概览', description: '明确项目目标与交付范围', step: 'settings', tone: 'warning' },
        { title: '市场分析', description: '拆分市场、模式和财务', step: 'outline', tone: 'running' },
        { title: '路演材料', description: '整理适合展示的核心内容', step: 'editor', tone: 'success' },
        { title: '导出中心', description: '形成可交付 BP 成品', step: 'export', tone: 'idle' },
      ];
    case 'investment_copy':
      return [
        { title: '招商定位', description: '定义对象、权益与合作方式', step: 'settings', tone: 'warning' },
        { title: '招商政策', description: '整理政策和合作门槛', step: 'outline', tone: 'running' },
        { title: '招商文案', description: '输出可投放的转化文案', step: 'editor', tone: 'success' },
        { title: '导出中心', description: '形成落地页与宣发版本', step: 'export', tone: 'idle' },
      ];
    case 'document':
      return [
        { title: '需求收集', description: '明确范围、边界与交付', step: 'settings', tone: 'warning' },
        { title: '资料整理', description: '整理来源、附件与依据', step: 'materials', tone: 'running' },
        { title: '条款生产', description: '生成条款和规范正文', step: 'editor', tone: 'success' },
        { title: '审核工厂', description: '检查风险、缺口与格式', step: 'review', tone: 'idle' },
      ];
    case 'custom':
    default:
      return [
        { title: '项目简报', description: '锁定目标和执行边界', step: 'settings', tone: 'warning' },
        { title: '执行计划', description: '拆分阶段与生产任务', step: 'outline', tone: 'running' },
        { title: '正文生产', description: '进入可落地内容编写', step: 'editor', tone: 'success' },
        { title: '导出中心', description: '输出最终交付版本', step: 'export', tone: 'idle' },
      ];
  }
}

export function buildOverviewFlowCards(
  profile: ProductionChainProfile,
  counts: ProductionChainCounts,
): ProductionCard[] {
  return [
    {
      title: profile.labels.settings,
      status: counts.settingCompleteness >= 80 ? '已完成' : '待处理',
      detail: `${counts.settingCompleteness}% 完整度`,
      tone: counts.settingCompleteness >= 80 ? 'success' : 'warning',
      score: counts.settingCompleteness,
    },
    {
      title: profile.labels.materials,
      status: counts.materialsCount > 0 ? '已完成' : '待开始',
      detail: `${counts.materialsCount} 条资料`,
      tone: counts.materialsCount > 0 ? 'success' : 'idle',
      score: counts.materialsCount > 0 ? 100 : 15,
    },
    {
      title: profile.labels.outline,
      status: counts.outlineCount > 0 ? '运行中' : '待开始',
      detail: `${counts.outlineCount} 个相关文档`,
      tone: counts.outlineCount > 0 ? 'running' : 'idle',
      score: counts.outlineCount > 0 ? 100 : 20,
    },
    {
      title: profile.labels.editor,
      status: counts.editableCount > 0 ? '生产中' : '待开始',
      detail: `${counts.editableCount} 个正文相关文档`,
      tone: counts.editableCount > 0 ? 'running' : 'idle',
      score: counts.editableCount > 0 ? 100 : 15,
    },
    {
      title: profile.labels.review,
      status: counts.reviewCount > 0 ? '待处理' : '待开始',
      detail: `${counts.reviewCount} 条审核记录`,
      tone: counts.reviewCount > 0 ? 'warning' : 'idle',
      score: counts.reviewCount > 0 ? 80 : 10,
    },
    {
      title: profile.labels.export,
      status: counts.exportCount > 0 ? '已完成' : '待开始',
      detail: `${counts.exportCount} 个导出文件`,
      tone: counts.exportCount > 0 ? 'success' : 'idle',
      score: counts.exportCount > 0 ? 100 : 10,
    },
  ];
}

export function buildOverviewPendingItems(
  profile: ProductionChainProfile,
  counts: ProductionChainCounts,
): string[] {
  const items: string[] = [];

  if (counts.settingCompleteness < 100) {
    items.push(`补齐${profile.labels.settings}，锁定核心约束`);
  }
  if (counts.outlineCount === 0) {
    items.push(`进入${profile.labels.outline}，生成可执行结构`);
  }
  if (counts.reviewCount === 0) {
    items.push(`运行${profile.labels.review}，检查矛盾与风险`);
  }
  if (counts.exportCount === 0) {
    items.push(`完成${profile.labels.export}版本，形成可交付稿`);
  }

  return items.slice(0, 3);
}

export function buildNextRecommendedAction(
  profile: ProductionChainProfile,
  counts: ProductionChainCounts,
): string {
  if (counts.settingCompleteness < 80) {
    return `先补齐${profile.labels.settings}，锁定风格、结构和审核规则。`;
  }
  if (counts.outlineCount === 0) {
    return `进入${profile.labels.outline}，生成可执行的结构和生产计划。`;
  }
  if (counts.editableCount === 0) {
    return `进入${profile.labels.editor}，创建第一版正文草稿。`;
  }
  if (counts.reviewCount === 0) {
    return `进入${profile.labels.review}，检查前后矛盾、节奏和敏感词。`;
  }
  return `进入${profile.labels.export}，生成可交付版本。`;
}

export function buildProductionDocumentOptions(
  profile: ProductionChainProfile,
  documents: TextDocument[],
) {
  const options = profile.documentSlots.map((slot, index) => {
    const document = documents[index];

    return {
      label: slot,
      value: document?.id ?? `empty-${slot}`,
      title: document?.title ?? `${slot} / 待新建`,
      available: Boolean(document),
    };
  });

  return [
    ...options,
    {
      label: '新建',
      value: 'new',
      title: `创建新的${profile.labels.editor}文档`,
      available: true,
    },
  ];
}

export function buildProductionRules(
  type: TextProjectType | undefined,
  getSetupValue: (paths: string[]) => string,
): ProductionRule[] {
  switch (type) {
    case 'short_drama':
      return [
        { label: '一钩', value: getSetupValue(['firstHookPosition']) },
        { label: '二钩', value: getSetupValue(['secondHookPosition']) },
        { label: '付费点', value: getSetupValue(['paywallPosition']) },
        {
          label: '结尾悬念',
          value:
            getSetupValue(['coreConflict']) === '未设置'
              ? '每集结尾保留一个未解决问题'
              : `围绕“${getSetupValue(['coreConflict'])}”制造悬念`,
        },
      ];
    case 'novel':
      return [
        { label: '世界观边界', value: getSetupValue(['worldview']) || '世界规则、限制和代价' },
        { label: '人物关系', value: getSetupValue(['protagonist']) || '主角、对手与关系网' },
        { label: '章节钩子', value: getSetupValue(['chapterHook']) || '每章末尾保留推进问题' },
        { label: '冲突升级', value: getSetupValue(['coreConflict']) || '冲突逐层升级' },
      ];
    case 'business_copy':
      return [
        { label: '核心卖点', value: getSetupValue(['sellingPoint']) || '把卖点压缩成一眼能懂的表达' },
        { label: '转化路径', value: getSetupValue(['ctaPath']) || '从注意到行动的完整路径' },
        { label: '证明素材', value: getSetupValue(['proofAssets']) || '数据、案例与背书' },
        { label: 'CTA', value: getSetupValue(['cta']) || '明确且可执行的行动号召' },
      ];
    case 'xiaohongshu':
      return [
        { label: '标题钩子', value: getSetupValue(['titleHook']) || '前 5 秒抓住注意力' },
        { label: '痛点', value: getSetupValue(['painPoint']) || '用户最关心的问题' },
        { label: '场景', value: getSetupValue(['scenario']) || '可代入的真实场景' },
        { label: '标签', value: getSetupValue(['hashtags']) || '高匹配话题与标签' },
      ];
    case 'business_bp':
      return [
        { label: '市场规模', value: getSetupValue(['marketSize']) || '目标市场与增长空间' },
        { label: '商业模式', value: getSetupValue(['businessModel']) || '收入结构与增长路径' },
        { label: '财务假设', value: getSetupValue(['financialForecast']) || '关键财务假设' },
        { label: '路演结论', value: getSetupValue(['pitchConclusion']) || '能被投资人快速理解的结论' },
      ];
    case 'investment_copy':
      return [
        { label: '定位', value: getSetupValue(['positioning']) || '招商对象与品牌定位' },
        { label: '政策', value: getSetupValue(['policy']) || '招商政策与合作条件' },
        { label: '收益', value: getSetupValue(['revenue']) || '可感知的收益路径' },
        { label: '落地页', value: getSetupValue(['landingPage']) || '可直接转化的落地页结构' },
      ];
    case 'document':
      return [
        { label: '范围', value: getSetupValue(['scope']) || '明确交付范围与边界' },
        { label: '条款', value: getSetupValue(['clauses']) || '关键条款与约束' },
        { label: '风险', value: getSetupValue(['risk']) || '风险点与提醒' },
        { label: '格式', value: getSetupValue(['format']) || '统一格式和导出规范' },
      ];
    case 'custom':
    default:
      return [
        { label: '目标', value: getSetupValue(['goal']) || '明确项目目标' },
        { label: '结构', value: getSetupValue(['structure']) || '拆成可执行结构' },
        { label: '执行', value: getSetupValue(['execution']) || '安排执行步骤' },
        { label: '导出', value: getSetupValue(['export']) || '定义交付格式' },
      ];
  }
}
