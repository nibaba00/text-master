import { createApp } from 'vue';
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router';
import App from './App.vue';
import { textMasterRoutes } from './modules/text-master/routes';
import './modules/text-master/styles/theme.css';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: textMasterRoutes as unknown as RouteRecordRaw[],
});

const app = createApp(App);
app.use(router);

router.isReady().then(() => {
  app.mount('#app');
});
