import { createLocalRuntime } from './LocalRuntime';
import type { ExportRequest, ExportResult } from '../types/export';
import type { TextProject } from '../types/project';
import type {
  GenerateTextInput,
  ProjectCreateInput,
  ProjectUpdatePatch,
  ReviewTextInput,
  RewriteTextInput,
  RuntimeContext,
  RuntimeUser,
  TextGenerationResult,
  TextMasterRuntime,
  TextReviewResult,
  UsageSummary,
} from './TextMasterRuntime';

type BrainHubAdapterContext = RuntimeContext & {
  appId: 'text-master';
  launchSource: 'brain-hub';
  source?: 'brain-hub';
  userId: string;
  workspaceId: string;
  permissions: string[];
  token?: string;
  hubVersion?: string;
};

export type BrainHubRuntimeAdapter = {
  getContext?: () =>
    | Promise<Partial<BrainHubAdapterContext> | null>
    | Partial<BrainHubAdapterContext>
    | null;
  reportReady?: () => Promise<void> | void;
};

type LaunchContextModule = {
  getBrainHubLaunchContext: () => Promise<BrainHubAdapterContext | null>;
};

type AuthAdapterModule = {
  getBrainHubUserProfile: (
    context?: BrainHubAdapterContext | null,
  ) => Promise<{ id: string; displayName: string } | null>;
};

type AiAdapterModule = {
  runBrainHubAi: (request: {
    prompt: string;
    context?: string;
    launchContext?: BrainHubAdapterContext | null;
  }) => Promise<unknown>;
};

type FileAdapterModule = {
  saveBrainHubFile: (input: {
    fileName: string;
    content: string;
    context?: BrainHubAdapterContext | null;
  }) => Promise<unknown>;
};

type ProjectSyncAdapterModule = {
  syncProjectToBrainHub: (
    project: TextProject,
    context?: BrainHubAdapterContext | null,
  ) => Promise<unknown>;
};

type UsageAdapterModule = {
  reportBrainHubUsage: (
    event: {
      name: string;
      payload?: Record<string, unknown>;
    },
    context?: BrainHubAdapterContext | null,
  ) => Promise<unknown> | unknown;
};

export async function createBrainHubRuntime(
  adapter: BrainHubRuntimeAdapter = {},
): Promise<TextMasterRuntime> {
  const adapterContext = await resolveBrainHubContext(adapter);

  if (!adapterContext) {
    return createLocalRuntime();
  }

  const localContext: Partial<RuntimeContext> = {
    appId: 'text-master',
    launchSource: 'brain-hub',
    userId: adapterContext.userId,
    workspaceId: adapterContext.workspaceId,
  };

  if (adapterContext.projectId) {
    localContext.projectId = adapterContext.projectId;
  }

  const localRuntime = createLocalRuntime(localContext);

  await runOptional(adapter.reportReady);
  await reportHubUsage('text-master.ready', {
    workspaceId: adapterContext.workspaceId,
  }, adapterContext);

  const brainHubRuntime: TextMasterRuntime = {
    ...localRuntime,
    mode: 'brain-hub',
    context: {
      ...localRuntime.context,
      ...adapterContext,
      appId: 'text-master',
      launchSource: 'brain-hub',
    },
    getRuntimeMode: () => 'brain-hub',
    getCurrentUser: async (): Promise<RuntimeUser> => {
      const profile = await getHubUserProfile(adapterContext);

      return {
        id: profile?.id ?? adapterContext.userId,
        displayName: profile?.displayName ?? 'Brain Hub User',
        source: 'brain-hub',
      };
    },
    getCurrentWorkspace: async () => ({
      id: adapterContext.workspaceId,
      name: `Brain Hub Workspace ${adapterContext.workspaceId}`,
      source: 'brain-hub',
    }),
    createProject: async (
      input: ProjectCreateInput,
    ): Promise<TextProject> => {
      const project = await localRuntime.createProject(input);
      await syncHubProject(project, adapterContext);
      await reportHubUsage('text-master.project.create', {
        projectId: project.id,
      }, adapterContext);
      return project;
    },
    updateProject: async (
      projectId: string,
      patch: ProjectUpdatePatch,
    ): Promise<TextProject> => {
      const project = await localRuntime.updateProject(projectId, patch);
      await syncHubProject(project, adapterContext);
      await reportHubUsage('text-master.project.update', {
        projectId,
      }, adapterContext);
      return project;
    },
    generateText: async (
      input: GenerateTextInput,
    ): Promise<TextGenerationResult> => {
      await runHubAiStub(input.prompt, input.context, adapterContext);
      const result = await localRuntime.generateText(input);
      await reportHubUsage('text-master.ai.generate', {
        projectId: input.projectId,
        documentId: input.documentId,
      }, adapterContext);
      return result;
    },
    reviewText: async (
      input: ReviewTextInput,
    ): Promise<TextReviewResult> => {
      await runHubAiStub('review', input.text, adapterContext);
      const result = await localRuntime.reviewText(input);
      await reportHubUsage('text-master.ai.review', {
        projectId: input.projectId,
        documentId: input.documentId,
      }, adapterContext);
      return result;
    },
    rewriteText: async (
      input: RewriteTextInput,
    ): Promise<TextGenerationResult> => {
      await runHubAiStub(input.instruction ?? 'rewrite', input.text, adapterContext);
      const result = await localRuntime.rewriteText(input);
      await reportHubUsage('text-master.ai.rewrite', {
        projectId: input.projectId,
        documentId: input.documentId,
      }, adapterContext);
      return result;
    },
    exportProject: async (
      input: ExportRequest,
    ): Promise<ExportResult> => {
      const result = await localRuntime.exportProject(input);
      await saveHubFileStub(input.fileName, input.content, adapterContext);
      await reportHubUsage('text-master.export', {
        projectId: input.projectId,
        format: input.format,
      }, adapterContext);
      return result;
    },
    getUsageSummary: async (): Promise<UsageSummary> => {
      const summary = await localRuntime.getUsageSummary();

      return {
        ...summary,
        runtimeMode: 'brain-hub',
        hubConnected: true,
      };
    },
  };

  return brainHubRuntime;
}

