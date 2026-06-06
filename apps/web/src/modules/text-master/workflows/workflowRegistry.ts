import type { WorkflowSpec } from './types';
import { shortVideoScriptWorkflow } from './shortVideoScriptWorkflow';
import { comicDramaOutlineWorkflow } from './comicDramaOutlineWorkflow';
import { businessCopyWorkflow } from './businessCopyWorkflow';
import { novelWorkflow } from './novelWorkflow';
import { xiaohongshuWorkflow } from './xiaohongshuWorkflow';
import { businessBpWorkflow } from './businessBpWorkflow';
import { investmentCopyWorkflow } from './investmentCopyWorkflow';
import { documentWorkflow } from './documentWorkflow';
import { customWorkflow } from './customWorkflow';

export const genericTextWorkflow: WorkflowSpec = {
  id: 'generic-text-workflow',
  name: '通用文本工作流',
  description: '适用于没有专门模板的通用文本生产、整理和交付流程。',
  workspaceType: 'generic-text',
  defaultStageId: 'overview',
  exportTargets: ['markdown', 'txt', 'json'],
  stages: [
    {
      id: 'overview',
      title: '项目总览',
      description: '先确认目标、状态和当前推进重点。',
      component: 'generic',
      requiredInputs: ['title', 'summary'],
      outputs: ['projectBrief'],
      aiActions: [{ id: 'summarize', label: '生成摘要', type: 'generate', primary: true }],
    },
    {
      id: 'settings',
      title: '创作设定',
      description: '补充风格、受众、策略和约束条件。',
      component: 'generic',
      requiredInputs: ['targetAudience', 'tone'],
      outputs: ['settingsBrief'],
      aiActions: [{ id: 'shape-settings', label: '整理设定', type: 'generate', primary: true }],
    },
    {
      id: 'materials',
      title: '资料库',
      description: '收拢素材、引用和可复用片段。',
      component: 'generic',
      requiredInputs: ['materials'],
      outputs: ['materialNotes'],
      aiActions: [{ id: 'extract-materials', label: '整理资料', type: 'outline', primary: true }],
    },
    {
      id: 'outline',
      title: '大纲工厂',
      description: '把核心设定拆成结构化大纲。',
      component: 'generic',
      requiredInputs: ['brief'],
      outputs: ['outline'],
      aiActions: [{ id: 'generate-outline', label: '生成大纲', type: 'outline', primary: true }],
    },
    {
      id: 'editor',
      title: '正文生产',
      description: '进入正文草稿和正文编辑。',
      component: 'generic',
      requiredInputs: ['outline'],
      outputs: ['draft'],
      aiActions: [{ id: 'generate-draft', label: '生成正文', type: 'generate', primary: true }],
    },
    {
      id: 'rewrite',
      title: '改写工厂',
      description: '进行重写、压缩或扩写。',
      component: 'generic',
      requiredInputs: ['draft'],
      outputs: ['rewriteCandidate'],
      aiActions: [{ id: 'rewrite-draft', label: '生成改写', type: 'rewrite', primary: true }],
    },
    {
      id: 'review',
      title: '审核工厂',
      description: '检查一致性、风险和平台约束。',
      component: 'generic',
      requiredInputs: ['draft'],
      outputs: ['reviewIssues'],
      aiActions: [{ id: 'review-draft', label: '执行审核', type: 'review', primary: true }],
    },
    {
      id: 'versions',
      title: '版本记录',
      description: '查看历史快照和恢复点。',
      component: 'generic',
      requiredInputs: ['versions'],
      outputs: ['versionLog'],
      aiActions: [{ id: 'snapshot', label: '保存快照', type: 'generate', primary: true }],
    },
    {
      id: 'export',
      title: '导出中心',
      description: '选择输出格式并完成交付。',
      component: 'generic',
      requiredInputs: ['document'],
      outputs: ['exportFile'],
      aiActions: [{ id: 'export-file', label: '执行导出', type: 'export', primary: true }],
    },
  ],
};

export const workflowRegistry: WorkflowSpec[] = [
  shortVideoScriptWorkflow,
  comicDramaOutlineWorkflow,
  businessCopyWorkflow,
  novelWorkflow,
  xiaohongshuWorkflow,
  businessBpWorkflow,
  investmentCopyWorkflow,
  documentWorkflow,
  customWorkflow,
];

const legacyWorkflowAliases: Record<string, string> = {
  'short-video-script-workflow': 'workflow-short-drama',
  'business-copy-workflow': 'workflow-business-copy',
  'novel-workflow': 'workflow-novel',
  'xiaohongshu-workflow': 'workflow-xiaohongshu',
  'business-bp-workflow': 'workflow-business-bp',
  'investment-copy-workflow': 'workflow-investment-copy',
  'document-workflow': 'workflow-document',
  'custom-workflow': 'workflow-custom',
  'generic-text-workflow': 'generic-text-workflow',
};

export function getWorkflowById(workflowId?: string): WorkflowSpec {
  const normalizedWorkflowId = workflowId ? legacyWorkflowAliases[workflowId] ?? workflowId : workflowId;

  return (
    workflowRegistry.find((workflow) => workflow.id === normalizedWorkflowId) ??
    genericTextWorkflow
  );
}

export function getDefaultStageId(workflowId?: string): string {
  return getWorkflowById(workflowId).defaultStageId;
}

export function getWorkflowStage(
  workflowId: string | undefined,
  stageId: string | undefined,
) {
  const workflow = getWorkflowById(workflowId);
  return (
    workflow.stages.find((stage) => stage.id === stageId) ?? workflow.stages[0]
  );
}
