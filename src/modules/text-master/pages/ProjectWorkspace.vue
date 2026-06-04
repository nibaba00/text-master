<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AiActionPanel from '../components/AiActionPanel.vue';
import WorkspaceHeader from '../components/WorkspaceHeader.vue';
import WorkspaceSidebar from '../components/WorkspaceSidebar.vue';
import {
  createTextMasterRuntime,
  type RuntimeMode,
  type TextMasterRuntime,
} from '../runtime/TextMasterRuntime';
import type { ExportFormat } from '../types/export';
import type { TextDocument } from '../types/document';
import type { TextMaterial } from '../types/material';
import type {
  TextProject,
  TextProjectStatus,
  TextProjectType,
} from '../types/project';
import type { TextVersion } from '../types/version';

type WorkspaceStep =
  | 'overview'
  | 'settings'
  | 'materials'
  | 'outline'
  | 'editor'
  | 'rewrite'
  | 'review'
  | 'versions'
  | 'export';

type WorkspaceNavItem = {
  key: WorkspaceStep;
  label: string;
  description: string;
};

type AiAction = 'generate' | 'rewrite' | 'review' | 'export';
type OutlineLevel = 'total' | 'volume' | 'chapter' | 'episode' | 'scene';
type RewriteMode =
  | '更口语'
  | '更文学'
  | '更短视频'
  | '更商业'
  | '更犀利'
  | '更克制';
type ReviewType =
  | '逻辑一致性'
  | '角色一致性'
  | '世界观冲突'
  | '节奏拖沓'
  | '钩子强度'
  | '平台敏感词';
type ReviewIssueLevel = '高' | '中' | '低';
type ReviewIssueStatus = 'open' | 'ignored' | 'fixed';
type ReviewIssue = {
  id: string;
  type: ReviewType;
  level: ReviewIssueLevel;
  title: string;
  detail: string;
  suggestion: string;
  status: ReviewIssueStatus;
};
type ExportContentKey =
  | 'project_settings'
  | 'worldview'
  | 'characters'
  | 'outline'
  | 'episode_scripts'
  | 'body'
  | 'review_report';
type ExportTargetKey =
  | 'local'
  | 'brain_hub'
  | 'media_master'
  | 'novel_master';

type WorkflowCard = {
  title: string;
  status: string;
  detail: string;
  score: number;
};

const reviewTypes: ReviewType[] = [
  '逻辑一致性',
  '角色一致性',
  '世界观冲突',
  '节奏拖沓',
  '钩子强度',
  '平台敏感词',
];

const reviewIssueTemplates: Record<
  ReviewType,
  {
    level: ReviewIssueLevel;
    title: string;
    detail: string;
    suggestion: string;
  }
> = {
  逻辑一致性: {
    level: '高',
    title: '关键动机与后续行动存在跳跃',
    detail: '当前文本里目标、阻碍和行动之间缺少明确因果桥，读者可能难以理解角色为什么立刻做出选择。',
    suggestion: '补一段触发事件或代价说明，把行动从“突然发生”改成“不得不发生”。',
  },
  角色一致性: {
    level: '中',
    title: '角色语气与既定人设有轻微偏移',
    detail: '部分表达更像旁白总结，和角色的身份、处境、说话习惯不完全一致。',
    suggestion: '保留信息点，但把句式改成角色会说出口的短句或动作反应。',
  },
  世界观冲突: {
    level: '高',
    title: '设定规则缺少限制条件',
    detail: '能力、组织或平台规则出现时没有说明使用边界，后续容易造成“为什么不一直使用”的漏洞。',
    suggestion: '增加冷却、代价、权限或场景限制，让世界观规则可持续。',
  },
  节奏拖沓: {
    level: '中',
    title: '信息说明段落压低推进速度',
    detail: '连续说明超过一个段落，冲突没有在同一屏内继续升级。',
    suggestion: '拆掉解释性段落，把信息嵌入对话、动作或选择压力中。',
  },
  钩子强度: {
    level: '低',
    title: '段落结尾悬念不够明确',
    detail: '结尾停在情绪描述上，没有给出下一个必须点击或继续阅读的问题。',
    suggestion: '把结尾改成可验证的问题、反转线索或明确代价。',
  },
  平台敏感词: {
    level: '高',
    title: '存在平台风控词替换风险',
    detail: '文本中可能包含过强的绝对化、攻击性或敏感表达，需要在发布前做替换。',
    suggestion: '用中性描述替换直接判断，并降低承诺、攻击和极端表达。',
  },
};

const exportContentOptions: Array<{
  key: ExportContentKey;
  label: string;
  description: string;
}> = [
  {
    key: 'project_settings',
    label: '项目设定',
    description: '类型、状态、摘要、生成策略',
  },
  { key: 'worldview', label: '世界观', description: '世界规则和背景设定' },
  { key: 'characters', label: '角色设定', description: '主角和关键人物' },
  { key: 'outline', label: '总纲', description: '总剧情大纲和结构' },
  { key: 'episode_scripts', label: '分集脚本', description: 'EP 结构和脚本段落' },
  { key: 'body', label: '正文', description: '当前正文生产文档' },
  { key: 'review_report', label: '审核报告', description: '审核问题和修复建议' },
];

const supportedExportFormats: Array<{
  value: ExportFormat;
  label: string;
  description: string;
}> = [
  { value: 'markdown', label: 'Markdown', description: '.md 文本交付' },
  { value: 'txt', label: 'TXT', description: '.txt 纯文本交付' },
  { value: 'json', label: 'JSON', description: '.json 结构化交付' },
];

const deferredExportFormats = [
  { value: 'docx', label: 'DOCX', description: '后续接入' },
  { value: 'pdf', label: 'PDF', description: '后续接入' },
];

const exportTargets: Array<{
  key: ExportTargetKey;
  label: string;
  description: string;
}> = [
  { key: 'local', label: '本地下载', description: '浏览器直接下载文件' },
  {
    key: 'brain_hub',
    label: 'Brain Hub 文件库 Mock',
    description: '仅模拟投递，不连接真实 Hub',
  },
  {
    key: 'media_master',
    label: 'Media Master Mock',
    description: '仅模拟发送到媒资链路',
  },
  {
    key: 'novel_master',
    label: 'Novel Master Mock',
    description: '仅模拟发送到长文链路',
  },
];

const operationLabels: Record<TextVersion['operation'], string> = {
  generate: '生成',
  rewrite: '改写',
  review: '审核',
  repair: '修复',
  manual_edit: '手动编辑',
  export: '导出',
};

const route = useRoute();
const runtimeInstance = ref<TextMasterRuntime | null>(null);
const activeStep = ref<WorkspaceStep>('overview');
const runtimeMode = ref<RuntimeMode>('local');
const project = ref<TextProject | null>(null);
const documents = ref<TextDocument[]>([]);
const materials = ref<TextMaterial[]>([]);
const versions = ref<TextVersion[]>([]);
const selectedMaterialId = ref('');
const loadError = ref('');
const lastAction = ref('等待操作');
const settingsFeedback = ref('AI 补全设定尚未触发');
const materialFeedback = ref('资料库 Mock 队列空闲');

const outlineLevel = ref<OutlineLevel>('total');
const outlineCandidate = ref('');
const outlineFeedback = ref('候选区空闲，生成结果不会覆盖原大纲。');
const isGeneratingOutline = ref(false);

const selectedEditorDocumentId = ref('');
const editorContent = ref('');
const editorCandidate = ref('');
const editorFeedback = ref('正文候选区空闲，AI 结果等待用户确认。');
const autoSaveFeedback = ref('自动保存 Mock：无待保存变更');
const editorTextarea = ref<HTMLTextAreaElement | null>(null);

const rewriteOriginal = ref('');
const rewriteResult = ref('');
const rewriteMode = ref<RewriteMode>('更口语');
const rewriteFeedback = ref('改写候选区空闲，应用前不会改动正文。');
const rewriteLocks = reactive({
  keepMeaning: true,
  keepNames: true,
  keepWorldview: true,
});

const selectedReviewDocumentId = ref('');
const selectedReviewTypes = ref<ReviewType[]>([...reviewTypes]);
const reviewIssues = ref<ReviewIssue[]>([]);
const selectedReviewIssueId = ref('');
const reviewFeedback = ref('审核队列空闲，选择文档后开始 Mock 审核。');
const isReviewing = ref(false);

const selectedVersionId = ref('');
const versionFeedback = ref('选择时间线版本查看详情。');
const versionCompareFeedback = ref('版本对比 Mock 尚未执行。');
const excellentVersionIds = ref<string[]>([]);

const selectedExportSections = ref<ExportContentKey[]>([
  'project_settings',
  'outline',
  'body',
]);
const selectedExportFormat = ref<ExportFormat>('markdown');
const selectedExportTarget = ref<ExportTargetKey>('local');
const exportFeedback = ref('导出队列空闲。');
const isExporting = ref(false);

const workspaceNavItems: WorkspaceNavItem[] = [
  { key: 'overview', label: '项目总览', description: '状态、目标、进度' },
  { key: 'settings', label: '创作设定', description: '风格、策略、规则' },
  { key: 'materials', label: '资料库', description: '素材与引用' },
  { key: 'outline', label: '大纲工厂', description: '结构和章节' },
  { key: 'editor', label: '正文生产', description: '草稿和正文' },
  { key: 'rewrite', label: '改写工厂', description: '重写与扩写' },
  { key: 'review', label: '审核工厂', description: '一致性和风险' },
  { key: 'versions', label: '版本记录', description: '快照和历史' },
  { key: 'export', label: '导出中心', description: '交付格式' },
];

const outlineLevels: Array<{ value: OutlineLevel; label: string }> = [
  { value: 'total', label: '总纲' },
  { value: 'volume', label: '分卷' },
  { value: 'chapter', label: '章节' },
  { value: 'episode', label: '分集' },
  { value: 'scene', label: '场景' },
];

