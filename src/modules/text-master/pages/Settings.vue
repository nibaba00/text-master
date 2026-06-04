<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { textMasterNavigation } from '../routes';
import { createTextMasterRuntime, type RuntimeMode } from '../runtime/TextMasterRuntime';
import { detectRuntimeMode } from '../runtime/runtimeDetection';

type AdapterStatus = '未连接' | '可用' | 'Mock';
type ExportFormat = 'markdown' | 'txt' | 'json';
type GenerationStrategy = 'faithful' | 'expand' | 'rebuild';

const detectedMode = ref<RuntimeMode>('local');
const activeRuntimeMode = ref<RuntimeMode>('local');
const settingsFeedback = ref('设置页已加载，当前配置仅保存在 Mock 本地状态。');
const loadError = ref('');

const aiSettings = reactive({
  defaultModel: 'Mock Text v0',
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
  {
    value: 'faithful',
    label: '忠实原文',
    description: '尽量保留原设定和原表达。',
  },
  {
    value: 'expand',
    label: '适度扩写',
    description: '默认策略，保留核心并补充结构细节。',
  },
  {
    value: 'rebuild',
    label: '大幅重构',
    description: '允许重排结构和表达方式。',
  },
];

const exportFormatOptions: Array<{ value: ExportFormat; label: string }> = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'txt', label: 'TXT' },
  { value: 'json', label: 'JSON' },
];

const hubAdapterStatus = computed<AdapterStatus>(() => {
  if (activeRuntimeMode.value === 'brain-hub') {
    return 'Mock';
  }

  if (detectedMode.value === 'brain-hub') {
    return '可用';
  }

  return exportSettings.syncBrainHubFiles ? 'Mock' : '未连接';
});

const runtimeRows = computed(() => [
  {
    label: '检测结果',
    value: detectedMode.value === 'brain-hub' ? 'Brain Hub Mode' : 'Local Mode',
  },
  {
    label: '当前 Runtime',
    value:
      activeRuntimeMode.value === 'brain-hub' ? 'Brain Hub Mode' : 'Local Mode',
  },
  {
    label: '存储策略',
    value:
      activeRuntimeMode.value === 'brain-hub'
        ? 'Hub adapter stub + Local fallback'
        : 'LocalRuntime / localStorage',
  },
]);

const adapterRows = computed(() => [
  {
    label: 'Adapter 状态',
    value: hubAdapterStatus.value,
  },
  {
    label: '文件库同步',
    value: exportSettings.syncBrainHubFiles ? 'Mock 开启' : '未开启',
  },
  {
    label: '运行前置',
    value: 'Brain Hub 非必选，Local Mode 可完整使用',
  },
]);

onMounted(async () => {
  try {
    detectedMode.value = detectRuntimeMode();
    const runtime = await createTextMasterRuntime();
    activeRuntimeMode.value = runtime.getRuntimeMode();
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : '无法读取 Runtime 设置';
  }
});

function saveSettingsMock(): void {
  settingsFeedback.value = [
    'Mock 设置已保存',
    `模型：${aiSettings.defaultModel}`,
    `策略：${aiSettings.defaultStrategy}`,
    `字号：${editorSettings.fontSize}px`,
    `导出：${exportSettings.defaultFormat}`,
  ].join(' / ');
}

function resetSettingsMock(): void {
  aiSettings.defaultModel = 'Mock Text v0';
  aiSettings.defaultStrategy = 'expand';
  editorSettings.fontSize = 15;
  editorSettings.autoSave = true;
  editorSettings.autoVersion = true;
  exportSettings.defaultFormat = 'markdown';
  exportSettings.exportPath = 'local://text-master/exports';
  exportSettings.syncBrainHubFiles = false;
  settingsFeedback.value = '已恢复 Mock 默认设置。';
}
</script>

<template>
  <main class="tm-settings-page">
    <nav class="tm-settings-nav" aria-label="Text Master navigation">
      <RouterLink
        v-for="item in textMasterNavigation"
        :key="item.path"
        :to="item.path"
      >
        {{ item.label }}
      </RouterLink>
    </nav>

    <header class="tm-settings-header">
      <div>
        <p>Settings</p>
        <h1>设置</h1>
        <span>Text Master 可独立运行；Brain Hub 只是可选启动与同步适配层。</span>
      </div>
      <div class="tm-settings-actions">
        <button type="button" @click="resetSettingsMock">恢复默认</button>
        <button type="button" class="tm-button-primary" @click="saveSettingsMock">
          保存 Mock 设置
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

      <article class="tm-settings-card">
        <header>
          <p>AI</p>
          <h2>AI 生成设置</h2>
        </header>
        <label>
          默认模型
          <select v-model="aiSettings.defaultModel">
            <option>Mock Text v0</option>
          </select>
        </label>
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
    </section>
  </main>
</template>

<style scoped>
.tm-settings-page {
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background: #050506;
  color: #f4f4f5;
  padding: 28px;
}

.tm-settings-nav,
.tm-settings-header,
.tm-settings-feedback,
.tm-settings-card {
  border: 1px solid rgba(161, 161, 170, 0.16);
  border-radius: 8px;
  background: rgba(24, 24, 27, 0.9);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
}

.tm-settings-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 1180px;
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
  border-color: rgba(129, 140, 248, 0.62);
  background: #2f3347;
  color: #eef2ff;
  font-weight: 700;
}

.tm-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px;
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
  margin: 6px 0;
  font-size: 36px;
  line-height: 1;
}

.tm-settings-header span {
  display: block;
  text-transform: none;
  font-size: 14px;
  line-height: 1.7;
}

.tm-settings-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.tm-settings-feedback,
.tm-error {
  max-width: 1180px;
  margin: 18px auto 0;
  padding: 12px 14px;
  text-transform: none;
}

.tm-error {
  color: #fca5a5;
}

.tm-settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  max-width: 1180px;
  margin: 18px auto 0;
}

.tm-settings-card {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 20px;
}

.tm-settings-card h2 {
  margin: 6px 0 0;
  font-size: 20px;
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
  padding: 12px;
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

@media (max-width: 680px) {
  .tm-settings-header {
    align-items: stretch;
    flex-direction: column;
  }

  .tm-settings-actions {
    justify-content: stretch;
  }
}
</style>
