<template>
  <article class="tm-project-card">
    <slot />
  </article>
</template>

<style scoped>
.tm-project-card {
  min-width: 0;
  border: 1px solid rgba(148, 148, 160, 0.16);
  border-radius: 8px;
  background: rgba(24, 24, 27, 0.94);
  color: #f4f4f5;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
  padding: 18px;
}
</style>