const rewriteModes: RewriteMode[] = [
  '更口语',
  '更文学',
  '更短视频',
  '更商业',
  '更犀利',
  '更克制',
];

const routeProjectId = computed(() => {
  const value = route.params.projectId;
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
});

const projectTitle = computed(() => project.value?.title ?? '加载项目中');
const projectProgress = computed(() => project.value?.progress ?? 0);
const projectStatus = computed(() => project.value?.status ?? 'unknown');
const autoSaveEnabled = computed(() => project.value?.settings.autoSave ?? true);
const updatedAtLabel = computed(() =>
  project.value ? formatUpdatedAt(project.value.updatedAt) : '',
);
const projectSetup = computed(() => project.value?.settings.projectSetup ?? {});
const isShortDramaProject = computed(() => project.value?.type === 'short_drama');
const outlineDocuments = computed(() =>
  documents.value.filter((document) => document.type === 'outline'),
);
const editableDocuments = computed(() =>
  documents.value.filter((document) =>
    ['brief', 'chapter', 'episode', 'copy', 'setting'].includes(document.type),
  ),
);
const reviewDocuments = computed(() =>
  documents.value.filter((document) => document.type === 'review'),
);
const exportDocuments = computed(() =>
  documents.value.filter((document) => document.type === 'export'),
);
const recentVersions = computed(() => versions.value.slice(0, 3));
const selectedEditorDocument = computed(() =>
  documents.value.find((document) => document.id === selectedEditorDocumentId.value) ??
  null,
);
const reviewTargetDocuments = computed(() =>
  documents.value.filter((document) => document.type !== 'export'),
);
const selectedReviewDocument = computed(() => {
  return (
    reviewTargetDocuments.value.find(
      (document) => document.id === selectedReviewDocumentId.value,
    ) ??
    reviewTargetDocuments.value[0] ??
    null
  );
});
const selectedReviewIssue = computed(() => {
  return (
    reviewIssues.value.find(
      (issue) => issue.id === selectedReviewIssueId.value,
    ) ??
    reviewIssues.value[0] ??
    null
  );
});
const selectedVersion = computed(() => {
  return (
    versions.value.find((version) => version.id === selectedVersionId.value) ??
    versions.value[0] ??
    null
  );
});
const selectedExportLabels = computed(() =>
  exportContentOptions
    .filter((option) => selectedExportSections.value.includes(option.key))
    .map((option) => option.label),
);
const selectedExportTargetLabel = computed(
  () =>
    exportTargets.find((target) => target.key === selectedExportTarget.value)
      ?.label ?? '未选择',
);
const productionDocumentOptions = computed(() => {
  const labels = ['EP01', 'EP02', 'EP03'];
  const options = labels.map((label, index) => {
    const document = editableDocuments.value[index];
    return {
      label,
      value: document?.id ?? `empty-${label}`,
      title: document?.title ?? `${label} / 待新建`,
      available: Boolean(document),
    };
  });

  return [
    ...options,
    {
      label: '新建',
      value: 'new',
      title: '创建新的正文文档',
      available: true,
    },
  ];
});
const editorWordCount = computed(() => countTextWords(editorContent.value));
const selectedMaterial = computed(() => {
  return (
    materials.value.find((material) => material.id === selectedMaterialId.value) ??
    materials.value[0] ??
    null
  );
});
const materialTags = computed(() => {
  return Array.from(new Set(materials.value.flatMap((material) => material.tags)));
});
const settingCompleteness = computed(() => {
  const checks = [
    Boolean(project.value?.settings.targetAudience),
    Boolean(project.value?.settings.tone),
    Boolean(project.value?.settings.templateId),
    Boolean(project.value?.settings.styleTags?.length),
    Boolean(project.value?.settings.generationStrategy),
    Boolean(project.value?.settings.reviewRules?.length),
    Object.keys(projectSetup.value).length > 0,
    Boolean(getSetupValue(['protagonist', 'targetReader', 'targetAudience'])),
  ];
  const passed = checks.filter(Boolean).length;

  return Math.round((passed / checks.length) * 100);
});
const lockedSettings = computed(() => {
  const settings = project.value?.settings;
  if (!settings) {
    return [];
  }

  return [
    settings.templateId ? `模板：${settings.templateId}` : '',
    settings.generationStrategy ? `生成策略：${settings.generationStrategy}` : '',
    settings.styleTags?.length ? `风格：${settings.styleTags.join(' / ')}` : '',
    settings.reviewRules?.length ? `审核：${settings.reviewRules.join(' / ')}` : '',
    settings.autoSave ? '自动保存：开启' : '自动保存：关闭',
  ].filter(Boolean);
});
const workflowCards = computed<WorkflowCard[]>(() => [
  {
    title: '创作设定',
    status: settingCompleteness.value >= 80 ? '完成' : '待补全',
    detail: `${settingCompleteness.value}% 完整度`,
    score: settingCompleteness.value,
  },
  {
    title: '大纲',
    status: outlineDocuments.value.length > 0 ? '已建立' : '待生成',
    detail: `${outlineDocuments.value.length} 个大纲文档`,
    score: outlineDocuments.value.length > 0 ? 100 : 20,
  },
  {
    title: '正文',
    status: editableDocuments.value.length > 0 ? '生产中' : '未开始',
    detail: `${editableDocuments.value.length} 个正文相关文档`,
    score: Math.min(100, editableDocuments.value.length * 24),
  },
  {
    title: '审核',
    status: reviewDocuments.value.length > 0 ? '已有记录' : '待审核',
    detail: `${reviewDocuments.value.length} 条审核文档`,
    score: reviewDocuments.value.length > 0 ? 75 : 10,
  },
  {
    title: '导出',
    status: exportDocuments.value.length > 0 ? '已导出' : '待导出',
    detail: `${exportDocuments.value.length} 个导出文档`,
    score: exportDocuments.value.length > 0 ? 100 : 10,
  },
]);
const nextRecommendedAction = computed(() => {
  if (settingCompleteness.value < 80) {
    return '先补全创作设定，锁定风格、角色和审核规则。';
  }
  if (outlineDocuments.value.length === 0) {
    return '进入大纲工厂，生成可执行的结构和章节计划。';
  }
  if (editableDocuments.value.length === 0) {
    return '进入正文生产，创建第一版正文草稿。';
  }
  if (reviewDocuments.value.length === 0) {
    return '进入审核工厂，检查前后矛盾、节奏和敏感词。';
  }
  return '进入导出中心，生成可交付版本。';
});
const totalPlotOutline = computed(() => {
  const outline = outlineDocuments.value[0]?.content;
  if (outline) {
    return outline;
  }

  return [
    project.value?.summary || '项目摘要待补充。',
    `主角设定：${getSetupValue(['protagonist'])}`,
    `核心冲突：${getSetupValue(['coreConflict'])}`,
  ].join('\n');
});
const episodeStructure = computed(() => {
  const source = editableDocuments.value.filter((document) =>
    ['episode', 'chapter', 'copy'].includes(document.type),
  );

  if (source.length > 0) {
    return source.slice(0, 6).map((document, index) => ({
      label: `EP${String(index + 1).padStart(2, '0')}`,
      title: document.title,
      summary: document.content.slice(0, 120) || '待补充内容。',
    }));
  }

  return ['EP01', 'EP02', 'EP03'].map((label, index) => ({
    label,
    title: `${label} 结构占位`,
    summary: `第 ${index + 1} 集结构待生成，候选区会先承接 AI 结果。`,
  }));
});
const shortDramaRules = computed(() => [
  {
    label: '一钩',
    value: getSetupValue(['firstHookPosition']),
  },
  {
    label: '二钩',
    value: getSetupValue(['secondHookPosition']),
  },
  {
    label: '付费点',
    value: getSetupValue(['paywallPosition']),
  },
  {
    label: '结尾悬念',
    value: getSetupValue(['coreConflict']) === '未设置'
      ? '每集结尾保留一个未解决问题'
      : `围绕“${getSetupValue(['coreConflict'])}”制造悬念`,
  },
]);
const rewriteDiff = computed(() => {
  const originalLength = countTextWords(rewriteOriginal.value);
  const resultLength = countTextWords(rewriteResult.value);
  const delta = resultLength - originalLength;

  return {
    originalLength,
    resultLength,
    delta,
    summary:
      rewriteResult.value.length === 0
        ? '生成改写候选后显示差异。'
        : `字数变化 ${delta >= 0 ? '+' : ''}${delta}，原文 ${originalLength}，改写 ${resultLength}。`,
  };
});

watch(selectedEditorDocumentId, () => {
  syncEditorContent();
});

watch(editorContent, () => {
  autoSaveFeedback.value = '自动保存 Mock：检测到本地草稿变更';
});

onMounted(async () => {
  await loadWorkspace();
});

async function getRuntime(): Promise<TextMasterRuntime> {
  if (!runtimeInstance.value) {
    runtimeInstance.value = await createTextMasterRuntime();
  }

  return runtimeInstance.value;
}

async function loadWorkspace(): Promise<void> {
  try {
    const runtime = await getRuntime();
    runtimeMode.value = runtime.getRuntimeMode();

    const projects = await runtime.listProjects();
    project.value =
      projects.find((item) => item.id === routeProjectId.value) ??
      projects[0] ??
      null;

    if (!project.value) {
      loadError.value = '没有找到可打开的本地项目';
      return;
    }

    await reloadWorkspaceData();
    selectedMaterialId.value = materials.value[0]?.id ?? '';
    selectedEditorDocumentId.value =
      editableDocuments.value[0]?.id ?? productionDocumentOptions.value[0]?.value ?? 'new';
    syncEditorContent();
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : '工作台加载失败';
  }
}

