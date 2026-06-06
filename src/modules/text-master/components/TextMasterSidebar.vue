<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { getTextMasterProjectPath, textMasterRoutePaths } from '../routes';

type SidebarItem = {
  key: string;
  label: string;
  glyph: string;
  path: string;
};

const props = defineProps<{
  collapsed: boolean;
  storageUsage: string;
}>();

const emit = defineEmits<{
  (event: 'toggle'): void;
}>();

const route = useRoute();

const navItems: SidebarItem[] = [
  { key: 'home', label: '首页', glyph: 'H', path: textMasterRoutePaths.home },
  { key: 'projects', label: '项目中心', glyph: 'P', path: textMasterRoutePaths.projectCenter },
  { key: 'templates', label: '模板中心', glyph: 'T', path: textMasterRoutePaths.templates },
  { key: 'exports', label: '导出中心', glyph: 'E', path: textMasterRoutePaths.exports },
  { key: 'settings', label: '设置中心', glyph: 'S', path: textMasterRoutePaths.settings },
];

const quickActions: SidebarItem[] = [
  { key: 'create', label: '新建文本项目', glyph: '+', path: textMasterRoutePaths.projectCreate },
  { key: 'continue', label: '继续上次项目', glyph: '↺', path: getTextMasterProjectPath('project-drama-demo') },
  { key: 'import', label: '导入文本', glyph: '↓', path: textMasterRoutePaths.projectCreate },
];

const statusItems = computed(() => [
  { key: 'local', label: 'Local Mode', tone: 'success' },
  { key: 'hub', label: 'Brain Hub Ready', tone: 'accent' },
  { key: 'storage', label: props.storageUsage, tone: 'muted' },
]);

function isActive(path: string): boolean {
  if (path === textMasterRoutePaths.home) {
    return route.path === path;
  }

  return route.path === path || route.path.startsWith(`${path}/`);
}
</script>

<template>
  <aside class="tm-home-sidebar" :class="{ 'is-collapsed': collapsed }" aria-label="Text Master sidebar">
    <div class="tm-home-sidebar__brand">
      <RouterLink class="tm-home-sidebar__brand-link" :to="textMasterRoutePaths.home" :title="collapsed ? 'Text Master' : undefined">
        <span class="tm-home-sidebar__mark" aria-hidden="true">TM</span>
        <span v-if="!collapsed" class="tm-home-sidebar__copy">
          <strong>Text Master</strong>
          <span>独立文本生产工厂</span>
        </span>
      </RouterLink>

      <button
        class="tm-home-sidebar__toggle"
        type="button"
        :aria-label="collapsed ? '展开侧边栏' : '收起侧边栏'"
        :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
        @click="emit('toggle')"
      >
        <span aria-hidden="true">{{ collapsed ? '›' : '‹' }}</span>
      </button>
    </div>

    <nav class="tm-home-sidebar__nav" aria-label="Primary navigation">
      <RouterLink
        v-for="item in navItems"
        :key="item.key"
        class="tm-home-sidebar__link"
        :class="{ 'is-active': isActive(item.path) }"
        :to="item.path"
        :title="collapsed ? item.label : undefined"
      >
        <span class="tm-home-sidebar__glyph" aria-hidden="true">{{ item.glyph }}</span>
        <span v-if="!collapsed" class="tm-home-sidebar__label">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <section class="tm-home-sidebar__section">
      <p v-if="!collapsed" class="tm-home-sidebar__section-title">快速入口</p>
      <div class="tm-home-sidebar__actions">
        <RouterLink
          v-for="item in quickActions"
          :key="item.key"
          class="tm-home-sidebar__action"
          :to="item.path"
          :title="collapsed ? item.label : undefined"
        >
          <span class="tm-home-sidebar__glyph tm-home-sidebar__glyph--action" aria-hidden="true">{{ item.glyph }}</span>
          <span v-if="!collapsed" class="tm-home-sidebar__label">{{ item.label }}</span>
        </RouterLink>
      </div>
    </section>

    <section class="tm-home-sidebar__status">
      <p v-if="!collapsed" class="tm-home-sidebar__section-title">底部状态</p>
      <div class="tm-home-sidebar__status-list">
        <span
          v-for="item in statusItems"
          :key="item.key"
          class="tm-home-sidebar__status-item"
          :class="`tone-${item.tone}`"
          :title="collapsed ? item.label : undefined"
        >
          <i aria-hidden="true"></i>
          <span v-if="!collapsed">{{ item.label }}</span>
        </span>

        <RouterLink
          class="tm-home-sidebar__profile"
          :to="textMasterRoutePaths.profile"
          :title="collapsed ? '用户资料' : undefined"
        >
          <span class="tm-home-sidebar__avatar" aria-hidden="true">U</span>
          <span v-if="!collapsed">用户资料</span>
        </RouterLink>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.tm-home-sidebar {
  display: grid;
  gap: 12px;
  width: var(--tm-home-sidebar-width);
  min-width: var(--tm-home-sidebar-width);
  max-width: var(--tm-home-sidebar-width);
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-panel);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent),
    var(--tm-panel);
  box-shadow: var(--tm-shadow-card);
  padding: 12px;
  transition:
    width 180ms ease,
    min-width 180ms ease,
    max-width 180ms ease,
    padding 180ms ease;
}

