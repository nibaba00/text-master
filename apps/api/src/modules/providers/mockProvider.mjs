export const mockProvider = {
  id: 'mock-provider',
  name: 'Text Master Mock Provider',
  model: 'mock-text-master',
  async generate(input) {
    await wait(120);

    return {
      providerId: this.id,
      model: this.model,
      output: [
        `# ${input.project.title}`,
        '',
        `当前阶段：${input.project.currentStageId}`,
        '',
        `生成要求：${input.request.prompt}`,
        '',
        input.request.context ? `参考上下文：${input.request.context}` : '',
        '',
        '这是 Text Master 后端异步任务模型返回的模拟生成结果。后续可在 provider 层接入 DeepSeek、OpenAI 或 Brain Hub AI Factory。',
      ]
        .filter(Boolean)
        .join('\n'),
    };
  },
  async testConnection() {
    return {
      ok: true,
      providerId: this.id,
      model: this.model,
      responseLength: 0,
    };
  },
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
