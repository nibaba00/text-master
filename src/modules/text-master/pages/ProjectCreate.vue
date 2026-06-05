<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import TopNav from '../components/TopNav.vue';
import { getTextMasterProjectPath, textMasterRoutePaths } from '../routes';
import { createTextMasterRuntime } from '../runtime/TextMasterRuntime';
import type { TextProjectType } from '../types/project';

type ProjectTypeOption = {
  id: string;
  value: TextProjectType;
  icon: string;
  title: string;
  description: string;
  frequency: string;
  detail: string;
  accent: 'blue' | 'violet' | 'amber' | 'green' | 'red' | 'slate';
};

type TemplateOption = {
  id: string;
  title: string;
  description: string;
};

type TemplateShortcut = {
  title: string;
  description: string;
  projectTypeId?: string;
  templateId?: string;
  browseAll?: boolean;
};

type GenerationStrategy = 'faithful' | 'expand' | 'rebuild';

const router = useRouter();
const currentStep = ref(1);
const selectedTypeId = ref('short-drama');
const selectedTemplateId = ref('short-drama-outline');
const selectedStyleTags = ref<string[]>(['短视频节奏']);
const selectedReviewRules = ref<string[]>(['前后逻辑一致', '钩子强度']);
const generationStrategy = ref<GenerationStrategy>('expand');
const setDefaultType = ref(true);
const isCreating = ref(false);
const createError = ref('');

const stepLabels = ['选择项目类型', '基础信息', '模板与设定', '完成创建'] as const;

const projectTypes: ProjectTypeOption[] = [
  {
    id: 'short-drama',
    value: 'short_drama',
    icon: '剧',
    title: '短剧项目',
    description: '分集大纲、分集正文、角色设定、剧情钩子',
    frequency: '32%',
    detail: '适合短视频与短剧创作，支持分集大纲、分集正文、角色设定、剧情钩子管理与审核发布。',
    accent: 'blue',
  },
  {
    id: 'novel',
    value: 'novel',
    icon: '章',
    title: '小说项目',
    description: '章节大纲、章节正文、世界观与设定',
    frequency: '24%',
    detail: '适合长篇小说、连载章节和人物线推进，先建立世界观与章节目标，再进入正文生产。',
    accent: 'violet',
  },
  {
    id: 'business-copy',
    value: 'business_copy',
    icon: '商',
    title: '商业文案',
    description: '产品发布、推广文案、品牌文案',
    frequency: '18%',
    detail: '适合官网首屏、发布稿、销售资料和活动投放文案，重点管理卖点、受众和禁用表达。',
    accent: 'amber',
  },
  {
    id: 'document',
    value: 'document',
    icon: '档',
    title: '项目文档',
    description: 'README、需求文档、说明文档',
    frequency: '12%',
    detail: '适合 README、产品需求文档、项目说明和内部交付文档，强调结构清晰与版本可追溯。',
    accent: 'green',
  },
  {
    id: 'xiaohongshu',
    value: 'business_copy',
    icon: '红',
    title: '小红书文案',
    description: '笔记内容、标题、封面文案',
    frequency: '6%',
    detail: '适合种草笔记、达人脚本和生活化表达，重点处理标题吸引力、正文节奏和平台敏感词。',
    accent: 'red',
  },
  {
    id: 'academic-report',
    value: 'document',
    icon: '研',
    title: '学术与报告',
    description: '论文、报告、研究文献',
    frequency: '4%',
    detail: '适合研究报告、行业分析和观点型长文，优先整理论点、资料来源和章节摘要。',
    accent: 'slate',
  },
  {
    id: 'translation',
    value: 'custom',
    icon: '译',
    title: '翻译与本地化',
    description: '多语言翻译、润色、校对',
    frequency: '2%',
    detail: '适合术语统一、语气润色和多版本对照，便于后续进行审核与版本回溯。',
    accent: 'slate',
  },
  {
    id: 'custom',
    value: 'custom',
    icon: '自',
    title: '自定义类型',
    description: '自定义项目类型与流程',
    frequency: '2%',
    detail: '适合无法归类但仍需要大纲、正文、改写、审核和导出闭环的文本生产项目。',
    accent: 'slate',
  },
];

const templateMap: Record<TextProjectType, TemplateOption[]> = {
  short_drama: [
    { id: 'short-drama-outline', title: '短剧分集大纲', description: '按集拆分钩子、付费点和结尾悬念。' },
    { id: 'short-drama-script', title: '短剧分集剧本', description: '生成对白、场景、镜头节奏和结尾反转。' },
  ],
  novel: [
    { id: 'novel-outline', title: '小说章节大纲', description: '规划章节目标、人物推进和场景变化。' },
    { id: 'novel-draft', title: '小说章节正文', description: '围绕章节目标生成可继续润色的正文草稿。' },
  ],
  business_copy: [
    { id: 'business-copy-template', title: '商业文案模板', description: '组织卖点、痛点、行动指令和渠道文案。' },
    { id: 'xiaohongshu-note', title: '小红书文案', description: '生成标题、正文、标签和禁用词提示。' },
  ],
  document: [
    { id: 'doc-readme', title: '项目 README', description: '整理安装、运行、目录和验收标准。' },
    { id: 'doc-prd', title: '产品需求文档', description: '组织目标、流程、范围和验收项。' },
  ],
  custom: [
    { id: 'custom-blank', title: '空白文本项目', description: '只保留基础信息，进入工作台后自由生产。' },
    { id: 'translation-localize', title: '翻译与本地化', description: '保留术语表、语气规则和多版本对照。' },
  ],
};

