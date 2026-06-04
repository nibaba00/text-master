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
  return mode === 'brain-hub' ? 'Brain Hub Mode' : 'Local Mode';
}
</script>

<template>
  <aside class="tm-ai-action-panel">
    <header>
      <p>AI Copilot</p>
      <h2>Mock Text v0</h2>
    </header>

    <section class="tm-ai-status" aria-label="Workspace AI status">
      <div>
        <span>当前项目状态</span>
        <strong>{{ projectStatus }}</strong>
      </div>
      <div>
        <span>生产进度</span>
        <strong>{{ progress }}%</strong>
      </div>
      <div>
        <span>运行模式</span>
        <strong>{{ formatRuntimeMode(runtimeMode) }}</strong>
      </div>
      <label>
        模型选择
        <select>
          <option>Mock Text v0</option>
        </select>
      </label>
    </section>

    <section class="tm-ai-actions" aria-label="AI actions">
      <button type="button" @click="$emit('action', 'generate')">
        生成
      </button>
      <button type="button" @click="$emit('action', 'rewrite')">
        改写
      </button>
      <button type="button" @click="$emit('action', 'review')">
        审核
      </button>
      <button type="button" @click="$emit('action', 'export')">
        导出
      </button>
    </section>

    <section class="tm-task-queue" aria-label="Mock task queue">
      <h3>任务队列 Mock</h3>
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

    <button class="tm-version-entry" type="button" @click="$emit('openVersions')">
      进入版本记录
    </button>
  </aside>
</template>

<style scoped>
.tm-ai-action-panel {
  width: 300px;
  min-width: 300px;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  border-left: 1px solid rgba(161, 161, 170, 0.14);
  background: #0f0f12;
  color: #f4f4f5;
  padding: 16px;
}

header p,
.tm-ai-status span,
.tm-task-queue span,
.tm-ai-status label {
  color: #a1a1aa;
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
}

header h2 {
  margin: 6px 0 0;
  color: #c7d2fe;
  font-size: 20px;
}

.tm-ai-status,
.tm-ai-actions,
.tm-task-queue ol {
  display: grid;
  gap: 10px;
}

.tm-ai-status {
  margin-top: 18px;
}

.tm-ai-status > div,
.tm-task-queue li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 8px;
  background: #18181b;
  padding: 12px;
}

.tm-ai-status strong,
.tm-task-queue strong {
  color: #e4e4e7;
  font-size: 13px;
}

.tm-ai-status label {
  display: grid;
  gap: 8px;
  border-radius: 8px;
  background: #18181b;
  padding: 12px;
}

.tm-ai-status select {
  width: 100%;
  border: 1px solid rgba(161, 161, 170, 0.18);
  border-radius: 6px;
  background: #09090b;
  color: #f4f4f5;
  padding: 10px;
}

.tm-ai-actions {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 18px;
}

.tm-ai-actions button,
.tm-version-entry {
  min-height: 40px;
  border: 1px solid rgba(148, 148, 160, 0.22);
  border-radius: 6px;
  background: #27272a;
  color: #f4f4f5;
}

.tm-ai-actions button:first-child {
  border-color: rgba(129, 140, 248, 0.54);
  background: #1f2130;
  color: #eef2ff;
}

.tm-task-queue {
  margin-top: 22px;
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

.tm-version-entry {
  width: 100%;
  margin-top: 18px;
}

@media (max-width: 980px) {
  .tm-ai-action-panel {
    width: 100%;
    min-width: 0;
    max-height: none;
    border-left: 0;
    border-top: 1px solid rgba(161, 161, 170, 0.14);
  }
}
</style>
