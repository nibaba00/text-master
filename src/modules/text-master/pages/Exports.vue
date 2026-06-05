<script setup lang="ts">
import { computed, ref } from 'vue';
import TopNav from '../components/TopNav.vue';
import { createTextMasterRuntime } from '../runtime/TextMasterRuntime';
import type { ExportFormat as RuntimeExportFormat } from '../types/export';

type ExportFormat =
  | 'markdown'
  | 'txt'
  | 'json'
  | 'text-master-json'
  | 'project-package-json'
  | 'media-master-json'
  | 'novel-master-json'
  | 'docx'
  | 'pdf';

const selectedFormat = ref<ExportFormat>('markdown');
const exportStatus = ref('导出中心待命，确认前只生成预览。');
const isExporting = ref(false);

const contentItems = ['项目设定', '世界观', '角色设定', '总纲', '分集脚本', '正文', '审核报告'];
const selectedContentItems = ref([...contentItems]);

const formatOptions: Array<{
  value: ExportFormat;
  label: string;
  status: 'ready' | 'later';
  description: string;
}> = [
  { value: 'markdown', label: 'Markdown', status: 'ready', description: '适合交付与版本留档' },
  { value: 'txt', label: 'TXT', status: 'ready', description: '适合纯文本审阅' },
  { value: 'json', label: 'JSON', status: 'ready', description: '适合结构化备份' },
  { value: 'text-master-json', label: 'Text Master JSON', status: 'ready', description: '完整项目数据 JSON' },
  { value: 'project-package-json', label: '项目包 JSON', status: 'ready', description: '含导出记录的项目包' },
  { value: 'media-master-json', label: 'Media Master JSON', status: 'ready', description: '媒体链路结构 JSON' },
  { value: 'novel-master-json', label: 'Novel Master JSON', status: 'ready', description: '小说链路结构 JSON' },
  { value: 'docx', label: 'DOCX', status: 'later', description: '后续接入' },
  { value: 'pdf', label: 'PDF', status: 'later', description: '后续接入' },
];

function selectFormat(format: ExportFormat): void {
  const option = formatOptions.find((item) => item.value === format);

  if (!option || option.status === 'later') {
    exportStatus.value = `${option?.label ?? '该格式'} 后续接入，当前不执行导出。`;
    return;
  }

  selectedFormat.value = format;
  exportStatus.value = `已选择 ${option.label}，请确认导出内容和预览。`;
}

const exportFileName = computed(() => {
  const extMap: Record<ExportFormat, string> = {
    markdown: 'md',
    txt: 'txt',
    json: 'json',
    'text-master-json': 'json',
    'project-package-json': 'json',
    'media-master-json': 'json',
    'novel-master-json': 'json',
    docx: 'docx',
    pdf: 'pdf',
  };
  const extension = extMap[selectedFormat.value] ?? selectedFormat.value;
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');

  return `TextMaster_export_${stamp}.${extension}`;
});

async function confirmExport(): Promise<void> {
  const option = formatOptions.find((item) => item.value === selectedFormat.value);
  if (!option || option.status === 'later') {
    exportStatus.value = `${option?.label ?? '该格式'} 后续接入，当前不执行导出。`;
    return;
  }

  isExporting.value = true;
  exportStatus.value = '正在生成导出文件和导出记录。';
  try {
    const runtime = await createTextMasterRuntime();
    const [project] = await runtime.listProjects();
    if (!project) {
      throw new Error('没有可导出的项目。');
    }

    const result = await runtime.exportProject({
      projectId: project.id,
      format: selectedFormat.value as RuntimeExportFormat,
      fileName: exportFileName.value,
      contentScope: selectedContentItems.value,
    });
    downloadExportFile(result.fileName, result.content, selectedFormat.value);
    exportStatus.value = `已导出 ${result.fileName}，并写入 ExportRecord 与 export version。`;
  } catch (error) {
    exportStatus.value = error instanceof Error ? error.message : '导出失败。';
  } finally {
    isExporting.value = false;
  }
}

