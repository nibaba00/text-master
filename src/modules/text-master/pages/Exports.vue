<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TopNav from '../components/TopNav.vue';
import {
  createProjectExport,
  listProjectExports,
  type BackendExportFormat,
  type BackendExportRecord,
} from '../../../api/exports';
import { listProjects } from '../../../api/projects';
import type { TextProject } from '@text-master/shared';
import { getTextMasterProjectPath } from '../routes';

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

const route = useRoute();
const router = useRouter();

const selectedFormat = ref<ExportFormat>('markdown');
const selectedProjectId = ref('');
const exportStatus = ref('导出中心等待命令，先选择项目再确认格式。');
const isExporting = ref(false);
const loadError = ref('');
const isLoading = ref(false);
const projects = ref<TextProject[]>([]);
const exportRecords = ref<BackendExportRecord[]>([]);

const contentItems = ['项目设定', '世界观', '角色设定', '总纲', '分集脚本', '正文', '审核报告'];
const selectedContentItems = ref([...contentItems]);

const formatOptions: Array<{
  value: ExportFormat;
  label: string;
  status: 'ready' | 'later';
  description: string;
}> = [
  { value: 'markdown', label: 'Markdown', status: 'ready', description: '适合交付与版本留档。' },
  { value: 'txt', label: 'TXT', status: 'ready', description: '适合纯文本审阅。' },
  { value: 'json', label: 'JSON', status: 'ready', description: '适合结构化备份。' },
  { value: 'text-master-json', label: 'Text Master JSON', status: 'later', description: '后端暂未提供。' },
  { value: 'project-package-json', label: '项目包 JSON', status: 'later', description: '后端暂未提供。' },
  { value: 'media-master-json', label: 'Media Master JSON', status: 'later', description: '后端暂未提供。' },
  { value: 'novel-master-json', label: 'Novel Master JSON', status: 'later', description: '后续接入。' },
  { value: 'docx', label: 'DOCX', status: 'later', description: '后续接入。' },
  { value: 'pdf', label: 'PDF', status: 'later', description: '后续接入。' },
];

const selectedProject = computed(() => projects.value.find((project) => project.id === selectedProjectId.value) ?? null);

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
  const title = selectedProject.value?.title ?? 'text-master-export';
  const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_') || 'text-master-export';
  const extension = extMap[selectedFormat.value] ?? selectedFormat.value;
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');

  return `${safeTitle}_${stamp}.${extension}`;
});

const previewText = computed(() => {
  const project = selectedProject.value;
  if (!project) {
    return '暂无可预览项目。';
  }

  const checklist = selectedContentItems.value.map((item) => `- ${item}`).join('\n');

  return [
    `# ${project.title}`,
    '',
    '## 项目设定',
    `类型：${project.type}`,
    `状态：${project.status}`,
    `字数：${project.wordCount}`,
    `进度：${project.progress}%`,
    '',
    '## 导出内容',
    checklist,
    '',
    '## 说明',
    project.summary || '暂无项目摘要。',
  ].join('\n');
});

const recentExportRecords = computed(() => exportRecords.value.slice(0, 6));

function selectFormat(format: ExportFormat): void {
  const option = formatOptions.find((item) => item.value === format);

  if (!option || option.status === 'later') {
    exportStatus.value = `${option?.label ?? '该格式'} 后续接入，当前不执行导出。`;
    return;
  }

  selectedFormat.value = format;
  exportStatus.value = `已选择 ${option.label}，请确认导出内容和预览。`;
}

async function loadProjectsAndExports(): Promise<void> {
  isLoading.value = true;
  loadError.value = '';

  try {
    projects.value = await listProjects();

    const queryProjectId = typeof route.query.projectId === 'string' ? route.query.projectId : '';
    const fallbackProjectId = projects.value[0]?.id ?? '';
    selectedProjectId.value = projects.value.some((project) => project.id === queryProjectId)
      ? queryProjectId
      : fallbackProjectId;

    await loadExportRecords();
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '无法加载导出中心数据';
  } finally {
    isLoading.value = false;
  }
}

async function loadExportRecords(): Promise<void> {
  if (!selectedProjectId.value) {
    exportRecords.value = [];
    return;
  }

  exportRecords.value = await listProjectExports(selectedProjectId.value);
}

