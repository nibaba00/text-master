import { createLocalRuntime } from '../runtime/LocalRuntime';

export const mockRuntime = createLocalRuntime({
  appId: 'text-master',
  launchSource: 'local',
});
