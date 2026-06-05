# Text Master MVP 完整 Codex 命令集

> 使用方式：你已经在 PowerShell 的 Codex 交互模式中时，逐段复制下面的命令。  
> 不需要输入 `codex` 前缀。  
> 目标：彻底建立 Text Master 独立 App MVP，包括真实本地生产链路、数据持久化、版本记录、候选结果、审核、导出、自动审计脚本与最终 zip 产物。  
> 架构原则：Text Master 独立运行，Brain Hub 只是可选启动器 / 应用库 / 同步 Adapter，不是前置依赖。

---

## 1. 项目审计与 MVP 落点确认

```text
先审计当前项目，不要修改代码。

目标：
确认 Text Master 当前页面、Mock 数据、路由、状态管理、审计脚本和设计图位置，为后续建立 MVP 后端/本地生产链路做准备。

请检查：
1. package.json：dev/build/typecheck/test/audit 脚本、包管理器、依赖。
2. Text Master 代码位置：src/modules/text-master、src/pages、src/router、src/app。
3. 当前页面：首页、新建项目、工作台、模板、导出、设置、用户资料。
4. 工作台子页：项目总览、创作设定、资料库、大纲工厂、正文生产、改写工厂、审核工厂、版本记录、导出中心。
5. 当前 Mock 数据、store、service、runtime、Brain Hub Adapter。
6. 是否存在设计图目录 pages/ 与 01_home.png 到 14_user_profile.png。
7. 是否存在 audit:text-master:visual 脚本与 artifacts 输出。
8. 当前数据是否仍依赖 localStorage/mock，真实 MVP 缺口在哪里。

输出：
- 当前技术栈
- Text Master 代码路径
- 当前可复用文件
- 需要新增的 service/store/types/scripts
- MVP 必须补齐清单
- 风险点
- 下一步修改计划

不要修改文件。
不要安装依赖。
不要 git commit / push。
完成后停下来。
```

---

## 2. 建立本地 MVP 数据层与运行时

```text
开始建立 Text Master 独立 MVP 的本地数据层。

目标：
让 Text Master 不再只依赖 mock，而是有统一的本地数据服务。优先使用浏览器 localStorage / IndexedDB 可用方案；如果项目已有 Electron 主进程或 SQLite 方案，可适配，但不要强行引入重型依赖。

必须实现：
1. TextMasterRuntime：
   - LocalRuntime 为默认运行模式
   - BrainHubRuntime 仅可选
   - runtimeDetection 不得要求 Brain Hub 存在

2. 本地数据模型：
   - TextProject
   - TextProjectSettings
   - TextMaterial
   - TextDocument
   - TextDocumentVersion
   - GenerationJob
   - GenerationCandidate
   - ReviewIssue
   - ExportRecord

3. 本地 Repository / Service：
   - projectRepository
   - settingsRepository
   - materialRepository
   - documentRepository
   - versionRepository
   - jobRepository
   - candidateRepository
   - reviewRepository
   - exportRepository

4. 初始化种子数据：
   - 至少 3 个项目
   - 至少 4 条资料
   - 至少 4 个文档
   - 至少 8 条版本记录
   - 至少 3 条审核问题

5. 数据持久化：
   - 刷新页面后项目、文档、版本、资料仍存在
   - 提供 reset seed data 的开发方法
   - 不破坏现有 Mock UI

要求：
- 不要破坏现有页面视觉。
- 不要把 Brain Hub 作为依赖。
- 所有新增类型放在 Text Master 模块内。
- 如有 Pinia/Zustand/Vue store，接入现有 store。
- 如果没有，建立轻量 store/service 层即可。

完成后运行：
- npm run typecheck，如果存在
- npm run build，如果存在

输出：
- 新增/修改文件
- 本地数据结构说明
- 当前数据持久化方式
- 仍是 Mock 的位置
- 构建结果
完成后停下来。
```

---

## 3. 打通项目、设定、资料、文档、版本

