# Text Master Manual Visual Audit Guide

生成时间：2026-06-04T07:18:56.736Z

无法自动截图原因：未检测到本地 Playwright 依赖，按要求不自动安装依赖。

## 使用方式

1. 启动 Text Master 本地预览服务。
2. 如果不是默认地址，运行审核脚本前设置 `TEXT_MASTER_AUDIT_URL`。
3. 分别用浏览器打开下列路由，并在 `1440x900`、`1366x768` 两个尺寸截图。
4. 将截图和本目录下的 `visual-audit-report.md` 一起发给 ChatGPT 做 UI 复审。

## 独立路由

- /
- /projects
- /create
- /templates
- /settings
- /projects/mock-text-project-1

## /text-master 前缀路由

- /text-master
- /text-master/projects
- /text-master/create
- /text-master/templates
- /text-master/settings
- /text-master/projects/mock-text-project-1

## 截图命名建议

- home-1440x900.png
- home-1366x768.png
- projects-1440x900.png
- projects-1366x768.png
- create-1440x900.png
- create-1366x768.png
- templates-1440x900.png
- templates-1366x768.png
- settings-1440x900.png
- settings-1366x768.png
- workspace-1440x900.png
- workspace-1366x768.png

## 手动检查项

- 页面是否为黑色基底和高级灰卡片。
- 1366x768 下是否没有横向滚动。
- 工作台中间区域是否纵向滚动，右侧 AI 栏是否不遮挡正文。
- 长文本区域是否内部滚动而不是撑爆页面。
- 是否有明显控制台错误、白屏、404 或编码异常。
- 弹窗是否居中且不超过视口。
