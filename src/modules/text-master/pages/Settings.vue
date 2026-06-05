<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import TopNav from '../components/TopNav.vue';
import { createTextMasterRuntime, type RuntimeMode } from '../runtime/TextMasterRuntime';
import { detectRuntimeMode } from '../runtime/runtimeDetection';
import {
  getProviderConfig,
  updateProviderConfig,
  listTextModelProviders,
  testProviderConnection,
} from '../services/modelProviderService';
import {
  exportAllLocalData,
  importAllLocalData,
  resetLocalData,
} from '../services/localStorageRepository';
import type { ProviderId, ProviderConfig } from '../types/provider';

type AdapterStatus = '未连接' | '可用' | 'Mock';
type ExportFormat = 'markdown' | 'txt' | 'json';
type GenerationStrategy = 'faithful' | 'expand' | 'rebuild';

const detectedMode = ref<RuntimeMode>('local');
const activeRuntimeMode = ref<RuntimeMode>('local');
const settingsFeedback = ref('设置页已加载，配置保存在本地。');
const loadError = ref('');
const testingConnection = ref(false);
const testResult = ref<{ ok: boolean; message: string } | null>(null);

// --- Provider 配置 ---
const providerConfig = reactive<ProviderConfig>(getProviderConfig());
const providers = ref(listTextModelProviders());
const activeProviderId = ref<ProviderId>(providerConfig.activeProvider);

const deepseekSettings = reactive({
  apiKey: providerConfig.deepseek.apiKey,
  baseUrl: providerConfig.deepseek.baseUrl,
  model: providerConfig.deepseek.model,
});

const currentProviderLabel = computed(() => {
  const p = providers.value.find((pv) => pv.id === activeProviderId.value);
  return p?.label ?? '未知';
});

const currentProviderAvailable = computed(() => {
  const p = providers.value.find((pv) => pv.id === activeProviderId.value);
  return p?.available ?? false;
});

// --- 其他设置 ---
const aiSettings = reactive({
  defaultStrategy: 'expand' as GenerationStrategy,
});

const editorSettings = reactive({
  fontSize: 15,
  autoSave: true,
  autoVersion: true,
});

const exportSettings = reactive({
  defaultFormat: 'markdown' as ExportFormat,
  exportPath: 'local://text-master/exports',
  syncBrainHubFiles: false,
});

const strategyOptions: Array<{
  value: GenerationStrategy;
  label: string;
  description: string;
}> = [
  { value: 'faithful', label: '忠实原文', description: '尽量保留原设定和原表达。' },
  { value: 'expand', label: '适度扩写', description: '默认策略，保留核心并补充结构细节。' },
  { value: 'rebuild', label: '大幅重构', description: '允许重排结构和表达方式。' },
];

const exportFormatOptions: Array<{ value: ExportFormat; label: string }> = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'txt', label: 'TXT' },
  { value: 'json', label: 'JSON' },
];

const hubAdapterStatus = computed<AdapterStatus>(() => {
  if (activeRuntimeMode.value === 'brain-hub') return 'Mock';
  if (detectedMode.value === 'brain-hub') return '可用';
  return exportSettings.syncBrainHubFiles ? 'Mock' : '未连接';
});

const runtimeRows = computed(() => [
  { label: '检测结果', value: detectedMode.value === 'brain-hub' ? 'Brain Hub Mode' : 'Local Mode' },
  { label: '当前 Runtime', value: activeRuntimeMode.value === 'brain-hub' ? 'Brain Hub Mode' : 'Local Mode' },
  { label: '存储策略', value: activeRuntimeMode.value === 'brain-hub' ? 'Hub adapter stub + Local fallback' : 'LocalRuntime / localStorage' },
]);

const adapterRows = computed(() => [
  { label: 'Adapter 状态', value: hubAdapterStatus.value },
  { label: '文件库同步', value: exportSettings.syncBrainHubFiles ? 'Mock 开启' : '未开启' },
  { label: '运行前置', value: 'Brain Hub 非必选，Local Mode 可完整使用' },
]);

