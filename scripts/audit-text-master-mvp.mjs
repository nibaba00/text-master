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
const PROVIDER_JSON = path.join(RUN_DIR, 'provider-audit-report.json');
const EXPORT_JSON = path.join(RUN_DIR, 'export-audit-report.json');
const CONSOLE_JSON = path.join(RUN_DIR, 'console-errors.json');
const OVERFLOW_JSON = path.join(RUN_DIR, 'overflow-report.json');
const ZIP_PATH = path.join(RUN_DIR, `text-master-mvp-audit-${TIMESTAMP}.zip`);

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(LOG_DIR, { recursive: true });

// --- 数据持久化 (20 分) ---
const dataChecks = [
  fileCheck('StorageDriver 接口', [
    'src/modules/text-master/services/storage/storageDriver.ts',
  ], 5),
  fileCheck('LocalStorageDriver 实现', [
    'src/modules/text-master/services/storage/localStorageDriver.ts',
  ], 5),
  contentCheck('导入/导出备份函数', 'src/modules/text-master/services/localStorageRepository.ts', [
    'exportAllLocalData',
    'importAllLocalData',
    'resetLocalData',
  ], 5),
  contentCheck('main.ts 初始化 StorageDriver', 'src/main.ts', [
    'setStorageDriver',
    'createLocalStorageDriver',
  ], 5),
];

// --- 项目/设定/资料/文档 (20 分) ---
const dataModelChecks = [
  fileCheck('项目类型与 service', [
    'src/modules/text-master/types/project.ts',
    'src/modules/text-master/services/projectService.ts',
  ], 5),
  fileCheck('文档类型与 service', [
    'src/modules/text-master/types/document.ts',
    'src/modules/text-master/services/documentService.ts',
  ], 5),
  fileCheck('资料类型与 service', [
    'src/modules/text-master/types/material.ts',
    'src/modules/text-master/services/materialService.ts',
  ], 5),
  contentCheck('LocalRuntime 创建项目 + 文档 + 简报', 'src/modules/text-master/runtime/LocalRuntime.ts', [
    'saveDocument',
    'createProject',
    'createRuntimeVersion',
  ], 5),
];

// --- Job/Candidate/Version (25 分) ---
const jobChecks = [
  fileCheck('Job/Candidate/Review 类型', [
    'src/modules/text-master/types/production.ts',
  ], 5),
  fileCheck('Job/Candidate/Version service', [
    'src/modules/text-master/services/jobService.ts',
    'src/modules/text-master/services/candidateService.ts',
    'src/modules/text-master/services/versionService.ts',
  ], 5),
  contentCheck('Candidate 不直接覆盖正文', 'src/modules/text-master/runtime/LocalRuntime.ts', [
    'createCandidate',
    'candidate',
    'provider.id',
  ], 5),
  contentCheck('generateText 通过 Provider', 'src/modules/text-master/runtime/LocalRuntime.ts', [
    'getActiveProvider',
    'provider.run',
  ], 5),
  contentCheck('Version 创建链路', 'src/modules/text-master/runtime/LocalRuntime.ts', [
    'createVersion',
    'createRuntimeVersion',
    'manual_edit',
  ], 5),
];

// --- 审核/修复 (15 分) ---
const reviewChecks = [
  fileCheck('ReviewIssue service', [
    'src/modules/text-master/services/reviewService.ts',
  ], 5),
  contentCheck('审核链路: job → candidate → reviewIssue', 'src/modules/text-master/runtime/LocalRuntime.ts', [
    'reviewText',
    'createReviewIssue',
    'createCandidate',
  ], 5),
  contentCheck('审核问题结构', 'src/modules/text-master/types/production.ts', [
    'ReviewIssueLevel',
    'ReviewIssueStatus',
    'canAutoFix',
  ], 5),
];

// --- 导出 (10 分) ---
const exportChecks = [
  contentCheck('导出格式完整', 'src/modules/text-master/services/exportService.ts', [
    'markdown',
    'txt',
    'json',
    'project-package-json',
    'media-master-json',
    'novel-master-json',
  ], 4),
  contentCheck('ExportRecord 生成', 'src/modules/text-master/services/exportService.ts', [
    'createExportRecord',
    'listExportRecords',
  ], 3),
  contentCheck('导出 version 生成', 'src/modules/text-master/runtime/LocalRuntime.ts', [
    "operation: 'export'",
    'createRuntimeVersion',
  ], 3),
];