async function confirmExport(): Promise<void> {
  const option = formatOptions.find((item) => item.value === selectedFormat.value);
  if (!option || option.status === 'later') {
    exportStatus.value = `${option?.label ?? '该格式'} 后续接入，当前不执行导出。`;
    return;
  }

  if (!selectedProjectId.value) {
    exportStatus.value = '没有可导出的项目。';
    return;
  }

  isExporting.value = true;
  exportStatus.value = '正在生成导出文件和后端记录。';

  try {
    const record = await createProjectExport(selectedProjectId.value, {
      format: selectedFormat.value as BackendExportFormat,
    });

    const response = await fetch(record.downloadUrl);
    if (!response.ok) {
      throw new Error(`导出文件下载失败，状态码 ${response.status}`);
    }

    const content = await response.text();
    downloadExportFile(record.fileName, content, selectedFormat.value);
    await loadExportRecords();
    exportStatus.value = `已导出 ${record.fileName}，并写入后端导出记录。`;
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

function openProject(projectId: string): void {
  void router.push({ path: getTextMasterProjectPath(projectId) });
}

onMounted(() => {
  void loadProjectsAndExports();
});

watch(
  () => selectedProjectId.value,
  () => {
    void loadExportRecords();
  },
);
</script>

<template>
  <main class="tm-export-page" data-testid="text-master-exports">
    <TopNav />

    <section class="tm-export-console" aria-label="Export console">
      <aside class="tm-export-card tm-export-content">
        <header>
          <p>Project</p>
          <h1>导出中心</h1>
          <span>先选项目，再确认格式。</span>
        </header>

        <label>
          当前项目
          <select v-model="selectedProjectId" @change="loadExportRecords">
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.title }}
            </option>
          </select>
        </label>

        <div v-if="selectedProject" class="tm-export-project-meta">
          <div>
            <span>类型</span>
            <strong>{{ selectedProject.type }}</strong>
          </div>
          <div>
            <span>状态</span>
            <strong>{{ selectedProject.status }}</strong>
          </div>
          <div>
            <span>字数</span>
            <strong>{{ selectedProject.wordCount.toLocaleString() }}</strong>
          </div>
        </div>

        <button type="button" class="tm-secondary-btn" @click="openProject(selectedProjectId)" :disabled="!selectedProjectId">
          打开项目
        </button>

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

        <pre>{{ previewText }}</pre>

        <section class="tm-export-history">
          <header>
            <p>History</p>
            <h3>导出记录</h3>
          </header>

          <div v-if="recentExportRecords.length === 0" class="tm-export-empty">
            暂无导出记录。
          </div>

          <ul v-else>
            <li v-for="record in recentExportRecords" :key="record.id">
              <strong>{{ record.fileName }}</strong>
              <span>{{ record.format }} / {{ record.createdAt }}</span>
            </li>
          </ul>
        </section>
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
        <p v-if="loadError" class="tm-export-error">{{ loadError }}</p>
        <p v-if="isLoading" class="tm-export-status">正在加载项目和导出记录。</p>

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
  grid-template-columns: minmax(240px, 0.72fr) minmax(0, 1.25fr) minmax(250px, 0.68fr);
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
.tm-export-status,
.tm-export-empty {
  margin: 0;
  color: var(--tm-text-muted);
  font-size: 12px;
}

.tm-export-card h1,
.tm-export-card h2,
.tm-export-card h3 {
  margin: 4px 0 0;
  line-height: 1.08;
}

.tm-export-card h1 {
  font-size: 24px;
}

.tm-export-card h2 {
  font-size: 20px;
}

.tm-export-card h3 {
  font-size: 14px;
}

.tm-export-content label {
  display: grid;
  gap: 8px;
  min-height: 38px;
}

.tm-export-content select,
.tm-export-content input[type='checkbox'] {
  accent-color: #8b8cff;
}

.tm-export-content select {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: #111827;
  color: var(--tm-text);
  padding: 10px 12px;
}

.tm-export-project-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.tm-export-project-meta div,
.tm-export-history li {
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card-muted);
  padding: 10px;
}

.tm-export-project-meta span,
.tm-export-history span {
  display: block;
  color: var(--tm-text-muted);
  font-size: 11px;
}

.tm-export-project-meta strong,
.tm-export-history strong {
  display: block;
  margin-top: 4px;
  word-break: break-word;
}

.tm-secondary-btn {
  min-height: var(--tm-button-height);
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card-muted);
  color: var(--tm-text);
}

.tm-export-preview {
  grid-template-rows: auto auto minmax(0, 1fr) auto;
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
  word-break: break-word;
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

.tm-export-history {
  display: grid;
  gap: 8px;
  border-top: 1px solid var(--tm-border);
  padding-top: 10px;
}

.tm-export-history ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
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

.tm-export-status,
.tm-export-error {
  border: 1px solid var(--tm-border);
  border-radius: var(--tm-radius-control);
  background: var(--tm-card-muted);
  padding: 10px;
}

.tm-export-error {
  color: #fca5a5;
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

  .tm-export-console,
  .tm-export-preview dl,
  .tm-export-project-meta {
    grid-template-columns: 1fr;
  }

  .tm-export-console {
    height: auto;
  }
}
</style>
