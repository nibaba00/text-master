export function createDeepSeekProvider(config) {
  return {
    id: 'deepseek',
    name: 'DeepSeek',
    model: config.model,
    async generate(input) {
      if (!config.apiKey) {
        throw new Error('DeepSeek API key is not configured');
      }

      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: buildMessages(input),
          stream: false,
          temperature: 0.7,
          max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`DeepSeek API returned ${response.status}: ${errorText.slice(0, 300)}`);
      }

      const payload = await response.json();
      const output = payload?.choices?.[0]?.message?.content;

      if (typeof output !== 'string' || !output.trim()) {
        throw new Error('DeepSeek API returned an empty completion');
      }

      return {
        providerId: this.id,
        model: config.model,
        usage: payload.usage,
        output,
      };
    },
    async testConnection() {
      const result = await this.generate({
        project: {
          title: 'Provider Connection Test',
          currentStageId: 'test',
        },
        request: {
          prompt: '请只回复：连接测试成功',
          context: '',
        },
      });

      return {
        ok: true,
        providerId: this.id,
        model: config.model,
        responseLength: result.output.length,
      };
    },
  };
}

function buildMessages(input) {
  const context = input.request.context ? `上下文：\n${input.request.context}\n\n` : '';

  return [
    {
      role: 'system',
      content: '你是 Text Master 的文本生产助手。请使用中文输出，结构清晰，直接给出可用内容。',
    },
    {
      role: 'user',
      content: `${context}项目：${input.project.title}\n阶段：${input.project.currentStageId}\n任务：${input.request.prompt}`,
    },
  ];
}
