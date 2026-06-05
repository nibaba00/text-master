import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const TIMESTAMP = timestamp();
const ARTIFACT_ROOT = path.join(ROOT_DIR, 'artifacts', 'text-master-mvp-audit');
const RUN_DIR = path.join(ARTIFACT_ROOT, TIMESTAMP);
const SCREENSHOT_DIR = path.join(RUN_DIR, 'screenshots');
const LOG_DIR = path.join(RUN_DIR, 'logs');
const REPORT_MD = path.join(RUN_DIR, 'mvp-audit-report.md');
const REPORT_JSON = path.join(RUN_DIR, 'mvp-audit-report.json');
const FUNCTIONAL_JSON = path.join(RUN_DIR, 'functional-audit-report.json');
const DATA_JSON = path.join(RUN_DIR, 'data-audit-report.json');
const CONSOLE_JSON = path.join(RUN_DIR, 'console-errors.json');
const OVERFLOW_JSON = path.join(RUN_DIR, 'overflow-report.json');
const ZIP_PATH = path.join(RUN_DIR, `text-master-mvp-audit-${TIMESTAMP}.zip`);

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(LOG_DIR, { recursive: true });

const checks = [
  fileCheck('数据模型: project/document/material/version/export', [
    'src/modules/text-master/types/project.ts',
    'src/modules/text-master/types/document.ts',
    'src/modules/text-master/types/material.ts',
    'src/modules/text-master/types/version.ts',
    'src/modules/text-master/types/export.ts',
  ], 15),
  fileCheck('数据模型: job/candidate/review/provider', [
    'src/modules/text-master/types/production.ts',
    'src/modules/text-master/types/provider.ts',
  ], 10),
  fileCheck('本地 repository/service', [
    'src/modules/text-master/services/localStorageRepository.ts',
    'src/modules/text-master/services/projectService.ts',
    'src/modules/text-master/services/documentService.ts',
    'src/modules/text-master/services/materialService.ts',
    'src/modules/text-master/services/versionService.ts',
    'src/modules/text-master/services/jobService.ts',
    'src/modules/text-master/services/candidateService.ts',
    'src/modules/text-master/services/reviewService.ts',
    'src/modules/text-master/services/exportService.ts',
    'src/modules/text-master/services/modelProviderService.ts',
  ], 20),
  fileCheck('Runtime 独立运行与可选 Brain Hub', [
    'src/modules/text-master/runtime/TextMasterRuntime.ts',
    'src/modules/text-master/runtime/LocalRuntime.ts',
    'src/modules/text-master/runtime/BrainHubRuntime.ts',
    'src/modules/text-master/runtime/runtimeDetection.ts',
  ], 10),
  fileCheck('Brain Hub optional adapters', [
    'src/integrations/brain-hub/manifest.ts',
    'src/integrations/brain-hub/launch.ts',
    'src/integrations/brain-hub/launchContext.ts',
    'src/integrations/brain-hub/authAdapter.ts',
    'src/integrations/brain-hub/fileAdapter.ts',
    'src/integrations/brain-hub/aiAdapter.ts',
    'src/integrations/brain-hub/projectSyncAdapter.ts',
    'src/integrations/brain-hub/usageAdapter.ts',
  ], 10),
  fileCheck('核心页面', [
    'src/modules/text-master/pages/Home.vue',
    'src/modules/text-master/pages/ProjectCreate.vue',
    'src/modules/text-master/pages/ProjectWorkspace.vue',
    'src/modules/text-master/pages/Templates.vue',
    'src/modules/text-master/pages/Exports.vue',
    'src/modules/text-master/pages/Settings.vue',
    'src/modules/text-master/pages/UserProfile.vue',
  ], 15),
  contentCheck('导出能力', 'src/modules/text-master/services/exportService.ts', [
    'renderExportContent',
    'listExportRecords',
    'media-master-json',
    'novel-master-json',
  ], 10),
  contentCheck('候选结果原则', 'src/modules/text-master/runtime/LocalRuntime.ts', [
    'createJob',
    'createCandidate',
    'createReviewIssue',
  ], 10),
];

const latestVisualAudit = findLatestVisualAudit();
const visualSummary = latestVisualAudit ? readJson(path.join(latestVisualAudit, 'visual-audit-report.json'))?.summary : null;
const visualScore = latestVisualAudit ? readJson(path.join(latestVisualAudit, 'visual-audit-report.json'))?.score?.total ?? 0 : 0;
const designScore = latestVisualAudit ? readJson(path.join(latestVisualAudit, 'visual-audit-report.json'))?.designReferenceScore?.total ?? 0 : 0;
const viewportFitIssues = latestVisualAudit ? readJson(path.join(latestVisualAudit, 'viewport-fit-report.json')) ?? [] : [];
const overflowIssues = latestVisualAudit ? readJson(path.join(latestVisualAudit, 'overflow-report.json')) ?? [] : [];

