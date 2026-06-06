<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import HomeTopbar from '../components/HomeTopbar.vue';
import TextMasterSidebar from '../components/TextMasterSidebar.vue';
import { getTextMasterProjectPath, textMasterRoutePaths } from '../routes';

const SIDEBAR_COLLAPSED_KEY = 'text-master:sidebar-collapsed';
const sidebarCollapsed = ref(false);
const storageUsage = '1.2GB / 8.8GB';

function readSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const storedValue = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
  if (storedValue === null) {
    return window.innerWidth < 1120;
  }

  return storedValue === 'true';
}

function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

onMounted(() => {
  sidebarCollapsed.value = readSidebarCollapsed();
});

watch(sidebarCollapsed, (value) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
});

const quickTemplates = [
  ['短剧分集大纲', '快速生成短剧分集结构'],
  ['小说章节生成', '生成章节大纲与正文'],
  ['小红书文案', '标题、封面、正文风格'],
  ['项目 README', '项目说明与交接文档'],
  ['商业 BP 文案', '商业计划书文案'],
  ['产品发布文案', '生成产品发布文案'],
];

const todayTasks = [
  '审核 AI 写作工具发布文案。',
  '补全《便利店夜班》主角设定。',
  '导出 README 文档。',
];

const stats = [
  ['项目总数', '3', '进行中的项目'],
  ['本周生成字数', '2,710', '较上周 +18%'],
  ['待审核文稿', '4', '需要处理'],
  ['最新导出', '1', '今日导出'],
];

const recentProjects = [
  {
    type: '商业文案',
    title: 'AI 写作工具发布文案',
    summary: '官网首屏、产品亮点和发布渠道文案正在审核。',
    step: '审核工厂',
    progress: 70,
    path: getTextMasterProjectPath('project-copy-demo'),
  },
  {
    type: '短剧项目',
    title: '便利店夜班',
    summary: '主角设定和前 8 集钩子已生成，正在补充分集大纲。',
    step: '大纲工厂',
    progress: 12,
    path: getTextMasterProjectPath('project-drama-demo'),
  },
  {
    type: '项目文档',
    title: '产品需求文档',
    summary: '需求范围、用户流程和验收标准已整理，准备导出 Markdown。',
    step: '导出中心',
    progress: 86,
    path: getTextMasterProjectPath('project-doc-demo'),
  },
];

const footerStats = [
  ['Text Master', 'v1.0.0'],
  ['运行状态', '独立运行 / 本地存储'],
  ['总字数', '18,742'],
  ['总文稿', '41'],
  ['总版本', '128'],
  ['本地空间', '1.2GB / 8.8GB'],
];
</script>

