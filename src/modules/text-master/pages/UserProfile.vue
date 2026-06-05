<script setup lang="ts">
import { computed } from 'vue';
import TopNav from '../components/TopNav.vue';
import { mockDocuments } from '../mock/mockDocuments';
import { mockProjects } from '../mock/mockProjects';
import { mockVersions } from '../mock/mockVersions';

const userProfile = {
  displayName: 'AlexLin',
  role: '本地创作者 · Text Master 用户',
  localSpace: '1.2GB / 8.8GB',
};

const activeProject = computed(() => {
  return [...mockProjects].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )[0];
});

const totalProjects = computed(() => mockProjects.length);
const totalWords = computed(() =>
  mockProjects.reduce((total, project) => total + project.wordCount, 0),
);
const totalVersions = computed(() => mockVersions.length);
const totalDocuments = computed(() => mockDocuments.length);

const statRows = computed(() => [
  {
    label: '总项目',
    value: totalProjects.value.toLocaleString('zh-CN'),
  },
  {
    label: '总字数',
    value: totalWords.value.toLocaleString('zh-CN'),
  },
  {
    label: '总版本',
    value: totalVersions.value.toLocaleString('zh-CN'),
  },
  {
    label: '本地空间',
    value: userProfile.localSpace,
  },
]);

const preferenceRows = computed(() => [
  {
    label: '默认项目类型',
    value: '短剧项目',
  },
  {
    label: '默认生成策略',
    value: '适度扩写',
  },
  {
    label: '默认导出格式',
    value: 'Markdown + JSON',
  },
  {
    label: '运行模式',
    value: 'Local Mode',
  },
  {
    label: 'Brain Hub 同步',
    value: 'Ready / Optional',
  },
]);
</script>

<template>
  <main class="tm-profile-page" data-testid="text-master-user-profile">
    <TopNav />

    <header class="tm-profile-heading">
      <p>User Profile</p>
      <h1>用户资料</h1>
    </header>

    <section class="tm-profile-layout" aria-label="User profile overview">
      <article class="tm-profile-card tm-user-card">
        <header>
          <h2>用户信息</h2>
          <p>右上角用户资料按钮进入此页或弹窗</p>
        </header>

        <section class="tm-user-identity">
          <div class="tm-user-avatar-large" aria-hidden="true"></div>
          <h3>{{ userProfile.displayName }}</h3>
          <p>{{ userProfile.role }}</p>
        </section>

        <dl class="tm-user-stats">
          <div v-for="row in statRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
      </article>

      <article class="tm-profile-card tm-preference-card">
        <header>
          <h2>使用偏好与账户状态</h2>
          <p>用户信息低频，但需要清楚呈现</p>
        </header>

        <dl class="tm-preference-list">
          <div v-for="row in preferenceRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>

        <section class="tm-profile-status-grid" aria-label="Local workspace status">
          <article>
            <span>当前项目</span>
            <strong>{{ activeProject?.title ?? '暂无项目' }}</strong>
          </article>
          <article>
            <span>本地文档</span>
            <strong>{{ totalDocuments }}</strong>
          </article>
          <article>
            <span>账号状态</span>
            <strong>Local Ready</strong>
          </article>
        </section>
      </article>
    </section>
  </main>
</template>

<style scoped>
.tm-profile-page {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background:
    linear-gradient(rgba(98, 116, 160, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(98, 116, 160, 0.055) 1px, transparent 1px),
    var(--tm-bg);
  background-size: 80px 80px;
  color: var(--tm-text);
  padding: var(--tm-page-padding);
}

.tm-profile-heading,
.tm-profile-layout {
  width: min(100%, var(--tm-page-max-width));
  margin: 0 auto;
}

.tm-profile-heading {
  padding: 10px 10px 0;
}

.tm-profile-heading p,
.tm-profile-card header p,
.tm-user-stats dt,
.tm-preference-list dt,
.tm-profile-status-grid span {
  margin: 0;
  color: var(--tm-text-muted);
  font-size: 13px;
  letter-spacing: 0;
}

.tm-profile-heading h1 {
  margin: 4px 0 0;
  color: var(--tm-text);
  font-size: clamp(22px, 2.4vw, 28px);
  line-height: 1.05;
}

.tm-profile-layout {
  display: grid;
  grid-template-columns: minmax(280px, 390px) minmax(0, 1fr);
  gap: 12px;
  padding: 10px 10px 0;
}

.tm-profile-card {
  min-width: 0;
  border: 1px solid var(--tm-border-strong);
  border-radius: var(--tm-radius-panel);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent),
    rgba(13, 16, 24, 0.94);
  background-color: var(--tm-panel-solid);
  box-shadow: var(--tm-shadow-card);
}

