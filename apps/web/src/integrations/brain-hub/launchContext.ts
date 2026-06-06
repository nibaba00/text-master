import type { RuntimeContext } from '../../modules/text-master/types/runtime';

export type BrainHubPermission =
  | 'profile:read'
  | 'workspace:read'
  | 'files:write'
  | 'ai:generate'
  | 'projects:sync'
  | 'usage:write'
  | string;

export type BrainHubLaunchContext = RuntimeContext & {
  appId: 'text-master';
  launchSource: 'brain-hub';
  source: 'brain-hub';
  userId: string;
  workspaceId: string;
  permissions: BrainHubPermission[];
  token?: string;
  hubVersion?: string;
};

declare global {
  interface Window {
    __BRAIN_HUB_CONTEXT__?: unknown;
  }
}

export async function getBrainHubLaunchContext(
  search?: string,
): Promise<BrainHubLaunchContext | null> {
  try {
    const windowContext =
      typeof window === 'undefined' ? null : window.__BRAIN_HUB_CONTEXT__;

    if (isRecord(windowContext)) {
      const normalized = normalizeBrainHubContext(windowContext);
      if (normalized) {
        return normalized;
      }
    }

    return normalizeBrainHubContext(readContextFromUrl(search));
  } catch {
    return null;
  }
}

export function hasValidBrainHubLaunchContext(
  context: Partial<BrainHubLaunchContext> | null | undefined,
): context is BrainHubLaunchContext {
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

function readContextFromUrl(search?: string): Record<string, unknown> | null {
  const query =
    search ?? (typeof window === 'undefined' ? '' : window.location.search);
  const params = new URLSearchParams(query);
  const isHubLaunch =
    params.get('hub') === '1' || params.get('launchSource') === 'brain-hub';

  if (!isHubLaunch) {
    return null;
  }

  return {
    appId: params.get('appId') ?? 'text-master',
    launchSource: 'brain-hub',
    source: 'brain-hub',
    userId: params.get('userId'),
    workspaceId: params.get('workspaceId'),
    projectId: params.get('projectId'),
    permissions: readPermissions(params),
    token: params.get('token'),
    hubVersion: params.get('hubVersion'),
  };
}

function normalizeBrainHubContext(
  context: Record<string, unknown> | null,
): BrainHubLaunchContext | null {
  if (!context) {
    return null;
  }

  const appId = toOptionalString(context.appId) ?? 'text-master';
  const launchSource =
    toOptionalString(context.launchSource) ??
    toOptionalString(context.source) ??
    '';
  const normalized: Partial<BrainHubLaunchContext> = {
    source: 'brain-hub',
    permissions: normalizePermissions(context.permissions),
  };
  const userId = toOptionalString(context.userId);
  const workspaceId = toOptionalString(context.workspaceId);
  const projectId = toOptionalString(context.projectId);
  const token = toOptionalString(context.token);
  const hubVersion = toOptionalString(context.hubVersion);

  if (appId === 'text-master') {
    normalized.appId = 'text-master';
  }

  if (launchSource === 'brain-hub') {
    normalized.launchSource = 'brain-hub';
  }

  if (userId) {
    normalized.userId = userId;
  }

  if (workspaceId) {
    normalized.workspaceId = workspaceId;
  }

  if (projectId) {
    normalized.projectId = projectId;
  }

  if (token) {
    normalized.token = token;
  }

  if (hubVersion) {
    normalized.hubVersion = hubVersion;
  }

  return hasValidBrainHubLaunchContext(normalized) ? normalized : null;
}

function readPermissions(params: URLSearchParams): string[] {
  const repeated = params.getAll('permission');
  const packed = params.get('permissions')?.split(',') ?? [];

  return [...repeated, ...packed].map((item) => item.trim()).filter(Boolean);
}

function normalizePermissions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(isNonEmptyString);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function toOptionalString(value: unknown): string | undefined {
  return isNonEmptyString(value) ? value : undefined;
}