onMounted(async () => {
  try {
    detectedMode.value = detectRuntimeMode();
    const runtime = await createTextMasterRuntime();
    activeRuntimeMode.value = runtime.getRuntimeMode();
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '无法读取 Runtime 设置';
  }
});

// --- Provider 操作 ---

function onProviderChange(providerId: ProviderId): void {
  activeProviderId.value = providerId;
  providerConfig.activeProvider = providerId;
  updateProviderConfig(providerConfig);
  providers.value = listTextModelProviders();
  settingsFeedback.value = `已切换为 ${currentProviderLabel.value}。`;
  testResult.value = null;
}

function saveProviderSettings(): void {
  const updated = updateProviderConfig({
    activeProvider: activeProviderId.value,
    deepseek: {
      apiKey: deepseekSettings.apiKey,
      baseUrl: deepseekSettings.baseUrl,
      model: deepseekSettings.model,
    },
  });
  providerConfig.activeProvider = updated.activeProvider;
  providerConfig.deepseek = { ...updated.deepseek };
  providers.value = listTextModelProviders();

  const isDeepseek = updated.activeProvider === 'deepseek';
  const hasKey = updated.deepseek.apiKey.length > 0;
  settingsFeedback.value = isDeepseek && hasKey
    ? `DeepSeek 配置已保存。模型：${updated.deepseek.model}`
    : 'Provider 配置已保存。';
  testResult.value = null;
}

async function onTestConnection(): Promise<void> {
  testingConnection.value = true;
  testResult.value = null;
  try {
    testResult.value = await testProviderConnection(activeProviderId.value);
  } catch {
    testResult.value = { ok: false, message: '连接测试异常。' };
  } finally {
    testingConnection.value = false;
  }
}

function saveAllSettings(): void {
  saveProviderSettings();
  settingsFeedback.value = [
    '所有设置已保存',
    `Provider：${currentProviderLabel.value}`,
    `策略：${aiSettings.defaultStrategy}`,
    `字号：${editorSettings.fontSize}px`,
    `导出：${exportSettings.defaultFormat}`,
  ].join(' / ');
}

