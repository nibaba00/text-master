import type {
  TextModelProvider,
  TextModelProviderRequest,
  TextModelProviderResult,
} from '../types/provider';

const SYSTEM_PROMPTS: Record<string, string> = {
  outline: `你是一位资深的文本结构设计师。请根据用户提供的项目设定和资料，生成一份清晰、层次分明的大纲。
要求：
- 使用中文输出。
- 结构包含：总览 → 卷/部分 → 章节/段落 → 关键要点。
- 每一层都需要1-2句简短说明。
- 不要输出前言或后记，直接输出大纲。`,

  content: `你是一位专业的文本创作者。请根据用户提供的项目设定、大纲和资料，生成完整的正文内容。
要求：
- 使用中文输出。
- 保持与项目设定一致的风格和语气。
- 内容完整、连贯、可独立阅读。
- 注意段落节奏和信息密度。`,

  continue: `你是一位专业的文本续写者。请根据用户提供的已有内容和上下文，进行自然流畅的续写。
要求：
- 使用中文输出。
- 保持与上文一致的风格、语气和视角。
- 续写内容应自然衔接上文，避免突兀转折。
- 不要重复已有内容。`,

  rewrite: `你是一位文本精修专家。请根据用户的改写指令重写给定文本。
要求：
- 使用中文输出。
- 严格遵循用户的改写指令（如更口语、更文学、更商业等）。
- 保持原文核心含义不变。
- 提升表达的清晰度和流畅度。`,

  review: `你是一位严格的文本审核专家。请审核用户提供的文本，指出问题并给出修改建议。
要求：
- 使用中文输出。
- 从以下维度审核：逻辑一致性、角色一致性、世界观冲突、节奏拖沓、钩子强度、平台敏感词。
- 对每个发现的问题，给出问题描述、风险等级和建议修复方案。
- 如果文本质量良好，也请明确指出优点。`,

  repair: `你是一位文本修复专家。请根据审核意见修复给定的文本问题。
要求：
- 使用中文输出。
- 只修复审核中指出的具体问题。
- 不要改变未涉及问题的部分。
- 修复后文本应自然流畅。`,
};

const DEFAULT_SYSTEM_PROMPT =
  '你是一位专业的文本创作助手。请根据用户的要求生成高质量的文本内容。使用中文输出。';

function buildMessages(
  request: TextModelProviderRequest,
): Array<{ role: 'system' | 'user'; content: string }> {
  const systemPrompt = SYSTEM_PROMPTS[request.type] ?? DEFAULT_SYSTEM_PROMPT;
  const userContent = [request.context, request.prompt].filter(Boolean).join('\n\n');

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];
}

export function createDeepSeekProvider(config: {
  apiKey: string;
  baseUrl: string;
  model: string;
}): TextModelProvider {
  const { apiKey, baseUrl, model } = config;

  return {
    id: 'deepseek',
    label: 'DeepSeekProvider',
    available: true,
    run: async (
      request: TextModelProviderRequest,
    ): Promise<TextModelProviderResult> => {
      if (!apiKey) {
        throw new Error('DeepSeek API Key 未配置。请在设置页中填写 API Key。');
      }

      const apiUrl = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
      const messages = buildMessages(request);

      let response: Response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            stream: false,
            temperature: request.type === 'review' ? 0.3 : 0.7,
            max_tokens: 4096,
          }),
          signal: AbortSignal.timeout(60_000),
        });
      } catch (networkError) {
        throw new Error(
          `DeepSeek API 网络请求失败：${networkError instanceof Error ? networkError.message : '未知网络错误'}`,
        );
      }

      if (!response.ok) {
        let errorBody = '';
        try {
          errorBody = await response.text();
        } catch {
          // ignore
        }
        throw new Error(
          `DeepSeek API 返回错误 ${response.status}：${errorBody.slice(0, 300)}`,
        );
      }

      let data: {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: Record<string, number>;
      };
      try {
        data = (await response.json()) as typeof data;
      } catch {
        throw new Error('DeepSeek API 返回内容无法解析为 JSON。');
      }

      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('DeepSeek API 返回结果为空。');
      }

      const result: TextModelProviderResult = {
        content,
        metadata: {
          usage: data.usage,
          model,
        },
      };

      if (request.type === 'review') {
        result.issues = [
          {
            level: 'warning',
            type: 'consistency',
            range: '全文',
            problem: 'AI 审核结果已生成，请人工复核。',
            suggestion: '比对资料库、项目设定和当前正文后再确认问题。',
            canAutoFix: true,
          },
        ];
      }

      return result;
    },
  };
}
