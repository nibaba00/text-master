# Text Master 通用 AI 编程代理开发指令

适用对象：Codex / CodeWhale / Claude Code / Cursor Agent / 其他 AI 编程代理  
目标项目：Text Master  
核心目标：在保留原设计风格的前提下，把 Text Master 收敛为可演示、可交付、可审计的 MVP，并逐步抽象出可复用的 Production Kernel。

---

## 一、总原则

Text Master 当前不是要推翻重做，而是要在现有基础上完成三件事：

```text
1. 保留原有设计风格
2. 跑通最小文本生产闭环
3. 抽象出后续 Media Master / Story Forge / Brain Hub 可复用的生产内核
```

最小闭环定义：

```text
模板选择
↓
输入需求 / 素材
↓
AI 生成候选文本
↓
用户应用候选
↓
正文编辑
↓
保存版本
↓
导出 Markdown / TXT / JSON
```

---

## 二、每轮任务都必须带上的通用总指令

> 使用方式：每次给 Codex / CodeWhale 派任务时，先粘贴本段，再粘贴对应轮次任务。

```text
你现在是 Text Master 项目的 AI 编程代理。

本项目目标：
在不破坏原有设计风格的前提下，把 Text Master 收敛为“模板选择 → 输入需求 → AI 生成候选 → 编辑正文 → 保存版本 → 导出文件”的最小生产闭环，并逐步抽象出可复用的 Production Kernel。

重要原则：
1. 不要重做 UI。
2. 不要推翻现有页面结构。
3. 不要改成普通后台管理系统风格。
4. 必须保留 Text Master 当前设计语言：
   - 深色背景
   - 高级灰卡片
   - 蓝紫色主强调
   - 绿色表示完成/可用
   - 橙色表示待处理/队列/警示
   - 红色表示风险/错误
   - 大圆角卡片
   - 弱边框
   - 不允许大面积白底
   - 不允许密集普通表格作为主视觉
5. Brain Hub 只能是可选适配，不允许成为 Text Master 本地运行、Mock AI、导出、路由渲染、视觉审计的硬依赖。
6. 每轮只完成当前任务，不主动扩展功能。
7. 每轮结束必须暂停，等待人工复核。
8. 修改后必须运行验证命令，并输出 changed files、验证结果和未完成事项。

每轮必须执行：
npm run typecheck
npm run build

如果涉及 Text Master 功能闭环，还必须执行：
npm run audit:text-master:mvp

如果涉及 UI / 页面 / 样式，还必须执行：
npm run audit:text-master:visual

输出格式必须包含：
1. 本轮完成内容
2. changed files
3. typecheck 结果
4. build 结果
5. audit 结果，如本轮执行了
6. 是否影响原设计风格
7. 是否影响 Brain Hub 可选适配
8. 未完成事项
9. 建议下一轮任务
10. 暂停等待人工复核
```

---

# 第 1 轮：建立当前基线，不改业务代码

```text
任务目标：
建立 Text Master 当前项目基线，只做检查和记录，不修改业务功能。

允许修改：
- docs/text-master/00_current_baseline.md
- 如 docs/text-master/ 目录不存在，可以创建该目录

禁止修改：
- src/
- package.json
- vite/electron 配置
- 页面样式
- 路由
- Runtime
- Provider
- Service

执行步骤：
1. 检查当前 git 状态。
2. 运行：
   npm run typecheck
   npm run build
   npm run audit:text-master:mvp
   npm run audit:text-master:visual
3. 记录当前结果到：
   docs/text-master/00_current_baseline.md

文档内容必须包含：
- 执行时间
- 当前分支
- git status 摘要
- typecheck 结果
- build 结果
- mvp audit 结果
- visual audit 结果
- 当前主要风险
- 下一轮建议

注意：
本轮不允许修 bug，不允许顺手改代码。

完成后输出：
- changed files
- 四项命令结果
- audit 产物路径
- 暂停等待人工复核
```

---

# 第 2 轮：首页与模板入口收敛，保留原设计风格