function downloadExportFile(
  fileName: string,
  content: string,
  format: ExportFormat,
): void {
  if (format === 'docx' || format === 'pdf' || typeof Blob === 'undefined') {
    return;
  }

  const mimeTypes: Record<Exclude<ExportFormat, 'docx' | 'pdf'>, string> = {
    markdown: 'text/markdown;charset=utf-8',
    txt: 'text/plain;charset=utf-8',
    json: 'application/json;charset=utf-8',
    'text-master-json': 'application/json;charset=utf-8',
    'project-package-json': 'application/json;charset=utf-8',
    'media-master-json': 'application/json;charset=utf-8',
    'novel-master-json': 'application/json;charset=utf-8',
  };
  const blob = new Blob([content], { type: mimeTypes[format] });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <main class="tm-export-page" data-testid="text-master-exports">
    <TopNav />

    <section class="tm-export-console" aria-label="Export console">
      <aside class="tm-export-card tm-export-content">
        <header>
          <p>Export Content</p>
          <h1>导出中心</h1>
          <span>低频高风险操作，先预览再确认。</span>
        </header>

        <label v-for="item in contentItems" :key="item">
          <input v-model="selectedContentItems" type="checkbox" :value="item" />
          <span>{{ item }}</span>
        </label>
      </aside>

      <article class="tm-export-card tm-export-preview">
        <header>
          <p>Preview</p>
          <h2>导出预览</h2>
        </header>

        <dl>
          <div>
            <dt>文件名</dt>
            <dd>{{ exportFileName }}</dd>
          </div>
          <div>
            <dt>格式</dt>
            <dd>{{ selectedFormat }}</dd>
          </div>
          <div>
            <dt>内容</dt>
            <dd>{{ selectedContentItems.join(' / ') }}</dd>
          </div>
        </dl>

        <pre># 便利店夜班

## 项目设定
类型：短剧项目
状态：审核中

## 正文
雨夜的便利店灯牌闪了两下，订单从收银机里弹出。

## 审核报告
角色语气需保持一致，修复后再导出。</pre>
      </article>

      <aside class="tm-export-card tm-export-settings">
        <header>
          <p>Settings</p>
          <h2>导出设置</h2>
        </header>

        <button
          v-for="format in formatOptions"
          :key="format.value"
          type="button"
          :class="{ selected: selectedFormat === format.value, disabled: format.status === 'later' }"
          :disabled="format.status === 'later'"
          @click="selectFormat(format.value)"
        >
          <strong>{{ format.label }}</strong>
          <span>{{ format.description }}</span>
        </button>

        <p class="tm-export-status" aria-live="polite">{{ exportStatus }}</p>
        <button
          class="tm-button tm-button-primary"
          type="button"
          :disabled="isExporting"
          @click="confirmExport"
        >
          {{ isExporting ? '导出中...' : '确认导出' }}
        </button>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.tm-export-page {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: var(--tm-bg);
  color: var(--tm-text);
  padding: var(--tm-page-padding);
}

.tm-export-console {
  display: grid;
  grid-template-columns: minmax(220px, 0.72fr) minmax(0, 1.25fr) minmax(230px, 0.68fr);
  gap: 12px;
  width: min(100%, var(--tm-page-max-width));
  height: calc(100vh - var(--tm-nav-height) - 48px);
  min-height: 0;
  margin: 10px auto 0;
}

.tm-export-card {
  display: grid;
  min-width: 0;
  min-height: 0;
  align-content: start;
  gap: 10px;
  overflow: hidden;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-card);
  background: var(--tm-panel);
  box-shadow: var(--tm-shadow-card);
  padding: 14px;
}

.tm-export-card header p,
.tm-export-card header span,
.tm-export-card dt,
.tm-export-card button span,
.tm-export-status {
  margin: 0;
  color: var(--tm-text-muted);
  font-size: 12px;
}

.tm-export-card h1,
.tm-export-card h2 {
  margin: 4px 0 0;
  line-height: 1.08;
}

.tm-export-card h1 {
  font-size: 24px;
}

.tm-export-card h2 {
  font-size: 20px;
}

.tm-export-content label {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 38px;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card-muted);
  padding: 0 10px;
}

.tm-export-preview {
  grid-template-rows: auto auto minmax(0, 1fr);
}

.tm-export-preview dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.tm-export-preview dl div,
.tm-export-settings button {
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card-muted);
  padding: 10px;
}

.tm-export-preview dd {
  margin: 4px 0 0;
  color: var(--tm-text-soft);
  font-size: 13px;
  line-height: 1.45;
}

.tm-export-preview pre {
  min-height: 0;
  overflow: auto;
  margin: 0;
  border-radius: var(--tm-radius-control);
  background: #090d16;
  color: var(--tm-text-soft);
  padding: 14px;
  white-space: pre-wrap;
  line-height: 1.55;
}

.tm-export-settings button {
  display: grid;
  gap: 4px;
  width: 100%;
  color: var(--tm-text);
  text-align: left;
}

.tm-export-settings button.selected {
  border-color: rgba(48, 103, 255, 0.6);
  background: rgba(48, 103, 255, 0.14);
}

.tm-export-settings button.disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.tm-export-status {
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card-muted);
  padding: 10px;
}

.tm-button {
  min-height: var(--tm-button-height);
  justify-content: center;
}

.tm-button-primary {
  border-color: rgba(132, 136, 255, 0.65);
  background: var(--tm-accent-gradient);
  color: white;
  font-weight: 800;
}

@media (max-width: 980px) {
  .tm-export-page {
    overflow: auto;
  }

  .tm-export-console {
    height: auto;
    grid-template-columns: 1fr;
  }
}
</style>
