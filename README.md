# Text Master

Text Master 是一个可独立运行、独立开发、独立部署的文本生产 App。

Brain Hub 可以作为 Steam 式应用库、启动器、分发平台和统一入口存在，但它不是 Text Master 的运行前置依赖。Text Master 必须先作为完整 App 成立，再通过 Adapter 预留被 Brain Hub 启动、挂载或分发的能力。

## 1. 项目定位

Text Master 面向文本生产工作流，核心目标是帮助用户完成从主题、素材、结构、草稿、改写、定稿到导出的完整链路。

它不是一个单纯的编辑器，也不是一个 Brain Hub 页面，而是一个围绕文本生产任务组织的独立应用。

明确废弃以下方向：

- Text Master 不是 `/apps/text-master` 子页面。
- Text Master 不是 Brain Hub 的内部模块。
- Text Master 不是 Media Master 的附属模块。

## 2. 为什么 Text Master 不依赖 Brain Hub 才能开发

Text Master 的核心能力是文本项目管理、内容生产、AI 辅助、版本与导出。这些能力不需要 Brain Hub 才能成立。

如果开发阶段依赖 Brain Hub，会带来几个问题：

- 运行入口被 Brain Hub 绑定，独立开发和调试变慢。
- 路由、状态、存储和权限容易被 Hub 的假设污染。
- 文本生产业务会被错误地设计成平台插件，而不是完整产品。
- MVP 验收会变成验证 Hub 集成，而不是验证文本生产链路。

因此，Text Master 应先以独立 App 完成业务闭环。Brain Hub 集成只应通过 Adapter 层接入。

## 3. Standalone First / Hub Optional / Adapter Only 原则

### Standalone First

Text Master 首先必须能独立启动、独立运行、独立存储数据、独立完成导出。

独立模式是主运行路径，也是开发、测试和验收的默认路径。

### Hub Optional

Brain Hub 是可选入口。没有 Brain Hub 时，Text Master 不应缺失核心功能。

Brain Hub 可以提供应用发现、启动、用户上下文、统一账号、统一授权、统一分发等能力，但这些能力不能成为 Text Master MVP 的硬依赖。

### Adapter Only

Text Master 与 Brain Hub 的关系只能通过 Adapter 层表达。

业务模块不直接引用 Brain Hub 的内部状态、路由、组件或服务。Brain Hub 只能通过稳定的 Adapter 接口传入上下文和能力。

## 4. 独立运行模式

独立运行模式是 Text Master 的默认模式。

在该模式下，Text Master 自己负责：

- 应用启动。
- 页面路由。
- 文本项目创建与管理。
- 本地数据读写。
- Mock AI 或真实 AI 服务调用。
- 导出文件生成。
- 用户界面状态。

独立运行模式不需要 Brain Hub 进程、Brain Hub 路由或 Brain Hub 数据中心。

## 5. Brain Hub 启动模式

Brain Hub 启动模式是可选增强模式。

在该模式下，Brain Hub 可以做：

- 展示 Text Master 应用卡片。
- 启动 Text Master。
- 向 Text Master 传入用户、工作区、主题、权限等上下文。
- 接收 Text Master 的运行状态或最近项目摘要。
- 提供统一分发和版本管理入口。

Brain Hub 不应该做：

- 接管 Text Master 的业务路由。
- 直接读写 Text Master 的业务状态。
- 把 Text Master 变成 Hub 内部页面。
- 要求 Text Master 必须存在于 `/apps/text-master` 才能运行。

## 6. MVP 功能范围

MVP 应聚焦文本生产闭环，不追求平台化。

建议范围：

- 文本项目创建、打开、保存。
- 项目基础信息：标题、类型、目标平台、写作目标、状态。
- 素材区：主题、参考资料、关键词、约束。
- 大纲区：章节、段落、要点。
- 草稿区：正文编辑、AI 生成、局部改写。
- 版本区：保存关键版本、比较版本摘要。
- 导出区：Markdown、纯文本、JSON。
- Mock AI：不依赖真实 API 完成流程验证。

暂不纳入 MVP：

- 完整账号系统。
- 多人协作。
- 云同步。
- Brain Hub 深度集成。
- 插件市场。
- 复杂权限系统。

## 7. 页面结构

建议页面结构：