<template>
  <main
    class="tm-home-page"
    :class="{ 'text-master-home--sidebar-collapsed': sidebarCollapsed }"
    data-testid="text-master-home"
  >
    <HomeTopbar />

    <section class="tm-home-body">
      <TextMasterSidebar
        :collapsed="sidebarCollapsed"
        :storage-usage="storageUsage"
        @toggle="toggleSidebar"
      />

      <section class="tm-home-content">
        <section class="tm-home-shell">
          <section class="tm-home-top">
            <article class="tm-hero-panel">
              <p class="tm-runtime-badge">LOCAL WORKSPACE</p>
              <h1>Text Master</h1>
              <p class="tm-subtitle">独立文本生产工厂</p>
              <p class="tm-intro">
                将观点、资料、大纲、正文、改写、审核和导出串联成可追溯、可回溯、可协作的完整文本生产流程。
              </p>

              <div class="tm-action-row" aria-label="Text Master actions">
                <RouterLink
                  class="tm-button tm-button-primary"
                  :to="textMasterRoutePaths.projectCreate"
                  data-testid="home-create-project-button"
                >
                  新建文本项目
                </RouterLink>
                <RouterLink class="tm-button" :to="getTextMasterProjectPath('project-drama-demo')">
                  继续上次项目
                </RouterLink>
                <RouterLink class="tm-button" :to="textMasterRoutePaths.projectCreate">导入文本</RouterLink>
                <RouterLink class="tm-button" :to="textMasterRoutePaths.templates">模板中心</RouterLink>
              </div>

              <RouterLink class="tm-suggestion-card" :to="getTextMasterProjectPath('project-drama-demo')">
                <span>今日建议</span>
                <strong>继续完成《便利店夜班》的分集大纲审核</strong>
              </RouterLink>
            </article>

            <aside class="tm-panel tm-templates-card" data-testid="home-quick-templates">
              <header class="tm-panel-header">
                <div>
                  <p>Quick Templates</p>
                  <h2>快速模板</h2>
                </div>
                <RouterLink :to="textMasterRoutePaths.templates">查看全部模板</RouterLink>
              </header>

              <div class="tm-template-list">
                <RouterLink
                  v-for="[title, description] in quickTemplates"
                  :key="title"
                  class="tm-template-entry"
                  :to="textMasterRoutePaths.templates"
                >
                  <i aria-hidden="true"></i>
                  <span>
                    <strong>{{ title }}</strong>
                    <small>{{ description }}</small>
                  </span>
                  <em aria-hidden="true">→</em>
                </RouterLink>
              </div>
            </aside>

            <aside class="tm-home-side-stack">
              <article class="tm-panel tm-tasks-card">
                <header class="tm-panel-header">
                  <div>
                    <p>Today</p>
                    <h2>今日生产任务</h2>
                  </div>
                </header>
                <ul>
                  <li v-for="task in todayTasks" :key="task">{{ task }}</li>
                </ul>
                <RouterLink class="tm-button tm-button-primary" :to="getTextMasterProjectPath('project-copy-demo')">
                  开始处理
                </RouterLink>
              </article>

              <section class="tm-ops-stack" data-testid="home-ads-contest">
                <article class="tm-panel tm-operation-card pro">
                  <p>Text Master Pro</p>
                  <h2>灵感不止于文字</h2>
                  <span>创作从此更高效</span>
                  <RouterLink :to="textMasterRoutePaths.settings">了解 Pro</RouterLink>
                </article>
                <article class="tm-panel tm-operation-card contest">
                  <p>官方比赛</p>
                  <h2>短剧创作大赛</h2>
                  <span>奖金池 ¥10,000，进行中</span>
                  <RouterLink :to="textMasterRoutePaths.templates">立即参与</RouterLink>
                </article>
              </section>
            </aside>
          </section>

          <section class="tm-stats-grid" aria-label="Home production stats">
            <article v-for="[label, value, note] in stats" :key="label" class="tm-metric-card">
              <span>{{ label }}</span>
              <strong>{{ value }}</strong>
              <small>{{ note }}</small>
            </article>
          </section>

          <article class="tm-panel tm-recent-panel" data-testid="home-recent-projects">
            <header class="tm-panel-header">
              <div>
                <p>Production Tasks</p>
                <h2>最近项目</h2>
              </div>
              <RouterLink class="tm-project-history-link" :to="textMasterRoutePaths.projectCenter">
                打开历史项目列表
              </RouterLink>
            </header>

            <div class="tm-project-list">
              <article v-for="project in recentProjects" :key="project.title" class="tm-project-card">
                <div class="tm-project-main">
                  <span>{{ project.type }}</span>
                  <h3>{{ project.title }}</h3>
                  <p>{{ project.summary }}</p>
                  <div class="tm-progress-track" aria-label="Project progress">
                    <span :style="{ width: `${project.progress}%` }" />
                  </div>
                </div>
                <aside class="tm-project-side">
                  <strong>{{ project.progress }}%</strong>
                  <small>{{ project.step }}</small>
                  <RouterLink :to="project.path">继续生产</RouterLink>
                  <RouterLink :to="project.path">查看版本</RouterLink>
                  <RouterLink :to="textMasterRoutePaths.exports">导出</RouterLink>
                </aside>
              </article>
            </div>

            <div class="tm-project-history-bar">
              <RouterLink class="tm-button tm-project-history-button" :to="textMasterRoutePaths.projectCenter">
                打开历史项目列表
              </RouterLink>
            </div>
          </article>

          <footer class="tm-home-footer">
            <dl>
              <div v-for="[label, value] in footerStats" :key="label">
                <dt>{{ label }}</dt>
                <dd>{{ value }}</dd>
              </div>
            </dl>
          </footer>
        </section>
      </section>
    </section>
  </main>