const quickTemplates: TemplateShortcut[] = [
  {
    title: '短剧分集大纲',
    description: '先搭分集结构',
    projectTypeId: 'short-drama',
    templateId: 'short-drama-outline',
  },
  {
    title: '短剧分集剧本',
    description: '直接进入剧本草稿',
    projectTypeId: 'short-drama',
    templateId: 'short-drama-script',
  },
  {
    title: '小说章节大纲',
    description: '规划章节目标',
    projectTypeId: 'novel',
    templateId: 'novel-outline',
  },
  {
    title: '小说章节正文',
    description: '生成章节草稿',
    projectTypeId: 'novel',
    templateId: 'novel-draft',
  },
  {
    title: '商业文案模板',
    description: '梳理卖点和转化',
    projectTypeId: 'business-copy',
    templateId: 'business-copy-template',
  },
  {
    title: '浏览全部模板',
    description: '进入模板中心',
    browseAll: true,
  },
];

const recentRecords = [
  '便利店夜班，短剧项目，12 分钟前',
  'AI 写作工具发布文案，商业文案，今天 09:12',
  '产品需求文档，项目文档，昨天 18:40',
];

const shortcutTips = ['Enter 下一步', 'Esc 取消', 'Ctrl + S 保存草稿'];
const assetLinks = ['创建记录', '草稿箱', '导入记录'];
const helpLinks = ['项目类型说明', '模板选择指南', '新建项目教程', '反馈问题'];
const styleTags = ['口语化', '文学感', '短视频节奏', '商业转化', '克制冷感', '结构清晰'];
const reviewRules = ['前后逻辑一致', '人物设定一致', '节奏不拖沓', '钩子强度', '敏感词检查'];

const strategyOptions: Array<{ value: GenerationStrategy; label: string; description: string }> = [
  { value: 'faithful', label: '严格遵循资料', description: '保留已有资料和设定，减少自由发挥。' },
  { value: 'expand', label: '适度补全细节', description: '保留核心设定，同时补全细节和表达。' },
  { value: 'rebuild', label: '强化结构表达', description: '允许重排结构，突出冲突、节奏和表达效率。' },
];

const shortDramaForm = reactive({
  projectName: '',
  genre: '',
  targetPlatform: '',
  episodeCount: '24',
  episodeDuration: '2 分钟',
  firstHookPosition: '前 5 秒',
  secondHookPosition: '第 30 秒',
  paywallPosition: '第 8 集',
  protagonist: '',
  coreConflict: '',
});

const novelForm = reactive({
  novelName: '',
  category: '',
  genre: '',
  targetWordCount: '300000',
  chapterCount: '120',
  protagonist: '',
  worldview: '',
  coreConflict: '',
});

const businessCopyForm = reactive({
  brandName: '',
  productName: '',
  sellingPoints: '',
  targetAudience: '',
  publishPlatform: '',
  conversionGoal: '',
  forbiddenWords: '',
});

const documentForm = reactive({
  documentTitle: '',
  documentType: '',
  targetReader: '',
  outputFormat: 'Markdown',
  existingMaterials: '',
  structureRequirement: '',
});

const customForm = reactive({
  projectName: '',
  textGoal: '',
  targetReader: '',
  outputFormat: 'Markdown',
  constraints: '',
});

const selectedType = computed(
  () => projectTypes.find((item) => item.id === selectedTypeId.value) ?? projectTypes[0],
);

const selectedProjectType = computed<TextProjectType>(() => selectedType.value.value);

const currentTemplates = computed(() => [
  ...templateMap[selectedProjectType.value],
  { id: 'skip', title: '跳过模板', description: '只填写基础信息，进入工作台后再选择模板。' },
]);

const selectedTemplateTitle = computed(
  () => currentTemplates.value.find((template) => template.id === selectedTemplateId.value)?.title ?? '跳过模板',
);

const strategyTitle = computed(
  () => strategyOptions.find((strategy) => strategy.value === generationStrategy.value)?.label ?? '适度补全细节',
);

const projectTitle = computed(() => {
  switch (selectedProjectType.value) {
    case 'novel':
      return novelForm.novelName.trim();
    case 'short_drama':
      return shortDramaForm.projectName.trim();
    case 'business_copy':
      return [businessCopyForm.brandName, businessCopyForm.productName].filter(Boolean).join(' - ').trim();
    case 'document':
      return documentForm.documentTitle.trim();
    case 'custom':
      return customForm.projectName.trim();
    default:
      return '';
  }
});

