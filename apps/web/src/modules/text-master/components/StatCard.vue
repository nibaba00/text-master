<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  note?: string;
}>();
</script>

<template>
  <article class="tm-stat-card-component">
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
    <small v-if="note">{{ note }}</small>
  </article>
</template>

<style scoped>
.tm-stat-card-component {
  display: grid;
  gap: 8px;
  min-width: 0;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent),
    var(--tm-card);
  color: var(--tm-text);
  box-shadow: var(--tm-shadow-card);
  padding: 16px;
}

.tm-stat-card-component span,
.tm-stat-card-component small {
  color: var(--tm-text-muted);
  font-size: 12px;
}

.tm-stat-card-component strong {
  color: var(--tm-text);
  font-size: 24px;
  line-height: 1;
}
</style>
