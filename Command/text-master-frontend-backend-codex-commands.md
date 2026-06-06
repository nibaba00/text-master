# Text Master 前后端分离开发 Codex 命令集

> 使用方式：
> 1. 在 Text Master 项目根目录打开 Codex / Codewhale。
> 2. 按本文顺序执行。
> 3. 每次只复制一个命令块。
> 4. 每个阶段必须先执行“实施命令”，再执行“审核命令”。
> 5. 不需要在命令前添加 `codex` 前缀。

---

## 总目标

将 Text Master 从“前端页面堆功能”改造成“前后端分离 + shared 类型协议 + 本地同步联调”的 MVP 架构。

目标结构：

```txt
text-master/
├─ apps/
│  ├─ web/          # 前端：保留现有 UI
│  └─ api/          # 后端：Fastify / Node.js / TypeScript
├─ packages/
│  └─ shared/       # 前后端共享类型、DTO、工作流配置
├─ package.json
├─ pnpm-workspace.yaml
└─ README.md
```

本地开发目标：

```txt
前端：http://localhost:5173
后端：http://localhost:4100
前端请求：/api/*
真实后端：http://localhost:4100/api/*
```

---

# 第 0 步：只扫描项目，不修改代码

## 0.1 实施命令

```txt
请先扫描当前 Text Master 项目结构，不要修改文件。

请输出：
1. 当前技术栈判断
2. 当前目录结构
3. 前端入口文件
4. 路由文件
5. 页面模块分布
6. 状态管理方式
7. 是否已经有后端或 mock API
8. 是否适合直接改成 pnpm monorepo
9. 前后端分离迁移风险
10. 建议的第一批实际修改文件列表

只做分析，不要改代码。
```

## 0.2 审核命令

```txt
请基于刚才的扫描结果进行一次迁移可行性审核。

请确认：
1. 当前项目是否可以安全迁移为 apps/web。
2. 是否已有 package.json、vite.config、tsconfig、src 入口。
3. 是否存在 Electron / Tauri / 小程序等特殊运行环境需要保留。
4. 是否存在设计图、审计脚本、截图资源、文档资源需要保护。
5. 哪些文件必须先备份或暂时不动。
6. 是否建议先创建 git 分支。
7. 是否可以进入第 1 步。

只输出审核结论，不要修改代码。
```

---

# 第 1 步：建立前后端分离 monorepo 基座

## 1.1 实施命令

```txt
请在当前 Text Master 项目中进行前后端分离重构，但不要破坏现有前端视觉风格和页面结构。

目标：
1. 将项目整理为 monorepo 结构：
   - apps/web：现有前端代码迁移到这里
   - apps/api：新增后端服务
   - packages/shared：新增前后端共享类型、DTO、工作流配置
2. 使用 pnpm workspace 管理。
3. 保留现有 UI 风格、组件样式、路由逻辑，不要重新设计页面。
4. 不要删除现有设计资源、截图、审计脚本、文档。
5. 前端先通过 API 层读取数据，后端先返回 mock 数据。
6. 最终根目录可以通过 pnpm dev 同时启动前端和后端。

请先只完成结构迁移和基础脚本，不要大规模重写业务功能。

完成后输出：
1. 新目录结构
2. 修改过的文件列表
3. 本地启动命令
4. 风险点
```

## 1.2 审核命令

```txt
请进行本阶段审核：

1. 检查 monorepo 结构是否正确：
   - apps/web 是否包含前端
   - apps/api 是否包含后端
   - packages/shared 是否存在
2. 检查根目录 pnpm-workspace.yaml 是否正确。
3. 检查 package.json scripts 是否包含：
   - dev
   - dev:web
   - dev:api
   - typecheck
   - build
4. 尝试运行：
   - pnpm install
   - pnpm typecheck
   - pnpm build
5. 如果失败，请先修复，不要跳过。
6. 输出最终审计报告，包括：
   - 成功项
   - 失败项
   - 修复项
   - 仍未解决的问题
   - 是否可以进入下一阶段
```

---

# 第 2 步：建立 shared 前后端共享协议

## 2.1 实施命令

