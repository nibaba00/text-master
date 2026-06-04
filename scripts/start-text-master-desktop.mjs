import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TIMESTAMP = formatTimestamp(new Date());
const RUN_DIR = path.join(ROOT_DIR, 'artifacts', 'text-master-desktop', TIMESTAMP);
const LOG_DIR = path.join(RUN_DIR, 'logs');
const DEV_STDOUT_LOG = path.join(LOG_DIR, 'dev-server.out.log');
const DEV_STDERR_LOG = path.join(LOG_DIR, 'dev-server.err.log');

const ENV_URL = process.env.TEXTMASTER_DESKTOP_URL?.trim();
const BASE_PATH = normalizeBasePath(process.env.TEXTMASTER_DESKTOP_BASE_PATH ?? '');
const ENTRY_PATH = normalizeRoutePath(process.env.TEXTMASTER_DESKTOP_ENTRY ?? '/');
const ENV_BROWSER_PATH = process.env.TEXTMASTER_DESKTOP_BROWSER_PATH?.trim();
const DRY_RUN = process.argv.includes('--dry-run') || process.env.TEXTMASTER_DESKTOP_DRY_RUN === '1';

await main();

async function main() {
  ensureDirectories();

  const browser = findDesktopBrowser();
  if (!browser) {
    fail(
      [
        'No local desktop browser runtime was found.',
        'Set TEXTMASTER_DESKTOP_BROWSER_PATH to a Chrome, Edge, Chromium, or WebView2 executable.',
      ].join(' '),
    );
  }

  const packageJson = readPackageJson();
  const devScriptName = pickWebDevScript(packageJson);
  const targetUrl = ENV_URL ? joinUrl(ENV_URL, routeWithBasePath(ENTRY_PATH)) : null;

  if (DRY_RUN) {
    console.log(
      JSON.stringify(
        {
          mode: 'desktop',
          dryRun: true,
          browser,
          url: targetUrl || joinUrl('http://127.0.0.1:5173', routeWithBasePath(ENTRY_PATH)),
          wouldStartDevServer: !ENV_URL,
          devScript: ENV_URL ? null : `npm run ${devScriptName}`,
          basePath: BASE_PATH,
          entry: ENTRY_PATH,
        },
        null,
        2,
      ),
    );
    return;
  }

  let devServer = null;
  let desktopProcess = null;

  const cleanup = async () => {
    if (desktopProcess && desktopProcess.exitCode === null) {
      desktopProcess.kill();
    }

    if (devServer) {
      await stopDevServer(devServer.child);
    }
  };

  process.on('SIGINT', async () => {
    await cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(143);
  });

  try {
    const baseUrl = ENV_URL ? normalizeBaseUrl(ENV_URL) : (devServer = await startDevServer(devScriptName)).url;
    const launchUrl = joinUrl(baseUrl, routeWithBasePath(ENTRY_PATH));
    const args = buildDesktopArgs(browser, launchUrl);

    console.log(`Text Master desktop mode: ${launchUrl}`);
    console.log(`Desktop runtime: ${browser.path}`);

    desktopProcess = spawn(browser.path, args, {
      cwd: ROOT_DIR,
      detached: false,
      stdio: 'ignore',
      windowsHide: false,
    });

    desktopProcess.on('error', (error) => {
      fail(`Failed to launch desktop runtime: ${error.message}`);
    });

    await waitForExit(desktopProcess);
  } finally {
    if (devServer) {
      await stopDevServer(devServer.child);
    }
  }
}

function readPackageJson() {
  return JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
}

function pickWebDevScript(packageJson) {
  if (packageJson.scripts?.['dev:web']) {
    return 'dev:web';
  }

  const devScript = packageJson.scripts?.dev;
  if (!devScript) {
    fail('No dev or dev:web script found in package.json.');
  }

  if (devScript.includes('start-text-master-desktop')) {
    fail('package.json dev script points to desktop mode. Add a dev:web script for the local Vite server.');
  }

  return 'dev';
}

async function startDevServer(devScriptName) {
  const child = spawn(npmCommand(), ['run', devScriptName], {
    cwd: ROOT_DIR,
    env: { ...process.env, FORCE_COLOR: '0' },
    shell: process.platform === 'win32',
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
  return { child, url };
}

async function waitForDevServerUrl(child, getOutput) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 30000) {
    const output = getOutput();
    const match = output.match(/https?:\/\/(?:127\.0\.0\.1|localhost):\d+/i);
    if (match?.[0] && (await canFetch(match[0]))) {
      return normalizeBaseUrl(match[0]);
    }

    if (child.exitCode !== null) {
      fail(`Dev server exited before it became reachable. See ${path.relative(ROOT_DIR, DEV_STDERR_LOG)}.`);
    }

    await sleep(300);
  }

  fail('Timed out waiting for the local Text Master dev server.');
}

async function stopDevServer(child) {
  if (!child || child.exitCode !== null) {
    return;
  }

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
}

function findDesktopBrowser() {
  if (ENV_BROWSER_PATH) {
    if (!fs.existsSync(ENV_BROWSER_PATH)) {
      fail(`TEXTMASTER_DESKTOP_BROWSER_PATH does not exist: ${ENV_BROWSER_PATH}`);
    }

    return { type: 'custom', path: ENV_BROWSER_PATH };
  }

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

function buildDesktopArgs(browser, url) {
  const profileDir = path.join(ROOT_DIR, 'artifacts', 'text-master-desktop', 'profile');
  fs.mkdirSync(profileDir, { recursive: true });

  return [
    `--app=${url}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--disable-extensions',
    '--disable-sync',
    browser.type === 'webview2' ? '--edge-webview-switches=--disable-features=msSmartScreenProtection' : '',
  ].filter(Boolean);
}

async function canFetch(baseUrl) {
  try {
    const response = await fetch(joinUrl(baseUrl, routeWithBasePath('/')), { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
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

function normalizeRoutePath(value) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
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

function ensureDirectories() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function waitForExit(child) {
  return new Promise((resolve) => {
    child.on('close', resolve);
  });
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

function fail(message) {
  console.error(message);
  process.exit(1);
}