```text
任务目标：
收敛 Text Master 首页，让首页突出“快速模板、最近项目、新建项目、继续创作”，不要展示完整文本生产链路。必须保留原设计图的深色专业生产工具风格。

设计保护要求：
1. 不允许大面积白底。
2. 不允许普通后台表格风格。
3. 保留深色背景、高级灰卡片、蓝紫主按钮。
4. 顶部保留用户资料入口。
5. 顶部不要出现重复的新建项目按钮。
6. 新建项目主按钮只保留在 Hero / 主行动区域。
7. 原“文本生产链路”区域改成快速模板。
8. 原快速模板区域可作为广告位 / 官方比赛栏目 / 推荐活动区。

允许修改：
- src/modules/text-master/pages/Home.vue
- src/modules/text-master/pages/ProjectCenter.vue
- 与首页直接相关的样式文件
- 如已有模板 mock 数据，可调整首页引用方式

禁止修改：
- Runtime
- Provider
- Export
- Brain Hub Adapter
- 路由结构
- 全局设计风格
- 不要新增复杂状态管理

验收标准：
1. 首页能看到快速模板。
2. 首页能看到最近项目或空状态。
3. 首页能进入新建项目。
4. 首页能进入模板中心。
5. 首页没有完整生产链路卡片。
6. 页面保持原设计风格。
7. 1440x900 和 1366x768 不出现横向溢出。

必须执行：
npm run typecheck
npm run build
npm run audit:text-master:visual

完成后输出：
- changed files
- 首页调整说明
- 是否保留原设计风格
- visual audit 结果
- 截图产物路径
- 暂停等待人工复核
```

---

# 第 3 轮：统一 3 个核心模板，不写死在页面里

```text
任务目标：
建立 Text Master MVP 的 3 个核心模板，并用统一 TemplateSpec 管理，避免模板写死在页面组件里。

只做 3 个模板：
1. 短视频脚本
2. AI 漫剧大纲
3. 商业文案

建议新增或调整：
- src/modules/text-master/templates/
- src/modules/text-master/templates/types.ts
- src/modules/text-master/templates/templateRegistry.ts
- src/modules/text-master/templates/shortVideoScript.ts
- src/modules/text-master/templates/comicDramaOutline.ts
- src/modules/text-master/templates/businessCopy.ts

TemplateSpec 至少包含：
- id
- name
- category
- description
- inputSchema
- promptRecipe
- outputSchema
- exportFormats
- targetApp

注意：
1. 不要重做模板中心 UI。
2. 不要破坏现有模板中心视觉。
3. 模板中心、首页、新建项目应尽量复用同一份 templateRegistry。
4. targetApp 需要预留 text-master、media-master、story-forge。
5. 本轮不接真实 AI。

验收标准：
1. 三个模板能在模板中心看到。
2. 首页快速模板能引用同一份模板数据。
3. 新建项目页能使用模板 id。
4. 没有重复硬编码模板数组。
5. 原设计风格不变。

必须执行：
npm run typecheck
npm run build
npm run audit:text-master:mvp
npm run audit:text-master:visual

完成后输出：
- changed files
- TemplateSpec 结构说明
- 三个模板的 id
- typecheck/build/audit 结果
- 是否影响 UI 风格
- 暂停等待人工复核
```

---

# 第 4 轮：工作台收敛为 4 个核心区，不推翻原 UI

```text
任务目标：
在保留原工作台视觉风格的前提下，把工作台交互主线收敛为：
输入区 → 生成区 → 编辑区 → 资产区。

不要删除原有 8 个工作台状态，但要让 MVP 主流程更清晰。

当前 8 个状态：
- 项目总览
- 创作设定
- 资料库
- 大纲工厂
- 正文生产
- 改写工厂
- 审核工厂
- 版本记录

MVP 处理方式：
1. 项目总览：保留为顶部/总览摘要。
2. 创作设定：合并或弱化为输入区配置。
3. 资料库：归入资产区。
4. 大纲工厂：作为模板输出类型之一。
5. 正文生产：作为主编辑区。
6. 改写工厂：变成编辑区里的 AI 操作。
7. 审核工厂：变成编辑区里的 AI 审核操作。
8. 版本记录：放入资产区或侧栏。

允许修改：
- src/modules/text-master/pages/ProjectWorkspace.vue
- 与工作台相关的局部组件
- 与工作台相关的局部样式

禁止修改：
- 全局主题
- 大面积重写视觉结构
- Runtime 接口
- Provider 逻辑
- Export service
- Brain Hub Adapter

UI 要求：
1. 继续保持深色背景。
2. 继续使用高级灰卡片。
3. 主按钮使用蓝紫强调。
4. 候选、版本、审核建议使用卡片化呈现。
5. 不要改成表格后台。
6. 不要出现横向溢出。

验收标准：
1. 用户能清楚看到输入区。
2. 用户能清楚看到生成结果/候选区。
3. 用户能编辑正文。
4. 用户能看到版本/资料/导出入口。
5. 不破坏原设计风格。
6. 工作台所有原状态仍可进入或不报错。

必须执行：
npm run typecheck
npm run build
npm run audit:text-master:mvp
npm run audit:text-master:visual

完成后输出：
- changed files
- 工作台结构调整说明
- 是否删除了任何旧状态，如删除必须说明原因
- mvp audit 结果
- visual audit 结果
- 截图产物路径
- 暂停等待人工复核
```

