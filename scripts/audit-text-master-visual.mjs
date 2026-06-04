import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_ROOT = path.join(ROOT_DIR, 'artifacts', 'text-master-visual-audit');
const TIMESTAMP = formatTimestamp(new Date());
const RUN_DIR = path.join(ARTIFACT_ROOT, TIMESTAMP);
const SCREENSHOT_DIR = path.join(RUN_DIR, 'screenshots');
const LOG_DIR = path.join(RUN_DIR, 'logs');
const REPORT_MD = path.join(RUN_DIR, 'visual-audit-report.md');
const REPORT_JSON = path.join(RUN_DIR, 'visual-audit-report.json');
const FUNCTIONAL_REPORT_JSON = path.join(RUN_DIR, 'functional-audit-report.json');
const ROUTE_STATUS_JSON = path.join(RUN_DIR, 'route-status.json');
const CONSOLE_ERRORS_JSON = path.join(RUN_DIR, 'console-errors.json');
const OVERFLOW_REPORT_JSON = path.join(RUN_DIR, 'overflow-report.json');
const BRAIN_HUB_REPORT_JSON = path.join(RUN_DIR, 'brain-hub-adapter-report.json');
const MANUAL_GUIDE_MD = path.join(RUN_DIR, 'manual-audit-guide.md');
const ZIP_PATH = path.join(RUN_DIR, `text-master-visual-audit-${TIMESTAMP}.zip`);
const AUDIT_LOG = path.join(LOG_DIR, 'audit.log');
const DEV_STDOUT_LOG = path.join(LOG_DIR, 'dev-server.out.log');
const DEV_STDERR_LOG = path.join(LOG_DIR, 'dev-server.err.log');
const PLAYWRIGHT_INSTALL_LOG = path.join(LOG_DIR, 'playwright-install.log');
const PLAYWRIGHT_BROWSER_LOG = path.join(LOG_DIR, 'playwright-browser-install.log');
const COMMAND_TIMEOUT_MS = 5 * 60 * 1000;
const PLAYWRIGHT_BROWSERS_PATH =
  process.env.PLAYWRIGHT_BROWSERS_PATH?.trim() ||
  path.join(ROOT_DIR, 'node_modules', '.cache', 'ms-playwright');

const ENV_BASE_URL = process.env.TEXTMASTER_AUDIT_URL?.trim();
const BASE_PATH = normalizeBasePath(process.env.TEXTMASTER_AUDIT_BASE_PATH ?? '');
const PROJECT_ID = process.env.TEXTMASTER_AUDIT_PROJECT_ID?.trim() || 'mock-text-project-1';
const BROWSER_EXECUTABLE_PATH = process.env.TEXTMASTER_AUDIT_BROWSER_PATH?.trim() || '';

process.env.PLAYWRIGHT_BROWSERS_PATH = PLAYWRIGHT_BROWSERS_PATH;
const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
];
const WORKSPACE_VIEWPORT = { name: '1440x900', width: 1440, height: 900 };
const FUNCTIONAL_VIEWPORT = { name: 'functional-1440x900', width: 1440, height: 900 };

const INDEPENDENT_PAGES = [
  { key: 'home', label: 'Home', path: '/' },
  { key: 'projects', label: 'Projects', path: '/projects', extra: true },
  { key: 'create', label: 'Create Project', path: '/create' },
  { key: 'workspace', label: 'Workspace', path: `/projects/${encodeURIComponent(PROJECT_ID)}` },
  { key: 'templates', label: 'Templates', path: '/templates' },
  { key: 'exports', label: 'Exports', path: '/exports' },
  { key: 'settings', label: 'Settings', path: '/settings' },
];

const WORKSPACE_STEPS = [
  { key: 'workspace-overview', label: 'Workspace overview', expectedText: '项目总览', navIndex: 0 },
  { key: 'workspace-settings', label: 'Workspace settings', expectedText: '创作设定', navIndex: 1 },
  { key: 'workspace-materials', label: 'Workspace materials', expectedText: '资料库', navIndex: 2 },
  { key: 'workspace-outline', label: 'Workspace outline', expectedText: '大纲工厂', navIndex: 3 },
  { key: 'workspace-editor', label: 'Workspace editor', expectedText: '正文生产', navIndex: 4 },
  { key: 'workspace-rewrite', label: 'Workspace rewrite', expectedText: '改写工厂', navIndex: 5 },
  { key: 'workspace-review', label: 'Workspace review', expectedText: '审核工厂', navIndex: 6 },
  { key: 'workspace-versions', label: 'Workspace versions', expectedText: '版本记录', navIndex: 7 },
  { key: 'workspace-export', label: 'Workspace export', expectedText: '导出中心', navIndex: 8 },
];

const FUNCTIONAL_STATUS_KEYS = [
  'passed',
  'failed',
  'warning',
  'skipped',
  'passed-with-mock',
  'optional-missing',
];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let j = 0; j < 8; j += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value >>> 0;
  }
  return table;
})();

const auditState = {
  startedAt: new Date().toISOString(),
  finishedAt: '',
  runDir: RUN_DIR,
  baseUrl: '',
  basePath: BASE_PATH,
  projectId: PROJECT_ID,
  mode: 'auto',
  usedPlaywright: false,
  installedPlaywright: false,
  startedDevServer: false,
  manualReason: '',
  screenshotCount: 0,
  consoleErrorCount: 0,
  overflowPageCount: 0,
  failedPageCount: 0,
  blankPageCount: 0,
  results: [],
  consoleErrors: [],
  overflowReports: [],
  routeStatuses: [],
  functionalResults: [],
  functionalSummary: createFunctionalSummary(),
  score: createEmptyScore(),
  scoreContext: {
    workspace: {},
  },
  screenshots: [],
  logs: [],
  brainHubAdapter: {},
};

await main();
process.exit(process.exitCode ?? 0);

async function main() {
  ensureDirectories();
  logLine('Text Master visual audit started.');
  let devServer = null;
  let browser = null;

  try {
    const playwright = await ensurePlaywright();
    if (!playwright) {
      await writeManualOutputs(
        auditState.manualReason || 'Playwright is not available and could not be installed safely.',
      );
      return;
    }

    auditState.usedPlaywright = true;
    auditState.brainHubAdapter = await inspectBrainHubAdapter();

    if (ENV_BASE_URL) {
      auditState.baseUrl = normalizeBaseUrl(ENV_BASE_URL);
      logLine(`Using existing service from TEXTMASTER_AUDIT_URL: ${auditState.baseUrl}`);
    } else {
      devServer = await startDevServer();
      auditState.baseUrl = devServer.url;
      auditState.startedDevServer = true;
      logLine(`Started dev server at ${auditState.baseUrl}`);
    }

    browser = await launchChromiumWithRetry(playwright);
    await auditWithBrowser(browser);
    await writeAllReports();
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    logLine(`Audit failed: ${message}`);
    auditState.manualReason = message;
    await writeManualOutputs(message);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }

    if (devServer) {
      await stopDevServer(devServer);
    }

    auditState.finishedAt = new Date().toISOString();
    await writeAllReports();
    await createAuditZip();
    logLine(`Audit output: ${RUN_DIR}`);
    logLine(`Audit zip: ${ZIP_PATH}`);
  }
}

async function ensurePlaywright() {
  let playwright = await loadPlaywright();
  if (playwright) {
    logLine('Playwright detected in local dependencies.');
    return playwright;
  }

  const safe = canInstallPlaywright();
  if (!safe.ok) {
    logLine(`Playwright install skipped: ${safe.reason}`);
    auditState.manualReason = safe.reason;
    return null;
  }

  logLine('Playwright is missing. Installing as devDependency with npm.');
  const install = await runCommand(
    npmCommand(),
    ['install', '--save-dev', 'playwright'],
    ROOT_DIR,
    PLAYWRIGHT_INSTALL_LOG,
    {
      PLAYWRIGHT_BROWSERS_PATH,
      npm_config_audit: 'false',
      npm_config_fund: 'false',
    },
  );

  if (install.exitCode !== 0) {
    const reason = `npm install --save-dev playwright failed with exit code ${install.exitCode}.`;
    logLine(reason);
    auditState.manualReason = reason;
    return null;
  }

  auditState.installedPlaywright = true;
  playwright = await loadPlaywright();
  if (!playwright) {
    const reason = 'Playwright install completed but module could not be loaded.';
    logLine(reason);
    auditState.manualReason = reason;
    return null;
  }

  return playwright;
}

async function loadPlaywright() {
  try {
    const resolved = require.resolve('playwright', { paths: [ROOT_DIR] });
    const module = await import(pathToFileUrl(resolved));
    return module.chromium ? module : module.default ?? module;
  } catch {
    return null;
  }
}

function canInstallPlaywright() {
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return { ok: false, reason: 'package.json not found.' };
  }

  if (!fs.existsSync(path.join(ROOT_DIR, 'package-lock.json'))) {
    return {
      ok: false,
      reason: 'package-lock.json not found; package manager safety is unclear.',
    };
  }

  if (fs.existsSync(path.join(ROOT_DIR, 'pnpm-lock.yaml')) || fs.existsSync(path.join(ROOT_DIR, 'yarn.lock'))) {
    return {
      ok: false,
      reason: 'Multiple package manager lock files detected.',
    };
  }

  return { ok: true, reason: '' };
}

