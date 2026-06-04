const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'artifacts', 'text-master-visual-audit');
const REPORT_PATH = path.join(OUTPUT_DIR, 'visual-audit-report.md');
const MANUAL_GUIDE_PATH = path.join(OUTPUT_DIR, 'manual-audit-guide.md');
const BASE_URL =
  process.env.TEXT_MASTER_AUDIT_URL ||
  process.env.TEXT_MASTER_BASE_URL ||
  'http://127.0.0.1:5173';
const ROUTE_PREFIX = normalizePrefix(process.env.TEXT_MASTER_ROUTE_PREFIX);

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
];

const ROUTES = [
  { key: 'home', label: '首页', path: '/' },
  { key: 'projects', label: '项目中心', path: '/projects' },
  { key: 'create', label: '新建项目', path: '/create' },
  { key: 'templates', label: '模板中心', path: '/templates' },
  { key: 'settings', label: '设置页', path: '/settings' },
  {
    key: 'workspace',
    label: '工作台 Mock 项目',
    path: '/projects/mock-text-project-1',
  },
];

main().catch((error) => {
  ensureOutputDir();
  writeManualGuide(`脚本执行失败：${error instanceof Error ? error.message : String(error)}`);
  writeReport({
    mode: 'manual',
    reason: `脚本执行失败：${error instanceof Error ? error.message : String(error)}`,
    routePrefix: ROUTE_PREFIX,
    results: [],
    consoleErrors: [],
    screenshots: [],
  });
  process.exitCode = 1;
});

async function main() {
  ensureOutputDir();

  const playwright = loadPlaywright();
  if (!playwright) {
    const reason = '未检测到本地 Playwright 依赖，按要求不自动安装依赖。';
    writeManualGuide(reason);
    writeReport({
      mode: 'manual',
      reason,
      routePrefix: ROUTE_PREFIX,
      results: [],
      consoleErrors: [],
      screenshots: [],
    });
    console.log(`Manual visual audit guide generated: ${MANUAL_GUIDE_PATH}`);
    return;
  }

  let browser;
  const results = [];
  const consoleErrors = [];
  const screenshots = [];

  try {
    browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const routePrefix = ROUTE_PREFIX ?? (await detectRoutePrefix(page));

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      for (const route of ROUTES) {
        const routePath = withPrefix(route.path, routePrefix);
        const url = new URL(routePath, ensureTrailingSlash(BASE_URL)).toString();
        const pageErrors = [];

        page.removeAllListeners('console');
        page.removeAllListeners('pageerror');
        page.on('console', (message) => {
          if (message.type() === 'error') {
            pageErrors.push(message.text());
          }
        });
        page.on('pageerror', (error) => {
          pageErrors.push(error.message);
        });

        const result = await auditPage(page, route, viewport, url, pageErrors);
        results.push(result);
        consoleErrors.push(
          ...pageErrors.map((message) => ({
            route: routePath,
            viewport: viewport.name,
            message,
          })),
        );

        if (result.screenshot) {
          screenshots.push(result.screenshot);
        }
      }
    }

    await context.close();

    writeReport({
      mode: 'auto',
      reason: '',
      routePrefix,
      results,
      consoleErrors,
      screenshots,
    });
    console.log(`Visual audit report generated: ${REPORT_PATH}`);
  } catch (error) {
    const reason = [
      '自动截图未完成。',
      error instanceof Error ? error.message : String(error),
      `请确认应用已启动，并设置 TEXT_MASTER_AUDIT_URL。当前默认地址：${BASE_URL}`,
    ].join(' ');

    writeManualGuide(reason);
    writeReport({
      mode: 'manual',
      reason,
      routePrefix: ROUTE_PREFIX,
      results,
      consoleErrors,
      screenshots,
    });
    console.log(`Manual visual audit guide generated: ${MANUAL_GUIDE_PATH}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function auditPage(page, route, viewport, url, pageErrors) {
  let status = 'n/a';
  let screenshot = '';
  let horizontalScroll = false;
  let obviousError = false;
  let title = '';

  try {
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    status = response ? response.status() : 'n/a';
    await page.waitForTimeout(250);

    const state = await page.evaluate(() => {
      const documentElement = document.documentElement;
      const body = document.body;
      const bodyText = body ? body.innerText : '';

      return {
        title: document.title,
        bodyText: bodyText.slice(0, 4000),
        scrollWidth: Math.max(
          documentElement.scrollWidth,
          body ? body.scrollWidth : 0,
        ),
        clientWidth: documentElement.clientWidth,
      };
    });

    title = state.title;
    horizontalScroll = state.scrollWidth > state.clientWidth + 1;
    obviousError =
      Number(status) >= 400 ||
      /(Cannot GET|404|Not Found|ReferenceError|SyntaxError|Unhandled Runtime Error)/i.test(
        state.bodyText,
      ) ||
      pageErrors.length > 0;

    const screenshotFile = `${route.key}-${viewport.name}.png`;
    screenshot = path.join(OUTPUT_DIR, screenshotFile);
    await page.screenshot({
      path: screenshot,
      fullPage: false,
    });
  } catch (error) {
    obviousError = true;
    pageErrors.push(error instanceof Error ? error.message : String(error));
  }

  return {
    page: route.label,
    route: route.path,
    url,
    viewport: viewport.name,
    status,
    horizontalScroll,
    obviousError,
    consoleErrorCount: pageErrors.length,
    title,
    screenshot,
  };
}

async function detectRoutePrefix(page) {
  if (ROUTE_PREFIX !== null) {
    return ROUTE_PREFIX;
  }

  const candidates = ['', '/text-master'];

  for (const candidate of candidates) {
    const testUrl = new URL(
      withPrefix('/', candidate),
      ensureTrailingSlash(BASE_URL),
    ).toString();

    try {
      const response = await page.goto(testUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 8000,
      });
      const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
      const usable =
        (!response || response.status() < 400) &&
        !/(Cannot GET|404|Not Found)/i.test(bodyText);

      if (usable) {
        return candidate;
      }
    } catch {
      // Try next candidate.
    }
  }

  return '';
}

function writeReport({ mode, reason, routePrefix, results, consoleErrors, screenshots }) {
  const screenshotList = screenshots.length
    ? screenshots
        .map((file) => `- ${path.relative(ROOT_DIR, file).replace(/\\/g, '/')}`)
        .join('\n')
    : '- 未生成截图';
  const resultRows = results.length
    ? results
        .map((result) =>
          [
            result.page,
            `\`${result.viewport}\``,
            `\`${result.url}\``,
            result.status,
            result.horizontalScroll ? '是' : '否',
            result.obviousError ? '是' : '否',
            result.consoleErrorCount,
            result.screenshot
              ? path.relative(ROOT_DIR, result.screenshot).replace(/\\/g, '/')
              : '无',
          ].join(' | '),
        )
        .join('\n')
    : '';
  const errorSummary = consoleErrors.length
    ? consoleErrors
        .slice(0, 50)
        .map(
          (error) =>
            `- ${error.viewport} ${error.route}: ${error.message.replace(/\s+/g, ' ')}`,
        )
        .join('\n')
    : '- 未记录控制台错误';

  const report = [
    '# Text Master Visual Audit Report',
    '',
    `- 生成时间：${new Date().toISOString()}`,
    `- 模式：${mode === 'auto' ? '自动截图' : '手动审核说明'}`,
    `- Base URL：${BASE_URL}`,
    `- 路由前缀：${routePrefix || '(none)'}`,
    reason ? `- 说明：${reason}` : '',
    '',
    '## 页面访问状态',
    '',
    results.length
      ? [
          '页面 | 尺寸 | URL | 状态 | 横向滚动 | 明显报错 | 控制台错误数 | 截图',
          '--- | --- | --- | --- | --- | --- | --- | ---',
          resultRows,
        ].join('\n')
      : '未执行自动页面访问。',
    '',
    '## 控制台错误摘要',
    '',
    errorSummary,
    '',
    '## 截图文件列表',
    '',
    screenshotList,
    '',
    '## 建议检查点',
    '',
    '- 1440x900 和 1366x768 下是否存在横向滚动。',
    '- 工作台右侧 AI 操作栏是否遮挡正文。',
    '- 文本编辑区阅读行高、字号、滚动是否舒适。',
    '- 弹窗是否居中且不超出视口。',
    '- 是否存在大面积白底、过饱和色块或临时 Demo 感。',
    '',
  ]
    .filter(Boolean)
    .join('\n');

  fs.writeFileSync(REPORT_PATH, report, 'utf8');
}

