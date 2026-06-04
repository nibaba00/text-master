<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  getTextMasterProjectPath,
  textMasterRoutePaths,
} from '../routes';
import { listDocuments } from '../services/documentService';
import { listProjects } from '../services/projectService';
import { listVersions } from '../services/versionService';
import type { TextProject } from '../types/project';

const projects = ref<TextProject[]>([]);
const documentCount = ref(0);
const todayVersionCount = ref(0);
const loadError = ref('');

const recentProjects = computed(() => projects.value.slice(0, 3));
const totalWordCount = computed(() =>
  projects.value.reduce((total, project) => total + project.wordCount, 0),
);
const averageProgress = computed(() => {
  if (projects.value.length === 0) {
    return 0;
  }

  return Math.round(
    projects.value.reduce((total, project) => total + project.progress, 0) /
      projects.value.length,
  );
});

onMounted(async () => {
  try {
    const [projectItems, documentItems, versionItems] = await Promise.all([
      listProjects(),
      listDocuments(),
      listVersions(),
    ]);

    projects.value = projectItems;
    documentCount.value = documentItems.length;
    todayVersionCount.value = versionItems.filter((version) =>
      isToday(version.createdAt),
    ).length;
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : '无法加载本地项目数据';
  }
});

function isToday(value: string): boolean {
  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
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
  <main class="tm-home-page">
    <section class="tm-hero-panel">
      <div class="tm-hero-copy">
        <p class="tm-runtime-badge">Local Mode</p>
        <h1>Text Master</h1>
        <p class="tm-subtitle">结构化文本生产工厂</p>
        <p class="tm-intro">
          独立运行、独立存储、独立导出的文本生产 App。当前不依赖
          Brain Hub，也不是 Brain Hub 的内部页面。
        </p>
        <div class="tm-action-row" aria-label="Text Master actions">
          <RouterLink
            class="tm-button tm-button-primary"
            :to="textMasterRoutePaths.projectCreate"
          >
            新建文本项目
          </RouterLink>
          <RouterLink class="tm-button" :to="textMasterRoutePaths.projectCenter">
            打开项目中心
          </RouterLink>
          <RouterLink class="tm-button" :to="textMasterRoutePaths.templates">
            模板中心
          </RouterLink>
          <RouterLink class="tm-button" :to="textMasterRoutePaths.settings">
            设置
          </RouterLink>
        </div>
      </div>

      <aside class="tm-status-console" aria-label="Local runtime status">
        <div class="tm-console-line">
          <span>Runtime</span>
          <strong>Local Mode</strong>
        </div>
        <div class="tm-console-line">
          <span>Storage</span>
          <strong>localStorage</strong>
        </div>
        <div class="tm-console-line">
          <span>Hub</span>
          <strong>Optional</strong>
        </div>
        <p>
          可被 Brain Hub 启动和同步，但当前以独立运行模式打开。
        </p>
      </aside>
    </section>

    <section class="tm-dashboard-grid" aria-label="Production overview">
      <article class="tm-metric-card">
        <span>项目总数</span>
        <strong>{{ projects.length }}</strong>
      </article>
      <article class="tm-metric-card">
        <span>累计字数</span>
        <strong>{{ totalWordCount.toLocaleString() }}</strong>
      </article>
      <article class="tm-metric-card">
        <span>文档数量</span>
        <strong>{{ documentCount }}</strong>
      </article>
      <article class="tm-metric-card">
        <span>平均进度</span>
        <strong>{{ averageProgress }}%</strong>
      </article>
    </section>

    <section class="tm-content-grid">
      <article class="tm-panel tm-recent-panel">
        <header class="tm-panel-header">
          <div>
            <p>Recent Projects</p>
            <h2>最近项目预览</h2>
          </div>
          <RouterLink :to="textMasterRoutePaths.projectCenter">
            查看全部
          </RouterLink>
        </header>

        <p v-if="loadError" class="tm-error">{{ loadError }}</p>
        <div v-else class="tm-recent-list">
          <RouterLink
            v-for="project in recentProjects"
            :key="project.id"
            class="tm-recent-card"
            :to="getTextMasterProjectPath(project.id)"
          >
            <div>
              <span>{{ project.type }}</span>
              <h3>{{ project.title }}</h3>
              <p>{{ project.summary }}</p>
            </div>
            <footer>
              <span>{{ formatUpdatedAt(project.updatedAt) }}</span>
              <strong>{{ project.progress }}%</strong>
            </footer>
          </RouterLink>
        </div>
      </article>

      <article class="tm-panel tm-today-panel">
        <header class="tm-panel-header">
          <div>
            <p>Today</p>
            <h2>今日生产状态</h2>
          </div>
        </header>
        <div class="tm-production-stack">
          <div>
            <span>今日版本记录</span>
            <strong>{{ todayVersionCount }}</strong>
          </div>
          <div>
            <span>当前运行模式</span>
            <strong>Local Mode</strong>
          </div>
          <div>
            <span>下一步动作</span>
            <RouterLink :to="textMasterRoutePaths.projectCreate">
              创建文本项目
            </RouterLink>
          </div>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.tm-home-page {
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background: #050506;
  color: #f4f4f5;
  padding: 32px;
}

.tm-hero-panel,
.tm-panel,
.tm-metric-card {
  border: 1px solid rgba(161, 161, 170, 0.16);
  background: rgba(24, 24, 27, 0.88);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
}

.tm-hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 380px);
  gap: 28px;
  max-width: 1180px;
  margin: 0 auto;
  border-radius: 8px;
  padding: 34px;
}