const projectSummary = computed(() => {
  switch (selectedProjectType.value) {
    case 'novel':
      return `${novelForm.genre || '未设定题材'}小说，核心冲突：${novelForm.coreConflict || '待补充'}`;
    case 'short_drama':
      return `${shortDramaForm.genre || '未设定题材'}短剧，平台：${shortDramaForm.targetPlatform || '待定'}，核心冲突：${shortDramaForm.coreConflict || '待补充'}`;
    case 'business_copy':
      return `${businessCopyForm.productName || selectedType.value.title}，转化目标：${businessCopyForm.conversionGoal || '待补充'}`;
    case 'document':
      return `${documentForm.documentType || selectedType.value.title}，读者：${documentForm.targetReader || '待补充'}`;
    case 'custom':
      return customForm.textGoal || `${selectedType.value.title}生产项目`;
    default:
      return '';
  }
});

const canContinue = computed(() => {
  if (currentStep.value === 1) {
    return Boolean(selectedTypeId.value);
  }

  if (currentStep.value === 2) {
    return projectTitle.value.length > 0;
  }

  if (currentStep.value === 3) {
    return selectedTemplateId.value.length > 0;
  }

  return projectTitle.value.length > 0;
});

function selectProjectType(option: ProjectTypeOption): void {
  selectedTypeId.value = option.id;
  selectedTemplateId.value = templateMap[option.value][0]?.id ?? 'skip';
}

function selectQuickTemplate(template: TemplateShortcut): void {
  if (template.browseAll) {
    void router.push(textMasterRoutePaths.templates);
    return;
  }

  if (template.projectTypeId) {
    const projectType = projectTypes.find((item) => item.id === template.projectTypeId);
    if (projectType) {
      selectedTypeId.value = projectType.id;
    }
  }

  if (template.templateId) {
    selectedTemplateId.value = template.templateId;
  }

  currentStep.value = Math.max(currentStep.value, 3);
}

function goNext(): void {
  if (!canContinue.value || currentStep.value >= 4) {
    return;
  }

  currentStep.value += 1;
}

function goBack(): void {
  if (currentStep.value <= 1) {
    return;
  }

  currentStep.value -= 1;
}

function toggleItem(collection: string[], item: string): string[] {
  return collection.includes(item) ? collection.filter((value) => value !== item) : [...collection, item];
}

function toggleStyleTag(tag: string): void {
  selectedStyleTags.value = toggleItem(selectedStyleTags.value, tag);
}

function toggleReviewRule(rule: string): void {
  selectedReviewRules.value = toggleItem(selectedReviewRules.value, rule);
}

async function createProject(): Promise<void> {
  if (!projectTitle.value || isCreating.value) {
    return;
  }

  isCreating.value = true;
  createError.value = '';

  try {
    const runtime = await createTextMasterRuntime();
    const project = await runtime.createProject({
      title: projectTitle.value,
      type: selectedProjectType.value,
      summary: projectSummary.value,
      settings: {
        targetAudience: getTargetAudience(),
        tone: selectedStyleTags.value.join(' / ') || '清晰克制',
        templateId: selectedTemplateTitle.value,
        styleTags: selectedStyleTags.value,
        generationStrategy: generationStrategy.value,
        reviewRules: selectedReviewRules.value,
        projectSetup: createProjectSetup(),
      },
    });

    await runtime.saveDocument({
      projectId: project.id,
      title: '项目设定',
      type: 'brief',
      content: createBriefDocument(),
    });

    await router.push(getTextMasterProjectPath(project.id));
  } catch (error) {
    createError.value = error instanceof Error ? error.message : '创建项目失败';
  } finally {
    isCreating.value = false;
  }
}

function getTargetAudience(): string {
  if (selectedProjectType.value === 'business_copy') {
    return businessCopyForm.targetAudience;
  }

  if (selectedProjectType.value === 'document') {
    return documentForm.targetReader;
  }

  if (selectedProjectType.value === 'custom') {
    return customForm.targetReader;
  }

  return '';
}

function createProjectSetup(): Record<string, string> {
  switch (selectedProjectType.value) {
    case 'novel':
      return { ...novelForm };
    case 'short_drama':
      return { ...shortDramaForm };
    case 'business_copy':
      return { ...businessCopyForm };
    case 'document':
      return { ...documentForm };
    case 'custom':
      return { ...customForm };
    default:
      return {};
  }
}