async function reloadWorkspaceData(): Promise<void> {
  if (!project.value) {
    return;
  }

  const runtime = await getRuntime();
  const [documentItems, materialItems, versionItems] = await Promise.all([
    runtime.listDocuments(project.value.id),
    runtime.listMaterials(project.value.id),
    runtime.listVersions(project.value.id),
  ]);

  documents.value = documentItems;
  materials.value = materialItems;
  versions.value = versionItems;

  if (
    !reviewTargetDocuments.value.some(
      (document) => document.id === selectedReviewDocumentId.value,
    )
  ) {
    selectedReviewDocumentId.value = reviewTargetDocuments.value[0]?.id ?? '';
  }

  if (!versions.value.some((version) => version.id === selectedVersionId.value)) {
    selectedVersionId.value = versions.value[0]?.id ?? '';
  }
}

function setActiveStep(step: WorkspaceStep): void {
  activeStep.value = step;
}

function handleAiAction(action: AiAction): void {
  const stepMap: Record<AiAction, WorkspaceStep> = {
    generate: 'editor',
    rewrite: 'rewrite',
    review: 'review',
    export: 'export',
  };

  activeStep.value = stepMap[action];
  lastAction.value = `已切换到 ${stepMap[action]} Mock 队列`;
}

function runSettingsMock(): void {
  settingsFeedback.value =
    'AI 补全设定 Mock 已生成建议：补充角色动机、关键限制和冲突升级点。';
  lastAction.value = 'AI 补全设定 Mock 已完成';
}

function runMaterialMock(action: 'add' | 'import' | 'conflict'): void {
  const feedbackMap = {
    add: '新增资料 Mock：已打开本地资料卡草稿。',
    import: '导入文本 Mock：已准备解析粘贴文本。',
    conflict: '资料冲突检查 Mock：未发现高优先级冲突。',
  };

  materialFeedback.value = feedbackMap[action];
  lastAction.value = feedbackMap[action];
}

async function generateOutlineCandidate(): Promise<void> {
  if (!project.value || isGeneratingOutline.value) {
    return;
  }

  isGeneratingOutline.value = true;
  outlineFeedback.value = '正在生成大纲候选，原文不会被覆盖。';

  try {
    const runtime = await getRuntime();
    const targetDocument = await ensureEditorDocument();
    const result = await runtime.generateText({
      projectId: project.value.id,
      documentId: targetDocument.id,
      prompt: [
        `生成${outlineLevels.find((item) => item.value === outlineLevel.value)?.label}大纲`,
        `项目：${projectTitle.value}`,
        `摘要：${project.value.summary}`,
        `核心冲突：${getSetupValue(['coreConflict'])}`,
      ].join('\n'),
      context: totalPlotOutline.value,
    });

    outlineCandidate.value = result.text;
    outlineFeedback.value = '大纲候选已生成，等待人工确认。';
    lastAction.value = 'Runtime.generateText 已生成大纲候选';
    await reloadWorkspaceData();
  } catch (error) {
    outlineFeedback.value =
      error instanceof Error ? error.message : '生成大纲失败';
  } finally {
    isGeneratingOutline.value = false;
  }
}

async function generateEditorCandidate(): Promise<void> {
  if (!project.value) {
    return;
  }

  editorFeedback.value = '正在生成正文候选，正文编辑区保持不变。';

  try {
    const runtime = await getRuntime();
    const targetDocument = await ensureEditorDocument();
    const result = await runtime.generateText({
      projectId: project.value.id,
      documentId: targetDocument.id,
      prompt: `基于当前文档继续生成正文候选：${targetDocument.title}`,
      context: editorContent.value || totalPlotOutline.value,
    });

    editorCandidate.value = result.text;
    editorFeedback.value = '正文候选已生成，可插入、替换选中或保存为版本。';
    lastAction.value = 'Runtime.generateText 已生成正文候选';
    await reloadWorkspaceData();
  } catch (error) {
    editorFeedback.value =
      error instanceof Error ? error.message : '生成正文候选失败';
  }
}

function insertCandidateAtCursor(): void {
  if (!editorCandidate.value) {
    editorFeedback.value = '没有可插入的候选结果。';
    return;
  }

  const textarea = editorTextarea.value;
  const start = textarea?.selectionStart ?? editorContent.value.length;
  const end = textarea?.selectionEnd ?? editorContent.value.length;

  editorContent.value =
    editorContent.value.slice(0, start) +
    editorCandidate.value +
    editorContent.value.slice(end);
  editorFeedback.value = '候选结果已插入到光标位置，尚未自动保存为正文版本。';

  void nextTick(() => {
    const position = start + editorCandidate.value.length;
    editorTextarea.value?.setSelectionRange(position, position);
    editorTextarea.value?.focus();
  });
}

function replaceSelectionWithCandidate(): void {
  if (!editorCandidate.value) {
    editorFeedback.value = '没有可替换的候选结果。';
    return;
  }

  const textarea = editorTextarea.value;
  const start = textarea?.selectionStart ?? 0;
  const end = textarea?.selectionEnd ?? 0;

  if (start === end) {
    editorFeedback.value = '请先在正文编辑区选择要替换的文本。';
    return;
  }

  editorContent.value =
    editorContent.value.slice(0, start) +
    editorCandidate.value +
    editorContent.value.slice(end);
  editorFeedback.value = '候选结果已替换选中文本，尚未自动保存为正文版本。';
}

async function saveEditorCandidateAsVersion(): Promise<void> {
  if (!project.value || !editorCandidate.value) {
    editorFeedback.value = '没有可保存的正文候选结果。';
    return;
  }

  try {
    const runtime = await getRuntime();
    const targetDocument = await ensureEditorDocument();
    await runtime.createVersion({
      projectId: project.value.id,
      documentId: targetDocument.id,
      operation: 'generate',
      inputSnapshot: editorContent.value,
      outputSnapshot: editorCandidate.value,
      model: 'mock-local',
      createdBy: 'local-user',
    });
    editorFeedback.value = '正文候选已保存为新版本，正文原文未被自动覆盖。';
    lastAction.value = 'Runtime.createVersion 已保存正文候选版本';
    await reloadWorkspaceData();
  } catch (error) {
    editorFeedback.value =
      error instanceof Error ? error.message : '保存正文候选版本失败';
  }
}

async function generateRewriteCandidate(): Promise<void> {
  if (!project.value) {
    return;
  }

  rewriteFeedback.value = '正在生成改写候选，右侧结果不会覆盖正文。';

  try {
    const runtime = await getRuntime();
    const targetDocument = await ensureEditorDocument();
    const result = await runtime.rewriteText({
      projectId: project.value.id,
      documentId: targetDocument.id,
      text: rewriteOriginal.value || editorContent.value,
      instruction: [
        rewriteMode.value,
        rewriteLocks.keepMeaning ? '保持原意' : '',
        rewriteLocks.keepNames ? '保持人名' : '',
        rewriteLocks.keepWorldview ? '保持世界观' : '',
      ]
        .filter(Boolean)
        .join(' / '),
    });

    rewriteResult.value = result.text;
    rewriteFeedback.value = '改写候选已生成，等待用户应用。';
    lastAction.value = 'Runtime.rewriteText 已生成改写候选';
    await reloadWorkspaceData();
  } catch (error) {
    rewriteFeedback.value =
      error instanceof Error ? error.message : '生成改写候选失败';
  }
}

async function applyRewriteResult(): Promise<void> {
  if (!project.value || !rewriteResult.value) {
    rewriteFeedback.value = '没有可应用的改写结果。';
    return;
  }

  try {
    const runtime = await getRuntime();
    const targetDocument = await ensureEditorDocument();
    await runtime.createVersion({
      projectId: project.value.id,
      documentId: targetDocument.id,
      operation: 'rewrite',
      inputSnapshot: rewriteOriginal.value,
      outputSnapshot: rewriteResult.value,
      model: 'mock-local',
      createdBy: 'local-user',
    });
    editorContent.value = rewriteResult.value;
    rewriteOriginal.value = rewriteResult.value;
    rewriteFeedback.value = '改写结果已由用户确认并保存 Mock 版本。';
    lastAction.value = 'Runtime.createVersion 已保存改写版本';
    await reloadWorkspaceData();
  } catch (error) {
    rewriteFeedback.value =
      error instanceof Error ? error.message : '应用改写失败';
  }
}

function toggleReviewType(type: ReviewType): void {
  selectedReviewTypes.value = selectedReviewTypes.value.includes(type)
    ? selectedReviewTypes.value.filter((item) => item !== type)
    : [...selectedReviewTypes.value, type];
}

async function startReview(): Promise<void> {
  if (!project.value || !selectedReviewDocument.value || isReviewing.value) {
    reviewFeedback.value = '请先选择可审核文档。';
    return;
  }

  if (selectedReviewTypes.value.length === 0) {
    reviewFeedback.value = '至少选择一种审核类型。';
    return;
  }

  isReviewing.value = true;
  reviewFeedback.value = '正在执行 Mock 审核，问题会先进入列表。';

  try {
    const runtime = await getRuntime();
    const targetDocument = selectedReviewDocument.value;
    const result = await runtime.reviewText({
      projectId: project.value.id,
      documentId: targetDocument.id,
      text: targetDocument.content || editorContent.value || totalPlotOutline.value,
    });
    const stamp = Date.now();

    reviewIssues.value = selectedReviewTypes.value.map((type, index) => {
      const template = reviewIssueTemplates[type];

      return {
        id: `review-${stamp}-${index}`,
        type,
        level: template.level,
        title: template.title,
        detail: `${template.detail}\n\n审核文档：${targetDocument.title}\nMock 摘要：${result.summary}`,
        suggestion: template.suggestion,
        status: 'open',
      };
    });
    selectedReviewIssueId.value = reviewIssues.value[0]?.id ?? '';
    reviewFeedback.value = `已生成 ${reviewIssues.value.length} 条 Mock 审核问题，并保存 review 版本。`;
    lastAction.value = 'Runtime.reviewText 已完成审核并保存版本';
    await reloadWorkspaceData();
  } catch (error) {
    reviewFeedback.value =
      error instanceof Error ? error.message : '开始审核失败';
  } finally {
    isReviewing.value = false;
  }
}