.tm-runtime-badge,
.tm-panel-header p,
.tm-metric-card span,
.tm-console-line span,
.tm-production-stack span,
.tm-recent-card span {
  color: #a1a1aa;
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.tm-hero-copy h1 {
  margin: 12px 0 0;
  font-size: 56px;
  line-height: 1;
  letter-spacing: 0;
}

.tm-subtitle {
  margin: 14px 0 0;
  color: #e4e4e7;
  font-size: 24px;
}

.tm-intro {
  max-width: 680px;
  margin: 18px 0 0;
  color: #c4c4c8;
  font-size: 15px;
  line-height: 1.8;
}

.tm-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}

.tm-button,
.tm-panel-header a,
.tm-production-stack a {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(212, 212, 216, 0.18);
  border-radius: 6px;
  background: #27272a;
  color: #f4f4f5;
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

.tm-status-console {
  border-radius: 8px;
  border: 1px solid rgba(161, 161, 170, 0.16);
  background: #111113;
  padding: 22px;
}

.tm-console-line {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid rgba(161, 161, 170, 0.12);
  padding: 13px 0;
}

.tm-console-line:first-child {
  padding-top: 0;
}

.tm-console-line strong {
  color: #d4d4d8;
  font-size: 13px;
}

.tm-status-console p {
  margin: 18px 0 0;
  color: #a1a1aa;
  font-size: 13px;
  line-height: 1.7;
}

.tm-dashboard-grid,
.tm-content-grid {
  display: grid;
  max-width: 1180px;
  margin: 22px auto 0;
  gap: 18px;
}

.tm-dashboard-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.tm-content-grid {
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.55fr);
}

.tm-metric-card,
.tm-panel {
  border-radius: 8px;
  padding: 20px;
}

.tm-metric-card strong {
  display: block;
  margin-top: 12px;
  font-size: 28px;
  line-height: 1;
}

.tm-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.tm-panel-header h2 {
  margin: 4px 0 0;
  font-size: 18px;
}

.tm-recent-list {
  display: grid;
  gap: 12px;
}

.tm-recent-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  border: 1px solid rgba(161, 161, 170, 0.14);
  border-radius: 8px;
  background: #18181b;
  color: inherit;
  padding: 16px;
  text-decoration: none;
}

.tm-recent-card h3 {
  margin: 6px 0 0;
  font-size: 16px;
}

.tm-recent-card p {
  margin: 8px 0 0;
  color: #a1a1aa;
  font-size: 13px;
  line-height: 1.6;
}

.tm-recent-card footer {
  display: grid;
  align-content: space-between;
  justify-items: end;
  min-width: 86px;
}

.tm-recent-card footer strong {
  font-size: 20px;
}

.tm-production-stack {
  display: grid;
  gap: 12px;
}

.tm-production-stack > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-radius: 8px;
  background: #18181b;
  padding: 16px;
}

.tm-production-stack strong {
  font-size: 20px;
}

.tm-error {
  color: #fca5a5;
}

@media (max-width: 900px) {
  .tm-home-page {
    padding: 18px;
  }

  .tm-hero-panel,
  .tm-content-grid {
    grid-template-columns: 1fr;
  }

  .tm-dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tm-hero-copy h1 {
    font-size: 42px;
  }
}

@media (max-width: 560px) {
  .tm-dashboard-grid {
    grid-template-columns: 1fr;
  }

  .tm-recent-card {
    grid-template-columns: 1fr;
  }

  .tm-recent-card footer {
    justify-items: start;
  }
}
</style>
