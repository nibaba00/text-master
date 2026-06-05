<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import TopNav from '../components/TopNav.vue';
import {
  getTextMasterProjectPath,
  textMasterRoutePaths,
} from '../routes';
import { listProjects } from '../services/projectService';
import type {
  TextProject,
  TextProjectStatus,
  TextProjectType,
} from '../types/project';

const projects = ref<TextProject[]>([]);
const searchText = ref('');
const selectedType = ref<'all' | TextProjectType>('all');
const selectedStatus = ref<'all' | TextProjectStatus>('all');
const loadError = ref('');

const typeOptions: Array<{ value: 'all' | TextProjectType; label: string }> = [
  { value: 'all', label: '全部类型' },
  { value: 'novel', label: '小说' },
  { value: 'short_drama', label: '短剧' },
  { value: 'business_copy', label: '商业文案' },
  { value: 'document', label: '文档' },
  { value: 'custom', label: '自定义' },
];

const statusOptions: Array<{ value: 'all' | TextProjectStatus; label: string }> = [
  { value: 'all', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'in_progress', label: '生产中' },
  { value: 'reviewing', label: '审核中' },
  { value: 'completed', label: '已完成' },
  { value: 'exported', label: '已导出' },
  { value: 'archived', label: '已归档' },
];

const filteredProjects = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();

  return projects.value.filter((project) => {
    const matchesType =
      selectedType.value === 'all' || project.type === selectedType.value;
    const matchesStatus =
      selectedStatus.value === 'all' ||
      project.status === selectedStatus.value;
    const matchesKeyword =
      keyword.length === 0 ||
      [project.title, project.summary, project.type, project.status]
        .join(' ')
        .toLowerCase()
        .includes(keyword);

    return matchesType && matchesStatus && matchesKeyword;
  });
});

const totalWordCount = computed(() =>
  filteredProjects.value.reduce((total, project) => total + project.wordCount, 0),
);

onMounted(async () => {
  try {
    projects.value = await listProjects();
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : '无法加载本地项目';
  }
});

function getTypeLabel(type: TextProjectType): string {
  return typeOptions.find((item) => item.value === type)?.label ?? type;
}

function getStatusLabel(status: TextProjectStatus): string {
  return statusOptions.find((item) => item.value === status)?.label ?? status;
}

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
</script>

<template>
  <main class="tm-project-center-page">
    <TopNav />

    <header class="tm-center-header">
      <div>
        <p>Local Project Center</p>
        <h1>项目中心</h1>
        <span>Text Master 独立管理本地项目，不依赖 Brain Hub 子路径。</span>
      </div>
      <RouterLink
        class="tm-button tm-button-primary"
        :to="textMasterRoutePaths.projectCreate"
      >
        新建项目
      </RouterLink>
    </header>

    <section class="tm-filter-panel" aria-label="Project filters">
      <label class="tm-search-box">
        <span>搜索</span>
        <input
          v-model="searchText"
          type="search"
          placeholder="搜索标题、摘要、类型或状态"
        />
      </label>

      <label>
        <span>项目类型</span>
        <select v-model="selectedType">
          <option
            v-for="option in typeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>

      <label>
        <span>项目状态</span>
        <select v-model="selectedStatus">
          <option
            v-for="option in statusOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
    </section>

    <section class="tm-summary-strip" aria-label="Filtered project summary">
      <div>
        <span>匹配项目</span>
        <strong>{{ filteredProjects.length }}</strong>
      </div>
      <div>
        <span>匹配字数</span>
        <strong>{{ totalWordCount.toLocaleString() }}</strong>
      </div>
      <div>
        <span>运行模式</span>
        <strong>Local Mode</strong>
      </div>
    </section>

    <p v-if="loadError" class="tm-error">{{ loadError }}</p>

    <section v-else class="tm-project-grid" aria-label="Project cards">
      <article
        v-for="project in filteredProjects"
        :key="project.id"
        class="tm-project-card"
      >
        <header>
          <div>
            <span>{{ getTypeLabel(project.type) }}</span>
            <h2>{{ project.title }}</h2>
          </div>
          <strong>{{ getStatusLabel(project.status) }}</strong>
        </header>

        <p>{{ project.summary || '暂无项目摘要。' }}</p>

        <div class="tm-project-progress" aria-label="Project progress">
          <div>
            <span>进度</span>
            <strong>{{ project.progress }}%</strong>
          </div>
          <meter min="0" max="100" :value="project.progress" />
        </div>

        <dl class="tm-project-meta">
          <div>
            <dt>更新时间</dt>
            <dd>{{ formatUpdatedAt(project.updatedAt) }}</dd>
          </div>
          <div>
            <dt>字数</dt>
            <dd>{{ project.wordCount.toLocaleString() }}</dd>
          </div>
        </dl>

        <footer>
          <RouterLink
            class="tm-button tm-button-primary"
            :to="getTextMasterProjectPath(project.id)"
          >
            打开项目
          </RouterLink>
          <RouterLink
            class="tm-button"
            :to="{
              path: textMasterRoutePaths.exports,
              query: { projectId: project.id },
            }"
          >
            导出项目
          </RouterLink>
        </footer>
      </article>

      <article v-if="filteredProjects.length === 0" class="tm-empty-card">
        <h2>没有匹配项目</h2>
        <p>调整筛选条件，或创建一个新的文本项目。</p>
        <RouterLink
          class="tm-button tm-button-primary"
          :to="textMasterRoutePaths.projectCreate"
        >
          新建项目
        </RouterLink>
      </article>
    </section>
  </main>