async function launchChromiumWithRetry(playwright) {
  if (BROWSER_EXECUTABLE_PATH) {
    if (!fs.existsSync(BROWSER_EXECUTABLE_PATH)) {
      throw new Error(`TEXTMASTER_AUDIT_BROWSER_PATH does not exist: ${BROWSER_EXECUTABLE_PATH}`);
    }

    logLine(`Using browser executable from TEXTMASTER_AUDIT_BROWSER_PATH: ${BROWSER_EXECUTABLE_PATH}`);
    return playwright.chromium.launch({
      headless: true,
      executablePath: BROWSER_EXECUTABLE_PATH,
    });
  }

  try {
    return await playwright.chromium.launch({ headless: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/Executable doesn't exist|browserType.launch|playwright install/i.test(message)) {
      throw error;
    }

    const localBrowser = findLocalChromiumBrowser();
    if (localBrowser) {
      logLine(`Using local ${localBrowser.type} executable: ${localBrowser.path}`);
      return playwright.chromium.launch({
        headless: true,
        executablePath: localBrowser.path,
      });
    }

    logLine('Chromium executable is missing. Running npx playwright install chromium.');
    const install = await runCommand(
      npxCommand(),
      ['playwright', 'install', 'chromium'],
      ROOT_DIR,
      PLAYWRIGHT_BROWSER_LOG,
      { PLAYWRIGHT_BROWSERS_PATH },
    );

    if (install.exitCode !== 0) {
      throw new Error(`npx playwright install chromium failed with exit code ${install.exitCode}.`);
    }

    return playwright.chromium.launch({ headless: true });
  }
}

function findLocalChromiumBrowser() {
  const candidates = [
    { type: 'edge', path: path.join(process.env.ProgramFiles ?? '', 'Microsoft', 'Edge', 'Application', 'msedge.exe') },
    {
      type: 'edge',
      path: path.join(process.env['ProgramFiles(x86)'] ?? '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    },
    { type: 'chrome', path: path.join(process.env.ProgramFiles ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe') },
    {
      type: 'chrome',
      path: path.join(process.env['ProgramFiles(x86)'] ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    },
    { type: 'webview2', path: findLatestWebView2() },
  ];

  return candidates.find((candidate) => candidate.path && fs.existsSync(candidate.path)) ?? null;
}

function findLatestWebView2() {
  const roots = [
    path.join(process.env['ProgramFiles(x86)'] ?? '', 'Microsoft', 'EdgeWebView', 'Application'),
    path.join(process.env.ProgramFiles ?? '', 'Microsoft', 'EdgeWebView', 'Application'),
  ];
  const executableName = 'msedgewebview2.exe';

  for (const root of roots) {
    if (!root || !fs.existsSync(root)) {
      continue;
    }

    const versions = fs
      .readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort(compareVersionDesc);

    for (const version of versions) {
      const executable = path.join(root, version, executableName);
      if (fs.existsSync(executable)) {
        return executable;
      }
    }
  }

  return '';
}

function compareVersionDesc(left, right) {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (rightParts[index] || 0) - (leftParts[index] || 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
}

async function startDevServer() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
  const devScriptName = packageJson.scripts?.['dev:web'] ? 'dev:web' : 'dev';
  if (!packageJson.scripts?.[devScriptName]) {
    throw new Error('No dev:web or dev script found in package.json.');
  }

  if (packageJson.scripts[devScriptName].includes('start-text-master-desktop')) {
    throw new Error('The visual audit needs a web dev server script. Add package.json script dev:web.');
  }

  const devCommand = commandForSpawn(npmCommand(), ['run', devScriptName]);
  const child = spawn(devCommand.command, devCommand.args, {
    cwd: ROOT_DIR,
    env: { ...process.env, FORCE_COLOR: '0' },
    shell: false,
    windowsHide: true,
  });

  const stdout = fs.createWriteStream(DEV_STDOUT_LOG, { flags: 'a' });
  const stderr = fs.createWriteStream(DEV_STDERR_LOG, { flags: 'a' });
  child.stdout?.pipe(stdout);
  child.stderr?.pipe(stderr);

  let output = '';
  child.stdout?.on('data', (chunk) => {
    output += stripAnsi(chunk.toString());
  });
  child.stderr?.on('data', (chunk) => {
    output += stripAnsi(chunk.toString());
  });

  const url = await waitForDevServerUrl(child, () => output);
  return { child, stdout, stderr, url };
}

async function waitForDevServerUrl(child, getOutput) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 60000) {
    if (child.exitCode !== null) {
      throw new Error(`dev server exited early with code ${child.exitCode}.`);
    }

    const parsedUrls = [...getOutput().matchAll(/https?:\/\/(?:127\.0\.0\.1|localhost):\d+/g)].map(
      (match) => match[0],
    );
    for (const url of parsedUrls) {
      if (await canFetch(url)) {
        return normalizeBaseUrl(url);
      }
    }

    await sleep(500);
  }

  throw new Error('Timed out waiting for dev server URL.');
}

async function canFetch(url) {
  try {
    const response = await fetch(url, { method: 'GET' });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function stopDevServer(devServer) {
  const child = devServer?.child ?? devServer;
  if (!child || child.exitCode !== null) {
    devServer?.stdout?.destroy();
    devServer?.stderr?.destroy();
    return;
  }

  logLine(`Stopping dev server PID ${child.pid}.`);
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }

  await waitForChildClose(child, 5000);
  devServer?.stdout?.destroy();
  devServer?.stderr?.destroy();
}

function waitForChildClose(child, timeoutMs) {
  if (!child || child.exitCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    child.once('close', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function auditWithBrowser(browser) {
  for (const viewport of VIEWPORTS) {
    for (const route of INDEPENDENT_PAGES) {
      await auditRouteScreenshot(browser, route, viewport, `${route.key}-${viewport.name}.png`);
    }
  }

  for (const step of WORKSPACE_STEPS) {
    await auditWorkspaceStep(browser, step);
  }

  await auditFunctionalLinks(browser);
}

async function auditRouteScreenshot(browser, route, viewport, screenshotName) {
  const url = routeUrl(route.path);
  const page = await browser.newPage({ viewport });
  const pageConsole = [];
  const pageExceptions = [];
  attachPageDiagnostics(page, pageConsole, pageExceptions, route.key, viewport.name);

  let responseStatus = null;
  let loadError = '';
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    responseStatus = response?.status() ?? null;
    await page.waitForTimeout(250);
  } catch (error) {
    loadError = error instanceof Error ? error.message : String(error);
  }

  const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
  const diagnostics = await evaluatePage(page).catch((error) => ({
    evaluationError: error instanceof Error ? error.message : String(error),
  }));
  let screenshotSaved = false;

  try {
    await page.screenshot({ path: screenshotPath, fullPage: false });
    screenshotSaved = fs.existsSync(screenshotPath);
  } catch (error) {
    loadError = [loadError, error instanceof Error ? error.message : String(error)]
      .filter(Boolean)
      .join(' | ');
  }

  const result = buildResult({
    kind: route.extra ? 'extra-page' : 'independent-page',
    key: route.key,
    label: route.label,
    route: route.path,
    url,
    viewport,
    responseStatus,
    loadError,
    diagnostics,
    pageConsole,
    pageExceptions,
    screenshotPath,
    screenshotSaved,
  });

  recordResult(result);
  await page.close();
}

async function auditWorkspaceStep(browser, step) {
  const viewport = WORKSPACE_VIEWPORT;
  const workspacePath = `/projects/${encodeURIComponent(PROJECT_ID)}`;
  const url = routeUrl(workspacePath);
  const page = await browser.newPage({ viewport });
  const pageConsole = [];
  const pageExceptions = [];
  attachPageDiagnostics(page, pageConsole, pageExceptions, step.key, viewport.name);

  let responseStatus = null;
  let loadError = '';
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    responseStatus = response?.status() ?? null;
    await clickWorkspaceStep(page, step);
    await page.waitForTimeout(300);
  } catch (error) {
    loadError = error instanceof Error ? error.message : String(error);
  }

  const screenshotPath = path.join(SCREENSHOT_DIR, `${step.key}-${viewport.name}.png`);
  const diagnostics = await evaluatePage(page).catch((error) => ({
    evaluationError: error instanceof Error ? error.message : String(error),
  }));
  let screenshotSaved = false;

  try {
    await page.screenshot({ path: screenshotPath, fullPage: false });
    screenshotSaved = fs.existsSync(screenshotPath);
  } catch (error) {
    loadError = [loadError, error instanceof Error ? error.message : String(error)]
      .filter(Boolean)
      .join(' | ');
  }

  const result = buildResult({
    kind: 'workspace-step',
    key: step.key,
    label: step.label,
    route: workspacePath,
    url,
    viewport,
    responseStatus,
    loadError,
    diagnostics,
    pageConsole,
    pageExceptions,
    screenshotPath,
    screenshotSaved,
  });

  recordResult(result);
  await page.close();
}

async function auditFunctionalLinks(browser) {
  logLine('Functional audit started.');
  await runFunctionalCheck('首页链路', (result) => auditHomeFunctional(browser, result));
  await runFunctionalCheck('新建项目链路', (result) => auditCreateProjectFunctional(browser, result));
  await runFunctionalCheck('工作台链路', (result) => auditWorkspaceFunctional(browser, result));
  await runFunctionalCheck('AI 操作链路', (result) => auditAiFunctional(browser, result));
  await runFunctionalCheck('导出链路', (result) => auditExportsFunctional(browser, result));
  await runFunctionalCheck('设置页链路', (result) => auditSettingsFunctional(browser, result));
  recordBrainHubFunctionalCheck();
  logLine('Functional audit finished.');
}

async function runFunctionalCheck(name, callback) {
  const result = {
    name,
    status: 'skipped',
    reason: 'Not executed.',
    screenshots: [],
    warnings: [],
    errors: [],
  };

  try {
    await callback(result);
    finalizeFunctionalResult(result);
  } catch (error) {
    result.errors.push({
      type: 'unexpected-error',
      message: error instanceof Error ? error.message : String(error),
    });
    finalizeFunctionalResult(result);
  }

  recordFunctionalResult(result);
}

async function auditHomeFunctional(browser, result) {
  const page = await newFunctionalPage(browser, result.name);
  try {
    const visit = await visitFunctionalRoute(page, '/', result, 'functional-home.png');
    if (!visit.ok) {
      return;
    }

    const checks = await page.evaluate(() => {
      const text = document.body?.innerText ?? '';
      const normalizedText = text.replace(/\s+/g, ' ');
      const visibleElements = Array.from(document.querySelectorAll('a, button, h1, h2, section, article')).filter(
        (element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        },
      );
      const linkHrefs = Array.from(document.querySelectorAll('a')).map((link) => link.getAttribute('href') ?? '');
      const textIncludes = (value) => normalizedText.includes(value);
      const topbar = document.querySelector('.tm-home-topbar');
      const topbarText = topbar?.textContent?.replace(/\s+/g, ' ') ?? '';
      const hero = document.querySelector('.tm-hero-panel');
      const heroText = hero?.textContent?.replace(/\s+/g, ' ') ?? '';
      const pipeline = document.querySelector('.tm-pipeline-card');
      const pipelineText = pipeline?.textContent?.replace(/\s+/g, ' ') ?? '';
      const projectCards = Array.from(document.querySelectorAll('.tm-project-card'));
      const projectCardText = projectCards.map((card) => card.textContent?.replace(/\s+/g, ' ') ?? '').join(' ');
      const tasksCard = document.querySelector('.tm-tasks-card');
      const templatesCard = document.querySelector('.tm-templates-card');
      const buttonLabels = Array.from(document.querySelectorAll('button, a')).map((element) =>
        (element.textContent ?? '').replace(/\s+/g, ' ').trim(),
      );
      const pipelineSteps = [
        '创作设定',
        '资料库',
        '大纲工厂',
        '正文生产',
        '改写工厂',
        '审核工厂',
        '版本记录',
        '导出中心',
      ];
      const pipelineStatuses = ['已完成', '已连接', '运行中', '待开始', '待处理', '自动开启', '可用'];
      const requiredTemplates = ['短剧分集大纲', '小说章节生成', '小红书文案', '项目 README'];

      return {
        hasTextMasterTitle: Boolean(
          Array.from(document.querySelectorAll('h1')).some((heading) =>
            (heading.textContent ?? '').includes('Text Master'),
          ) || document.title.includes('Text Master'),
        ),
        hasNewProjectExactText: textIncludes('新建文本项目'),
        hasNewProjectEntry: linkHrefs.some((href) => href.includes('/create')),
        hasRecentProjectsExactText: textIncludes('最近项目'),
        hasRecentProjectsArea: Boolean(document.querySelector('.tm-recent-panel, .tm-recent-list')),
        hasTemplatesExactText: textIncludes('模板中心'),
        hasTemplatesEntry: linkHrefs.some((href) => href.includes('/templates')),
        hasSettingsExactText: textIncludes('设置'),
        hasSettingsEntry: linkHrefs.some((href) => href.includes('/settings')),
        visibleInteractiveCount: visibleElements.length,
        hasHomeTestId: Boolean(document.querySelector('[data-testid="text-master-home"]')),
        topbar: {
          exists: Boolean(topbar),
          hasBrand: /TM/.test(topbarText) && /Text Master/.test(topbarText),
          hasProjectCenter: /项目中心/.test(topbarText) && linkHrefs.some((href) => href.includes('/projects')),
          hasTemplates: /模板中心/.test(topbarText) && linkHrefs.some((href) => href.includes('/templates')),
          hasExports: /导出中心/.test(topbarText) && linkHrefs.some((href) => href.includes('/exports')),
          hasSettings: /设置/.test(topbarText) && linkHrefs.some((href) => href.includes('/settings')),
          hasLocalMode: /Local Mode/.test(topbarText),
          hasBrainHubReady: /Brain Hub Ready/.test(topbarText),
          hasUserProfile: Boolean(document.querySelector('[data-testid="user-profile-button"]')) && /用户资料/.test(topbarText),
          hasDuplicateCreate: /新建文本项目|新建项目/.test(topbarText),
        },
        hero: {
          exists: Boolean(hero),
          hasLabel: /LOCAL WORKSPACE/.test(heroText),
          hasTitle: /Text Master/.test(heroText),
          hasSubtitle: /独立文本生产工厂/.test(heroText),
          hasDescription:
            /观点/.test(heroText) &&
            /资料/.test(heroText) &&
            /大纲/.test(heroText) &&
            /正文/.test(heroText) &&
            /改写/.test(heroText) &&
            /审核/.test(heroText) &&
            /导出/.test(heroText),
          hasCreateButton:
            Boolean(document.querySelector('[data-testid="home-create-project-button"]')) &&
            buttonLabels.includes('新建文本项目'),
          hasContinueButton: buttonLabels.includes('继续上次项目'),
          hasImportButton: buttonLabels.includes('导入文本'),
          hasTemplateButton: buttonLabels.includes('模板中心'),
          hasSuggestion: /今日建议/.test(heroText) && /便利店夜班/.test(heroText) && /分集大纲审核/.test(heroText),
        },
        pipeline: {
          exists: Boolean(pipeline),
          hasTitle: /文本生产链路/.test(pipelineText),
          stepCount: pipelineSteps.filter((step) => pipelineText.includes(step)).length,
          statusCount: pipelineStatuses.filter((status) => pipelineText.includes(status)).length,
          hasWorkbenchButton: /查看工作台/.test(pipelineText),
        },
        recentProjects: {
          cardCount: projectCards.length,
          hasCopyCard: /商业文案/.test(projectCardText) && /AI 写作工具发布文案/.test(projectCardText),
          hasDramaCard: /短剧项目/.test(projectCardText) && /便利店夜班/.test(projectCardText),
          hasSteps: /审核工厂/.test(projectCardText) && /大纲工厂/.test(projectCardText),
          hasProgress: /70%/.test(projectCardText) && /12%/.test(projectCardText),
          hasActions:
            /继续生产/.test(projectCardText) && /查看版本/.test(projectCardText) && /导出/.test(projectCardText),
        },
        todayAndTemplates: {
          hasTasksTitle: Boolean(tasksCard) && /今日生产任务/.test(tasksCard.textContent ?? ''),
          taskCount: Array.from(tasksCard?.querySelectorAll('li') ?? []).length,
          hasStartButton: Boolean(tasksCard) && /开始处理/.test(tasksCard.textContent ?? ''),
          hasTemplatesTitle: Boolean(templatesCard) && /快速模板/.test(templatesCard.textContent ?? ''),
          templateCount: requiredTemplates.filter((template) => templatesCard?.textContent?.includes(template)).length,
          hasAllTemplatesEntry: Boolean(templatesCard) && /查看全部模板/.test(templatesCard.textContent ?? ''),
        },
      };
    });
    auditState.scoreContext.home = checks;

    requireFunctional(result, checks.hasTextMasterTitle, 'Text Master 标题存在', '缺少 Text Master 标题。');
    requireFunctional(
      result,
      checks.hasNewProjectExactText || checks.hasNewProjectEntry,
      '新建文本项目入口存在',
      '缺少新建文本项目入口。',
    );
    warnIfFallback(
      result,
      !checks.hasNewProjectExactText && checks.hasNewProjectEntry,
      '新建项目入口存在，但按钮文案未匹配“新建文本项目”。',
    );
    requireFunctional(
      result,
      checks.hasRecentProjectsExactText || checks.hasRecentProjectsArea,
      '最近项目区存在',
      '缺少最近项目区。',
    );
    warnIfFallback(
      result,
      !checks.hasRecentProjectsExactText && checks.hasRecentProjectsArea,
      '最近项目区结构存在，但标题文案未匹配“最近项目”。',
    );
    requireFunctional(
      result,
      checks.hasTemplatesExactText || checks.hasTemplatesEntry,
      '模板中心入口存在',
      '缺少模板中心入口。',
    );
    warnIfFallback(
      result,
      !checks.hasTemplatesExactText && checks.hasTemplatesEntry,
      '模板中心入口存在，但文案未匹配“模板中心”。',
    );
    requireFunctional(
      result,
      checks.hasSettingsExactText || checks.hasSettingsEntry,
      '设置入口存在',
      '缺少设置入口。',
    );
    warnIfFallback(result, !checks.hasSettingsExactText && checks.hasSettingsEntry, '设置入口存在，但文案未匹配“设置”。');
  } finally {
    await page.close();
  }
}

async function auditCreateProjectFunctional(browser, result) {
  const page = await newFunctionalPage(browser, result.name);
  try {
    const visit = await visitFunctionalRoute(page, '/create', result, 'functional-create-step-1.png');
    if (!visit.ok) {
      return;
    }

    const firstStep = await page.evaluate(() => {
      const text = document.body?.innerText ?? '';
      const buttons = Array.from(document.querySelectorAll('button')).map((button, index) => ({
        index,
        text: button.innerText,
        disabled: button.disabled,
      }));
      return {
        text,
        hasTypePanel: Boolean(document.querySelector('.tm-type-grid')) || /项目类型|Project Type|Step 1/i.test(text),
        hasNovel: text.includes('小说项目'),
        hasShortDrama: text.includes('短剧项目'),
        hasBusinessCopy: text.includes('商业文案'),
        hasDocument: text.includes('项目文档'),
        buttons,
      };
    });

    requireFunctional(result, firstStep.hasTypePanel, '项目类型选择存在', '缺少项目类型选择。');
    requireFunctional(result, firstStep.hasNovel, '小说项目选项存在', '缺少小说项目选项。');
    requireFunctional(result, firstStep.hasShortDrama, '短剧项目选项存在', '缺少短剧项目选项。');
    requireFunctional(result, firstStep.hasBusinessCopy, '商业文案选项存在', '缺少商业文案选项。');
    requireFunctional(result, firstStep.hasDocument, '项目文档选项存在', '缺少项目文档选项。');

    const shortDramaButton = page.getByRole('button', { name: /短剧项目/ });
    if ((await shortDramaButton.count()) > 0) {
      await shortDramaButton.first().click();
    } else {
      const typeButtons = page.locator('.tm-type-grid button');
      if ((await typeButtons.count()) > 1) {
        await typeButtons.nth(1).click();
        addWarning(result, '短剧项目按钮文案未匹配，已按项目类型网格第二项选择。');
      } else {
        addError(result, 'missing-short-drama-button', '无法选择短剧项目。');
        return;
      }
    }

    const nextButton = page.getByRole('button', { name: /下一步|Next/i });
    if ((await nextButton.count()) > 0) {
      await nextButton.last().click();
    } else {
      const footerButtons = page.locator('.tm-create-footer button');
      if ((await footerButtons.count()) > 1) {
        await footerButtons.nth(1).click();
        addWarning(result, '下一步按钮文案未匹配，已按创建页 footer 主按钮进入下一步。');
      } else {
        addError(result, 'missing-next-button', '无法找到下一步按钮。');
        return;
      }
    }

    await page.waitForTimeout(250);
    await saveFunctionalScreenshot(page, result, 'functional-create-step-2.png');

    const secondStep = await page.evaluate(() => {
      const text = document.body?.innerText ?? '';
      const fields = Array.from(document.querySelectorAll('input, textarea, select')).filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      return {
        text,
        hasStep2: /Step 2|基础设定/i.test(text) || Boolean(document.querySelector('.tm-form-grid')),
        fieldCount: fields.length,
      };
    });

    requireFunctional(
      result,
      secondStep.hasStep2 && secondStep.fieldCount > 0,
      '已进入第二步基础设定',
      '未能进入第二步基础设定。',
    );
    warnIfFallback(
      result,
      secondStep.hasStep2 && !secondStep.text.includes('基础设定'),
      '基础设定表单存在，但标题文案未匹配“基础设定”。',
    );
  } finally {
    await page.close();
  }
}

async function auditWorkspaceFunctional(browser, result) {
  const page = await newFunctionalPage(browser, result.name);
  try {
    const workspacePath = `/projects/${encodeURIComponent(PROJECT_ID)}`;
    const visit = await visitFunctionalRoute(page, workspacePath, result, 'functional-workspace-initial.png');
    if (!visit.ok) {
      return;
    }

    const layout = await evaluateWorkspaceLayout(page);
    auditState.scoreContext.workspace.layout = layout;
    requireFunctional(result, layout.hasSidebar, '左侧流程导航存在', '工作台缺少左侧流程导航。');
    requireFunctional(result, layout.hasMain, '中央主工作区存在', '工作台缺少中央主工作区。');
    requireFunctional(result, layout.hasAiPanel, '右侧 AI 操作栏存在', '工作台缺少右侧 AI 操作栏。');
    requireFunctional(
      result,
      layout.hasThreeColumns,
      '工作台三栏结构存在',
      `工作台三栏结构缺失：sidebar=${layout.hasSidebar}, main=${layout.hasMain}, ai=${layout.hasAiPanel}`,
    );

    let previousSignature = await getWorkspaceMainSignature(page);
    const visitedSignatures = new Set([previousSignature]);
    const stepChecks = [];

    for (const step of WORKSPACE_STEPS) {
      const clicked = await clickWorkspaceStepByLabelOrIndex(page, step);
      const stepName = step.expectedText ?? step.label;
      if (!clicked.exact) {
        addWarning(result, `${stepName} 导航文案未精确匹配，已按索引 ${step.navIndex} 点击。`);
      }
      await page.waitForTimeout(250);

      const currentSignature = await getWorkspaceMainSignature(page);
      const changed = currentSignature !== previousSignature || !visitedSignatures.has(currentSignature);
      requireFunctional(
        result,
        changed || step.navIndex === 0,
        `${stepName} 主区域已更新`,
        `${stepName} 点击后主区域未检测到变化。`,
      );
      stepChecks.push({
        key: step.key,
        label: step.label,
        expectedText: step.expectedText,
        changed: changed || step.navIndex === 0,
        clickedExact: clicked.exact,
      });

      if (step.key === 'workspace-editor') {
        auditState.scoreContext.workspace.editor = await page.evaluate(() => ({
          hasTextEditor: Boolean(document.querySelector('.tm-markdown-editor textarea, textarea')),
          hasCandidatePanel: Boolean(document.querySelector('.tm-candidate-panel')),
        }));
      }

      previousSignature = currentSignature;
      visitedSignatures.add(currentSignature);
      await saveFunctionalScreenshot(page, result, `functional-${step.key}-1440x900.png`);
    }

    auditState.scoreContext.workspace.stepChecks = stepChecks;
    auditState.scoreContext.workspace.entries = await page.evaluate(() => {
      const navButtons = Array.from(document.querySelectorAll('.tm-workspace-sidebar button'));
      const buttonTexts = navButtons.map((button) => button.textContent ?? '');
      return {
        navCount: navButtons.length,
        hasVersionEntry:
          navButtons.length > 7 || buttonTexts.some((text) => /版本|Version|versions/i.test(text)),
        hasExportEntry:
          navButtons.length > 8 || buttonTexts.some((text) => /导出|Export|exports/i.test(text)),
      };
    });
  } finally {
    await page.close();
  }
}

async function auditAiFunctional(browser, result) {
  const page = await newFunctionalPage(browser, result.name);
  try {
    const workspacePath = `/projects/${encodeURIComponent(PROJECT_ID)}`;
    const visit = await visitFunctionalRoute(page, workspacePath, result, 'functional-ai-panel.png');
    if (!visit.ok) {
      return;
    }

    const initial = await page.evaluate(() => {
      const text = document.body?.innerText ?? '';
      return {
        hasAiPanel: Boolean(document.querySelector('.tm-ai-action-panel')),
        hasModelSelect:
          Boolean(document.querySelector('.tm-ai-action-panel select')) || /模型选择|Mock Text v0|AI Copilot/i.test(text),
        hasMockState: /Mock|mock/i.test(text),
        hasRewriteAction: /改写|Rewrite/i.test(text),
        hasReviewAction: /审核|Review/i.test(text),
      };
    });

    requireFunctional(result, initial.hasAiPanel, 'AI 操作栏存在', '缺少 AI 操作栏。');
    requireFunctional(result, initial.hasModelSelect, '模型选择存在', '缺少模型选择。');
    requireFunctional(result, initial.hasRewriteAction, '改写按钮或 Mock 状态存在', '缺少改写入口。');
    requireFunctional(result, initial.hasReviewAction, '审核按钮或 Mock 状态存在', '缺少审核入口。');
    markMockIf(result, initial.hasMockState, 'AI 操作栏当前为 Mock 状态。');

    await clickWorkspaceStepByLabelOrIndex(page, WORKSPACE_STEPS[3]);
    await page.waitForTimeout(200);
    const outline = await page.evaluate(() => {
      const text = document.body?.innerText ?? '';
      return {
        hasOutlineButton: /生成大纲|Outline Factory|大纲/i.test(text),
        hasMockState: /Mock|mock/i.test(text),
      };
    });
    requireFunctional(result, outline.hasOutlineButton, '生成大纲按钮存在', '缺少生成大纲按钮。');
    markMockIf(result, outline.hasMockState, '大纲生成链路存在 Mock 状态。');
    await saveFunctionalScreenshot(page, result, 'functional-ai-outline.png');

    await clickWorkspaceStepByLabelOrIndex(page, WORKSPACE_STEPS[4]);
    await page.waitForTimeout(200);
    const editor = await page.evaluate(() => {
      const text = document.body?.innerText ?? '';
      return {
        hasEditorButton: /生成正文|正文生产|Editor/i.test(text),
        hasMockState: /Mock|mock/i.test(text),
      };
    });
    requireFunctional(result, editor.hasEditorButton, '生成正文按钮存在', '缺少生成正文按钮。');
    markMockIf(result, editor.hasMockState, '正文生成链路存在 Mock 状态。');
    await saveFunctionalScreenshot(page, result, 'functional-ai-editor.png');
  } finally {
    await page.close();
  }
}

async function auditExportsFunctional(browser, result) {
  const page = await newFunctionalPage(browser, result.name);
  try {
    const visit = await visitFunctionalRoute(page, '/exports', result, 'functional-exports.png');
    if (!visit.ok) {
      return;
    }

    const checks = await page.evaluate(() => {
      const text = document.body?.innerText ?? '';
      const buttons = Array.from(document.querySelectorAll('button')).map((button) => button.innerText);
      return {
        hasMarkdown: text.includes('Markdown'),
        hasTxt: text.includes('TXT'),
        hasJson: text.includes('JSON'),
        hasExportButton: buttons.some((textValue) => /导出|选择格式|Export/i.test(textValue)) || /Export/i.test(text),
        hasMockState: /Mock|mock/i.test(text),
      };
    });

    requireFunctional(result, checks.hasMarkdown, 'Markdown 选项存在', '缺少 Markdown 选项。');
    requireFunctional(result, checks.hasTxt, 'TXT 选项存在', '缺少 TXT 选项。');
    requireFunctional(result, checks.hasJson, 'JSON 选项存在', '缺少 JSON 选项。');
    requireFunctional(result, checks.hasExportButton, '导出按钮存在', '缺少导出按钮或格式选择按钮。');
    markMockIf(result, checks.hasMockState, '导出链路当前包含 Mock 状态。');
  } finally {
    await page.close();
  }
}

async function auditSettingsFunctional(browser, result) {
  const page = await newFunctionalPage(browser, result.name);
  try {
    const visit = await visitFunctionalRoute(page, '/settings', result, 'functional-settings.png');
    if (!visit.ok) {
      return;
    }

    const checks = await page.evaluate(() => {
      const text = document.body?.innerText ?? '';
      return {
        hasLocalMode: /Local Mode|本地模式|local/i.test(text),
        hasMockAiOrModel: /Mock Text v0|Mock AI|默认模型|模型/i.test(text),
        hasAutoSave: /自动保存|auto save|Auto Save/i.test(text),
        hasExportSettings: /导出设置|Export|Markdown|TXT|JSON/i.test(text),
        mentionsBrainHub: /Brain Hub/i.test(text),
        hasMockState: /Mock|mock/i.test(text),
      };
    });

    requireFunctional(result, checks.hasLocalMode, '本地模式存在', '缺少本地模式设置。');
    requireFunctional(result, checks.hasMockAiOrModel, 'Mock AI 或模型设置存在', '缺少 Mock AI 或模型设置。');
    requireFunctional(result, checks.hasAutoSave, '自动保存设置存在', '缺少自动保存设置。');
    requireFunctional(result, checks.hasExportSettings, '导出设置存在', '缺少导出设置。');
    if (!checks.mentionsBrainHub) {
      addWarning(result, 'Brain Hub 设置未显示；该项为可选，不作为失败项。');
    }
    markMockIf(result, checks.hasMockState, '设置页当前包含 Mock 配置。');
  } finally {
    await page.close();
  }
}

function recordBrainHubFunctionalCheck() {
  const adapter = auditState.brainHubAdapter ?? {};
  const result = {
    name: 'Brain Hub Adapter 可选检查',
    status: 'passed',
    reason: 'Brain Hub Adapter is optional.',
    screenshots: [],
    warnings: [],
    errors: [],
  };

  if (!adapter.manifestExists && !adapter.brainHubRuntimeExists && !adapter.launchContextExists) {
    result.status = 'optional-missing';
    result.reason = 'Brain Hub Adapter 不存在；该集成为可选项。';
  } else {
    if (!adapter.launchTsExists) {
      addWarning(result, 'launch.ts 不存在；Brain Hub 启动入口当前由其他 adapter 文件承担或待补充。');
    }
    result.reason = 'Brain Hub Adapter optional files were inspected.';
  }

  finalizeFunctionalResult(result);
  recordFunctionalResult(result);
}

async function clickWorkspaceStep(page, step) {
  const selectors = [
    '.tm-workspace-sidebar nav button',
    'nav[aria-label="Workspace sections"] button',
  ];

  for (const selector of selectors) {
    const buttons = page.locator(selector);
    if ((await buttons.count()) > step.navIndex) {
      await buttons.nth(step.navIndex).click();
      return;
    }
  }

  throw new Error(`Workspace nav button not found at index ${step.navIndex}.`);
}

async function newFunctionalPage(browser, routeKey) {
  const page = await browser.newPage({ viewport: FUNCTIONAL_VIEWPORT });
  const pageConsole = [];
  const pageExceptions = [];
  attachPageDiagnostics(page, pageConsole, pageExceptions, routeKey, FUNCTIONAL_VIEWPORT.name);
  page.__textMasterAuditConsole = pageConsole;
  page.__textMasterAuditExceptions = pageExceptions;
  return page;
}

async function visitFunctionalRoute(page, routePath, result, screenshotName) {
  const url = routeUrl(routePath);
  let responseStatus = null;
  let loadError = '';

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    responseStatus = response?.status() ?? null;
    await page.waitForTimeout(250);
  } catch (error) {
    loadError = error instanceof Error ? error.message : String(error);
  }

  const diagnostics = await evaluatePage(page).catch((error) => ({
    evaluationError: error instanceof Error ? error.message : String(error),
  }));

  applyFunctionalPageHealth(result, {
    routePath,
    url,
    responseStatus,
    loadError,
    diagnostics,
    pageConsole: page.__textMasterAuditConsole ?? [],
    pageExceptions: page.__textMasterAuditExceptions ?? [],
  });

  await saveFunctionalScreenshot(page, result, screenshotName);

  return {
    ok: result.errors.length === 0,
    diagnostics,
  };
}

function applyFunctionalPageHealth(
  result,
  { routePath, url, responseStatus, loadError, diagnostics, pageConsole, pageExceptions },
) {
  const statusOk = Number(responseStatus) >= 200 && Number(responseStatus) < 400;

  if (loadError) {
    addError(result, 'page-access', `页面无法访问 ${routePath}: ${loadError}`);
  }

  if (!statusOk) {
    addError(result, 'page-status', `页面状态异常 ${routePath}: ${responseStatus ?? 'n/a'} (${url})`);
  }

  if (diagnostics?.evaluationError) {
    addError(result, 'page-evaluation', `页面诊断失败 ${routePath}: ${diagnostics.evaluationError}`);
  }

  if (diagnostics?.isBlankPage) {
    addError(result, 'blank-page', `页面空白 ${routePath}。`);
  }

  if (diagnostics?.hasKnownRuntimeErrorText) {
    addError(result, 'runtime-error-text', `页面包含运行时错误文本 ${routePath}。`);
  }

  if (diagnostics?.horizontalOverflow || diagnostics?.bodyWidthExceedsViewport) {
    addWarning(
      result,
      `页面存在横向滚动 ${routePath}: scrollWidth=${diagnostics?.scrollWidth}, clientWidth=${diagnostics?.clientWidth}`,
    );
  }

  for (const exception of pageExceptions) {
    addError(result, 'console-severe', `控制台严重错误: ${exception.text}`);
  }

  for (const item of pageConsole) {
    if (isSevereConsoleError(item.text)) {
      addError(result, 'console-severe', `控制台严重错误: ${item.text}`);
    } else {
      addWarning(result, `控制台普通错误: ${item.text}`);
    }
  }
}

function isSevereConsoleError(text) {
  return /(ReferenceError|TypeError|SyntaxError|RangeError|Unhandled|uncaught|Cannot read|is not defined|failed to fetch dynamically imported module|module script)/i.test(
    text,
  );
}

async function saveFunctionalScreenshot(page, result, screenshotName) {
  const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
  try {
    await page.screenshot({ path: screenshotPath, fullPage: false });
    if (fs.existsSync(screenshotPath)) {
      const relativePath = recordScreenshot(screenshotPath);
      if (!result.screenshots.includes(relativePath)) {
        result.screenshots.push(relativePath);
      }
    }
  } catch (error) {
    addError(
      result,
      'screenshot',
      `截图保存失败 ${screenshotName}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function evaluateWorkspaceLayout(page) {
  return page.evaluate(() => {
    const visible = (selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        return false;
      }
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const sidebar = document.querySelector('.tm-workspace-sidebar');
    const main = document.querySelector('.tm-workspace-main');
    const aiPanel = document.querySelector('.tm-ai-action-panel');
    const sidebarRect = sidebar?.getBoundingClientRect();
    const mainRect = main?.getBoundingClientRect();
    const aiRect = aiPanel?.getBoundingClientRect();

    return {
      hasSidebar: visible('.tm-workspace-sidebar'),
      hasMain: visible('.tm-workspace-main'),
      hasAiPanel: visible('.tm-ai-action-panel'),
      hasThreeColumns: Boolean(
        sidebarRect &&
          mainRect &&
          aiRect &&
          sidebarRect.right <= mainRect.left + 2 &&
          mainRect.right <= aiRect.left + 2 &&
          mainRect.width > 280,
      ),
      sidebarRect: rectToObject(sidebarRect),
      mainRect: rectToObject(mainRect),
      aiRect: rectToObject(aiRect),
    };

    function rectToObject(rect) {
      if (!rect) {
        return null;
      }
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
      };
    }
  });
}

async function getWorkspaceMainSignature(page) {
  return page.evaluate(() => {
    const main = document.querySelector('.tm-workspace-main');
    const activeButton = document.querySelector('.tm-workspace-sidebar button.active strong');
    const headings = Array.from(main?.querySelectorAll('h2, h3') ?? [])
      .map((heading) => heading.textContent?.trim())
      .filter(Boolean)
      .join(' | ');
    const controls = Array.from(main?.querySelectorAll('button, input, select, textarea') ?? []).length;
    return [activeButton?.textContent?.trim() ?? '', headings, controls, main?.textContent?.trim().length ?? 0].join(
      ' :: ',
    );
  });
}

async function clickWorkspaceStepByLabelOrIndex(page, step) {
  const expectedText = step.expectedText ?? step.label;
  const button = page.getByRole('button', { name: new RegExp(escapeRegExp(expectedText), 'i') });
  if ((await button.count()) > 0) {
    await button.first().click();
    return { exact: true };
  }

  await clickWorkspaceStep(page, step);
  return { exact: false };
}

function requireFunctional(result, condition, _passedMessage, errorMessage) {
  if (!condition) {
    addError(result, 'missing-functional-element', errorMessage);
  }
}

function warnIfFallback(result, condition, message) {
  if (condition) {
    addWarning(result, message);
  }
}

function markMockIf(result, condition, message) {
  if (condition) {
    result.hasMock = true;
    if (!result.warnings.includes(message)) {
      result.warnings.push(message);
    }
  }
}

function addWarning(result, message) {
  if (!result.warnings.includes(message)) {
    result.warnings.push(message);
  }
}

function addError(result, type, message) {
  result.errors.push({ type, message });
}

function finalizeFunctionalResult(result) {
  if (result.errors.length > 0) {
    result.status = 'failed';
    result.reason = `${result.errors.length} blocking issue(s) found.`;
    return;
  }

  if (result.status === 'optional-missing') {
    return;
  }

  if (result.status === 'skipped' && result.reason !== 'Not executed.') {
    return;
  }

  if (result.hasMock) {
    result.status = 'passed-with-mock';
    result.reason = 'Core controls are present and one or more functions are currently Mock.';
    return;
  }

  if (result.warnings.length > 0) {
    result.status = 'warning';
    result.reason = `${result.warnings.length} warning(s) found.`;
    return;
  }

  result.status = 'passed';
  result.reason = 'Functional chain passed.';
}

function recordFunctionalResult(result) {
  auditState.functionalResults.push({
    name: result.name,
    status: result.status,
    reason: result.reason,
    screenshots: result.screenshots,
    warnings: result.warnings,
    errors: result.errors,
  });
  recalculateSummary();
}

function createFunctionalSummary() {
  return Object.fromEntries(FUNCTIONAL_STATUS_KEYS.map((key) => [key, 0]));
}

function recordScreenshot(screenshotPath) {
  const relativeScreenshot = path.relative(RUN_DIR, screenshotPath).replace(/\\/g, '/');
  if (!auditState.screenshots.includes(relativeScreenshot)) {
    auditState.screenshots.push(relativeScreenshot);
  }
  return relativeScreenshot;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function attachPageDiagnostics(page, pageConsole, pageExceptions, routeKey, viewportName) {
  page.on('console', (message) => {
    if (message.type() === 'error') {
      pageConsole.push({
        routeKey,
        viewport: viewportName,
        type: 'console.error',
        text: message.text(),
      });
    }
  });
  page.on('pageerror', (error) => {
    pageExceptions.push({
      routeKey,
      viewport: viewportName,
      type: 'uncaught-exception',
      text: error.message,
    });
  });
}

async function evaluatePage(page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const bodyText = body?.innerText ?? '';
    const viewportWidth = window.innerWidth;
    const bodyRectWidth = body ? Math.ceil(body.getBoundingClientRect().width) : 0;
    const maxScrollWidth = Math.max(html.scrollWidth, body?.scrollWidth ?? 0);
    const visibleInteractiveCount = Array.from(
      document.querySelectorAll('button, a, input, select, textarea, [role="button"]'),
    ).filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }).length;
    const visibleMediaCount = Array.from(document.querySelectorAll('img, canvas, video, svg')).filter(
      (element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      },
    ).length;
    const visual = evaluateVisualStyle();

    return {
      title: document.title,
      bodyTextSample: bodyText.slice(0, 800),
      bodyTextLength: bodyText.trim().length,
      hasTextMasterKeyword: bodyText.includes('Text Master'),
      visibleInteractiveCount,
      hasMainAction: visibleInteractiveCount > 0,
      visibleMediaCount,
      viewportWidth,
      clientWidth: html.clientWidth,
      scrollWidth: maxScrollWidth,
      bodyRectWidth,
      horizontalOverflow: maxScrollWidth > html.clientWidth + 1 || bodyRectWidth > viewportWidth + 1,
      bodyWidthExceedsViewport: bodyRectWidth > viewportWidth + 1,
      isBlankPage: bodyText.trim().length < 20 && visibleMediaCount === 0,
      hasKnownRuntimeErrorText: /(Cannot GET|404|Not Found|ReferenceError|SyntaxError|Unhandled Runtime Error)/i.test(
        bodyText,
      ),
      visual,
    };

    function evaluateVisualStyle() {
      const viewportArea = Math.max(1, window.innerWidth * window.innerHeight);
      const visibleElements = Array.from(
        document.querySelectorAll('body, main, section, article, aside, header, nav, div, button, a, input, select, textarea'),
      ).filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      });
      const bodyBackground = firstPaintedBackground(document.body) ?? firstPaintedBackground(document.documentElement);
      const bodyHsl = bodyBackground ? rgbToHsl(bodyBackground.r, bodyBackground.g, bodyBackground.b) : null;
      const backgroundSamples = [];
      let weightedSaturation = 0;
      let weightedArea = 0;
      let largeWhiteBackground = false;

      for (const element of visibleElements) {
        const style = window.getComputedStyle(element);
        const color = parseCssColor(style.backgroundColor);
        if (!color) {
          continue;
        }

        const rect = element.getBoundingClientRect();
        const area = Math.max(1, Math.min(rect.width, window.innerWidth) * Math.min(rect.height, window.innerHeight));
        const hsl = rgbToHsl(color.r, color.g, color.b);
        const luminanceValue = luminance(color);
        backgroundSamples.push({ saturation: hsl.s, luminance: luminanceValue, area });
        weightedSaturation += hsl.s * area;
        weightedArea += area;

        if (luminanceValue > 0.9 && hsl.s < 0.15 && area > viewportArea * 0.25) {
          largeWhiteBackground = true;
        }
      }

      const cardElements = Array.from(
        document.querySelectorAll(
          [
            '.tm-panel',
            '.tm-summary-panel',
            '.tm-status-console',
            '.tm-workspace-card',
            '.tm-inner-card',
            '.tm-metric-card',
            '.tm-export-card',
            '.tm-settings-card',
            '.tm-recent-card',
            '.tm-workflow-card',
            '.tm-project-card',
            '.tm-template-card',
            '[class*="-card"]',
            '[class*="-panel"]',
          ].join(', '),
        ),
      ).filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 40 && rect.height > 30;
      });
      const cardProfiles = cardElements
        .map((element) => {
          const style = window.getComputedStyle(element);
          const bg = firstPaintedBackground(element);
          const radius = parseFloat(style.borderTopLeftRadius) || 0;
          if (!bg) {
            return { gray: false, radius };
          }
          const hsl = rgbToHsl(bg.r, bg.g, bg.b);
          const lum = luminance(bg);
          return {
            gray: hsl.s <= 0.28 && lum >= 0.004 && lum <= 0.42,
            radius,
          };
        })
        .filter(Boolean);
      const roundedCards = cardProfiles.filter((profile) => profile.radius >= 4).length;
      const radiusBuckets = Array.from(
        new Set(cardProfiles.map((profile) => Math.round(profile.radius)).filter((value) => value > 0)),
      );

      const interactiveElements = Array.from(document.querySelectorAll('button, a, [role="button"]')).filter(
        (element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 20 && rect.height > 20;
        },
      );
      const buttonBackgrounds = Array.from(
        new Set(
          interactiveElements
            .map((element) => firstPaintedBackground(element))
            .filter(Boolean)
            .map((color) => `${color.r},${color.g},${color.b},${color.a}`),
        ),
      );
      const primaryButtonCount = interactiveElements.filter((element) =>
        /primary|active|selected/i.test(String(element.className)),
      ).length;

      return {
        bodyBackground: bodyBackground ? colorToObject(bodyBackground) : null,
        bodyBackgroundLuminance: bodyBackground ? luminance(bodyBackground) : null,
        bodyBackgroundSaturation: bodyHsl?.s ?? null,
        darkBase: Boolean(bodyBackground && luminance(bodyBackground) < 0.12),
        averageBackgroundSaturation: weightedArea > 0 ? weightedSaturation / weightedArea : null,
        lowSaturation: weightedArea > 0 ? weightedSaturation / weightedArea < 0.28 : false,
        largeWhiteBackground,
        cardCount: cardProfiles.length,
        grayCardCount: cardProfiles.filter((profile) => profile.gray).length,
        grayCardRatio: cardProfiles.length
          ? cardProfiles.filter((profile) => profile.gray).length / cardProfiles.length
          : 0,
        roundedCardRatio: cardProfiles.length ? roundedCards / cardProfiles.length : 0,
        radiusBucketCount: radiusBuckets.length,
        uniformRadius: cardProfiles.length > 0 && roundedCards / cardProfiles.length >= 0.75 && radiusBuckets.length <= 5,
        visibleButtonCount: interactiveElements.length,
        distinctButtonBackgroundCount: buttonBackgrounds.length,
        primaryButtonCount,
        clearButtonHierarchy: primaryButtonCount > 0 || buttonBackgrounds.length >= 2,
      };
    }

    function firstPaintedBackground(element) {
      let current = element;
      while (current) {
        const color = parseCssColor(window.getComputedStyle(current).backgroundColor);
        if (color) {
          return color;
        }
        current = current.parentElement;
      }
      return null;
    }

    function parseCssColor(value) {
      if (!value || value === 'transparent') {
        return null;
      }

      const match = value.match(/rgba?\(([^)]+)\)/i);
      if (!match) {
        return null;
      }

      const parts = match[1].split(',').map((part) => part.trim());
      const r = Number(parts[0]);
      const g = Number(parts[1]);
      const b = Number(parts[2]);
      const a = parts.length > 3 ? Number(parts[3]) : 1;
      if (![r, g, b, a].every(Number.isFinite) || a < 0.05) {
        return null;
      }
      return { r, g, b, a };
    }

    function rgbToHsl(r, g, b) {
      const nr = r / 255;
      const ng = g / 255;
      const nb = b / 255;
      const max = Math.max(nr, ng, nb);
      const min = Math.min(nr, ng, nb);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case nr:
            h = (ng - nb) / d + (ng < nb ? 6 : 0);
            break;
          case ng:
            h = (nb - nr) / d + 2;
            break;
          default:
            h = (nr - ng) / d + 4;
            break;
        }
        h /= 6;
      }

      return { h, s, l };
    }

    function luminance(color) {
      const convert = (value) => {
        const channel = value / 255;
        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * convert(color.r) + 0.7152 * convert(color.g) + 0.0722 * convert(color.b);
    }

    function colorToObject(color) {
      return {
        r: Math.round(color.r),
        g: Math.round(color.g),
        b: Math.round(color.b),
        a: color.a,
      };
    }
  });
}

function buildResult({
  kind,
  key,
  label,
  route,
  url,
  viewport,
  responseStatus,
  loadError,
  diagnostics,
  pageConsole,
  pageExceptions,
  screenshotPath,
  screenshotSaved,
}) {
  const consoleErrorCount = pageConsole.length + pageExceptions.length;
  const statusOk = Number(responseStatus) >= 200 && Number(responseStatus) < 400;
  const failed =
    Boolean(loadError) ||
    !statusOk ||
    Boolean(diagnostics?.hasKnownRuntimeErrorText) ||
    Boolean(diagnostics?.evaluationError);
  const relativeScreenshot = path.relative(RUN_DIR, screenshotPath).replace(/\\/g, '/');

  return {
    kind,
    key,
    label,
    route,
    url,
    viewport: viewport.name,
    width: viewport.width,
    height: viewport.height,
    status: responseStatus,
    statusOk,
    failed,
    loadError,
    consoleErrorCount,
    hasUncaughtException: pageExceptions.length > 0,
    horizontalOverflow: Boolean(diagnostics?.horizontalOverflow),
    bodyWidthExceedsViewport: Boolean(diagnostics?.bodyWidthExceedsViewport),
    isBlankPage: Boolean(diagnostics?.isBlankPage),
    hasTextMasterKeyword: Boolean(diagnostics?.hasTextMasterKeyword),
    hasMainAction: Boolean(diagnostics?.hasMainAction),
    screenshotSaved,
    screenshot: relativeScreenshot,
    diagnostics,
    consoleErrors: [...pageConsole, ...pageExceptions],
  };
}

function recordResult(result) {
  auditState.results.push(result);
  auditState.routeStatuses.push({
    key: result.key,
    route: result.route,
    url: result.url,
    viewport: result.viewport,
    status: result.status,
    statusOk: result.statusOk,
    failed: result.failed,
    isBlankPage: result.isBlankPage,
    hasTextMasterKeyword: result.hasTextMasterKeyword,
    hasMainAction: result.hasMainAction,
    screenshotSaved: result.screenshotSaved,
  });
  auditState.consoleErrors.push(...result.consoleErrors);

  if (result.horizontalOverflow || result.bodyWidthExceedsViewport) {
    auditState.overflowReports.push({
      key: result.key,
      route: result.route,
      viewport: result.viewport,
      horizontalOverflow: result.horizontalOverflow,
      bodyWidthExceedsViewport: result.bodyWidthExceedsViewport,
      scrollWidth: result.diagnostics?.scrollWidth,
      clientWidth: result.diagnostics?.clientWidth,
      bodyRectWidth: result.diagnostics?.bodyRectWidth,
      viewportWidth: result.diagnostics?.viewportWidth,
    });
  }

  if (result.screenshotSaved) {
    recordScreenshot(path.join(RUN_DIR, result.screenshot));
  }

  recalculateSummary();
}

function recalculateSummary() {
  auditState.screenshotCount = auditState.screenshots.length;
  auditState.consoleErrorCount = auditState.consoleErrors.length;
  auditState.overflowPageCount = auditState.overflowReports.length;
  auditState.failedPageCount = auditState.routeStatuses.filter((item) => item.failed).length;
  auditState.blankPageCount = auditState.routeStatuses.filter((item) => item.isBlankPage).length;
  auditState.functionalSummary = createFunctionalSummary();
  for (const result of auditState.functionalResults) {
    if (Object.prototype.hasOwnProperty.call(auditState.functionalSummary, result.status)) {
      auditState.functionalSummary[result.status] += 1;
    }
  }
}

function createEmptyScore() {
  return {
    total: 0,
    level: '未形成可用 Text Master',
    homePageScore: 0,
    standaloneApp: 0,
    pageCompleteness: 0,
    workspaceStructure: 0,
    visualStyle: 0,
    productionFlow: 0,
    deductions: [],
    homePageDeductions: [],
  };
}

function computeDesignScore() {
  const deductions = [];
  const homePage = scoreHomePage();
  const standaloneApp = scoreStandaloneApp(deductions);
  const pageCompleteness = scorePageCompleteness(deductions);
  const workspaceStructure = scoreWorkspaceStructure(deductions);
  const visualStyle = scoreVisualStyle(deductions);
  const productionFlow = scoreProductionFlow(deductions);
  const total = clampScore(
    standaloneApp + pageCompleteness + workspaceStructure + visualStyle + productionFlow,
    0,
    100,
  );

  return {
    total,
    level: scoreLevel(total),
    homePageScore: homePage.score,
    standaloneApp,
    pageCompleteness,
    workspaceStructure,
    visualStyle,
    productionFlow,
    deductions: deductions.sort((left, right) => right.pointsLost - left.pointsLost),
    homePageDeductions: homePage.deductions,
  };
}

function scoreHomePage() {
  const deductions = [];
  const home = auditState.scoreContext.home ?? {};
  const home1440 = routeResult('home', '1440x900');
  const home1366 = routeResult('home', '1366x768');
  const visual = home1440?.diagnostics?.visual ?? home1366?.diagnostics?.visual ?? {};

  const checks = [
    {
      points: 3,
      passed: Boolean(home.hasHomeTestId && home.topbar?.exists && home.topbar?.hasBrand),
      reason: '顶部导航缺少 TM/Text Master 品牌或首页 data-testid。',
      evidence: JSON.stringify({ hasHomeTestId: home.hasHomeTestId, topbar: home.topbar }),
    },
    {
      points: 5,
      passed:
        Boolean(home.topbar?.hasProjectCenter) &&
        Boolean(home.topbar?.hasTemplates) &&
        Boolean(home.topbar?.hasExports) &&
        Boolean(home.topbar?.hasSettings),
      reason: '顶部导航缺少项目中心、模板中心、导出中心或设置入口。',
      evidence: JSON.stringify(home.topbar ?? {}),
    },
    {
      points: 4,
      passed: Boolean(home.topbar?.hasLocalMode && home.topbar?.hasBrainHubReady),
      reason: '顶部导航缺少 Local Mode 或 Brain Hub Ready 状态胶囊。',
      evidence: JSON.stringify(home.topbar ?? {}),
    },
    {
      points: 3,
      passed: Boolean(home.topbar?.hasUserProfile),
      reason: '顶部导航缺少用户资料按钮。',
      evidence: JSON.stringify(home.topbar ?? {}),
    },
    {
      points: 10,
      passed: !home.topbar?.hasDuplicateCreate,
      reason: '右上角仍存在重复的新建项目入口。',
      evidence: JSON.stringify(home.topbar ?? {}),
    },
    {
      points: 10,
      passed: Boolean(home.topbar?.hasUserProfile),
      reason: '用户资料按钮不存在或缺少 data-testid="user-profile-button"。',
      evidence: JSON.stringify(home.topbar ?? {}),
    },
    {
      points: 5,
      passed:
        Boolean(home.hero?.exists) &&
        Boolean(home.hero?.hasLabel) &&
        Boolean(home.hero?.hasTitle) &&
        Boolean(home.hero?.hasSubtitle) &&
        Boolean(home.hero?.hasDescription),
      reason: 'Hero 区标签、标题、副标题或说明文案不完整。',
      evidence: JSON.stringify(home.hero ?? {}),
    },
    {
      points: 8,
      passed:
        Boolean(home.hero?.hasCreateButton) &&
        Boolean(home.hero?.hasContinueButton) &&
        Boolean(home.hero?.hasImportButton) &&
        Boolean(home.hero?.hasTemplateButton),
      reason: 'Hero 区四个操作按钮不完整。',
      evidence: JSON.stringify(home.hero ?? {}),
    },
    {
      points: 2,
      passed: Boolean(home.hero?.hasSuggestion),
      reason: 'Hero 区缺少今日建议卡。',
      evidence: JSON.stringify(home.hero ?? {}),
    },
    {
      points: 15,
      passed:
        Boolean(home.pipeline?.exists) &&
        Boolean(home.pipeline?.hasTitle) &&
        Number(home.pipeline?.stepCount) >= 8 &&
        Number(home.pipeline?.statusCount) >= 7 &&
        Boolean(home.pipeline?.hasWorkbenchButton),
      reason: '文本生产链路卡不完整。',
      evidence: JSON.stringify(home.pipeline ?? {}),
    },
    {
      points: 10,
      passed:
        Number(home.recentProjects?.cardCount) >= 2 &&
        Boolean(home.recentProjects?.hasCopyCard) &&
        Boolean(home.recentProjects?.hasDramaCard) &&
        Boolean(home.recentProjects?.hasSteps) &&
        Boolean(home.recentProjects?.hasProgress) &&
        Boolean(home.recentProjects?.hasActions),
      reason: '最近项目生产任务卡不完整。',
      evidence: JSON.stringify(home.recentProjects ?? {}),
    },
    {
      points: 10,
      passed:
        Boolean(home.todayAndTemplates?.hasTasksTitle) &&
        Number(home.todayAndTemplates?.taskCount) >= 3 &&
        Boolean(home.todayAndTemplates?.hasStartButton) &&
        Boolean(home.todayAndTemplates?.hasTemplatesTitle) &&
        Number(home.todayAndTemplates?.templateCount) >= 4 &&
        Boolean(home.todayAndTemplates?.hasAllTemplatesEntry),
      reason: '今日生产任务或快速模板不完整。',
      evidence: JSON.stringify(home.todayAndTemplates ?? {}),
    },
    {
      points: 10,
      passed:
        Boolean(visual.darkBase) &&
        Boolean(visual.lowSaturation) &&
        Number(visual.cardCount) >= 8 &&
        Boolean(visual.clearButtonHierarchy) &&
        !visual.largeWhiteBackground,
      reason: '首页深色专业工具视觉不达标。',
      evidence: JSON.stringify({
        darkBase: visual.darkBase,
        lowSaturation: visual.lowSaturation,
        cardCount: visual.cardCount,
        clearButtonHierarchy: visual.clearButtonHierarchy,
        largeWhiteBackground: visual.largeWhiteBackground,
      }),
    },
    {
      points: 5,
      passed:
        Boolean(home1440) &&
        Boolean(home1366) &&
        !home1440.failed &&
        !home1366.failed &&
        !home1440.isBlankPage &&
        !home1366.isBlankPage &&
        !home1440.horizontalOverflow &&
        !home1366.horizontalOverflow,
      reason: '首页存在空白、访问失败或横向溢出。',
      evidence: JSON.stringify({
        home1440: home1440
          ? { failed: home1440.failed, blank: home1440.isBlankPage, overflow: home1440.horizontalOverflow }
          : null,
        home1366: home1366
          ? { failed: home1366.failed, blank: home1366.isBlankPage, overflow: home1366.horizontalOverflow }
          : null,
      }),
    },
  ];

  let score = 0;
  for (const check of checks) {
    if (check.passed) {
      score += check.points;
    } else {
      deductions.push({
        dimension: '首页专项',
        reason: check.reason,
        pointsLost: check.points,
        evidence: check.evidence,
      });
    }
  }

  return {
    score: clampScore(score, 0, 100),
    deductions: deductions.sort((left, right) => right.pointsLost - left.pointsLost),
  };
}

function scoreStandaloneApp(deductions) {
  return scoreChecks(
    '独立 App 完整度',
    [
      {
        points: 3,
        passed: routeUsable('home'),
        reason: '首页不能独立打开。',
        evidence: routeEvidence('home'),
      },
      {
        points: 3,
        passed: routeUsable('create') && functionalUsable('create'),
        reason: '新建项目链路不能独立使用。',
        evidence: functionalEvidence('create'),
      },
      {
        points: 3,
        passed: routeUsable('workspace') && functionalUsable('workspace'),
        reason: '工作台不能独立进入。',
        evidence: functionalEvidence('workspace'),
      },
      {
        points: 3,
        passed: routeUsable('templates'),
        reason: '模板中心不能独立进入。',
        evidence: routeEvidence('templates'),
      },
      {
        points: 3,
        passed: routeUsable('exports') && functionalUsable('exports'),
        reason: '导出中心不能独立进入。',
        evidence: functionalEvidence('exports'),
      },
      {
        points: 3,
        passed: routeUsable('settings') && functionalUsable('settings'),
        reason: '设置页不能独立进入。',
        evidence: functionalEvidence('settings'),
      },
      {
        points: 2,
        passed:
          Boolean(auditState.brainHubAdapter?.localRuntimeIndependent) &&
          !auditState.brainHubAdapter?.pagesDirectlyImportHubAdapter,
        reason: '运行仍存在 Brain Hub 硬依赖风险。',
        evidence: `localRuntimeIndependent=${Boolean(
          auditState.brainHubAdapter?.localRuntimeIndependent,
        )}, pagesDirectlyImportHubAdapter=${Boolean(auditState.brainHubAdapter?.pagesDirectlyImportHubAdapter)}`,
      },
    ],
    deductions,
  );
}

function scorePageCompleteness(deductions) {
  const requiredPages = ['home', 'create', 'workspace', 'templates', 'exports', 'settings'];
  const pageChecks = requiredPages.map((key) => ({
    points: 2,
    passed: routeUsable(key) && routeHasMainAction(key),
    reason: `${key} 页面不完整或缺少主要操作入口。`,
    evidence: routeEvidence(key),
  }));

  return scoreChecks(
    '页面完整度',
    [
      ...pageChecks,
      {
        points: 4,
        passed: requiredPages.every((key) => routeNotBlank(key)),
        reason: '存在空白或疑似空白页面。',
        evidence: blankPageEvidence(requiredPages),
      },
      {
        points: 4,
        passed: requiredPages.every((key) => routeHasMainAction(key)),
        reason: '部分页面缺少主要操作入口。',
        evidence: mainActionEvidence(requiredPages),
      },
    ],
    deductions,
  );
}

function scoreWorkspaceStructure(deductions) {
  const workspace = auditState.scoreContext.workspace ?? {};
  const layout = workspace.layout ?? {};
  const stepChecks = workspace.stepChecks ?? [];
  const editor = workspace.editor ?? {};
  const entries = workspace.entries ?? {};

  return scoreChecks(
    '工作台结构',
    [
      {
        points: 2,
        passed: Boolean(layout.hasSidebar),
        reason: '工作台缺少左侧流程导航。',
        evidence: JSON.stringify(layout.sidebarRect ?? null),
      },
      {
        points: 2,
        passed: Boolean(layout.hasMain),
        reason: '工作台缺少中央主工作区。',
        evidence: JSON.stringify(layout.mainRect ?? null),
      },
      {
        points: 2,
        passed: Boolean(layout.hasAiPanel),
        reason: '工作台缺少右侧 AI 操作栏。',
        evidence: JSON.stringify(layout.aiRect ?? null),
      },
      {
        points: 3,
        passed: Boolean(layout.hasThreeColumns),
        reason: '工作台三栏布局不成立。',
        evidence: `sidebar=${Boolean(layout.hasSidebar)}, main=${Boolean(layout.hasMain)}, ai=${Boolean(
          layout.hasAiPanel,
        )}`,
      },
      {
        points: 3,
        passed: stepChecks.length >= WORKSPACE_STEPS.length && stepChecks.every((item) => item.changed),
        reason: '工作台步骤切换不完整。',
        evidence: `${stepChecks.filter((item) => item.changed).length}/${WORKSPACE_STEPS.length} steps changed`,
      },
      {
        points: 2,
        passed: Boolean(editor.hasTextEditor),
        reason: '正文生产缺少文本编辑区。',
        evidence: JSON.stringify(editor),
      },
      {
        points: 2,
        passed: Boolean(editor.hasCandidatePanel),
        reason: '正文生产缺少候选结果区。',
        evidence: JSON.stringify(editor),
      },
      {
        points: 2,
        passed: Boolean(entries.hasVersionEntry),
        reason: '工作台缺少版本记录入口。',
        evidence: JSON.stringify(entries),
      },
      {
        points: 2,
        passed: Boolean(entries.hasExportEntry),
        reason: '工作台缺少导出中心入口。',
        evidence: JSON.stringify(entries),
      },
    ],
    deductions,
  );
}

function scoreVisualStyle(deductions) {
  const visualResults = auditState.results.filter((result) => result.diagnostics?.visual);

  return scoreChecks(
    '视觉风格',
    [
      {
        points: 2,
        passed: visualRatio((visual) => visual.darkBase) >= 0.8,
        reason: '黑色基底覆盖不足。',
        evidence: visualRatioEvidence('darkBase', visualResults),
      },
      {
        points: 2,
        passed: visualRatio((visual) => visual.cardCount >= 2 && visual.grayCardRatio >= 0.55) >= 0.7,
        reason: '高级灰卡片比例不足。',
        evidence: visualRatioEvidence('grayCardRatio', visualResults),
      },
      {
        points: 2,
        passed: visualRatio((visual) => visual.lowSaturation) >= 0.8,
        reason: '页面背景或组件饱和度偏高。',
        evidence: visualRatioEvidence('lowSaturation', visualResults),
      },
      {
        points: 2,
        passed: visualRatio((visual) => visual.uniformRadius) >= 0.7,
        reason: '圆角统一性不足。',
        evidence: visualRatioEvidence('uniformRadius', visualResults),
      },
      {
        points: 2,
        passed: visualRatio((visual) => visual.clearButtonHierarchy) >= 0.7,
        reason: '按钮层级不够清楚。',
        evidence: visualRatioEvidence('clearButtonHierarchy', visualResults),
      },
      {
        points: 2,
        passed: visualRatio((visual) => !visual.largeWhiteBackground) >= 0.95,
        reason: '存在大面积纯白背景。',
        evidence: visualRatioEvidence('largeWhiteBackground', visualResults),
      },
      {
        points: 3,
        passed: auditState.overflowReports.length === 0,
        reason: '存在明显横向溢出。',
        evidence: `${auditState.overflowReports.length} overflow reports`,
      },
      {
        points: 2,
        passed: viewportUsable('1440x900'),
        reason: '1440x900 视口不可用。',
        evidence: viewportEvidence('1440x900'),
      },
      {
        points: 3,
        passed: viewportUsable('1366x768'),
        reason: '1366x768 视口不可用。',
        evidence: viewportEvidence('1366x768'),
      },
    ],
    deductions,
  );
}

function scoreProductionFlow(deductions) {
  const workspace = auditState.scoreContext.workspace ?? {};
  const stepChecks = workspace.stepChecks ?? [];
  const flowSteps = [
    'workspace-settings',
    'workspace-materials',
    'workspace-outline',
    'workspace-editor',
    'workspace-rewrite',
    'workspace-review',
    'workspace-versions',
    'workspace-export',
  ];
  const stepScoreChecks = flowSteps.map((key) => {
    const check = stepChecks.find((item) => item.key === key);
    return {
      points: 2,
      passed: Boolean(check?.changed),
      reason: `${key} 生产步骤不可用。`,
      evidence: check ? JSON.stringify(check) : 'step not visited',
    };
  });

  return scoreChecks(
    '生产链路',
    [
      ...stepScoreChecks,
      {
        points: 2,
        passed: functionalUsable('ai') && ['passed-with-mock', 'passed', 'warning'].includes(functionalStatus('ai')),
        reason: 'Mock AI 操作不存在或不可用。',
        evidence: functionalEvidence('ai'),
      },
      {
        points: 2,
        passed:
          functionalUsable('exports') &&
          ['passed-with-mock', 'passed', 'warning'].includes(functionalStatus('exports')),
        reason: 'Mock 导出不存在或不可用。',
        evidence: functionalEvidence('exports'),
      },
    ],
    deductions,
  );
}

function scoreChecks(dimension, checks, deductions) {
  let score = 0;
  for (const check of checks) {
    if (check.passed) {
      score += check.points;
    } else {
      deductions.push({
        dimension,
        reason: check.reason,
        pointsLost: check.points,
        evidence: check.evidence,
      });
    }
  }
  return clampScore(score, 0, 20);
}

function routeUsable(key) {
  const routeItems = auditState.routeStatuses.filter((item) => item.key === key);
  return routeItems.some((item) => item.statusOk && !item.failed && !item.isBlankPage && item.screenshotSaved);
}

function routeResult(key, viewport) {
  return auditState.results.find((item) => item.key === key && item.viewport === viewport) ?? null;
}

function routeNotBlank(key) {
  const routeItems = auditState.routeStatuses.filter((item) => item.key === key);
  return routeItems.length > 0 && routeItems.every((item) => !item.isBlankPage);
}

function routeHasMainAction(key) {
  const routeItems = auditState.routeStatuses.filter((item) => item.key === key);
  return routeItems.some((item) => item.hasMainAction);
}

function routeEvidence(key) {
  const routeItems = auditState.routeStatuses.filter((item) => item.key === key);
  if (!routeItems.length) {
    return 'route not visited';
  }
  return routeItems
    .map(
      (item) =>
        `${item.viewport}: statusOk=${item.statusOk}, failed=${item.failed}, blank=${item.isBlankPage}, mainAction=${item.hasMainAction}`,
    )
    .join('; ');
}

function blankPageEvidence(keys) {
  return keys
    .map((key) => `${key}=${auditState.routeStatuses.some((item) => item.key === key && item.isBlankPage)}`)
    .join('; ');
}

function mainActionEvidence(keys) {
  return keys.map((key) => `${key}=${routeHasMainAction(key)}`).join('; ');
}

function getFunctionalResult(key) {
  const indexByKey = {
    home: 0,
    create: 1,
    workspace: 2,
    ai: 3,
    exports: 4,
    settings: 5,
    brainHub: 6,
  };
  const keywordsByKey = {
    home: [/首页|Home/i],
    create: [/新建|Create/i],
    workspace: [/工作台|Workspace/i],
    ai: [/AI/i],
    exports: [/导出|Export/i],
    settings: [/设置|Settings/i],
    brainHub: [/Brain Hub/i],
  };
  const keywordMatch = auditState.functionalResults.find((item) =>
    (keywordsByKey[key] ?? []).some((pattern) => pattern.test(item.name)),
  );
  return keywordMatch ?? auditState.functionalResults[indexByKey[key]] ?? null;
}

function functionalStatus(key) {
  return getFunctionalResult(key)?.status ?? 'skipped';
}

function functionalUsable(key) {
  return ['passed', 'warning', 'passed-with-mock'].includes(functionalStatus(key));
}

function functionalEvidence(key) {
  const result = getFunctionalResult(key);
  if (!result) {
    return 'functional check not executed';
  }
  return `${result.name}: status=${result.status}, warnings=${result.warnings.length}, errors=${result.errors.length}`;
}

function visualRatio(predicate) {
  const visualResults = auditState.results.filter((result) => result.diagnostics?.visual);
  if (!visualResults.length) {
    return 0;
  }
  return (
    visualResults.filter((result) => {
      try {
        return predicate(result.diagnostics.visual, result);
      } catch {
        return false;
      }
    }).length / visualResults.length
  );
}

function visualRatioEvidence(key, visualResults) {
  if (!visualResults.length) {
    return 'no visual diagnostics';
  }

  const values = visualResults
    .slice(0, 6)
    .map((result) => `${result.key}/${result.viewport}=${formatEvidenceValue(result.diagnostics?.visual?.[key])}`)
    .join('; ');
  return `${values}${visualResults.length > 6 ? '; ...' : ''}`;
}

function viewportUsable(viewport) {
  const items = auditState.routeStatuses.filter((item) => item.viewport === viewport);
  return items.length > 0 && items.every((item) => item.statusOk && !item.failed && !item.isBlankPage);
}

function viewportEvidence(viewport) {
  const items = auditState.routeStatuses.filter((item) => item.viewport === viewport);
  if (!items.length) {
    return 'viewport not visited';
  }
  return `${items.filter((item) => item.statusOk && !item.failed && !item.isBlankPage).length}/${items.length} usable`;
}

function formatEvidenceValue(value) {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(3);
  }
  return String(value);
}

function scoreLevel(total) {
  if (total >= 90) {
    return '可进入精修';
  }
  if (total >= 75) {
    return 'MVP 基本成立';
  }
  if (total >= 60) {
    return '结构成立但需要明显整改';
  }
  if (total >= 40) {
    return '页面存在但产品感不足';
  }
  return '未形成可用 Text Master';
}

function clampScore(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

async function inspectBrainHubAdapter() {
  const checks = [
    { key: 'manifest', path: 'src/integrations/brain-hub/manifest.ts' },
    { key: 'launch', path: 'src/integrations/brain-hub/launch.ts' },
    { key: 'launchContext', path: 'src/integrations/brain-hub/launchContext.ts' },
    { key: 'authAdapter', path: 'src/integrations/brain-hub/authAdapter.ts' },
    { key: 'fileAdapter', path: 'src/integrations/brain-hub/fileAdapter.ts' },
    { key: 'aiAdapter', path: 'src/integrations/brain-hub/aiAdapter.ts' },
    { key: 'projectSyncAdapter', path: 'src/integrations/brain-hub/projectSyncAdapter.ts' },
    { key: 'usageAdapter', path: 'src/integrations/brain-hub/usageAdapter.ts' },
    { key: 'BrainHubRuntime', path: 'src/modules/text-master/runtime/BrainHubRuntime.ts' },
    { key: 'LocalRuntime', path: 'src/modules/text-master/runtime/LocalRuntime.ts' },
    { key: 'runtimeDetection', path: 'src/modules/text-master/runtime/runtimeDetection.ts' },
  ];

  const files = checks.map((item) => ({
    ...item,
    exists: fs.existsSync(path.join(ROOT_DIR, item.path)),
  }));
  const localRuntimeText = readTextIfExists('src/modules/text-master/runtime/LocalRuntime.ts');
  const pageTexts = [
    'src/modules/text-master/pages/Home.vue',
    'src/modules/text-master/pages/ProjectCenter.vue',
    'src/modules/text-master/pages/ProjectCreate.vue',
    'src/modules/text-master/pages/ProjectWorkspace.vue',
    'src/modules/text-master/pages/Templates.vue',
    'src/modules/text-master/pages/Exports.vue',
    'src/modules/text-master/pages/Settings.vue',
  ].map(readTextIfExists);

  return {
    optional: true,
    files,
    manifestExists: files.find((item) => item.key === 'manifest')?.exists ?? false,
    launchTsExists: files.find((item) => item.key === 'launch')?.exists ?? false,
    launchContextExists: files.find((item) => item.key === 'launchContext')?.exists ?? false,
    brainHubRuntimeExists: files.find((item) => item.key === 'BrainHubRuntime')?.exists ?? false,
    localRuntimeIndependent:
      !localRuntimeText.includes('integrations/brain-hub') && !localRuntimeText.includes('BrainHub'),
    pagesDirectlyImportHubAdapter: pageTexts.some((text) => text.includes('integrations/brain-hub')),
  };
}

async function writeAllReports() {
  recalculateSummary();
  auditState.score = computeDesignScore();
  await writeJson(REPORT_JSON, {
    summary: summaryObject(),
    score: auditState.score,
    results: auditState.results,
    screenshots: auditState.screenshots,
    artifacts: artifactObject(),
  });
  await writeJson(FUNCTIONAL_REPORT_JSON, {
    summary: auditState.functionalSummary,
    results: auditState.functionalResults,
    artifacts: artifactObject(),
  });
  await writeJson(ROUTE_STATUS_JSON, auditState.routeStatuses);
  await writeJson(CONSOLE_ERRORS_JSON, auditState.consoleErrors);
  await writeJson(OVERFLOW_REPORT_JSON, auditState.overflowReports);
  await writeJson(BRAIN_HUB_REPORT_JSON, auditState.brainHubAdapter);
  await fs.promises.writeFile(REPORT_MD, buildMarkdownReport(), 'utf8');
}

async function writeManualOutputs(reason) {
  auditState.mode = 'manual';
  auditState.manualReason = reason;
  auditState.brainHubAdapter = await inspectBrainHubAdapter();
  ensureSkippedFunctionalResults(reason);
  await fs.promises.writeFile(MANUAL_GUIDE_MD, buildManualGuide(reason), 'utf8');
  await writeAllReports();
}

function ensureSkippedFunctionalResults(reason) {
  if (auditState.functionalResults.length > 0) {
    return;
  }

  for (const name of [
    '首页链路',
    '新建项目链路',
    '工作台链路',
    'AI 操作链路',
    '导出链路',
    '设置页链路',
    'Brain Hub Adapter 可选检查',
  ]) {
    recordFunctionalResult({
      name,
      status: 'skipped',
      reason,
      screenshots: [],
      warnings: [],
      errors: [],
    });
  }
}

function buildMarkdownReport() {
  const rows = auditState.routeStatuses.length
    ? auditState.routeStatuses
        .map((item) =>
          [
            item.key,
            `\`${item.viewport}\``,
            `\`${item.url}\``,
            item.status ?? 'n/a',
            item.failed ? 'yes' : 'no',
            item.isBlankPage ? 'yes' : 'no',
            item.hasTextMasterKeyword ? 'yes' : 'no',
            item.hasMainAction ? 'yes' : 'no',
            item.screenshotSaved ? 'yes' : 'no',
          ].join(' | '),
        )
        .join('\n')
    : '';
  const consoleRows = auditState.consoleErrors.length
    ? auditState.consoleErrors
        .slice(0, 80)
        .map((error) => `- ${error.viewport} ${error.routeKey}: ${error.text}`)
        .join('\n')
    : '- No console errors recorded.';
  const screenshotRows = auditState.screenshots.length
    ? auditState.screenshots.map((file) => `- ${file}`).join('\n')
    : '- No screenshots generated.';
  const functionalRows = auditState.functionalResults.length
    ? auditState.functionalResults
        .map((item) =>
          [
            item.name,
            item.status,
            item.reason,
            item.screenshots.length,
            item.warnings.length,
            item.errors.length,
          ].join(' | '),
        )
        .join('\n')
    : '';
  const functionalDetails = auditState.functionalResults.length
    ? auditState.functionalResults
        .map((item) =>
          [
            `### ${item.name}`,
            '',
            `- Status: ${item.status}`,
            `- Reason: ${item.reason}`,
            `- Screenshots: ${item.screenshots.length ? item.screenshots.map((file) => `\`${file}\``).join(', ') : '(none)'}`,
            `- Warnings: ${item.warnings.length ? item.warnings.join(' / ') : '(none)'}`,
            `- Errors: ${
              item.errors.length
                ? item.errors.map((error) => `${error.type}: ${error.message}`).join(' / ')
                : '(none)'
            }`,
          ].join('\n'),
        )
        .join('\n\n')
    : 'No functional checks executed.';
  const score = auditState.score ?? createEmptyScore();
  const scoreDeductions = score.deductions.length
    ? score.deductions
        .slice(0, 10)
        .map(
          (item) =>
            `- ${item.dimension}: -${item.pointsLost}，${item.reason} Evidence: ${item.evidence}`,
        )
        .join('\n')
    : '- No major deductions.';
  const homePageDeductions = score.homePageDeductions?.length
    ? score.homePageDeductions
        .slice(0, 10)
        .map(
          (item) =>
            `- ${item.dimension}: -${item.pointsLost}，${item.reason} Evidence: ${item.evidence}`,
        )
        .join('\n')
    : '- No home page deductions.';
  const priorityFixes = buildPriorityFixes(score)
    .map((item) => `- ${item}`)
    .join('\n');
  const nextSteps = buildNextStepSuggestions(score)
    .map((item) => `- ${item}`)
    .join('\n');

  return [
    '# Text Master Visual Audit Report',
    '',
    `- Run directory: \`${path.relative(ROOT_DIR, RUN_DIR).replace(/\\/g, '/')}\``,
    `- Started at: ${auditState.startedAt}`,
    `- Finished at: ${auditState.finishedAt || new Date().toISOString()}`,
    `- Base URL: ${auditState.baseUrl || '(not available)'}`,
    `- Base path: ${auditState.basePath || '(none)'}`,
    `- Project ID: ${auditState.projectId}`,
    `- Mode: ${auditState.mode}`,
    `- Playwright used: ${auditState.usedPlaywright ? 'yes' : 'no'}`,
    `- Playwright installed by script: ${auditState.installedPlaywright ? 'yes' : 'no'}`,
    `- Dev server started by script: ${auditState.startedDevServer ? 'yes' : 'no'}`,
    `- Manual reason: ${auditState.manualReason || '(none)'}`,
    '',
    '## Summary',
    '',
    `- Screenshots: ${auditState.screenshotCount}`,
    `- Console errors: ${auditState.consoleErrorCount}`,
    `- Horizontal overflow pages: ${auditState.overflowPageCount}`,
    `- Failed page visits: ${auditState.failedPageCount}`,
    `- Blank pages: ${auditState.blankPageCount}`,
    `- Functional passed: ${auditState.functionalSummary.passed}`,
    `- Functional failed: ${auditState.functionalSummary.failed}`,
    `- Functional warning: ${auditState.functionalSummary.warning}`,
    `- Functional skipped: ${auditState.functionalSummary.skipped}`,
    `- Functional passed-with-mock: ${auditState.functionalSummary['passed-with-mock']}`,
    `- Functional optional-missing: ${auditState.functionalSummary['optional-missing']}`,
    '',
    '## Text Master 设计符合度评分',
    '',
    `- 独立 App 完整度: ${score.standaloneApp}/20`,
    `- 页面完整度: ${score.pageCompleteness}/20`,
    `- 工作台结构: ${score.workspaceStructure}/20`,
    `- 视觉风格: ${score.visualStyle}/20`,
    `- 生产链路: ${score.productionFlow}/20`,
    `- 首页专项分数 homePageScore: ${score.homePageScore}/100`,
    `- 总分: ${score.total}/100`,
    `- 等级: ${score.level}`,
    '',
    '### 主要扣分原因',
    '',
    scoreDeductions,
    '',
    '### 首页专项扣分原因',
    '',
    homePageDeductions,
    '',
    '### 最优先整改项',
    '',
    priorityFixes || '- No immediate priority fixes.',
    '',
    '### 下一步建议',
    '',
    nextSteps || '- Continue visual and functional regression checks after each change.',
    '',
    '## Route Status',
    '',
    auditState.routeStatuses.length
      ? [
          'Key | Viewport | URL | Status | Failed | Blank | Text Master | Main action | Screenshot',
          '--- | --- | --- | --- | --- | --- | --- | --- | ---',
          rows,
        ].join('\n')
      : 'No route visits executed.',
    '',
    '## 功能链路检查',
    '',
    auditState.functionalResults.length
      ? [
          'Name | Status | Reason | Screenshots | Warnings | Errors',
          '--- | --- | --- | --- | --- | ---',
          functionalRows,
        ].join('\n')
      : 'No functional checks executed.',
    '',
    functionalDetails,
    '',
    '## Console Errors',
    '',
    consoleRows,
    '',
    '## Screenshots',
    '',
    screenshotRows,
    '',
    '## Brain Hub Adapter Optional Check',
    '',
    `- Manifest exists: ${auditState.brainHubAdapter?.manifestExists ? 'yes' : 'no'}`,
    `- launch.ts exists: ${auditState.brainHubAdapter?.launchTsExists ? 'yes' : 'no'}`,
    `- launchContext.ts exists: ${auditState.brainHubAdapter?.launchContextExists ? 'yes' : 'no'}`,
    `- BrainHubRuntime exists: ${auditState.brainHubAdapter?.brainHubRuntimeExists ? 'yes' : 'no'}`,
    `- LocalRuntime independent: ${auditState.brainHubAdapter?.localRuntimeIndependent ? 'yes' : 'no'}`,
    `- Pages directly import Hub adapter: ${auditState.brainHubAdapter?.pagesDirectlyImportHubAdapter ? 'yes' : 'no'}`,
    '',
  ].join('\n');
}

function buildPriorityFixes(score) {
  if (score.homePageScore < 95 && score.homePageDeductions?.length) {
    return score.homePageDeductions
      .slice(0, 3)
      .map((item) => `${item.dimension}: ${item.reason}`);
  }

  if (!score.deductions.length) {
    return ['保留当前结构，进入细节视觉精修和真实功能接入。'];
  }

  return score.deductions.slice(0, 3).map((item) => `${item.dimension}: ${item.reason}`);
}

function buildNextStepSuggestions(score) {
  const suggestions = [];

  if (score.standaloneApp < 20) {
    suggestions.push('先修复独立启动、独立路由和 Brain Hub 非硬依赖问题。');
  }
  if (score.pageCompleteness < 20) {
    suggestions.push('补齐各页面主要操作入口，确保所有核心页面非空白且可操作。');
  }
  if (score.workspaceStructure < 20) {
    suggestions.push('优先完善工作台三栏、编辑区、候选区、版本入口和导出入口。');
  }
  if (score.visualStyle < 20) {
    suggestions.push('统一深色基底、灰卡片、圆角和按钮层级，并持续检查 1440/1366 视口。');
  }
  if (score.productionFlow < 20) {
    suggestions.push('把创作设定到导出的生产步骤继续从 Mock 推进到可验证链路。');
  }
  if (score.homePageScore < 95) {
    suggestions.push('优先补齐首页导航、Hero、生产链路、任务卡和模板区，直到 homePageScore 达到 95 以上。');
  }

  if (!suggestions.length) {
    suggestions.push('当前已达到精修门槛，下一步可增加真实 AI、真实导出和更细的视觉基准。');
  }

  return suggestions;
}

function buildManualGuide(reason) {
  const routes = INDEPENDENT_PAGES.map((page) => page.path);
  return [
    '# Text Master Manual Visual Audit Guide',
    '',
    `Reason: ${reason}`,
    '',
    '## Required routes',
    '',
    ...routes.map((route) => `- ${joinUrl('http://127.0.0.1:5173', routeWithBasePath(route))}`),
    '',
    '## Required viewport screenshots',
    '',
    ...INDEPENDENT_PAGES.flatMap((page) =>
      VIEWPORTS.map((viewport) => `- ${page.key}-${viewport.name}.png`),
    ),
    '',
    '## Workspace internal screenshots',
    '',
    ...WORKSPACE_STEPS.map((step) => `- ${step.key}-1440x900.png`),
    '',
  ].join('\n');
}

function summaryObject() {
  return {
    startedAt: auditState.startedAt,
    finishedAt: auditState.finishedAt || new Date().toISOString(),
    runDir: path.relative(ROOT_DIR, RUN_DIR).replace(/\\/g, '/'),
    baseUrl: auditState.baseUrl,
    basePath: auditState.basePath,
    projectId: auditState.projectId,
    playwrightBrowsersPath: path.relative(ROOT_DIR, PLAYWRIGHT_BROWSERS_PATH).replace(/\\/g, '/'),
    browserExecutablePath: BROWSER_EXECUTABLE_PATH,
    mode: auditState.mode,
    usedPlaywright: auditState.usedPlaywright,
    installedPlaywright: auditState.installedPlaywright,
    startedDevServer: auditState.startedDevServer,
    manualReason: auditState.manualReason,
    screenshotCount: auditState.screenshotCount,
    consoleErrorCount: auditState.consoleErrorCount,
    overflowPageCount: auditState.overflowPageCount,
    failedPageCount: auditState.failedPageCount,
    blankPageCount: auditState.blankPageCount,
    functionalSummary: auditState.functionalSummary,
  };
}

function artifactObject() {
  return {
    screenshotsDir: path.relative(ROOT_DIR, SCREENSHOT_DIR).replace(/\\/g, '/'),
    logsDir: path.relative(ROOT_DIR, LOG_DIR).replace(/\\/g, '/'),
    markdownReport: path.relative(ROOT_DIR, REPORT_MD).replace(/\\/g, '/'),
    jsonReport: path.relative(ROOT_DIR, REPORT_JSON).replace(/\\/g, '/'),
    functionalReport: path.relative(ROOT_DIR, FUNCTIONAL_REPORT_JSON).replace(/\\/g, '/'),
    routeStatus: path.relative(ROOT_DIR, ROUTE_STATUS_JSON).replace(/\\/g, '/'),
    consoleErrors: path.relative(ROOT_DIR, CONSOLE_ERRORS_JSON).replace(/\\/g, '/'),
    overflowReport: path.relative(ROOT_DIR, OVERFLOW_REPORT_JSON).replace(/\\/g, '/'),
    brainHubAdapterReport: path.relative(ROOT_DIR, BRAIN_HUB_REPORT_JSON).replace(/\\/g, '/'),
    zip: path.relative(ROOT_DIR, ZIP_PATH).replace(/\\/g, '/'),
  };
}

async function createAuditZip() {
  await writeAllReports();
  const includePaths = [
    SCREENSHOT_DIR,
    LOG_DIR,
    REPORT_MD,
    REPORT_JSON,
    FUNCTIONAL_REPORT_JSON,
    ROUTE_STATUS_JSON,
    CONSOLE_ERRORS_JSON,
    OVERFLOW_REPORT_JSON,
    BRAIN_HUB_REPORT_JSON,
  ];

  if (fs.existsSync(MANUAL_GUIDE_MD)) {
    includePaths.push(MANUAL_GUIDE_MD);
  }

  const files = [];
  for (const includePath of includePaths) {
    files.push(...listFiles(includePath));
  }

  const zipBuffer = buildZipBuffer(
    files.map((file) => ({
      absolutePath: file,
      zipPath: path.relative(RUN_DIR, file).replace(/\\/g, '/'),
    })),
  );
  await fs.promises.writeFile(ZIP_PATH, zipBuffer);
}

function buildZipBuffer(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const data = fs.readFileSync(file.absolutePath);
    const compressed = deflateRawSync(data);
    const name = Buffer.from(file.zipPath, 'utf8');
    const crc = crc32(data);
    const { time, date } = dosDateTime(new Date(fs.statSync(file.absolutePath).mtime));
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(date, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(date, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);

    offset += localHeader.length + name.length + compressed.length;
  }

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

function listFiles(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return [];
  }

  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    return [targetPath];
  }

  const files = [];
  for (const item of fs.readdirSync(targetPath, { withFileTypes: true })) {
    const fullPath = path.join(targetPath, item.name);
    if (item.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (item.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function writeJson(filePath, value) {
  await fs.promises.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function routeUrl(routePath) {
  return joinUrl(auditState.baseUrl, routeWithBasePath(routePath));
}

function routeWithBasePath(routePath) {
  if (!BASE_PATH) {
    return routePath;
  }

  return routePath === '/' ? BASE_PATH : `${BASE_PATH}${routePath}`;
}

function joinUrl(baseUrl, routePath) {
  return new URL(routePath, `${normalizeBaseUrl(baseUrl)}/`).toString();
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function normalizeBasePath(value) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') {
    return '';
  }

  return trimmed.startsWith('/') ? trimmed.replace(/\/+$/, '') : `/${trimmed.replace(/\/+$/, '')}`;
}

function ensureDirectories() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function logLine(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(AUDIT_LOG, line, 'utf8');
  console.log(message);
}

function runCommand(command, args, cwd, logPath, extraEnv = {}) {
  return new Promise((resolve) => {
    const log = fs.createWriteStream(logPath, { flags: 'a' });
    let child;
    let settled = false;
    let timedOut = false;
    try {
      const spawnCommand = commandForSpawn(command, args);
      child = spawn(spawnCommand.command, spawnCommand.args, {
        cwd,
        env: { ...process.env, ...extraEnv },
        shell: false,
        windowsHide: true,
      });
    } catch (error) {
      log.end(`\n${error.stack || error.message}\n`);
      resolve({ exitCode: 1 });
      return;
    }

    const finish = (exitCode) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      resolve({ exitCode: timedOut ? 124 : exitCode });
    };
    const timer = setTimeout(() => {
      timedOut = true;
      fs.appendFileSync(
        logPath,
        `\nCommand timed out after ${COMMAND_TIMEOUT_MS}ms: ${command} ${args.join(' ')}\n`,
        'utf8',
      );
      if (process.platform === 'win32' && child.pid) {
        spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
      finish(124);
    }, COMMAND_TIMEOUT_MS);

    child.stdout?.pipe(log);
    child.stderr?.pipe(log);
    child.on('close', (exitCode) => finish(exitCode));
    child.on('error', (error) => {
      fs.appendFileSync(logPath, `\n${error.stack || error.message}\n`, 'utf8');
      finish(1);
    });
  });
}

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function npxCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

function commandForSpawn(command, args) {
  if (process.platform !== 'win32') {
    return { command, args };
  }

  return {
    command: process.env.ComSpec || 'cmd.exe',
    args: ['/d', '/s', '/c', [quoteCmdArg(command), ...args.map(quoteCmdArg)].join(' ')],
  };
}

function quoteCmdArg(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_./:-]+$/.test(text)) {
    return text;
  }

  return `"${text.replace(/(["^&|<>])/g, '^$1')}"`;
}

function readTextIfExists(relativePath) {
  const filePath = path.join(ROOT_DIR, relativePath);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function pathToFileUrl(filePath) {
  const normalized = path.resolve(filePath).replace(/\\/g, '/');
  return `file://${normalized.startsWith('/') ? '' : '/'}${normalized}`;
}

function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, '');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

function dosDateTime(date) {
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
  return { time, date: dosDate };
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