```text
请把 Text Master 的核心生产基础链路打通。

目标：
新建项目、创作设定、资料库、正文文档、版本记录都能真实保存到本地数据层。

实现内容：
1. 新建项目页：
   - 创建真实 TextProject
   - 保存项目类型、标题、基础设定、模板、生成策略
   - 创建默认 settings/documents/workflow state
   - 创建后跳转项目工作台

2. 项目总览：
   - 从真实本地数据读取项目
   - 展示真实进度、字数、当前步骤、最近版本
   - 继续生产按钮可进入当前步骤

3. 创作设定：
   - 基础设定、风格设定、角色设定、世界观设定可编辑保存
   - 支持 lockedFields
   - AI 补全按钮先走 MockProvider，但必须生成版本记录或操作记录

4. 资料库：
   - 新增资料、编辑资料、删除资料
   - 资料类型、标题、内容、标签、引用次数、锁定状态
   - 总结资料 / 提取设定 / 检查冲突可先用 MockProvider，但要产生 job 与 version/review 记录

5. 正文文档：
   - 文档列表真实读取
   - Markdown 编辑器内容可保存
   - 手动保存创建 manual_edit 版本
   - 字数统计真实计算

6. 版本记录：
   - 所有保存、生成、改写、审核、导出都创建 version
   - 版本详情可查看
   - 版本恢复不能覆盖历史，要创建 restore 版本

要求：
- AI 结果不得直接覆盖正文。
- 所有 AI 结果必须先进入 candidate。
- 所有高风险操作要保留确认或候选区。
- 不要破坏页面设计图风格。

完成后运行：
- npm run typecheck，如果存在
- npm run build，如果存在
- npm run audit:text-master:visual，如果存在

输出：
- 新增/修改文件
- 新建项目是否真实可用
- 创作设定是否可保存
- 资料库是否可保存
- 文档编辑是否可保存
- 版本记录是否真实生成
- 审计 zip 路径，如果有
完成后停下来。
```

---

## 4. 建立 AI 任务、候选结果、改写与审核 MVP

```text
请建立 Text Master MVP 的 AI 生产链路。

目标：
即使真实模型暂未接入，也要形成完整的后端式生产流程：
job → provider → candidate → apply/save version → review issue。

实现内容：
1. TextModelProvider 接口：
   - MockProvider 默认可用
   - 预留 DeepSeekProvider / OpenAIProvider / LocalModelProvider / BrainHubAIProvider
   - 不需要真实 API Key
   - Provider 不得写死在 UI 组件中

2. GenerationJob：
   - pending/running/succeeded/failed/cancelled
   - type: outline/content/continue/rewrite/review/repair
   - input_json/output_json/error/retry_count
   - 任务过程可用 setTimeout 模拟，但必须有状态变化

3. 候选结果 Candidate：
   - 生成大纲、生成正文、续写、改写、修复都先生成 candidate
   - 状态：pending_review/applied/discarded/saved_as_version
   - 应用 candidate 后更新文档并创建 version

4. 大纲工厂：
   - 生成总纲/分集结构 candidate
   - 应用后保存 outline document 与 generate version

5. 正文生产：
   - 生成正文 candidate
   - 继续写 candidate
   - 插入到光标 / 替换选中 / 保存为新版本，至少实现可用的基础逻辑

6. 改写工厂：
   - 原文与改写结果双栏
   - 改写模式保存
   - diff 可先用简化文本 diff
   - 应用改写创建 rewrite version

7. 审核工厂：
   - 生成 review issues
   - issue 包含 level/type/range/problem/suggestion/canAutoFix/status
   - 支持忽略、应用修复、复制建议
   - 应用修复创建 repair version

8. 右侧 AI Copilot：
   - 显示当前 job 状态
   - 显示任务队列
   - 显示最近一次生成结果

完成后运行：
- npm run typecheck，如果存在
- npm run build，如果存在
- npm run audit:text-master:visual，如果存在

输出：
- Provider 结构
- Job 类型
- Candidate 是否可用
- 大纲/正文/改写/审核是否跑通
- 版本记录是否覆盖所有 AI 操作
- 审计 zip 路径
完成后停下来。
```

---

## 5. 建立真实导出 MVP 与跨应用 JSON

