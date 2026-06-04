<script setup lang="ts">
import { getTextMasterProjectPath, textMasterRoutePaths } from '../routes';

const pipelineSteps = [
  { name: '创作设定', status: '已完成' },
  { name: '资料库', status: '已连接' },
  { name: '大纲工厂', status: '运行中' },
  { name: '正文生产', status: '待开始' },
  { name: '改写工厂', status: '待开始' },
  { name: '审核工厂', status: '待处理' },
  { name: '版本记录', status: '自动开启' },
  { name: '导出中心', status: '可用' },
];

const stats = [
  { label: '项目总数', value: '3', note: '进行中的项目' },
  { label: '本周生成字数', value: '2,710', note: '较上周 ↑18%' },
  { label: '待审核文档', value: '4', note: '需要处理' },
  { label: '最新导出', value: '1', note: '今日导出' },
];

const recentProjects = [
  {
    type: '商业文案',
    title: 'AI 写作工具发布文案',
    step: '审核工厂',
    progress: 70,
    path: getTextMasterProjectPath('project-copy-demo'),
  },
  {
    type: '短剧项目',
    title: '便利店夜班',
    step: '大纲工厂',
    progress: 12,
    path: getTextMasterProjectPath('project-drama-demo'),
  },
];

const todayTasks = [
  '审核《AI 写作工具发布文案》',
  '补全《便利店夜班》主角设定',
  '导出 README 文档',
];

const quickTemplates = ['短剧分集大纲', '小说章节生成', '小红书文案', '项目 README'];
</script>

<template>
  <main class="tm-home-page" data-testid="text-master-home">
    <nav class="tm-home-topbar" aria-label="Text Master home navigation">
      <RouterLink class="tm-home-brand" :to="textMasterRoutePaths.home">
        <span class="tm-brand-mark">TM</span>
        <strong>Text Master</strong>
      </RouterLink>

      <div class="tm-home-nav-links">
        <RouterLink :to="textMasterRoutePaths.projectCenter">项目中心</RouterLink>
        <RouterLink :to="textMasterRoutePaths.templates">模板中心</RouterLink>
        <RouterLink :to="textMasterRoutePaths.exports">导出中心</RouterLink>
        <RouterLink :to="textMasterRoutePaths.settings">设置</RouterLink>
      </div>

      <div class="tm-home-status">
        <span class="tm-status-pill">Local Mode</span>
        <span class="tm-status-pill ready">Brain Hub Ready</span>
        <button class="tm-profile-button" type="button" data-testid="user-profile-button">
          <span class="tm-user-avatar" aria-hidden="true">U</span>
          <span>用户资料</span>
        </button>
      </div>
    </nav>

    <section class="tm-home-shell">
      <section class="tm-hero-panel" aria-label="Text Master hero">
        <div class="tm-hero-copy">
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
            <RouterLink class="tm-button" :to="textMasterRoutePaths.projectCreate">
              导入文本
            </RouterLink>
            <RouterLink class="tm-button" :to="textMasterRoutePaths.templates">
              模板中心
            </RouterLink>
          </div>

          <article class="tm-suggestion-card">
            <span>今日建议</span>
            <strong>继续完成《便利店夜班》的分集大纲审核</strong>
          </article>
        </div>

        <aside class="tm-pipeline-card" aria-label="Text production pipeline">
          <header>
            <p>Pipeline</p>
            <h2>文本生产链路</h2>
          </header>
          <ol>
            <li v-for="(step, index) in pipelineSteps" :key="step.name">
              <span>{{ index + 1 }}</span>
              <strong>{{ step.name }}</strong>
              <em>{{ step.status }}</em>
            </li>
          </ol>
          <RouterLink class="tm-button tm-pipeline-button" :to="getTextMasterProjectPath('project-drama-demo')">
            查看工作台
          </RouterLink>
        </aside>
      </section>

      <section class="tm-stats-grid" aria-label="Home production stats">
        <article v-for="item in stats" :key="item.label" class="tm-metric-card">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small>{{ item.note }}</small>
        </article>
      </section>

      <section class="tm-home-lower-grid">
        <article class="tm-panel tm-recent-panel">
          <header class="tm-panel-header">
            <div>
              <p>Production Tasks</p>
              <h2>最近项目</h2>
            </div>
            <RouterLink :to="textMasterRoutePaths.projectCenter">查看全部项目</RouterLink>
          </header>

          <div class="tm-project-list">
            <article
              v-for="project in recentProjects"
              :key="project.title"
              class="tm-project-card"
            >
              <div class="tm-project-main">
                <span>{{ project.type }}</span>
                <h3>{{ project.title }}</h3>
                <p>当前步骤：{{ project.step }}</p>
                <div class="tm-progress-track" aria-label="Project progress">
                  <span :style="{ width: `${project.progress}%` }" />
                </div>
              </div>
              <aside class="tm-project-side">
                <strong>{{ project.progress }}%</strong>
                <RouterLink :to="project.path">继续生产</RouterLink>
                <RouterLink :to="project.path">查看版本</RouterLink>
                <RouterLink :to="textMasterRoutePaths.exports">导出</RouterLink>
              </aside>
            </article>
          </div>
        </article>

        <aside class="tm-home-side-stack">
          <article class="tm-panel tm-tasks-card">
            <header class="tm-panel-header compact">
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

          <article class="tm-panel tm-templates-card">
            <header class="tm-panel-header compact">
              <div>
                <p>Templates</p>
                <h2>快速模板</h2>
              </div>
              <RouterLink :to="textMasterRoutePaths.templates">查看全部模板</RouterLink>
            </header>
            <div class="tm-template-chip-grid">
              <RouterLink
                v-for="template in quickTemplates"
                :key="template"
                :to="textMasterRoutePaths.templates"
              >
                {{ template }}
              </RouterLink>
            </div>
          </article>
        </aside>
      </section>
    </section>
  </main>