function ignoreReviewIssue(issueId: string): void {
  const issue = reviewIssues.value.find((item) => item.id === issueId);
  if (!issue) {
    return;
  }

  issue.status = 'ignored';
  selectedReviewIssueId.value = issue.id;
  reviewFeedback.value = `已忽略问题：${issue.title}`;
}

async function copyReviewSuggestion(issue: ReviewIssue): Promise<void> {
  const text = `${issue.title}\n\n${issue.suggestion}`;

  try {
    await globalThis.navigator?.clipboard?.writeText(text);
    reviewFeedback.value = '修复建议已复制。';
  } catch {
    reviewFeedback.value = `复制 Mock：${issue.suggestion}`;
  }
}

async function applyReviewRepairMock(issue: ReviewIssue): Promise<void> {
  if (!project.value || !selectedReviewDocument.value) {
    reviewFeedback.value = '请先选择审核文档。';
    return;
  }

  try {
    const runtime = await getRuntime();
    await runtime.createVersion({
      projectId: project.value.id,
      documentId: selectedReviewDocument.value.id,
      operation: 'repair',
      inputSnapshot: selectedReviewDocument.value.content,
      outputSnapshot: `Mock 修复：${issue.suggestion}`,
      model: 'mock-local',
      createdBy: 'local-user',
    });
    issue.status = 'fixed';
    reviewFeedback.value = `已应用修复 Mock：${issue.title}`;
    lastAction.value = 'Runtime.createVersion 已保存 repair 版本';
    await reloadWorkspaceData();
  } catch (error) {
    reviewFeedback.value =
      error instanceof Error ? error.message : '应用修复 Mock 失败';
  }
}

function selectVersion(versionId: string): void {
  selectedVersionId.value = versionId;
  versionFeedback.value = '已打开版本详情。';
}

function compareSelectedVersionMock(): void {
  const currentVersion = selectedVersion.value;
  if (!currentVersion) {
    versionCompareFeedback.value = '没有可对比的版本。';
    return;
  }

  const currentIndex = versions.value.findIndex(
    (version) => version.id === currentVersion.id,
  );
  const previousVersion = versions.value[currentIndex + 1] ?? versions.value[1];
  if (!previousVersion) {
    versionCompareFeedback.value = '当前只有一个版本，暂无法对比。';
    return;
  }

  const delta =
    countTextWords(currentVersion.outputSnapshot) -
    countTextWords(previousVersion.outputSnapshot);
  versionCompareFeedback.value = `Mock 对比：${operationLabels[currentVersion.operation]} 相比上一版本字数变化 ${delta >= 0 ? '+' : ''}${delta}。`;
}

function restoreSelectedVersionMock(): void {
  const currentVersion = selectedVersion.value;
  if (!currentVersion) {
    versionFeedback.value = '没有可恢复的版本。';
    return;
  }

  editorContent.value = currentVersion.outputSnapshot;
  rewriteOriginal.value = currentVersion.outputSnapshot;
  versionFeedback.value = '恢复版本 Mock 已载入正文编辑区，未自动覆盖本地文档。';
  lastAction.value = '版本恢复 Mock 已载入编辑区';
}

function markExcellentVersionMock(): void {
  const currentVersion = selectedVersion.value;
  if (!currentVersion) {
    versionFeedback.value = '没有可标记的版本。';
    return;
  }

  excellentVersionIds.value = excellentVersionIds.value.includes(
    currentVersion.id,
  )
    ? excellentVersionIds.value.filter((id) => id !== currentVersion.id)
    : [...excellentVersionIds.value, currentVersion.id];
  versionFeedback.value = excellentVersionIds.value.includes(currentVersion.id)
    ? '已标记为优秀版本 Mock。'
    : '已取消优秀版本 Mock 标记。';
}

function toggleExportSection(section: ExportContentKey): void {
  selectedExportSections.value = selectedExportSections.value.includes(section)
    ? selectedExportSections.value.filter((item) => item !== section)
    : [...selectedExportSections.value, section];
}

async function runExport(): Promise<void> {
  if (!project.value || isExporting.value) {
    exportFeedback.value = '项目未加载，无法导出。';
    return;
  }

  if (selectedExportSections.value.length === 0) {
    exportFeedback.value = '至少选择一项导出内容。';
    return;
  }

  isExporting.value = true;
  exportFeedback.value = '正在生成导出内容。';

  try {
    const runtime = await getRuntime();
    const content = buildExportContent(selectedExportFormat.value);
    const fileName = `${slugifyFileName(projectTitle.value)}-${formatDateStamp(
      new Date(),
    )}.${getExportExtension(selectedExportFormat.value)}`;
    await runtime.exportProject({
      projectId: project.value.id,
      documentId: selectedEditorDocument.value?.id,
      format: selectedExportFormat.value,
      fileName,
      content,
    });

    if (selectedExportTarget.value === 'local') {
      downloadExportFile(fileName, content, selectedExportFormat.value);
      exportFeedback.value = `已生成并下载 ${fileName}，同时保存 export 版本。`;
    } else {
      const target = exportTargets.find(
        (item) => item.key === selectedExportTarget.value,
      );
      exportFeedback.value = `已生成 ${fileName}，${target?.label ?? 'Mock 目标'}已收到模拟投递，并保存 export 版本。`;
    }

    lastAction.value = 'Runtime.exportProject 已完成导出并保存版本';
    await reloadWorkspaceData();
  } catch (error) {
    exportFeedback.value =
      error instanceof Error ? error.message : '导出失败';
  } finally {
    isExporting.value = false;
  }
}

function syncEditorContent(): void {
  const document = selectedEditorDocument.value;
  editorContent.value = document?.content ?? '';
  rewriteOriginal.value = editorContent.value;
  editorCandidate.value = '';
  rewriteResult.value = '';
  autoSaveFeedback.value = '自动保存 Mock：文档已载入';
}

function useEditorContentForRewrite(): void {
  rewriteOriginal.value = editorContent.value;
  rewriteFeedback.value = '已把当前正文载入改写原文区。';
}

async function ensureEditorDocument(): Promise<TextDocument> {
  const existingDocument = selectedEditorDocument.value;
  if (existingDocument) {
    return existingDocument;
  }

  if (!project.value) {
    throw new Error('项目未加载');
  }

  const runtime = await getRuntime();
  const document = await runtime.saveDocument({
    projectId: project.value.id,
    title:
      selectedEditorDocumentId.value === 'new'
        ? '新建正文'
        : selectedEditorDocumentId.value.replace('empty-', ''),
    type: project.value.type === 'short_drama' ? 'episode' : 'chapter',
    content: editorContent.value,
  });

  await reloadWorkspaceData();
  selectedEditorDocumentId.value = document.id;
  return document;
}

function getSetupValue(keys: string[]): string {
  for (const key of keys) {
    const value = projectSetup.value[key];
    if (value) {
      return value;
    }
  }

  return '未设置';
}

function buildExportContent(format: ExportFormat): string {
  const sections = selectedExportSections.value.map((section) => ({
    key: section,
    label:
      exportContentOptions.find((option) => option.key === section)?.label ??
      section,
    content: getExportSectionContent(section),
  }));

  if (format === 'json') {
    return JSON.stringify(
      {
        app: 'Text Master',
        exportedAt: new Date().toISOString(),
        project: project.value,
        selectedSections: sections,
      },
      null,
      2,
    );
  }

  if (format === 'txt') {
    return sections
      .map((section) => `${section.label}\n${section.content}`)
      .join('\n\n---\n\n');
  }

  return [
    `# ${projectTitle.value}`,
    '',
    ...sections.flatMap((section) => [
      `## ${section.label}`,
      '',
      section.content,
      '',
    ]),
  ].join('\n');
}

function getExportSectionContent(section: ExportContentKey): string {
  switch (section) {
    case 'project_settings':
      return [
        `项目类型：${getProjectTypeLabel(project.value?.type)}`,
        `项目状态：${getStatusLabel(projectStatus.value)}`,
        `完成度：${projectProgress.value}%`,
        `摘要：${project.value?.summary || '未设置'}`,
        `生成策略：${project.value?.settings.generationStrategy ?? '未设置'}`,
      ].join('\n');
    case 'worldview':
      return getSetupValue(['worldview', 'worldView']);
    case 'characters':
      return [
        `主角设定：${getSetupValue(['protagonist'])}`,
        `目标读者：${getSetupValue(['targetReader', 'targetAudience'])}`,
      ].join('\n');
    case 'outline':
      return totalPlotOutline.value;
    case 'episode_scripts':
      return episodeStructure.value
        .map((episode) => `${episode.label} ${episode.title}\n${episode.summary}`)
        .join('\n\n');
    case 'body':
      return editableDocuments.value
        .map((document) => `### ${document.title}\n${document.content}`)
        .join('\n\n');
    case 'review_report':
      if (reviewIssues.value.length > 0) {
        return reviewIssues.value
          .map(
            (issue) =>
              `[${issue.level}] ${issue.type} / ${issue.status}\n${issue.title}\n${issue.detail}\n建议：${issue.suggestion}`,
          )
          .join('\n\n');
      }

      return reviewDocuments.value
        .map((document) => `### ${document.title}\n${document.content}`)
        .join('\n\n') || '暂无审核报告。';
    default:
      return '';
  }
}

function downloadExportFile(
  fileName: string,
  content: string,
  format: ExportFormat,
): void {
  if (typeof Blob === 'undefined' || !globalThis.document) {
    exportFeedback.value = '导出内容已生成，但当前环境不支持浏览器下载。';
    return;
  }

  const mimeTypes: Record<ExportFormat, string> = {
    markdown: 'text/markdown;charset=utf-8',
    txt: 'text/plain;charset=utf-8',
    json: 'application/json;charset=utf-8',
  };
  const blob = new Blob([content], { type: mimeTypes[format] });
  const url = URL.createObjectURL(blob);
  const link = globalThis.document.createElement('a');
  link.href = url;
  link.download = fileName;
  globalThis.document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getExportExtension(format: ExportFormat): string {
  return format === 'markdown' ? 'md' : format;
}

function slugifyFileName(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'text-master-export'
  );
}

