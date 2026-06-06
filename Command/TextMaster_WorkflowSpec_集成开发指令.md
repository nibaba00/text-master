# Text Master WorkflowSpec 架构集成指令

适用工具：Codex / CodeWhale / Claude Code / 其他 AI 编程代理  
目标：完成 Text Master 当前阶段最关键的一步 —— **建立不同文本类型进入不同工作链路的架构**。

---

# 一、总目标

你现在是 Text Master 项目的 AI 编程代理。

本轮任务不是继续堆功能，也不是推倒重构，而是做一次**小范围架构重构**：

> 建立 Text Master 的 WorkflowSpec 架构，让不同模板可以进入不同工作流，并通过统一工作台外壳渲染不同工作链路。

必须实现的核心路径：

```text
TemplateSpec
↓
workflowId / workspaceType
↓
TextProject 记录 workflowId / workspaceType / currentStageId
↓
ProjectWorkspace 读取当前项目 workflowId
↓
WorkflowRegistry 找到对应 WorkflowSpec
↓
WorkspaceShell 渲染统一外壳
↓
WorkflowRenderer 根据 currentStageId 渲染不同阶段
```

第一批只接入 3 条 MVP 工作流：

```text
1. 短视频脚本工作流 short-video-script-workflow
2. AI 漫剧大纲工作流 comic-drama-outline-workflow
3. 商业文案工作流 business-copy-workflow
```

---

# 二、重要原则

## 1. 这不是推倒重构

不要删除现有 Text Master 页面、Runtime、Service、Provider、Export、Brain Hub Adapter。  
本轮只补“工作流分发机制”。

## 2. 保留原设计风格

必须保持 Text Master 当前视觉语言：

```text
深色背景
高级灰卡片
蓝紫色主强调
绿色表示完成 / 可用
橙色表示待处理 / 队列 / 警示
红色表示风险 / 错误
大圆角卡片
弱边框
不允许大面积白底
不允许普通后台表格风格
不允许把工作台改成简陋列表页
```

## 3. Brain Hub 仍然只能是可选适配

Text Master 必须保持独立运行。  
Brain Hub 不允许成为本地运行、路由渲染、Mock AI、导出、视觉审计的硬依赖。

## 4. 不要扩张新功能

本轮不接真实 AI。  
本轮不做模板市场。  
本轮不做用户系统。  
本轮不做 DOCX/PDF。  
本轮不做团队协作。  
本轮不做 Brain Hub 深度集成。

---

# 三、本轮允许修改的范围

优先允许修改或新增：

```text
src/modules/text-master/templates/
src/modules/text-master/workflows/
src/modules/text-master/components/workspace/
src/modules/text-master/pages/ProjectWorkspace.vue
src/modules/text-master/pages/ProjectCreate.vue
src/modules/text-master/pages/Templates.vue
src/modules/text-master/pages/Home.vue
src/modules/text-master/types/
src/modules/text-master/services/projectService.ts
src/modules/text-master/runtime/LocalRuntime.ts
```

如项目已有类似目录或文件，请优先复用现有结构，不要强行新建重复架构。

可以新增：

```text
src/modules/text-master/workflows/types.ts
src/modules/text-master/workflows/workflowRegistry.ts
src/modules/text-master/workflows/shortVideoScriptWorkflow.ts
src/modules/text-master/workflows/comicDramaOutlineWorkflow.ts
src/modules/text-master/workflows/businessCopyWorkflow.ts

src/modules/text-master/components/workspace/WorkspaceShell.vue
src/modules/text-master/components/workspace/WorkflowSidebar.vue
src/modules/text-master/components/workspace/WorkflowRenderer.vue
src/modules/text-master/components/workspace/AssistantPanel.vue
src/modules/text-master/components/workspace/AssetPanel.vue

src/modules/text-master/components/workflow-stages/
src/modules/text-master/components/workflow-stages/GenericStagePanel.vue
src/modules/text-master/components/workflow-stages/ShortVideoStagePanel.vue
src/modules/text-master/components/workflow-stages/ComicDramaStagePanel.vue
src/modules/text-master/components/workflow-stages/BusinessCopyStagePanel.vue
```

---

# 四、本轮禁止修改的范围

除非编译必须，否则不要修改：