- Home：最近项目、创建项目、导入项目。
- Project Workspace：文本生产主工作台。
- Brief Panel：写作目标、受众、风格、约束。
- Source Panel：素材、参考、关键词。
- Outline Panel：大纲、结构、章节。
- Draft Editor：草稿编辑器。
- AI Actions Panel：生成、续写、改写、总结、标题建议。
- Version Panel：版本保存、历史记录。
- Export Panel：导出格式与导出设置。
- Settings：模型配置、存储配置、编辑偏好。

MVP 可以先做单页工作台，通过内部面板切换完成主要流程。

## 8. 文本生产链路

推荐链路：

1. 创建文本项目。
2. 填写写作目标和约束。
3. 收集素材与关键词。
4. 生成或手写大纲。
5. 基于大纲生成草稿。
6. 对局部内容进行续写、改写、压缩或扩写。
7. 保存关键版本。
8. 预览并导出。

该链路应能在 Mock AI 下完整跑通。

## 9. Runtime 架构

Text Master 应通过 Runtime 抽象隔离运行环境。

建议 Runtime 接口覆盖：

- appMode：当前运行模式，取值如 `standalone` 或 `brain-hub`。
- storage：项目读写、配置读写。
- ai：文本生成、改写、总结等能力。
- export：导出 Markdown、TXT、JSON。
- navigation：页面跳转或工作区切换。
- context：用户、工作区、启动参数。
- events：运行事件、状态上报。

业务组件只依赖 Runtime 接口，不直接判断自己是否在 Brain Hub 内运行。

## 10. LocalRuntime 说明

LocalRuntime 是独立运行模式下的默认实现。

LocalRuntime 负责：

- 使用浏览器本地存储、IndexedDB、文件系统或 Electron 本地能力保存项目。
- 使用 Mock AI 或用户配置的真实 AI provider。
- 在本应用内部完成路由和状态管理。
- 独立完成导出。

LocalRuntime 必须支持没有网络、没有 Brain Hub、没有账号系统的基础文本生产流程。

## 11. BrainHubRuntime 说明

BrainHubRuntime 是 Brain Hub 启动模式下的 Runtime 实现。

它可以通过 Brain Hub Adapter 获取：

- 启动上下文。
- 用户和工作区信息。
- 平台级配置。
- 可选授权信息。
- 状态上报通道。

BrainHubRuntime 不应该把 Brain Hub 的内部实现暴露给业务层。业务层看到的仍然是 Text Master Runtime 接口。

## 12. Brain Hub Adapter 说明

Brain Hub Adapter 是 Text Master 与 Brain Hub 之间唯一允许的集成边界。

Adapter 可以提供：

- `getLaunchContext()`：读取启动上下文。
- `reportStatus()`：上报运行状态。
- `openExternal()`：请求 Hub 打开外部资源。
- `getUserProfile()`：读取可选用户信息。
- `getWorkspace()`：读取可选工作区信息。
- `registerAppActions()`：注册可被 Hub 调用的应用动作。

Adapter 不应该提供：

- 直接操作 Text Master 内部 store 的能力。
- 直接访问 Text Master 私有组件的能力。
- 强制替换 Text Master 路由的能力。

## 13. 数据模型

MVP 数据模型建议：

```ts
type TextProject = {
  id: string;
  title: string;
  type: "article" | "script" | "outline" | "note" | "custom";
  status: "draft" | "review" | "final";
  brief: ProjectBrief;
  sources: SourceItem[];
  outline: OutlineNode[];
  draft: DraftDocument;
  versions: ProjectVersion[];
  createdAt: string;
  updatedAt: string;
};

type ProjectBrief = {
  goal: string;
  audience: string;
  tone: string;
  constraints: string[];
};

type SourceItem = {
  id: string;
  title: string;
  content: string;
  tags: string[];
};

type OutlineNode = {
  id: string;
  title: string;
  notes: string;
  children?: OutlineNode[];
};

type DraftDocument = {
  content: string;
  format: "markdown" | "plain";
};

type ProjectVersion = {
  id: string;
  label: string;
  snapshot: DraftDocument;
  createdAt: string;
};
```

后续可以扩展任务队列、AI 调用记录、导出记录和多文档项目结构。

## 14. 文件结构建议

建议文件结构：

