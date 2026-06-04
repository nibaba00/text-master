import {
  createProject,
  listProjects,
  updateProject,
} from '../services/projectService';
import { listDocuments, saveDocument } from '../services/documentService';
import { listMaterials } from '../services/materialService';
import { createVersion, listVersions } from '../services/versionService';
import {
  generateDocument,
  reviewDocument,
  rewriteText,
} from '../services/generationService';
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
      return createProject({
        title: input.title,
        type: input.type,
        summary: input.summary,
        settings: input.settings,
      });
    },
    updateProject: async (
      projectId: string,
      patch: ProjectUpdatePatch,
    ) => updateProject(projectId, patch),
    listDocuments,
    listMaterials,
    listVersions,
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
      const text = await generateDocument(
        [input.context, input.prompt].filter(Boolean).join('\n\n'),
      );
      await createRuntimeVersion({
        projectId: input.projectId,
        documentId: input.documentId,
        operation: 'generate',
        inputSnapshot: input.prompt,
        outputSnapshot: text,
        createdBy: runtimeContext.userId,
      });

      return {
        text,
        provider: 'mock',
        createdAt: new Date().toISOString(),
      };
    },
    reviewText: async (
      input: ReviewTextInput,
    ): Promise<TextReviewResult> => {
      usage.reviewCount += 1;
      const summary = await reviewDocument(input.text);
      await createRuntimeVersion({
        projectId: input.projectId,
        documentId: input.documentId,
        operation: 'review',
        inputSnapshot: input.text,
        outputSnapshot: summary,
        createdBy: runtimeContext.userId,
      });

      return {
        summary,
        issues: [],
        provider: 'mock',
        createdAt: new Date().toISOString(),
      };
    },
    rewriteText: async (
      input: RewriteTextInput,
    ): Promise<TextGenerationResult> => {
      usage.rewriteCount += 1;
      const text = await rewriteText(
        [input.instruction, input.text].filter(Boolean).join('\n\n'),
      );
      await createRuntimeVersion({
        projectId: input.projectId,
        documentId: input.documentId,
        operation: 'rewrite',
        inputSnapshot: input.text,
        outputSnapshot: text,
        createdBy: runtimeContext.userId,
      });

      return {
        text,
        provider: 'mock',
        createdAt: new Date().toISOString(),
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
            content: input.content,
          })
        ).id;

      await createRuntimeVersion({
        projectId: input.projectId,
        documentId: exportDocumentId,
        operation: 'export',
        inputSnapshot: input.content,
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