</template>

<style scoped>
.tm-home-page {
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background:
    linear-gradient(180deg, rgba(15, 15, 18, 0.72), rgba(5, 5, 6, 0.96)),
    #050506;
  color: #f4f4f5;
  padding: 20px;
}

.tm-home-topbar,
.tm-hero-panel,
.tm-panel,
.tm-metric-card,
.tm-suggestion-card,
.tm-pipeline-card {
  border: 1px solid rgba(161, 161, 170, 0.16);
  background: rgba(24, 24, 27, 0.9);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
}

.tm-home-topbar {
  display: grid;
  grid-template-columns: minmax(180px, 0.72fr) minmax(360px, 1fr) minmax(420px, auto);
  align-items: center;
  gap: 16px;
  max-width: 1240px;
  min-height: 64px;
  margin: 0 auto;
  border-radius: 8px;
  padding: 10px 14px;
}

.tm-home-brand,
.tm-home-nav-links,
.tm-home-status,
.tm-profile-button,
.tm-button,
.tm-panel-header a,
.tm-project-side a,
.tm-template-chip-grid a {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.tm-home-brand {
  min-width: 0;
  gap: 10px;
  color: #f4f4f5;
}

.tm-brand-mark,
.tm-user-avatar {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 8px;
  border: 1px solid rgba(129, 140, 248, 0.42);
  background: #202235;
  color: #c7d2fe;
  font-size: 13px;
  font-weight: 800;
}

.tm-home-nav-links {
  justify-content: center;
  gap: 8px;
}

.tm-home-nav-links a,
.tm-status-pill,
.tm-profile-button {
  min-height: 36px;
  border: 1px solid rgba(148, 148, 160, 0.18);
  border-radius: 6px;
  background: #18181b;
  color: #d4d4d8;
  padding: 0 12px;
  font-size: 13px;
}

.tm-home-nav-links a.router-link-active,
.tm-home-nav-links a:hover,
.tm-profile-button:hover {
  border-color: rgba(129, 140, 248, 0.44);
  background: #202235;
  color: #eef2ff;
}

.tm-home-status {
  justify-content: flex-end;
  gap: 8px;
}

.tm-status-pill {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.tm-status-pill.ready {
  border-color: rgba(125, 211, 252, 0.32);
  color: #bae6fd;
}

.tm-profile-button {
  gap: 8px;
  cursor: pointer;
}

.tm-user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  font-size: 11px;
}

.tm-home-shell {
  display: grid;
  max-width: 1240px;
  margin: 18px auto 0;
  gap: 18px;
}

.tm-hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 400px);
  gap: 22px;
  border-radius: 8px;
  padding: 28px;
}

.tm-hero-copy {
  min-width: 0;
}

.tm-runtime-badge,
.tm-panel-header p,
.tm-pipeline-card header p,
.tm-metric-card span,
.tm-suggestion-card span,
.tm-project-card span {
  color: #a1a1aa;
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.tm-hero-copy h1 {
  margin: 12px 0 0;
  font-size: 60px;
  line-height: 1;
  letter-spacing: 0;
}

.tm-subtitle {
  margin: 14px 0 0;
  color: #e4e4e7;
  font-size: 24px;
}

.tm-intro {
  max-width: 720px;
  margin: 18px 0 0;
  color: #c4c4c8;
  font-size: 15px;
  line-height: 1.75;
}

.tm-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 26px;
}

