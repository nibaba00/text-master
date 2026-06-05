import type {
  TextModelProvider,
  TextModelProviderRequest,
  TextModelProviderResult,
} from '../types/provider';
import { generateDocument, reviewDocument, rewriteText } from './generationService';

const mockProvider: TextModelProvider = {
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

const reservedProviders: TextModelProvider[] = [
  {
    id: 'deepseek',
    label: 'DeepSeekProvider',
    available: false,
    run: async () => {
      throw new Error('DeepSeekProvider is reserved for later integration.');
    },
  },
  {
    id: 'openai',
    label: 'OpenAIProvider',
    available: false,
    run: async () => {
      throw new Error('OpenAIProvider is reserved for later integration.');
    },
  },
  {
    id: 'local-model',
    label: 'LocalModelProvider',
    available: false,
    run: async () => {
      throw new Error('LocalModelProvider is reserved for later integration.');
    },
  },
  {
    id: 'brain-hub',
    label: 'BrainHubAIProvider',
    available: false,
    run: async () => {
      throw new Error('BrainHubAIProvider is optional and requires launch context.');
    },
  },
];

export function listTextModelProviders(): TextModelProvider[] {
  return [mockProvider, ...reservedProviders];
}

export function getDefaultTextModelProvider(): TextModelProvider {
  return mockProvider;
}