function resetAllSettings(): void {
  const defaults = updateProviderConfig({
    activeProvider: 'mock',
    deepseek: { apiKey: '', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  });
  providerConfig.activeProvider = defaults.activeProvider;
  providerConfig.deepseek = { ...defaults.deepseek };
  deepseekSettings.apiKey = '';
  deepseekSettings.baseUrl = 'https://api.deepseek.com';
  deepseekSettings.model = 'deepseek-chat';
  activeProviderId.value = 'mock';
  providers.value = listTextModelProviders();

  aiSettings.defaultStrategy = 'expand';
  editorSettings.fontSize = 15;
  editorSettings.autoSave = true;
  editorSettings.autoVersion = true;
  exportSettings.defaultFormat = 'markdown';
  exportSettings.exportPath = 'local://text-master/exports';
  exportSettings.syncBrainHubFiles = false;
  settingsFeedback.value = '已恢复默认设置。';
  testResult.value = null;
}

// --- 存储备份操作 ---

const exportedData = ref<string>('');
const importDataInput = ref('');

function handleExportData(): void {
  const data = exportAllLocalData();
  exportedData.value = JSON.stringify(data, null, 2);

  const blob = new Blob([exportedData.value], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.download = `text-master-backup-${timestamp}.json`;
  a.click();
  URL.revokeObjectURL(url);

  const keyCount = Object.keys(data).length;
  settingsFeedback.value = `已导出 ${keyCount} 条本地数据。`;
}

function handleImportData(): void {
  const raw = importDataInput.value.trim();
  if (!raw) {
    settingsFeedback.value = '请粘贴备份 JSON 内容后再导入。';
    return;
  }

  try {
    const data = JSON.parse(raw) as Record<string, string>;
    const confirmed = window.confirm(
      `即将导入 ${Object.keys(data).length} 条数据。现有数据可能被覆盖，确认继续？`,
    );
    if (!confirmed) return;

    importAllLocalData(data);
    settingsFeedback.value = `已导入 ${Object.keys(data).length} 条数据。请刷新页面查看最新状态。`;
    importDataInput.value = '';
  } catch {
    settingsFeedback.value = '导入失败：JSON 格式无效。';
  }
}

function handleResetAllData(): void {
  const confirmed = window.confirm(
    '此操作将清空所有本地项目、文档、资料、版本和 AI 结果。此操作不可撤销，确认继续？',
  );
  if (!confirmed) return;

  resetLocalData();
  settingsFeedback.value = '所有本地数据已清空。请刷新页面查看最新状态。';
}

const storageDataCount = computed(() => {
  return Object.keys(exportAllLocalData()).length;
});
</script>

<template>
  <main class="tm-settings-page" data-testid="text-master-settings">
    <TopNav />

    <header class="tm-settings-header">
      <div>
        <p>Settings</p>
        <h1>设置</h1>
        <span>Text Master 可独立运行；Brain Hub 只是可选启动与同步适配层。</span>
      </div>
      <div class="tm-settings-actions">
        <button type="button" @click="resetAllSettings">恢复默认</button>
        <button type="button" class="tm-button-primary" @click="saveAllSettings">
          保存设置
        </button>
      </div>
    </header>

    <p v-if="loadError" class="tm-error">{{ loadError }}</p>
    <p class="tm-settings-feedback" aria-live="polite">{{ settingsFeedback }}</p>

    <section class="tm-settings-grid">
      <article class="tm-settings-card tm-runtime-card">
        <header>
          <p>Runtime</p>
          <h2>运行模式设置</h2>
        </header>
        <div class="tm-runtime-switch" aria-label="Runtime detection">
          <span :class="{ active: activeRuntimeMode === 'local' }">Local Mode</span>
          <span :class="{ active: activeRuntimeMode === 'brain-hub' }">
            Brain Hub Mode
          </span>
        </div>
        <dl>
          <div v-for="row in runtimeRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
      </article>

      <article class="tm-settings-card tm-ai-card">
        <header>
          <p>AI Provider</p>
          <h2>AI 模型设置</h2>
        </header>

        <!-- Provider 选择 -->
        <label>
          当前 Provider
          <select :value="activeProviderId" @change="onProviderChange(($event.target as HTMLSelectElement).value as ProviderId)">
            <option v-for="pv in providers" :key="pv.id" :value="pv.id">
              {{ pv.label }} {{ pv.available ? '' : '(未配置)' }}
            </option>
          </select>
        </label>
        <p class="tm-provider-status">
          状态：{{ currentProviderLabel }}
          <span v-if="currentProviderAvailable" class="tm-status-ok">可用</span>
          <span v-else class="tm-status-warn">待配置</span>
        </p>

        <!-- DeepSeek 配置 -->
        <section v-if="activeProviderId === 'deepseek'" class="tm-deepseek-config">
          <label>
            API Key
            <input
              v-model="deepseekSettings.apiKey"
              type="password"
              placeholder="sk-..."
              autocomplete="off"
            />
          </label>
          <label>
            Base URL
            <input
              v-model="deepseekSettings.baseUrl"
              type="text"
              placeholder="https://api.deepseek.com"
            />
          </label>
          <label>
            Model
            <input
              v-model="deepseekSettings.model"
              type="text"
              placeholder="deepseek-chat"
            />
          </label>
          <div class="tm-deepseek-actions">
            <button type="button" @click="saveProviderSettings">保存 Provider 配置</button>
            <button
              type="button"
              :disabled="testingConnection"
              @click="onTestConnection"
            >
              {{ testingConnection ? '测试中...' : '测试连接' }}
            </button>
          </div>
          <p v-if="testResult" :class="testResult.ok ? 'tm-test-ok' : 'tm-test-fail'" aria-live="polite">
            {{ testResult.message }}
          </p>
        </section>

        <p v-if="activeProviderId === 'mock'" class="tm-provider-note">
          MockProvider 始终可用，无需配置。AI 调用将返回预设模板内容。
        </p>

        <!-- 生成策略 -->
        <hr />
        <p class="tm-section-label">生成策略</p>
        <section class="tm-strategy-options">
          <label
            v-for="strategy in strategyOptions"
            :key="strategy.value"
            :class="{ selected: aiSettings.defaultStrategy === strategy.value }"
          >
            <input
              v-model="aiSettings.defaultStrategy"
              type="radio"
              :value="strategy.value"
            />
            <strong>{{ strategy.label }}</strong>
            <span>{{ strategy.description }}</span>
          </label>
        </section>
      </article>

      <article class="tm-settings-card">
        <header>
          <p>Editor</p>
          <h2>编辑器设置</h2>
        </header>
        <label>
          字体大小
          <input
            v-model.number="editorSettings.fontSize"
            type="range"
            min="13"
            max="22"
          />
          <strong>{{ editorSettings.fontSize }}px</strong>
        </label>
        <label class="tm-toggle-row">
          <input v-model="editorSettings.autoSave" type="checkbox" />
          <span>自动保存</span>
        </label>
        <label class="tm-toggle-row">
          <input v-model="editorSettings.autoVersion" type="checkbox" />
          <span>自动版本</span>
        </label>
      </article>

      <article class="tm-settings-card">
        <header>
          <p>Export</p>
          <h2>导出设置</h2>
        </header>
        <label>
          默认格式
          <select v-model="exportSettings.defaultFormat">
            <option
              v-for="format in exportFormatOptions"
              :key="format.value"
              :value="format.value"
            >
              {{ format.label }}
            </option>
          </select>
        </label>
        <label>
          导出路径
          <input v-model="exportSettings.exportPath" type="text" />
        </label>
        <label class="tm-toggle-row">
          <input v-model="exportSettings.syncBrainHubFiles" type="checkbox" />
          <span>同步 Brain Hub 文件库 Mock</span>
        </label>
      </article>

      <article class="tm-settings-card tm-adapter-card">
        <header>
          <p>Optional Adapter</p>
          <h2>Brain Hub Adapter 状态</h2>
        </header>
        <strong class="tm-adapter-status">{{ hubAdapterStatus }}</strong>
        <p>
          Brain Hub 不是 Text Master 的运行前置依赖。没有 Hub Context 时，应用继续使用
          LocalRuntime、本地 Mock AI 和本地导出。
        </p>
        <dl>
          <div v-for="row in adapterRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
      </article>

      <article class="tm-settings-card tm-storage-card">
        <header>
          <p>Storage</p>
          <h2>本地存储与备份</h2>
        </header>

        <p class="tm-provider-status">
          当前存储模式：<strong>LocalStorage</strong>
          <span class="tm-status-ok">默认</span>
        </p>
        <p class="tm-provider-note">
          当前使用浏览器 LocalStorage 持久化。后续支持 IndexedDB / SQLite / Local File。
          当前存储 {{ storageDataCount }} 条数据记录。
        </p>

        <div class="tm-deepseek-actions">
          <button type="button" @click="handleExportData">导出全部本地数据</button>
        </div>

        <hr />
        <p class="tm-section-label">导入备份数据</p>
        <label>
          粘贴备份 JSON
          <textarea
            v-model="importDataInput"
            rows="3"
            placeholder="粘贴之前导出的 text-master-backup-*.json 内容..."
            class="tm-import-textarea"
          ></textarea>
        </label>
        <div class="tm-deepseek-actions">
          <button type="button" @click="handleImportData">导入数据</button>
        </div>

        <hr />
        <p class="tm-section-label">危险操作</p>
        <div class="tm-deepseek-actions">
          <button type="button" class="tm-danger-btn" @click="handleResetAllData">清空所有本地数据</button>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.tm-settings-page {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: var(--tm-bg);
  color: var(--tm-text);
  padding: var(--tm-page-padding);
}

.tm-settings-nav,
.tm-settings-header,
.tm-settings-feedback,
.tm-settings-card {
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background: var(--tm-panel);
  box-shadow: var(--tm-shadow-card);
}

.tm-settings-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: var(--tm-page-max-width);
  margin: 0 auto 18px;
  padding: 10px;
}

.tm-settings-nav a,
.tm-settings-actions button {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(212, 212, 216, 0.18);
  border-radius: 6px;
  background: #27272a;
  color: #f4f4f5;
  padding: 0 14px;
  text-decoration: none;
  font-size: 14px;
}

.tm-settings-actions button.tm-button-primary {
  border-color: rgba(139, 140, 255, 0.62);
  background: var(--tm-accent-gradient);
  color: white;
  font-weight: 700;
}

.tm-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  max-width: var(--tm-page-max-width);
  margin: 10px auto 0;
  padding: 14px;
}

