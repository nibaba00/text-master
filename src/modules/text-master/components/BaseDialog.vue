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
  border: 1px solid rgba(148, 148, 160, 0.22);
  border-radius: 8px;
  background: #18181b;
  color: #f4f4f5;
  box-shadow: 0 24px 72px rgba(0, 0, 0, 0.48);
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
