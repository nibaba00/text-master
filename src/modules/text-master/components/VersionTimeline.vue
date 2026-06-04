<template>
  <section class="tm-version-timeline">
    <slot />
  </section>
</template>

<style scoped>
.tm-version-timeline {
  display: grid;
  gap: 12px;
  min-width: 0;
  max-height: 100%;
  overflow: auto;
  border: 1px solid rgba(148, 148, 160, 0.16);
  border-radius: 8px;
  background: #111113;
  color: #f4f4f5;
  padding: 16px;
}
</style>