.tm-settings-header p,
.tm-settings-header span,
.tm-settings-card header p,
.tm-settings-card dt,
.tm-settings-feedback {
  color: #a1a1aa;
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.tm-settings-header h1 {
  margin: 4px 0;
  font-size: 26px;
  line-height: 1;
}

.tm-settings-header span {
  display: block;
  text-transform: none;
  font-size: 14px;
  line-height: 1.45;
}

.tm-settings-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.tm-settings-feedback,
.tm-error {
  max-width: var(--tm-page-max-width);
  margin: 10px auto 0;
  padding: 8px 12px;
  text-transform: none;
}

.tm-error {
  color: #fca5a5;
}

.tm-settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  max-width: var(--tm-page-max-width);
  margin: 10px auto 0;
  max-height: calc(100vh - var(--tm-nav-height) - 230px);
  overflow: auto;
}

.tm-settings-card {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 12px;
}

.tm-settings-card h2 {
  margin: 4px 0 0;
  font-size: 16px;
}

.tm-settings-card label {
  display: grid;
  gap: 8px;
  min-width: 0;
  color: #d4d4d8;
  font-size: 13px;
}

.tm-settings-card input[type='text'],
.tm-settings-card select {
  width: 100%;
  min-width: 0;
  border: 1px solid rgba(161, 161, 170, 0.18);
  border-radius: 6px;
  background: #09090b;
  color: #f4f4f5;
  padding: 11px 12px;
  font-size: 14px;
}