```text
src/integrations/brain-hub/
electron/
vite 配置
package.json
全局主题文件
全局路由结构
真实 Provider 接入逻辑
DOCX/PDF 导出逻辑
```

禁止做以下行为：

```text
1. 不要移除 LocalRuntime。
2. 不要强依赖 BrainHubRuntime。
3. 不要把模板写死在页面组件里。
4. 不要把所有文本类型继续塞进同一个固定工作台。
5. 不要大面积重写 ProjectWorkspace 视觉。
6. 不要删除现有工作台状态，除非有兼容映射。
7. 不要让 audit:text-master:visual 因为缺少 Brain Hub 而失败。
```

---

# 五、具体执行步骤

## Step 1：先做基线检查

执行：

```bash
npm run typecheck
npm run build
```

如果项目已有以下命令，也执行：

```bash
npm run audit:text-master:mvp
npm run audit:text-master:visual
```

记录当前结果。  
如果当前已有阻断错误，先不要顺手大修，先在最终报告中说明。

---

## Step 2：新增 Workflow 基础类型

新增或补充：

```text
src/modules/text-master/workflows/types.ts
```

建议结构：

```ts
export type WorkspaceType =
  | 'short-video-script'
  | 'comic-drama-outline'
  | 'business-copy'
  | 'generic-text'

export type WorkflowStageComponent =
  | 'generic'
  | 'short-video'
  | 'comic-drama'
  | 'business-copy'

export type WorkflowActionType =
  | 'generate'
  | 'rewrite'
  | 'review'
  | 'outline'
  | 'export'

export interface WorkflowAction {
  id: string
  label: string
  type: WorkflowActionType
  description?: string
  primary?: boolean
}

export interface WorkflowStage {
  id: string
  title: string
  description: string
  component: WorkflowStageComponent
  requiredInputs: string[]
  outputs: string[]
  aiActions: WorkflowAction[]
}

export interface WorkflowSpec {
  id: string
  name: string
  description: string
  workspaceType: WorkspaceType
  stages: WorkflowStage[]
  defaultStageId: string
  exportTargets: Array<'markdown' | 'txt' | 'json' | 'media-master-json'>
}
```

注意：

```text
1. 类型名可以适配项目现有命名。
2. 不要和已有类型重复冲突。
3. 如果已有 WorkspaceType 或类似类型，优先复用和扩展。
```

---

## Step 3：TemplateSpec 增加 workflowId / workspaceType

找到现有 TemplateSpec 或模板类型定义。

为 TemplateSpec 增加：

```ts
workflowId: string
workspaceType: WorkspaceType
```

如果当前模板数据缺少这些字段，为现有 3 个 MVP 模板补齐：

```text
短视频脚本：
workflowId: short-video-script-workflow
workspaceType: short-video-script

AI 漫剧大纲：
workflowId: comic-drama-outline-workflow
workspaceType: comic-drama-outline

商业文案：
workflowId: business-copy-workflow
workspaceType: business-copy
```

兼容要求：

```text
1. 如果旧模板没有 workflowId，默认 fallback 到 generic-text-workflow。
2. 不能导致首页、模板中心、新建项目空白。
3. 不能把模板数据重新写死到页面。
```

---

## Step 4：新增三个 WorkflowSpec

新增：

```text
src/modules/text-master/workflows/shortVideoScriptWorkflow.ts
src/modules/text-master/workflows/comicDramaOutlineWorkflow.ts
src/modules/text-master/workflows/businessCopyWorkflow.ts
```

### 4.1 短视频脚本工作流

