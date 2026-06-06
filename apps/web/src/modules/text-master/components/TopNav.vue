<script setup lang="ts">
import { textMasterRoutePaths } from '../routes';
</script>

<template>
  <nav class="tm-top-nav" aria-label="Text Master navigation">
    <RouterLink class="tm-top-nav__brand" :to="textMasterRoutePaths.home">
      <span class="tm-top-nav__mark">TM</span>
      <span class="tm-top-nav__brand-copy">
        <strong>Text Master</strong>
        <span>独立文本生产工厂</span>
      </span>
    </RouterLink>

    <div class="tm-top-nav__links">
      <RouterLink :to="textMasterRoutePaths.projectCenter">项目中心</RouterLink>
      <RouterLink :to="textMasterRoutePaths.templates">模板中心</RouterLink>
      <RouterLink :to="textMasterRoutePaths.exports">导出中心</RouterLink>
      <RouterLink :to="textMasterRoutePaths.settings">设置</RouterLink>
    </div>

    <div class="tm-top-nav__right">
      <span class="tm-top-nav__pill">Local Mode</span>
      <span class="tm-top-nav__pill hub" title="Brain Hub 是可选同步入口，不是运行前置条件">
        Brain Hub Ready
      </span>
      <button class="tm-top-nav__notify" type="button" aria-label="通知">
        <span class="tm-top-nav__notify-dot" aria-hidden="true"></span>
      </button>
      <RouterLink
        class="tm-top-nav__profile"
        :to="textMasterRoutePaths.profile"
        data-testid="user-profile-button"
      >
        <span class="tm-top-nav__avatar" aria-hidden="true">U</span>
        <span>用户资料</span>
      </RouterLink>
    </div>
  </nav>
</template>
