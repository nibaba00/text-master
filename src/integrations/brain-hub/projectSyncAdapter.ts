import type { TextProject } from '../../modules/text-master/types/project';
import type { BrainHubLaunchContext } from './launchContext';

export type BrainHubProjectSyncResult = {
  connected: boolean;
  mocked: true;
  message: string;
  project: TextProject | null;
};

export async function syncProjectToBrainHub(
  project: TextProject,
  context?: BrainHubLaunchContext | null,
): Promise<BrainHubProjectSyncResult> {
  if (!context) {
    return {
      connected: false,
      mocked: true,
      message: 'Brain Hub 未连接，项目同步仅记录为 Mock',
      project,
    };
  }

  return {
    connected: true,
    mocked: true,
    message: 'Brain Hub Project Sync Adapter Mock 同步成功',
    project,
  };
}

export async function pushProjectToBrainHub(
  project: TextProject,
): Promise<TextProject> {
  return (await syncProjectToBrainHub(project)).project ?? project;
}

export async function pullProjectFromBrainHub(
  projectId: string,
  context?: BrainHubLaunchContext | null,
): Promise<TextProject | null> {
  void projectId;
  void context;
  return null;
}