```text
Text Master/
  README.md
  package.json
  index.html
  vite.config.ts
  tsconfig.json
  src/
    main.tsx
    App.tsx
    app/
      runtime/
        RuntimeProvider.tsx
        runtime.types.ts
        localRuntime.ts
        brainHubRuntime.ts
      router/
        routes.tsx
      styles/
        globals.css
    modules/
      text-master/
        pages/
          HomePage.tsx
          WorkspacePage.tsx
          SettingsPage.tsx
        components/
          BriefPanel.tsx
          SourcePanel.tsx
          OutlinePanel.tsx
          DraftEditor.tsx
          AIActionsPanel.tsx
          VersionPanel.tsx
          ExportPanel.tsx
        services/
          aiService.ts
          exportService.ts
          projectService.ts
        storage/
          projectStorage.ts
        store/
          textProjectStore.ts
        models/
          textProject.types.ts
    adapters/
      brain-hub/
        brainHubAdapter.types.ts
        createBrainHubAdapter.ts
```

该结构保留独立 App 根目录，同时把 Brain Hub 集成限制在 `src/adapters/brain-hub/`。

## 15. 路由设计

建议路由：

```text
/                      Home
/projects/:projectId   Project Workspace
/settings              Settings
```

Brain Hub 启动时可以携带参数，例如：

```text
/?launchSource=brain-hub&projectId=xxx
```

但 Text Master 不应依赖 Brain Hub 的外部路由才能进入工作台。

## 16. Mock AI 策略

MVP 阶段默认使用 Mock AI，先验证产品链路。

Mock AI 应支持：

- 根据 brief 生成大纲。
- 根据大纲生成草稿。
- 对选中文本改写。
- 压缩、扩写、总结文本。
- 生成标题候选。

Mock AI 的输出可以是规则化模板，但接口应与真实 AI provider 保持一致，便于后续替换。

建议接口：

```ts
type TextAIService = {
  generateOutline(input: GenerateOutlineInput): Promise<OutlineNode[]>;
  generateDraft(input: GenerateDraftInput): Promise<DraftDocument>;
  rewrite(input: RewriteInput): Promise<string>;
  summarize(input: SummarizeInput): Promise<string>;
  suggestTitles(input: SuggestTitlesInput): Promise<string[]>;
};
```

## 17. 导出策略

MVP 导出格式：

- Markdown：适合继续编辑和发布。
- TXT：适合纯文本交付。
- JSON：适合项目备份、迁移和调试。

导出服务应独立于 UI，实现为纯服务函数或 Runtime 能力。

后续可扩展：

- DOCX。
- PDF。
- HTML。
- 平台专用格式。

## 18. 开发阶段规划

### Phase 1：项目骨架

- 搭建独立 Vite App。
- 建立基础页面和样式系统。
- 建立 Runtime 接口。
- 实现 LocalRuntime。

### Phase 2：文本生产 MVP

- 实现项目创建和本地存储。
- 实现 Brief、Source、Outline、Draft、Export 面板。
- 接入 Mock AI。
- 跑通完整文本生产链路。

### Phase 3：质量与体验

- 增加版本保存。
- 优化编辑器体验。
- 增加错误状态、空状态和加载状态。
- 增加基础测试。

### Phase 4：Brain Hub Adapter

- 定义 Brain Hub Adapter 协议。
- 实现 BrainHubRuntime。
- 支持从 Brain Hub 启动 Text Master。
- 保持独立模式不受影响。

## 19. 验收标准

MVP 验收标准：

- 可以不依赖 Brain Hub 独立启动。
- 可以创建文本项目。
- 可以录入 brief 和素材。
- 可以生成或编辑大纲。
- 可以生成或编辑草稿。
- 可以执行至少三类 Mock AI 操作。
- 可以保存项目到本地。
- 可以重新打开项目。
- 可以导出 Markdown、TXT、JSON。
- Brain Hub 相关代码只存在于 Adapter 或 Runtime 边界内。
- 业务组件不直接依赖 Brain Hub。
- 项目不是 `/apps/text-master` 子页面。
- 项目不是 Media Master 的附属模块。

## 20. 下一步开发建议

建议下一步先创建独立 App 骨架，而不是先接入 Brain Hub。

推荐顺序：

1. 初始化独立 Vite + React + TypeScript 项目。
2. 建立 `src/app/runtime/` 和 `src/modules/text-master/`。
3. 实现 LocalRuntime 和 Mock AI。
4. 实现 Home 与 Workspace 两个主页面。
5. 跑通创建项目、生成草稿、保存、导出的最短链路。
6. 再定义 Brain Hub Adapter 类型。
7. 最后实现 BrainHubRuntime，并验证独立模式仍然可用。

任何 Brain Hub 接入工作都必须在 Text Master 独立运行通过后进行。