.tm-home-sidebar.is-collapsed {
  padding: 12px 8px;
}

.tm-home-sidebar__brand,
.tm-home-sidebar__section,
.tm-home-sidebar__status {
  min-width: 0;
}

.tm-home-sidebar__brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tm-home-sidebar__brand-link {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

.tm-home-sidebar__mark {
  display: inline-grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid rgba(139, 140, 255, 0.38);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(79, 95, 137, 0.9), rgba(100, 93, 124, 0.9));
  color: white;
  font-size: 15px;
  font-weight: 900;
  flex: 0 0 auto;
}

.tm-home-sidebar__copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.tm-home-sidebar__copy strong {
  font-size: 14px;
}

.tm-home-sidebar__copy span,
.tm-home-sidebar__section-title {
  color: var(--tm-text-muted);
  font-size: 11px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.tm-home-sidebar__toggle {
  display: inline-grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 1px solid var(--tm-border);
  border-radius: 10px;
  background: var(--tm-card-muted);
  color: var(--tm-text);
  flex: 0 0 auto;
}

.tm-home-sidebar__nav,
.tm-home-sidebar__actions,
.tm-home-sidebar__status-list {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.tm-home-sidebar__link,
.tm-home-sidebar__action,
.tm-home-sidebar__profile,
.tm-home-sidebar__status-item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 42px;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card-muted);
  color: inherit;
  padding: 5px 8px;
  text-decoration: none;
}

.tm-home-sidebar__glyph,
.tm-home-sidebar__avatar {
  display: inline-grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 999px;
  background: rgba(112, 128, 190, 0.18);
  color: #dbe4ff;
  font-size: 12px;
  font-weight: 900;
}

.tm-home-sidebar__label {
  overflow: hidden;
  min-width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tm-home-sidebar__link.is-active {
  border-color: rgba(87, 112, 255, 0.75);
  background: rgba(87, 112, 255, 0.16);
}

.tm-home-sidebar__action {
  min-height: 38px;
}

.tm-home-sidebar__glyph--action {
  background: rgba(83, 92, 135, 0.22);
}

.tm-home-sidebar__status-list {
  gap: 7px;
}

.tm-home-sidebar__status-item {
  min-height: 34px;
}

.tm-home-sidebar__status-item i {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--tm-text-muted);
}

.tm-home-sidebar__status-item.tone-success i {
  background: var(--tm-success);
}

.tm-home-sidebar__status-item.tone-accent i {
  background: #7284d7;
}

.tm-home-sidebar__status-item.tone-muted i {
  background: var(--tm-text-muted);
}

.tm-home-sidebar__profile {
  min-height: 38px;
}

.is-collapsed .tm-home-sidebar__link,
.is-collapsed .tm-home-sidebar__action,
.is-collapsed .tm-home-sidebar__profile,
.is-collapsed .tm-home-sidebar__status-item {
  grid-template-columns: 1fr;
  justify-items: center;
  padding-inline: 0;
}

.is-collapsed .tm-home-sidebar__brand {
  justify-content: center;
}

.is-collapsed .tm-home-sidebar__mark {
  width: 40px;
  height: 40px;
}

.is-collapsed .tm-home-sidebar__toggle {
  margin-left: auto;
}

.is-collapsed .tm-home-sidebar__nav,
.is-collapsed .tm-home-sidebar__actions,
.is-collapsed .tm-home-sidebar__status-list {
  justify-items: center;
}

.is-collapsed .tm-home-sidebar__actions,
.is-collapsed .tm-home-sidebar__status-list {
  gap: 6px;
}

.is-collapsed .tm-home-sidebar__profile {
  min-height: 40px;
}

.is-collapsed .tm-home-sidebar__status-item {
  width: 100%;
}
</style>
