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
  <aside class="tm-workspace-sidebar" data-testid="text-master-sidebar">
    <div class="tm-sidebar-title">
      <span>Workspace</span>
      <strong>生产导航</strong>
    </div>

    <nav aria-label="Workspace sections">
      <button
        v-for="(item, index) in items"
        :key="item.key"
        type="button"
        :class="{ active: activeStep === item.key }"
        @click="$emit('select', item.key)"
      >
        <span class="tm-sidebar-index">{{ index + 1 }}</span>
        <span class="tm-sidebar-copy">
          <strong>{{ item.label }}</strong>
          <span>{{ item.description }}</span>
        </span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.tm-workspace-sidebar {
  width: var(--tm-sidebar-width);
  min-width: var(--tm-sidebar-width);
  max-width: var(--tm-sidebar-width);
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
  color: var(--tm-text-muted);
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
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 4px;
  width: 100%;
  min-width: 0;
  border: 1px solid transparent;
  border-radius: var(--tm-radius-control);
  background: transparent;
  color: inherit;
  min-height: 52px;
  padding: 10px 11px;
  text-align: left;
}

.tm-sidebar-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.tm-sidebar-index {
  display: inline-grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: var(--tm-radius-pill);
  background: rgba(139, 140, 255, 0.12);
  color: var(--tm-text-muted);
  font-size: 12px;
  font-weight: 800;
}

nav button strong,
.tm-sidebar-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

nav button.active {
  border-color: rgba(48, 103, 255, 0.4);
  background: rgba(48, 103, 255, 0.12);
  color: var(--tm-text);
}

nav button.active .tm-sidebar-index {
  background: var(--tm-accent-gradient);
  color: white;
}

nav button:hover {
  background: var(--tm-card);
}

@media (max-width: 980px) {
  .tm-workspace-sidebar {
    width: 100%;
    min-width: 0;
    height: auto;
    overflow: visible;
    border-right: 1px solid var(--tm-border);
    border-bottom: 1px solid var(--tm-border);
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
