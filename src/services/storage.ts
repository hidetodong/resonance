import type { AppData } from '../domain/types';
import { HttpAdapter } from './adapters/httpAdapter';

/** 可插拔存储适配器契约：实现一份即可换后端。 */
export interface StorageAdapter {
  load(): Promise<AppData>;
  save(data: AppData): Promise<void>;
}

/**
 * 选择存储适配器（唯一切换点）。当前所有环境共用 HttpAdapter（读写 /api/cards）：
 * - `pnpm dev`：Vite 中间件应答（本地 data/cards.json，免登录）。
 * - `vercel dev` / 线上：Vercel 函数应答（认证 + Neon Postgres，跨设备同步）。
 */
export function createStorage(): StorageAdapter {
  return new HttpAdapter();
}