---

# 第 5 轮：打通 MockProvider 生成闭环

```text
任务目标：
在不接真实 AI 的情况下，先打通 MockProvider 的完整文本生产闭环：
模板参数 → GenerationJob → GenerationCandidate → 用户应用候选 → Document 更新。

允许修改：
- LocalRuntime 相关文件
- MockProvider 相关文件
- jobService / candidateService / documentService 的必要调用
- ProjectWorkspace 中候选展示与“应用候选”按钮

禁止修改：
- 真实 Provider
- Brain Hub AI Provider
- Export 格式
- 大面积 UI 样式
- 模板中心视觉

业务规则：
1. AI 结果必须先进入 GenerationCandidate。
2. AI 结果不能直接覆盖正文。
3. 用户点击“应用候选”后，才允许更新 Document 当前正文。
4. 每次生成必须创建 GenerationJob。
5. Job 状态必须能从 pending/running 变成 succeeded 或 failed。
6. 出错时显示错误状态，不允许白屏。

验收标准：
1. 选择模板后能生成 Mock 候选文本。
2. 候选文本显示在工作台。
3. 点击“应用候选”后，正文编辑区更新。
4. 多次生成不会自动覆盖正文。
5. job/candidate 数据能持久化或至少在当前流程可追踪。
6. 页面风格不变。

必须执行：
npm run typecheck
npm run build
npm run audit:text-master:mvp

完成后输出：
- changed files
- Mock 生成流程说明
- Job/Candidate 状态流说明
- typecheck/build/mvp audit 结果
- 暂停等待人工复核
```

---

# 第 6 轮：打通 Document → Version

```text
任务目标：
打通正文保存版本能力：
Document 当前正文 → 用户保存版本 → TextVersion 记录 → 用户可查看/恢复版本。

允许修改：
- versionService
- documentService 的必要调用
- LocalRuntime 中版本相关方法
- 工作台版本区 UI

禁止修改：
- Provider
- Brain Hub Adapter
- 全局样式
- 导出 service
- 路由

业务规则：
1. 用户主动点击“保存版本”才创建 Version。
2. Version 必须记录 documentId、projectId、content、createdAt、source。
3. 用户可以看到版本列表。
4. 用户可以恢复某个版本到当前 Document。
5. 恢复版本前需要有确认或明显提示。
6. 版本卡片保持原设计风格，不使用普通后台表格。

验收标准：
1. 正文编辑后可以保存版本。
2. 版本列表可见。
3. 可以恢复版本。
4. 刷新后版本记录仍保留，如果当前本地持久化支持。
5. 不影响 Candidate 流程。

必须执行：
npm run typecheck
npm run build
npm run audit:text-master:mvp
npm run audit:text-master:visual

完成后输出：
- changed files
- 版本保存/恢复流程说明
- typecheck/build/audit 结果
- 是否影响原设计风格
- 暂停等待人工复核
```

---

# 第 7 轮：导出 Markdown / TXT / JSON