function formatDateStamp(value: Date): string {
  const pad = (input: number) => String(input).padStart(2, '0');

  return [
    value.getFullYear(),
    pad(value.getMonth() + 1),
    pad(value.getDate()),
    pad(value.getHours()),
    pad(value.getMinutes()),
  ].join('');
}

function getProjectTypeLabel(type?: TextProjectType): string {
  const labels: Record<TextProjectType, string> = {
    novel: '小说项目',
    short_drama: '短剧项目',
    business_copy: '商业文案',
    document: '项目文档',
    custom: '自定义文本',
  };

  return type ? labels[type] : '未知类型';
}

function getStatusLabel(status?: TextProjectStatus | 'unknown'): string {
  const labels: Record<TextProjectStatus, string> = {
    draft: '草稿',
    in_progress: '生产中',
    reviewing: '审核中',
    completed: '已完成',
    exported: '已导出',
    archived: '已归档',
  };

  return status && status !== 'unknown' ? labels[status] : '未知状态';
}

function countTextWords(content: string): number {
  const cjkMatches = content.match(/[\u4e00-\u9fff]/g) ?? [];
  const latinSource = content.replace(/[\u4e00-\u9fff]/g, ' ');
  const latinMatches = latinSource.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) ?? [];
  return cjkMatches.length + latinMatches.length;
}

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
</script>

