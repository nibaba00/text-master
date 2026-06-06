import type { BrainHubLaunchContext } from './launchContext';

export type BrainHubAiRequest = {
  prompt: string;
  context?: string;
  launchContext?: BrainHubLaunchContext | null;
};

export type BrainHubAiResponse = {
  text: string;
  connected: boolean;
  mocked: true;
  message: string;
  provider: 'brain-hub-mock';
};

export async function runBrainHubAi(
  request: BrainHubAiRequest,
): Promise<BrainHubAiResponse> {
  const source = [request.context, request.prompt].filter(Boolean).join('\n\n');
  const connected = Boolean(request.launchContext);

  return {
    text: [
      connected
        ? 'Brain Hub AI Adapter Mock response'
        : 'Brain Hub 未连接，使用本地 Mock AI 结果',
      source,
    ]
      .filter(Boolean)
      .join('\n\n'),
    connected,
    mocked: true,
    message: connected
      ? 'Brain Hub AI Adapter Mock 调用成功'
      : 'Brain Hub 未连接',
    provider: 'brain-hub-mock',
  };
}