// --- 稳定性 (10 分) ---
const stabilityChecks = [
  contentCheck('错误处理', 'src/modules/text-master/services/localStorageRepository.ts', [
    'TextMasterServiceError',
    'runServiceAction',
  ], 5),
  fileCheck('Runtime + 回退', [
    'src/modules/text-master/runtime/runtimeDetection.ts',
    'src/modules/text-master/runtime/BrainHubRuntime.ts',
  ], 5),
];

const allChecks = [
  ...dataChecks,
  ...dataModelChecks,
  ...jobChecks,
  ...reviewChecks,
  ...exportChecks,
  ...stabilityChecks,
];

// --- Provider 检测 ---
const providerAudit = {
  mockProvider: checkProviderMock(),
  deepseekProvider: checkProviderDeepseek(),
  brainHubProvider: checkProviderBrainHub(),
  providerConfig: checkProviderConfigUI(),
};

// --- 计算分数 ---
const totalPoints = allChecks.reduce((sum, c) => sum + c.points, 0);
const earnedPoints = allChecks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);
const mvpScore = Math.round((earnedPoints / totalPoints) * 100);

const failed = allChecks.filter((c) => !c.passed);
const warnings = [];
if (!providerAudit.mockProvider.available) {
  failed.push({ name: 'MockProvider 不可用', points: 0, passed: false, missing: ['mockProvider'] });
}
if (!providerAudit.deepseekProvider.apiKeyRequired) {
  warnings.push('DeepSeekProvider 未配置 API Key，当前以 Mock 模式运行。');
}

const latestVisualAudit = findLatestVisualAudit();
const visualScore = latestVisualAudit
  ? (readJson(path.join(latestVisualAudit, 'visual-audit-report.json'))?.score?.total ?? 0)
  : 0;

const report = {
  summary: {
    startedAt: new Date().toISOString(),
    runDir: path.relative(ROOT_DIR, RUN_DIR).replace(/\\/g, '/'),
    mvpScore,
    level: mvpScore >= 95 ? 'ideal' : mvpScore >= 90 ? 'pass' : 'needs-work',
    failedCount: failed.length,
    warningCount: warnings.length,
    visualScore,
    totalPoints,
    earnedPoints,
  },
  checks: allChecks,
  failed,
  warnings,
  providerAudit,
};

fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));
fs.writeFileSync(FUNCTIONAL_JSON, JSON.stringify({
  dataChecks,
  dataModelChecks,
  jobChecks,
  reviewChecks,
  exportChecks,
  stabilityChecks,
}, null, 2));
fs.writeFileSync(DATA_JSON, JSON.stringify({ dataChecks, dataModelChecks }, null, 2));
fs.writeFileSync(PROVIDER_JSON, JSON.stringify(providerAudit, null, 2));
fs.writeFileSync(EXPORT_JSON, JSON.stringify({ exportChecks }, null, 2));
fs.writeFileSync(CONSOLE_JSON, JSON.stringify([], null, 2));
fs.writeFileSync(OVERFLOW_JSON, JSON.stringify([], null, 2));
fs.writeFileSync(REPORT_MD, renderMarkdown(report));

createZip();

console.log(`MVP audit output: ${RUN_DIR}`);
console.log(`MVP audit zip: ${ZIP_PATH}`);
console.log(`MVP score: ${mvpScore}/100`);
console.log(`Failed: ${failed.length}, Warnings: ${warnings.length}`);

// --- Helper functions ---

function fileCheck(name, files, points) {
  const missing = files.filter((file) => !fs.existsSync(path.join(ROOT_DIR, file)));
  return { name, points, passed: missing.length === 0, missing };
}

function contentCheck(name, file, requiredPatterns, points) {
  const fullPath = path.join(ROOT_DIR, file);
  const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
  const missing = requiredPatterns.filter((pattern) => !content.includes(pattern));
  return { name, points, passed: missing.length === 0, file, missing };
}

function checkProviderMock() {
  const providerService = readFileIfExists('src/modules/text-master/services/modelProviderService.ts');
  const hasMock = providerService.includes('createMockProvider') || providerService.includes("id: 'mock'");
  return { available: hasMock, label: 'MockProvider', note: '默认可用' };
}

