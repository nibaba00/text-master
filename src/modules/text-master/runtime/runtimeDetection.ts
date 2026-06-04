import type { RuntimeMode } from './TextMasterRuntime';

declare global {
  interface Window {
    __BRAIN_HUB_CONTEXT__?: unknown;
  }
}

export function detectRuntimeMode(search?: string): RuntimeMode {
  if (
    typeof window !== 'undefined' &&
    Boolean(window.__BRAIN_HUB_CONTEXT__)
  ) {
    return 'brain-hub';
  }

  const query =
    search ??
    (typeof window === 'undefined' ? '' : window.location.search);
  const params = new URLSearchParams(query);

  return params.get('hub') === '1' || params.get('launchSource') === 'brain-hub'
    ? 'brain-hub'
    : 'local';
}