```text
任务目标：
完善 MVP 导出闭环，只做 Markdown、TXT、JSON 三种格式。DOCX/PDF 继续保持“后续接入”状态，不要实现。

允许修改：
- exportService
- LocalRuntime 导出方法
- 导出中心页面
- 工作台导出入口

禁止修改：
- DOCX/PDF 真实实现
- Provider
- Brain Hub Adapter
- 大面积 UI 样式

业务规则：
1. 导出来源可以是当前 Document 或指定 Version。
2. 导出成功后必须写入 ExportRecord。
3. JSON 需要预留跨应用结构，尤其是 Media Master JSON。
4. DOCX/PDF 只显示后续接入，不允许做假下载。
5. 导出失败要显示错误状态，不允许白屏。

Media Master JSON 至少包含：
- sourceApp
- targetApp
- projectId
- templateId
- title
- document
- outline
- characters
- scenes
- metadata

验收标准：
1. Markdown 能导出。
2. TXT 能导出。
3. JSON 能导出。
4. 导出记录能看到。
5. Media Master JSON 字段结构稳定。
6. 页面仍保持原设计风格。

必须执行：
npm run typecheck
npm run build
npm run audit:text-master:mvp
npm run audit:text-master:visual

完成后输出：
- changed files
- 三种导出格式说明
- ExportRecord 写入说明
- Media Master JSON 示例
- typecheck/build/audit 结果
- 暂停等待人工复核
```

---

# 第 8 轮：接入 DeepSeekProvider，但必须可回退 MockProvider

```text
任务目标：
接入一个真实 AI Provider：DeepSeekProvider。没有 API Key 或调用失败时，必须回退 MockProvider 或显示明确错误，不允许影响本地运行。

允许修改：
- provider 相关文件
- modelProviderService
- Settings 页面中的模型配置区域
- LocalRuntime 的 provider 调用逻辑

禁止修改：
- Brain Hub 强绑定
- 工作台大面积 UI
- Export service
- TemplateSpec 结构，除非必要字段缺失

业务规则：
1. MockProvider 永远可用。
2. DeepSeekProvider 只有配置 API Key 后才可用。
3. 设置页支持：
   - provider 选择
   - API Key 输入
   - 模型名称
   - 测试连接
   - 回退 MockProvider
4. DeepSeek 调用失败时不能覆盖正文。
5. DeepSeek 返回内容必须进入 Candidate。
6. 不允许把 API Key 写死进代码。
7. 不允许提交真实 API Key。

验收标准：
1. 无 API Key 时，MockProvider 正常生成。
2. 有 API Key 时，可调用 DeepSeekProvider。
3. 调用失败时 UI 显示错误。
4. Candidate → Document → Version 流程不变。
5. Text Master 不依赖 Brain Hub。

必须执行：
npm run typecheck
npm run build
npm run audit:text-master:mvp

完成后输出：
- changed files
- Provider 调用流程
- API Key 存储位置说明
- 回退策略说明
- typecheck/build/mvp audit 结果
- 暂停等待人工复核
```

---

# 第 9 轮：抽 Production Kernel 第一版，只做搬迁和兼容

```text
任务目标：
抽出 Production Kernel 第一版，让 Text Master 的通用生产对象可以被 Media Master / Story Forge 复用。本轮只做低风险搬迁和 import 调整，不重写业务逻辑。

建议目录：
src/core/production/
├─ project/
├─ document/
├─ material/
├─ template/
├─ job/
├─ candidate/
├─ review/
├─ version/
├─ export/
├─ provider/
└─ runtime/

优先抽象：
- Project
- Material
- Document
- Template
- GenerationJob
- GenerationCandidate
- ReviewIssue
- TextVersion
- ExportRecord
- Provider
- Runtime interface

允许修改：
- src/core/production/
- 原 types/service 的 import 路径
- 必要的 index.ts re-export

禁止修改：
- 页面 UI
- 业务流程
- Provider 实现逻辑
- Export 业务逻辑
- Brain Hub Adapter 业务逻辑

迁移策略：
1. 先创建 core/production 目录。
2. 搬迁通用类型。
3. 通过 index.ts 做统一导出。
4. Text Master 模块逐步改 import。
5. 保持原功能不变。
6. 不要在本轮大改 service 架构。

验收标准：
1. Text Master 仍能运行。
2. typecheck 通过。
3. build 通过。
4. 原 MVP 闭环不变。
5. core/production 中能看到通用生产对象。
6. modules/text-master 中只保留 Text Master 专属页面、模板和配置。

必须执行：
npm run typecheck
npm run build
npm run audit:text-master:mvp

完成后输出：
- changed files
- Production Kernel 目录说明
- 哪些类型已迁移
- 哪些仍未迁移
- typecheck/build/mvp audit 结果
- 暂停等待人工复核
```

---

# 第 10 轮：视觉审计修复，只修偏差，不重做设计