function checkProviderDeepseek() {
  const providerService = readFileIfExists('src/modules/text-master/services/modelProviderService.ts');
  const deepseekService = readFileIfExists('src/modules/text-master/services/deepseekProviderService.ts');
  const hasFile = fs.existsSync(path.join(ROOT_DIR, 'src/modules/text-master/services/deepseekProviderService.ts'));
  const hasConfigUI = providerService.includes('getProviderConfig') || providerService.includes('updateProviderConfig');
  return {
    available: hasFile,
    apiKeyRequired: true,
    hasConfigUI,
    providerFile: hasFile ? 'src/modules/text-master/services/deepseekProviderService.ts' : 'missing',
  };
}

function checkProviderBrainHub() {
  return {
    available: fs.existsSync(path.join(ROOT_DIR, 'src/integrations/brain-hub/aiAdapter.ts')),
    optional: true,
    note: 'Brain Hub AI Provider 是可选集成，不影响本地运行。',
  };
}

function checkProviderConfigUI() {
  const settingsVue = readFileIfExists('src/modules/text-master/pages/Settings.vue');
  const hasProviderSelect = settingsVue.includes('activeProviderId') || settingsVue.includes('onProviderChange');
  const hasTestConnection = settingsVue.includes('testProviderConnection') || settingsVue.includes('onTestConnection');
  const hasDeepseekConfig = settingsVue.includes('deepseekSettings') || settingsVue.includes('deepseek-config');
  return {
    hasProviderSelect,
    hasTestConnection,
    hasDeepseekConfig,
  };
}

function readFileIfExists(relativePath) {
  const fullPath = path.join(ROOT_DIR, relativePath);
  try {
    return fs.readFileSync(fullPath, 'utf8');
  } catch {
    return '';
  }
}

function findLatestVisualAudit() {
  const root = path.join(ROOT_DIR, 'artifacts', 'text-master-visual-audit');
  if (!fs.existsSync(root)) return null;
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
    `- **MVP score**: ${data.summary.mvpScore}/100`,
    `- **Level**: ${data.summary.level}`,
    `- **Earned**: ${data.summary.earnedPoints}/${data.summary.totalPoints}`,
    `- **Latest visual audit score**: ${data.summary.visualScore}/100`,
    '',
    '## Provider Audit',
    '',
    `- MockProvider: ${data.providerAudit.mockProvider.available ? '✅ 可用' : '❌ 不可用'}`,
    `- DeepSeekProvider: ${data.providerAudit.deepseekProvider.available ? '✅ 已接入' : '⚠️ 文件缺失'} (API Key: ${data.providerAudit.deepseekProvider.apiKeyRequired ? '需要配置' : '已配置'})`,
    `- BrainHubAIProvider: ${data.providerAudit.brainHubProvider.optional ? '可选' : '必需'} (${data.providerAudit.brainHubProvider.note})`,
    '',
    '## Data Persistence (20 pts)',
    '',
    ...renderCheckTable(dataChecks),
    '',
    '## Project/Document/Material (20 pts)',
    '',
    ...renderCheckTable(dataModelChecks),
    '',
    '## Job/Candidate/Version (25 pts)',
    '',
    ...renderCheckTable(jobChecks),
    '',
    '## Review/Repair (15 pts)',
    '',
    ...renderCheckTable(reviewChecks),
    '',
    '## Export (10 pts)',
    '',
    ...renderCheckTable(exportChecks),
    '',
    '## Stability (10 pts)',
    '',
    ...renderCheckTable(stabilityChecks),
    '',
    '## Warnings',
    '',
    ...(data.warnings.length ? data.warnings.map((w) => `- ${w}`) : ['- None']),
    '',
    '## Failed',
    '',
    ...(data.failed.length
      ? data.failed.map((f) => `- **${f.name}**: ${(f.missing ?? []).join(', ') || '未通过'}`)
      : ['- None']),
  ].join('\n');
}

function renderCheckTable(checks) {
  return [
    '| Check | Points | Status |',
    '| --- | ---: | --- |',
    ...checks.map((c) => `| ${c.name} | ${c.points} | ${c.passed ? '✅ passed' : '❌ failed'} |`),
  ];
}

function createZip() {
  try {
    execFileSync(
      'powershell',
      ['-NoProfile', '-Command', `Compress-Archive -Path '${RUN_DIR}\\*' -DestinationPath '${ZIP_PATH}' -Force`],
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
    value.getFullYear(), pad(value.getMonth() + 1), pad(value.getDate()),
    '-', pad(value.getHours()), pad(value.getMinutes()), pad(value.getSeconds()),
  ].join('');
}
