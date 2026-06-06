<script setup lang="ts">
import type { WorkflowActionType, WorkflowSpec, WorkflowStage } from '../../workflows/types';

defineProps<{
  workflow: WorkflowSpec;
  stage: WorkflowStage;
  variant: 'generic' | 'short-video' | 'comic-drama' | 'business-copy';
}>();

defineEmits<{
  action: [name: WorkflowActionType];
}>();
</script>

<template>
  <article :class="['tm-stage-panel', `tm-stage-${variant}`]">
    <header class="tm-stage-panel-header">
      <div>
        <p>{{ workflow.name }}</p>
        <h3>{{ stage.title }}</h3>
        <span>{{ stage.description }}</span>
      </div>
      <strong>{{ workflow.workspaceType }}</strong>
    </header>

    <section class="tm-stage-panel-grid">
      <div>
        <span>需要输入</span>
        <ul>
          <li v-for="input in stage.requiredInputs" :key="input">{{ input }}</li>
          <li v-if="stage.requiredInputs.length === 0">暂无输入要求</li>
        </ul>
      </div>

      <div>
        <span>当前输出</span>
        <ul>
          <li v-for="output in stage.outputs" :key="output">{{ output }}</li>
          <li v-if="stage.outputs.length === 0">暂无输出定义</li>
        </ul>
      </div>
    </section>

    <section class="tm-stage-panel-actions">
      <button
        v-for="action in stage.aiActions"
        :key="action.id"
        :class="{ primary: action.primary }"
        type="button"
        @click="$emit('action', action.type)"
      >
        {{ action.label }}
      </button>
    </section>
  </article>
</template>

<style scoped>
.tm-stage-panel {
  display: grid;
  gap: 12px;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent),
    var(--tm-panel);
  background-color: var(--tm-panel-solid);
  box-shadow: var(--tm-shadow-card);
  padding: 14px 16px;
}

.tm-stage-panel-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.tm-stage-panel-header p,
.tm-stage-panel-header span,
.tm-stage-panel-grid span {
  color: var(--tm-text-muted);
  font-size: 12px;
  letter-spacing: 0;
}

.tm-stage-panel-header h3 {
  margin: 6px 0 0;
  font-size: 18px;
}

.tm-stage-panel-header span {
  display: block;
  margin-top: 6px;
  line-height: 1.55;
}

.tm-stage-panel-header strong {
  height: fit-content;
  border: 1px solid rgba(48, 103, 255, 0.35);
  border-radius: 999px;
  background: rgba(48, 103, 255, 0.12);
  color: #93B4FF;
  padding: 5px 10px;
  font-size: 12px;
}

.tm-stage-panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.tm-stage-panel-grid div {
  display: grid;
  gap: 8px;
  border-radius: var(--tm-radius-control);
  background: var(--tm-card);
  padding: 10px 12px;
}

.tm-stage-panel-grid ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tm-stage-panel-grid li {
  color: var(--tm-text-soft);
  font-size: 13px;
}

.tm-stage-panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tm-stage-panel-actions button {
  min-height: var(--tm-button-height);
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card);
  color: var(--tm-text);
  padding: 0 14px;
  font-weight: 700;
}

.tm-stage-panel-actions button.primary {
  border-color: rgba(139, 140, 255, 0.54);
  background: var(--tm-accent-gradient);
  color: white;
}

@media (max-width: 720px) {
  .tm-stage-panel-header,
  .tm-stage-panel-grid {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
