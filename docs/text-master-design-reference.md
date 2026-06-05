# Text Master 全页面设计图对照规范

本文档是 Text Master 后续 UI 优化、视觉审计和验收评分的设计图对照基准。任何页面改动都应先找到对应设计图，再按本规范判断布局、视觉、内容优先级和操作层级，避免凭主观感觉调整 UI。

## 1. 设计图来源

设计图来自项目根目录中解压后的 `pages/` 目录。当前工作区的完整设计包路径为：

`TextMaster_all_pages_design_pack/pages/`

如果后续根目录出现直接解压的 `pages/` 目录，或其他完整设计包目录，应优先选择最新、且包含以下 14 张页面设计图的完整目录：

- `01_home.png`
- `02_create_project.png`
- `03_workspace_overview.png`
- `04_workspace_settings.png`
- `05_workspace_materials.png`
- `06_workspace_outline.png`
- `07_workspace_editor.png`
- `08_workspace_rewrite.png`
- `09_workspace_review.png`
- `10_workspace_versions.png`
- `11_exports.png`
- `12_templates.png`
- `13_settings.png`
- `14_user_profile.png`

辅助参考文件：

- `TextMaster_all_pages_design_pack/TextMaster_all_pages_contact_sheet.png`
- `TextMaster_all_pages_design_pack/README_页面清单.md`

## 2. 页面对应关系

| 设计图 | 页面 / 状态 | 建议路由或状态 | 主要实现位置 |
| --- | --- | --- | --- |
| `01_home.png` | 首页 / 项目中心 | `/`，并与 `/projects` 的项目中心体验保持一致 | `src/modules/text-master/pages/Home.vue`、`ProjectCenter.vue` |
| `02_create_project.png` | 新建项目 | `/create` | `src/modules/text-master/pages/ProjectCreate.vue` |
| `03_workspace_overview.png` | 工作台 / 项目总览 | `/projects/:projectId`，`overview` 状态 | `src/modules/text-master/pages/ProjectWorkspace.vue` |
| `04_workspace_settings.png` | 工作台 / 创作设定 | `/projects/:projectId`，`settings` 状态 | `src/modules/text-master/pages/ProjectWorkspace.vue` |
| `05_workspace_materials.png` | 工作台 / 资料库 | `/projects/:projectId`，`materials` 状态 | `src/modules/text-master/pages/ProjectWorkspace.vue` |
| `06_workspace_outline.png` | 工作台 / 大纲工厂 | `/projects/:projectId`，`outline` 状态 | `src/modules/text-master/pages/ProjectWorkspace.vue` |
| `07_workspace_editor.png` | 工作台 / 正文生产 | `/projects/:projectId`，`editor` 状态 | `src/modules/text-master/pages/ProjectWorkspace.vue` |
| `08_workspace_rewrite.png` | 工作台 / 改写工厂 | `/projects/:projectId`，`rewrite` 状态 | `src/modules/text-master/pages/ProjectWorkspace.vue` |
| `09_workspace_review.png` | 工作台 / 审核工厂 | `/projects/:projectId`，`review` 状态 | `src/modules/text-master/pages/ProjectWorkspace.vue` |
| `10_workspace_versions.png` | 工作台 / 版本记录 | `/projects/:projectId`，`versions` 状态 | `src/modules/text-master/pages/ProjectWorkspace.vue` |
| `11_exports.png` | 导出中心 | `/exports` | `src/modules/text-master/pages/Exports.vue` |
| `12_templates.png` | 模板中心 | `/templates` | `src/modules/text-master/pages/Templates.vue` |
| `13_settings.png` | 设置 | `/settings` | `src/modules/text-master/pages/Settings.vue` |
| `14_user_profile.png` | 用户资料 | `/profile` 或用户资料弹层；独立页更利于审计截图 | `src/modules/text-master/pages/UserProfile.vue` |

Text Master 必须保持独立 App 能力。Brain Hub 可以作为可选启动器、同步入口或适配状态出现，但不得成为本地运行、路由渲染、Mock AI、导出或视觉审计的硬依赖。

## 3. 全局视觉规则