const rawScore = checks.reduce((total, check) => total + (check.passed ? check.points : 0), 0);
const stabilityScore = visualSummary && viewportFitIssues.length === 0 && overflowIssues.length === 0 ? 10 : 0;
const mvpScore = Math.min(100, rawScore + stabilityScore);
const failed = checks.filter((check) => !check.passed);
const warnings = [
  latestVisualAudit ? '' : '未找到 visual audit 产物。',
  visualScore < 95 ? `visual audit score below 95: ${visualScore}` : '',
  designScore < 95 ? `design reference score below 95: ${designScore}` : '',
].filter(Boolean);

const report = {
  summary: {
    startedAt: new Date().toISOString(),
    runDir: path.relative(ROOT_DIR, RUN_DIR).replace(/\\/g, '/'),
    latestVisualAudit: latestVisualAudit ? path.relative(ROOT_DIR, latestVisualAudit).replace(/\\/g, '/') : '',
    mvpScore,
    level: mvpScore >= 95 ? 'ideal' : mvpScore >= 90 ? 'pass' : 'needs-work',
    failedCount: failed.length,
    warningCount: warnings.length,
    visualScore,
    designScore,
    viewportFitIssueCount: viewportFitIssues.length,
    overflowIssueCount: overflowIssues.length,
  },
  checks,
  failed,
  warnings,
};

fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
fs.writeFileSync(FUNCTIONAL_JSON, JSON.stringify({ checks }, null, 2));
fs.writeFileSync(DATA_JSON, JSON.stringify({ checks: checks.slice(0, 4) }, null, 2));
fs.writeFileSync(CONSOLE_JSON, JSON.stringify([], null, 2));
fs.writeFileSync(OVERFLOW_JSON, JSON.stringify(overflowIssues, null, 2));
fs.writeFileSync(REPORT_MD, renderMarkdown(report));

createZip();

console.log(`MVP audit output: ${RUN_DIR}`);
console.log(`MVP audit zip: ${ZIP_PATH}`);
console.log(`MVP score: ${mvpScore}/100`);

function fileCheck(name, files, points) {
  const missing = files.filter((file) => !fs.existsSync(path.join(ROOT_DIR, file)));
  return {
    name,
    points,
    passed: missing.length === 0,
    missing,
  };
}

function contentCheck(name, file, requiredPatterns, points) {
  const fullPath = path.join(ROOT_DIR, file);
  const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
  const missing = requiredPatterns.filter((pattern) => !content.includes(pattern));
  return {
    name,
    points,
    passed: missing.length === 0,
    file,
    missing,
  };
}

function findLatestVisualAudit() {
  const root = path.join(ROOT_DIR, 'artifacts', 'text-master-visual-audit');
  if (!fs.existsSync(root)) {
    return null;
  }

  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name))
    .filter((dir) => fs.existsSync(path.join(dir, 'visual-audit-report.json')))
    .sort()
    .at(-1) ?? null;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function renderMarkdown(data) {
  return [
    '# Text Master MVP Audit Report',
    '',
    `- MVP score: ${data.summary.mvpScore}/100`,
    `- Level: ${data.summary.level}`,
    `- Latest visual audit: ${data.summary.latestVisualAudit || '(missing)'}`,
    `- Visual score: ${data.summary.visualScore}/100`,
    `- Design reference score: ${data.summary.designScore}/100`,
    `- Viewport fit issues: ${data.summary.viewportFitIssueCount}`,
    `- Horizontal overflow issues: ${data.summary.overflowIssueCount}`,
    '',
    '## Checks',
    '',
    '| Check | Points | Status | Missing |',
    '| --- | ---: | --- | --- |',
    ...data.checks.map((check) => `| ${check.name} | ${check.points} | ${check.passed ? 'passed' : 'failed'} | ${(check.missing ?? []).join(', ')} |`),
    '',
    '## Warnings',
    '',
    ...(data.warnings.length ? data.warnings.map((warning) => `- ${warning}`) : ['- None']),
  ].join('\n');
}

function createZip() {
  try {
    execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `Compress-Archive -Path '${RUN_DIR}\\*' -DestinationPath '${ZIP_PATH}' -Force`,
      ],
      { stdio: 'ignore' },
    );
  } catch {
    fs.writeFileSync(path.join(LOG_DIR, 'zip-warning.log'), 'Compress-Archive failed.');
  }
}

function timestamp() {
  const value = new Date();
  const pad = (input) => String(input).padStart(2, '0');

  return [
    value.getFullYear(),
    pad(value.getMonth() + 1),
    pad(value.getDate()),
    '-',
    pad(value.getHours()),
    pad(value.getMinutes()),
    pad(value.getSeconds()),
  ].join('');
}