```txt
请在 packages/shared 中建立 Text Master 前后端共享协议。

要求新增这些内容：

1. 项目类型：
   - TextProject
   - TextProjectStatus
   - TextProjectCreateInput

2. 文本类型：
   - TextType
   - TextTypeCategory
   - TextTypeWorkflowTemplate

3. 工作流类型：
   - WorkflowStep
   - WorkflowStepStatus
   - WorkflowRun
   - WorkflowNode

4. 生成任务类型：
   - GenerationTask
   - GenerationTaskStatus
   - GenerationRequest
   - GenerationResult

5. API 响应类型：
   - ApiResponse<T>
   - PaginatedResponse<T>
   - ApiError

6. 预置文本类型配置：
   - 小红书文案
   - 商业 BP
   - 招商文案
   - 短视频脚本
   - 小说 / 故事
   - 合同 / 文件

每种文本类型都需要有独立工作流步骤，例如：
小红书文案：选题 → 爆款结构 → 正文 → 标题 → 标签 → 发布建议
商业 BP：项目概述 → 市场分析 → 商业模式 → 财务预测 → 融资方案
招商文案：品牌定位 → 加盟政策 → 产品卖点 → 收益模型 → 招商页
短视频脚本：选题 → 钩子 → 分镜 → 旁白 → 发布标题
小说 / 故事：世界观 → 人物 → 大纲 → 分章 → 正文
合同 / 文件：模板选择 → 信息填写 → 条款生成 → 风险提示 → 导出

要求：
1. shared 包必须能被 apps/web 和 apps/api 同时 import。
2. 不要把业务数据写死在页面组件里。
3. 所有字段命名保持清晰，便于未来接入 Brain Hub / 脑吧 AI 工厂。
```

## 2.2 审核命令

```txt
请审核 shared 包：

1. 检查 apps/web 是否可以正常 import packages/shared。
2. 检查 apps/api 是否可以正常 import packages/shared。
3. 检查 TypeScript 类型是否无报错。
4. 检查文本类型工作流配置是否完整。
5. 检查是否存在重复定义的 Project、Workflow、Generation 类型。
6. 运行：
   - pnpm typecheck
   - pnpm build
7. 输出 shared 协议审核报告。
```

---

# 第 3 步：建立后端 API MVP 服务

## 3.1 实施命令

```txt
请在 apps/api 中建立 Text Master 后端 MVP 服务。

技术要求：
1. 使用 Node.js + TypeScript。
2. 优先使用 Fastify，保持轻量。
3. 默认端口：4100。
4. 所有接口统一以 /api 开头。
5. 暂时使用内存 mock 数据，不接数据库。
6. 类型必须来自 packages/shared。
7. 允许跨域，方便本地前端调试。

需要实现接口：

1. GET /api/health
   返回后端健康状态。

2. GET /api/text-types
   返回所有文本类型和对应工作流。

3. POST /api/projects
   创建文本项目。

4. GET /api/projects
   返回项目列表。

5. GET /api/projects/:id
   返回单个项目详情。

6. GET /api/projects/:id/workflow
   返回项目对应工作流。

7. POST /api/projects/:id/generate
   创建生成任务。
   现阶段不真实调用 AI，只返回 mock taskId 和 running 状态。

8. GET /api/generations/:taskId
   返回生成任务状态。
   现阶段可模拟 completed 结果。

9. POST /api/projects/:id/export
   返回导出 mock 结果。

要求：
1. 代码结构清晰：
   - src/main.ts
   - src/routes
   - src/modules/projects
   - src/modules/text-types
   - src/modules/generations
   - src/modules/exports
2. 增加错误处理。
3. 增加基础日志。
4. 增加 README，说明后端接口和启动方式。
```

## 3.2 审核命令

```txt
请审核后端 API：

1. 运行 apps/api 的开发服务。
2. 使用 curl 或等价方式测试：
   - GET http://localhost:4100/api/health
   - GET http://localhost:4100/api/text-types
   - GET http://localhost:4100/api/projects
3. 测试创建项目：
   - POST /api/projects
4. 测试生成任务：
   - POST /api/projects/:id/generate
   - GET /api/generations/:taskId
5. 检查所有 API 返回结构是否符合 packages/shared 的 ApiResponse<T>。
6. 运行：
   - pnpm typecheck
   - pnpm build
7. 输出后端审核报告，不要只说完成，要列出真实测试结果。
```

---

# 第 4 步：前端接入 API，不再写死数据

## 4.1 实施命令

