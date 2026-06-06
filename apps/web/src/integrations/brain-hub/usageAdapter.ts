import type { BrainHubLaunchContext } from './launchContext';

export type BrainHubUsageEvent = {
  name: string;
  payload?: Record<string, unknown>;
  createdAt?: string;
};

export type BrainHubUsageResult = {
  connected: boolean;
  mocked: true;
  message: string;
  event: BrainHubUsageEvent;
};

export async function reportBrainHubUsage(
  event: BrainHubUsageEvent,
  context?: BrainHubLaunchContext | null,
): Promise<BrainHubUsageResult> {
  const normalizedEvent = {
    ...event,
    createdAt: event.createdAt ?? new Date().toISOString(),
  };

  if (!context) {
    return {
      connected: false,
      mocked: true,
      message: 'Brain Hub 未连接，usage 仅本地 Mock 记录',
      event: normalizedEvent,
    };
  }

  return {
    connected: true,
    mocked: true,
    message: 'Brain Hub Usage Adapter Mock 上报成功',
    event: normalizedEvent,
  };
}