```ts
export const shortVideoScriptWorkflow: WorkflowSpec = {
  id: 'short-video-script-workflow',
  name: '短视频脚本工作流',
  description: '用于口播、带货、短视频、视频号、小红书等脚本生产。',
  workspaceType: 'short-video-script',
  defaultStageId: 'topic-positioning',
  exportTargets: ['markdown', 'txt', 'json'],
  stages: [
    {
      id: 'topic-positioning',
      title: '选题定位',
      description: '明确主题、平台、受众和内容目标。',
      component: 'short-video',
      requiredInputs: ['topic', 'platform', 'audience'],
      outputs: ['positioning'],
      aiActions: [
        { id: 'generate-topic', label: '生成选题建议', type: 'generate', primary: true }
      ]
    },
    {
      id: 'hook',
      title: '爆点 / 钩子',
      description: '生成开头 3 秒、痛点、冲突和吸引点。',
      component: 'short-video',
      requiredInputs: ['positioning'],
      outputs: ['hooks'],
      aiActions: [
        { id: 'generate-hooks', label: '生成爆点钩子', type: 'generate', primary: true }
      ]
    },
    {
      id: 'script',
      title: '正文脚本',
      description: '生成完整口播或剧情脚本。',
      component: 'short-video',
      requiredInputs: ['hook', 'sellingPoints'],
      outputs: ['script'],
      aiActions: [
        { id: 'generate-script', label: '生成正文脚本', type: 'generate', primary: true },
        { id: 'rewrite-script', label: '改写风格', type: 'rewrite' }
      ]
    },
    {
      id: 'shot-subtitle',
      title: '分镜 / 字幕',
      description: '拆分镜头、字幕节奏和画面提示。',
      component: 'short-video',
      requiredInputs: ['script'],
      outputs: ['shots', 'subtitles'],
      aiActions: [
        { id: 'generate-shots', label: '生成分镜字幕', type: 'generate', primary: true }
      ]
    },
    {
      id: 'platform-adaptation',
      title: '平台适配',
      description: '根据抖音、视频号、小红书等平台调整表达。',
      component: 'short-video',
      requiredInputs: ['script'],
      outputs: ['adaptedScript'],
      aiActions: [
        { id: 'adapt-platform', label: '生成平台适配版', type: 'rewrite', primary: true }
      ]
    }
  ]
}
```

### 4.2 AI 漫剧大纲工作流

```ts
export const comicDramaOutlineWorkflow: WorkflowSpec = {
  id: 'comic-drama-outline-workflow',
  name: 'AI 漫剧大纲工作流',
  description: '用于故事设定、人物、分集、剧情节点，并预留 Media Master JSON。',
  workspaceType: 'comic-drama-outline',
  defaultStageId: 'story-premise',
  exportTargets: ['markdown', 'txt', 'json', 'media-master-json'],
  stages: [
    {
      id: 'story-premise',
      title: '故事设定',
      description: '确定题材、核心冲突、世界观和故事卖点。',
      component: 'comic-drama',
      requiredInputs: ['genre', 'theme', 'conflict'],
      outputs: ['premise'],
      aiActions: [
        { id: 'generate-premise', label: '生成故事设定', type: 'generate', primary: true }
      ]
    },
    {
      id: 'characters',
      title: '人物设定',
      description: '生成主角、反派、配角和人物关系。',
      component: 'comic-drama',
      requiredInputs: ['premise'],
      outputs: ['characters', 'relationships'],
      aiActions: [
        { id: 'generate-characters', label: '生成人物卡', type: 'generate', primary: true }
      ]
    },
    {
      id: 'episode-outline',
      title: '分集大纲',
      description: '拆分剧集结构、每集冲突、转折和悬念。',
      component: 'comic-drama',
      requiredInputs: ['premise', 'characters'],
      outputs: ['episodes'],
      aiActions: [
        { id: 'generate-episodes', label: '生成分集大纲', type: 'outline', primary: true }
      ]
    },
    {
      id: 'scene-conflict',
      title: '场景 / 冲突',
      description: '提取场景、冲突节点和关键剧情节拍。',
      component: 'comic-drama',
      requiredInputs: ['episodes'],
      outputs: ['scenes', 'beats'],
      aiActions: [
        { id: 'generate-scenes', label: '生成场景冲突', type: 'generate', primary: true }
      ]
    },
    {
      id: 'media-master-export',
      title: 'Media Master 导出',
      description: '整理为 Media Master 可读取的结构化 JSON。',
      component: 'comic-drama',
      requiredInputs: ['premise', 'characters', 'episodes', 'scenes'],
      outputs: ['mediaMasterJson'],
      aiActions: [
        { id: 'prepare-media-json', label: '整理 Media Master JSON', type: 'export', primary: true }
      ]
    }
  ]
}
```

### 4.3 商业文案工作流

