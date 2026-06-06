import { resolve } from 'node:path';
import { readJsonFile, writeJsonFile } from '../utils/jsonStore.mjs';

const defaultDeepSeekBaseUrl = 'https://api.deepseek.com';
const defaultDeepSeekModel = 'deepseek-chat';
const defaultConfigPath = resolve(process.cwd(), 'data/provider-config.json');

let runtimeProviderConfig = loadProviderConfig();

export function getProviderConfig() {
  return runtimeProviderConfig;
}

export function updateProviderConfig(patch = {}) {
  const current = runtimeProviderConfig;
  const nextDeepSeek = {
    ...current.deepseek,
    ...(patch.deepseek && typeof patch.deepseek === 'object'
      ? {
          baseUrl:
            typeof patch.deepseek.baseUrl === 'string' && patch.deepseek.baseUrl.trim()
              ? normalizeBaseUrl(patch.deepseek.baseUrl.trim())
              : current.deepseek.baseUrl,
          model:
            typeof patch.deepseek.model === 'string' && patch.deepseek.model.trim()
              ? patch.deepseek.model.trim()
              : current.deepseek.model,
          apiKey:
            typeof patch.deepseek.apiKey === 'string'
              ? patch.deepseek.apiKey.trim()
              : current.deepseek.apiKey,
        }
      : {}),
  };
  const requestedProviderId =
    patch.activeProviderId === 'mock-provider' || patch.activeProviderId === 'deepseek'
      ? patch.activeProviderId
      : current.activeProviderId;

  runtimeProviderConfig = {
    activeProviderId: requestedProviderId,
    deepseek: nextDeepSeek,
  };
  saveProviderConfig(runtimeProviderConfig);

  return runtimeProviderConfig;
}

export function resetProviderConfig() {
  runtimeProviderConfig = createProviderConfigFromEnv();
  saveProviderConfig(runtimeProviderConfig);
  return runtimeProviderConfig;
}

export function createProviderConfigFromEnv() {
  const deepseek = {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: normalizeBaseUrl(process.env.DEEPSEEK_BASE_URL ?? defaultDeepSeekBaseUrl),
    model: process.env.DEEPSEEK_MODEL ?? defaultDeepSeekModel,
    apiKey: process.env.DEEPSEEK_API_KEY ?? '',
  };

  const requestedProviderId = process.env.TEXT_MASTER_PROVIDER ?? '';
  const activeProviderId = requestedProviderId || (deepseek.apiKey ? deepseek.id : 'mock-provider');

  return {
    activeProviderId,
    deepseek,
  };
}

export function loadProviderConfig() {
  const envConfig = createProviderConfigFromEnv();
  const storedConfig = readStoredProviderConfig();

  if (!storedConfig) {
    return envConfig;
  }

  return normalizeProviderConfig({
    ...envConfig,
    ...storedConfig,
    deepseek: {
      ...envConfig.deepseek,
      ...(storedConfig.deepseek ?? {}),
    },
  });
}

export function toPublicProviderConfig(config = getProviderConfig()) {
  return {
    activeProviderId: config.activeProviderId,
    providers: [
      {
        id: 'mock-provider',
        name: 'Text Master Mock Provider',
        available: true,
        configured: true,
        model: 'mock-text-master',
      },
      {
        id: config.deepseek.id,
        name: config.deepseek.name,
        available: Boolean(config.deepseek.apiKey),
        configured: Boolean(config.deepseek.apiKey),
        baseUrl: config.deepseek.baseUrl,
        model: config.deepseek.model,
      },
    ],
  };
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function readStoredProviderConfig() {
  const configPath = getProviderConfigPath();
  return readJsonFile(configPath, null);
}

function saveProviderConfig(config) {
  const configPath = getProviderConfigPath();
  writeJsonFile(configPath, toPersistedProviderConfig(config));
}

function toPersistedProviderConfig(config) {
  return {
    activeProviderId: config.activeProviderId,
    deepseek: {
      baseUrl: config.deepseek.baseUrl,
      model: config.deepseek.model,
      apiKey: config.deepseek.apiKey,
    },
  };
}

function normalizeProviderConfig(config) {
  const deepseek = {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl:
      typeof config.deepseek?.baseUrl === 'string' && config.deepseek.baseUrl.trim()
        ? normalizeBaseUrl(config.deepseek.baseUrl.trim())
        : defaultDeepSeekBaseUrl,
    model:
      typeof config.deepseek?.model === 'string' && config.deepseek.model.trim()
        ? config.deepseek.model.trim()
        : defaultDeepSeekModel,
    apiKey: typeof config.deepseek?.apiKey === 'string' ? config.deepseek.apiKey.trim() : '',
  };
  const activeProviderId =
    config.activeProviderId === 'deepseek' || config.activeProviderId === 'mock-provider'
      ? config.activeProviderId
      : deepseek.apiKey
        ? 'deepseek'
        : 'mock-provider';

  return {
    activeProviderId,
    deepseek,
  };
}

function getProviderConfigPath() {
  return resolve(process.env.TEXT_MASTER_PROVIDER_CONFIG_PATH ?? defaultConfigPath);
}
