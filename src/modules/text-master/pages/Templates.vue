<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import TopNav from '../components/TopNav.vue';
import { textMasterRoutePaths } from '../routes';
import type { TextProjectType } from '../types/project';
import { templateRegistry } from '../templates/templateRegistry';
import type { TemplateSpec } from '../templates/types';

type TemplateCategory =
  | 'all'
  | 'novel'
  | 'short_drama'
  | 'business_copy'
  | 'document'
  | 'xiaohongshu'
  | 'readme';

type TemplateCard = {
  id: string;
  title: string;
  category: Exclude<TemplateCategory, 'all'>;
  projectType: TextProjectType;
  summary: string;
  scenario: string;
  output: string;
  tags: string[];
  mockParams: Record<string, string>;
  workflowId: string;
  workspaceType: string;
};

const router = useRouter();
const selectedCategory = ref<TemplateCategory>('all');
const lastTemplateAction = ref('模板市场待命，选择模板后进入独立新建项目流程。');

const categoryOptions: Array<{ value: TemplateCategory; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'novel', label: '小说' },
  { value: 'short_drama', label: '短剧' },
  { value: 'business_copy', label: '商业文案' },
  { value: 'document', label: '项目文档' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'readme', label: 'README' },
];

const templates = [
  {
    id: 'short-drama-episode-outline',
    title: '短剧分集大纲',
    category: 'short_drama',
    projectType: 'short_drama',
    summary: '按集数拆分一钩、二钩、付费点和结尾悬念，适合快节奏短剧前期搭骨架。',
    scenario: '短剧立项 / 分集结构 / 投流节奏',
    output: '分集大纲、钩子规则、冲突升级表',
    tags: ['强钩子', '付费点', '分集结构'],
    mockParams: {
      template: 'short-drama-episode-outline',
      type: 'short_drama',
      strategy: 'fast-hook-outline',
    },
  },
  {
    id: 'novel-chapter-generator',
    title: '小说章节生成',
    category: 'novel',
    projectType: 'novel',
    summary: '从世界观、人物动机和章节目标出发，生成稳定的长线章节草稿。',
    scenario: '长篇连载 / 章节草稿 / 世界观推进',
    output: '章节目标、场景拆分、正文候选',
    tags: ['长篇', '章节', '人物线'],
    mockParams: {
      template: 'novel-chapter-generator',
      type: 'novel',
      strategy: 'chapter-draft',
    },
  },
  {
    id: 'xiaohongshu-seeding-copy',
    title: '小红书种草文案',
    category: 'xiaohongshu',
    projectType: 'business_copy',
    summary: '围绕人群痛点、产品卖点和生活化表达，生成适合小红书发布的种草文案。',
    scenario: '消费品种草 / 笔记标题 / 卖点转译',
    output: '标题组、正文、标签、禁用词提示',
    tags: ['小红书', '种草', '转化'],
    mockParams: {
      template: 'xiaohongshu-seeding-copy',
      type: 'business_copy',
      platform: 'xiaohongshu',
    },
  },
  {
    id: 'readme-generator',
    title: 'README 生成',
    category: 'readme',
    projectType: 'document',
    summary: '把项目定位、安装方式、运行流程、目录结构和验收标准整理成可交付 README。',
    scenario: '开源项目 / 内部工具 / 产品说明',
    output: 'README.md 结构、命令区、验收标准',
    tags: ['README', '文档', '交付'],
    mockParams: {
      template: 'readme-generator',
      type: 'document',
      format: 'markdown',
    },
  },
  {
    id: 'bp-copy-generator',
    title: 'BP 文案生成',
    category: 'business_copy',
    projectType: 'business_copy',
    summary: '将商业模式、目标市场、产品优势和融资叙事压缩成清晰的 BP 表达。',
    scenario: '融资 BP / 路演稿 / 商业叙事',
    output: '一句话定位、页面文案、路演讲稿',
    tags: ['BP', '商业', '叙事'],
    mockParams: {
      template: 'bp-copy-generator',
      type: 'business_copy',
      strategy: 'business-narrative',
    },
  },
  {
    id: 'product-intro-copy',
    title: '产品介绍文案',
    category: 'business_copy',
    projectType: 'business_copy',
    summary: '把功能、价值、场景和行动指令整理成官网、落地页或产品手册文案。',
    scenario: '产品官网 / 落地页 / 销售资料',
    output: '产品定位、功能卖点、CTA 文案',
    tags: ['产品', '介绍', '转化'],
    mockParams: {
      template: 'product-intro-copy',
      type: 'business_copy',
      strategy: 'product-positioning',
    },
  },
];

