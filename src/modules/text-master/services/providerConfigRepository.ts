import {
  DEFAULT_PROVIDER_CONFIG,
  type ProviderConfig,
} from '../types/provider';

const STORAGE_KEY = 'text-master:provider-config';

function getLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadProviderConfig(): ProviderConfig {
  try {
    const storage = getLocalStorage();
    if (!storage) return { ...DEFAULT_PROVIDER_CONFIG };

    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROVIDER_CONFIG };

    const parsed = JSON.parse(raw) as Partial<ProviderConfig>;
    return {
      activeProvider: parsed.activeProvider ?? DEFAULT_PROVIDER_CONFIG.activeProvider,
      deepseek: {
        apiKey: parsed.deepseek?.apiKey ?? DEFAULT_PROVIDER_CONFIG.deepseek.apiKey,
        baseUrl: parsed.deepseek?.baseUrl ?? DEFAULT_PROVIDER_CONFIG.deepseek.baseUrl,
        model: parsed.deepseek?.model ?? DEFAULT_PROVIDER_CONFIG.deepseek.model,
      },
    };
  } catch {
    return { ...DEFAULT_PROVIDER_CONFIG };
  }
}

export function saveProviderConfig(config: ProviderConfig): void {
  try {
    const storage = getLocalStorage();
    if (storage) {
      storage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
  } catch {
    // 静默失败，不影响主流程
  }
}

export function resetProviderConfig(): ProviderConfig {
  const defaults = { ...DEFAULT_PROVIDER_CONFIG };
  saveProviderConfig(defaults);
  return defaults;
}