function getProjectSetupLines(): string[] {
  const groups: Record<TextProjectType, Array<[string, string]>> = {
    short_drama: [
      ['项目名称', shortDramaForm.projectName],
      ['类型题材', shortDramaForm.genre],
      ['目标平台', shortDramaForm.targetPlatform],
      ['集数', shortDramaForm.episodeCount],
      ['单集时长', shortDramaForm.episodeDuration],
      ['第一钩子位置', shortDramaForm.firstHookPosition],
      ['第二钩子位置', shortDramaForm.secondHookPosition],
      ['付费点位置', shortDramaForm.paywallPosition],
      ['主角设定', shortDramaForm.protagonist],
      ['核心冲突', shortDramaForm.coreConflict],
    ],
    novel: [
      ['小说名称', novelForm.novelName],
      ['类型', novelForm.category],
      ['题材', novelForm.genre],
      ['目标字数', novelForm.targetWordCount],
      ['章节数量', novelForm.chapterCount],
      ['主角设定', novelForm.protagonist],
      ['世界观简述', novelForm.worldview],
      ['核心冲突', novelForm.coreConflict],
    ],
    business_copy: [
      ['品牌名称', businessCopyForm.brandName],
      ['产品名称', businessCopyForm.productName],
      ['产品卖点', businessCopyForm.sellingPoints],
      ['目标人群', businessCopyForm.targetAudience],
      ['发布平台', businessCopyForm.publishPlatform],
      ['转化目标', businessCopyForm.conversionGoal],
      ['禁用词', businessCopyForm.forbiddenWords],
    ],
    document: [
      ['文档标题', documentForm.documentTitle],
      ['文档类型', documentForm.documentType],
      ['目标读者', documentForm.targetReader],
      ['输出格式', documentForm.outputFormat],
      ['已有资料', documentForm.existingMaterials],
      ['结构要求', documentForm.structureRequirement],
    ],
    custom: [
      ['项目名称', customForm.projectName],
      ['文本目标', customForm.textGoal],
      ['目标读者', customForm.targetReader],
      ['输出格式', customForm.outputFormat],
      ['约束条件', customForm.constraints],
    ],
  };

  return groups[selectedProjectType.value].map(([label, value]) => `- ${label}: ${value || '待补充'}`);
}

function createBriefDocument(): string {
  return [
    `# ${projectTitle.value}`,
    '',
    `项目类型：${selectedType.value.title}`,
    `项目摘要：${projectSummary.value}`,
    `选择模板：${selectedTemplateTitle.value}`,
    `风格标签：${selectedStyleTags.value.join('、') || '未选择'}`,
    `生成策略：${strategyTitle.value}`,
    `审核规则：${selectedReviewRules.value.join('、') || '未选择'}`,
    '',
    '## 基础信息',
    ...getProjectSetupLines(),
  ].join('\n');
}
</script>

