import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const sharedAlias = decodeURIComponent(new URL('../../packages/shared/src/index.ts', import.meta.url).pathname).replace(
  /^\/([A-Za-z]:)/,
  '$1',
);

export default defineConfig({
  define: {
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  resolve: {
    alias: {
      '@text-master/shared': sharedAlias,
    },
  },
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4100',
        changeOrigin: true,
      },
    },
  },
});
