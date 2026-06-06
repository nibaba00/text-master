<script setup lang="ts">
defineProps<{
  projectPath?: string;
  projectTitle: string;
  autoSaveEnabled: boolean;
  updatedAt?: string;
}>();
</script>

<template>
  <header class="tm-workspace-header">
    <div class="tm-header-title">
      <small>{{ projectPath || '项目中心 / 当前项目' }}</small>
      <h1>{{ projectTitle || '未命名项目' }}</h1>
    </div>

    <div class="tm-header-status">
      <span>{{ autoSaveEnabled ? '自动保存开启' : '手动保存' }}</span>
      <small v-if="updatedAt">更新于 {{ updatedAt }}</small>
    </div>
  </header>
</template>

<style scoped>
.tm-workspace-header {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: min(100%, var(--tm-page-max-width));
  margin: 0 auto;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent),
    var(--tm-panel);
  background-color: var(--tm-panel-solid);
  color: var(--tm-text);
  box-shadow: var(--tm-shadow-card);
  padding: 8px 16px;
}

.tm-header-title {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.tm-header-title small {
  color: var(--tm-text-weak);
  font-size: 11px;
  letter-spacing: 0;
  text-transform: none;
}

.tm-header-status small {
  color: var(--tm-text-weak);
}

.tm-header-title h1 {
  overflow: hidden;
  margin: 0;
  color: var(--tm-text-soft);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tm-header-status {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
}

.tm-header-status span {
  border: 1px solid rgba(139, 140, 255, 0.36);
  border-radius: 999px;
  background: rgba(119, 117, 255, 0.14);
  color: #dce3ff;
  padding: 6px 10px;
  font-size: 12px;
}

@media (max-width: 720px) {
  .tm-workspace-header {
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
    min-height: 84px;
    padding: 12px 16px;
  }

  .tm-header-status {
    flex-wrap: wrap;
  }
}
</style>