<template>
  <main class="tm-create-page" data-testid="text-project-create">
    <TopNav />

    <header class="tm-create-top">
      <div>
        <p>Project Wizard</p>
        <h1>新建文本项目</h1>
        <span>选择项目类型与基础信息，快速开启你的文本生产流程</span>
      </div>
      <div class="tm-create-top-actions">
        <RouterLink class="tm-button" :to="textMasterRoutePaths.home">返回首页</RouterLink>
        <a class="tm-button" href="#create-help">帮助说明</a>
      </div>
    </header>

    <section class="tm-create-layout">
      <aside class="tm-create-sidebar" aria-label="Create project sidebar">
        <section class="tm-sidebar-flow">
          <h2>新建项目流程</h2>
          <button
            v-for="(label, index) in stepLabels"
            :key="label"
            type="button"
            :class="{ active: currentStep === index + 1, done: currentStep > index + 1 }"
            @click="currentStep = index + 1"
          >
            <span>{{ index + 1 }}</span>
            <strong>{{ label }}</strong>
          </button>
        </section>

        <section class="tm-sidebar-links">
          <p>项目入口</p>
          <a v-for="item in assetLinks" :key="item" :href="`#${item}`">{{ item }}</a>
        </section>

        <section id="create-help" class="tm-sidebar-links help">
          <p>帮助区</p>
          <a v-for="item in helpLinks" :key="item" :href="`#${item}`">{{ item }}</a>
        </section>
      </aside>

      <section class="tm-create-main">
        <article class="tm-create-stage" data-testid="create-step-type">
          <header class="tm-stage-header">
            <div>
              <p>Step {{ currentStep }}</p>
              <h2>新建文本项目</h2>
              <span>选择项目类型与基础信息，快速开启你的文本生产流程</span>
            </div>
          </header>

          <div class="tm-step-strip" aria-label="Create project steps">
            <button
              v-for="(label, index) in stepLabels"
              :key="label"
              type="button"
              :class="{ active: currentStep === index + 1, done: currentStep > index + 1 }"
              @click="currentStep = index + 1"
            >
              <span>{{ index + 1 }}</span>
              <strong>{{ label }}</strong>
            </button>
          </div>

          <section v-if="currentStep === 1" class="tm-step-panel">
            <header class="tm-panel-heading">
              <h3>选择项目类型</h3>
              <p>按使用频率排序，先选择最接近当前工作的文本生产场景。</p>
            </header>

            <div class="tm-type-grid">
              <button
                v-for="item in projectTypes"
                :key="item.id"
                type="button"
                :data-testid="item.id === 'short-drama' ? 'create-project-type-card-short-drama' : undefined"
                :class="[`accent-${item.accent}`, { selected: selectedTypeId === item.id }]"
                :aria-pressed="selectedTypeId === item.id"
                @click="selectProjectType(item)"
              >
                <span class="tm-type-icon">{{ item.icon }}</span>
                <strong>{{ item.title }}</strong>
                <small>{{ item.description }}</small>
                <em>使用频率 {{ item.frequency }}</em>
                <i>{{ selectedTypeId === item.id ? '已选中' : '选择' }}</i>
              </button>
            </div>
          </section>

          <section v-else-if="currentStep === 2" class="tm-step-panel">
            <header class="tm-panel-heading">
              <h3>基础信息</h3>
              <p>先填写最少必要信息，后续可在工作台继续补全。</p>
            </header>

            <div v-if="selectedProjectType === 'short_drama'" class="tm-form-grid">
              <label>项目名称<input v-model="shortDramaForm.projectName" type="text" /></label>
              <label>类型 / 题材<input v-model="shortDramaForm.genre" type="text" /></label>
              <label>目标平台<input v-model="shortDramaForm.targetPlatform" type="text" /></label>
              <label>集数<input v-model="shortDramaForm.episodeCount" type="text" /></label>
              <label>单集时长<input v-model="shortDramaForm.episodeDuration" type="text" /></label>
              <label>第一钩子位置<input v-model="shortDramaForm.firstHookPosition" type="text" /></label>
              <label>第二钩子位置<input v-model="shortDramaForm.secondHookPosition" type="text" /></label>
              <label>付费点位置<input v-model="shortDramaForm.paywallPosition" type="text" /></label>
              <label class="wide">主角设定<textarea v-model="shortDramaForm.protagonist" /></label>
              <label class="wide">核心冲突<textarea v-model="shortDramaForm.coreConflict" /></label>
            </div>

            <div v-else-if="selectedProjectType === 'novel'" class="tm-form-grid">
              <label>小说名称<input v-model="novelForm.novelName" type="text" /></label>
              <label>类型<input v-model="novelForm.category" type="text" /></label>
              <label>题材<input v-model="novelForm.genre" type="text" /></label>
              <label>目标字数<input v-model="novelForm.targetWordCount" type="text" /></label>
              <label>章节数量<input v-model="novelForm.chapterCount" type="text" /></label>
              <label class="wide">主角设定<textarea v-model="novelForm.protagonist" /></label>
              <label class="wide">世界观简述<textarea v-model="novelForm.worldview" /></label>
              <label class="wide">核心冲突<textarea v-model="novelForm.coreConflict" /></label>
            </div>

            <div v-else-if="selectedProjectType === 'business_copy'" class="tm-form-grid">
              <label>品牌名称<input v-model="businessCopyForm.brandName" type="text" /></label>
              <label>产品名称<input v-model="businessCopyForm.productName" type="text" /></label>
              <label class="wide">产品卖点<textarea v-model="businessCopyForm.sellingPoints" /></label>
              <label>目标人群<input v-model="businessCopyForm.targetAudience" type="text" /></label>
              <label>发布平台<input v-model="businessCopyForm.publishPlatform" type="text" /></label>
              <label>转化目标<input v-model="businessCopyForm.conversionGoal" type="text" /></label>
              <label class="wide">禁用词<textarea v-model="businessCopyForm.forbiddenWords" /></label>
            </div>

            <div v-else-if="selectedProjectType === 'document'" class="tm-form-grid">
              <label>文档标题<input v-model="documentForm.documentTitle" type="text" /></label>
              <label>文档类型<input v-model="documentForm.documentType" type="text" /></label>
              <label>目标读者<input v-model="documentForm.targetReader" type="text" /></label>
              <label>输出格式<input v-model="documentForm.outputFormat" type="text" /></label>
              <label class="wide">已有资料<textarea v-model="documentForm.existingMaterials" /></label>
              <label class="wide">结构要求<textarea v-model="documentForm.structureRequirement" /></label>
            </div>

            <div v-else class="tm-form-grid">
              <label>项目名称<input v-model="customForm.projectName" type="text" /></label>
              <label>输出格式<input v-model="customForm.outputFormat" type="text" /></label>
              <label>目标读者<input v-model="customForm.targetReader" type="text" /></label>
              <label class="wide">文本目标<textarea v-model="customForm.textGoal" /></label>
              <label class="wide">约束条件<textarea v-model="customForm.constraints" /></label>
            </div>
          </section>

          <section v-else-if="currentStep === 3" class="tm-step-panel">
            <header class="tm-panel-heading">
              <h3>模板与设定</h3>
              <p>选择一个起步模板，也可以跳过模板直接进入工作台。</p>
            </header>

            <div class="tm-template-grid">
              <button
                v-for="template in currentTemplates"
                :key="template.id"
                type="button"
                :class="{ selected: selectedTemplateId === template.id }"
                @click="selectedTemplateId = template.id"
              >
                <strong>{{ template.title }}</strong>
                <span>{{ template.description }}</span>
              </button>
            </div>

            <section class="tm-choice-section">
              <h3>风格标签</h3>
              <div class="tm-chip-grid">
                <button
                  v-for="tag in styleTags"
                  :key="tag"
                  type="button"
                  :class="{ selected: selectedStyleTags.includes(tag) }"
                  @click="toggleStyleTag(tag)"
                >
                  {{ tag }}
                </button>
              </div>
            </section>
          </section>

          <section v-else class="tm-step-panel">
            <header class="tm-panel-heading">
              <h3>完成创建</h3>
              <p>确认生成策略和审核规则，创建后进入工作台。</p>
            </header>

            <div class="tm-summary-grid">
              <article>
                <p>项目类型</p>
                <strong>{{ selectedType.title }}</strong>
              </article>
              <article>
                <p>起步模板</p>
                <strong>{{ selectedTemplateTitle }}</strong>
              </article>
              <article>
                <p>生成策略</p>
                <strong>{{ strategyTitle }}</strong>
              </article>
            </div>

            <div class="tm-strategy-grid">
              <label
                v-for="strategy in strategyOptions"
                :key="strategy.value"
                :class="{ selected: generationStrategy === strategy.value }"
              >
                <input v-model="generationStrategy" type="radio" :value="strategy.value" />
                <strong>{{ strategy.label }}</strong>
                <span>{{ strategy.description }}</span>
              </label>
            </div>

            <section class="tm-choice-section">
              <h3>审核规则</h3>
              <div class="tm-chip-grid">
                <button
                  v-for="rule in reviewRules"
                  :key="rule"
                  type="button"
                  :class="{ selected: selectedReviewRules.includes(rule) }"
                  @click="toggleReviewRule(rule)"
                >
                  {{ rule }}
                </button>
              </div>
            </section>
          </section>
        </article>

        <section class="tm-template-strip" data-testid="create-template-strip">
          <header>
            <div>
              <p>Template Shortcut</p>
              <h2>快速选择已有模板，可跳过</h2>
            </div>
          </header>
          <div>
            <button
              v-for="template in quickTemplates"
              :key="template.title"
              type="button"
              @click="selectQuickTemplate(template)"
            >
              <strong>{{ template.title }}</strong>
              <span>{{ template.description }}</span>
            </button>
          </div>
        </section>
      </section>

      <aside class="tm-create-inspector">
        <article class="tm-type-info-card">
          <p>类型说明</p>
          <div class="tm-type-preview" :class="`accent-${selectedType.accent}`">
            <span>{{ selectedType.icon }}</span>
          </div>
          <h2>{{ selectedType.title }}</h2>
          <span>{{ selectedType.detail }}</span>
        </article>

        <article>
          <p>使用频率排行</p>
          <ol>
            <li v-for="item in projectTypes.slice(0, 5)" :key="item.id">
              <span>{{ item.title }}</span>
              <strong>{{ item.frequency }}</strong>
            </li>
          </ol>
        </article>

        <article>
          <p>快捷键提示</p>
          <div class="tm-key-list">
            <span v-for="tip in shortcutTips" :key="tip">{{ tip }}</span>
          </div>
        </article>

        <article id="创建记录">
          <p>创建记录</p>
          <ul>
            <li v-for="record in recentRecords" :key="record">{{ record }}</li>
          </ul>
        </article>
      </aside>
    </section>

    <footer class="tm-create-footer">
      <label>
        <input v-model="setDefaultType" type="checkbox" />
        <span>设为默认类型，下次优先选中</span>
      </label>
      <div>
        <button
          v-if="currentStep > 1"
          class="tm-button"
          type="button"
          @click="goBack"
        >
          上一步
        </button>
        <RouterLink class="tm-button" :to="textMasterRoutePaths.home">取消</RouterLink>
        <button
          v-if="currentStep < 4"
          class="tm-button tm-button-primary"
          type="button"
          :disabled="!canContinue"
          data-testid="create-next-button"
          @click="goNext"
        >
          {{ currentStep === 1 ? '下一步：填写基础信息' : currentStep === 2 ? '下一步：选择模板' : '下一步：完成创建' }}
        </button>
        <button
          v-else
          class="tm-button tm-button-primary"
          type="button"
          :disabled="!canContinue || isCreating"
          data-testid="create-next-button"
          @click="createProject"
        >
          {{ isCreating ? '创建中...' : '创建项目并进入工作台' }}
        </button>
      </div>
      <p v-if="createError" class="tm-error">{{ createError }}</p>
    </footer>
  </main>