```txt
请改造 apps/web 前端，让现有页面通过 API 层读取数据。

要求：
1. 保留现有 UI 风格，不重新设计页面。
2. 新增统一 API 客户端：
   - src/api/client.ts
   - src/api/textTypes.ts
   - src/api/projects.ts
   - src/api/generations.ts
3. 前端所有类型优先从 packages/shared 导入。
4. 将页面中的硬编码文本类型、项目列表、工作流步骤迁移为 API 数据。
5. Vite 配置代理：
   - /api 代理到 http://localhost:4100
6. 新建 .env.example：
   - VITE_API_BASE_URL=/api
7. 首页 / 项目中心读取 GET /api/projects。
8. 新建项目页面读取 GET /api/text-types。
9. 创建项目调用 POST /api/projects。
10. 工作台读取 GET /api/projects/:id/workflow。
11. 生成按钮调用 POST /api/projects/:id/generate。
12. 任务状态调用 GET /api/generations/:taskId。

限制：
1. 不要改掉当前设计语言。
2. 不要把页面改成另一套布局。
3. 不要删除左侧边栏收起展开能力。
4. 不要删除已有审计脚本。
```

## 4.2 审核命令

```txt
请审核前端 API 接入：

1. 同时启动前端和后端。
2. 打开 http://localhost:5173。
3. 检查首页是否从后端读取项目列表。
4. 检查新建项目页面是否从后端读取文本类型。
5. 创建一个测试项目。
6. 进入项目工作台。
7. 检查工作流步骤是否来自后端接口。
8. 点击生成按钮，确认是否创建 generation task。
9. 检查浏览器控制台是否有报错。
10. 检查 Network 面板中 /api 请求是否正常。
11. 运行：
    - pnpm typecheck
    - pnpm build
12. 输出前端联调审核报告，包括截图建议、异常接口、未完成项。
```

---

# 第 5 步：建立本地前后端同步开发脚本

## 5.1 实施命令

```txt
请完善 Text Master 本地前后端同步开发体验。

目标：
1. 根目录 pnpm dev 可以同时启动：
   - apps/api 后端服务，端口 4100
   - apps/web 前端服务，端口 5173

2. 根目录 package.json 增加脚本：
   - dev
   - dev:web
   - dev:api
   - build
   - build:web
   - build:api
   - typecheck
   - typecheck:web
   - typecheck:api
   - lint
   - audit:local

3. 如果项目没有 concurrently，请安装 concurrently。
4. 如果已有替代方案，也可以使用 npm-run-all，但保持命令简单。
5. 增加根目录 README.md，写清楚：
   - 如何安装依赖
   - 如何启动前后端
   - 前后端端口
   - API 代理逻辑
   - shared 类型同步逻辑
   - 常见问题排查

6. 增加 scripts/local-audit 脚本或等价命令，用于检查：
   - 前端是否能启动
   - 后端是否能启动
   - /api/health 是否可访问
   - TypeScript 是否通过
   - build 是否通过

要求：
不要引入复杂工程体系，先保证 MVP 简洁、稳定、可维护。
```

## 5.2 审核命令

```txt
请执行本地同步开发审核：

1. 删除旧的临时构建缓存后重新安装依赖。
2. 运行：
   - pnpm install
   - pnpm dev
3. 确认：
   - 前端运行在 http://localhost:5173
   - 后端运行在 http://localhost:4100
   - 前端 /api 请求能代理到后端
4. 运行：
   - pnpm typecheck
   - pnpm build
   - pnpm audit:local
5. 检查是否存在端口冲突、跨域错误、shared 包引用错误。
6. 输出最终本地联调报告。
```

---

# 第 6 步：补充本地开发 README 和交付说明

## 6.1 实施命令

```txt
请补充 Text Master 根目录 README.md，要求写成给后续开发者和 Codewhale / Codex 都能理解的文档。

README 至少包含：

1. 项目定位
   - Text Master 是脑吧体系下的文本生产链路工具。
   - 当前目标是前后端分离 MVP。

2. 目录说明
   - apps/web
   - apps/api
   - packages/shared

3. 本地启动
   - pnpm install
   - pnpm dev

4. 单独启动
   - pnpm dev:web
   - pnpm dev:api

5. 端口说明
   - web: 5173
   - api: 4100

6. API 代理说明
   - 前端访问 /api/*
   - Vite 代理到 http://localhost:4100/api/*

7. shared 协议开发纪律
   - 先改 shared
   - 再改 api
   - 再改 web

8. 文本类型工作流说明
   - 小红书文案
   - 商业 BP
   - 招商文案
   - 短视频脚本
   - 小说 / 故事
   - 合同 / 文件

9. 本地审核命令
   - pnpm typecheck
   - pnpm build
   - pnpm audit:local

10. 常见问题
   - 端口占用
   - API 代理失败
   - shared 包 import 失败
   - pnpm workspace 识别失败

要求：
文档要简洁、明确、可执行，不要写空泛介绍。
```

