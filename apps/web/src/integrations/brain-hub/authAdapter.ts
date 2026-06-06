import type { BrainHubLaunchContext } from './launchContext';

export type BrainHubUserProfile = {
  id: string;
  displayName: string;
  workspaceId: string;
};

export type BrainHubAuthResult = {
  connected: boolean;
  mocked: true;
  message: string;
  user: BrainHubUserProfile | null;
};

export async function getBrainHubAuthState(
  context?: BrainHubLaunchContext | null,
): Promise<BrainHubAuthResult> {
  if (!context) {
    return {
      connected: false,
      mocked: true,
      message: 'Brain Hub 未连接',
      user: null,
    };
  }

  return {
    connected: true,
    mocked: true,
    message: 'Brain Hub Auth Adapter Mock 可用',
    user: {
      id: context.userId,
      displayName: `Hub User ${context.userId}`,
      workspaceId: context.workspaceId,
    },
  };
}

export async function getBrainHubUserProfile(
  context?: BrainHubLaunchContext | null,
): Promise<BrainHubUserProfile | null> {
  return (await getBrainHubAuthState(context)).user;
}
