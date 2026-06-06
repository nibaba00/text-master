<template>
  <div class="tm-app-shell">
    <slot />
  </div>
</template>

<style scoped>
.tm-app-shell {
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background: var(--tm-bg);
  color: var(--tm-text);
}
</style>