</template>

<style scoped>
.tm-create-page {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 8px;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: transparent;
  color: var(--tm-text);
  padding: var(--tm-page-padding);
}

.tm-create-top,
.tm-create-layout,
.tm-create-footer {
  width: min(100%, var(--tm-page-max-width));
  margin: 0 auto;
}

.tm-create-top {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px;
}

.tm-create-top p,
.tm-stage-header p,
.tm-panel-heading p,
.tm-template-strip p,
.tm-create-inspector p,
.tm-type-grid small,
.tm-template-grid span,
.tm-strategy-grid span,
.tm-template-strip button span,
.tm-summary-grid p {
  color: var(--tm-text-muted);
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.tm-create-top h1 {
  margin: 4px 0 0;
  font-size: 24px;
  line-height: 1.08;
}

.tm-create-top span,
.tm-stage-header span,
.tm-create-inspector article > span {
  display: block;
  margin-top: 6px;
  color: var(--tm-text-muted);
  font-size: 14px;
  line-height: 1.45;
}

.tm-create-top-actions,
.tm-create-footer > div {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tm-create-layout {
  display: grid;
  grid-template-columns: 188px minmax(0, 1fr) 260px;
  gap: 10px;
  align-items: stretch;
  min-height: 0;
  overflow: hidden;
}

.tm-create-sidebar,
.tm-create-stage,
.tm-template-strip,
.tm-create-inspector article,
.tm-create-footer {
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent),
    var(--tm-panel);
  box-shadow: var(--tm-shadow-card);
}

.tm-create-sidebar,
.tm-create-inspector {
  display: grid;
  gap: 12px;
  min-height: 0;
  overflow: auto;
}

.tm-create-sidebar {
  align-content: start;
  min-height: 0;
  padding: 12px;
}

.tm-sidebar-flow,
.tm-sidebar-links {
  display: grid;
  gap: 9px;
}

.tm-sidebar-flow h2 {
  margin: 0 0 8px;
  font-size: 16px;
}

.tm-sidebar-links {
  margin-top: 14px;
}

.tm-sidebar-links p {
  margin: 0 0 3px;
  color: var(--tm-text-muted);
  font-size: 12px;
  text-transform: uppercase;
}

.tm-create-sidebar button,
.tm-sidebar-links a,
.tm-button,
.tm-step-strip button,
.tm-type-grid button,
.tm-template-strip button,
.tm-template-grid button,
.tm-chip-grid button,
.tm-strategy-grid label,
.tm-summary-grid article {
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card-muted);
  color: var(--tm-text);
}

