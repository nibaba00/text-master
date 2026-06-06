<script setup lang="ts">
import { textMasterRoutePaths } from '../routes';

const statusItems = [
  { key: 'local', label: 'Local Mode', tone: 'success' },
  { key: 'hub', label: 'Brain Hub Ready', tone: 'accent' },
] as const;
</script>

<template>
  <header class="tm-home-topbar" aria-label="Home status bar">
    <RouterLink class="tm-home-topbar__brand" :to="textMasterRoutePaths.home">
      <span class="tm-home-topbar__mark" aria-hidden="true">TM</span>
      <span class="tm-home-topbar__brand-copy">
        <strong>Text Master</strong>
        <span>独立文本生产工厂</span>
      </span>
    </RouterLink>

    <nav class="tm-home-topbar__nav" aria-label="Top navigation">
      <RouterLink :to="textMasterRoutePaths.projectCenter">项目中心</RouterLink>
      <RouterLink :to="textMasterRoutePaths.templates">模板中心</RouterLink>
      <RouterLink :to="textMasterRoutePaths.exports">导出中心</RouterLink>
      <RouterLink :to="textMasterRoutePaths.settings">设置</RouterLink>
    </nav>

    <div class="tm-home-topbar__status">
      <span
        v-for="item in statusItems"
        :key="item.key"
        class="tm-home-topbar__pill"
        :class="`tone-${item.tone}`"
      >
        <i aria-hidden="true"></i>
        <span>{{ item.label }}</span>
      </span>

      <button class="tm-home-topbar__icon-button" type="button" aria-label="Notifications">
        <span class="tm-home-topbar__notify-dot" aria-hidden="true"></span>
      </button>

      <RouterLink
        class="tm-home-topbar__profile"
        :to="textMasterRoutePaths.profile"
        data-testid="user-profile-button"
      >
        <span class="tm-home-topbar__avatar" aria-hidden="true">U</span>
        <span>用户资料</span>
      </RouterLink>
    </div>
  </header>
</template>

<style scoped>
.tm-home-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 42px;
  width: 100%;
}

.tm-home-topbar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

.tm-home-topbar__mark {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid rgba(139, 140, 255, 0.38);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(79, 95, 137, 0.9), rgba(100, 93, 124, 0.9));
  color: white;
  font-size: 14px;
  font-weight: 900;
}

.tm-home-topbar__brand-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.tm-home-topbar__brand-copy strong {
  font-size: 14px;
}

.tm-home-topbar__brand-copy span {
  color: var(--tm-text-muted);
  font-size: 11px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.tm-home-topbar__nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  min-width: 0;
}

.tm-home-topbar__nav a {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card-muted);
  color: var(--tm-text);
  padding: 0 12px;
  font-size: 12px;
  text-decoration: none;
}

.tm-home-topbar__status {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.tm-home-topbar__pill,
.tm-home-topbar__icon-button,
.tm-home-topbar__profile {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-pill);
  background: var(--tm-card-muted);
  color: var(--tm-text);
  min-height: 34px;
  padding: 0 12px;
  font-size: 12px;
  text-decoration: none;
}

.tm-home-topbar__pill {
  gap: 8px;
}

.tm-home-topbar__pill i,
.tm-home-topbar__notify-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--tm-text-muted);
}

.tone-success i {
  background: var(--tm-success);
}

.tone-accent i {
  background: #7284d7;
}

.tm-home-topbar__icon-button {
  width: 34px;
  justify-content: center;
  padding: 0;
}

.tm-home-topbar__profile {
  gap: 8px;
}

.tm-home-topbar__avatar {
  display: inline-grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 999px;
  background: rgba(120, 126, 181, 0.35);
  color: var(--tm-text);
  font-size: 12px;
  font-weight: 800;
}
</style>
