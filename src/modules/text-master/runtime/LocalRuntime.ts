import {
  createProject,
  listProjects,
  updateProject,
} from '../services/projectService';
import { listDocuments, saveDocument } from '../services/documentService';
import { listMaterials } from '../services/materialService';
import { createVersion, listVersions } from '../services/versionService';
import { createCandidate, listCandidates } from '../services/candidateService';
import {
  generateDocument,
  reviewDocument,
  rewriteText,
} from '../services/generationService';
import { createJob, listJobs, updateJob } from '../services/jobService';
import { createReviewIssue, listReviewIssues } from '../services/reviewService';
import { exportProject } from '../services/exportService';
import type {
  DocumentSaveInput,
  GenerateTextInput,
  ProjectCreateInput,
  ProjectUpdatePatch,
  ReviewTextInput,
  RewriteTextInput,
  RuntimeContext,
  TextMasterRuntime,
  TextReviewResult,
  TextGenerationResult,
  UsageSummary,
  VersionCreateInput,
} from './TextMasterRuntime';

export function createLocalRuntime(
  context: Partial<RuntimeContext> = {},
): TextMasterRuntime {
  const usage = {
    generatedTextCount: 0,
    reviewCount: 0,
    rewriteCount: 0,
    exportCount: 0,
  };

  const runtimeContext: RuntimeContext = {
    ...context,
    appId: 'text-master',
    launchSource: 'local',
  };

  return {
    mode: 'local',
    context: runtimeContext,
    getRuntimeMode: () => 'local',
    getCurrentUser: async () => ({
      id: runtimeContext.userId ?? 'local-user',
      displayName: 'Local User',
      source: 'local',
    }),
    getCurrentWorkspace: async () => ({
      id: runtimeContext.workspaceId ?? 'local-workspace',
      name: 'Local Workspace',
      source: 'local',
    }),
    listProjects,
    createProject: async (input: ProjectCreateInput) => {
      const project = await createProject({
        title: input.title,
        type: input.type,
        summary: input.summary,
        settings: input.settings,
      });
      const briefDocument = await saveDocument({
        projectId: project.id,
        title: '项目简报',
        type: 'brief',
        content: project.summary || `${project.title} 的项目简报。`,
      });
      await saveDocument({
        projectId: project.id,
        title: '项目大纲',
        type: 'outline',
        content: `# ${project.title}\n\n等待生成大纲候选。`,
      });
      await saveDocument({
        projectId: project.id,
        title: '正文草稿',
        type: project.type === 'business_copy' ? 'copy' : project.type === 'short_drama' ? 'episode' : 'chapter',
        content: '',
      });
      await createRuntimeVersion({
        projectId: project.id,
        documentId: briefDocument.id,
        operation: 'manual_edit',
        inputSnapshot: '',
        outputSnapshot: briefDocument.content,
        createdBy: runtimeContext.userId,
      });
      return project;
    },
    updateProject: async (
      projectId: string,
      patch: ProjectUpdatePatch,
    ) => updateProject(projectId, patch),
    listDocuments,
    listMaterials,
    listVersions,
    listJobs,
    listCandidates,
    listReviewIssues,
    saveDocument: async (input: DocumentSaveInput) => {
      const document = await saveDocument({
        id: input.id,
        projectId: input.projectId,
        title: input.title,
        type: input.type,
        content: input.content,
      });

      await createRuntimeVersion({
        projectId: document.projectId,
        documentId: document.id,
        operation: 'manual_edit',
        inputSnapshot: '',
        outputSnapshot: document.content,
        createdBy: runtimeContext.userId,
      });

      return document;
    },
    generateText: async (
      input: GenerateTextInput,
    ): Promise<TextGenerationResult> => {
      usage.generatedTextCount += 1;
      const job = await createJob({
        projectId: input.projectId,
        documentId: input.documentId,
        type: input.prompt.includes('大纲') || input.prompt.includes('outline') ? 'outline' : 'content',
        inputJson: {
          prompt: input.prompt,
          context: input.context ?? '',
        },
      });
      await updateJob(job.id, { status: 'running' });
      const text = await generateDocument(
        [input.context, input.prompt].filter(Boolean).join('\n\n'),
      );
      const candidate = await createCandidate({
        projectId: input.projectId,
        documentId: input.documentId,
        jobId: job.id,
        type: job.type,
        title: job.type === 'outline' ? '大纲候选结果' : '正文候选结果',
        content: text,
        provider: 'mock',
      });
      const completedJob = await updateJob(job.id, {
        status: 'succeeded',
        outputJson: {
          candidateId: candidate.id,
          content: text,
        },
      });

      return {
        text,
        provider: 'mock',
        createdAt: new Date().toISOString(),
        job: completedJob,
        candidate,
      };
    },
    reviewText: async (
      input: ReviewTextInput,
    ): Promise<TextReviewResult> => {
      usage.reviewCount += 1;
      const job = await createJob({
        projectId: input.projectId,
        documentId: input.documentId,
        type: 'review',
        inputJson: {
          text: input.text,
        },
      });
      await updateJob(job.id, { status: 'running' });
      const summary = await reviewDocument(input.text);
      const candidate = await createCandidate({
        projectId: input.projectId,
        documentId: input.documentId,
        jobId: job.id,
        type: 'review',
        title: '审核报告候选',
        content: summary,
        provider: 'mock',
      });
      const reviewIssues = await Promise.all([
        createReviewIssue({
          projectId: input.projectId,
          documentId: input.documentId,
          candidateId: candidate.id,
          level: 'warning',
          type: 'consistency',
          range: '全文',
          problem: '存在可能需要人工复核的前后设定一致性问题。',
          suggestion: '检查角色动机、场景时间线和核心冲突是否保持一致。',
          canAutoFix: true,
        }),
        createReviewIssue({
          projectId: input.projectId,
          documentId: input.documentId,
          candidateId: candidate.id,
          level: 'info',
          type: 'style',
          range: '段落',
          problem: '部分段落节奏偏平。',
          suggestion: '增加动作、对话或更明确的转折句。',
          canAutoFix: false,
        }),
      ]);
      const completedJob = await updateJob(job.id, {
        status: 'succeeded',
        outputJson: {
          candidateId: candidate.id,
          issueIds: reviewIssues.map((issue) => issue.id),
        },
      });

      return {
        summary,
        issues: reviewIssues.map((issue) => issue.problem),
        provider: 'mock',
        createdAt: new Date().toISOString(),
        job: completedJob,
        candidate,
        reviewIssues,
      };
    },
    rewriteText: async (
      input: RewriteTextInput,
    ): Promise<TextGenerationResult> => {
      usage.rewriteCount += 1;
      const job = await createJob({
        projectId: input.projectId,
        documentId: input.documentId,
        type: 'rewrite',
        inputJson: {
          text: input.text,
          instruction: input.instruction ?? '',
        },
      });
      await updateJob(job.id, { status: 'running' });
      const text = await rewriteText(
        [input.instruction, input.text].filter(Boolean).join('\n\n'),
      );
      const candidate = await createCandidate({
        projectId: input.projectId,
        documentId: input.documentId,
        jobId: job.id,
        type: 'rewrite',
        title: '改写候选结果',
        content: text,
        provider: 'mock',
      });
      const completedJob = await updateJob(job.id, {
        status: 'succeeded',
        outputJson: {
          candidateId: candidate.id,
          content: text,
        },
      });

      return {
        text,
        provider: 'mock',
        createdAt: new Date().toISOString(),
        job: completedJob,
        candidate,
      };
    },
    createVersion: (input: VersionCreateInput) => createRuntimeVersion(input),
    exportProject: async (input) => {
      usage.exportCount += 1;
      const result = await exportProject(input);
      const exportDocumentId =
        input.documentId ??
        (
          await saveDocument({
            projectId: input.projectId,
            title: input.fileName,
            type: 'export',
            content: result.content,
          })
        ).id;

      await createRuntimeVersion({
        projectId: input.projectId,
        documentId: exportDocumentId,
        operation: 'export',
        inputSnapshot: input.content ?? '',
        outputSnapshot: result.content,
        createdBy: runtimeContext.userId,
      });

      return result;
    },
    getUsageSummary: async (): Promise<UsageSummary> => {
      const projects = await listProjects();
      const documents = await listDocuments();

      return {
        runtimeMode: 'local',
        projectCount: projects.length,
        documentCount: documents.length,
        generatedTextCount: usage.generatedTextCount,
        reviewCount: usage.reviewCount,
        rewriteCount: usage.rewriteCount,
        exportCount: usage.exportCount,
        hubConnected: false,
      };
    },
  };
}

function createRuntimeVersion(input: VersionCreateInput) {
  return createVersion({
    ...input,
    model: input.model ?? 'mock-local',
    createdBy: input.createdBy ?? 'local-user',
  });
}