<template>
  <main class="tm-workspace-page">
    <WorkspaceHeader
      :project-title="projectTitle"
      :auto-save-enabled="autoSaveEnabled"
      :updated-at="updatedAtLabel"
    />

    <section class="tm-workspace-body" aria-label="Text Master workspace">
      <WorkspaceSidebar
        :items="workspaceNavItems"
        :active-step="activeStep"
        @select="setActiveStep"
      />

      <section class="tm-workspace-main">
        <div class="tm-workspace-notice" aria-live="polite">
          {{ lastAction }}
        </div>

        <p v-if="loadError" class="tm-error">{{ loadError }}</p>

        <template v-else>
          <article v-if="activeStep === 'overview'" class="tm-workspace-card">
            <header class="tm-section-header">
              <div>
                <p>Overview</p>
                <h2>项目总览</h2>
              </div>
              <strong>{{ getStatusLabel(projectStatus) }}</strong>
            </header>

            <section class="tm-hero-summary">
              <div>
                <span>项目名称</span>
                <h3>{{ projectTitle }}</h3>
                <span>项目摘要</span>
                <p>{{ project?.summary || '当前项目还没有摘要。' }}</p>
              </div>
              <div class="tm-progress-dial">
                <span>生产完成度</span>
                <strong>{{ projectProgress }}%</strong>
                <meter min="0" max="100" :value="projectProgress" />
              </div>
            </section>

            <section class="tm-overview-grid" aria-label="Project facts">
              <div>
                <span>项目类型</span>
                <strong>{{ getProjectTypeLabel(project?.type) }}</strong>
              </div>
              <div>
                <span>当前状态</span>
                <strong>{{ getStatusLabel(projectStatus) }}</strong>
              </div>
              <div>
                <span>累计字数</span>
                <strong>{{ project?.wordCount.toLocaleString() ?? 0 }}</strong>
              </div>
              <div>
                <span>资料数量</span>
                <strong>{{ materials.length }}</strong>
              </div>
            </section>

            <section class="tm-workflow-grid" aria-label="Production states">
              <article
                v-for="card in workflowCards"
                :key="card.title"
                class="tm-workflow-card"
              >
                <span>{{ card.title }}</span>
                <strong>{{ card.status }}</strong>
                <p>{{ card.detail }}</p>
                <meter min="0" max="100" :value="card.score" />
              </article>
            </section>

            <section class="tm-two-column">
              <article class="tm-inner-card">
                <header>
                  <p>Recent Versions</p>
                  <h3>最近版本</h3>
                </header>
                <div class="tm-list-stack compact">
                  <section v-for="version in recentVersions" :key="version.id">
                    <span>{{ version.operation }} / {{ version.model }}</span>
                    <h4>{{ formatUpdatedAt(version.createdAt) }}</h4>
                    <p>{{ version.outputSnapshot }}</p>
                  </section>
                  <section v-if="recentVersions.length === 0">
                    <h4>暂无版本</h4>
                    <p>生成、改写、审核或导出后会自动创建版本记录。</p>
                  </section>
                </div>
              </article>

              <article class="tm-inner-card next-action">
                <header>
                  <p>Next Action</p>
                  <h3>下一步推荐操作</h3>
                </header>
                <p>{{ nextRecommendedAction }}</p>
                <button type="button" @click="lastAction = nextRecommendedAction">
                  设为当前任务
                </button>
              </article>
            </section>
          </article>

          <article v-if="activeStep === 'settings'" class="tm-workspace-card">
            <header class="tm-section-header">
              <div>
                <p>Settings</p>
                <h2>创作设定</h2>
              </div>
              <strong>{{ settingCompleteness }}% 完整</strong>
            </header>

            <section class="tm-settings-grid">
              <article class="tm-inner-card">
                <header>
                  <p>Base</p>
                  <h3>基础设定卡</h3>
                </header>
                <dl>
                  <div>
                    <dt>目标读者</dt>
                    <dd>
                      {{
                        project?.settings.targetAudience ||
                        getSetupValue(['targetReader', 'targetAudience'])
                      }}
                    </dd>
                  </div>
                  <div>
                    <dt>模板</dt>
                    <dd>{{ project?.settings.templateId || '未使用模板' }}</dd>
                  </div>
                  <div>
                    <dt>生成策略</dt>
                    <dd>{{ project?.settings.generationStrategy || 'expand' }}</dd>
                  </div>
                </dl>
              </article>

              <article class="tm-inner-card">
                <header>
                  <p>Style</p>
                  <h3>风格设定卡</h3>
                </header>
                <div class="tm-chip-list">
                  <span
                    v-for="tag in project?.settings.styleTags ?? []"
                    :key="tag"
                  >
                    {{ tag }}
                  </span>
                  <span v-if="!project?.settings.styleTags?.length">
                    {{ project?.settings.tone || 'clear' }}
                  </span>
                </div>
              </article>

              <article class="tm-inner-card">
                <header>
                  <p>Character</p>
                  <h3>角色设定卡</h3>
                </header>
                <p>{{ getSetupValue(['protagonist']) }}</p>
              </article>

              <article class="tm-inner-card">
                <header>
                  <p>World</p>
                  <h3>世界观设定卡</h3>
                </header>
                <p>{{ getSetupValue(['worldview', 'existingMaterials', 'structureRequirement']) }}</p>
              </article>

              <article class="tm-inner-card">
                <header>
                  <p>Locked</p>
                  <h3>设定锁定项</h3>
                </header>
                <div class="tm-chip-list">
                  <span v-for="item in lockedSettings" :key="item">
                    {{ item }}
                  </span>
                  <span v-if="lockedSettings.length === 0">暂无锁定项</span>
                </div>
              </article>

              <article class="tm-inner-card tm-completeness-card">
                <header>
                  <p>Completeness</p>
                  <h3>设定完整度</h3>
                </header>
                <strong>{{ settingCompleteness }}%</strong>
                <meter min="0" max="100" :value="settingCompleteness" />
                <button type="button" @click="runSettingsMock">
                  AI 补全设定 Mock
                </button>
                <p class="tm-feedback">{{ settingsFeedback }}</p>
              </article>
            </section>
          </article>

          <article v-if="activeStep === 'materials'" class="tm-workspace-card">
            <header class="tm-section-header">
              <div>
                <p>Materials</p>
                <h2>资料库</h2>
              </div>
              <strong>{{ materials.length }} 条资料</strong>
            </header>

            <section class="tm-material-toolbar">
              <button type="button" @click="runMaterialMock('add')">
                新增资料
              </button>
              <button type="button" @click="runMaterialMock('import')">
                导入文本
              </button>
              <button type="button" @click="runMaterialMock('conflict')">
                资料冲突检查 Mock
              </button>
              <span>{{ materialFeedback }}</span>
            </section>

            <section class="tm-material-layout">
              <div class="tm-material-list" aria-label="Material cards">
                <header>
                  <p>资料卡片列表</p>
                </header>
                <button
                  v-for="material in materials"
                  :key="material.id"
                  type="button"
                  :class="{ selected: selectedMaterial?.id === material.id }"
                  @click="selectedMaterialId = material.id"
                >
                  <span>{{ material.type }}</span>
                  <strong>{{ material.title }}</strong>
                  <p>{{ material.content }}</p>
                  <footer>
                    <small>引用 {{ material.usageCount }} 次</small>
                    <small>{{ formatUpdatedAt(material.updatedAt) }}</small>
                  </footer>
                </button>
              </div>

              <aside class="tm-material-preview">
                <p>Current Preview</p>
                <h3>{{ selectedMaterial?.title || '未选择资料' }}</h3>
                <article>
                  {{ selectedMaterial?.content || '选择左侧资料卡片查看内容。' }}
                </article>
                <div class="tm-chip-list">
                  <span
                    v-for="tag in selectedMaterial?.tags ?? []"
                    :key="tag"
                  >
                    {{ tag }}
                  </span>
                  <span v-if="!selectedMaterial?.tags.length">无标签</span>
                </div>
                <dl>
                  <div>
                    <dt>引用次数</dt>
                    <dd>{{ selectedMaterial?.usageCount ?? 0 }}</dd>
                  </div>
                  <div>
                    <dt>全库标签</dt>
                    <dd>{{ materialTags.join(' / ') || '暂无标签' }}</dd>
                  </div>
                </dl>
              </aside>
            </section>
          </article>

          <article v-if="activeStep === 'outline'" class="tm-workspace-card">
            <header class="tm-section-header">
              <div>
                <p>Outline Factory</p>
                <h2>大纲工厂</h2>
              </div>
              <button
                type="button"
                class="tm-primary-action"
                :disabled="isGeneratingOutline"
                @click="generateOutlineCandidate"
              >
                {{ isGeneratingOutline ? '生成中...' : '生成大纲' }}
              </button>
            </header>

            <section class="tm-segmented-control" aria-label="Outline level">
              <button
                v-for="level in outlineLevels"
                :key="level.value"
                type="button"
                :class="{ active: outlineLevel === level.value }"
                @click="outlineLevel = level.value"
              >
                {{ level.label }}
              </button>
            </section>

            <section class="tm-outline-layout">
              <article class="tm-inner-card">
                <header>
                  <p>Total Plot</p>
                  <h3>总剧情大纲</h3>
                </header>
                <p class="tm-preline">{{ totalPlotOutline }}</p>
              </article>

              <article class="tm-inner-card">
                <header>
                  <p>Episode Structure</p>
                  <h3>分集结构</h3>
                </header>
                <div class="tm-episode-grid">
                  <section v-for="episode in episodeStructure" :key="episode.label">
                    <span>{{ episode.label }}</span>
                    <strong>{{ episode.title }}</strong>
                    <p>{{ episode.summary }}</p>
                  </section>
                </div>
              </article>
            </section>

            <section v-if="isShortDramaProject" class="tm-short-drama-rules">
              <article v-for="rule in shortDramaRules" :key="rule.label">
                <span>{{ rule.label }}</span>
                <strong>{{ rule.value }}</strong>
              </article>
            </section>

            <section class="tm-candidate-panel" aria-label="Outline candidates">
              <header>
                <p>Candidate</p>
                <h3>大纲候选区</h3>
              </header>
              <p class="tm-feedback">{{ outlineFeedback }}</p>
              <pre>{{ outlineCandidate || '点击“生成大纲”后，Mock AI 结果会进入这里，不会覆盖总剧情大纲。' }}</pre>
            </section>
          </article>

          <article v-if="activeStep === 'editor'" class="tm-workspace-card tm-editor-card">
            <header class="tm-section-header">
              <div>
                <p>Editor</p>
                <h2>正文生产</h2>
              </div>
              <button type="button" class="tm-primary-action" @click="generateEditorCandidate">
                生成正文候选
              </button>
            </header>

            <section class="tm-editor-toolbar">
              <label>
                文档选择
                <select v-model="selectedEditorDocumentId">
                  <option
                    v-for="option in productionDocumentOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }} - {{ option.title }}
                  </option>
                </select>
              </label>
              <div>
                <span>字数统计</span>
                <strong>{{ editorWordCount }}</strong>
              </div>
              <div>
                <span>自动保存状态</span>
                <strong>{{ autoSaveFeedback }}</strong>
              </div>
            </section>

            <section class="tm-editor-layout">
              <label class="tm-markdown-editor">
                Markdown 文本编辑区
                <textarea
                  ref="editorTextarea"
                  v-model="editorContent"
                  placeholder="在这里生产正文。AI 候选必须经过确认才会进入正文。"
                />
              </label>

              <aside class="tm-candidate-panel">
                <header>
                  <p>Candidate</p>
                  <h3>AI 候选结果区</h3>
                </header>
                <p class="tm-feedback">{{ editorFeedback }}</p>
                <pre>{{ editorCandidate || '生成正文候选后显示在这里。' }}</pre>
                <div class="tm-candidate-actions">
                  <button type="button" @click="insertCandidateAtCursor">
                    插入到光标
                  </button>
                  <button type="button" @click="replaceSelectionWithCandidate">
                    替换选中
                  </button>
                  <button type="button" @click="saveEditorCandidateAsVersion">
                    保存为新版本
                  </button>
                </div>
              </aside>
            </section>
          </article>

          <article v-if="activeStep === 'rewrite'" class="tm-workspace-card">
            <header class="tm-section-header">
              <div>
                <p>Rewrite Factory</p>
                <h2>改写工厂</h2>
              </div>
              <button type="button" class="tm-primary-action" @click="generateRewriteCandidate">
                生成改写候选
              </button>
            </header>

            <section class="tm-rewrite-options">
              <div>
                <span>改写方式</span>
                <button
                  v-for="mode in rewriteModes"
                  :key="mode"
                  type="button"
                  :class="{ active: rewriteMode === mode }"
                  @click="rewriteMode = mode"
                >
                  {{ mode }}
                </button>
              </div>
              <label>
                <input v-model="rewriteLocks.keepMeaning" type="checkbox" />
                保持原意
              </label>
              <label>
                <input v-model="rewriteLocks.keepNames" type="checkbox" />
                保持人名
              </label>
              <label>
                <input v-model="rewriteLocks.keepWorldview" type="checkbox" />
                保持世界观
              </label>
            </section>

            <section class="tm-rewrite-grid">
              <label>
                左侧原文
                <textarea v-model="rewriteOriginal" />
                <button type="button" @click="useEditorContentForRewrite">
                  使用当前正文
                </button>
              </label>

              <label>
                右侧改写结果
                <textarea
                  v-model="rewriteResult"
                  placeholder="改写候选会显示在这里，不会直接覆盖正文。"
                />
                <button type="button" @click="applyRewriteResult">
                  应用改写并保存 Mock 版本
                </button>
              </label>
            </section>

            <section class="tm-diff-panel">
              <header>
                <p>Diff</p>
                <h3>差异对比区域</h3>
              </header>
              <p class="tm-feedback">{{ rewriteFeedback }}</p>
              <div class="tm-diff-grid">
                <article>
                  <span>原文</span>
                  <p>{{ rewriteOriginal || '暂无原文。' }}</p>
                </article>
                <article>
                  <span>改写</span>
                  <p>{{ rewriteResult || '暂无改写结果。' }}</p>
                </article>
                <article>
                  <span>变化</span>
                  <p>{{ rewriteDiff.summary }}</p>
                </article>
              </div>
            </section>
          </article>

          <article v-if="activeStep === 'review'" class="tm-workspace-card">
            <header class="tm-section-header">
              <div>
                <p>Review Factory</p>
                <h2>审核工厂</h2>
              </div>
              <button
                type="button"
                class="tm-primary-action"
                :disabled="isReviewing"
                @click="startReview"
              >
                {{ isReviewing ? '审核中...' : '开始审核' }}
              </button>
            </header>

            <section class="tm-review-toolbar">
              <label>
                <span>选择审核文档</span>
                <select v-model="selectedReviewDocumentId">
                  <option
                    v-for="document in reviewTargetDocuments"
                    :key="document.id"
                    :value="document.id"
                  >
                    {{ document.title }} / {{ document.type }}
                  </option>
                </select>
              </label>
              <span>{{ reviewFeedback }}</span>
            </section>

            <section class="tm-review-type-grid tm-workflow-grid">
              <button
                v-for="type in reviewTypes"
                :key="type"
                type="button"
                :class="{ active: selectedReviewTypes.includes(type) }"
                @click="toggleReviewType(type)"
              >
                <strong>{{ type }}</strong>
                <span>{{ reviewIssueTemplates[type].title }}</span>
              </button>
            </section>

            <div class="tm-review-layout tm-two-column">
              <section class="tm-issue-list">
                <button
                  v-for="issue in reviewIssues"
                  :key="issue.id"
                  type="button"
                  :class="[
                    'tm-issue-card',
                    issue.status,
                    { selected: selectedReviewIssue?.id === issue.id },
                  ]"
                  @click="selectedReviewIssueId = issue.id"
                >
                  <span :class="['tm-level-pill', `level-${issue.level}`]">
                    {{ issue.level }}
                  </span>
                  <strong>{{ issue.title }}</strong>
                  <small>{{ issue.type }} / {{ issue.status }}</small>
                </button>

                <article v-if="reviewIssues.length === 0" class="tm-inner-card">
                  <h3>暂无审核问题</h3>
                  <p>
                    选择文档和审核类型后点击“开始审核”，Mock 问题会显示在这里，并写入 review 版本记录。
                  </p>
                </article>
              </section>

              <aside class="tm-issue-detail">
                <template v-if="selectedReviewIssue">
                  <p>Issue Detail</p>
                  <h3>{{ selectedReviewIssue.title }}</h3>
                  <dl>
                    <div>
                      <dt>等级</dt>
                      <dd>{{ selectedReviewIssue.level }}</dd>
                    </div>
                    <div>
                      <dt>类型</dt>
                      <dd>{{ selectedReviewIssue.type }}</dd>
                    </div>
                    <div>
                      <dt>状态</dt>
                      <dd>{{ selectedReviewIssue.status }}</dd>
                    </div>
                  </dl>
                  <article>
                    <h4>问题详情</h4>
                    <p class="tm-preline">{{ selectedReviewIssue.detail }}</p>
                  </article>
                  <article>
                    <h4>修复建议</h4>
                    <p>{{ selectedReviewIssue.suggestion }}</p>
                  </article>
                  <div class="tm-issue-actions">
                    <button
                      type="button"
                      @click="ignoreReviewIssue(selectedReviewIssue.id)"
                    >
                      忽略
                    </button>
                    <button
                      type="button"
                      @click="copyReviewSuggestion(selectedReviewIssue)"
                    >
                      复制建议
                    </button>
                    <button
                      type="button"
                      class="tm-primary-action"
                      @click="applyReviewRepairMock(selectedReviewIssue)"
                    >
                      应用修复 Mock
                    </button>
                  </div>
                </template>
                <p v-else>点击问题后查看详情和修复动作。</p>
              </aside>
            </div>
          </article>

          <article v-if="activeStep === 'versions'" class="tm-workspace-card">
            <header class="tm-section-header">
              <div>
                <p>Versions</p>
                <h2>版本记录</h2>
              </div>
            </header>

            <div class="tm-version-layout tm-two-column">
              <section class="tm-version-timeline">
                <button
                  v-for="version in versions"
                  :key="version.id"
                  type="button"
                  :class="{ selected: selectedVersion?.id === version.id }"
                  @click="selectVersion(version.id)"
                >
                  <span>{{ operationLabels[version.operation] }}</span>
                  <strong>{{ formatUpdatedAt(version.createdAt) }}</strong>
                  <small>{{ version.operation }} / {{ version.model }}</small>
                  <em v-if="excellentVersionIds.includes(version.id)">优秀</em>
                </button>

                <article v-if="versions.length === 0" class="tm-inner-card">
                  <h3>暂无版本</h3>
                  <p>生成、改写、审核、修复、手动编辑和导出都会进入这里。</p>
                </article>
              </section>

              <aside class="tm-version-detail">
                <template v-if="selectedVersion">
                  <p>Version Detail</p>
                  <h3>{{ operationLabels[selectedVersion.operation] }}版本</h3>
                  <dl>
                    <div>
                      <dt>操作类型</dt>
                      <dd>{{ selectedVersion.operation }}</dd>
                    </div>
                    <div>
                      <dt>模型</dt>
                      <dd>{{ selectedVersion.model }}</dd>
                    </div>
                    <div>
                      <dt>创建人</dt>
                      <dd>{{ selectedVersion.createdBy }}</dd>
                    </div>
                    <div>
                      <dt>时间</dt>
                      <dd>{{ formatUpdatedAt(selectedVersion.createdAt) }}</dd>
                    </div>
                  </dl>
                  <section class="tm-version-snapshot">
                    <h4>输出快照</h4>
                    <pre>{{ selectedVersion.outputSnapshot }}</pre>
                  </section>
                  <section class="tm-version-snapshot">
                    <h4>输入快照</h4>
                    <pre>{{ selectedVersion.inputSnapshot || '无输入快照' }}</pre>
                  </section>
                  <div class="tm-version-actions">
                    <button type="button" @click="compareSelectedVersionMock">
                      版本对比 Mock
                    </button>
                    <button type="button" @click="restoreSelectedVersionMock">
                      恢复版本 Mock
                    </button>
                    <button
                      type="button"
                      class="tm-primary-action"
                      @click="markExcellentVersionMock"
                    >
                      标记优秀 Mock
                    </button>
                  </div>
                  <p>{{ versionFeedback }}</p>
                  <p>{{ versionCompareFeedback }}</p>
                </template>
                <p v-else>选择一个版本查看详情。</p>
              </aside>
            </div>
          </article>

          <article v-if="activeStep === 'export'" class="tm-workspace-card">
            <header class="tm-section-header">
              <div>
                <p>Export</p>
                <h2>导出中心</h2>
              </div>
              <button
                type="button"
                class="tm-primary-action"
                :disabled="isExporting"
                @click="runExport"
              >
                {{ isExporting ? '导出中...' : '执行导出' }}
              </button>
            </header>

            <p class="tm-workspace-copy">{{ exportFeedback }}</p>

            <div class="tm-export-layout">
              <section class="tm-export-panel">
                <h3>选择导出内容</h3>
                <div class="tm-export-options">
                  <label
                    v-for="option in exportContentOptions"
                    :key="option.key"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedExportSections.includes(option.key)"
                      @change="toggleExportSection(option.key)"
                    />
                    <span>
                      <strong>{{ option.label }}</strong>
                      <small>{{ option.description }}</small>
                    </span>
                  </label>
                </div>
              </section>

              <section class="tm-export-panel">
                <h3>选择导出格式</h3>
                <div class="tm-export-format-grid">
                  <button
                    v-for="format in supportedExportFormats"
                    :key="format.value"
                    type="button"
                    :class="{ active: selectedExportFormat === format.value }"
                    @click="selectedExportFormat = format.value"
                  >
                    <strong>{{ format.label }}</strong>
                    <span>{{ format.description }}</span>
                  </button>
                  <button
                    v-for="format in deferredExportFormats"
                    :key="format.value"
                    type="button"
                    disabled
                  >
                    <strong>{{ format.label }}</strong>
                    <span>{{ format.description }}</span>
                  </button>
                </div>
              </section>

              <section class="tm-export-panel">
                <h3>选择导出目标</h3>
                <div class="tm-export-targets">
                  <button
                    v-for="target in exportTargets"
                    :key="target.key"
                    type="button"
                    :class="{ active: selectedExportTarget === target.key }"
                    @click="selectedExportTarget = target.key"
                  >
                    <strong>{{ target.label }}</strong>
                    <span>{{ target.description }}</span>
                  </button>
                </div>
              </section>

              <aside class="tm-export-preview">
                <p>Export Preview</p>
                <h3>{{ projectTitle }}</h3>
                <dl>
                  <div>
                    <dt>格式</dt>
                    <dd>{{ selectedExportFormat }}</dd>
                  </div>
                  <div>
                    <dt>内容</dt>
                    <dd>{{ selectedExportLabels.join(' / ') || '未选择' }}</dd>
                  </div>
                  <div>
                    <dt>目标</dt>
                    <dd>{{ selectedExportTargetLabel }}</dd>
                  </div>
                </dl>
                <pre>{{ buildExportContent(selectedExportFormat).slice(0, 1200) }}</pre>
              </aside>
            </div>
          </article>
        </template>
      </section>

      <AiActionPanel
        :project-status="projectStatus"
        :progress="projectProgress"
        :runtime-mode="runtimeMode"
        @action="handleAiAction"
        @open-versions="activeStep = 'versions'"
      />
    </section>
  </main>
