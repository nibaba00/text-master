<script setup lang="ts">
type WorkspaceStep =
  | 'overview'
  | 'settings'
  | 'materials'
  | 'outline'
  | 'editor'
  | 'rewrite'
  | 'review'
  | 'versions'
  | 'export';

type WorkspaceNavItem = {
  key: WorkspaceStep;
  label: string;
  description: string;
};

defineProps<{
  items: WorkspaceNavItem[];
  activeStep: WorkspaceStep;
}>();

defineEmits<{
  select: [step: WorkspaceStep];
}>();
</script>

<template>
  <aside class="tm-workspace-sidebar">
    <div class="tm-sidebar-title">
      <span>Workspace</span>
      <strong>生产导航</strong>
    </div>

    <nav aria-label="Workspace sections">
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        :class="{ active: activeStep === item.key }"
        @click="$emit('select', item.key)"
      >
        <strong>{{ item.label }}</strong>
        <span>{{ item.description }}</span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.tm-workspace-sidebar {
  width: 220px;
  min-width: 220px;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  border-right: 1px solid rgba(161, 161, 170, 0.14);
  background: #0f0f12;
  color: #f4f4f5;
  padding: 14px;
}

.tm-sidebar-title {
  display: grid;
  gap: 4px;
  margin-bottom: 14px;
  padding: 8px 8px 12px;
}

.tm-sidebar-title span,
nav button span {
  color: #a1a1aa;
  font-size: 12px;
  letter-spacing: 0;
}

.tm-sidebar-title strong {
  font-size: 16px;
}

nav {
  display: grid;
  gap: 6px;
}

nav button {
  display: grid;
  gap: 4px;
  width: 100%;
  min-width: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  padding: 10px;
  text-align: left;
}

nav button strong,
nav button span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

nav button.active {
  border-color: rgba(129, 140, 248, 0.46);
  background: #1f2130;
}

nav button:hover {
  background: #18181b;
}

@media (max-width: 980px) {
  .tm-workspace-sidebar {
    width: 100%;
    min-width: 0;
    height: auto;
    overflow: visible;
    border-right: 0;
    border-bottom: 1px solid rgba(161, 161, 170, 0.14);
  }

  nav {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  nav {
    grid-template-columns: 1fr;
  }
}
</style>
