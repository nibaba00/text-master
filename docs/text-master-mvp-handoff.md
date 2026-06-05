# Text Master MVP Handoff

## MVP 完成范围

Text Master 当前是独立 Vue/Vite App，入口路由位于 `src/modules/text-master/routes.ts`。页面覆盖首页、新建项目、项目中心、项目工作台、模板中心、导出中心、设置、用户资料。工作台覆盖项目总览、创作设定、资料库、大纲工厂、正文生产、改写工厂、审核工厂、版本记录、导出中心。

## 运行模式

默认运行模式是 `LocalRuntime`，实现位于 `src/modules/text-master/runtime/LocalRuntime.ts`。`BrainHubRuntime` 位于 `src/modules/text-master/runtime/BrainHubRuntime.ts`，只在 `runtimeDetection.ts` 检测到合法 Brain Hub launch context 时启用。没有 Brain Hub 时不会阻塞本地运行。

## 数据模型

核心类型位于 `src/modules/text-master/types/`：

- `project.ts`: `TextProject`, `TextProjectSettings`
- `document.ts`: `TextDocument`
- `material.ts`: `TextMaterial`
- `version.ts`: `TextVersion`
- `export.ts`: `ExportRequest`, `ExportResult`, `ExportRecord`
- `production.ts`: `GenerationJob`, `GenerationCandidate`, `ReviewIssue`
- `provider.ts`: `TextModelProvider`

## 本地持久化

本地持久化由 `src/modules/text-master/services/localStorageRepository.ts` 提供，优先使用浏览器 `localStorage`，非浏览器环境回退到内存 Map。刷新页面后项目、文档、资料、版本、任务、候选、审核问题、导出记录会保留在对应的 `text-master:*` key 中。

## 核心 Service

- `projectService.ts`: 项目列表、创建、保存、统计更新
- `documentService.ts`: 文档列表、保存、字数统计
- `materialService.ts`: 资料列表、保存、引用次数
- `versionService.ts`: 版本列表、创建版本
- `jobService.ts`: AI job 创建、状态更新
- `candidateService.ts`: AI candidate 创建、状态更新
- `reviewService.ts`: 审核问题创建、状态更新
- `exportService.ts`: Markdown/TXT/JSON 导出、跨应用 JSON 预留、ExportRecord
- `modelProviderService.ts`: MockProvider 和预留 provider 列表

## AI Provider

当前真实可用 provider 是 `MockProvider`。已预留 `DeepSeekProvider`、`OpenAIProvider`、`LocalModelProvider`、`BrainHubAIProvider`，但它们不会要求 API key，也不会影响本地运行。

## Job / Candidate / Version

`LocalRuntime.generateText/rewriteText/reviewText` 会先创建 `GenerationJob`，进入 running，再生成 `GenerationCandidate`，最后将 job 标记为 succeeded。AI 结果不会直接覆盖正文。用户应用候选或保存文档时，由 runtime 创建 `TextVersion`。

## ReviewIssue

审核链路会创建结构化 `ReviewIssue`，包含 level、type、range、problem、suggestion、canAutoFix、status。工作台现有审核 UI 仍保留 Mock 呈现，但底层 service 已可写入持久化审核问题。

## Export

导出支持：

- Markdown
- TXT
- JSON
- Text Master JSON
- Media Master JSON 结构化预留
- Novel Master JSON 结构化预留

独立导出中心会调用 runtime 生成文件下载，并写入 `ExportRecord` 与 export version。DOCX/PDF 仍显示后续接入。

## Brain Hub Adapter

可选 adapter 位于 `src/integrations/brain-hub/`，包括 manifest、launch context、auth、file、AI、project sync、usage adapter。manifest 声明 Text Master 业务能力，但权限只作为 optional，不是运行依赖。

## 启动与验证

启动 Web dev server：

```bash
npm run dev:web
```

桌面启动：

```bash
npm run dev
```

类型检查：

```bash
npm run typecheck
```

构建：

```bash
npm run build
```

视觉审计：

```bash
npm run audit:text-master:visual
```

MVP 审计：

```bash
npm run audit:text-master:mvp
```

## 审计产物

视觉审计输出到：

```text
artifacts/text-master-visual-audit/<timestamp>/
```

MVP 审计输出到：

```text
artifacts/text-master-mvp-audit/<timestamp>/
```

每次审计会输出 JSON、Markdown 报告和 zip。

## 仍为 Mock 的内容

- 真实 LLM 接入仍是 MockProvider。
- DeepSeek/OpenAI/LocalModel/BrainHub AI provider 只预留接口。
- Brain Hub 文件、AI、同步、usage adapter 是可选 Mock/stub。
- DOCX/PDF 导出未接入。
- 工作台部分交互文案仍标注 Mock，但底层 job/candidate/review/export service 已存在。

## 下一阶段

- 接入 DeepSeek 或 OpenAI provider。
- 将 localStorage repository 替换或适配到 SQLite/Electron 文件系统。
- 将工作台本地临时状态进一步收敛到 service/store。
- 补更细粒度 MVP Playwright 功能链路审计。
- 接入真实 Brain Hub 同步上下文和文件库。
