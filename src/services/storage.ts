import type { AppData } from '../domain/types';
import { FileAdapter } from './adapters/fileAdapter';
import { LocalAdapter } from './adapters/localAdapter';
import { SupabaseAdapter } from './adapters/supabaseAdapter';
import { isSupabaseConfigured } from './supabase';

/** 可插拔存储适配器契约：实现一份即可换后端（本地文件 / localStorage / Supabase）。 */
export interface StorageAdapter {
  load(): Promise<AppData>;
  save(data: AppData): Promise<void>;
}

/**
 * 选择存储适配器（唯一切换点）：
 * - 配置了 Supabase（env 注入 url + anon key）：SupabaseAdapter，登录后读写云端、跨设备同步。
 * - 否则 dev：FileAdapter，经 Vite 中间件读写本地 data/cards.json（人类可读文件）。
 * - 否则 生产 / 静态构建：LocalAdapter，浏览器 localStorage。
 */
export function createStorage(): StorageAdapter {
  if (isSupabaseConfigured()) return new SupabaseAdapter();
  return import.meta.env.DEV ? new FileAdapter() : new LocalAdapter();
}
