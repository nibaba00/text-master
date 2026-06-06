import { getProviderConfig, toPublicProviderConfig } from '../../config/providerConfig.mjs';
import { createDeepSeekProvider } from './deepseekProvider.mjs';
import { mockProvider } from './mockProvider.mjs';

export function getActiveProvider() {
  const config = getProviderConfig();
  const providers = getProviders(config);

  return providers.get(config.activeProviderId) ?? mockProvider;
}

export function listProviders() {
  return toPublicProviderConfig();
}

export async function testProvider(providerId) {
  const providers = getProviders(getProviderConfig());
  const provider = providers.get(providerId);

  if (!provider) {
    return {
      ok: false,
      providerId,
      message: 'Provider not found',
    };
  }

  try {
    const result = await provider.testConnection();

    return {
      ...result,
      message: 'Provider connection succeeded',
    };
  } catch (error) {
    return {
      ok: false,
      providerId,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function getProviders(config) {
  return new Map([
    [mockProvider.id, mockProvider],
    [config.deepseek.id, createDeepSeekProvider(config.deepseek)],
  ]);
}
