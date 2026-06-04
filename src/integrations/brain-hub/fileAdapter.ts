import type { BrainHubLaunchContext } from './launchContext';

export type BrainHubFileHandle = {
  id: string;
  name: string;
  size: number;
  createdAt: string;
};

export type BrainHubFileSaveInput = {
  fileName: string;
  content: string;
  context?: BrainHubLaunchContext | null;
};

export type BrainHubFileSaveResult = {
  connected: boolean;
  mocked: true;
  message: string;
  file: BrainHubFileHandle;
};

export async function saveBrainHubFile(
  input: BrainHubFileSaveInput,
): Promise<BrainHubFileSaveResult> {
  const file: BrainHubFileHandle = {
    id: `brain-hub-file-${Date.now()}`,
    name: input.fileName,
    size: input.content.length,
    createdAt: new Date().toISOString(),
  };

  if (!input.context) {
    return {
      connected: false,
      mocked: true,
      message: 'Brain Hub 未连接，文件仅完成本地 Mock 保存',
      file,
    };
  }

  return {
    connected: true,
    mocked: true,
    message: 'Brain Hub File Adapter Mock 保存成功',
    file,
  };
}

export async function requestBrainHubFileSave(
  fileName: string,
  content: string,
): Promise<BrainHubFileHandle> {
  return (await saveBrainHubFile({ fileName, content })).file;
}