.tm-settings-card input[type='range'] {
  width: 100%;
}

.tm-runtime-card,
.tm-adapter-card {
  grid-row: span 2;
}

.tm-runtime-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.tm-runtime-switch span,
.tm-strategy-options label,
.tm-settings-card dl div {
  border: 1px solid rgba(161, 161, 170, 0.16);
  border-radius: 8px;
  background: #111113;
  padding: 8px;
}

.tm-runtime-switch span.active,
.tm-strategy-options label.selected {
  border-color: rgba(129, 140, 248, 0.5);
  background: #1f2130;
}

.tm-settings-card dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

.tm-settings-card dd {
  margin: 7px 0 0;
  color: #f4f4f5;
  word-break: break-word;
}

.tm-strategy-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.tm-strategy-options label {
  gap: 8px;
}

.tm-strategy-options span,
.tm-adapter-card p {
  color: #a1a1aa;
  font-size: 13px;
  line-height: 1.7;
}

.tm-toggle-row {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
}

.tm-toggle-row input {
  accent-color: #f4f4f5;
}

.tm-adapter-status {
  width: fit-content;
  border: 1px solid rgba(129, 140, 248, 0.54);
  border-radius: 999px;
  background: #1f2130;
  color: #c7d2fe;
  padding: 7px 12px;
}

@media (max-width: 980px) {
  .tm-settings-page {
    padding: 18px;
  }

  .tm-settings-grid,
  .tm-strategy-options {
    grid-template-columns: 1fr;
  }

  .tm-runtime-card,
  .tm-adapter-card {
    grid-row: auto;
  }
}

