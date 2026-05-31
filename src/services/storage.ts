import type { AppData } from '../domain/types';
import { FileAdapter } from './adapters/fileAdapter';
import { LocalAdapter } from './adapters/localAdapter';

/** 可插拔存储适配器契约：实现一份即可换后端（本地文件 / localStorage / Supabase…）。 */
export interface StorageAdapter {
  load(): Promise<AppData>;
  save(data: AppData): Promise<void>;
}

/**
 * 按运行环境选择存储适配器（唯一切换点）：
 * - dev：FileAdapter，经 Vite 中间件读写本地 data/cards.json（人类可读文件）。
 * - 生产 / 静态构建（含 vite preview、Vercel）：LocalAdapter，浏览器 localStorage。
 *
 * 将来接入 Supabase：把下面替换为 `new SupabaseAdapter()` 即可（见 adapters/supabaseAdapter.ts）。
 */
export function createStorage(): StorageAdapter {
  return import.meta.env.DEV ? new FileAdapter() : new LocalAdapter();
}