## 6.2 审核命令

```txt
请审核 README 和交付文档：

1. README 是否包含本地开发完整流程。
2. 新人是否可以只看 README 启动项目。
3. Codewhale / Codex 是否能根据 README 理解项目结构。
4. 是否说明了 shared → api → web 的开发顺序。
5. 是否说明了端口、代理、常见问题。
6. 输出文档审核结论。
```

---

# 第 7 步：最终总审核

## 7.1 最终总审核命令

```txt
请对 Text Master 前后端分离 MVP 进行最终总审核。

审核范围：

1. 架构审核
   - 是否已经形成 apps/web、apps/api、packages/shared。
   - 前端、后端、shared 是否职责清晰。
   - 是否仍有明显业务逻辑堆在页面组件里。

2. 前端审核
   - 现有 UI 风格是否保留。
   - 首页 / 项目中心是否正常。
   - 新建项目页面是否正常。
   - 左侧边栏是否仍可收起展开。
   - 工作台是否能读取工作流。
   - 生成按钮是否能调用 API。

3. 后端审核
   - /api/health 是否正常。
   - /api/text-types 是否正常。
   - /api/projects 是否正常。
   - /api/projects/:id/workflow 是否正常。
   - /api/projects/:id/generate 是否正常。
   - /api/generations/:taskId 是否正常。

4. shared 审核
   - 类型是否统一。
   - 前端是否 import shared。
   - 后端是否 import shared。
   - 是否存在重复类型定义。

5. 本地开发审核
   - pnpm install 是否正常。
   - pnpm dev 是否能同时启动前后端。
   - pnpm typecheck 是否通过。
   - pnpm build 是否通过。
   - pnpm audit:local 是否通过。

6. 风险审核
   - 是否有未迁移的旧路径。
   - 是否有硬编码 API 地址。
   - 是否有端口冲突。
   - 是否有跨域问题。
   - 是否有构建失败但被忽略。

请输出最终报告：
1. 已完成项
2. 未完成项
3. 发现的问题
4. 已修复的问题
5. 仍需人工确认的问题
6. 下一阶段建议
7. 是否建议 git commit

如果存在失败项，请先尝试修复，再输出报告。不要只输出“完成”。
```

---

# 附录 A：建议最终 package.json scripts

最终根目录 package.json 可以参考：

```json
{
  "scripts": {
    "dev": "concurrently -n api,web \"pnpm dev:api\" \"pnpm dev:web\"",
    "dev:web": "pnpm --filter @text-master/web dev",
    "dev:api": "pnpm --filter @text-master/api dev",
    "build": "pnpm build:api && pnpm build:web",
    "build:web": "pnpm --filter @text-master/web build",
    "build:api": "pnpm --filter @text-master/api build",
    "typecheck": "pnpm typecheck:api && pnpm typecheck:web",
    "typecheck:web": "pnpm --filter @text-master/web typecheck",
    "typecheck:api": "pnpm --filter @text-master/api typecheck",
    "lint": "pnpm --filter @text-master/web lint && pnpm --filter @text-master/api lint",
    "audit:local": "pnpm typecheck && pnpm build"
  }
}
```

---

# 附录 B：本地同步开发办法

## 第一次安装

```bash
pnpm install
```

## 同时启动前后端

```bash
pnpm dev
```

## 单独启动前端

```bash
pnpm dev:web
```

## 单独启动后端

```bash
pnpm dev:api
```

## 类型检查

```bash
pnpm typecheck
```

## 构建

```bash
pnpm build
```

## 本地审核

```bash
pnpm audit:local
```

---

# 附录 C：开发纪律

以后 Text Master 的开发顺序必须是：

```txt
shared 类型协议
  ↓
后端接口实现
  ↓
前端页面调用
  ↓
本地联调审核
```

禁止继续这样开发：

```txt
页面里写死数据
页面里拼 Prompt
页面里判断文本生产流程
页面里模拟任务状态
```

应该统一变成：

```txt
前端 = 页面展示
shared = 类型协议
后端 = 业务链路
AI Factory = 模型调用
```
