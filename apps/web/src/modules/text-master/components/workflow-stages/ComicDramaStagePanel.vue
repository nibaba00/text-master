<script setup lang="ts">
import GenericStagePanel from './GenericStagePanel.vue';
import type { WorkflowActionType, WorkflowSpec, WorkflowStage } from '../../workflows/types';

defineProps<{
  workflow: WorkflowSpec;
  stage: WorkflowStage;
}>();

defineEmits<{
  action: [name: WorkflowActionType];
}>();
</script>

<template>
  <GenericStagePanel variant="comic-drama" v-bind="$props" @action="$emit('action', $event)" />
</template>
