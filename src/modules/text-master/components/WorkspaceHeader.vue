<script setup lang="ts">
defineProps<{
  projectTitle: string;
  autoSaveEnabled: boolean;
  updatedAt?: string;
}>();
</script>

<template>
  <header class="tm-workspace-header">
    <div class="tm-header-brand">
      <strong>Text Master</strong>
      <span>/</span>
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
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid rgba(161, 161, 170, 0.14);
  background: #09090b;
  color: #f4f4f5;
  padding: 0 18px;
}

.tm-header-brand {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.tm-header-brand strong {
  white-space: nowrap;
  font-size: 14px;
}

.tm-header-brand span,
.tm-header-status small {
  color: #71717a;
}

.tm-header-brand h1 {
  overflow: hidden;
  margin: 0;
  color: #e4e4e7;
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
  border: 1px solid rgba(129, 140, 248, 0.36);
  border-radius: 999px;
  background: #1f2130;
  color: #c7d2fe;
  padding: 6px 10px;
  font-size: 12px;
}

@media (max-width: 720px) {
  .tm-workspace-header {
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
    min-height: 86px;
    padding: 12px 16px;
  }

  .tm-header-status {
    flex-wrap: wrap;
  }
}
</style>
