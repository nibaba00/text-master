<template>
  <dialog class="tm-base-dialog">
    <slot />
  </dialog>
</template>

<style scoped>
.tm-base-dialog {
  width: min(720px, calc(100vw - 32px));
  max-height: min(720px, calc(100vh - 32px));
  overflow: auto;
  border: 1px solid var(--tm-border-strong);
  border-radius: var(--tm-radius-panel);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent),
    var(--tm-panel-solid);
  background-color: var(--tm-panel-solid);
  color: var(--tm-text);
  box-shadow: var(--tm-shadow-raised);
  padding: 22px;
}

.tm-base-dialog::backdrop {
  background: rgba(0, 0, 0, 0.68);
  backdrop-filter: blur(4px);
}

.tm-base-dialog:modal {
  margin: auto;
}

@media (max-width: 640px) {
  .tm-base-dialog {
    width: calc(100vw - 20px);
    max-height: calc(100vh - 20px);
    padding: 16px;
  }
}
</style>