</template>

<style scoped>
.tm-project-center-page {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: var(--tm-bg);
  color: var(--tm-text);
  padding: var(--tm-page-padding);
}

.tm-center-header,
.tm-filter-panel,
.tm-summary-strip,
.tm-project-card,
.tm-empty-card {
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background: var(--tm-panel);
  box-shadow: var(--tm-shadow-card);
}

.tm-center-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  max-width: var(--tm-page-max-width);
  margin: 10px auto 0;
  padding: 14px;
}

.tm-center-header p,
.tm-center-header span,
.tm-filter-panel span,
.tm-summary-strip span,
.tm-project-card header span,
.tm-project-progress span,
.tm-project-meta dt {
  color: #a1a1aa;
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.tm-center-header h1 {
  margin: 4px 0;
  font-size: 26px;
  line-height: 1;
}

.tm-button {
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
  white-space: nowrap;
}

.tm-button-primary {
  border-color: rgba(139, 140, 255, 0.62);
  background: var(--tm-accent-gradient);
  color: white;
  font-weight: 700;
}

.tm-filter-panel {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(160px, 220px) minmax(160px, 220px);
  gap: 14px;
  max-width: var(--tm-page-max-width);
  margin: 10px auto 0;
  padding: 10px;
}

.tm-filter-panel label {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.tm-filter-panel input,
.tm-filter-panel select {
  width: 100%;
  min-width: 0;
  border: 1px solid rgba(161, 161, 170, 0.18);
  border-radius: 6px;
  background: #09090b;
  color: #f4f4f5;
  padding: 11px 12px;
  font-size: 14px;
}

.tm-summary-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  max-width: var(--tm-page-max-width);
  margin: 10px auto 0;
  padding: 10px;
}

.tm-summary-strip > div {
  border-radius: 8px;
  background: #111113;
  padding: 8px 10px;
}

.tm-summary-strip strong {
  display: block;
  margin-top: 4px;
  font-size: 20px;
}

.tm-project-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  max-width: var(--tm-page-max-width);
  max-height: calc(100vh - var(--tm-nav-height) - 284px);
  overflow: auto;
  margin: 10px auto 0;
}

.tm-project-card,
.tm-empty-card {
  min-width: 0;
  padding: 12px;
}

.tm-project-card header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
}

.tm-project-card h2 {
  margin: 6px 0 0;
  font-size: 18px;
  line-height: 1.3;
}

.tm-project-card header strong {
  border: 1px solid rgba(161, 161, 170, 0.18);
  border-radius: 999px;
  background: #111113;
  color: #d4d4d8;
  padding: 6px 10px;
  font-size: 12px;
  white-space: nowrap;
}

.tm-project-card p,
.tm-empty-card p {
  min-height: 54px;
  margin: 14px 0 0;
  color: #a1a1aa;
  font-size: 13px;
  line-height: 1.7;
}

.tm-project-progress {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.tm-project-progress > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.tm-project-progress meter {
  width: 100%;
  height: 10px;
}

.tm-project-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 16px 0 0;
}

.tm-project-meta div {
  border-radius: 8px;
  background: #111113;
  padding: 12px;
}

.tm-project-meta dd {
  margin: 8px 0 0;
  color: #f4f4f5;
  font-size: 14px;
}

.tm-project-card footer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.tm-empty-card {
  grid-column: 1 / -1;
}

.tm-error {
  max-width: var(--tm-page-max-width);
  margin: 18px auto 0;
  color: #fca5a5;
}

@media (max-width: 980px) {
  .tm-project-center-page {
    padding: 18px;
  }

  .tm-filter-panel,
  .tm-project-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tm-search-box {
    grid-column: 1 / -1;
  }
}

@media (max-width: 680px) {
  .tm-center-header {
    align-items: stretch;
    flex-direction: column;
  }

  .tm-filter-panel,
  .tm-summary-strip,
  .tm-project-grid,
  .tm-project-meta {
    grid-template-columns: 1fr;
  }
}
</style>