```ts
export const businessCopyWorkflow: WorkflowSpec = {
  id: 'business-copy-workflow',
  name: '商业文案工作流',
  description: '用于产品介绍、广告文案、招商文案、销售页和品牌介绍。',
  workspaceType: 'business-copy',
  defaultStageId: 'product-info',
  exportTargets: ['markdown', 'txt', 'json'],
  stages: [
    {
      id: 'product-info',
      title: '产品信息',
      description: '整理产品、品牌、价格、权益和基础卖点。',
      component: 'business-copy',
      requiredInputs: ['productName', 'category', 'features'],
      outputs: ['productBrief'],
      aiActions: [
        { id: 'generate-product-brief', label: '整理产品信息', type: 'generate', primary: true }
      ]
    },
    {
      id: 'audience-pain',
      title: '用户痛点',
      description: '分析目标用户、使用场景和核心痛点。',
      component: 'business-copy',
      requiredInputs: ['audience', 'scenario'],
      outputs: ['painPoints'],
      aiActions: [
        { id: 'generate-pain-points', label: '提炼用户痛点', type: 'generate', primary: true }
      ]
    },
    {
      id: 'selling-points',
      title: '卖点提炼',
      description: '将产品能力转化为用户利益和信任理由。',
      component: 'business-copy',
      requiredInputs: ['productBrief', 'painPoints'],
      outputs: ['sellingPoints'],
      aiActions: [
        { id: 'generate-selling-points', label: '生成卖点', type: 'generate', primary: true }
      ]
    },
    {
      id: 'copywriting',
      title: '文案生成',
      description: '生成主文案、标题、短句、行动引导。',
      component: 'business-copy',
      requiredInputs: ['sellingPoints'],
      outputs: ['copy'],
      aiActions: [
        { id: 'generate-copy', label: '生成商业文案', type: 'generate', primary: true },
        { id: 'rewrite-copy', label: '改写风格', type: 'rewrite' }
      ]
    },
    {
      id: 'channel-versions',
      title: '渠道版本',
      description: '生成小红书、朋友圈、落地页、招商、广告等版本。',
      component: 'business-copy',
      requiredInputs: ['copy'],
      outputs: ['channelCopies'],
      aiActions: [
        { id: 'generate-channel-versions', label: '生成渠道版本', type: 'rewrite', primary: true }
      ]
    }
  ]
}
```

---

## Step 5：新增 Workflow Registry

新增：

```text
src/modules/text-master/workflows/workflowRegistry.ts
```

建议结构：

```ts
import type { WorkflowSpec } from './types'
import { shortVideoScriptWorkflow } from './shortVideoScriptWorkflow'
import { comicDramaOutlineWorkflow } from './comicDramaOutlineWorkflow'
import { businessCopyWorkflow } from './businessCopyWorkflow'

export const workflowRegistry: WorkflowSpec[] = [
  shortVideoScriptWorkflow,
  comicDramaOutlineWorkflow,
  businessCopyWorkflow
]

export function getWorkflowById(workflowId?: string): WorkflowSpec {
  return (
    workflowRegistry.find((workflow) => workflow.id === workflowId) ??
    shortVideoScriptWorkflow
  )
}

export function getDefaultStageId(workflowId?: string): string {
  return getWorkflowById(workflowId).defaultStageId
}
```

如果新增了 generic-text-workflow，可以把 fallback 改成 generic。  
但不要为了 fallback 大量开发新的通用工作流页面。

---

## Step 6：TextProject 增加 workflow 字段

找到 TextProject 类型，新增：

```ts
workflowId: string
workspaceType: WorkspaceType
currentStageId: string
```

兼容旧项目：

```text
1. 旧项目没有 workflowId 时，根据 templateId 找模板。
2. 如果模板有 workflowId，用模板 workflowId。
3. 如果仍找不到，fallback 到 short-video-script-workflow 或 generic-text-workflow。
4. currentStageId 缺失时，用对应 WorkflowSpec.defaultStageId。
```

创建项目时：

```text
1. 用户选择模板。
2. 读取 template.workflowId。
3. 写入 project.workflowId。
4. 写入 project.workspaceType。
5. 写入 project.currentStageId = workflow.defaultStageId。
```

需要检查：

```text
ProjectCreate.vue
projectService.ts
LocalRuntime.ts
```

---

## Step 7：建立统一工作台外壳 WorkspaceShell

新增或改造：

```text
src/modules/text-master/components/workspace/WorkspaceShell.vue
```

它只负责统一布局，不负责具体文本类型业务。

建议结构：

