<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AiActionPanel from '../components/AiActionPanel.vue';
import TopNav from '../components/TopNav.vue';
import WorkspaceHeader from '../components/WorkspaceHeader.vue';
import WorkspaceSidebar from '../components/WorkspaceSidebar.vue';
import {
  buildNextRecommendedAction,
  buildProductionEntryCards,
  buildOverviewFlowCards,
  buildOverviewPendingItems,
  buildProductionDocumentOptions,
  buildProductionRules,
  buildWorkspaceNavItems,
  buildWorkflowCards,
  getProductionChainProfile,
  type WorkspaceStep,
} from '../workflows/productionChainProfiles';
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
  tone?: 'success' | 'running' | 'warning' | 'idle';
};

type ProductionEntryCard = {
  title: string;
  description: string;
  step: WorkspaceStep;
  tone?: 'success' | 'running' | 'warning' | 'idle';
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
  restore: '恢复',
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
const productionChainProfile = computed(() =>
  getProductionChainProfile(project.value?.type),
);
const projectPathLabel = computed(() => `项目中心 / ${projectTitle.value || routeProjectId.value || '当前项目'}`);
const projectProgress = computed(() => project.value?.progress ?? 0);
const projectStatus = computed(() => project.value?.status ?? 'unknown');
const autoSaveEnabled = computed(() => project.value?.settings.autoSave ?? true);
const updatedAtLabel = computed(() =>
  project.value ? formatUpdatedAt(project.value.updatedAt) : '',
);
const projectSetup = computed(() => project.value?.settings.projectSetup ?? {});
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
const workspaceNavItems = computed(() =>
  buildWorkspaceNavItems(productionChainProfile.value),
);
const workflowCards = computed<WorkflowCard[]>(() =>
  buildWorkflowCards(productionChainProfile.value, {
    settingCompleteness: settingCompleteness.value,
    materialsCount: materials.value.length,
    outlineCount: outlineDocuments.value.length,
    editableCount: editableDocuments.value.length,
    reviewCount: reviewDocuments.value.length,
    exportCount: exportDocuments.value.length,
  }),
);
const overviewPendingItems = computed(() =>
  buildOverviewPendingItems(productionChainProfile.value, {
    settingCompleteness: settingCompleteness.value,
    materialsCount: materials.value.length,
    outlineCount: outlineDocuments.value.length,
    editableCount: editableDocuments.value.length,
    reviewCount: reviewDocuments.value.length,
    exportCount: exportDocuments.value.length,
  }),
);
const overviewFlowCards = computed(() =>
  buildOverviewFlowCards(productionChainProfile.value, {
    settingCompleteness: settingCompleteness.value,
    materialsCount: materials.value.length,
    outlineCount: outlineDocuments.value.length,
    editableCount: editableDocuments.value.length,
    reviewCount: reviewDocuments.value.length,
    exportCount: exportDocuments.value.length,
  }),
);
const productionEntryCards = computed<ProductionEntryCard[]>(() =>
  buildProductionEntryCards(productionChainProfile.value),
);
const nextRecommendedAction = computed(() =>
  buildNextRecommendedAction(productionChainProfile.value, {
    settingCompleteness: settingCompleteness.value,
    materialsCount: materials.value.length,
    outlineCount: outlineDocuments.value.length,
    editableCount: editableDocuments.value.length,
    reviewCount: reviewDocuments.value.length,
    exportCount: exportDocuments.value.length,
  }),
);
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
const productionRules = computed(() =>
  buildProductionRules(project.value?.type, getSetupValue),
);
const productionDocumentOptions = computed(() =>
  buildProductionDocumentOptions(productionChainProfile.value, editableDocuments.value),
);
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
    const version = await runtime.createVersion({
      projectId: project.value.id,
      documentId: targetDocument.id,
      operation: 'generate',
      inputSnapshot: totalPlotOutline.value,
      outputSnapshot: outlineCandidate.value,
      model: 'mock-local',
      createdBy: 'local-user',
    });
    outlineFeedback.value = '大纲候选已生成，并已写入版本记录。';
    lastAction.value = 'Runtime.generateText 已生成大纲候选';
    selectedVersionId.value = version.id;
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
    const rewriteVersion = await runtime.createVersion({
      projectId: project.value.id,
      documentId: targetDocument.id,
      operation: 'rewrite',
      inputSnapshot: rewriteOriginal.value || editorContent.value,
      outputSnapshot: result.text,
      model: 'mock-local',
      createdBy: 'local-user',
    });
    rewriteFeedback.value = '改写候选已生成，并已写入版本记录。';
    selectedVersionId.value = rewriteVersion.id;
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
    const reviewVersion = await runtime.createVersion({
      projectId: project.value.id,
      documentId: targetDocument.id,
      operation: 'review',
      inputSnapshot: targetDocument.content || editorContent.value || totalPlotOutline.value,
      outputSnapshot: result.summary,
      model: 'mock-local',
      createdBy: 'local-user',
    });
    reviewFeedback.value = `已生成 ${reviewIssues.value.length} 条 Mock 审核问题，并保存 review 版本。`;
    lastAction.value = 'Runtime.reviewText 已完成审核并保存版本';
    selectedVersionId.value = reviewVersion.id;
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
    'text-master-json': 'application/json;charset=utf-8',
    'media-master-json': 'application/json;charset=utf-8',
    'novel-master-json': 'application/json;charset=utf-8',
    'project-package-json': 'application/json;charset=utf-8',
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
    xiaohongshu: '小红书文案',
    business_bp: '商业 BP',
    investment_copy: '招商文案',
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
    <TopNav />

    <WorkspaceHeader
      :project-path="projectPathLabel"
      :project-title="projectTitle"
      :auto-save-enabled="autoSaveEnabled"
      :updated-at="updatedAtLabel"
    />

    <section class="tm-workspace-body" aria-label="Text Master workspace" data-testid="text-master-workspace">
      <WorkspaceSidebar
        data-testid="text-master-sidebar"
        :items="workspaceNavItems"
        :active-step="activeStep"
        @select="setActiveStep"
      />

      <section class="tm-workspace-main" data-testid="text-master-main">
        <div v-if="activeStep !== 'overview'" class="tm-workspace-notice" aria-live="polite">
          {{ lastAction }}
        </div>

        <p v-if="loadError" class="tm-error">{{ loadError }}</p>

        <template v-else>
          <article v-if="activeStep === 'overview'" class="tm-workspace-card" data-testid="workspace-overview">
            <section class="tm-overview-shell">
              <header class="tm-overview-title tm-overview-hero">
                <div>
                  <p>Project Overview</p>
                  <h2>{{ productionChainProfile.typeLabel }}总览</h2>
                  <span>{{ productionChainProfile.heroNote }}</span>
                </div>
                <strong>{{ getStatusLabel(projectStatus) }}</strong>
              </header>

              <section class="tm-overview-metrics" aria-label="Overview metrics">
                <article>
                  <span>项目进度</span>
                  <strong>{{ projectProgress }}%</strong>
                  <meter min="0" max="100" :value="projectProgress" />
                  <small>生产中</small>
                </article>
                <article>
                  <span>项目类型</span>
                  <strong>{{ getProjectTypeLabel(project?.type) }}</strong>
                  <small>生产模板</small>
                </article>
                <article>
                  <span>总字数</span>
                  <strong>{{ project?.wordCount.toLocaleString() ?? 0 }}</strong>
                  <small>已生成</small>
                </article>
                <article>
                  <span>待处理事项</span>
                  <strong>{{ overviewPendingItems.length }}</strong>
                  <small>审核问题 / 阻塞项</small>
                </article>
              </section>

              <section class="tm-overview-summary">
                <p>项目摘要</p>
                <h3>{{ projectTitle }}</h3>
                <div class="tm-overview-summary-meta">
                  <span>项目名称：{{ projectTitle }}</span>
                  <span>项目类型：{{ getProjectTypeLabel(project?.type) }}</span>
                </div>
                <p class="tm-workspace-copy">
                  {{ project?.summary || '当前项目尚未填写摘要，请先补齐创作设定后继续推进。' }}
                </p>
              </section>

              <section class="tm-overview-production">
                <header>
                  <div>
                    <p>Production Stages</p>
                    <h3>{{ productionChainProfile.labels.outline }} / {{ productionChainProfile.labels.editor }}</h3>
                  </div>
                  <span>阶段状态用于判断下一步，不展开正文编辑。</span>
                </header>

                <div class="tm-overview-flow">
                  <article v-for="card in overviewFlowCards" :key="card.title" :class="['tm-flow-card', `tone-${card.tone}`]">
                    <div>
                      <strong>{{ card.title }}</strong>
                      <em>{{ card.status }}</em>
                    </div>
                    <p>{{ card.detail }}</p>
                  </article>
                </div>
              </section>

              <section class="tm-overview-entry">
                <header>
                  <div>
                    <p>Quick Entry</p>
                    <h3>{{ productionChainProfile.typeLabel }}入口</h3>
                  </div>
                  <span>直接跳转到当前类型最常用的生产节点。</span>
                </header>

                <div class="tm-overview-entry-grid">
                  <button
                    v-for="entry in productionEntryCards"
                    :key="entry.title"
                    type="button"
                    :class="['tm-entry-card', `tone-${entry.tone ?? 'idle'}`]"
                    @click="setActiveStep(entry.step); lastAction = `已切换到 ${entry.title}`"
                  >
                    <strong>{{ entry.title }}</strong>
                    <p>{{ entry.description }}</p>
                    <span>进入 {{ entry.step }}</span>
                  </button>
                </div>
              </section>

              <section class="tm-overview-next">
                <article class="tm-inner-card tm-pending-card">
                  <header>
                    <p>待处理事项</p>
                    <h3>下一步动作</h3>
                  </header>
                  <ul>
                    <li v-for="item in overviewPendingItems" :key="item">{{ item }}</li>
                    <li v-if="overviewPendingItems.length === 0">当前暂无明显阻塞项，可以继续推进生产链路。</li>
                  </ul>
                </article>
                <article class="tm-inner-card next-action">
                  <header>
                    <p>Recommended</p>
                    <h3>下一步推荐操作</h3>
                  </header>
                  <p>{{ nextRecommendedAction }}</p>
                  <button type="button" @click="lastAction = nextRecommendedAction">
                    设为当前任务
                  </button>
                </article>
              </section>

            </section>

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

          <article v-if="activeStep === 'settings'" class="tm-workspace-card" data-testid="workspace-settings">
            <header class="tm-section-header">
              <div>
                <p>Settings</p>
                <h2>{{ productionChainProfile.labels.settings }}</h2>
              </div>
              <span class="tm-completeness-pill">
                <span class="tm-pill-dot" :class="settingCompleteness >= 80 ? 'done' : settingCompleteness >= 40 ? 'warn' : 'idle'" />
                {{ settingCompleteness }}% 完整度
              </span>
            </header>

            <div class="tm-settings-grid-v2">
              <!-- Row 1: 基础设定 (wide) + 风格设定 -->
              <div class="tm-settings-row">
                <article class="tm-settings-card-v2 tm-settings-card-wide">
                  <header>
                    <p>Base</p>
                    <h3>基础设定</h3>
                  </header>
                  <div class="tm-settings-fields">
                    <div class="tm-settings-text-block">
                      <strong>目标读者</strong>
                      <p>{{ project?.settings.targetAudience || getSetupValue(['targetReader', 'targetAudience']) || '请设定目标读者群体' }}</p>
                    </div>
                    <div class="tm-settings-text-block">
                      <strong>项目摘要</strong>
                      <p>{{ project?.summary || '请先补齐项目摘要，再继续推进后续链路。' }}</p>
                    </div>
                    <div class="tm-settings-text-block">
                      <strong>生成策略</strong>
                      <p>{{ project?.settings.generationStrategy || '默认生成策略' }}</p>
                    </div>
                  </div>
                </article>

                <article class="tm-settings-card-v2">
                  <header>
                    <p>Style</p>
                    <h3>风格设定</h3>
                  </header>
                  <div class="tm-settings-long-text">
                    <p>{{ project?.settings.tone || '以低饱和、专业、可执行为主的文本风格。' }}</p>
                  </div>
                  <div class="tm-chip-list">
                    <span v-for="tag in project?.settings.styleTags ?? []" :key="tag">{{ tag }}</span>
                    <span v-if="!project?.settings.styleTags?.length" class="tm-chip-muted">默认风格</span>
                  </div>
                </article>
              </div>

              <!-- Row 2: 角色设定 + 世界观设定 (both long-text cards) -->
              <div class="tm-settings-row">
                <article class="tm-settings-card-v2">
                  <header>
                    <p>Character</p>
                    <h3>角色设定</h3>
                  </header>
                  <div class="tm-settings-long-text">
                    <p>{{ getSetupValue(['protagonist']) || '角色目标、动机、阻力和关系网会在这里集中呈现。' }}</p>
                  </div>
                </article>

                <article class="tm-settings-card-v2">
                  <header>
                    <p>World</p>
                    <h3>世界观设定</h3>
                  </header>
                  <div class="tm-settings-long-text">
                    <p>{{ getSetupValue(['worldview', 'existingMaterials', 'structureRequirement']) || '世界规则、边界条件、时间线和限制项会集中展示。' }}</p>
                  </div>
                </article>
              </div>

              <!-- Row 3: 已锁定项 (wide) -->
              <div class="tm-settings-row">
                <article class="tm-settings-card-v2 tm-settings-card-wide tm-settings-locks-card">
                  <header>
                    <p>Locked</p>
                    <h3>已锁定设定</h3>
                  </header>
                  <div class="tm-chip-list">
                    <span v-for="item in lockedSettings" :key="item" class="tm-lock-chip">
                      <span class="tm-lock-icon">🔒</span>
                      {{ item }}
                    </span>
                    <span v-if="lockedSettings.length === 0" class="tm-chip-muted">暂无锁定项 — 完成基础设定后可锁定核心规则</span>
                  </div>
                </article>
              </div>

              <!-- AI 操作区 -->
              <div class="tm-settings-ai-row">
                <article class="tm-settings-card-v2 tm-settings-ai-card">
                  <header>
                    <p>AI Actions</p>
                    <h3>AI 操作</h3>
                  </header>
                  <div class="tm-settings-actions">
                    <button type="button" class="tm-primary-action" @click="runSettingsMock">补全设定</button>
                    <button type="button" @click="settingsFeedback = '正在检查设定冲突，Mock 结果会先显示在右侧。'">
                      <span class="tm-btn-icon">⚡</span> 检查冲突
                    </button>
                    <button type="button" @click="settingsFeedback = '核心设定已锁定，后续生成将优先遵循当前设定。'">
                      <span class="tm-btn-icon">🔒</span> 锁定核心设定
                    </button>
                  </div>
                  <p class="tm-feedback">{{ settingsFeedback }}</p>
                </article>

                <article class="tm-settings-card-v2">
                  <header>
                    <p>Checklist</p>
                    <h3>锁定说明</h3>
                  </header>
                  <ul class="tm-settings-bullets">
                    <li v-for="item in lockedSettings.slice(0, 4)" :key="item">
                      <span class="tm-bullet-marker" />
                      {{ item }}
                    </li>
                    <li v-if="lockedSettings.length === 0" class="tm-bullet-hint">设定尚未锁定，建议先完成基础设定后再锁定核心规则。</li>
                  </ul>
                </article>
              </div>
            </div>
          </article>

          <article v-if="activeStep === 'materials'" class="tm-workspace-card" data-testid="workspace-materials">
            <header class="tm-section-header">
              <div>
                <p>Materials</p>
                <h2>{{ productionChainProfile.labels.materials }}</h2>
              </div>
              <span class="tm-completeness-pill">
                <span class="tm-pill-dot" :class="materials.length > 0 ? 'done' : 'idle'" />
                {{ materials.length }} 条资料
              </span>
            </header>

            <section class="tm-material-shell">
              <div class="tm-material-topbar">
                <button type="button" class="tm-primary-action" @click="runMaterialMock('add')">新增资料</button>
                <button type="button" @click="runMaterialMock('import')">导入文本</button>
                <button type="button" @click="materialFeedback = '从文件库选择 Mock：已打开可选资源列表。'">从文件库选择</button>
              </div>

              <section class="tm-material-layout">
                <div class="tm-material-list" aria-label="Material cards">
                  <header>
                    <p>资料卡片</p>
                    <span>{{ materials.length > 0 ? `共 ${materials.length} 条` : '暂无资料' }}</span>
                  </header>
                  <button
                    v-for="(slot, index) in ['世界观资料', '角色资料', '参考文案', '产品资料']"
                    :key="slot"
                    type="button"
                    :class="{ selected: selectedMaterial?.id === materials[index]?.id }"
                    @click="selectedMaterialId = materials[index]?.id || selectedMaterialId"
                  >
                    <div class="tm-material-card-header">
                      <span class="tm-material-type-badge">{{ slot }}</span>
                      <strong>{{ materials[index]?.title || slot }}</strong>
                    </div>
                    <p>{{ materials[index]?.content?.slice(0, 80) || '长文本资料说明会在这里展示，支持引用和锁定状态。' }}{{ materials[index]?.content?.length > 80 ? '…' : '' }}</p>
                    <footer>
                      <small>引用 {{ materials[index]?.usageCount ?? 0 }} 次</small>
                      <small>{{ materials[index] ? formatUpdatedAt(materials[index].updatedAt) : '待补充' }}</small>
                    </footer>
                  </button>
                </div>

                <aside class="tm-material-preview">
                  <header>
                    <p>Current Preview</p>
                    <h3>{{ selectedMaterial?.title || '未选择资料' }}</h3>
                  </header>
                  <article>
                    {{ selectedMaterial?.content || '选择左侧资料卡片查看长文本内容与引用状态。' }}
                  </article>
                  <div class="tm-chip-list">
                    <span v-for="tag in selectedMaterial?.tags ?? []" :key="tag">{{ tag }}</span>
                    <span v-if="!selectedMaterial?.tags.length" class="tm-chip-muted">无标签</span>
                  </div>
                  <div class="tm-material-meta">
                    <div class="tm-meta-item">
                      <span class="tm-meta-label">引用次数</span>
                      <span class="tm-meta-value">{{ selectedMaterial?.usageCount ?? 0 }}</span>
                    </div>
                    <div class="tm-meta-item">
                      <span class="tm-meta-label">锁定状态</span>
                      <span class="tm-meta-value" :class="{ locked: selectedMaterial?.tags.includes('锁定') }">
                        {{ selectedMaterial?.tags.includes('锁定') ? '🔒 已锁定' : '未锁定' }}
                      </span>
                    </div>
                  </div>
                  <div class="tm-material-ai">
                    <button type="button" class="tm-primary-action" @click="materialFeedback = '资料总结 Mock：已生成摘要。'">总结资料</button>
                    <button type="button" @click="materialFeedback = '设定提取 Mock：已抽取可复用设定。'">提取设定</button>
                    <button type="button" @click="runMaterialMock('conflict')">检查资料冲突</button>
                  </div>
                  <p class="tm-feedback">{{ materialFeedback }}</p>
                </aside>
              </section>
            </section>
          </article>

          <article v-if="activeStep === 'outline'" class="tm-workspace-card" data-testid="workspace-outline">
            <header class="tm-section-header">
              <div>
                <p>Outline Factory</p>
                <h2>{{ productionChainProfile.labels.outline }}</h2>
              </div>
              <span class="tm-completeness-pill">
                <span class="tm-pill-dot" :class="outlineDocuments.length > 0 ? 'done' : 'idle'" />
                {{ outlineDocuments.length > 0 ? `${outlineDocuments.length} 个大纲` : '待生成' }}
              </span>
            </header>

            <section class="tm-outline-switcher" aria-label="Outline level">
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

            <section class="tm-outline-shell">
              <article class="tm-outline-main-panel">
                <header>
                  <p>Total Plot</p>
                  <h3>总剧情大纲</h3>
                </header>
                <div class="tm-outline-content">
                  <p class="tm-preline">{{ totalPlotOutline }}</p>
                </div>
                <div class="tm-outline-ai">
                  <button type="button" class="tm-primary-action" @click="generateOutlineCandidate">生成分集大纲</button>
                  <button type="button" @click="outlineFeedback = '钩子强化 Mock：已突出每一集的结束钩子。'">强化钩子</button>
                  <button type="button" @click="outlineFeedback = '节奏检查 Mock：节奏曲线已完成初步检查。'">检查节奏</button>
                </div>
                <p class="tm-feedback">{{ outlineFeedback }}</p>
              </article>

              <article class="tm-outline-episode-panel">
                <header>
                  <p>Episode Structure</p>
                  <h3>分集结构</h3>
                </header>
                <div class="tm-outline-episode-grid">
                  <section
                    v-for="episode in episodeStructure"
                    :key="episode.label"
                    class="tm-episode-card"
                  >
                    <div class="tm-episode-card-header">
                      <span class="tm-episode-badge">{{ episode.label }}</span>
                      <strong>{{ episode.title }}</strong>
                    </div>
                    <p>{{ episode.summary }}</p>
                  </section>
                </div>
              </article>
            </section>

            <section v-if="productionRules.length" class="tm-short-drama-rules">
              <article v-for="rule in productionRules" :key="rule.label">
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
              <pre>{{ outlineCandidate || '点击"生成分集大纲"后，Mock AI 结果会进入这里，不会覆盖总剧情大纲。' }}</pre>
            </section>
          </article>

          <article v-if="activeStep === 'editor'" class="tm-workspace-card tm-editor-card" data-testid="workspace-editor">
            <header class="tm-section-header">
              <div>
                <p>Editor</p>
                <h2>{{ productionChainProfile.labels.editor }}</h2>
              </div>
              <span class="tm-completeness-pill">
                <span class="tm-pill-dot" :class="editorWordCount > 0 ? 'done' : 'idle'" />
                {{ editorWordCount > 0 ? `${editorWordCount.toLocaleString()} 字` : '空白文档' }}
              </span>
            </header>

            <section class="tm-editor-toolbar">
              <div class="tm-editor-doc-selector">
                <span class="tm-toolbar-label">文档选择</span>
                <div class="tm-doc-tabs">
                  <button
                    v-for="option in productionDocumentOptions"
                    :key="option.value"
                    type="button"
                    :class="{ active: selectedEditorDocumentId === option.value }"
                    @click="selectedEditorDocumentId = option.value"
                  >
                    {{ option.label }}
                    <span v-if="option.label !== '新建'" class="tm-doc-title-hint">{{ option.title }}</span>
                  </button>
                </div>
              </div>
              <div class="tm-editor-status">
                <span class="tm-status-item">
                  <span class="tm-status-label">自动保存</span>
                  <span class="tm-status-value" :class="{ on: autoSaveEnabled }">{{ autoSaveEnabled ? 'ON' : 'OFF' }}</span>
                </span>
              </div>
            </section>

            <section class="tm-editor-shell">
              <label class="tm-markdown-editor">
                <span class="tm-editor-label">Markdown 文本编辑区</span>
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
                <div class="tm-candidate-content">
                  <pre>{{ editorCandidate || '生成正文候选后显示在这里。AI 结果不会直接覆盖正文。' }}</pre>
                </div>
                <div class="tm-candidate-actions">
                  <button type="button" class="tm-primary-action" @click="insertCandidateAtCursor">插入到光标</button>
                  <button type="button" @click="replaceSelectionWithCandidate">替换选中</button>
                  <button type="button" @click="saveEditorCandidateAsVersion">保存为新版本</button>
                </div>
                <div class="tm-editor-ai">
                  <button type="button" @click="generateEditorCandidate">
                    <span class="tm-btn-icon">✨</span> 生成正文
                  </button>
                  <button type="button" @click="editorFeedback = '继续写 Mock：已基于当前段落向下续写。'">继续写</button>
                  <button type="button" @click="editorFeedback = '审核当前文档 Mock：已完成初步审查。'">审核当前文档</button>
                </div>
              </aside>
            </section>
          </article>

          <article v-if="activeStep === 'rewrite'" class="tm-workspace-card">
            <header class="tm-section-header">
              <div>
                <p>Rewrite Factory</p>
                <h2>{{ productionChainProfile.labels.rewrite }}</h2>
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
                <h2>{{ productionChainProfile.labels.review }}</h2>
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
                <h2>{{ productionChainProfile.labels.versions }}</h2>
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
                <h2>{{ productionChainProfile.labels.export }}</h2>
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
        data-testid="text-master-ai-panel"
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
.tm-workspace-page.tm-workspace-page {
  --tm-page-padding: 16px 24px;

  display: grid;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  gap: 10px;
  grid-template-rows: auto auto minmax(0, 1fr);
  background: var(--tm-bg);
  color: var(--tm-text);
  padding: 16px 24px;
}

.tm-workspace-body {
  display: grid;
  min-height: 0;
  min-width: 0;
  grid-template-columns: var(--tm-sidebar-width) minmax(0, 1fr) var(--tm-ai-panel-width);
  gap: 10px;
}

.tm-workspace-main {
  min-width: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.tm-workspace-notice {
  border: 1px solid var(--tm-border);
  border-radius: 999px;
  background: var(--tm-card-muted);
  color: var(--tm-text-muted);
  margin-bottom: 12px;
  padding: 8px 12px;
  font-size: 12px;
}

.tm-workspace-card,
.tm-inner-card,
.tm-candidate-panel,
.tm-diff-panel {
  min-width: 0;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background: var(--tm-panel);
  box-shadow: var(--tm-shadow-card);
}

.tm-workspace-card {
  padding: 14px 16px 16px;
}

.tm-inner-card,
.tm-candidate-panel,
.tm-diff-panel {
  background: var(--tm-card-muted);
  padding: 12px;
}

.tm-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.tm-section-header > strong {
  border: 1px solid var(--tm-border);
  border-radius: 999px;
  background: var(--tm-card);
  padding: 4px 10px;
  font-size: 11px;
  color: var(--tm-text-muted);
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
  color: var(--tm-text-muted);
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
  font-size: 26px;
  font-weight: 700;
}

.tm-workspace-card[data-testid="workspace-overview"] > .tm-section-header,
.tm-workspace-card[data-testid="workspace-overview"] .tm-hero-summary,
.tm-workspace-card[data-testid="workspace-overview"] .tm-overview-grid,
.tm-workspace-card[data-testid="workspace-overview"] .tm-workflow-grid,
.tm-workspace-card[data-testid="workspace-overview"] .tm-two-column {
  display: none;
}

.tm-overview-shell {
  display: grid;
  gap: 12px;
  margin-top: 0;
}

.tm-overview-title,
.tm-overview-metrics article,
.tm-overview-summary,
.tm-overview-production,
.tm-flow-card,
.tm-overview-next .tm-inner-card {
  min-width: 0;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background: var(--tm-card-muted);
  box-shadow: var(--tm-shadow-card);
  padding: 16px;
}

.tm-overview-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  padding: 0 2px 2px;
}

.tm-overview-title p,
.tm-overview-metrics span,
.tm-overview-summary > p:first-child,
.tm-overview-summary dt,
.tm-overview-production header p,
.tm-overview-production header span,
.tm-overview-next header p {
  color: var(--tm-text-muted);
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.tm-overview-title h2 {
  margin: 5px 0 0;
  font-size: 24px;
}

.tm-overview-title span {
  display: block;
  margin-top: 6px;
  color: var(--tm-text-muted);
  font-size: 13px;
}

.tm-overview-title > strong {
  flex: 0 0 auto;
  border: 1px solid rgba(139, 140, 255, 0.36);
  border-radius: var(--tm-radius-pill);
  background: rgba(119, 117, 255, 0.14);
  color: #dce3ff;
  padding: 7px 11px;
  font-size: 12px;
}

.tm-overview-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.tm-overview-metrics article {
  display: grid;
  gap: 8px;
  min-height: 88px;
  align-content: center;
}

.tm-overview-metrics strong {
  font-size: 24px;
  line-height: 1;
}

.tm-overview-metrics small {
  color: var(--tm-text-muted);
  font-size: 12px;
}

.tm-overview-metrics meter {
  width: 100%;
}

.tm-overview-summary {
  min-height: 118px;
}

.tm-overview-summary h3 {
  margin: 6px 0 0;
  font-size: 22px;
}

.tm-overview-summary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.tm-overview-summary-meta span {
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-pill);
  background: var(--tm-card);
  color: var(--tm-text-soft);
  padding: 6px 10px;
  font-size: 12px;
}

.tm-overview-production header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.tm-overview-production header h3 {
  margin: 5px 0 0;
  font-size: 20px;
}

.tm-overview-flow {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.tm-flow-card {
  display: grid;
  gap: 10px;
  min-height: 72px;
  padding: 12px 14px;
}

.tm-flow-card div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tm-flow-card strong {
  font-size: 18px;
}

.tm-flow-card em {
  flex: 0 0 auto;
  border-radius: var(--tm-radius-pill);
  padding: 5px 10px;
  font-size: 12px;
  font-style: normal;
  font-weight: 800;
}

.tm-flow-card p {
  color: var(--tm-text-soft);
  margin: 0;
  line-height: 1.6;
}

.tm-overview-entry {
  margin-top: 12px;
}

.tm-overview-entry header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.tm-overview-entry header h3 {
  margin: 5px 0 0;
  font-size: 18px;
}

.tm-overview-entry header span {
  color: var(--tm-text-muted);
  font-size: 12px;
}

.tm-overview-entry-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.tm-entry-card {
  display: grid;
  gap: 8px;
  min-width: 0;
  min-height: 110px;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card);
  padding: 12px 14px;
  text-align: left;
}

.tm-entry-card strong {
  font-size: 17px;
}

.tm-entry-card p {
  color: var(--tm-text-soft);
  margin: 0;
  line-height: 1.55;
}

.tm-entry-card span {
  color: var(--tm-text-muted);
  font-size: 12px;
}

.tone-success {
  border-color: rgba(72, 213, 138, 0.62);
}

.tone-success strong {
  color: #73e39a;
}

.tone-success em {
  background: rgba(72, 213, 138, 0.16);
  color: #baf4d1;
}

.tone-running {
  border-color: rgba(87, 112, 255, 0.68);
}

.tone-running strong {
  color: #8fb2ff;
}

.tone-running em {
  background: rgba(87, 112, 255, 0.18);
  color: #cfd8ff;
}

.tone-warning {
  border-color: rgba(244, 163, 64, 0.68);
}

.tone-warning strong {
  color: #f6bf6f;
}

.tone-warning em {
  background: rgba(244, 163, 64, 0.16);
  color: #ffd7a3;
}

.tone-idle {
  border-color: rgba(132, 151, 190, 0.28);
}

.tone-idle strong {
  color: var(--tm-text-soft);
}

.tone-idle em {
  background: rgba(132, 151, 190, 0.12);
  color: var(--tm-text-muted);
}

.tm-entry-card.tone-success {
  border-color: rgba(72, 213, 138, 0.54);
}

.tm-entry-card.tone-running {
  border-color: rgba(87, 112, 255, 0.62);
}

.tm-entry-card.tone-warning {
  border-color: rgba(244, 163, 64, 0.62);
}

.tm-entry-card.tone-idle {
  border-color: rgba(132, 151, 190, 0.26);
}

.tm-overview-next {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 12px;
}

.tm-overview-next .tm-inner-card {
  padding: 14px;
}

.tm-overview-next ul {
  display: grid;
  gap: 10px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.tm-overview-next li {
  border-radius: var(--tm-radius-control);
  background: var(--tm-card);
  color: var(--tm-text-soft);
  padding: 10px 12px;
  line-height: 1.6;
}

.tm-overview-next button {
  min-height: 40px;
  margin-top: 16px;
  border: 1px solid rgba(139, 140, 255, 0.54);
  border-radius: var(--tm-radius-control);
  background: var(--tm-accent-gradient);
  color: white;
  padding: 0 14px;
}

.tm-hero-summary,
.tm-two-column,
.tm-material-layout,
.tm-outline-layout,
.tm-editor-layout,
.tm-rewrite-grid,
.tm-diff-grid {
  display: grid;
  gap: 12px;
  margin-top: 12px;
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
  border-radius: var(--tm-radius-control);
  background: var(--tm-card);
  padding: 14px;
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
  color: var(--tm-text-soft);
  line-height: 1.65;
  font-size: 14px;
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
  gap: 10px;
  margin-top: 12px;
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
  min-height: 36px;
  border: 1px solid var(--tm-border);
  border-radius: 8px;
  background: var(--tm-card-strong);
  color: var(--tm-text-soft);
  padding: 0 14px;
  font-size: 13px;
}

.tm-primary-action {
  border-color: rgba(48, 103, 255, 0.5);
  background: var(--tm-accent-gradient);
  color: white;
  font-weight: 700;
  box-shadow: 0 0 18px rgba(48, 103, 255, 0.18), 0 0 4px rgba(132, 80, 255, 0.12);
  transition: box-shadow 200ms ease, transform 160ms ease;
}

.tm-primary-action:hover {
  box-shadow: 0 0 24px rgba(48, 103, 255, 0.28), 0 0 8px rgba(132, 80, 255, 0.18);
  transform: translateY(-1px);
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
  border: 1px solid var(--tm-border);
  border-radius: 999px;
  background: var(--tm-card);
  color: var(--tm-text-soft);
  padding: 5px 10px;
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

.tm-settings-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 16px;
  margin-top: 18px;
}

.tm-settings-main,
.tm-settings-aside {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.tm-settings-main {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tm-settings-card {
  display: grid;
  gap: 12px;
  min-width: 0;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background: var(--tm-card-muted);
  padding: 16px;
}

.tm-settings-card-wide {
  grid-column: 1 / -1;
}

.tm-settings-text-block {
  display: grid;
  gap: 4px;
  border-radius: var(--tm-radius-control);
  background: var(--tm-card);
  padding: 10px;
}

.tm-settings-text-block strong {
  font-size: 12px;
}

.tm-settings-text-block p {
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.tm-settings-text-block strong,
.tm-settings-copy {
  color: var(--tm-text-soft);
}

.tm-settings-copy {
  margin: 0;
  line-height: 1.7;
}

.tm-settings-rail,
.tm-settings-locks {
  height: fit-content;
}

.tm-settings-actions {
  display: grid;
  gap: 8px;
}

.tm-settings-actions button {
  min-height: 36px;
  font-size: 12px;
}

.tm-settings-bullets {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tm-settings-bullets li {
  border-radius: var(--tm-radius-control);
  background: var(--tm-card);
  color: var(--tm-text-soft);
  padding: 8px 10px;
  line-height: 1.5;
  font-size: 12px;
}

.tm-material-shell {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.tm-material-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.tm-material-actions span {
  color: var(--tm-text-muted);
  font-size: 12px;
}

.tm-material-toolbar,
.tm-editor-toolbar,
.tm-rewrite-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.tm-material-toolbar span,
.tm-editor-toolbar strong {
  color: #a1a1aa;
  font-size: 13px;
}

.tm-material-layout {
  grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
  gap: 12px;
}

.tm-material-list {
  display: grid;
  gap: 12px;
}

.tm-material-list button {
  display: grid;
  gap: 6px;
  width: 100%;
  min-width: 0;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card);
  color: inherit;
  padding: 12px;
  text-align: left;
}

.tm-material-list button.selected {
  border-color: rgba(48, 103, 255, 0.45);
  background: var(--tm-card-strong);
}

.tm-material-list footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #a1a1aa;
}

.tm-material-preview {
  min-width: 0;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card);
  padding: 12px;
  overflow: hidden;
}

.tm-material-preview article,
.tm-material-preview dl {
  line-height: 1.7;
}

.tm-material-preview article {
  color: var(--tm-text-soft);
}

.tm-material-ai {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.tm-material-ai button {
  min-height: 40px;
}

.tm-outline-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.tm-outline-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 12px;
  margin-top: 12px;
}

.tm-outline-main-panel,
.tm-outline-episode-panel {
  display: grid;
  gap: 8px;
  min-width: 0;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background: var(--tm-card-muted);
  padding: 12px;
}

.tm-outline-episode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.tm-outline-episode-grid section {
  display: grid;
  gap: 8px;
  border-radius: var(--tm-radius-control);
  background: var(--tm-card);
  padding: 12px;
}

.tm-outline-episode-grid p {
  color: var(--tm-text-soft);
  margin: 0;
  line-height: 1.6;
}

.tm-outline-ai {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tm-outline-ai button {
  min-height: 40px;
}

.tm-editor-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
  gap: 12px;
  margin-top: 12px;
}

.tm-editor-card {
  min-width: 0;
}

.tm-editor-card .tm-markdown-editor {
  min-width: 0;
}

.tm-editor-card .tm-markdown-editor textarea {
  min-height: 320px;
  max-height: 52vh;
  resize: vertical;
}

.tm-editor-ai {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.tm-editor-ai button {
  min-height: 40px;
}

.tm-material-preview article {
  margin-top: 10px;
  line-height: 1.65;
  color: var(--tm-text-soft);
  font-size: 14px;
  max-height: 180px;
  overflow: auto;
}

.tm-segmented-control {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.tm-outline-switcher button,
.tm-segmented-control button {
  border: 1px solid var(--tm-border);
  border-radius: 999px;
  background: var(--tm-card);
  color: var(--tm-text-muted);
  padding: 7px 12px;
  font-size: 13px;
}

.tm-outline-switcher button.active,
.tm-segmented-control button.active {
  border-color: rgba(48, 103, 255, 0.5);
  background: rgba(48, 103, 255, 0.1);
  color: var(--tm-text);
}

.tm-settings-card header,
.tm-material-preview p,
.tm-outline-main-panel header,
.tm-outline-episode-panel header,
.tm-editor-card header,
.tm-candidate-panel header {
  margin-bottom: 0;
}

.tm-settings-card header h3,
.tm-material-preview h3,
.tm-outline-main-panel h3,
.tm-outline-episode-panel h3,
.tm-editor-card h2,
.tm-candidate-panel h3 {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 700;
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
  margin-top: 12px;
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
  .tm-settings-shell,
  .tm-settings-main,
  .tm-material-shell,
  .tm-outline-shell,
  .tm-editor-shell,
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

  .tm-settings-main,
  .tm-material-layout,
  .tm-outline-shell,
  .tm-editor-shell {
    grid-template-columns: 1fr;
  }

  .tm-overview-entry-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .tm-overview-grid,
  .tm-settings-main,
  .tm-outline-episode-grid,
  .tm-workflow-grid,
  .tm-short-drama-rules,
  .tm-episode-grid,
  .tm-material-list,
  .tm-candidate-actions,
  .tm-material-actions,
  .tm-material-ai,
  .tm-settings-actions,
  .tm-outline-ai,
  .tm-editor-ai,
  .tm-diff-grid,
  .tm-issue-actions,
  .tm-version-actions,
  .tm-export-format-grid,
  .tm-export-targets,
  .tm-overview-entry-grid {
    grid-template-columns: 1fr;
  }
}

/* === New v2 component styles === */

/* Completeness pill (replaces header strong) */
.tm-completeness-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--tm-border);
  border-radius: 999px;
  background: var(--tm-card);
  padding: 5px 12px;
  font-size: 12px;
  color: var(--tm-text-soft);
  white-space: nowrap;
}

.tm-pill-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #72798b;
}

.tm-pill-dot.done { background: var(--tm-success); }
.tm-pill-dot.warn { background: var(--tm-warning); }
.tm-pill-dot.idle { background: #72798b; }

/* Settings v2 layout */
.tm-settings-grid-v2 {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.tm-settings-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
}

.tm-settings-card-v2 {
  display: grid;
  gap: 8px;
  min-width: 0;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background: var(--tm-card-muted);
  padding: 12px;
  overflow: hidden;
}

.tm-settings-card-v2 header p {
  color: var(--tm-text-muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0;
}

.tm-settings-card-v2 header h3 {
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 700;
}

.tm-settings-card-wide {
  grid-column: 1 / -1;
}

.tm-settings-fields {
  display: grid;
  gap: 8px;
}

.tm-settings-long-text p {
  color: var(--tm-text-soft);
  line-height: 1.65;
  margin: 0;
  font-size: 14px;
}

/* Lock chips */
.tm-lock-chip {
  display: inline-flex !important;
  align-items: center;
  gap: 4px;
}

.tm-lock-icon {
  font-size: 11px;
}

.tm-chip-muted {
  color: var(--tm-text-muted) !important;
  border-style: dashed !important;
}

/* Button icons */
.tm-btn-icon {
  font-size: 12px;
}

/* Bullet markers */
.tm-bullet-marker {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tm-accent);
  margin-right: 8px;
  flex-shrink: 0;
}

.tm-bullet-hint {
  color: var(--tm-text-muted) !important;
}

/* Settings AI row */
.tm-settings-ai-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 300px);
  gap: 10px;
}

.tm-settings-locks-card {
  min-height: auto;
}

/* Materials topbar */
.tm-material-topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.tm-material-list header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.tm-material-list header span {
  color: var(--tm-text-muted);
  font-size: 12px;
}

.tm-material-card-header {
  display: grid;
  gap: 4px;
}

.tm-material-type-badge {
  display: inline-flex;
  width: fit-content;
  border: 1px solid rgba(48, 103, 255, 0.35);
  border-radius: 999px;
  background: rgba(48, 103, 255, 0.12);
  color: #93B4FF;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
}

/* Material meta */
.tm-material-meta {
  display: flex;
  gap: 16px;
  margin-top: 14px;
}

.tm-meta-item {
  display: grid;
  gap: 4px;
}

.tm-meta-label {
  color: #a1a1aa;
  font-size: 12px;
  text-transform: uppercase;
}

.tm-meta-value {
  color: var(--tm-text-soft);
  font-size: 13px;
}

.tm-meta-value.locked {
  color: var(--tm-success);
}

/* Outline v2 */
.tm-outline-content {
  border-radius: var(--tm-radius-control);
  background: var(--tm-card);
  padding: 10px;
  min-height: 60px;
}

.tm-outline-content p {
  margin: 0;
  line-height: 1.65;
  color: var(--tm-text-soft);
  white-space: pre-wrap;
  font-size: 14px;
}

.tm-episode-card {
  display: grid;
  gap: 6px;
  border: 1px solid rgba(161, 161, 170, 0.14);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card);
  padding: 10px;
  transition: border-color 160ms ease;
}

.tm-episode-card:hover {
  border-color: rgba(129, 140, 248, 0.28);
}

.tm-episode-card-header {
  display: grid;
  gap: 4px;
}

.tm-episode-badge {
  display: inline-flex;
  width: fit-content;
  border: 1px solid rgba(48, 103, 255, 0.45);
  border-radius: 999px;
  background: rgba(48, 103, 255, 0.15);
  color: #A5C1FF;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
}

.tm-episode-card p {
  color: var(--tm-text-soft);
  line-height: 1.6;
  margin: 0;
}

/* Editor v2 */
.tm-editor-doc-selector {
  display: grid;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.tm-toolbar-label {
  color: #a1a1aa;
  font-size: 11px;
  text-transform: uppercase;
}

.tm-doc-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tm-doc-tabs button {
  display: grid;
  gap: 2px;
  min-height: 32px;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card);
  color: var(--tm-text-muted);
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
}

.tm-doc-tabs button.active {
  border-color: rgba(48, 103, 255, 0.5);
  background: rgba(48, 103, 255, 0.1);
  color: var(--tm-text);
}

.tm-doc-title-hint {
  font-size: 11px;
  font-weight: 400;
  color: #a1a1aa;
}

.tm-editor-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tm-status-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tm-status-label {
  color: #a1a1aa;
  font-size: 11px;
  text-transform: uppercase;
}

.tm-status-value {
  border: 1px solid rgba(161, 161, 170, 0.18);
  border-radius: 999px;
  background: #18181b;
  padding: 3px 8px;
  font-size: 11px;
  color: #d4d4d8;
}

.tm-status-value.on {
  border-color: rgba(36, 204, 124, 0.35);
  background: rgba(36, 204, 124, 0.12);
  color: var(--tm-success);
}

.tm-editor-label {
  display: block;
  color: #a1a1aa;
  font-size: 11px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.tm-candidate-content {
  max-height: 200px;
  overflow: auto;
  border-radius: var(--tm-radius-control);
  background: #09090b;
  padding: 10px;
  margin-top: 8px;
}

.tm-candidate-content pre {
  min-height: 0;
  max-height: none;
  overflow: visible;
  margin: 0;
  border-radius: 0;
  background: transparent;
  padding: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #d4d4d8;
  font-size: 12px;
  line-height: 1.5;
}

/* Responsive fixes for settings v2 */
@media (max-width: 980px) {
  .tm-settings-row,
  .tm-settings-ai-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .tm-editor-doc-selector,
  .tm-editor-status {
    width: 100%;
  }

  .tm-doc-tabs {
    width: 100%;
    overflow-x: auto;
  }
}
</style>