.tm-button,
.tm-panel-header a,
.tm-project-side a,
.tm-template-chip-grid a {
  min-height: 40px;
  justify-content: center;
  border: 1px solid rgba(212, 212, 216, 0.18);
  border-radius: 6px;
  background: #27272a;
  color: #f4f4f5;
  padding: 0 14px;
  font-size: 13px;
}

.tm-button-primary {
  border-color: rgba(129, 140, 248, 0.62);
  background: #2f3347;
  color: #eef2ff;
  font-weight: 700;
}

.tm-suggestion-card {
  display: grid;
  gap: 6px;
  max-width: 560px;
  margin-top: 24px;
  border-radius: 8px;
  padding: 16px;
}

.tm-suggestion-card strong {
  color: #e4e4e7;
  font-size: 15px;
}

.tm-pipeline-card {
  display: grid;
  align-content: start;
  gap: 16px;
  border-radius: 8px;
  padding: 20px;
  background: #101114;
}

.tm-pipeline-card h2,
.tm-panel-header h2 {
  margin: 4px 0 0;
  font-size: 18px;
}

.tm-pipeline-card ol {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tm-pipeline-card li {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  border-radius: 8px;
  background: #18181b;
  padding: 8px 10px;
}

.tm-pipeline-card li span {
  display: inline-grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 6px;
  background: #272a3d;
  color: #c7d2fe;
  font-size: 12px;
}

.tm-pipeline-card li strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.tm-pipeline-card li em {
  color: #a5b4fc;
  font-size: 12px;
  font-style: normal;
  white-space: nowrap;
}

.tm-pipeline-button {
  width: 100%;
}

.tm-stats-grid,
.tm-home-lower-grid {
  display: grid;
  gap: 18px;
}

.tm-stats-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.tm-metric-card,
.tm-panel {
  border-radius: 8px;
  padding: 18px;
}

.tm-metric-card strong {
  display: block;
  margin-top: 10px;
  font-size: 30px;
  line-height: 1;
}

.tm-metric-card small {
  display: block;
  margin-top: 8px;
  color: #a1a1aa;
}

.tm-home-lower-grid {
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
}

.tm-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.tm-panel-header.compact {
  margin-bottom: 12px;
}

.tm-panel-header a {
  min-height: 34px;
}

.tm-project-list,
.tm-home-side-stack,
.tm-tasks-card ul,
.tm-template-chip-grid {
  display: grid;
  gap: 12px;
}

.tm-project-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(124px, auto);
  gap: 16px;
  border: 1px solid rgba(161, 161, 170, 0.14);
  border-radius: 8px;
  background: #18181b;
  padding: 16px;
}

.tm-project-main {
  min-width: 0;
}

.tm-project-card h3 {
  margin: 6px 0 0;
  font-size: 18px;
}

.tm-project-card p {
  margin: 10px 0 0;
  color: #a1a1aa;
  font-size: 13px;
}

.tm-progress-track {
  height: 7px;
  margin-top: 14px;
  overflow: hidden;
  border-radius: 999px;
  background: #27272a;
}

.tm-progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #818cf8, #38bdf8);
}

.tm-project-side {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 124px;
}

.tm-project-side strong {
  justify-self: end;
  color: #c7d2fe;
  font-size: 24px;
}

.tm-project-side a {
  min-height: 32px;
  padding: 0 10px;
}

.tm-tasks-card ul {
  margin: 0 0 14px;
  padding: 0;
  list-style: none;
}

.tm-tasks-card li {
  border-radius: 8px;
  background: #18181b;
  color: #d4d4d8;
  padding: 12px;
  font-size: 13px;
}

.tm-tasks-card .tm-button {
  width: 100%;
}

.tm-template-chip-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tm-template-chip-grid a {
  min-height: 44px;
  padding: 0 10px;
  text-align: center;
}

@media (max-width: 1120px) {
  .tm-home-topbar {
    grid-template-columns: 1fr;
  }

  .tm-home-nav-links,
  .tm-home-status {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .tm-hero-panel,
  .tm-home-lower-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .tm-home-page {
    padding: 14px;
  }

  .tm-hero-panel {
    padding: 20px;
  }

  .tm-hero-copy h1 {
    font-size: 44px;
  }

  .tm-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tm-project-card {
    grid-template-columns: 1fr;
  }

  .tm-project-side {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .tm-project-side strong {
    grid-column: 1 / -1;
    justify-self: start;
  }
}

@media (max-width: 520px) {
  .tm-stats-grid,
  .tm-template-chip-grid,
  .tm-project-side {
    grid-template-columns: 1fr;
  }

  .tm-action-row,
  .tm-home-nav-links,
  .tm-home-status {
    display: grid;
    grid-template-columns: 1fr;
  }

  .tm-button,
  .tm-home-nav-links a,
  .tm-profile-button,
  .tm-status-pill {
    width: 100%;
  }
}
</style>
