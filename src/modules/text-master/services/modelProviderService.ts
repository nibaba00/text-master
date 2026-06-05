import { createDeepSeekProvider } from './deepseekProviderService';
import { generateDocument, reviewDocument, rewriteText } from './generationService';
import { loadProviderConfig, saveProviderConfig } from './providerConfigRepository';
import type {
  ProviderConfig,
  ProviderId,
  TextModelProvider,
  TextModelProviderRequest,
  TextModelProviderResult,
} from '../types/provider';

function createMockProvider(): TextModelProvider {
  return {
    id: 'mock',
    label: 'MockProvider',
    available: true,
    run: async (request: TextModelProviderRequest): Promise<TextModelProviderResult> => {
      const source = [request.context, request.prompt].filter(Boolean).join('\n\n');

      if (request.type === 'review') {
        return {
          content: await reviewDocument(source),
          issues: [
            {
              level: 'warning',
              type: 'consistency',
              range: '全文',
              problem: '需要复核设定一致性。',
              suggestion: '比对资料库、项目设定和当前正文后再应用修复。',
              canAutoFix: true,
            },
          ],
        };
      }

      if (request.type === 'rewrite' || request.type === 'repair') {
        return {
          content: await rewriteText(source),
        };
      }

      return {
        content: await generateDocument(source),
      };
    },
  };
}

function createDisabledProvider(id: ProviderId, label: string): TextModelProvider {
  return {
    id,
    label,
    available: false,
    run: async () => {
      throw new Error(`${label} 尚未接入。请在设置页中切换为可用 Provider。`);
    },
  };
}

let cachedConfig: ProviderConfig | null = null;

export function getProviderConfig(): ProviderConfig {
  if (!cachedConfig) {
    cachedConfig = loadProviderConfig();
  }
  return cachedConfig;
}

export function updateProviderConfig(patch: Partial<ProviderConfig>): ProviderConfig {
  const current = getProviderConfig();
  const updated: ProviderConfig = {
    activeProvider: patch.activeProvider ?? current.activeProvider,
    deepseek: {
      apiKey: patch.deepseek?.apiKey ?? current.deepseek.apiKey,
      baseUrl: patch.deepseek?.baseUrl ?? current.deepseek.baseUrl,
      model: patch.deepseek?.model ?? current.deepseek.model,
    },
  };
  saveProviderConfig(updated);
  cachedConfig = updated;
  return updated;
}

export function getActiveProvider(): TextModelProvider {
  const config = getProviderConfig();

  if (config.activeProvider === 'deepseek') {
    const dsConfig = config.deepseek;
    if (dsConfig.apiKey) {
      return createDeepSeekProvider({
        apiKey: dsConfig.apiKey,
        baseUrl: dsConfig.baseUrl,
        model: dsConfig.model,
      });
    }
    // API Key 未配置时回退到 Mock
    return createMockProvider();
  }

  return createMockProvider();
}

export function listTextModelProviders(): TextModelProvider[] {
  const config = getProviderConfig();
  const mockProvider = createMockProvider();

  const deepseekAvailable = config.deepseek.apiKey.length > 0;
  const deepseekProvider: TextModelProvider = deepseekAvailable
    ? createDeepSeekProvider({
        apiKey: config.deepseek.apiKey,
        baseUrl: config.deepseek.baseUrl,
        model: config.deepseek.model,
      })
    : createDisabledProvider('deepseek', 'DeepSeekProvider');

  return [
    mockProvider,
    deepseekProvider,
    createDisabledProvider('openai', 'OpenAIProvider'),
    createDisabledProvider('local-model', 'LocalModelProvider'),
    createDisabledProvider('brain-hub', 'BrainHubAIProvider'),
  ];
}

export function getDefaultTextModelProvider(): TextModelProvider {
  return getActiveProvider();
}

export async function testProviderConnection(
  providerId: ProviderId,
): Promise<{ ok: boolean; message: string }> {
  if (providerId === 'mock') {
    return { ok: true, message: 'MockProvider 始终可用。' };
  }

  if (providerId === 'deepseek') {
    const config = getProviderConfig();
    if (!config.deepseek.apiKey) {
      return { ok: false, message: 'DeepSeek API Key 未配置。' };
    }

    try {
      const provider = createDeepSeekProvider({
        apiKey: config.deepseek.apiKey,
        baseUrl: config.deepseek.baseUrl,
        model: config.deepseek.model,
      });

      const result = await provider.run({
        projectId: 'test',
        type: 'content',
        prompt: '请回复"连接测试成功"。',
        context: '',
      });

      return {
        ok: true,
        message: `连接成功。模型：${config.deepseek.model}，响应长度：${result.content.length} 字符`,
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : '连接测试失败。',
      };
    }
  }

  return { ok: false, message: `${providerId} 暂不支持连接测试。` };
}
