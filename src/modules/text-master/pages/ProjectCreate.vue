<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getTextMasterProjectPath, textMasterRoutePaths } from '../routes';
import { createTextMasterRuntime } from '../runtime/TextMasterRuntime';
import type { TextProjectType } from '../types/project';

type ProjectTypeOption = {
  value: TextProjectType;
  title: string;
  subtitle: string;
};

type TemplateOption = {
  id: string;
  title: string;
  description: string;
};

type GenerationStrategy = 'faithful' | 'expand' | 'rebuild';

const router = useRouter();
const currentStep = ref(1);
const selectedProjectType = ref<TextProjectType>('short_drama');
const selectedTemplateId = ref('short-drama-fast-hook');
const selectedStyleTags = ref<string[]>(['短视频节奏']);
const selectedReviewRules = ref<string[]>(['前后矛盾', '钩子强度']);
const generationStrategy = ref<GenerationStrategy>('expand');
const isCreating = ref(false);
const createError = ref('');
const stepLabels = [
  '选择项目类型',
  '基础设定',
  '生产模板',
  'AI 风格与策略',
] as const;

const projectTypes: ProjectTypeOption[] = [
  {
    value: 'novel',
    title: '小说项目',
    subtitle: '长篇设定、章节规划、人物和世界观生产',
  },
  {
    value: 'short_drama',
    title: '短剧项目',
    subtitle: '强钩子、付费点、集数结构和冲突节奏',
  },
  {
    value: 'business_copy',
    title: '商业文案',
    subtitle: '卖点提炼、发布平台、转化目标和禁用词',
  },
  {
    value: 'document',
    title: '项目文档',
    subtitle: '结构化说明、资料整理、读者和输出格式',
  },
  {
    value: 'custom',
    title: '自定义文本',
    subtitle: '自由文本项目，保留完整生产链路',
  },
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

const templateMap: Record<TextProjectType, TemplateOption[]> = {
  novel: [
    {
      id: 'novel-world-first',
      title: '世界观优先',
      description: '先建立世界规则，再推进人物和章节。',
    },
    {
      id: 'novel-conflict-first',
      title: '冲突驱动',
      description: '围绕主角欲望、阻碍和反转搭建长线剧情。',
    },
  ],
  short_drama: [
    {
      id: 'short-drama-fast-hook',
      title: '强钩子短剧',
      description: '每集前段设置异常事件和高密度反转。',
    },
    {
      id: 'short-drama-paywall',
      title: '付费点规划',
      description: '按集数设计付费点、爽点和悬念回收。',
    },
  ],
  business_copy: [
    {
      id: 'copy-conversion',
      title: '转化文案',
      description: '从卖点、痛点和行动指令组织内容。',
    },
    {
      id: 'copy-platform',
      title: '平台发布稿',
      description: '适配小红书、公众号、落地页等发布场景。',
    },
  ],
  document: [
    {
      id: 'doc-structured',
      title: '结构化文档',
      description: '输出清晰目录、摘要、正文和行动项。',
    },
    {
      id: 'doc-materials',
      title: '资料整合',
      description: '先归纳已有资料，再生成可交付文档。',
    },
  ],
  custom: [
    {
      id: 'custom-clean',
      title: '空白文本项目',
      description: '只建立项目和基础生产链路。',
    },
  ],
};

const styleTags = [
  '口语化',
  '文学感',
  '短视频节奏',
  '商业转化',
  '黑色幽默',
  '克制冷感',
];

const reviewRules = [
  '前后矛盾',
  '人物设定一致性',
  '节奏拖沓',
  '钩子强度',
  '敏感词',
];

const strategyOptions: Array<{
  value: GenerationStrategy;
  label: string;
  description: string;
}> = [
  {
    value: 'faithful',
    label: '忠实原文',
    description: '严格遵循已有资料和设定，减少自由发挥。',
  },
  {
    value: 'expand',
    label: '适度扩写',
    description: '保留核心设定，同时补全细节和表达。',
  },
  {
    value: 'rebuild',
    label: '大幅重构',
    description: '允许重排结构、强化冲突和表达方式。',
  },
];

const currentTemplates = computed(() => [
  ...templateMap[selectedProjectType.value],
  {
    id: 'blank',
    title: '不使用模板，创建空项目',
    description: '只保存基础设定，后续从工作台手动生产。',
  },
]);

const projectTitle = computed(() => {
  switch (selectedProjectType.value) {
    case 'novel':
      return novelForm.novelName.trim();
    case 'short_drama':
      return shortDramaForm.projectName.trim();
    case 'business_copy':
      return [businessCopyForm.brandName, businessCopyForm.productName]
        .filter(Boolean)
        .join(' - ')
        .trim();
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
      return `${novelForm.genre || '未设定题材'}小说，核心冲突：${
        novelForm.coreConflict || '待补充'
      }`;
    case 'short_drama':
      return `${shortDramaForm.genre || '未设定题材'}短剧，平台：${
        shortDramaForm.targetPlatform || '待定'
      }，核心冲突：${shortDramaForm.coreConflict || '待补充'}`;
    case 'business_copy':
      return `${businessCopyForm.productName || '产品'}商业文案，转化目标：${
        businessCopyForm.conversionGoal || '待补充'
      }`;
    case 'document':
      return `${documentForm.documentType || '项目文档'}，读者：${
        documentForm.targetReader || '待补充'
      }`;
    case 'custom':
      return customForm.textGoal || '自定义文本生产项目';
    default:
      return '';
  }
});

const canContinue = computed(() => {
  if (currentStep.value === 1) {
    return Boolean(selectedProjectType.value);
  }

  if (currentStep.value === 2) {
    return projectTitle.value.length > 0;
  }

  if (currentStep.value === 3) {
    return selectedTemplateId.value.length > 0;
  }

  return true;
});

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

function selectProjectType(type: TextProjectType): void {
  selectedProjectType.value = type;
  selectedTemplateId.value = currentTemplates.value[0]?.id ?? 'blank';
}

function toggleItem(collection: string[], item: string): string[] {
  return collection.includes(item)
    ? collection.filter((value) => value !== item)
    : [...collection, item];
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
        tone: selectedStyleTags.value.join(' / ') || 'clear',
        templateId: selectedTemplateId.value,
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
    createError.value =
      error instanceof Error ? error.message : '创建项目失败';
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

function createBriefDocument(): string {
  const setup = createProjectSetup();
  const lines = Object.entries(setup).map(([key, value]) => `- ${key}: ${value}`);

  return [
    `# ${projectTitle.value}`,
    '',
    `类型：${selectedProjectType.value}`,
    `摘要：${projectSummary.value}`,
    `模板：${selectedTemplateId.value}`,
    `风格：${selectedStyleTags.value.join('、') || '未选择'}`,
    `生成策略：${generationStrategy.value}`,
    `审核规则：${selectedReviewRules.value.join('、') || '未选择'}`,
    '',
    '## 基础设定',
    ...lines,
  ].join('\n');
}
</script>

<template>
  <main class="tm-create-page">
    <header class="tm-create-header">
      <div>
        <p>Local Project Setup</p>
        <h1>新建文本项目</h1>
        <span>通过 Text Master Runtime 创建，本地模式下保存到 localStorage。</span>
      </div>
      <RouterLink class="tm-button" :to="textMasterRoutePaths.projectCenter">
        返回项目中心
      </RouterLink>
    </header>

    <section class="tm-step-strip" aria-label="Create project steps">
      <button
        v-for="step in 4"
        :key="step"
        type="button"
        :class="{ active: currentStep === step }"
        @click="currentStep = step"
      >
        <span>Step {{ step }}</span>
        <strong>{{ stepLabels[step - 1] }}</strong>
      </button>
    </section>

    <section class="tm-create-shell">
      <article v-if="currentStep === 1" class="tm-panel">
        <header class="tm-panel-header">
          <p>Step 1</p>
          <h2>选择项目类型</h2>
        </header>
        <div class="tm-type-grid">
          <button
            v-for="item in projectTypes"
            :key="item.value"
            type="button"
            :class="{ selected: selectedProjectType === item.value }"
            @click="selectProjectType(item.value)"
          >
            <strong>{{ item.title }}</strong>
            <span>{{ item.subtitle }}</span>
          </button>
        </div>
      </article>

      <article v-if="currentStep === 2" class="tm-panel">
        <header class="tm-panel-header">
          <p>Step 2</p>
          <h2>基础设定</h2>
        </header>

        <div v-if="selectedProjectType === 'short_drama'" class="tm-form-grid">
          <label>
            项目名称
            <input v-model="shortDramaForm.projectName" type="text" />
          </label>
          <label>
            类型 / 题材
            <input v-model="shortDramaForm.genre" type="text" />
          </label>
          <label>
            目标平台
            <input v-model="shortDramaForm.targetPlatform" type="text" />
          </label>
          <label>
            集数
            <input v-model="shortDramaForm.episodeCount" type="text" />
          </label>
          <label>
            单集时长
            <input v-model="shortDramaForm.episodeDuration" type="text" />
          </label>
          <label>
            一钩位置
            <input v-model="shortDramaForm.firstHookPosition" type="text" />
          </label>
          <label>
            二钩位置
            <input v-model="shortDramaForm.secondHookPosition" type="text" />
          </label>
          <label>
            付费点位置
            <input v-model="shortDramaForm.paywallPosition" type="text" />
          </label>
          <label class="wide">
            主角设定
            <textarea v-model="shortDramaForm.protagonist" />
          </label>
          <label class="wide">
            核心冲突
            <textarea v-model="shortDramaForm.coreConflict" />
          </label>
        </div>

        <div v-else-if="selectedProjectType === 'novel'" class="tm-form-grid">
          <label>
            小说名称
            <input v-model="novelForm.novelName" type="text" />
          </label>
          <label>
            类型
            <input v-model="novelForm.category" type="text" />
          </label>
          <label>
            题材
            <input v-model="novelForm.genre" type="text" />
          </label>
          <label>
            目标字数
            <input v-model="novelForm.targetWordCount" type="text" />
          </label>
          <label>
            章节数量
            <input v-model="novelForm.chapterCount" type="text" />
          </label>
          <label class="wide">
            主角设定
            <textarea v-model="novelForm.protagonist" />
          </label>
          <label class="wide">
            世界观简述
            <textarea v-model="novelForm.worldview" />
          </label>
          <label class="wide">
            核心冲突
            <textarea v-model="novelForm.coreConflict" />
          </label>
        </div>

        <div
          v-else-if="selectedProjectType === 'business_copy'"
          class="tm-form-grid"
        >
          <label>
            品牌名称
            <input v-model="businessCopyForm.brandName" type="text" />
          </label>
          <label>
            产品名称
            <input v-model="businessCopyForm.productName" type="text" />
          </label>
          <label class="wide">
            产品卖点
            <textarea v-model="businessCopyForm.sellingPoints" />
          </label>
          <label>
            目标人群
            <input v-model="businessCopyForm.targetAudience" type="text" />
          </label>
          <label>
            发布平台
            <input v-model="businessCopyForm.publishPlatform" type="text" />
          </label>
          <label>
            转化目标
            <input v-model="businessCopyForm.conversionGoal" type="text" />
          </label>
          <label class="wide">
            禁用词
            <textarea v-model="businessCopyForm.forbiddenWords" />
          </label>
        </div>

        <div v-else-if="selectedProjectType === 'document'" class="tm-form-grid">
          <label>
            文档标题
            <input v-model="documentForm.documentTitle" type="text" />
          </label>
          <label>
            文档类型
            <input v-model="documentForm.documentType" type="text" />
          </label>
          <label>
            目标读者
            <input v-model="documentForm.targetReader" type="text" />
          </label>
          <label>
            输出格式
            <input v-model="documentForm.outputFormat" type="text" />
          </label>
          <label class="wide">
            已有资料
            <textarea v-model="documentForm.existingMaterials" />
          </label>
          <label class="wide">
            结构要求
            <textarea v-model="documentForm.structureRequirement" />
          </label>
        </div>

        <div v-else class="tm-form-grid">
          <label>
            项目名称
            <input v-model="customForm.projectName" type="text" />
          </label>
          <label>
            输出格式
            <input v-model="customForm.outputFormat" type="text" />
          </label>
          <label>
            目标读者
            <input v-model="customForm.targetReader" type="text" />
          </label>
          <label class="wide">
            文本目标
            <textarea v-model="customForm.textGoal" />
          </label>
          <label class="wide">
            约束条件
            <textarea v-model="customForm.constraints" />
          </label>
        </div>
      </article>

      <article v-if="currentStep === 3" class="tm-panel">
        <header class="tm-panel-header">
          <p>Step 3</p>
          <h2>选择生产模板</h2>
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
      </article>

      <article v-if="currentStep === 4" class="tm-panel">
        <header class="tm-panel-header">
          <p>Step 4</p>
          <h2>AI 风格和生成策略</h2>
        </header>

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

        <section class="tm-choice-section">
          <h3>生成策略</h3>
          <div class="tm-strategy-grid">
            <label
              v-for="strategy in strategyOptions"
              :key="strategy.value"
              :class="{ selected: generationStrategy === strategy.value }"
            >
              <input
                v-model="generationStrategy"
                type="radio"
                :value="strategy.value"
              />
              <strong>{{ strategy.label }}</strong>
              <span>{{ strategy.description }}</span>
            </label>
          </div>
        </section>

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
      </article>

      <aside class="tm-summary-panel">
        <p>Project Preview</p>
        <h2>{{ projectTitle || '未命名项目' }}</h2>
        <span>{{ projectSummary || '完成基础设定后生成摘要。' }}</span>
        <dl>
          <div>
            <dt>类型</dt>
            <dd>{{ selectedProjectType }}</dd>
          </div>
          <div>
            <dt>模板</dt>
            <dd>{{ selectedTemplateId }}</dd>
          </div>
          <div>
            <dt>策略</dt>
            <dd>{{ generationStrategy }}</dd>
          </div>
          <div>
            <dt>运行</dt>
            <dd>LocalRuntime</dd>
          </div>
        </dl>
      </aside>
    </section>

    <footer class="tm-create-footer">
      <button class="tm-button" type="button" :disabled="currentStep === 1" @click="goBack">
        上一步
      </button>
      <button
        v-if="currentStep < 4"
        class="tm-button tm-button-primary"
        type="button"
        :disabled="!canContinue"
        @click="goNext"
      >
        下一步
      </button>
      <button
        v-else
        class="tm-button tm-button-primary"
        type="button"
        :disabled="!canContinue || isCreating"
        @click="createProject"
      >
        {{ isCreating ? '创建中...' : '创建项目并进入工作台' }}
      </button>
      <p v-if="createError" class="tm-error">{{ createError }}</p>
    </footer>
  </main>
</template>

<style scoped>
.tm-create-page {
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background: #050506;
  color: #f4f4f5;
  padding: 28px;
}

.tm-create-header,
.tm-step-strip,
.tm-panel,
.tm-summary-panel,
.tm-create-footer {
  border: 1px solid rgba(161, 161, 170, 0.16);
  border-radius: 8px;
  background: rgba(24, 24, 27, 0.9);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
}

.tm-create-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px;
}

.tm-create-header p,
.tm-create-header span,
.tm-panel-header p,
.tm-summary-panel p,
.tm-summary-panel span,
.tm-summary-panel dt {
  color: #a1a1aa;
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.tm-create-header h1 {
  margin: 6px 0;
  font-size: 34px;
  line-height: 1;
}

.tm-step-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  max-width: 1180px;
  margin: 18px auto 0;
  padding: 12px;
}

.tm-step-strip button,
.tm-type-grid button,
.tm-template-grid button,
.tm-chip-grid button,
.tm-strategy-grid label,
.tm-button {
  border: 1px solid rgba(161, 161, 170, 0.18);
  border-radius: 6px;
  background: #18181b;
  color: #f4f4f5;
}

.tm-step-strip button {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 12px;
  text-align: left;
}

.tm-step-strip button.active,
.tm-type-grid button.selected,
.tm-template-grid button.selected,
.tm-chip-grid button.selected,
.tm-strategy-grid label.selected {
  border-color: rgba(129, 140, 248, 0.54);
  background: #1f2130;
}

.tm-step-strip span {
  color: #a1a1aa;
  font-size: 12px;
}

.tm-step-strip strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tm-create-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
  gap: 18px;
  max-width: 1180px;
  margin: 18px auto 0;
}

