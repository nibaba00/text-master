<template>
  <article class="tm-project-card">
    <slot />
  </article>
</template>

<style scoped>
.tm-project-card {
  min-width: 0;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent),
    var(--tm-card);
  background-color: var(--tm-card);
  color: var(--tm-text);
  box-shadow: var(--tm-shadow-card);
  padding: 18px;
}

.tm-project-card:hover {
  border-color: rgba(132, 136, 255, 0.34);
}
</style>