</template>

<style scoped>
.tm-workspace-page {
  display: grid;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  grid-template-rows: auto minmax(0, 1fr);
  background: #050506;
  color: #f4f4f5;
}

.tm-workspace-body {
  display: grid;
  min-height: 0;
  min-width: 0;
  grid-template-columns: 220px minmax(0, 1fr) 300px;
}

.tm-workspace-main {
  min-width: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 18px;
}

.tm-workspace-notice {
  border: 1px solid rgba(161, 161, 170, 0.16);
  border-radius: 999px;
  background: #111113;
  color: #a1a1aa;
  margin-bottom: 12px;
  padding: 8px 12px;
  font-size: 12px;
}

.tm-workspace-card,
.tm-inner-card,
.tm-candidate-panel,
.tm-diff-panel {
  min-width: 0;
  border: 1px solid rgba(161, 161, 170, 0.16);
  border-radius: 8px;
  background: rgba(24, 24, 27, 0.92);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
}

.tm-workspace-card {
  padding: 22px;
}

.tm-inner-card,
.tm-candidate-panel,
.tm-diff-panel {
  background: #111113;
  padding: 16px;
}

.tm-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.tm-section-header > strong {
  border: 1px solid rgba(161, 161, 170, 0.18);
  border-radius: 999px;
  background: #18181b;
  padding: 6px 10px;
  font-size: 12px;
}

.tm-section-header p,
.tm-overview-grid span,
.tm-workflow-card span,
.tm-inner-card header p,
.tm-list-stack span,
.tm-material-list header p,
.tm-material-list span,
.tm-material-preview p,
.tm-material-preview dt,
.tm-candidate-panel header p,
.tm-diff-panel header p,
.tm-diff-grid span,
.tm-editor-toolbar span,
.tm-short-drama-rules span,
.tm-episode-grid span,
.tm-rewrite-options span {
  color: #a1a1aa;
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.tm-section-header h2,
.tm-hero-summary h3,
.tm-inner-card h3,
.tm-material-preview h3,
.tm-candidate-panel h3,
.tm-diff-panel h3 {
  margin: 6px 0 0;
}

.tm-section-header h2 {
  font-size: 24px;
}

.tm-hero-summary,
.tm-two-column,
.tm-material-layout,
.tm-outline-layout,
.tm-editor-layout,
.tm-rewrite-grid,
.tm-diff-grid {
  display: grid;
  gap: 16px;
  margin-top: 18px;
}

.tm-hero-summary,
.tm-outline-layout,
.tm-editor-layout,
.tm-rewrite-grid {
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.9fr);
}

.tm-hero-summary > div,
.tm-progress-dial,
.tm-overview-grid div,
.tm-workflow-card,
.tm-list-stack section,
.tm-episode-grid section,
.tm-short-drama-rules article,
.tm-diff-grid article {
  min-width: 0;
  border-radius: 8px;
  background: #111113;
  padding: 16px;
}

.tm-hero-summary h3 {
  font-size: 28px;
}

.tm-hero-summary p,
.tm-workspace-copy,
.tm-list-stack p,
.tm-inner-card p,
.tm-workflow-card p,
.tm-material-list p,
.tm-material-preview article,
.tm-feedback,
.tm-episode-grid p,
.tm-diff-grid p {
  color: #c4c4c8;
  line-height: 1.75;
}

.tm-progress-dial {
  display: grid;
  align-content: center;
  gap: 12px;
}

.tm-progress-dial strong {
  font-size: 34px;
}