- 深色背景：所有核心页面使用深色基底，禁止回退到大面积浅色后台页面。
- 高级灰卡片：主内容区、面板、列表项和信息块以低饱和灰黑卡片承载。
- 蓝紫色主强调：主按钮、当前状态、关键导航和选中态使用蓝紫色作为主强调。
- 绿色表示完成 / 可用：完成、已连接、Ready、可用、成功类状态使用绿色。
- 橙色表示待处理：待处理、队列中、需要操作、警示但非错误状态使用橙色。
- 红色表示风险：风险、错误、失败、危险操作和审核失败状态使用红色。
- 大圆角卡片：页面主要卡片使用较大圆角，避免生硬的普通表格感。
- 弱边框：使用低对比细边框，边框用于分层而不是抢视觉焦点。
- 卡片阴影不要太重：保留轻微层次即可，避免浮夸投影。
- 不允许大面积白底：除非设计图明确要求，否则不得使用白色大背景或白色大表格。
- 不允许普通后台表格风格：列表型内容优先卡片化、分组化或面板化，不使用密集表格作为主视觉。
- 信息密度保持生产工具感：页面应适合反复工作和快速扫描，不能变成营销落地页。
- 关键视口不得横向溢出：重点检查 `1440x900` 和 `1366x768`。

## 4. 首页特殊规则

首页必须以 `01_home.png` 为准，同时兼顾“首页 / 项目中心”的定位。

- 首页不展示“文本生产链路”卡片。
- 原文本生产链路位置改为快速模板。
- 原快速模板区域改为广告位 / 官方比赛栏目。
- 顶部保留用户资料按钮。
- 顶部不允许出现重复的新建项目按钮。
- 新建项目按钮只在 Hero 主区域出现。
- 首页不应呈现为 Brain Hub 子页面，应明确表达 Text Master 是独立文本生产 App。
- 首页与项目中心内容要保持一致的视觉语言，避免两个入口像不同产品。

## 5. 按钮和内容优先级规则

按钮和卡片层级按使用频率、重要度、描述字数和操作风险决定。

| 情况 | 规则 |
| --- | --- |
| 高频低风险 | 使用大按钮，位置靠前，视觉权重强。 |
| 高频中风险 | 使用二级按钮，靠近相关上下文。 |
| 低频高风险 | 弱化按钮，远离高频操作，并要求确认。 |
| 长描述内容 | 放宽卡片或放入详情区，不强行塞进密集小卡片。 |
| 短状态信息 | 使用胶囊、状态徽标或小卡片。 |
| 列表型功能 | 卡片化呈现，不使用密集表格作为默认样式。 |

补充规则：

- 一个区域内原则上只保留一个最强主操作。
- 导出、下载、删除、重置等操作不得比创建、继续生产等主流程更抢眼，除非当前页面就是导出中心。
- 破坏性操作必须有视觉隔离和确认机制。
- Mock 功能可以保留，但必须清楚表现为 Mock / Local 状态，而不是像真实失败功能。

## 6. 审计评分规则

每个主要页面以 100 分计，评分必须引用目标设计图和当前截图路径。建议页面级评分结构如下：

- 布局匹配：25 分
- 必要内容与标签：20 分
- 视觉风格匹配：20 分
- 操作层级和按钮位置：15 分
- `1440x900` 与 `1366x768` 可用性：10 分
- 无严重控制台错误、空白页、横向溢出：10 分

需要跟踪的页面设计符合度：

- 首页设计符合度：`homeDesignScore`
- 新建页设计符合度：`createProjectDesignScore`
- 工作台设计符合度：`workspaceDesignScore`
- 模板中心设计符合度：`templatesDesignScore`
- 导出中心设计符合度：`exportsDesignScore`
- 设置页设计符合度：`settingsDesignScore`
- 用户资料设计符合度：`userProfileDesignScore`
- 总体评分：`total`

### 首页设计符合度

首页评分必须额外检查：

- 不存在“文本生产链路”卡片。
- 快速模板占据原文本生产链路位置。
- 广告位 / 官方比赛栏目存在。
- 顶部存在用户资料按钮。
- 顶部不存在重复的新建项目按钮。
- Hero 主区域存在唯一主新建项目按钮。
- 深色专业生产工具风格清晰。
- 首页 / 项目中心内容定位一致。
- 无空白页、控制台严重错误或横向溢出。

### 新建页设计符合度

新建页评分应检查：

