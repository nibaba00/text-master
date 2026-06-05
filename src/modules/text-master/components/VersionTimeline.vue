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
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent),
    var(--tm-card-muted);
  background-color: var(--tm-card-muted);
  color: var(--tm-text);
  box-shadow: var(--tm-shadow-card);
  padding: 16px;
}
</style>
