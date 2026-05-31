import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { localJsonStore } from './plugins/localJsonStore';

// 本地个人工具：Vue 3 + 本地 JSON 文件持久化（仅 dev 中间件）
export default defineConfig({
  plugins: [vue(), localJsonStore()],
});