.tm-panel,
.tm-summary-panel {
  min-width: 0;
  padding: 22px;
}

.tm-panel-header h2,
.tm-summary-panel h2 {
  margin: 6px 0 0;
  font-size: 22px;
}

.tm-type-grid,
.tm-template-grid,
.tm-chip-grid,
.tm-strategy-grid,
.tm-form-grid {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.tm-type-grid,
.tm-template-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tm-type-grid button,
.tm-template-grid button {
  display: grid;
  gap: 8px;
  min-height: 104px;
  padding: 16px;
  text-align: left;
}

.tm-type-grid span,
.tm-template-grid span,
.tm-strategy-grid span {
  color: #a1a1aa;
  font-size: 13px;
  line-height: 1.6;
}

.tm-form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tm-form-grid label {
  display: grid;
  gap: 8px;
  min-width: 0;
  color: #d4d4d8;
  font-size: 13px;
}

.tm-form-grid label.wide {
  grid-column: 1 / -1;
}

.tm-form-grid input,
.tm-form-grid textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid rgba(161, 161, 170, 0.18);
  border-radius: 6px;
  background: #09090b;
  color: #f4f4f5;
  padding: 11px 12px;
  font-size: 14px;
}

.tm-form-grid textarea {
  min-height: 92px;
  max-height: 260px;
  overflow: auto;
  line-height: 1.7;
  resize: vertical;
}