function toTemplateCard(template: TemplateSpec): TemplateCard {
  return {
    id: template.id,
    title: template.name,
    category: template.category,
    projectType: template.projectType,
    summary: template.summary,
    scenario: template.scenario,
    output: template.output,
    tags: template.tags,
    mockParams: template.mockParams,
    workflowId: template.workflowId,
    workspaceType: template.workspaceType,
  };
}

const registryTemplates = templateRegistry.map(toTemplateCard);

const filteredTemplates = computed(() => {
  if (selectedCategory.value === 'all') {
    return registryTemplates;
  }

  return registryTemplates.filter((template) => template.category === selectedCategory.value);
});

const featuredTemplate = computed(() => filteredTemplates.value[0] ?? registryTemplates[0]);

async function useTemplate(template: TemplateCard): Promise<void> {
  lastTemplateAction.value = `已选择模板：${template.title}，正在进入新建项目流程。`;
  await router.push({
    path: textMasterRoutePaths.projectCreate,
    query: {
      source: 'template-market',
      template: template.id,
      type: template.projectType,
      workflowId: template.workflowId,
      workspaceType: template.workspaceType,
      mock: '1',
      ...template.mockParams,
    },
  });
}
</script>

<template>
  <main class="tm-template-page" data-testid="text-master-templates">
    <TopNav />

    <header class="tm-template-hero">
      <div>
        <p>Template Market</p>
        <h1>模板中心</h1>
        <span>模板市场只承载参数，选中后直接进入新建流程。</span>
      </div>
      <aside>
        <span>精选</span>
        <strong>{{ featuredTemplate.title }}</strong>
        <p>{{ featuredTemplate.output }}</p>
      </aside>
    </header>

    <section class="tm-category-strip" aria-label="Template categories">
      <button
        v-for="category in categoryOptions"
        :key="category.value"
        type="button"
        :class="{ active: selectedCategory === category.value }"
        @click="selectedCategory = category.value"
      >
        {{ category.label }}
      </button>
    </section>

    <p class="tm-market-status" aria-live="polite">{{ lastTemplateAction }}</p>

    <section class="tm-template-grid" aria-label="Template cards">
      <article
        v-for="template in filteredTemplates"
        :key="template.id"
        class="tm-template-card"
      >
        <header>
          <span>{{ template.category }}</span>
          <h2>{{ template.title }}</h2>
        </header>
        <p>{{ template.summary }}</p>
        <dl>
          <div>
            <dt>适用场景</dt>
            <dd>{{ template.scenario }}</dd>
          </div>
          <div>
            <dt>输出内容</dt>
            <dd>{{ template.output }}</dd>
          </div>
        </dl>
        <div class="tm-template-tags">
          <span v-for="tag in template.tags" :key="tag">{{ tag }}</span>
        </div>
        <footer>
          <button
            type="button"
            class="tm-button tm-button-primary"
            @click="useTemplate(template)"
          >
            使用模板
          </button>
          <span>{{ template.projectType }} / {{ template.workflowId }}</span>
        </footer>
      </article>
    </section>
  </main>
</template>

<style scoped>
.tm-template-page {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: var(--tm-bg);
  color: var(--tm-text);
  padding: var(--tm-page-padding);
}

.tm-template-nav,
.tm-template-hero,
.tm-category-strip,
.tm-market-status,
.tm-template-card {
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background: var(--tm-panel);
  box-shadow: var(--tm-shadow-card);
  padding: 12px;
}

.tm-template-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: var(--tm-page-max-width);
  margin: 0 auto 18px;
  padding: 10px;
}