```text
WorkspaceShell
├─ 顶部栏：项目名 / 工作流名 / 当前阶段 / 导出 / 设置
├─ 左侧：WorkflowSidebar
├─ 中间：WorkflowRenderer
├─ 右侧：AssistantPanel / AssetPanel
└─ 状态区：运行状态 / 错误提示
```

必须保留当前设计风格：

```text
深色背景
灰黑卡片
蓝紫主按钮
弱边框
大圆角
卡片化布局
```

不要把 UI 改成普通后台表格。

---

## Step 8：建立 WorkflowSidebar

新增：

```text
src/modules/text-master/components/workspace/WorkflowSidebar.vue
```

作用：

```text
1. 显示当前 workflow.stages。
2. 高亮 currentStageId。
3. 点击阶段时更新 currentStageId。
4. 阶段项以卡片/胶囊/侧边导航形式呈现，保持原设计风格。
```

注意：

```text
1. 切换阶段不要丢失当前文档。
2. 如果项目已有阶段导航样式，优先复用。
3. 切换 currentStageId 时要持久化到项目，或至少在当前页面状态中保持。
```

---

## Step 9：建立 WorkflowRenderer

新增：

```text
src/modules/text-master/components/workspace/WorkflowRenderer.vue
```

作用：

```text
1. 接收 workflow、currentStageId、project。
2. 找到当前 stage。
3. 根据 stage.component 渲染不同阶段面板。
```

建议渲染逻辑：

```vue
<GenericStagePanel v-if="stage.component === 'generic'" />
<ShortVideoStagePanel v-else-if="stage.component === 'short-video'" />
<ComicDramaStagePanel v-else-if="stage.component === 'comic-drama'" />
<BusinessCopyStagePanel v-else-if="stage.component === 'business-copy'" />
<GenericStagePanel v-else />
```

不要在 `ProjectWorkspace.vue` 里写大量 if/else。  
`ProjectWorkspace.vue` 只负责拿项目、拿 workflow、传给 WorkspaceShell。

---

## Step 10：建立三个轻量 Stage Panel

本轮不要做复杂业务，只要把不同工作流的差异先体现出来。

新增：

```text
src/modules/text-master/components/workflow-stages/ShortVideoStagePanel.vue
src/modules/text-master/components/workflow-stages/ComicDramaStagePanel.vue
src/modules/text-master/components/workflow-stages/BusinessCopyStagePanel.vue
src/modules/text-master/components/workflow-stages/GenericStagePanel.vue
```

每个 Stage Panel 至少显示：

```text
1. 当前阶段标题
2. 当前阶段描述
3. 所需输入 requiredInputs
4. 产出 outputs
5. AI 操作 aiActions
6. 主按钮
7. 一个文本输入区或说明区
8. 候选结果入口或调用现有生成逻辑的按钮
```

注意：

```text
1. 本轮不需要把每个阶段都做成完整业务。
2. 重点是跑通“不同工作流渲染不同工作区”。
3. 可以先复用现有 MockProvider / generateText 流程。
4. 不能破坏 Candidate / Document / Version 的现有逻辑。
```

---

## Step 11：改造 ProjectWorkspace

目标：

```text
ProjectWorkspace 不再把所有文本类型当成一个固定工作台。
它应该：
1. 加载 project。
2. 读取 project.workflowId。
3. 从 workflowRegistry 获取 workflow。
4. 读取 project.currentStageId。
5. 渲染 WorkspaceShell。
```

伪逻辑：

```ts
const workflow = computed(() => getWorkflowById(project.value?.workflowId))
const currentStageId = computed(() =>
  project.value?.currentStageId || workflow.value.defaultStageId
)
```

渲染：

```vue
<WorkspaceShell
  :project="project"
  :workflow="workflow"
  :current-stage-id="currentStageId"
  @change-stage="handleChangeStage"
/>
```

`handleChangeStage`：

```text
1. 更新本地 currentStageId。
2. 尽量保存到 project.currentStageId。
3. 不影响正文、候选和版本。
```

---

## Step 12：让首页 / 模板中心 / 新建项目进入正确工作流

检查：

```text
Home.vue
Templates.vue
ProjectCreate.vue
```

要求：

```text
1. 首页快速模板点击后，能进入对应模板的新建/创建流程。
2. 模板中心点击模板后，能创建或进入对应 workflowId 的项目。
3. 新建项目时，project.workflowId 必须来自 template.workflowId。
4. 新建项目后进入 ProjectWorkspace，显示对应工作流左侧步骤。
```