.tm-profile-card header {
  padding: 12px 14px 0;
}

.tm-profile-card h2 {
  margin: 0 0 6px;
  font-size: 18px;
  line-height: 1.2;
}

.tm-user-card {
  display: grid;
  grid-template-rows: auto auto 1fr;
  min-height: 730px;
}

.tm-user-identity {
  display: grid;
  justify-items: center;
  padding: 20px 28px 26px;
  text-align: center;
}

.tm-user-avatar-large {
  width: 140px;
  aspect-ratio: 1;
  border: 1px solid rgba(139, 140, 255, 0.42);
  border-radius: var(--tm-radius-pill);
  background:
    radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.34), transparent 24%),
    #d4c9bc;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.tm-user-identity h3 {
  margin: 24px 0 6px;
  font-size: 30px;
  line-height: 1;
}

.tm-user-identity p {
  margin: 0;
  color: var(--tm-text-soft);
  font-size: 16px;
}

.tm-user-stats {
  display: grid;
  align-content: start;
  gap: 18px;
  margin: 0;
  padding: 20px 38px 44px;
}

.tm-user-stats div,
.tm-preference-list div,
.tm-profile-status-grid article {
  display: grid;
  min-width: 0;
  border: 1px solid var(--tm-border-strong);
  border-radius: 12px;
  background: rgba(21, 25, 37, 0.9);
  background-color: var(--tm-card);
}

.tm-user-stats div {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: 40px;
  padding: 0 14px;
}

.tm-user-stats dd,
.tm-preference-list dd {
  margin: 0;
  color: var(--tm-text);
  font-weight: 800;
}

.tm-preference-card {
  display: grid;
  grid-template-rows: auto auto auto;
  min-height: 730px;
}

.tm-preference-list {
  display: grid;
  gap: 20px;
  margin: 0;
  padding: 28px 38px 0;
}

.tm-preference-list div {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: 50px;
  padding: 0 16px;
}

.tm-preference-list dt {
  color: var(--tm-text-soft);
  font-size: 18px;
}

.tm-preference-list dd {
  font-size: 19px;
}

.tm-profile-status-grid {
  display: grid;
  grid-template-columns: 1.3fr 0.7fr 0.8fr;
  align-self: start;
  gap: 10px;
  padding: 12px 16px 16px;
}

.tm-profile-status-grid article {
  gap: 8px;
  padding: 10px;
}

.tm-profile-status-grid strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1020px) {
  .tm-profile-layout {
    grid-template-columns: 1fr;
    padding-inline: 0;
  }

  .tm-profile-heading {
    padding-inline: 0;
  }

  .tm-user-card,
  .tm-preference-card {
    min-height: auto;
  }
}

@media (max-height: 820px) and (min-width: 1021px) {
  .tm-profile-page.tm-profile-page {
    padding-block: 10px !important;
  }

  .tm-profile-heading {
    padding-top: 6px;
  }

  .tm-profile-heading h1 {
    font-size: 22px;
  }

  .tm-profile-layout {
    gap: 10px;
    padding-top: 8px;
  }

  .tm-user-card,
  .tm-preference-card {
    min-height: 0;
  }

  .tm-profile-card header {
    padding: 10px 12px 0;
  }

  .tm-profile-card h2 {
    font-size: 16px;
  }

  .tm-user-identity {
    padding: 12px 20px 14px;
  }

  .tm-user-avatar-large {
    width: 96px;
  }

  .tm-user-identity h3 {
    margin-top: 12px;
    font-size: 24px;
  }

  .tm-user-identity p {
    font-size: 13px;
  }

  .tm-user-stats {
    gap: 8px;
    padding: 10px 20px 14px;
  }

  .tm-user-stats div {
    min-height: 34px;
  }

  .tm-preference-list {
    gap: 8px;
    padding: 12px 20px 0;
  }

  .tm-preference-list div {
    min-height: 38px;
  }

  .tm-preference-list dt,
  .tm-preference-list dd {
    font-size: 14px;
  }

  .tm-profile-status-grid {
    gap: 8px;
    padding: 10px 12px 12px;
  }

  .tm-profile-status-grid article {
    gap: 5px;
    padding: 8px;
  }
}

@media (max-width: 680px) {
  .tm-profile-page {
    padding: 18px;
  }

  .tm-user-stats,
  .tm-preference-list,
  .tm-profile-status-grid {
    padding-inline: 18px;
  }

  .tm-user-stats div,
  .tm-preference-list div,
  .tm-profile-status-grid {
    grid-template-columns: 1fr;
  }

  .tm-preference-list div {
    gap: 8px;
    padding-block: 16px;
  }
}
</style>