function writeManualGuide(reason) {
  const standaloneRoutes = ROUTES.map((route) => route.path);
  const prefixedRoutes = ROUTES.map((route) => withPrefix(route.path, '/text-master'));
  const guide = [
    '# Text Master Manual Visual Audit Guide',
    '',
    `生成时间：${new Date().toISOString()}`,
    '',
    `无法自动截图原因：${reason}`,
    '',
    '## 使用方式',
    '',
    '1. 启动 Text Master 本地预览服务。',
    '2. 如果不是默认地址，运行审核脚本前设置 `TEXT_MASTER_AUDIT_URL`。',
    '3. 分别用浏览器打开下列路由，并在 `1440x900`、`1366x768` 两个尺寸截图。',
    '4. 将截图和本目录下的 `visual-audit-report.md` 一起发给 ChatGPT 做 UI 复审。',
    '',
    '## 独立路由',
    '',
    ...standaloneRoutes.map((route) => `- ${route}`),
    '',
    '## /text-master 前缀路由',
    '',
    ...prefixedRoutes.map((route) => `- ${route}`),
    '',
    '## 截图命名建议',
    '',
    ...ROUTES.flatMap((route) =>
      VIEWPORTS.map((viewport) => `- ${route.key}-${viewport.name}.png`),
    ),
    '',
    '## 手动检查项',
    '',
    '- 页面是否为黑色基底和高级灰卡片。',
    '- 1366x768 下是否没有横向滚动。',
    '- 工作台中间区域是否纵向滚动，右侧 AI 栏是否不遮挡正文。',
    '- 长文本区域是否内部滚动而不是撑爆页面。',
    '- 是否有明显控制台错误、白屏、404 或编码异常。',
    '- 弹窗是否居中且不超过视口。',
    '',
  ].join('\n');

  fs.writeFileSync(MANUAL_GUIDE_PATH, guide, 'utf8');
}

function loadPlaywright() {
  try {
    require.resolve('playwright');
    return require('playwright');
  } catch {
    return null;
  }
}

function ensureOutputDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function ensureTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

function normalizePrefix(value) {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') {
    return '';
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function withPrefix(routePath, prefix) {
  const normalizedPrefix = prefix ?? '';
  if (!normalizedPrefix) {
    return routePath;
  }

  if (routePath === '/') {
    return normalizedPrefix;
  }

  return `${normalizedPrefix}${routePath}`;
}