- 顶部导航、返回入口、帮助入口和页面标题完整。
- 左侧流程栏和辅助入口完整。
- 主区域步骤条、项目类型卡片、模板快捷入口完整。
- 默认类型、频率提示、右侧说明和底部操作符合设计图。
- 主按钮层级清楚，取消 / 返回等低频操作弱于主流程。

### 工作台设计符合度

工作台评分应覆盖全部内部状态：

- 左侧工作流导航存在，顺序与设计图一致。
- 中央工作区随状态切换。
- 右侧 AI / 操作面板在设计要求的位置出现。
- 项目总览对应 `03_workspace_overview.png`。
- 创作设定对应 `04_workspace_settings.png`。
- 资料库对应 `05_workspace_materials.png`。
- 大纲工厂对应 `06_workspace_outline.png`。
- 正文生产对应 `07_workspace_editor.png`。
- 改写工厂对应 `08_workspace_rewrite.png`。
- 审核工厂对应 `09_workspace_review.png`。
- 版本记录对应 `10_workspace_versions.png`。
- 导出入口保持可达。

### 其他页面设计符合度

- 模板中心对应 `12_templates.png`：检查模板分类、模板卡片、推荐模板和使用入口。
- 导出中心对应 `11_exports.png`：检查格式卡片、导出状态、目标入口和主操作。
- 设置页对应 `13_settings.png`：检查设置分组、运行模式、Mock / Local 状态和保存操作层级。
- 用户资料对应 `14_user_profile.png`：检查用户信息卡、头像、统计、偏好与账户状态区。

### 总体评分

总体设计评分按页面权重汇总：

- 首页 / 项目中心：20
- 新建项目：10
- 工作台：35
- 模板中心：10
- 导出中心：10
- 设置：10
- 用户资料：5

建议审计 JSON 输出结构：

```json
{
  "designReferenceScore": {
    "total": 0,
    "homeDesignScore": 0,
    "createProjectDesignScore": 0,
    "workspaceDesignScore": 0,
    "templatesDesignScore": 0,
    "exportsDesignScore": 0,
    "settingsDesignScore": 0,
    "userProfileDesignScore": 0,
    "deductions": [],
    "pages": [
      {
        "key": "home",
        "score": 0,
        "targetDesignImage": ["pages/01_home.png"],
        "currentScreenshot": "screenshots/home-1440x900.png"
      }
    ]
  }
}
```

Markdown 报告应增加 `## 设计图对照评分`，列出页面、分数、目标设计图、当前截图和主要扣分原因。

## 7. 验收标准

达到以下条件后，才认为可以进入细节精修或真实能力接入：

- 总分 `>= 95`。
- 首页 `>= 95`。
- 关键页面无横向溢出。
- `1440x900` 可用。
- `1366x768` 可用。
- 审计 zip 正常生成。
- 所有页面截图正常输出。
- 工作台所有子状态截图正常输出。
- 控制台无阻断级错误。
- Text Master 可独立运行，不依赖 Brain Hub 才能渲染页面。

## 8. 审计接入说明

当前项目存在 `npm run audit:text-master:visual`，入口为：

`scripts/audit-text-master-visual.mjs`

后续接入或维护设计评分时，审计脚本应做到：

- 自动定位完整设计图目录，优先顺序为：
  - `TextMaster_all_pages_design_pack/pages/`
  - `pages/`
  - 其他包含全部 14 张图的解压目录
- 审计开始前检查 14 张设计图是否存在。
- 为首页、新建、工作台、模板、导出、设置、用户资料分别生成页面截图。
- 工作台必须覆盖 8 个设计状态截图。
- 报告中保存目标设计图路径和当前截图路径。
- JSON 输出 `designReferenceScore`。
- Markdown 输出 `## 设计图对照评分`。
- Brain Hub 适配检查保持可选，不能因为缺少 Brain Hub 文件而让 Text Master 本地审计失败。

如果未来移除或尚未提供 `audit:text-master:visual`，不要为了评分强行改动项目结构；只在本文件记录待办，并等待确认后再单独建立审计脚本。

## 9. 后续优化原则

- 不为了分数盲目改业务 UI；改动必须同时符合目标设计图和本文档。
- 每次 UI 改动后都应重新运行类型检查、构建和视觉审计。
- 当设计图与业务真实需求冲突时，先记录冲突点，再由产品确认是否更新设计图或调整实现。
