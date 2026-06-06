<script setup lang="ts">
import { computed } from 'vue';
import BusinessCopyStagePanel from '../workflow-stages/BusinessCopyStagePanel.vue';
import ComicDramaStagePanel from '../workflow-stages/ComicDramaStagePanel.vue';
import GenericStagePanel from '../workflow-stages/GenericStagePanel.vue';
import ShortVideoStagePanel from '../workflow-stages/ShortVideoStagePanel.vue';
import type { WorkflowActionType, WorkflowSpec, WorkflowStage } from '../../workflows/types';

const props = defineProps<{
  workflow: WorkflowSpec;
  currentStageId: string;
}>();

const emit = defineEmits<{
  action: [name: WorkflowActionType];
}>();

const currentStage = computed<WorkflowStage>(() => {
  return (
    props.workflow.stages.find((stage) => stage.id === props.currentStageId) ??
    props.workflow.stages[0]
  );
});

const panelComponent = computed(() => {
  switch (currentStage.value.component) {
    case 'short-video':
      return ShortVideoStagePanel;
    case 'comic-drama':
      return ComicDramaStagePanel;
    case 'business-copy':
      return BusinessCopyStagePanel;
    default:
      return GenericStagePanel;
  }
});
</script>

<template>
  <component
    :is="panelComponent"
    :workflow="workflow"
    :stage="currentStage"
    @action="emit('action', $event)"
  />
</template>