.tm-template-nav a,
.tm-button,
.tm-category-strip button {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(212, 212, 216, 0.18);
  border-radius: 6px;
  background: #27272a;
  color: #f4f4f5;
  padding: 0 14px;
  text-decoration: none;
  font-size: 14px;
}

.tm-template-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
  gap: 12px;
  max-width: var(--tm-page-max-width);
  margin: 10px auto 0;
  padding: 12px;
}

.tm-template-hero p,
.tm-template-hero span,
.tm-template-card header span,
.tm-template-card dt,
.tm-template-card footer span,
.tm-market-status {
  color: #a1a1aa;
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.tm-template-hero h1 {
  margin: 4px 0;
  font-size: 26px;
  line-height: 1;
}

.tm-template-hero > div > span {
  display: block;
  max-width: 680px;
  text-transform: none;
  font-size: 14px;
  line-height: 1.7;
}

.tm-template-hero aside {
  border-radius: 8px;
  background: #111113;
  padding: 12px;
}

.tm-template-hero aside strong {
  display: block;
  margin-top: 10px;
  font-size: 22px;
}

.tm-template-hero aside p {
  margin: 10px 0 0;
  text-transform: none;
  line-height: 1.7;
}

.tm-category-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: var(--tm-page-max-width);
  margin: 10px auto 0;
  padding: 8px;
}

.tm-category-strip button.active,
.tm-button-primary {
  border-color: rgba(139, 140, 255, 0.62);
  background: var(--tm-accent-gradient);
  color: white;
  font-weight: 700;
}

.tm-market-status {
  max-width: var(--tm-page-max-width);
  margin: 10px auto 0;
  padding: 8px 12px;
  text-transform: none;
}

.tm-template-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  max-width: var(--tm-page-max-width);
  margin: 10px auto 0;
  max-height: calc(100vh - var(--tm-nav-height) - 270px);
  overflow: auto;
}

.tm-template-card {
  display: grid;
  min-width: 0;
  grid-template-rows: auto auto 1fr auto auto;
  gap: 8px;
  padding: 12px;
}

.tm-template-card h2 {
  margin: 4px 0 0;
  font-size: 16px;
}

.tm-template-card p {
  margin: 0;
  color: #c4c4c8;
  font-size: 12px;
  line-height: 1.45;
}

.tm-template-card dl {
  display: grid;
  gap: 6px;
  margin: 0;
}

.tm-template-card dl div {
  border-radius: 8px;
  background: #111113;
  padding: 8px;
}

.tm-template-card dd {
  margin: 6px 0 0;
  color: #e4e4e7;
  font-size: 13px;
  line-height: 1.35;
}

.tm-template-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tm-template-tags span {
  border: 1px solid rgba(161, 161, 170, 0.18);
  border-radius: 999px;
  background: #111113;
  color: #d4d4d8;
  padding: 6px 10px;
  font-size: 12px;
}

.tm-template-card footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 980px) {
  .tm-template-page {
    padding: 18px;
  }

  .tm-template-hero,
  .tm-template-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-height: 820px) and (min-width: 981px) {
  .tm-template-page.tm-template-page {
    padding-block: 10px !important;
  }

  .tm-template-hero {
    margin-top: 6px;
    padding: 10px;
  }

  .tm-template-hero h1 {
    font-size: 22px;
  }

  .tm-template-hero > div > span,
  .tm-template-hero aside p,
  .tm-template-card p,
  .tm-template-card dd {
    line-height: 1.25;
  }

  .tm-category-strip,
  .tm-market-status,
  .tm-template-grid {
    margin-top: 6px;
  }

  .tm-category-strip {
    gap: 6px;
    padding: 6px;
  }

  .tm-template-grid {
    max-height: calc(100vh - var(--tm-nav-height) - 280px);
  }

  .tm-template-card {
    gap: 6px;
    padding: 10px;
  }
}

@media (max-width: 680px) {
  .tm-template-hero,
  .tm-template-grid {
    grid-template-columns: 1fr;
  }

  .tm-template-card footer {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