export async function createSafeBrainHubRuntime(
  adapter: BrainHubRuntimeAdapter = {},
): Promise<TextMasterRuntime> {
  try {
    return await createBrainHubRuntime(adapter);
  } catch {
    return createLocalRuntime();
  }
}

async function resolveBrainHubContext(
  adapter: BrainHubRuntimeAdapter,
): Promise<BrainHubAdapterContext | null> {
  const adapterContext = adapter.getContext
    ? await adapter.getContext()
    : await readOptionalLaunchContext();

  if (!hasValidBrainHubContext(adapterContext)) {
    return null;
  }

  return {
    ...adapterContext,
    appId: 'text-master',
    launchSource: 'brain-hub',
  };
}

async function readOptionalLaunchContext(): Promise<BrainHubAdapterContext | null> {
  const module = await loadBrainHubAdapter<LaunchContextModule>('launchContext');

  if (!module) {
    return null;
  }

  try {
    return await module.getBrainHubLaunchContext();
  } catch {
    return null;
  }
}

function hasValidBrainHubContext(
  context: Partial<BrainHubAdapterContext> | null | undefined,
): context is BrainHubAdapterContext {
  return Boolean(
    context &&
      context.appId === 'text-master' &&
      context.launchSource === 'brain-hub' &&
      isNonEmptyString(context.userId) &&
      isNonEmptyString(context.workspaceId) &&
      Array.isArray(context.permissions) &&
      context.permissions.length > 0 &&
      context.permissions.every(isNonEmptyString),
  );
}

async function getHubUserProfile(
  context: BrainHubAdapterContext,
): Promise<{ id: string; displayName: string } | null> {
  const module = await loadBrainHubAdapter<AuthAdapterModule>('authAdapter');

  if (!module) {
    return null;
  }

  try {
    return await module.getBrainHubUserProfile(context);
  } catch {
    return null;
  }
}

async function runHubAiStub(
  prompt: string,
  context: string | undefined,
  launchContext: BrainHubAdapterContext,
): Promise<void> {
  const module = await loadBrainHubAdapter<AiAdapterModule>('aiAdapter');

  if (!module) {
    return;
  }

  await runOptional(() =>
    module.runBrainHubAi({
      prompt,
      context,
      launchContext,
    }),
  );
}

async function saveHubFileStub(
  fileName: string,
  content: string,
  context: BrainHubAdapterContext,
): Promise<void> {
  const module = await loadBrainHubAdapter<FileAdapterModule>('fileAdapter');

  if (!module) {
    return;
  }

  await runOptional(() =>
    module.saveBrainHubFile({
      fileName,
      content,
      context,
    }),
  );
}

async function syncHubProject(
  project: TextProject,
  context: BrainHubAdapterContext,
): Promise<void> {
  const module = await loadBrainHubAdapter<ProjectSyncAdapterModule>(
    'projectSyncAdapter',
  );

  if (!module) {
    return;
  }

  await runOptional(() => module.syncProjectToBrainHub(project, context));
}

async function reportHubUsage(
  name: string,
  payload: Record<string, unknown>,
  context: BrainHubAdapterContext,
): Promise<void> {
  const module = await loadBrainHubAdapter<UsageAdapterModule>('usageAdapter');

  if (!module) {
    return;
  }

  await runOptional(() => module.reportBrainHubUsage({ name, payload }, context));
}

async function loadBrainHubAdapter<T extends object>(
  fileName: string,
): Promise<T | null> {
  try {
    const modulePath = `../../../integrations/brain-hub/${fileName}`;
    return (await import(/* @vite-ignore */ modulePath)) as T;
  } catch {
    return null;
  }
}

async function runOptional(action?: () => Promise<unknown> | unknown): Promise<void> {
  if (!action) {
    return;
  }

  try {
    await action();
  } catch {
    // Brain Hub adapter failures are non-fatal by design.
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