</template>

<style scoped>
.tm-home-page {
  --tm-home-sidebar-width: 248px;
  --tm-home-sidebar-collapsed-width: 76px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 8px;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: var(--tm-bg);
  color: var(--tm-text);
  padding: var(--tm-page-padding);
}

.text-master-home--sidebar-collapsed {
  --tm-home-sidebar-width: var(--tm-home-sidebar-collapsed-width);
}

.tm-home-body {
  display: grid;
  grid-template-columns: var(--tm-home-sidebar-width) minmax(0, 1fr);
  gap: 8px;
  min-height: 0;
  overflow: hidden;
}

.tm-home-content {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.tm-home-shell {
  display: grid;
  gap: 8px;
  width: min(100%, var(--tm-page-max-width));
  min-width: 0;
  margin: 0;
}

.tm-home-top {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.72fr) minmax(260px, 0.56fr);
  gap: 8px;
  min-height: 0;
}

.tm-hero-panel,
.tm-panel,
.tm-metric-card,
.tm-project-card,
.tm-home-footer {
  min-width: 0;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background: var(--tm-panel);
  box-shadow: var(--tm-shadow-card);
}

.tm-hero-panel {
  position: relative;
  overflow: hidden;
  padding: 12px;
}

.tm-hero-panel::after {
  position: absolute;
  right: 22px;
  top: 24px;
  width: 92px;
  height: 92px;
  border: 1px solid rgba(125, 136, 158, 0.25);
  border-radius: 24px;
  background: radial-gradient(circle at 40% 40%, rgba(125, 136, 158, 0.22), rgba(111, 108, 133, 0.12) 56%, transparent 70%);
  content: "AI";
  display: grid;
  place-items: center;
  color: #c4cad8;
  font-weight: 900;
  transform: rotate(-8deg);
}

.tm-runtime-badge,
.tm-panel-header p,
.tm-metric-card span,
.tm-project-card span,
.tm-home-footer dt,
.tm-operation-card p {
  margin: 0;
  color: var(--tm-text-muted);
  font-size: 11px;
  text-transform: uppercase;
}

.tm-hero-panel h1 {
  margin: 6px 0 0;
  font-size: clamp(32px, 3.6vw, 42px);
  line-height: 1;
}

.tm-subtitle {
  margin: 6px 0 0;
  color: var(--tm-text-soft);
  font-size: 18px;
}

.tm-intro {
  max-width: 620px;
  margin: 8px 0 0;
  color: var(--tm-text-soft);
  font-size: 13px;
  line-height: 1.38;
}

.tm-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.tm-button,
.tm-panel-header a,
.tm-operation-card a,
.tm-project-side a {
  display: inline-flex;
  min-height: var(--tm-button-height);
  align-items: center;
  justify-content: center;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-control-bg-hover);
  color: var(--tm-text);
  padding: 0 12px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
}

.tm-button-primary {
  border-color: rgba(132, 138, 156, 0.65);
  background: var(--tm-accent-gradient);
  color: white;
}

.tm-suggestion-card {
  display: grid;
  gap: 4px;
  margin-top: 8px;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card-muted);
  color: inherit;
  padding: 10px 12px;
  text-decoration: none;
}

.tm-suggestion-card span,
.tm-suggestion-card strong {
  font-size: 12px;
}

.tm-panel {
  padding: 10px;
}

.tm-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 7px;
}

