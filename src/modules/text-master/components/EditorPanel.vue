<template>
  <section class="tm-editor-panel">
    <slot />
  </section>
</template>

<style scoped>
.tm-editor-panel {
  min-width: 0;
  max-height: 100%;
  overflow: auto;
  border: 1px solid rgba(148, 148, 160, 0.16);
  border-radius: 8px;
  background: #0b0b0d;
  color: #f4f4f5;
  padding: 16px;
  font-size: 15px;
  line-height: 1.75;
}
</style>