.tm-create-sidebar button,
.tm-sidebar-links a {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 50px;
  padding: 7px 9px;
  text-align: left;
  text-decoration: none;
}

.tm-sidebar-links a {
  grid-template-columns: 1fr;
  min-height: 38px;
  color: var(--tm-text-soft);
  font-size: 13px;
}

.tm-create-sidebar button span,
.tm-step-strip span {
  display: inline-grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: var(--tm-radius-pill);
  background: rgba(139, 140, 255, 0.14);
  color: #dce3ff;
  font-size: 12px;
  font-weight: 800;
}

.tm-create-sidebar button.active,
.tm-create-sidebar button.done,
.tm-step-strip button.active,
.tm-step-strip button.done,
.tm-type-grid button.selected,
.tm-template-grid button.selected,
.tm-chip-grid button.selected,
.tm-strategy-grid label.selected {
  border-color: rgba(87, 112, 255, 0.75);
  background: rgba(87, 112, 255, 0.16);
}

.tm-create-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.tm-create-stage {
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 14px 16px;
}

.tm-stage-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
}

.tm-stage-header h2 {
  margin: 5px 0 0;
  font-size: 20px;
  line-height: 1.1;
}

.tm-step-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.tm-step-strip button {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 36px;
  padding: 6px 8px;
  text-align: left;
}

.tm-step-strip strong {
  overflow: hidden;
  color: var(--tm-text-soft);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tm-step-panel {
  margin-top: 14px;
}

.tm-panel-heading h3,
.tm-template-strip h2,
.tm-create-inspector h2 {
  margin: 0;
  font-size: 16px;
}

.tm-panel-heading p {
  margin: 8px 0 0;
  text-transform: none;
}

.tm-type-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.tm-type-grid button {
  position: relative;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 8px;
  min-height: 108px;
  overflow: hidden;
  padding: 10px;
  text-align: center;
}

.tm-type-grid button::before {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(88, 103, 255, 0.11), transparent 48%);
  opacity: 0;
  content: "";
}

.tm-type-grid button.selected::before,
.tm-type-grid button:hover::before {
  opacity: 1;
}

.tm-type-icon,
.tm-type-preview span {
  display: inline-grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 16px;
  color: white;
  font-size: 18px;
  font-weight: 900;
}