验收例子：

```text
选择短视频脚本模板
→ 新建项目
→ 进入工作台
→ 左侧显示：选题定位、爆点/钩子、正文脚本、分镜/字幕、平台适配

选择 AI 漫剧大纲模板
→ 新建项目
→ 进入工作台
→ 左侧显示：故事设定、人物设定、分集大纲、场景/冲突、Media Master 导出

选择商业文案模板
→ 新建项目
→ 进入工作台
→ 左侧显示：产品信息、用户痛点、卖点提炼、文案生成、渠道版本
```

---

## Step 13：保持现有生成/候选/版本/导出能力不被破坏

本轮可以复用现有生成按钮和 MockProvider。  
但必须保证：

```text
1. 点击 AI 操作按钮时，不白屏。
2. 候选结果仍进入 Candidate。
3. 应用候选仍能进入 Document。
4. 保存版本仍能生成 Version。
5. 导出入口仍然可达。
```

如果当前某些能力原本就是 Mock，可以保留 Mock，但必须明确显示 Mock / Local 状态。

---

## Step 14：补最小审计记录

如果项目已有 MVP audit，尽量让它覆盖：

```text
1. 三个模板是否存在 workflowId。
2. 三个 workflow 是否存在。
3. 新项目是否写入 workflowId/currentStageId。
4. ProjectWorkspace 是否能根据 workflowId 渲染不同阶段。
```

如果 audit 脚本改动风险高，本轮可以先不改 audit 脚本，但要在最终报告写入：

```text
未完成：MVP audit 尚未覆盖 WorkflowSpec 检查。
```

---

# 六、验收标准

本轮完成后，必须满足：

```text
1. Text Master 可以独立运行。
2. 不依赖 Brain Hub。
3. 三个 MVP 模板都绑定 workflowId。
4. 三个 WorkflowSpec 已注册。
5. 新建项目会写入 workflowId / workspaceType / currentStageId。
6. ProjectWorkspace 根据 workflowId 显示不同工作流步骤。
7. 切换阶段不白屏。
8. 页面保持原设计风格。
9. typecheck 通过。
10. build 通过。
```

如存在 audit 命令：

```text
11. audit:text-master:mvp 尽量通过。
12. audit:text-master:visual 尽量通过。
13. 如 audit 因旧脚本未覆盖新架构失败，需要说明原因，不要为了通过 audit 破坏架构。
```

---

# 七、必须执行的命令

必须执行：

```bash
npm run typecheck
npm run build
```

如果命令存在，必须执行：

```bash
npm run audit:text-master:mvp
npm run audit:text-master:visual
```

如果某个命令不存在，报告中说明：

```text
命令不存在 / package.json 未提供 / 执行失败原因
```

---

# 八、最终输出格式

完成后必须输出以下内容：

```text
# 本轮完成内容

# changed files

# 架构变化说明
- TemplateSpec 如何绑定 workflowId
- WorkflowSpec 新增了哪些
- WorkspaceShell / WorkflowRenderer 如何工作
- ProjectWorkspace 如何根据 workflowId 渲染

# 三个工作流验证
- 短视频脚本工作流
- AI 漫剧大纲工作流
- 商业文案工作流

# 验证结果
- npm run typecheck
- npm run build
- npm run audit:text-master:mvp
- npm run audit:text-master:visual

# 原设计风格影响
说明是否保留深色、高级灰、蓝紫强调、卡片化结构

# Brain Hub 影响
说明是否仍为可选适配，是否影响独立运行

# 未完成事项
必须诚实列出

# 下一轮建议
只建议 1-3 个任务

# 暂停等待人工复核
不要继续做下一轮任务
```

---

# 九、特别提醒

这一步的核心不是把每个工作流都做完，而是把**正确骨架**搭起来：

```text
模板不是只决定 prompt
模板决定 workflowId

工作台不是一个万能编辑器
工作台是统一外壳 + 不同工作流

通用化不是所有文本共用一个页面
通用化是共用 Project / Job / Candidate / Version / Export / Provider / Runtime
```

本轮最重要的成功标志：

> 选择不同模板后，进入同一个 Text Master 工作台外壳，但左侧步骤和中间工作区会根据不同文本类型变化。
