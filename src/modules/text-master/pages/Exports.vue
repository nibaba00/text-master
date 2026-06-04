<script setup lang="ts">
import { computed, ref } from 'vue';
import { textMasterNavigation, textMasterRoutePaths } from '../routes';

type ExportFormat = 'markdown' | 'txt' | 'json' | 'docx' | 'pdf';

const selectedFormat = ref<ExportFormat>('markdown');
const exportStatus = ref('导出控制台待命，工作台内可生成真实 Mock 导出版本。');

const formatOptions: Array<{
  value: ExportFormat;
  label: string;
  status: 'ready' | 'later';
  description: string;
}> = [
  {
    value: 'markdown',
    label: 'Markdown',
    status: 'ready',
    description: '适合 README、项目文档、长文交付。',
  },
  {
    value: 'txt',
    label: 'TXT',
    status: 'ready',
    description: '适合纯文本审阅和平台粘贴。',
  },
  {
    value: 'json',
    label: 'JSON',
    status: 'ready',
    description: '适合结构化备份和后续系统接入。',
  },
  {
    value: 'docx',
    label: 'DOCX',
    status: 'later',
    description: '后续接入文档渲染管线。',
  },
  {
    value: 'pdf',
    label: 'PDF',
    status: 'later',
    description: '后续接入排版和导出服务。',
  },
];

const readyFormats = computed(
  () => formatOptions.filter((format) => format.status === 'ready').length,
);

function selectFormat(format: ExportFormat): void {
  const option = formatOptions.find((item) => item.value === format);

  if (!option || option.status === 'later') {
    exportStatus.value = `${option?.label ?? '该格式'} 后续接入，当前不执行导出。`;
    return;
  }

  selectedFormat.value = format;
  exportStatus.value = `已选择 ${option.label}，请在项目工作台导出中心执行导出并保存版本。`;
}
</script>

<template>
  <main class="tm-export-page">
    <nav class="tm-export-nav" aria-label="Text Master navigation">
      <RouterLink
        v-for="item in textMasterNavigation"
        :key="item.path"
        :to="item.path"
      >
        {{ item.label }}
      </RouterLink>
    </nav>

    <header class="tm-export-header">
      <div>
        <p>Export Console</p>
        <h1>导出中心</h1>
        <span>独立导出入口。真实导出版本记录在项目工作台内完成。</span>
      </div>
      <RouterLink class="tm-button tm-button-primary" :to="textMasterRoutePaths.projectCenter">
        返回项目中心
      </RouterLink>
    </header>

    <section class="tm-export-summary" aria-label="Export summary">
      <article>
        <span>可用格式</span>
        <strong>{{ readyFormats }}</strong>
      </article>
      <article>
        <span>默认目标</span>
        <strong>Local</strong>
      </article>
      <article>
        <span>运行模式</span>
        <strong>Standalone</strong>
      </article>
    </section>

    <p class="tm-export-status" aria-live="polite">{{ exportStatus }}</p>

    <section class="tm-export-grid" aria-label="Export formats">
      <article
        v-for="format in formatOptions"
        :key="format.value"
        :class="[
          'tm-export-card',
          { selected: selectedFormat === format.value, disabled: format.status === 'later' },
        ]"
      >
        <header>
          <span>{{ format.status === 'ready' ? 'Ready' : 'Later' }}</span>
          <h2>{{ format.label }}</h2>
        </header>
        <p>{{ format.description }}</p>
        <button
          type="button"
          :disabled="format.status === 'later'"
          @click="selectFormat(format.value)"
        >
          {{ format.status === 'ready' ? '选择格式' : '后续接入' }}
        </button>
      </article>
    </section>
  </main>
</template>

<style scoped>
.tm-export-page {
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background: #050506;
  color: #f4f4f5;
  padding: 28px;
}

.tm-export-nav,
.tm-export-header,
.tm-export-summary,
.tm-export-status,
.tm-export-card {
  border: 1px solid rgba(148, 148, 160, 0.16);
  border-radius: 8px;
  background: rgba(24, 24, 27, 0.94);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
}

.tm-export-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 1180px;
  margin: 0 auto 18px;
  padding: 10px;
}

.tm-export-nav a,
.tm-button,
.tm-export-card button {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(148, 148, 160, 0.22);
  border-radius: 6px;
  background: #27272a;
  color: #f4f4f5;
  padding: 0 14px;
  text-decoration: none;
  font-size: 14px;
}

.tm-button-primary {
  border-color: rgba(129, 140, 248, 0.62);
  background: #2f3347;
  color: #eef2ff;
  font-weight: 700;
}

.tm-export-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px;
}

.tm-export-header p,
.tm-export-header span,
.tm-export-summary span,
.tm-export-card span,
.tm-export-status {
  color: #a1a1aa;
  font-size: 12px;
  letter-spacing: 0;
  text-transform: uppercase;
}

.tm-export-header h1 {
  margin: 6px 0;
  font-size: 34px;
  line-height: 1;
}

.tm-export-header div > span {
  display: block;
  text-transform: none;
  font-size: 14px;
  line-height: 1.7;
}

.tm-export-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  max-width: 1180px;
  margin: 18px auto 0;
  padding: 16px;
}

.tm-export-summary article {
  border-radius: 8px;
  background: #111113;
  padding: 14px;
}

.tm-export-summary strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
}

.tm-export-status {
  max-width: 1180px;
  margin: 18px auto 0;
  padding: 12px 14px;
  text-transform: none;
}

.tm-export-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  max-width: 1180px;
  margin: 18px auto 0;
}

.tm-export-card {
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 18px;
}

.tm-export-card.selected {
  border-color: rgba(129, 140, 248, 0.54);
  background: #1f2130;
}

.tm-export-card.disabled {
  opacity: 0.58;
}

.tm-export-card h2 {
  margin: 6px 0 0;
  font-size: 20px;
}

.tm-export-card p {
  min-height: 68px;
  margin: 0;
  color: #c4c4c8;
  font-size: 13px;
  line-height: 1.7;
}

.tm-export-card button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

@media (max-width: 1100px) {
  .tm-export-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .tm-export-page {
    padding: 18px;
  }

  .tm-export-header {
    align-items: stretch;
    flex-direction: column;
  }

  .tm-export-summary,
  .tm-export-grid {
    grid-template-columns: 1fr;
  }
}
</style>