.tm-choice-section + .tm-choice-section {
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

.tm-strategy-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.tm-strategy-grid label {
  display: grid;
  gap: 8px;
  padding: 14px;
}

.tm-strategy-grid input {
  accent-color: #f4f4f5;
}

.tm-summary-panel dl {
  display: grid;
  gap: 10px;
  margin: 20px 0 0;
}

.tm-summary-panel div {
  border-radius: 8px;
  background: #111113;
  padding: 12px;
}

.tm-summary-panel dd {
  margin: 8px 0 0;
  color: #f4f4f5;
  word-break: break-word;
}

.tm-create-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  max-width: 1180px;
  margin: 18px auto 0;
  padding: 16px;
}

.tm-button {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  text-decoration: none;
  font-size: 14px;
}

.tm-button-primary {
  border-color: rgba(129, 140, 248, 0.62);
  background: #2f3347;
  color: #eef2ff;
  font-weight: 700;
}

.tm-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.tm-error {
  color: #fca5a5;
}

@media (max-width: 980px) {
  .tm-create-page {
    padding: 18px;
  }

  .tm-step-strip,
  .tm-type-grid,
  .tm-template-grid,
  .tm-strategy-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tm-create-shell {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .tm-create-header {
    align-items: stretch;
    flex-direction: column;
  }

  .tm-step-strip,
  .tm-type-grid,
  .tm-template-grid,
  .tm-form-grid,
  .tm-chip-grid,
  .tm-strategy-grid {
    grid-template-columns: 1fr;
  }
}
</style>