.accent-blue .tm-type-icon,
.tm-type-preview.accent-blue span {
  background: linear-gradient(135deg, #3766ff, #6077ff);
}

.accent-violet .tm-type-icon,
.tm-type-preview.accent-violet span {
  background: linear-gradient(135deg, #6f3bd5, #8b5cf6);
}

.accent-amber .tm-type-icon,
.tm-type-preview.accent-amber span {
  background: linear-gradient(135deg, #a86b00, #d99200);
}

.accent-green .tm-type-icon,
.tm-type-preview.accent-green span {
  background: linear-gradient(135deg, #0f8c4d, #18a861);
}

.accent-red .tm-type-icon,
.tm-type-preview.accent-red span {
  background: linear-gradient(135deg, #a3232d, #cf333d);
}

.accent-slate .tm-type-icon,
.tm-type-preview.accent-slate span {
  background: linear-gradient(135deg, #30435f, #506381);
}

.tm-type-grid button strong {
  position: relative;
  font-size: 15px;
}

.tm-type-grid small {
  position: relative;
  min-height: 36px;
  color: var(--tm-text-muted);
  line-height: 1.35;
  text-transform: none;
}

.tm-type-grid button em,
.tm-type-grid button i {
  position: relative;
  font-size: 12px;
  font-style: normal;
}

.tm-type-grid button em {
  color: var(--tm-text-soft);
}

.tm-type-grid button i {
  min-height: 24px;
  border-radius: var(--tm-radius-pill);
  background: rgba(255, 255, 255, 0.045);
  color: var(--tm-text-muted);
  padding: 5px 9px;
}

.tm-type-grid button.selected i {
  background: rgba(72, 213, 138, 0.14);
  color: #9ef0bd;
}

.tm-form-grid,
.tm-template-grid,
.tm-chip-grid,
.tm-strategy-grid,
.tm-summary-grid {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.tm-form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tm-form-grid label {
  display: grid;
  gap: 8px;
  min-width: 0;
  color: var(--tm-text-soft);
  font-size: 13px;
}

.tm-form-grid label.wide {
  grid-column: 1 / -1;
}

.tm-form-grid input,
.tm-form-grid textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-control-bg);
  color: var(--tm-text);
  padding: 11px 12px;
  font-size: 14px;
}

.tm-form-grid textarea {
  min-height: 86px;
  max-height: 220px;
  overflow: auto;
  line-height: 1.7;
  resize: vertical;
}

.tm-template-grid,
.tm-strategy-grid,
.tm-summary-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.tm-template-grid button,
.tm-strategy-grid label,
.tm-summary-grid article {
  display: grid;
  gap: 8px;
  min-height: 104px;
  padding: 14px;
  text-align: left;
}

.tm-choice-section {
  margin-top: 24px;
}

.tm-choice-section h3 {
  margin: 0;
  font-size: 16px;
}

.tm-chip-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.tm-chip-grid button {
  min-height: 40px;
  padding: 0 12px;
}

.tm-strategy-grid input {
  accent-color: var(--tm-accent);
}

.tm-template-strip {
  width: 100%;
  min-width: 0;
  padding: 10px;
}

.tm-template-strip header {
  margin-bottom: 12px;
}

.tm-template-strip > div {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.tm-template-strip button {
  display: grid;
  flex: 0 0 150px;
  min-height: 58px;
  gap: 6px;
  padding: 12px 14px;
  text-align: left;
}

.tm-create-inspector article {
  display: grid;
  gap: 8px;
  padding: 12px;
}

.tm-type-info-card {
  align-content: start;
  min-height: 0;
}

.tm-type-preview {
  display: grid;
  min-height: 78px;
  place-items: center;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background: var(--tm-card-strong);
}

.tm-create-inspector ol,
.tm-create-inspector ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tm-create-inspector li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  border-radius: var(--tm-radius-control);
  background: var(--tm-card-muted);
  color: var(--tm-text-soft);
  padding: 10px;
  font-size: 13px;
}

.tm-create-inspector li span {
  min-width: 0;
}

.tm-key-list {
  display: grid;
  gap: 8px;
}

.tm-key-list span {
  border-radius: var(--tm-radius-pill);
  background: var(--tm-card-muted);
  color: var(--tm-text-soft);
  padding: 8px 10px;
  font-size: 13px;
}

.tm-create-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
}

.tm-create-footer label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--tm-text-soft);
  font-size: 13px;
}

.tm-button {
  display: inline-flex;
  min-height: var(--tm-button-height);
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
}

.tm-button-primary {
  border-color: rgba(139, 140, 255, 0.62);
  background: var(--tm-accent-gradient);
  color: white;
}

.tm-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.tm-error {
  color: var(--tm-risk);
}

@media (max-width: 1260px) {
  .tm-create-layout {
    grid-template-columns: 210px minmax(0, 1fr);
  }

  .tm-create-inspector {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tm-type-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 940px) {
  .tm-create-layout,
  .tm-create-inspector,
  .tm-type-grid,
  .tm-step-strip,
  .tm-template-grid,
  .tm-strategy-grid,
  .tm-summary-grid {
    grid-template-columns: 1fr;
  }

  .tm-create-sidebar {
    min-height: 0;
  }

  .tm-create-top,
  .tm-create-footer {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .tm-form-grid,
  .tm-chip-grid {
    grid-template-columns: 1fr;
  }

  .tm-create-top-actions,
  .tm-create-footer > div,
  .tm-button {
    width: 100%;
  }
}
</style>