```text
请建立 Text Master MVP 的导出系统。

目标：
导出中心不再只是 UI，必须能真实导出 Markdown、TXT、JSON，并生成导出记录与版本记录。

实现内容：
1. ExportService：
   - exportMarkdown
   - exportTxt
   - exportJson
   - exportTextMasterProjectJson
   - exportMediaMasterJson，先做结构化 Mock
   - exportNovelMasterJson，先做结构化 Mock

2. 导出内容范围：
   - 项目设定
   - 世界观
   - 角色设定
   - 总纲
   - 分集脚本
   - 正文
   - 审核报告
   - 版本摘要

3. 导出中心：
   - 左侧选择内容
   - 中间导出预览
   - 右侧导出设置
   - 只有“确认导出”是主按钮
   - DOCX/PDF 显示“后续接入”，不要伪装完成

4. 导出文件：
   - 浏览器环境使用 Blob 下载
   - Electron 环境如已有文件 API 则使用本地保存
   - 否则退回浏览器下载
   - 导出文件名包含项目名、格式、版本号、时间

5. 导出记录：
   - 每次导出写入 ExportRecord
   - 每次导出创建 export version
   - 导出记录可在导出中心查看

6. JSON 结构：
   - sourceApp: text-master
   - project
   - settings
   - materials
   - documents
   - versions summary
   - reviewIssues
   - exportMeta

完成后运行：
- npm run typecheck，如果存在
- npm run build，如果存在
- npm run audit:text-master:visual，如果存在

输出：
- 导出格式支持情况
- 导出记录是否生成
- export version 是否生成
- Media Master / Novel Master JSON 是否预留
- 审计 zip 路径
完成后停下来。
```

---

## 6. 补齐 Brain Hub 可选 Adapter，不影响独立运行

```text
请补齐 Brain Hub 可选 Adapter，但不得让 Text Master 依赖 Brain Hub。

目标：
Brain Hub 像 Steam 一样可以发现、启动、传入上下文，但 Text Master 没有 Brain Hub 也必须完整运行。

实现内容：
1. 确认或新增：
   - src/integrations/brain-hub/manifest.ts
   - src/integrations/brain-hub/launch.ts
   - src/integrations/brain-hub/launchContext.ts
   - src/integrations/brain-hub/authAdapter.ts
   - src/integrations/brain-hub/fileAdapter.ts
   - src/integrations/brain-hub/aiAdapter.ts
   - src/integrations/brain-hub/projectSyncAdapter.ts
   - src/integrations/brain-hub/usageAdapter.ts

2. launch.ts：
   - 解析 Brain Hub 启动参数
   - 生成 BrainHubLaunchContext
   - 校验 permissions
   - 失败时返回 null，不影响 LocalRuntime

3. manifest：
   - id: text-master
   - name: Text Master
   - category: content-production
   - entry: /
   - capabilities:
     - text.project.create
     - text.outline.generate
     - text.content.generate
     - text.rewrite
     - text.review
     - text.export
   - permissions 只声明，不强制依赖

4. Runtime：
   - 默认 LocalRuntime
   - 只有检测到合法 launch context 才启用 BrainHubRuntime
   - UI 显示 Brain Hub Ready / Optional
   - 不允许显示 Brain Hub Required

5. 审计脚本：
   - Brain Hub Adapter 缺失只能 optional-missing
   - 不允许因为 Brain Hub 不存在失败

完成后运行：
- npm run typecheck，如果存在
- npm run build，如果存在
- npm run audit:text-master:visual，如果存在

输出：
- Brain Hub Adapter 文件清单
- LocalRuntime 是否仍为默认
- Brain Hub 是否仍为可选
- 审计结果
- 审计 zip 路径
完成后停下来。
```

---

## 7. 如果缺失则建立 MVP 审计脚本，并输出最终 zip

```text
请检查是否已有 audit:text-master:visual 或 MVP 审计脚本。

如果已有：
- 增强它，让它覆盖 MVP 功能链路和数据链路。
如果没有：
- 新建 scripts/audit-text-master-mvp.mjs
- package.json 增加 "audit:text-master:mvp": "node scripts/audit-text-master-mvp.mjs"

审计目标：
最终输出 screenshots、reports、json、logs、zip。

必须检查：
1. 页面截图：
   - 首页
   - 新建项目
   - 工作台项目总览
   - 创作设定
   - 资料库
   - 大纲工厂
   - 正文生产
   - 改写工厂
   - 审核工厂
   - 版本记录
   - 导出中心
   - 模板中心
   - 设置
   - 用户资料

2. 功能链路：
   - 新建项目
   - 保存创作设定
   - 新增资料
   - 编辑文档
   - 生成大纲 candidate
   - 应用大纲 candidate
   - 生成正文 candidate
   - 应用正文 candidate
   - 改写 candidate
   - 审核生成 issue
   - 应用修复
   - 版本记录新增
   - 导出 Markdown/TXT/JSON
   - 导出记录新增

3. 数据持久化：
   - 刷新后项目仍存在
   - 刷新后文档仍存在
   - 刷新后版本仍存在

4. 设计与稳定性：
   - 无横向溢出
   - 无空白页
   - console error 数量
   - 1440x900 截图
   - 1366x768 关键截图

5. Brain Hub：
   - 只作为 optional
   - 不存在不失败

输出目录：
artifacts/text-master-mvp-audit/YYYYMMDD-HHmmss/

必须包含：
- screenshots/
- logs/
- mvp-audit-report.md
- mvp-audit-report.json
- functional-audit-report.json
- data-audit-report.json
- console-errors.json
- overflow-report.json
- text-master-mvp-audit-YYYYMMDD-HHmmss.zip

评分：
- UI 完成度 20
- 数据持久化 20
- 生产链路 25
- 版本与候选结果 15
- 导出能力 10
- 稳定性 10
总分 100，MVP 达标线 90，理想线 95。

完成后运行：
- npm run typecheck，如果存在
- npm run build，如果存在
- npm run audit:text-master:visual，如果存在
- npm run audit:text-master:mvp，如果新增了

输出：
- 审计脚本路径
- package.json 脚本变化
- 审计 zip 路径
- MVP 总分
- failed/warning 项
完成后停下来。
```