.tm-panel-header h2,
.tm-operation-card h2 {
  margin: 3px 0 0;
  font-size: 15px;
}

.tm-template-list,
.tm-home-side-stack,
.tm-ops-stack,
.tm-project-list {
  display: grid;
  gap: 5px;
}

.tm-template-entry {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card-muted);
  color: inherit;
  padding: 5px 8px;
  text-decoration: none;
}

.tm-template-entry i {
  width: 22px;
  height: 22px;
  border-radius: 9px;
  background: var(--tm-accent-gradient);
}

.tm-template-entry span {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.tm-template-entry strong,
.tm-template-entry small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tm-template-entry small {
  color: var(--tm-text-muted);
  font-size: 11px;
}

.tm-tasks-card ul {
  display: grid;
  gap: 5px;
  margin: 0 0 8px;
  padding: 0;
  list-style: none;
}

.tm-tasks-card li {
  border-radius: var(--tm-radius-control);
  background: var(--tm-card-muted);
  color: var(--tm-text-soft);
  padding: 6px 8px;
  font-size: 12px;
}

.tm-operation-card {
  display: grid;
  gap: 6px;
  background: linear-gradient(135deg, rgba(103, 114, 140, 0.14), transparent 54%), var(--tm-panel);
}

.tm-operation-card.contest {
  background: linear-gradient(135deg, rgba(154, 132, 92, 0.14), transparent 54%), var(--tm-panel);
}

.tm-operation-card span {
  color: var(--tm-text-muted);
  font-size: 12px;
}

.tm-operation-card a {
  justify-self: start;
  min-height: 30px;
}

.tm-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.tm-metric-card {
  padding: 8px 10px;
}

.tm-metric-card strong {
  display: block;
  margin-top: 5px;
  font-size: 19px;
  line-height: 1;
}

.tm-metric-card small {
  display: block;
  margin-top: 5px;
  color: var(--tm-text-muted);
  font-size: 11px;
}

.tm-recent-panel {
  padding: 10px;
}

.tm-project-list {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.tm-project-history-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.tm-project-history-button {
  min-height: 30px;
  padding: 0 12px;
  font-size: 12px;
}

.tm-project-history-link {
  min-height: 30px;
  padding: 0 10px;
  font-size: 12px;
}

.tm-project-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 88px;
  gap: 6px;
  background: var(--tm-card);
  padding: 8px;
}

.tm-project-card h3 {
  margin: 4px 0 0;
  font-size: 15px;
}

.tm-project-card p {
  margin: 6px 0 0;
  color: var(--tm-text-muted);
  font-size: 12px;
  line-height: 1.3;
  max-height: 31px;
  overflow: hidden;
}

.tm-progress-track {
  height: 6px;
  overflow: hidden;
  margin-top: 8px;
  border-radius: var(--tm-radius-pill);
  background: #252b38;
}

.tm-progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--tm-accent-gradient);
}

.tm-project-side {
  display: grid;
  align-content: start;
  gap: 6px;
}

.tm-project-side strong {
  font-size: 20px;
}

.tm-project-side small {
  color: var(--tm-text-muted);
  font-size: 11px;
}

.tm-project-side a {
  min-height: 28px;
  padding: 0 8px;
}

.tm-home-footer {
  padding: 6px 8px;
}

