<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'neutral' | 'success' | 'warning' | 'risk' | 'accent';
  }>(),
  {
    tone: 'neutral',
  },
);
</script>

<template>
  <span :class="['tm-status-pill-component', `tone-${tone}`]">
    <slot />
  </span>
</template>

<style scoped>
.tm-status-pill-component {
  display: inline-flex;
  min-height: 28px;
  width: fit-content;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-pill);
  background: rgba(255, 255, 255, 0.035);
  color: var(--tm-text-soft);
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.tm-status-pill-component::before {
  width: 7px;
  height: 7px;
  border-radius: var(--tm-radius-pill);
  background: currentColor;
  content: "";
}

.tone-success {
  border-color: rgba(72, 213, 138, 0.34);
  background: rgba(72, 213, 138, 0.11);
  color: #baf4d1;
}

.tone-warning {
  border-color: rgba(244, 163, 64, 0.34);
  background: rgba(244, 163, 64, 0.12);
  color: #ffd7a3;
}

.tone-risk {
  border-color: rgba(255, 109, 123, 0.36);
  background: rgba(255, 109, 123, 0.12);
  color: #ffc2c8;
}

.tone-accent {
  border-color: rgba(132, 136, 255, 0.42);
  background: rgba(115, 111, 255, 0.14);
  color: #dfe3ff;
}
</style>
