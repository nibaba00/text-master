<script setup lang="ts">
import type { RuntimeMode } from '../runtime/TextMasterRuntime';
import type { TextProjectStatus } from '../types/project';

defineProps<{
  projectStatus: TextProjectStatus | 'unknown';
  progress: number;
  runtimeMode: RuntimeMode;
}>();

defineEmits<{
  action: [name: 'generate' | 'rewrite' | 'review' | 'export'];
  openVersions: [];
}>();

function formatRuntimeMode(mode: RuntimeMode): string {
  return mode === 'brain-hub' ? 'Brain Hub 可选同步' : '本地独立运行';
}

function formatProjectStatus(status: TextProjectStatus | 'unknown'): string {
  const labels: Record<TextProjectStatus, string> = {
    draft: '草稿',
    in_progress: '生产中',
    reviewing: '审核中',
    completed: '已完成',
    exported: '已导出',
    archived: '已归档',
  };

  return status === 'unknown' ? '未知状态' : labels[status];
}
</script>

<template>
  <aside class="tm-ai-action-panel" data-testid="text-master-ai-panel">
    <header>
      <p>AI Copilot</p>
      <h2>AI Copilot</h2>
      <strong>Mock Text v0</strong>
      <small>Brain Hub 仅作为可选同步入口，不是运行依赖。</small>
    </header>

    <section class="tm-ai-status" aria-label="Workspace AI status">
      <div class="tm-ai-progress">
        <span>当前项目进度</span>
        <strong>{{ progress }}%</strong>
        <meter min="0" max="100" :value="progress" />
      </div>
      <div>
        <span>当前项目状态</span>
        <strong>{{ formatProjectStatus(projectStatus) }}</strong>
      </div>
      <div>
        <span>Brain Hub</span>
        <strong>{{ formatRuntimeMode(runtimeMode) }}</strong>
      </div>
    </section>

    <section class="tm-ai-actions" aria-label="AI actions">
      <h3>高频操作</h3>
      <button class="primary" type="button" @click="$emit('action', 'generate')">
        继续生产
      </button>
      <button type="button" @click="$emit('action', 'review')">
        运行项目审核
      </button>
      <button type="button" @click="$emit('action', 'export')">
        导出当前版本
      </button>
    </section>

    <section class="tm-task-queue" aria-label="Mock task queue">
      <h3>任务队列</h3>
      <ol>
        <li>
          <span>等待输入</span>
          <strong>Idle</strong>
        </li>
        <li>
          <span>版本快照</span>
          <strong>Ready</strong>
        </li>
        <li>
          <span>本地导出</span>
          <strong>Standby</strong>
        </li>
      </ol>
    </section>

    <section class="tm-ai-secondary" aria-label="Lower frequency actions">
      <button type="button" @click="$emit('action', 'rewrite')">改写正文</button>
      <button type="button" @click="$emit('openVersions')">进入版本记录</button>
    </section>
  </aside>
</template>

<style scoped>
.tm-ai-action-panel {
  width: var(--tm-ai-panel-width);
  min-width: var(--tm-ai-panel-width);
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent),
    var(--tm-panel);
  background-color: var(--tm-panel-solid);
  color: var(--tm-text);
  box-shadow: var(--tm-shadow-card);
  padding: 16px;
}

header p,
header strong,
.tm-ai-status span,
.tm-task-queue span,
header small {
  color: var(--tm-text-muted);
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
}

header h2 {
  margin: 6px 0 0;
  color: var(--tm-text);
  font-size: 22px;
}

header strong {
  display: inline-flex;
  width: fit-content;
  min-height: 28px;
  align-items: center;
  margin-top: 10px;
  border: 1px solid rgba(48, 103, 255, 0.35);
  border-radius: var(--tm-radius-pill);
  background: rgba(48, 103, 255, 0.12);
  color: #93B4FF;
  padding: 5px 10px;
  text-transform: none;
}

header small {
  display: block;
  margin-top: 8px;
  text-transform: none;
  line-height: 1.5;
}

.tm-ai-status,
.tm-ai-actions,
.tm-ai-secondary,
.tm-task-queue ol {
  display: grid;
  gap: 10px;
}

.tm-ai-status {
  margin-top: 14px;
}

.tm-ai-status > div,
.tm-task-queue li {
  display: grid;
  gap: 12px;
  border-radius: var(--tm-radius-control);
  background: var(--tm-card);
  padding: 10px 12px;
}

.tm-ai-status > div:not(.tm-ai-progress),
.tm-task-queue li {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}

.tm-ai-status strong,
.tm-task-queue strong {
  color: var(--tm-text-soft);
  font-size: 13px;
}

.tm-ai-progress meter {
  width: 100%;
}

.tm-ai-actions {
  margin-top: 14px;
}

.tm-ai-actions h3 {
  margin: 0 0 2px;
  font-size: 17px;
}

.tm-ai-actions button,
.tm-ai-secondary button {
  min-height: var(--tm-button-height);
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-control-bg-hover);
  color: var(--tm-text);
  font-weight: 700;
}

.tm-ai-actions button.primary {
  border-color: rgba(139, 140, 255, 0.54);
  background: var(--tm-accent-gradient);
  color: white;
}

.tm-ai-actions button:nth-of-type(2) {
  border-color: rgba(139, 140, 255, 0.38);
  background: rgba(119, 117, 255, 0.14);
  color: #dce3ff;
}

.tm-ai-actions button:nth-of-type(3) {
  border-color: rgba(72, 213, 138, 0.3);
  background: rgba(72, 213, 138, 0.12);
  color: #c8f8dc;
}

.tm-task-queue {
  margin-top: 18px;
}

.tm-task-queue h3 {
  margin: 0 0 12px;
  font-size: 15px;
}

.tm-task-queue ol {
  margin: 0;
  padding: 0;
  list-style: none;
}

.tm-ai-secondary {
  margin-top: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tm-ai-secondary button {
  min-height: 38px;
  color: var(--tm-text-muted);
  font-size: 12px;
}

@media (max-width: 980px) {
  .tm-ai-action-panel {
    width: 100%;
    min-width: 0;
    max-height: none;
    border-left: 1px solid var(--tm-border);
    border-top: 1px solid var(--tm-border);
  }
}
</style>