.tm-overview-grid,
.tm-workflow-grid,
.tm-settings-grid,
.tm-short-drama-rules,
.tm-episode-grid {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.tm-overview-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.tm-workflow-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.tm-workflow-card strong,
.tm-overview-grid strong {
  display: block;
  margin-top: 8px;
  font-size: 18px;
}

.tm-workflow-card meter,
.tm-progress-dial meter,
.tm-completeness-card meter {
  width: 100%;
}

.tm-two-column {
  grid-template-columns: minmax(0, 1.1fr) minmax(260px, 0.9fr);
}

.tm-list-stack {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.tm-list-stack.compact p {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.tm-list-stack h3,
.tm-list-stack h4 {
  margin: 6px 0 0;
}

.next-action button,
.tm-completeness-card button,
.tm-material-toolbar button,
.tm-export-link,
.tm-primary-action,
.tm-candidate-actions button,
.tm-rewrite-options button,
.tm-rewrite-grid button,
.tm-review-toolbar button,
.tm-review-type-grid button,
.tm-issue-actions button,
.tm-version-timeline button,
.tm-version-actions button,
.tm-export-format-grid button,
.tm-export-targets button {
  min-height: 40px;
  border: 1px solid rgba(212, 212, 216, 0.18);
  border-radius: 6px;
  background: #27272a;
  color: #f4f4f5;
  padding: 0 14px;
}

.tm-primary-action {
  border-color: rgba(129, 140, 248, 0.62);
  background: #2f3347;
  color: #eef2ff;
  font-weight: 700;
}

.tm-primary-action:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.next-action button {
  margin-top: 14px;
}

.tm-settings-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tm-inner-card dl,
.tm-material-preview dl {
  display: grid;
  gap: 10px;
  margin: 12px 0 0;
}

.tm-inner-card dt,
.tm-material-preview dt {
  color: #a1a1aa;
  font-size: 12px;
}

.tm-inner-card dd,
.tm-material-preview dd {
  margin: 6px 0 0;
  word-break: break-word;
}

.tm-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tm-chip-list span {
  border: 1px solid rgba(161, 161, 170, 0.18);
  border-radius: 999px;
  background: #18181b;
  color: #d4d4d8;
  padding: 6px 10px;
  font-size: 12px;
}

.tm-completeness-card strong {
  display: block;
  margin: 14px 0 8px;
  font-size: 32px;
}

.tm-completeness-card button {
  margin-top: 14px;
}

.tm-material-toolbar,
.tm-editor-toolbar,
.tm-rewrite-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
}

.tm-material-toolbar span,
.tm-editor-toolbar strong {
  color: #a1a1aa;
  font-size: 13px;
}

.tm-material-layout {
  grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
}

.tm-material-list {
  display: grid;
  gap: 12px;
}

.tm-material-list button {
  display: grid;
  gap: 8px;
  width: 100%;
  min-width: 0;
  border: 1px solid rgba(161, 161, 170, 0.16);
  border-radius: 8px;
  background: #111113;
  color: inherit;
  padding: 16px;
  text-align: left;
}

.tm-material-list button.selected {
  border-color: rgba(129, 140, 248, 0.5);
  background: #27272a;
}

.tm-material-list footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #a1a1aa;
}

.tm-material-preview {
  min-width: 0;
  border: 1px solid rgba(161, 161, 170, 0.16);
  border-radius: 8px;
  background: #111113;
  padding: 16px;
}

.tm-material-preview article {
  margin-top: 14px;
}

.tm-segmented-control {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.tm-segmented-control button,
.tm-rewrite-options button.active {
  border: 1px solid rgba(161, 161, 170, 0.18);
  border-radius: 999px;
  background: #18181b;
  color: #d4d4d8;
  padding: 8px 12px;
}

.tm-segmented-control button.active,
.tm-rewrite-options button.active {
  border-color: rgba(129, 140, 248, 0.54);
  background: #1f2130;
  color: #eef2ff;
}

.tm-preline,
.tm-candidate-panel pre {
  white-space: pre-wrap;
}

.tm-short-drama-rules {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.tm-episode-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tm-candidate-panel {
  margin-top: 18px;
}

.tm-candidate-panel pre {
  min-height: 160px;
  max-height: 340px;
  overflow: auto;
  border-radius: 8px;
  background: #09090b;
  color: #d4d4d8;
  padding: 14px;
}

.tm-editor-toolbar label {
  display: grid;
  gap: 8px;
  min-width: min(100%, 320px);
}

.tm-editor-toolbar select,
.tm-markdown-editor textarea,
.tm-rewrite-grid textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid rgba(161, 161, 170, 0.18);
  border-radius: 8px;
  background: #09090b;
  color: #f4f4f5;
  padding: 12px;
}

.tm-markdown-editor,
.tm-rewrite-grid label {
  display: grid;
  gap: 10px;
  min-width: 0;
  color: #d4d4d8;
}

.tm-markdown-editor textarea {
  min-height: 440px;
  max-height: min(62vh, 620px);
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 15px;
  line-height: 1.78;
  resize: vertical;
}

.tm-candidate-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.tm-rewrite-options label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #d4d4d8;
  font-size: 13px;
}

.tm-rewrite-grid textarea {
  min-height: 280px;
  max-height: min(48vh, 520px);
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 15px;
  line-height: 1.75;
  resize: vertical;
}

.tm-diff-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.tm-review-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 14px;
  margin-top: 18px;
}

.tm-review-toolbar label,
.tm-export-options label {
  display: grid;
  gap: 8px;
  min-width: min(100%, 320px);
}

.tm-review-toolbar select {
  width: 100%;
  min-width: 0;
  border: 1px solid rgba(161, 161, 170, 0.18);
  border-radius: 8px;
  background: #09090b;
  color: #f4f4f5;
  padding: 12px;
}

.tm-review-toolbar span,
.tm-export-options small,
.tm-export-format-grid span,
.tm-export-targets span {
  color: #a1a1aa;
  font-size: 12px;
}

.tm-review-type-grid {
  margin-top: 18px;
}

.tm-review-type-grid button,
.tm-export-format-grid button,
.tm-export-targets button {
  display: grid;
  gap: 6px;
  min-width: 0;
  text-align: left;
}

.tm-review-type-grid button.active,
.tm-export-format-grid button.active,
.tm-export-targets button.active {
  border-color: rgba(129, 140, 248, 0.54);
  background: #1f2130;
  color: #eef2ff;
}

.tm-review-type-grid button.active span,
.tm-export-format-grid button.active span,
.tm-export-targets button.active span {
  color: #c7d2fe;
}

.tm-review-layout,
.tm-version-layout {
  margin-top: 18px;
  grid-template-columns: minmax(260px, 0.85fr) minmax(0, 1.15fr);
}

.tm-issue-list,
.tm-version-timeline,
.tm-export-options,
.tm-export-format-grid,
.tm-export-targets {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.tm-issue-card,
.tm-version-timeline button {
  display: grid;
  gap: 8px;
  width: 100%;
  min-width: 0;
  text-align: left;
}

.tm-issue-card.selected,
.tm-version-timeline button.selected {
  border-color: rgba(129, 140, 248, 0.54);
  background: #18181b;
}

.tm-issue-card.ignored {
  opacity: 0.62;
}

.tm-issue-card.fixed {
  border-color: rgba(134, 239, 172, 0.34);
}

.tm-level-pill {
  width: fit-content;
  border-radius: 999px;
  background: #3f3f46;
  padding: 4px 8px;
  font-size: 12px;
}

.tm-issue-detail,
.tm-version-detail,
.tm-export-preview,
.tm-export-panel {
  min-width: 0;
  border: 1px solid rgba(161, 161, 170, 0.16);
  border-radius: 8px;
  background: #111113;
  padding: 16px;
}

.tm-issue-detail dl,
.tm-version-detail dl,
.tm-export-preview dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 14px 0;
}

.tm-issue-detail dt,
.tm-version-detail dt,
.tm-export-preview dt {
  color: #a1a1aa;
  font-size: 12px;
}

.tm-issue-detail dd,
.tm-version-detail dd,
.tm-export-preview dd {
  margin: 4px 0 0;
  word-break: break-word;
}

.tm-issue-actions,
.tm-version-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.tm-version-timeline em {
  width: fit-content;
  border-radius: 999px;
  background: rgba(250, 204, 21, 0.16);
  color: #fde68a;
  padding: 4px 8px;
  font-style: normal;
  font-size: 12px;
}

.tm-version-snapshot {
  margin-top: 14px;
}

.tm-version-snapshot pre,
.tm-export-preview pre {
  max-height: 260px;
  overflow: auto;
  white-space: pre-wrap;
  border-radius: 8px;
  background: #09090b;
  color: #d4d4d8;
  padding: 12px;
}

.tm-export-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  gap: 16px;
  margin-top: 18px;
}

.tm-export-panel {
  display: grid;
  gap: 12px;
}

.tm-export-preview {
  grid-column: 2;
  grid-row: 1 / span 3;
}

.tm-export-panel {
  grid-column: 1;
}

.tm-export-options label {
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  border: 1px solid rgba(161, 161, 170, 0.16);
  border-radius: 8px;
  background: #18181b;
  padding: 12px;
}

.tm-export-options span {
  display: grid;
  gap: 4px;
}

.tm-export-format-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.tm-export-format-grid button:disabled,
.tm-export-targets button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.tm-export-targets {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tm-export-link {
  display: inline-flex;
  align-items: center;
  margin-top: 18px;
  text-decoration: none;
}

.tm-error {
  color: #fca5a5;
}

@media (max-width: 1180px) {
  .tm-workflow-grid,
  .tm-short-drama-rules,
  .tm-diff-grid,
  .tm-export-format-grid,
  .tm-export-targets {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .tm-workspace-page {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .tm-workspace-body {
    grid-template-columns: 1fr;
  }

  .tm-workspace-main {
    overflow: visible;
  }

  .tm-overview-grid,
  .tm-settings-grid,
  .tm-hero-summary,
  .tm-two-column,
  .tm-material-layout,
  .tm-outline-layout,
  .tm-editor-layout,
  .tm-rewrite-grid,
  .tm-review-layout,
  .tm-version-layout,
  .tm-export-layout {
    grid-template-columns: 1fr;
  }

  .tm-export-panel,
  .tm-export-preview {
    grid-column: auto;
    grid-row: auto;
  }
}

@media (max-width: 640px) {
  .tm-overview-grid,
  .tm-workflow-grid,
  .tm-short-drama-rules,
  .tm-episode-grid,
  .tm-candidate-actions,
  .tm-diff-grid,
  .tm-issue-actions,
  .tm-version-actions,
  .tm-export-format-grid,
  .tm-export-targets {
    grid-template-columns: 1fr;
  }
}
</style>