---

## 8. 最终集成：彻底建立 Text Master MVP

```text
请进行 Text Master MVP 最终集成，修复明显问题，输出最终报告。

MVP 必须达到：
1. Text Master 可独立运行，不依赖 Brain Hub。
2. 首页、新建项目、工作台、模板、导出、设置、用户资料可访问。
3. 新建项目真实写入本地数据层。
4. 创作设定可保存。
5. 资料库可新增/编辑/删除。
6. 文档可编辑保存。
7. 版本记录真实生成。
8. AI 任务有 job 状态。
9. AI 输出先进入 candidate，不直接覆盖正文。
10. 大纲、正文、改写、审核、修复链路可用，允许 MockProvider。
11. 审核问题可生成、忽略、修复。
12. Markdown/TXT/JSON 可真实导出。
13. ExportRecord 与 export version 可生成。
14. Brain Hub Adapter 可选存在，不影响 LocalRuntime。
15. 审计脚本可输出 zip。

请运行：
- npm run typecheck，如果存在
- npm run build，如果存在
- npm run audit:text-master:visual，如果存在
- npm run audit:text-master:mvp，如果存在

如果有明确错误：
- 修复一次
- 再重跑上述命令

限制：
- 最多自动修复 2 轮
- 不要无限循环
- 不要自动 git commit
- 不要自动 git push
- 不要引入重型依赖
- 不要破坏现有 UI 设计

最终输出：
1. 新增文件列表
2. 修改文件列表
3. 核心数据模型
4. 核心 service/store
5. Provider 列表
6. Job/Candidate/Version 是否完成
7. 审核系统是否完成
8. 导出系统是否完成
9. Brain Hub Adapter 是否可选完成
10. typecheck 结果
11. build 结果
12. visual audit zip 路径
13. MVP audit zip 路径
14. MVP 分数
15. failed/warning 项
16. 未完成事项
17. 是否建议 git commit
18. 是否建议 git push

完成后停下来，等待我确认。
```

---

## 9. 生成开发交接文档

```text
请基于当前实际代码生成 Text Master MVP 开发交接文档。

输出文件：
docs/text-master-mvp-handoff.md

内容必须包括：
1. MVP 完成范围
2. 运行模式：LocalRuntime 默认，BrainHubRuntime 可选
3. 页面清单
4. 数据模型
5. 本地数据持久化方式
6. 核心 service/store
7. AI Provider 结构
8. Job 任务系统
9. Candidate 候选结果系统
10. Version 版本系统
11. ReviewIssue 审核系统
12. Export 导出系统
13. Brain Hub Adapter
14. 如何启动项目
15. 如何运行 typecheck/build
16. 如何运行视觉审计
17. 如何运行 MVP 审计
18. 审计 zip 产物位置
19. 当前仍是 Mock 的内容
20. 下一阶段：接入 DeepSeek / SQLite / 后端服务 / Brain Hub 同步

要求：
- 文档必须基于当前实际文件和代码，不要空泛。
- 明确哪些功能真实可用，哪些是 MockProvider。
- 不要自动 git commit。
- 不要自动 git push。

完成后运行：
- npm run typecheck，如果存在
- npm run build，如果存在

输出：
- 文档路径
- 修改文件列表
- 是否建议提交
完成后停下来。
```

---

## 推荐执行顺序

```text
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
```

最关键的是第 2 到第 8 步。  
执行完成后，把最终的 `text-master-mvp-audit-*.zip` 发给我，我可以继续检查真实 MVP 完成度。
