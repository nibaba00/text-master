import { apiGet, apiPatch, apiPost } from './client';

export type BackendProviderId = 'mock-provider' | 'deepseek';

export type BackendProviderSummary = {
  id: BackendProviderId;
  name: string;
  available: boolean;
  configured: boolean;
  baseUrl?: string;
  model: string;
};

export type BackendProviderConfig = {
  activeProviderId: BackendProviderId;
  providers: BackendProviderSummary[];
};

export type ProviderConfigPatch = {
  activeProviderId?: BackendProviderId;
  deepseek?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  };
};

export type ProviderTestResult = {
  ok: boolean;
  providerId: string;
  model?: string;
  responseLength?: number;
  message: string;
};

export async function getBackendProviderConfig(): Promise<BackendProviderConfig> {
  return apiGet<BackendProviderConfig>('/providers');
}

export async function updateBackendProviderConfig(
  patch: ProviderConfigPatch,
): Promise<BackendProviderConfig> {
  return apiPatch<BackendProviderConfig>('/providers/config', patch);
}

export async function testBackendProvider(providerId: BackendProviderId): Promise<ProviderTestResult> {
  return apiPost<ProviderTestResult>(`/providers/${encodeURIComponent(providerId)}/test`);
}