.tm-home-footer dl {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.tm-home-footer dt,
.tm-home-footer dd {
  overflow: hidden;
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tm-home-footer dd {
  margin-top: 3px;
  color: var(--tm-text-soft);
  font-size: 12px;
}

@media (max-width: 1120px) {
  .tm-home-page {
    overflow: auto;
  }

  .tm-home-body {
    grid-template-columns: var(--tm-home-sidebar-collapsed-width) minmax(0, 1fr);
  }

  .tm-home-top,
  .tm-project-list {
    grid-template-columns: 1fr;
  }

  .tm-home-footer dl {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-height: 920px) and (min-width: 1121px) {
  .tm-home-page.tm-home-page {
    padding-block: 10px !important;
  }

  .tm-home-shell {
    gap: 6px;
    margin-top: 6px;
  }

  .tm-home-top {
    gap: 6px;
  }

  .tm-hero-panel,
  .tm-panel,
  .tm-recent-panel {
    padding: 8px;
  }

  .tm-hero-panel::after {
    width: 72px;
    height: 72px;
  }

  .tm-hero-panel h1 {
    font-size: 34px;
  }

  .tm-subtitle {
    font-size: 15px;
  }

  .tm-intro {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.28;
  }

  .tm-action-row {
    gap: 6px;
    margin-top: 8px;
  }

  .tm-button,
  .tm-panel-header a,
  .tm-operation-card a,
  .tm-project-side a {
    min-height: 30px;
    padding-inline: 9px;
    font-size: 11px;
  }

  .tm-suggestion-card {
    margin-top: 6px;
    padding: 7px 9px;
  }

  .tm-panel-header {
    margin-bottom: 5px;
  }

  .tm-panel-header h2,
  .tm-operation-card h2 {
    font-size: 14px;
  }

  .tm-template-list,
  .tm-home-side-stack,
  .tm-ops-stack,
  .tm-project-list {
    gap: 4px;
  }

  .tm-template-entry {
    min-height: 34px;
    grid-template-columns: 24px minmax(0, 1fr) 14px;
    gap: 6px;
    padding: 3px 6px;
  }

  .tm-template-entry i {
    width: 18px;
    height: 18px;
  }

  .tm-tasks-card li {
    padding: 5px 7px;
    font-size: 11px;
  }

  .tm-operation-card {
    gap: 4px;
  }

  .tm-operation-card span {
    font-size: 11px;
  }

  .tm-stats-grid {
    gap: 6px;
  }

  .tm-metric-card {
    padding: 6px 8px;
  }

  .tm-metric-card strong {
    margin-top: 3px;
    font-size: 16px;
  }

  .tm-metric-card small {
    margin-top: 3px;
  }

  .tm-project-card {
    grid-template-columns: minmax(0, 1fr) 78px;
    gap: 5px;
    padding: 6px;
  }

  .tm-project-card h3 {
    margin-top: 3px;
    font-size: 13px;
  }

  .tm-project-card p {
    margin-top: 4px;
    max-height: 28px;
    font-size: 11px;
    line-height: 1.25;
  }

  .tm-progress-track {
    margin-top: 6px;
  }

  .tm-project-side {
    gap: 4px;
  }

  .tm-project-side strong {
    font-size: 16px;
  }

  .tm-project-side a {
    min-height: 24px;
    padding-inline: 6px;
  }

  .tm-home-footer {
    padding: 4px 6px;
  }

  .tm-home-footer dl {
    gap: 6px;
  }

  .tm-home-footer dt,
  .tm-home-footer dd {
    font-size: 10px;
  }
}

@media (max-height: 800px) and (min-width: 1121px) {
  .tm-home-page.tm-home-page {
    padding-block: 8px !important;
  }

  .tm-home-shell {
    gap: 5px;
  }

  .tm-hero-panel h1 {
    font-size: 30px;
  }

  .tm-subtitle,
  .tm-suggestion-card {
    display: none;
  }

  .tm-intro {
    max-width: 560px;
    font-size: 11px;
    line-height: 1.22;
  }

  .tm-template-entry {
    min-height: 29px;
  }

  .tm-template-entry small,
  .tm-operation-card span,
  .tm-metric-card small,
  .tm-project-card p,
  .tm-home-footer dt {
    display: none;
  }

  .tm-tasks-card li {
    padding-block: 4px;
  }

  .tm-stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .tm-project-card p {
    max-height: none;
  }

  .tm-home-footer {
    padding-block: 3px;
  }
}

@media (max-width: 760px) {
  .tm-stats-grid,
  .tm-home-footer dl {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>