```text
任务目标：
根据视觉审计报告修复 Text Master 主要页面与设计规范的偏差。只修明显问题，不做新的视觉方案。

必须重点检查：
1. 首页
2. 新建项目
3. 工作台
4. 模板中心
5. 导出中心
6. 设置页
7. 用户资料页

设计保护要求：
1. 不允许大面积白底。
2. 不允许普通后台表格风格。
3. 不允许改变品牌主色。
4. 不允许删掉原有卡片化结构。
5. 不允许为了省事把页面改成简单列表。
6. 不允许破坏 1440x900 和 1366x768 可用性。
7. 不允许横向溢出。

允许修改：
- 页面局部样式
- 卡片间距
- 按钮层级
- 状态徽标
- 响应式布局
- 轻量文案

禁止修改：
- Runtime
- Provider
- Export 业务逻辑
- Production Kernel
- Brain Hub Adapter
- 路由

验收标准：
1. 首页没有完整生产链路卡片。
2. 快速模板位置正确。
3. 广告位 / 官方比赛栏目存在。
4. 顶部用户入口存在。
5. 顶部没有重复新建项目按钮。
6. 工作台核心区清晰。
7. 所有核心页面无横向溢出。
8. 控制台无阻断错误。
9. 审计 zip 正常生成。

必须执行：
npm run typecheck
npm run build
npm run audit:text-master:visual

完成后输出：
- changed files
- 每个页面修复点
- visual audit 分数
- 扣分项是否减少
- 截图产物路径
- 是否保持原设计风格
- 暂停等待人工复核
```

---

# 三、推荐执行顺序

```text
第 1 轮：建立基线
第 2 轮：首页与模板入口收敛
第 3 轮：统一 3 个核心模板
第 4 轮：工作台收敛为 4 个核心区
第 5 轮：MockProvider 生成闭环
第 6 轮：Document → Version
第 7 轮：Markdown / TXT / JSON 导出
第 8 轮：DeepSeekProvider
第 9 轮：Production Kernel
第 10 轮：视觉审计修复
```

---

# 四、每轮完成后的报告模板

让 Codex / CodeWhale 每轮都按这个格式回报：

```md
# 本轮执行报告

## 1. 本轮完成内容

## 2. Changed Files

## 3. Typecheck 结果

## 4. Build 结果

## 5. Audit 结果

### MVP Audit

### Visual Audit

## 6. 是否影响原设计风格

## 7. 是否影响 Brain Hub 可选适配

## 8. 发现的问题

## 9. 未完成事项

## 10. 建议下一轮任务

## 11. 是否需要人工复核

结论：
本轮已暂停，等待人工复核后再继续。
```

---

# 五、开发优先级判断

如果执行过程中发现冲突，按以下优先级判断：

```text
1. Text Master 独立运行优先
2. MVP 闭环优先
3. 数据安全优先，不允许 AI 直接覆盖正文
4. 保留原设计风格优先
5. Brain Hub 可选适配优先，但不能变成硬依赖
6. 真实 AI Provider 优先级低于 Mock 闭环
7. Production Kernel 抽象优先级低于可运行闭环
8. 视觉 95 分优先级低于核心功能可演示
```

---

# 六、禁止事项总表

```text
1. 禁止一次性大改 10 个以上核心文件且不解释原因。
2. 禁止重做 UI。
3. 禁止把深色设计改成白底后台。
4. 禁止把卡片化页面改成密集表格。
5. 禁止让 Brain Hub 成为 Text Master 的硬依赖。
6. 禁止让 AI 结果直接覆盖正文。
7. 禁止提交真实 API Key。
8. 禁止实现假 DOCX / PDF 下载。
9. 禁止为了 audit 分数牺牲业务闭环。
10. 禁止每轮任务结束后自动继续下一轮。
```

---

# 七、最终目标

完成以上 10 轮后，Text Master 应该达到：

```text
1. 可独立运行
2. 保留原设计风格
3. 首页定位清晰
4. 模板中心复用统一 TemplateSpec
5. 工作台主流程清晰
6. MockProvider 闭环完整
7. 至少一个真实 Provider 可接入
8. Candidate → Document → Version 数据链路稳定
9. Markdown / TXT / JSON 可导出
10. Media Master JSON 有预留
11. Brain Hub 仍为可选适配
12. Production Kernel 第一版成型
```

一句话目标：

> Text Master 不再只是页面原型，而是脑吧 AI 生产工具体系里的第一个可运行、可演示、可扩展、可复用的文本生产样板。