@media (max-height: 820px) and (min-width: 981px) {
  .tm-settings-page.tm-settings-page {
    padding-block: 10px !important;
  }

  .tm-settings-header {
    margin-top: 6px;
    padding: 10px;
  }

  .tm-settings-header h1 {
    font-size: 22px;
  }

  .tm-settings-header span,
  .tm-strategy-options span,
  .tm-adapter-card p {
    line-height: 1.25;
  }

  .tm-settings-feedback,
  .tm-error,
  .tm-settings-grid {
    margin-top: 6px;
  }

  .tm-settings-grid {
    max-height: calc(100vh - var(--tm-nav-height) - 250px);
  }

  .tm-settings-card {
    gap: 6px;
    padding: 10px;
  }

  .tm-settings-card input[type='text'],
  .tm-settings-card select {
    padding-block: 8px;
  }
}

@media (max-width: 680px) {
  .tm-settings-header {
    align-items: stretch;
    flex-direction: column;
  }

  .tm-settings-actions {
    justify-content: stretch;
  }
}

/* --- AI Provider 设置 --- */

.tm-ai-card {
  grid-row: span 2;
}

.tm-provider-status {
  font-size: 13px;
  color: #d4d4d8;
}

.tm-status-ok {
  display: inline-block;
  border: 1px solid rgba(52, 211, 153, 0.5);
  border-radius: 999px;
  background: rgba(52, 211, 153, 0.12);
  color: #6ee7b7;
  padding: 2px 10px;
  font-size: 12px;
  margin-left: 6px;
}

.tm-status-warn {
  display: inline-block;
  border: 1px solid rgba(251, 191, 36, 0.5);
  border-radius: 999px;
  background: rgba(251, 191, 36, 0.12);
  color: #fcd34d;
  padding: 2px 10px;
  font-size: 12px;
  margin-left: 6px;
}

.tm-deepseek-config {
  display: grid;
  gap: 8px;
  border: 1px solid rgba(139, 140, 255, 0.2);
  border-radius: 8px;
  background: rgba(139, 140, 255, 0.04);
  padding: 10px;
}

.tm-deepseek-config input[type='password'],
.tm-deepseek-config input[type='text'] {
  width: 100%;
  min-width: 0;
  border: 1px solid rgba(161, 161, 170, 0.18);
  border-radius: 6px;
  background: #09090b;
  color: #f4f4f5;
  padding: 10px 12px;
  font-size: 14px;
}

.tm-deepseek-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tm-deepseek-actions button {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(212, 212, 216, 0.18);
  border-radius: 6px;
  background: #27272a;
  color: #f4f4f5;
  padding: 0 14px;
  font-size: 13px;
  cursor: pointer;
}

.tm-deepseek-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tm-test-ok {
  color: #6ee7b7;
  font-size: 13px;
  padding: 4px 0;
}

.tm-test-fail {
  color: #fca5a5;
  font-size: 13px;
  padding: 4px 0;
}

.tm-provider-note {
  color: #a1a1aa;
  font-size: 13px;
  line-height: 1.6;
}

.tm-section-label {
  color: #a1a1aa;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 4px 0 0;
}

.tm-settings-card hr {
  border: none;
  border-top: 1px solid rgba(161, 161, 170, 0.1);
  margin: 4px 0;
}

/* --- 存储备份 --- */

.tm-storage-card {
  grid-row: span 2;
}

.tm-import-textarea {
  width: 100%;
  min-width: 0;
  min-height: 80px;
  border: 1px solid rgba(161, 161, 170, 0.18);
  border-radius: 6px;
  background: #09090b;
  color: #f4f4f5;
  padding: 10px 12px;
  font-size: 13px;
  font-family: monospace;
  resize: vertical;
}

.tm-danger-btn {
  border-color: rgba(239, 68, 68, 0.4) !important;
  background: rgba(239, 68, 68, 0.12) !important;
  color: #fca5a5 !important;
}
</style>
